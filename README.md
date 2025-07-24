# Capvid Project

A video processing application that automatically transcribes audio and embeds subtitles into videos using AI.

## Features

- Upload video files for processing
- Automatic audio transcription using OpenAI Whisper
- Generate SRT subtitle files
- Embed subtitles directly into videos
- Download processed videos with embedded subtitles
- Real-time processing status updates
- Modern React frontend with Tailwind CSS

## Project Structure

```
capvid/
├── backend/                 # Flask backend API
│   ├── app.py              # Main Flask application
│   ├── helpers.py          # Utility functions for video processing
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   └── package.json       # Node.js dependencies
└── README.md              # This file
```

## Technologies Used

### Backend
- **Flask**: Web framework for Python
- **OpenAI Whisper**: AI model for audio transcription
- **FFmpeg**: Video processing and subtitle embedding
- **Flask-CORS**: Cross-origin resource sharing

### Frontend
- **React**: JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **React Icons**: Icon library

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- FFmpeg installed and accessible in PATH

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install flask flask-cors openai-whisper
   ```

4. Run the Flask server:
   ```bash
   python app.py
   ```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will start on `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Upload a video file using the upload interface
3. Wait for the processing to complete (transcription → subtitle generation → embedding)
4. Download the processed video with embedded subtitles

## API Endpoints

- `POST /upload` - Upload video file for processing
- `GET /status/<job_id>` - Get processing status
- `GET /download/<filename>` - Download processed video
- `GET /download_srt/<filename>` - Download SRT subtitle file
- `POST /cleanup` - Clean up temporary files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.
