from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api", methods=["GET"])
def api_root():
    """API root endpoint"""
    return jsonify({
        'message': 'Capvid API on Vercel',
        'version': '1.0.0',
        'endpoints': [
            '/api/upload - POST - Upload video file',
            '/api/status/<job_id> - GET - Get processing status',
            '/api/health - GET - Health check'
        ]
    })

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Capvid API is running on Vercel',
        'platform': 'vercel'
    })

def handler(request):
    return app(request.environ, lambda status, headers: None)
