// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import StatusDisplay from './components/StatusDisplay';
import { FiVideo, FiCode } from 'react-icons/fi';

function App() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Poll status if we have a job ID
    let interval;
    if (jobId) {
      interval = setInterval(() => {
        fetchStatus(jobId);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [jobId]);

  const fetchStatus = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/status/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
        // If job is completed or failed, stop polling
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval();
        }
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleUploadSuccess = (id) => {
    setJobId(id);
    setError(null);
  };

  const handleReset = () => {
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
          <div className="text-white text-sm hidden sm:block">Automatic Video Captioning</div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden">
          {!jobId ? (
            <UploadForm onSuccess={handleUploadSuccess} onError={setError} />
          ) : (
            <StatusDisplay 
              status={status} 
              error={error} 
              onReset={handleReset} 
            />
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-black bg-opacity-10 py-3">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-white opacity-70">
            CapVid – Add captions to your videos with AI
          </p>
          <div className="flex items-center space-x-2 text-xs text-white opacity-70 mt-2 sm:mt-0">
            <FiCode className="h-3 w-3" />
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;