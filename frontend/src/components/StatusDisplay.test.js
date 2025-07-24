import React from 'react'; // Add this line
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusDisplay from './StatusDisplay';

describe('StatusDisplay Component', () => {
  test('renders initializing state when no status is provided', () => {
    render(<StatusDisplay status={null} error={null} onReset={() => {}} />);
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
  });

  test('renders processing state when status is provided', () => {
    render(<StatusDisplay status={{ status: 'transcribing' }} error={null} onReset={() => {}} />);
    expect(screen.getByText(/Processing Video/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: transcribing/i)).toBeInTheDocument();
  });

  test('renders completed state with download link', () => {
    render(<StatusDisplay status={{ status: 'completed', download_url: 'http://test.com/video.mp4' }} error={null} onReset={() => {}} />);
    expect(screen.getByText(/Download/i)).toBeInTheDocument();
    expect(screen.getByText(/Processing Video/i)).toBeInTheDocument();
  });

  test('renders error state when error is provided', () => {
    render(<StatusDisplay status={null} error="Something went wrong" onReset={() => {}} />);
    expect(screen.getByText(/Processing Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  test('calls onReset when reset button is clicked', () => {
    const mockOnReset = jest.fn();
    render(<StatusDisplay status={null} error="Something went wrong" onReset={mockOnReset} />);

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockOnReset).toHaveBeenCalled();
  });
});
