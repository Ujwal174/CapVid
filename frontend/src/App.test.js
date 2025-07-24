import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

// Mock the components
jest.mock('./components/UploadForm', () => {
  return function MockUploadForm({ onSuccess, onError }) {
    return (
      <div data-testid="upload-form">
        <h2>Add Captions to Your Video</h2>
        <p>Upload a video or drag and drop</p>
        <input
          type="file"
          data-testid="video-upload"
          aria-label="Upload a video"
        />
        <button onClick={() => onSuccess('test-job-id')}>Upload</button>
        <button onClick={() => onError('Upload failed')}>Trigger Error</button>
      </div>
    );
  };
});

jest.mock('./components/StatusDisplay', () => {
  return function MockStatusDisplay({ status, error, onReset }) {
    if (error) {
      return (
        <div data-testid="status-display-error">
          <h3>Processing Failed</h3>
          <p>{error}</p>
          <button onClick={onReset}>Try Again</button>
        </div>
      );
    }

    if (!status) {
      return (
        <div data-testid="status-display">
          <h3>Initializing...</h3>
        </div>
      );
    }

    return (
      <div data-testid="status-display">
        <h3>Processing Video</h3>
        <p>Status: {status.status}</p>
        {status.status === 'completed' && (
          <a href={status.download_url}>Download</a>
        )}
        <button onClick={onReset}>Reset</button>
        <button>Process Another Video</button>
      </div>
    );
  };
});

// Mock fetch API
global.fetch = jest.fn();

describe('CapVid Frontend App', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'transcribing', progress: 50 }),
      })
    );
  });

  test('renders the header with title', () => {
    render(<App />);
    expect(screen.getByText('CapVid')).toBeInTheDocument();
  });

  test('renders the subtitle', () => {
    render(<App />);
    expect(screen.getByText('Automatic Video Captioning')).toBeInTheDocument();
  });

  test('shows upload form initially', () => {
    render(<App />);
    expect(screen.getByTestId('upload-form')).toBeInTheDocument();
    expect(screen.getByText('Add Captions to Your Video')).toBeInTheDocument();
  });

  test('shows status display after successful upload', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Simulate successful upload
    await user.click(screen.getByText('Upload'));

    // Wait for the status display to appear
    await waitFor(() => {
      expect(screen.getByTestId('status-display')).toBeInTheDocument();
    });
  });

  test('polls status endpoint after job is created', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ job_id: 'test-job-id' }),
      })
    );

    render(<App />);
    const user = userEvent.setup();

    // Simulate successful upload
    await user.click(screen.getByText('Upload'));

    // Wait for fetch to be called with the status endpoint
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5001/status/test-job-id');
    });
  });

  test('updates status when polling returns new data', async () => {
    fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ job_id: 'test-job-id' }),
        })
      )
      .mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'transcribing', progress: 50 }),
        })
      );

    render(<App />);
    const user = userEvent.setup();

    // Simulate successful upload
    await user.click(screen.getByText('Upload'));

    // Wait for the status display to update
    await waitFor(() => {
      expect(screen.getByText(/Status: transcribing/i)).toBeInTheDocument();
    });
  });

  test('resets to upload form after clicking reset', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Simulate successful upload
    await user.click(screen.getByText('Upload'));

    // Wait for the reset button to appear
    const resetButton = await screen.findByText('Reset');
    await user.click(resetButton);

    // Verify that the upload form is shown again
    expect(screen.getByTestId('upload-form')).toBeInTheDocument();
  });
});
