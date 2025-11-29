import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-24 w-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl flex items-center justify-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-white" />
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-white mt-2">Page Not Found</h2>
        </div>

        {/* Error Message */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <p className="text-gray-300 mb-4">
            Oops! The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>
          <div className="text-sm text-gray-400">
            <p>Here are some helpful links instead:</p>
            <ul className="mt-2 space-y-1">
              <li>• Check the URL for any typos</li>
              <li>• Go back to the previous page</li>
              <li>• Visit our homepage</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <HomeIcon className="h-5 w-5" />
            <span>Go to Homepage</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8">
          <p className="text-gray-400 text-sm">
            Still having trouble?{' '}
            <a href="#" className="text-indigo-400 hover:text-indigo-300">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
