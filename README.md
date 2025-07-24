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

## Deployment Options

### 1. Local Development

For development and testing:

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

### 2. Docker Deployment (Recommended for Production)

**Prerequisites:**
- Docker
- Docker Compose

**Quick Start:**
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Capvid-project.git
cd Capvid-project

# Deploy with Docker (Linux/Mac)
chmod +x deploy.sh
./deploy.sh

# Deploy with Docker (Windows)
deploy.bat
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:5001

### 3. Heroku Deployment

1. Install Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create your-capvid-app
   heroku buildpacks:add --index 1 heroku-community/apt
   heroku buildpacks:add --index 2 heroku/python
   ```
3. Set environment variables:
   ```bash
   heroku config:set FLASK_ENV=production
   heroku config:set HOST=0.0.0.0
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

### 4. Manual Production Setup

1. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   export FLASK_ENV=production
   export HOST=0.0.0.0
   export PORT=5001
   python app.py
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run build
   
   # Serve with a static file server (e.g., nginx, serve)
   npx serve -s build -l 80
   ```

## Environment Variables

### Backend
- `FLASK_ENV`: Set to 'production' for production deployment
- `HOST`: Host to bind to (default: 0.0.0.0)
- `PORT`: Port to run on (default: 5001)
- `FLASK_DEBUG`: Enable/disable debug mode (default: False)

### Frontend
- `REACT_APP_API_BASE_URL`: Backend API URL (default: http://localhost:5001)

## Production Considerations

1. **FFmpeg**: Ensure FFmpeg is installed on your production server
2. **File Storage**: Configure persistent storage for uploads and processed files
3. **Memory**: Video processing requires sufficient RAM (recommended: 2GB+)
4. **Security**: 
   - Use HTTPS in production
   - Configure proper CORS settings
   - Implement file upload limits
   - Add authentication if needed

## Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend
```

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
