import React, { useState, useRef, useEffect } from 'react';

const AnimatedUploadForm = ({ onSuccess, onError }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    // No need for animated icon initialization anymore
  }, [file]);

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
    
    if (file.size > 250 * 1024 * 1024) { // 250MB
      onError('File too large. Maximum size is 250MB.');
      return;
    }
    
    setFile(file);
    onError('');
    
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
    
    if (!file || !fileName) {
      alert('Please select a file and enter a name');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('filename', fileName);

    // ✅ Use environment variable
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://api.capvid.app';
    const uploadUrl = `${apiBaseUrl}/upload`;
    
    console.log('Uploading to:', uploadUrl); // Should show https://api.capvid.app/upload

    try {
      setUploading(true);
      setUploadProgress(0);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      onSuccess(result.job_id, file);
    } catch (error) {
      console.error('Upload failed:', error);
      onError('Upload failed. Please try again.');
    } finally {
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
    setFileName('');
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div 
          className={`relative bg-white bg-opacity-10 backdrop-blur-md border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer ${
            dragActive ? 'border-purple-400 bg-purple-900 bg-opacity-30 scale-105' : 
            file ? 'border-green-400 bg-green-900 bg-opacity-30' : 
            'border-gray-300 border-opacity-50 hover:border-purple-400 hover:bg-purple-900 hover:bg-opacity-20'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current.click()}
        >
          {!file ? (
            <div className="space-y-6">
              {/* Simple SVG Upload Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg 
                    className="w-12 h-12 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M12 4v16m8-8H4" 
                    />
                  </svg>
                </div>
              </div>
              
              <div>
                <h3 
                  className="text-3xl font-semibold text-white mb-2"
                  style={{ fontFamily: 'Urbanist, sans-serif' }}
                >
                  Upload Video
                </h3>
                <p 
                  className="text-gray-600 text-sm mb-4"
                  style={{ fontFamily: 'Urbanist, sans-serif' }}
                >
                  (Supported formats)
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {['MP4', 'MOV', 'AVI', 'MKV', 'WEBM'].map((format) => (
                  <span 
                    key={format}
                    className="px-3 py-1 bg-white bg-opacity-20 text-black rounded-full text-xs font-medium"
                    style={{ fontFamily: 'Urbanist, sans-serif' }}
                  >
                    {format}
                  </span>
                ))}
              </div>

              <p 
                className="text-xs text-gray-400 mt-4"
                style={{ fontFamily: 'Urbanist, sans-serif' }}
              >
                Upload videos with size less than 250MB
              </p>

              <input
                ref={fileInputRef}
                data-testid="video-upload"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                className="hidden"
                type="file"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-black-400 text-4xl mb-4">✓</div>
              <h3 
                className="text-xl font-semibold text-black"
                style={{ fontFamily: 'Urbanist, sans-serif' }}
              >
                {file.name}
              </h3>
              <p 
                className="text-gray-600 text-sm"
                style={{ fontFamily: 'Urbanist, sans-serif' }}
              >
                {formatFileSize(file.size)}
              </p>
              
              {videoPreview && (
                <div className="mt-4">
                  <video 
                    src={videoPreview} 
                    controls 
                    className="w-full h-auto max-h-32 rounded-lg"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={clearFile}
                className="text-red-400 hover:text-red-300 text-sm underline"
                style={{ fontFamily: 'Urbanist, sans-serif' }}
              >
                Remove file
              </button>
            </div>
          )}
        </div>

        {uploading && (
          <div className="mt-6">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
              <div 
                className="bg-black-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p 
              className="text-center text-xs text-gray-600"
              style={{ fontFamily: 'Urbanist, sans-serif' }}
            >
              {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className={`w-full mt-6 py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 ${
            !file || uploading
              ? 'bg-gray-600 bg-opacity-50 cursor-not-allowed text-gray-400'
              : 'bg-cyan-600 hover:bg-#cyan-700 text-white hover:scale-105 shadow-lg hover:shadow-cyan-500/25'
          }`}
          style={{ fontFamily: 'Urbanist, sans-serif' }}
        >
          {uploading ? 'Processing...' : 'Generate Captions'}
        </button>
      </form>
    </div>
  );
};

export default AnimatedUploadForm;
