'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us when registering your company for Scalez.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Company name and details</li>
                <li>• Admin contact information (name, email)</li>
                <li>• Device information for security tracking</li>
                <li>• Usage data and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to provide, maintain, and improve our services.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Process company registrations</li>
                <li>• Send approval notifications and credentials</li>
                <li>• Provide customer support</li>
                <li>• Ensure platform security</li>
                <li>• Improve our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your information to third parties except as described in this policy.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Information is shared only with authorized admin users</li>
                <li>• We may share data with service providers who assist in our operations</li>
                <li>• We may disclose information if required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your information.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Encryption of sensitive data</li>
                <li>• Secure authentication systems</li>
                <li>• Regular security audits</li>
                <li>• Access controls and monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to access, update, or delete your information. Contact us for assistance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this privacy policy, please contact our admin team.
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
