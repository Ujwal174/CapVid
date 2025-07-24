import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadForm from './UploadForm';

describe('UploadForm Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('renders upload form UI', () => {
    render(<UploadForm onSuccess={() => {}} onError={() => {}} />);
    expect(screen.getByText(/Add Captions to Your Video/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload a video or drag and drop/i)).toBeInTheDocument();
  });

  test('calls onSuccess on valid file upload', async () => {
    const mockOnSuccess = jest.fn();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job_id: 'test-job-id' }),
    });

    render(<UploadForm onSuccess={mockOnSuccess} onError={() => {}} />);

    const file = new File(['dummy content'], 'video.mp4', { type: 'video/mp4' });
    const input = screen.getByTestId('video-upload');

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/Generate Captions/i));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('test-job-id');
    });
  });

  test('calls onError on upload failure', async () => {
    const mockOnError = jest.fn();

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    });

    render(<UploadForm onSuccess={() => {}} onError={mockOnError} />);

    const file = new File(['dummy'], 'badfile.mp4', { type: 'video/mp4' });
    const input = screen.getByTestId('video-upload');

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText('Generate Captions'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Upload failed');
    });
  });
});
