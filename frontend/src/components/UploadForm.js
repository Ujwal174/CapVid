// src/components/UploadForm.js
import React, { useState, useRef } from 'react';
import { FiUpload, FiVideo, FiX, FiFileText } from 'react-icons/fi';

const UploadForm = ({ onSuccess, onError }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      onError('Invalid file type. Please upload MP4, MOV, AVI, MKV, or WebM video.');
      return;
    }
    
    if (file.size > 500 * 1024 * 1024) { // 500MB
      onError('File too large. Maximum size is 500MB.');
      return;
    }
    
    setFile(file);
    onError(''); // Clear any previous errors
    
    // Create video preview URL
    const previewURL = URL.createObjectURL(file);
    setVideoPreview(previewURL);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('video', file);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Hold at 90% until complete
          }
          return prev + 10;
        });
      }, 500);

      console.log('Uploading to:', `${API_BASE_URL}/upload`);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Upload response status:', response.status);
      const data = await response.json();
      console.log('Upload response data:', data);
      
      if (response.ok) {
        // Clean up video preview URL
        if (videoPreview) {
          URL.revokeObjectURL(videoPreview);
        }
        onSuccess(data.job_id);
      } else {
        onError(data.error || 'Upload failed. Please try again.');
        setUploading(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
      onError(err.message || 'Network error. Please try again.');
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const clearFile = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">
        Add Captions to Your Video
      </h2>
      <p className="text-sm text-white text-opacity-70 mb-6">
        Easily generate captions with AI-powered technology
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          className={`upload-box ${
            dragActive ? 'border-indigo-400 bg-indigo-900 bg-opacity-20' : 
            file ? 'border-green-400 bg-green-900 bg-opacity-20' : ''
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current.click()}
        >
          {!file ? (
            <div className="space-y-3">
              <div className="icon-pulse text-indigo-200 mx-auto">
                <FiUpload className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-white font-medium text-lg">Upload a video or drag and drop</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="text-xs bg-indigo-800 bg-opacity-40 text-white px-2 py-1 rounded-full">MP4</span>
                <span className="text-xs bg-indigo-800 bg-opacity-40 text-white px-2 py-1 rounded-full">MOV</span>
                <span className="text-xs bg-indigo-800 bg-opacity-40 text-white px-2 py-1 rounded-full">AVI</span>
                <span className="text-xs bg-indigo-800 bg-opacity-40 text-white px-2 py-1 rounded-full">MKV</span>
                <span className="text-xs bg-indigo-800 bg-opacity-40 text-white px-2 py-1 rounded-full">WEBM</span>
              </div>
              <p className="text-xs text-white text-opacity-70 mt-2">
                Maximum file size: 500MB
              </p>
              <input
                ref={fileInputRef} // Assign the ref to the input element
                data-testid="video-upload"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                className="hidden"
                type="file"
                onChange={handleFileChange} // Ensure this is added
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center space-x-4">
                <FiVideo className="h-8 w-8 text-green-400 flex-shrink-0" />
                <div className="flex-1 truncate text-left">
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-sm text-white text-opacity-70">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-white opacity-70 hover:opacity-100 p-2 rounded-full hover:bg-white hover:bg-opacity-10"
                  onClick={clearFile}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              {videoPreview && (
                <div className="mt-4 video-preview">
                  <video 
                    src={videoPreview} 
                    controls 
                    className="w-full h-auto max-h-48"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-white text-opacity-70 mt-2">
              {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!file || uploading}
            className={`w-full py-3 px-4 rounded-lg shadow-lg font-medium flex items-center justify-center space-x-2 
              ${!file || uploading
                ? 'bg-gray-600 bg-opacity-50 cursor-not-allowed text-white text-opacity-50'
                : 'btn-primary hover:shadow-lg'
              }`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiFileText className="h-5 w-5" />
                <span>Generate Captions</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;