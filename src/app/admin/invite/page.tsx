'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Invitation {
  _id: string;
  email: string;
  invitation: {
    company: string;
    role: string;
    invitedAt: string;
    expiresAt: string;
  };
}

export default function InvitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchInvitations();
  }, [session, status, router]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !company) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Invitation sent successfully!');
        setEmail('');
        setCompany('');
        setRole('user');
        fetchInvitations(); // Refresh the list
      } else {
        setMessage(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Invitations</h1>
            
            {/* Invitation Form */}
            <form onSubmit={handleSendInvitation} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@company.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company Name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              
              {message && (
                <div className={`px-4 py-3 rounded-md ${
                  message.includes('successfully') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>

            {/* Pending Invitations */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations</h2>
              {invitations.length === 0 ? (
                <p className="text-gray-500">No pending invitations</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invited
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invitations.map((invitation) => (
                        <tr key={invitation._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invitation.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invitation.invitation.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              invitation.invitation.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : invitation.invitation.role === 'viewer'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {invitation.invitation.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invitation.invitation.invitedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invitation.invitation.expiresAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
