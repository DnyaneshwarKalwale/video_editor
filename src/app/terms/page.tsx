'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Scalez, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Domain-Based Access</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-4">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Access Requirements:</h3>
                <ol className="text-blue-800 space-y-2">
                  <li><strong>1. Company Domain:</strong> Your company domain must be approved by admin</li>
                  <li><strong>2. Individual Registration:</strong> Each user creates their own account</li>
                  <li><strong>3. Email Verification:</strong> Use your company email address</li>
                  <li><strong>4. Platform Access:</strong> Login and start using Scalez immediately</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
                <h3 className="text-lg font-medium text-yellow-900 mb-3">Important Notes:</h3>
                <ul className="text-yellow-800 space-y-2">
                  <li>• Only users with approved company domains can register</li>
                  <li>• Each user has their own individual account</li>
                  <li>• Contact your admin to add your company domain</li>
                  <li>• Google OAuth and email/password login available</li>
                  <li>• Individual projects and settings for each user</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Service Usage</h2>
              <p className="text-gray-700 mb-4">
                Scalez is a B2B video editing platform designed for company use. Each user has their own individual account and projects.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Individual accounts for each team member</li>
                <li>• Personal projects and settings</li>
                <li>• Domain-restricted access for security</li>
                <li>• Google OAuth and email/password authentication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Privacy and Security</h2>
              <p className="text-gray-700 mb-4">
                We take your privacy and security seriously. All user data is encrypted and stored securely.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Individual user credentials are encrypted</li>
                <li>• Domain-based access control</li>
                <li>• Automatic logout from inactive sessions</li>
                <li>• Regular security audits and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Support and Contact</h2>
              <p className="text-gray-700 mb-4">
                For technical support or questions about your registration, please contact our admin team.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
