// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import StatusDisplay from './components/StatusDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import { FiVideo, FiCode } from 'react-icons/fi';

function App() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    let interval;
    if (jobId && status?.status !== 'completed' && status?.status !== 'failed' && status?.status !== 'completed_srt_only' && !error) {
      interval = setInterval(() => {
        fetchStatus(jobId);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, status, error]);

  // Cleanup on component unmount or page refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (jobId) {
        // Send cleanup request
        navigator.sendBeacon(`${API_BASE_URL}/cleanup/${jobId}`, '');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Cleanup when component unmounts
      if (jobId) {
        fetch(`${API_BASE_URL}/cleanup/${jobId}`, { method: 'POST' })
          .catch(() => {}); // Ignore errors
      }
    };
  }, [jobId, API_BASE_URL]);

  const fetchStatus = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${id}`);
      
      if (response.status === 404) {
        // Job not found or expired, stop polling
        console.log('Job not found or expired, stopping status polling');
        setError('Job expired or not found. Please try uploading again.');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      console.error('Status fetch error:', err);
      setError(err.message || 'Network error. Please try again.');
    }
  };

  const handleUploadSuccess = (id) => {
    setJobId(id);
    setError(null);
  };

  const handleUploadError = (errorMessage) => {
    // Ensure we always set a string error message, or null for clearing
    if (!errorMessage || errorMessage === '') {
      setError(null);
      return;
    }
    
    const message = typeof errorMessage === 'string' ? errorMessage : 
                   errorMessage?.message || 
                   'An unknown error occurred';
    setError(message);
  };

  const handleReset = async () => {
    // Cleanup current job before reset
    if (jobId) {
      try {
        await fetch(`${API_BASE_URL}/cleanup/${jobId}`, { method: 'POST' });
      } catch (err) {
        console.log('Cleanup failed:', err);
      }
    }
    
    setJobId(null);
    setStatus(null);
    setError(null);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="w-full bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiVideo className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">CapVid</span>
          </div>
          <div className="text-white text-sm hidden sm:block">
            Automatic Video Captioning • Temporary Storage
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <ErrorBoundary>
          <div className="w-full max-w-md bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
            {!jobId ? (
              <UploadForm onSuccess={handleUploadSuccess} onError={handleUploadError} />
            ) : (
              <StatusDisplay 
                status={status} 
                error={error} 
                onReset={handleReset}
                jobId={jobId}
              />
            )}
          </div>
        </ErrorBoundary>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-black bg-opacity-10 py-3">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-white opacity-70">
            CapVid – Files auto-deleted after download or 1 hour
          </p>
          <div className="flex items-center space-x-2 text-xs text-white opacity-70 mt-2 sm:mt-0">
            <FiCode className="h-3 w-3" />
            <span>250MB Temp Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;