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
import gc
import psutil

app = Flask(__name__)

# Configure CORS for Vercel frontend
CORS(app, 
     origins=[
         "https://capvid.app",
         "https://www.capvid.app",
         "http://localhost:3000",   # for local development
         "https://localhost:3000"   # for local development with HTTPS
     ],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True,
     max_age=3600
)

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
processing_lock = threading.Lock()

# Global model to avoid reloading
whisper_model = None

def get_directory_size(directory):
    """Calculate total size of all files in directory"""
    total_size = 0
    try:
        for dirpath, dirnames, filenames in os.walk(directory):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                if os.path.exists(filepath):
                    total_size += os.path.getsize(filepath)
    except Exception as e:
        print(f"Error calculating directory size: {e}")
    return total_size

def get_memory_usage():
    """Get current memory usage in MB"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        return memory_info.rss / 1024 / 1024  # Convert to MB
    except Exception as e:
        print(f"Error getting memory usage: {e}")
        return 0

def cleanup_old_files():
    """Remove files older than 1 hour or when storage limit is exceeded"""
    with processing_lock:
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
                    # Check if we've freed enough space
                    if get_directory_size(TEMP_BASE_DIR) <= TEMP_STORAGE_LIMIT * 0.8:
                        break
                    # Check if we've freed enough space
                    if get_directory_size(TEMP_BASE_DIR) <= TEMP_STORAGE_LIMIT * 0.8:
                        break
        
        # Remove identified files
        for job_id in files_to_remove:
            cleanup_job_files(job_id)

def cleanup_job_files(job_id):
    """Remove all files associated with a job"""
    try:
        with processing_lock:
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

def get_optimal_whisper_model():
    """Select the best Whisper model based on available memory"""
    memory_mb = get_memory_usage()
    system_memory = psutil.virtual_memory()
    available_memory_mb = system_memory.available / 1024 / 1024
    
    print(f"Current memory usage: {memory_mb:.1f}MB, Available: {available_memory_mb:.1f}MB")
    
    # Conservative memory thresholds for Docker containers
    if available_memory_mb > 1000:  # > 1GB available
        return "small"
    elif available_memory_mb > 500:  # > 500MB available
        return "base"
    else:  # < 500MB available
        return "tiny"

def load_whisper_model(preferred_model="small"):
    """Load Whisper model with fallback strategy"""
    global whisper_model
    
    if whisper_model is not None:
        return whisper_model
    
    models_to_try = [preferred_model, "base", "tiny"]
    
    for model_name in models_to_try:
        try:
            print(f"Attempting to load Whisper model: {model_name}")
            whisper_model = whisper.load_model(model_name)
            print(f"Successfully loaded Whisper model: {model_name}")
            return whisper_model
        except Exception as e:
            print(f"Failed to load {model_name} model: {e}")
            if whisper_model is not None:
                del whisper_model
                whisper_model = None
            gc.collect()  # Force garbage collection
    
    raise Exception("Failed to load any Whisper model")

def process_video_task(job_id, filepath, filename):
    try:
        print(f"Starting video processing for job {job_id}")
        
        with processing_lock:
            job_status[job_id] = {'status': 'transcribing', 'filename': filename}
        
        # Check memory before processing
        memory_before = get_memory_usage()
        print(f"Memory usage before processing: {memory_before:.1f}MB")
        
        # Get optimal model based on current memory
        optimal_model = get_optimal_whisper_model()
        model = load_whisper_model(optimal_model)
        
        # Enhanced transcription with better accuracy settings
        print(f"Starting transcription with {optimal_model} model")
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
        
        # Check memory after transcription
        memory_after = get_memory_usage()
        print(f"Memory usage after transcription: {memory_after:.1f}MB")

        with processing_lock:
            job_status[job_id] = {'status': 'generating_captions', 'filename': filename}
        
        srt_path = os.path.join(PROCESSED_FOLDER, f"{job_id}_captions.srt")
        
        # Create output video filename with subtitles
        name, ext = os.path.splitext(filename)
        output_video_filename = f"{job_id}_with_subtitles{ext}"
        output_video_path = os.path.join(PROCESSED_FOLDER, output_video_filename)

        generate_srt(result["segments"], srt_path)
        
        with processing_lock:
            job_status[job_id] = {'status': 'embedding_subtitles', 'filename': filename}
        
        try:
            overlay_subtitles(filepath, srt_path, output_video_path)
            
            if os.path.exists(output_video_path):
                print(f"Video processing completed successfully for job {job_id}")
                with processing_lock:
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
                with processing_lock:
                    job_status[job_id] = {
                        'status': 'completed_srt_only',
                        'filename': filename,
                        'error': 'Output video file was not created, but SRT file is available',
                        'srt_url': f"/download_srt/{job_id}_captions.srt"
                    }
        except Exception as subtitle_error:
            print(f"Failed to embed subtitles for job {job_id}: {str(subtitle_error)}")
            with processing_lock:
                job_status[job_id] = {
                    'status': 'completed_srt_only',
                    'filename': filename,
                    'error': f'Failed to embed subtitles: {str(subtitle_error)}',
                    'srt_url': f"/download_srt/{job_id}_captions.srt"
                }
        
        # Force garbage collection after processing
        gc.collect()
        memory_final = get_memory_usage()
        print(f"Memory usage after processing complete: {memory_final:.1f}MB")
            
    except Exception as e:
        print(f"Video processing failed for job {job_id}: {str(e)}")
        with processing_lock:
            job_status[job_id] = {
                'status': 'failed',
                'filename': filename,
                'error': str(e)
            }
        # Force garbage collection on error
        gc.collect()

@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video = request.files['video']
        if video.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        # Check file size (limit to 100MB per file)
        if request.content_length and request.content_length > 100 * 1024 * 1024:
            return jsonify({'error': 'File too large. Maximum size is 100MB per file.'}), 400

        # Check available storage space
        current_storage = get_directory_size(TEMP_BASE_DIR)
        if current_storage + (request.content_length or 0) > TEMP_STORAGE_LIMIT:
            # Try cleanup first
            cleanup_old_files()
            current_storage = get_directory_size(TEMP_BASE_DIR)
            
            if current_storage + (request.content_length or 0) > TEMP_STORAGE_LIMIT:
                return jsonify({'error': 'Temporary storage full. Please try again in a few minutes.'}), 507

        job_id = str(uuid.uuid4())
        filename = f"{job_id}_{video.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        video.save(filepath)
        
        with processing_lock:
            file_timestamps[job_id] = datetime.now()
            job_status[job_id] = {'status': 'uploaded', 'filename': video.filename}
        
        thread = threading.Thread(target=process_video_task, args=(job_id, filepath, video.filename))
        thread.start()

        return jsonify({'job_id': job_id}), 202
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    with processing_lock:
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
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        cuda_device_count = torch.cuda.device_count() if cuda_available else 0
    except ImportError:
        cuda_available = False
        cuda_device_count = 0
    
    # Check available Whisper models
    available_models = [
        "tiny", "tiny.en", "base", "base.en", 
        "small", "small.en", "medium", "medium.en",
        "large-v1", "large-v2", "large-v3", "large"
    ]
    
    # Get current memory usage
    memory_usage = get_memory_usage()
    system_memory = psutil.virtual_memory()
    
    return jsonify({
        'whisper_models': available_models,
        'current_model': 'adaptive (tiny/base/small based on memory)',
        'cuda_available': cuda_available,
        'cuda_devices': cuda_device_count,
        'memory_usage_mb': round(memory_usage, 2),
        'system_memory_total_mb': round(system_memory.total / 1024 / 1024, 2),
        'system_memory_available_mb': round(system_memory.available / 1024 / 1024, 2),
        'temp_storage_mb': round(TEMP_STORAGE_LIMIT / 1024 / 1024, 2),
        'features': [
            'Adaptive model selection based on memory',
            'Auto language detection',
            'Word-level timestamps',
            'Enhanced accuracy settings',
            'Automatic cleanup',
            'Thread-safe processing',
            'Memory management',
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
