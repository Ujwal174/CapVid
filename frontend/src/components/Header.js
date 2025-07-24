import React from 'react';
import { FiVideo } from 'react-icons/fi';

const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiVideo className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">CapVid</h1>
          </div>
          <div className="text-sm text-gray-600">
            Automatic Video Captioning
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;