import React from 'react';
import { FiGithub } from 'react-icons/fi';

const GitHubFooter = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="https://github.com/0xUjwal/CapVid"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 bg-black bg-opacity-50 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-opacity-70 transition-all duration-300 hover:scale-105 shadow-lg"
        style={{ fontFamily: 'Urbanist, sans-serif' }}
      >
        <FiGithub className="h-5 w-5" />
        <span className="text-sm font-medium">Star this repository</span>
      </a>
    </div>
  );
};

export default GitHubFooter;
