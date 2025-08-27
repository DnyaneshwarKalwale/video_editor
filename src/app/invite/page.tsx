'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      return;
    }

    // You could fetch invitation details here if needed
  }, [token]);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login with success message
        router.push('/login?message=invitation-accepted');
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600 mb-8">
            This invitation link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">You're Invited!</h1>
          <p className="text-gray-600">
            Complete your account setup to join Scalez
          </p>
        </div>

        <form onSubmit={handleAcceptInvitation} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up account...' : 'Accept Invitation'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By accepting this invitation, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
