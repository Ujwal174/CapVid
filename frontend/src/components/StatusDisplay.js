// src/components/StatusDisplay.js
import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiLoader, FiDownload, FiRefreshCw, FiClock, FiFileText, FiType } from 'react-icons/fi';

const StatusDisplay = ({ status, error, onReset }) => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
  
  const handleDownload = async (downloadUrl) => {
    try {
      // Create a direct link to trigger download
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${downloadUrl}`;
      link.download = ''; // Let browser determine filename
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900 bg-opacity-20 mb-4">
          <FiAlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-xl font-medium text-white">Processing Failed</h3>
        <p className="mt-4 text-sm text-white text-opacity-70">{error}</p>
        <button
          onClick={onReset}
          className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
        >
          <FiRefreshCw className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900 bg-opacity-20 mb-4">
          <FiLoader className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
        <h3 className="text-xl font-medium text-white">Initializing...</h3>
        <p className="mt-4 text-sm text-white text-opacity-70">
          Getting things ready for your video processing
        </p>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (status.status) {
      case 'uploaded':
        return {
          icon: <FiClock className="h-8 w-8 text-indigo-400" />,
          title: 'Video Uploaded',
          message: 'Preparing to process your video...',
          progress: 10,
          color: 'indigo'
        };
      case 'transcribing':
        return {
          icon: <FiLoader className="h-8 w-8 text-blue-400 animate-spin" />,
          title: 'Transcribing Audio',
          message: 'Converting speech to text using AI...',
          progress: 30,
          color: 'blue'
        };
      case 'generating_captions':
        return {
          icon: <FiFileText className="h-8 w-8 text-purple-400" />,
          title: 'Generating Subtitles',
          message: 'Creating subtitle file from transcription...',
          progress: 60,
          color: 'purple'
        };
      case 'embedding_subtitles':
        return {
          icon: <FiType className="h-8 w-8 text-pink-400" />,
          title: 'Adding Subtitles to Video',
          message: 'Embedding subtitles into your video...',
          progress: 80,
          color: 'pink'
        };
      case 'completed':
        return {
          icon: <FiCheckCircle className="h-8 w-8 text-green-400" />,
          title: 'Processing Complete',
          message: 'Your video with subtitles is ready to download!',
          progress: 100,
          color: 'green'
        };
      case 'completed_srt_only':
        return {
          icon: <FiAlertTriangle className="h-8 w-8 text-yellow-400" />,
          title: 'Video Processing Failed',
          message: 'Unable to embed subtitles into video. Please try again with a different video format.',
          progress: 100,
          color: 'yellow'
        };
      case 'failed':
        return {
          icon: <FiAlertTriangle className="h-8 w-8 text-red-400" />,
          title: 'Processing Failed',
          message: status.error || 'An error occurred during processing.',
          progress: 100,
          color: 'red'
        };
      default:
        return {
          icon: <FiLoader className="h-8 w-8 text-indigo-400 animate-spin" />,
          title: 'Processing',
          message: 'Working on your video...',
          progress: 50,
          color: 'indigo'
        };
    }
  };

  const { icon, title, message, progress, color } = getStatusInfo();

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${color}-900 bg-opacity-20 mb-4`}>
          {icon}
        </div>
        <h3 className="text-xl font-medium text-white">{title}</h3>
        <p className="mt-2 text-sm text-white text-opacity-70">
          {message}
        </p>
        
        {status.filename && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-black bg-opacity-20 text-xs text-white text-opacity-80">
            <FiFileText className="mr-1 h-3 w-3" />
            {status.filename}
          </div>
        )}
      </div>

      <div className="w-full progress-bar mb-8">
        <div 
          className="progress-bar-fill"
          style={{width: `${progress}%`}}
        ></div>
      </div>

      <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
        {status.status === 'completed' && status.download_url && (
          <button
            onClick={() => handleDownload(status.download_url)}
            className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-lg text-white bg-green-600 hover:bg-green-700 transition duration-150"
          >
            <FiDownload className="mr-2" /> Download Video with Subtitles
          </button>
        )}
        
        {status.status === 'completed_srt_only' && (
          <div className="text-center mb-4">
            <p className="text-yellow-400 mb-4">Video processing encountered issues. Please try uploading again.</p>
          </div>
        )}
        
        <button
          onClick={onReset}
          className={`inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md text-white 
            ${status.status === 'completed' || status.status === 'completed_srt_only' || status.status === 'failed' 
              ? 'bg-indigo-600 hover:bg-indigo-700 transition duration-150' 
              : 'bg-gray-600 bg-opacity-50 cursor-not-allowed'}`}
          disabled={!(status.status === 'completed' || status.status === 'completed_srt_only' || status.status === 'failed')}
        >
          <FiRefreshCw className="mr-2" /> Process Another Video
        </button>
      </div>
      
      {/* Processing Steps */}
      <div className="mt-8 pt-6 border-t border-white border-opacity-10">
        <h4 className="text-sm font-medium text-white text-opacity-80 mb-4">Processing Steps</h4>
        <div className="space-y-3">
          <ProcessStep 
            label="Upload" 
            completed={true} 
            active={false}
          />
          <ProcessStep 
            label="Transcribe Audio" 
            completed={['transcribing', 'generating_captions', 'embedding_subtitles', 'completed', 'completed_srt_only'].includes(status.status)}
            active={status.status === 'transcribing'}
          />
          <ProcessStep 
            label="Generate Subtitles" 
            completed={['generating_captions', 'embedding_subtitles', 'completed', 'completed_srt_only'].includes(status.status)}
            active={status.status === 'generating_captions'}
          />
          <ProcessStep 
            label="Embed Subtitles" 
            completed={['embedding_subtitles', 'completed'].includes(status.status)}
            active={status.status === 'embedding_subtitles'}
          />
          <ProcessStep 
            label="Complete Processing" 
            completed={status.status === 'completed' || status.status === 'completed_srt_only'}
            active={false}
          />
        </div>
      </div>
    </div>
  );
};

const ProcessStep = ({ label, completed, active }) => {
  return (
    <div className="flex items-center">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
        completed ? 'bg-green-500' : 
        active ? 'bg-indigo-500 animate-pulse' : 
        'bg-gray-700'
      }`}>
        {completed ? (
          <FiCheckCircle className="h-4 w-4 text-white" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-white"></div>
        )}
      </div>
      <span className={`text-sm ${
        completed ? 'text-white' : 
        active ? 'text-white font-medium' : 
        'text-white text-opacity-50'
      }`}>{label}</span>
    </div>
  );
};

export default StatusDisplay;