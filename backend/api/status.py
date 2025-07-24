from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/status/<job_id>", methods=["GET"])
def get_status(job_id):
    """Get processing status for a job"""
    # In a real Vercel deployment, you'd query a database here
    # For demo purposes, return a sample status
    return jsonify({
        'job_id': job_id,
        'status': 'demo_mode',
        'message': 'This is a demo deployment on Vercel. Full video processing requires additional infrastructure.',
        'filename': 'sample_video.mp4'
    })

def handler(request):
    return app(request.environ, lambda status, headers: None)
