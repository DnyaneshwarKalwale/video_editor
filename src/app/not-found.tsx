'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 Text */}
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              404
            </h1>
            
            {/* Floating Elements */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            </div>
            <div className="absolute top-8 right-8">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <div className="absolute bottom-8 left-8">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, let's get you back on track!
          </p>

          {/* Error Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Error 404 - Page Not Found</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Go Back</span>
            </button>
            
            <Link
              href="/login"
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
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
            If you believe this is an error, please contact our support team.
          </p>
        </div>

        {/* Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
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
