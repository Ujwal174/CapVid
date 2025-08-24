# 🎬 CapVid - AI-Powered Video Subtitle Generator

**Transform your videos with AI-generated subtitles in minutes!**

CapVid is a modern, full-stack web application that uses OpenAI's Whisper AI to automatically generate and embed subtitles into your videos. With an intuitive interface, real-time processing updates, and smart storage management, it's the easiest way to make your content more accessible.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://capvid.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-darkgreen?style=for-the-badge)](https://github.com/0xUjwal/CapVid)

## ✨ Key Features

- 🎯 **AI-Powered Transcription** - 83%+ accuracy with Whisper small model
- 🚀 **Real-time Processing** - Live status updates throughout the workflow
- 📱 **Modern UI/UX** - Responsive design with smooth animations
- 🔄 **Smart Storage** - Auto-cleanup with 250MB temporary storage limit
- 🎵 **Multi-format Support** - MP4, AVI, MOV, MKV, and more
- 🌍 **Multi-language** - Auto-detection for 50+ languages
- ⚡ **Optimized Performance** - Memory-efficient processing
- 🛡️ **Zero Maintenance** - Fully automated file lifecycle management

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - Modern React with hooks and functional components
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **anime.js 3.2.1** - Smooth SVG path animations for custom logo
- **@splinetool/react-spline 2.2.6** - 3D background integration

### Backend
- **Flask 3.1.0** - Lightweight Python web framework
- **OpenAI Whisper** - State-of-the-art speech recognition (small model)
- **FFmpeg** - Video processing and subtitle embedding
- **Python 3.8+** - Modern Python with asyncio support

### Infrastructure
- **Temporary Storage** - Smart 250MB limit with auto-cleanup
- **Real-time Updates** - WebSocket-style status tracking
- **Cross-platform** - Windows, macOS, Linux support

## 🏗️ Project Structure

```
CapVid/
├── backend/                 # Flask backend API
│   ├── app.py              # Main Flask application
│   ├── helpers.py          # Video processing utilities
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AnimatedStatusDisplay.js
│   │   │   ├── AnimatedUploadForm.js
│   │   │   ├── ErrorBoundary.js
│   │   │   ├── GitHubFooter.js
│   │   │   └── SVGAnimatedLogo.js
│   │   ├── App.js          # Main React application
│   │   └── App.css         # Styles
│   ├── public/
│   │   ├── index.html      # HTML template
│   │   └── logo.ico        # Favicon
│   └── package.json        # Node.js dependencies
├── .vscode/                # VS Code settings
├── .gitignore              # Git ignore rules
├── .gitattributes          # Git attributes
└── README.md               # This file
```

## 🛠️ Technologies Used

### Backend
- **Flask 3.1.0**: Modern Python web framework
- **OpenAI Whisper**: State-of-the-art AI model for audio transcription
- **FFmpeg**: Video processing and subtitle embedding
- **Flask-CORS**: Cross-origin resource sharing support
- **PyTorch**: Deep learning framework for Whisper

### Frontend
- **React 18.2.0**: Modern JavaScript library for building user interfaces
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Anime.js**: Lightweight animation library
- **React Icons**: Beautiful icon library
- **Spline**: 3D background animations

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **FFmpeg** installed on your system

### 1. Clone the Repository

```bash
git clone https://github.com/0xUjwal/CapVid.git
cd CapVid
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python app.py
```

The backend will run on `http://localhost:5001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will run on `http://localhost:3000`

## 📱 Usage

1. **Upload**: Drag and drop or select a video file (up to 100MB)
2. **Process**: Watch real-time status as AI transcribes your video
3. **Download**: Get your video with embedded subtitles (auto-downloaded as `CapVid-{originalname}.mp4`)

### Supported Formats
- **Input**: MP4, AVI, MOV, MKV, and most common video formats
- **Output**: MP4 with embedded subtitles, SRT subtitle files
- **File Limits**: 100MB per file, 250MB total storage

### Processing Steps
1. **Audio Extraction**: Extract audio from uploaded video
2. **AI Transcription**: OpenAI Whisper converts speech to text with 83%+ accuracy
3. **Subtitle Generation**: Create properly timed SRT subtitle file
4. **Video Processing**: Embed subtitles directly into the video
5. **Auto-Cleanup**: Files automatically deleted after download or 1 hour

## 🎯 Key Features & Performance

### AI Model Optimization
- **Primary Model**: Whisper `small` (optimized for CPU usage)
- **Fallback Model**: Whisper `base` (if memory constraints)
- **Accuracy**: 83%+ transcription accuracy
- **Language Support**: Auto-detection for multiple languages
- **Word-Level Timing**: Precise subtitle synchronization

### Smart Storage Management
- **Temporary Storage**: 250MB maximum with auto-cleanup
- **File Lifecycle**: 1-hour expiration, immediate cleanup after download
- **Zero Maintenance**: Fully automated file management
- **Memory Optimization**: Original uploads deleted after processing

### Enhanced Processing
- **Real-time Updates**: Live status tracking through all processing stages
- **Error Handling**: Graceful fallbacks and detailed error messages
- **Background Processing**: Non-blocking video processing
- **Auto-Download**: Files cleaned up automatically after download

## 🔧 API Endpoints

### Core Processing
- `POST /upload` - Upload video file for processing
- `GET /status/<job_id>` - Get real-time processing status
- `GET /download/<filename>` - Download processed video with subtitles
- `GET /download_srt/<filename>` - Download SRT subtitle file
- `POST /cleanup/<job_id>` - Manual cleanup for specific jobs

### System Monitoring
- `GET /storage_info` - Real-time storage usage and limits
- `GET /system_info` - Whisper model info and system capabilities

## ⚙️ Environment Variables

### Backend Configuration
- `FLASK_ENV`: Set to 'production' for production deployment
- `HOST`: Host to bind to (default: 0.0.0.0)
- `PORT`: Port to run on (default: 5001)
- `FLASK_DEBUG`: Enable/disable debug mode (default: False)

### Frontend Configuration
- `REACT_APP_API_BASE_URL`: Backend API URL (default: http://localhost:5001)

## 🚀 Production Deployment

### System Requirements
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **FFmpeg** installed and accessible
- **Memory**: 2GB+ RAM recommended for video processing
- **Storage**: Temporary space for 250MB processing buffer

### Production Considerations

1. **Storage Management**
   ```bash
   # Temporary storage with 250MB limit
   # Auto-cleanup every 10 minutes
   # Files expire after 1 hour
   ```

2. **Memory Optimization**
   ```bash
   # Whisper small model: ~244MB
   # Processing buffer: ~250MB
   # Total recommended: 2GB+ RAM
   ```

3. **Security Settings**
   - Use HTTPS in production
   - Configure proper CORS settings
   - File upload limits enforced (100MB per file)
   - Automatic cleanup prevents storage attacks

### Manual Production Setup

1. **Backend Setup:**
   ```bash
   cd backend
   
   # Create production environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set environment variables
   export FLASK_ENV=production
   export HOST=0.0.0.0
   export PORT=5001
   
   # Start server
   python app.py
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Build for production
   npm run build
   
   # Serve with static file server
   npx serve -s build -l 80
   ```

## 📊 Performance Metrics

| Metric | Specification |
|--------|---------------|
| Transcription Accuracy | 83%+ (Whisper small model) |
| Max File Size | 100MB per upload |
| Total Storage Limit | 250MB with auto-cleanup |
| File Retention | 1 hour maximum |
| Processing Time | ~1-3 minutes per minute of video |
| Supported Languages | Auto-detection, 50+ languages |
| Memory Usage | Optimized for 2GB+ systems |

## 🛠️ Technical Implementation

### Enhanced Whisper Integration
```python
# Optimized transcription settings
result = model.transcribe(
    filepath,
    language=None,              # Auto-detect language
    task="transcribe",          # Transcribe vs translate
    word_timestamps=True,       # Word-level timing
    temperature=0.0,            # Deterministic results
    compression_ratio_threshold=2.4,
    logprob_threshold=-1.0,
    no_speech_threshold=0.6
)
```

### Smart Storage Management
```python
# Temporary storage with limits
TEMP_STORAGE_LIMIT = 250 * 1024 * 1024  # 250MB
TEMP_BASE_DIR = tempfile.mkdtemp(prefix='capvid_')

# Multiple cleanup mechanisms
- Periodic cleanup (every 10 minutes)
- Post-download cleanup (2 seconds delay)
- Age-based cleanup (1 hour expiration)
- Browser event cleanup (page unload)
```

## 🏥 Health Monitoring

### Storage Monitoring
```bash
# Check current storage usage
curl http://localhost:5001/storage_info

# Response includes:
{
  "current_usage_mb": 45.2,
  "limit_mb": 250.0,
  "usage_percentage": 18.08,
  "active_jobs": 3
}
```

### System Information
```bash
# Get system capabilities
curl http://localhost:5001/system_info

# Includes model info, CUDA availability, features
```

## 🔍 Troubleshooting

### Common Issues

1. **FFmpeg Not Found**
   ```bash
   # Install FFmpeg
   # Ubuntu/Debian: sudo apt install ffmpeg
   # macOS: brew install ffmpeg
   # Windows: Download from https://ffmpeg.org/
   ```

2. **Memory Issues**
   ```bash
   # Increase available memory or use base model fallback
   # The system automatically falls back to base model if small fails
   ```

3. **Storage Full**
   ```bash
   # Storage automatically managed with 250MB limit
   # Oldest files cleaned up when limit reached
   ```

## 🎉 What's New

### Recent Improvements
- ✅ **Optimized AI Model**: Switched to Whisper `small` for better accuracy (83%+)
- ✅ **Smart Storage**: 250MB temporary storage with automatic cleanup
- ✅ **Enhanced UX**: Real-time progress tracking and status updates
- ✅ **Memory Optimization**: Reduced memory footprint and better error handling
- ✅ **Auto-Download**: Files automatically named as `CapVid-{originalname}.mp4`
- ✅ **Zero Maintenance**: Fully automated file lifecycle management
- `GET /download_srt/<filename>` - Download SRT subtitle file
- `POST /cleanup` - Clean up temporary files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
