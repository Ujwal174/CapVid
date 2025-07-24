from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import tempfile
import base64

# Create Flask app for Vercel
app = Flask(__name__)
CORS(app)

# Global storage for job status (in production, use a database)
job_status = {}

@app.route("/api/upload", methods=["POST"])
def upload_video():
    """
    Handle video upload for Vercel deployment
    Note: Due to Vercel's limitations, we'll return a simplified response
    """
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video = request.files['video']
        if video.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        # For Vercel demo, we'll simulate processing
        # In production, you'd need external storage and processing
        import uuid
        job_id = str(uuid.uuid4())
        
        # Store job status
        job_status[job_id] = {
            'status': 'uploaded',
            'filename': video.filename,
            'message': 'Video uploaded successfully. Processing on Vercel requires external services.'
        }
        
        return jsonify({
            'job_id': job_id,
            'message': 'Upload successful. Note: Full video processing requires additional setup for Vercel deployment.'
        }), 202

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/status/<job_id>", methods=["GET"])
def get_status(job_id):
    """Get processing status"""
    if job_id not in job_status:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify(job_status[job_id])

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Capvid API is running on Vercel',
        'timestamp': str(os.getenv('VERCEL_REGION', 'unknown'))
    })

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda status, headers: None)
