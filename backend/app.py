from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import threading
from helpers import generate_srt, overlay_subtitles
import whisper

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

job_status = {}

def process_video_task(job_id, filepath, filename):
    try:
        print(f"Starting video processing for job {job_id}")
        job_status[job_id] = {'status': 'transcribing', 'filename': filename}

        model = whisper.load_model("base")
        result = model.transcribe(filepath)

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
            
            # Verify the output file was created
            if os.path.exists(output_video_path):
                print(f"Video processing completed successfully for job {job_id}")
                job_status[job_id] = {
                    'status': 'completed',
                    'filename': filename,
                    'download_url': f"/download/{output_video_filename}",
                    'srt_url': f"/download_srt/{job_id}_captions.srt"
                }
            else:
                print(f"Video processing failed - output file not created for job {job_id}")
                job_status[job_id] = {
                    'status': 'completed_srt_only',
                    'filename': filename,
                    'error': 'Output video file was not created, but SRT file is available',
                    'srt_url': f"/download_srt/{job_id}_captions.srt"
                }
        except Exception as subtitle_error:
            print(f"Failed to embed subtitles for job {job_id}: {str(subtitle_error)}")
            # If subtitle embedding fails, still provide the SRT file
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

    job_id = str(uuid.uuid4())
    filename = f"{job_id}_{video.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    video.save(filepath)

    job_status[job_id] = {'status': 'uploaded', 'filename': filename}
    thread = threading.Thread(target=process_video_task, args=(job_id, filepath, filename))
    thread.start()

    return jsonify({'job_id': job_id}), 202

@app.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    if job_id not in job_status:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job_status[job_id])

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    if not os.path.exists(path):
        return jsonify({'error': 'File not found'}), 404
    
    response = send_from_directory(app.config['PROCESSED_FOLDER'], filename, as_attachment=True)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    return response

@app.route('/download_srt/<filename>', methods=['GET'])
def download_srt(filename):
    path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    if not os.path.exists(path):
        return jsonify({'error': 'SRT file not found'}), 404
    
    response = send_from_directory(app.config['PROCESSED_FOLDER'], filename, as_attachment=True)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    return response

@app.route('/cleanup', methods=['POST'])
def cleanup_files():
    for folder in [UPLOAD_FOLDER, PROCESSED_FOLDER]:
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"Failed to delete {filepath}: {e}")
    return jsonify({'message': 'Cleanup successful'}), 200

if __name__ == '__main__':
    # Get port from environment variable or default to 5001
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)