'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface CompanyDomain {
  _id: string;
  domain: string;
  companyName: string;
  isActive: boolean;
  createdAt: string;
  addedBy: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [domains, setDomains] = useState<CompanyDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.isAdmin) {
      router.push('/login');
      return;
    }

    fetchDomains();
  }, [session, status, router]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/admin/domains');
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain || !newCompanyName) return;

    setAddingDomain(true);
    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.toLowerCase(),
          companyName: newCompanyName,
        }),
      });

      if (response.ok) {
        setNewDomain('');
        setNewCompanyName('');
        fetchDomains();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add domain');
      }
    } catch (error) {
      alert('Error adding domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleToggleDomain = async (domainId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchDomains();
      }
    } catch (error) {
      alert('Error updating domain');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDomains();
      }
    } catch (error) {
      alert('Error deleting domain');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome, {session?.user?.name}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/projects"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Go to Editor
              </Link>
              <button
                onClick={() => signOut()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Domain */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Company Domain</h2>
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                  Domain *
                </label>
                <input
                  type="text"
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addingDomain}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {addingDomain ? 'Adding...' : 'Add Domain'}
              </button>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/projects"
                className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center"
              >
                Video Editor
              </Link>
              <Link
                href="/admin/users"
                className="block w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 text-center"
              >
                View Users
              </Link>
              <Link
                href="/admin/analytics"
                className="block w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-center"
              >
                Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Company Domains List */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Approved Company Domains</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {domains.map((domain) => (
                  <tr key={domain._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {domain.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      @{domain.domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        domain.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {domain.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleDomain(domain._id, domain.isActive)}
                        className={`text-sm px-3 py-1 rounded ${
                          domain.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {domain.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteDomain(domain._id)}
                        className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
