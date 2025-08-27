'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute top-8 right-8">
              <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <div className="absolute bottom-8 left-8">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            We encountered an unexpected error. Don't worry, our team has been notified and we're working to fix it.
          </p>

          {/* Error Details */}
          <div className="bg-red-50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-red-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Application Error</span>
            </div>
            <p className="text-xs text-red-500 font-mono">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="text-xs text-red-400 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Try Again</span>
            </button>
            
            <Link
              href="/login"
              className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Go to Login</span>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Quick Navigation:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/projects"
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
              >
                Projects
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors text-sm"
              >
                Admin Dashboard
              </Link>
              <Link
                href="/terms"
                className="px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors text-sm"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="px-4 py-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition-colors text-sm"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            If this problem persists, please contact our support team.
          </p>
        </div>

        {/* Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
}
