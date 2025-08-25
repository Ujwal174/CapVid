from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import threading
import tempfile
import shutil
import time
from datetime import datetime, timedelta
from helpers import generate_srt, overlay_subtitles
import whisper

app = Flask(__name__)
CORS(app, origins=[
    "https://capvid.app",
    "https://www.capvid.app",
    "http://localhost:3000",  # for local development
    "https://localhost:3000"
])

# Use system temporary directory with size limit
TEMP_STORAGE_LIMIT = 250 * 1024 * 1024  # 250MB in bytes
TEMP_BASE_DIR = tempfile.mkdtemp(prefix='capvid_')
UPLOAD_FOLDER = os.path.join(TEMP_BASE_DIR, 'uploads')
PROCESSED_FOLDER = os.path.join(TEMP_BASE_DIR, 'processed')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

job_status = {}
file_timestamps = {}  # Track when files were created

def get_directory_size(directory):
    """Calculate total size of all files in directory"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.exists(filepath):
                total_size += os.path.getsize(filepath)
    return total_size

def cleanup_old_files():
    """Remove files older than 1 hour or when storage limit is exceeded"""
    current_time = datetime.now()
    cutoff_time = current_time - timedelta(hours=1)
    
    # Get current storage usage
    total_size = get_directory_size(TEMP_BASE_DIR)
    
    files_to_remove = []
    
    # Collect files to remove (older than 1 hour)
    for job_id, timestamp in list(file_timestamps.items()):
        if timestamp < cutoff_time:
            files_to_remove.append(job_id)
    
    # If still over limit, remove oldest files first
    if total_size > TEMP_STORAGE_LIMIT:
        sorted_jobs = sorted(file_timestamps.items(), key=lambda x: x[1])
        for job_id, _ in sorted_jobs:
            if job_id not in files_to_remove:
                files_to_remove.append(job_id)
                # Check if we're under limit after adding this file
                if get_directory_size(TEMP_BASE_DIR) < TEMP_STORAGE_LIMIT * 0.8:  # 80% threshold
                    break
    
    # Remove identified files
    for job_id in files_to_remove:
        cleanup_job_files(job_id)

def cleanup_job_files(job_id):
    """Remove all files associated with a job"""
    try:
        # Remove from status tracking
        if job_id in job_status:
            del job_status[job_id]
        if job_id in file_timestamps:
            del file_timestamps[job_id]
        
        # Remove actual files
        for folder in [UPLOAD_FOLDER, PROCESSED_FOLDER]:
            for filename in os.listdir(folder):
                if filename.startswith(job_id):
                    filepath = os.path.join(folder, filename)
                    try:
                        os.remove(filepath)
                        print(f"Removed file: {filepath}")
                    except Exception as e:
                        print(f"Failed to remove {filepath}: {e}")
    except Exception as e:
        print(f"Error cleaning up job {job_id}: {e}")

def periodic_cleanup():
    """Run cleanup every 10 minutes"""
    while True:
        time.sleep(600)  # 10 minutes
        cleanup_old_files()

# Start cleanup thread
cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
cleanup_thread.start()

def process_video_task(job_id, filepath, filename):
    try:
        print(f"Starting video processing for job {job_id}")
        job_status[job_id] = {'status': 'transcribing', 'filename': filename}

        # Use the small Whisper model for better CPU usage and deployment compatibility
        # Falls back to base if small fails due to memory constraints
        try:
            model = whisper.load_model("small")
            print(f"Using Whisper small model for job {job_id}")
        except Exception as model_error:
            print(f"Failed to load small model, falling back to base: {model_error}")
            model = whisper.load_model("base")
        
        # Enhanced transcription with better accuracy settings
        result = model.transcribe(
            filepath,
            language=None,  # Auto-detect language
            task="transcribe",  # Can be "transcribe" or "translate"
            verbose=False,
            word_timestamps=True,  # Get word-level timestamps for better subtitle sync
            temperature=0.0,  # Use deterministic decoding for consistency
            compression_ratio_threshold=2.4,
            logprob_threshold=-1.0,
            no_speech_threshold=0.6
        )

        job_status[job_id] = {'status': 'generating_captions', 'filename': filename}
        
        srt_path = os.path.join(PROCESSED_FOLDER, f"{job_id}_captions.srt")
        
        # Create output video filename with subtitles
        name, ext = os.path.splitext(filename)
        output_video_filename = f"{job_id}_with_subtitles{ext}"
        output_video_path = os.path.join(PROCESSED_FOLDER, output_video_filename)

        generate_srt(result["segments"], srt_path)
        
        job_status[job_id] = {'status': 'embedding_subtitles', 'filename': filename}
        
        try:
            overlay_subtitles(filepath, srt_path, output_video_path)
            
            if os.path.exists(output_video_path):
                print(f"Video processing completed successfully for job {job_id}")
                job_status[job_id] = {
                    'status': 'completed',
                    'filename': filename,
                    'download_url': f"/download/{output_video_filename}",
                    'srt_url': f"/download_srt/{job_id}_captions.srt"
                }
                # Remove original upload file to save space AFTER successful processing
                try:
                    os.remove(filepath)
                    print(f"Removed original upload file: {filepath}")
                except Exception as e:
                    print(f"Could not remove upload file: {e}")
            else:
                job_status[job_id] = {
                    'status': 'completed_srt_only',
                    'filename': filename,
                    'error': 'Output video file was not created, but SRT file is available',
                    'srt_url': f"/download_srt/{job_id}_captions.srt"
                }
        except Exception as subtitle_error:
            print(f"Failed to embed subtitles for job {job_id}: {str(subtitle_error)}")
            job_status[job_id] = {
                'status': 'completed_srt_only',
                'filename': filename,
                'error': f'Failed to embed subtitles: {str(subtitle_error)}',
                'srt_url': f"/download_srt/{job_id}_captions.srt"
            }
            
    except Exception as e:
        print(f"Video processing failed for job {job_id}: {str(e)}")
        job_status[job_id] = {
            'status': 'failed',
            'filename': filename,
            'error': str(e)
        }

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    if video.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    # Check file size (limit to 100MB per file)
    if request.content_length > 100 * 1024 * 1024:
        return jsonify({'error': 'File too large. Maximum size is 100MB per file.'}), 400

    # Check available storage space
    current_storage = get_directory_size(TEMP_BASE_DIR)
    if current_storage + request.content_length > TEMP_STORAGE_LIMIT:
        # Try cleanup first
        cleanup_old_files()
        current_storage = get_directory_size(TEMP_BASE_DIR)
        
        if current_storage + request.content_length > TEMP_STORAGE_LIMIT:
            return jsonify({'error': 'Temporary storage full. Please try again in a few minutes.'}), 507

    job_id = str(uuid.uuid4())
    filename = f"{job_id}_{video.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        video.save(filepath)
        file_timestamps[job_id] = datetime.now()
        
        job_status[job_id] = {'status': 'uploaded', 'filename': video.filename}
        thread = threading.Thread(target=process_video_task, args=(job_id, filepath, video.filename))
        thread.start()

        return jsonify({'job_id': job_id}), 202
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    if job_id not in job_status:
        return jsonify({'error': 'Job not found or expired'}), 404
    return jsonify(job_status[job_id])

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    if not os.path.exists(path):
        return jsonify({'error': 'File not found or expired'}), 404
    
    # Extract job_id from filename
    job_id = filename.split('_')[0]
    
    # Get original filename from job status
    original_filename = "video"  # default fallback
    if job_id in job_status and 'filename' in job_status[job_id]:
        original_filename = job_status[job_id]['filename']
        # Remove extension from original filename
        original_name_without_ext = os.path.splitext(original_filename)[0]
    else:
        original_name_without_ext = "video"
    
    # Generate CapVid filename with original filename
    original_extension = filename.split('.')[-1]
    capvid_filename = f"CapVid-{original_name_without_ext}.{original_extension}"
    
    def cleanup_after_download():
        # Schedule cleanup after download
        time.sleep(2)  # Give time for download to complete
        cleanup_job_files(job_id)
    
    # Start cleanup in background
    threading.Thread(target=cleanup_after_download, daemon=True).start()
    
    response = send_from_directory(
        app.config['PROCESSED_FOLDER'], 
        filename, 
        as_attachment=True,
        download_name=capvid_filename
    )
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    return response

@app.route('/download_srt/<filename>', methods=['GET'])
def download_srt(filename):
    path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    if not os.path.exists(path):
        return jsonify({'error': 'SRT file not found or expired'}), 404
    
    response = send_from_directory(app.config['PROCESSED_FOLDER'], filename, as_attachment=True)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    return response

@app.route('/cleanup/<job_id>', methods=['POST'])
def cleanup_job(job_id):
    """Manual cleanup endpoint for specific job"""
    cleanup_job_files(job_id)
    return jsonify({'message': f'Job {job_id} cleaned up successfully'}), 200

@app.route('/storage_info', methods=['GET'])
def storage_info():
    """Get current storage usage information"""
    current_usage = get_directory_size(TEMP_BASE_DIR)
    return jsonify({
        'current_usage_mb': round(current_usage / 1024 / 1024, 2),
        'limit_mb': round(TEMP_STORAGE_LIMIT / 1024 / 1024, 2),
        'usage_percentage': round((current_usage / TEMP_STORAGE_LIMIT) * 100, 2),
        'active_jobs': len(job_status)
    })

@app.route('/system_info', methods=['GET'])
def system_info():
    """Get system and model information"""
    import torch
    
    # Check available Whisper models
    available_models = [
        "tiny", "tiny.en", "base", "base.en", 
        "small", "small.en", "medium", "medium.en",
        "large-v1", "large-v2", "large-v3", "large"
    ]
    
    # Check if CUDA is available for faster processing
    cuda_available = torch.cuda.is_available()
    cuda_device_count = torch.cuda.device_count() if cuda_available else 0
    
    return jsonify({
        'whisper_models': available_models,
        'current_model': 'small (fallback: base)',
        'cuda_available': cuda_available,
        'cuda_devices': cuda_device_count,
        'temp_storage_mb': round(TEMP_STORAGE_LIMIT / 1024 / 1024, 2),
        'features': [
            'Auto language detection',
            'Word-level timestamps',
            'Enhanced accuracy settings',
            'Automatic cleanup',
            'Temporary storage management'
        ]
    })

# Cleanup on app shutdown
import atexit

def cleanup_on_exit():
    """Clean up temporary directory on app shutdown"""
    try:
        shutil.rmtree(TEMP_BASE_DIR)
        print(f"Cleaned up temporary directory: {TEMP_BASE_DIR}")
    except:
        pass

atexit.register(cleanup_on_exit)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Temporary storage directory: {TEMP_BASE_DIR}")
    print(f"Storage limit: {TEMP_STORAGE_LIMIT / 1024 / 1024:.1f}MB")
    
    app.run(host=host, port=port, debug=debug)
