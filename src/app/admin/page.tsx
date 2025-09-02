'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogoIcons } from '@/components/shared/logos';

interface CompanyDomain {
  id: string;
  domain: string;
  companyName: string;
  isActive: boolean;
  createdAt: string;
  addedBy: string;
}

interface AnalyticsData {
  stats: {
    totalUsers: number;
    totalDownloads: number;
    totalProjects: number;
    totalCost: number;
    totalVideoDuration: number;
  };
  domainStats: Array<{
    domain: string;
    totalUsers: number;
    totalDownloads: number;
    totalCost: number;
  }>;
  activities: Array<{
    userEmail: string;
    companyDomain: string;
    activityType: string;
    projectName: string;
    cost: number;
    createdAt: string;
  }>;
  users: Array<{
    email: string;
    name: string;
    companyDomain: string;
    createdAt: string;
  }>;
}

interface UserDetail {
  email: string;
  name: string;
  companyDomain: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [domains, setDomains] = useState<CompanyDomain[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.isAdmin) {
      router.push('/login');
      return;
    }

    fetchDomains();
    fetchAnalytics();
    fetchUserDetails();
  }, [session, status, router, selectedDomain]);

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

  const fetchAnalytics = async () => {
    try {
      const url = selectedDomain 
        ? `/api/admin/analytics?domain=${selectedDomain}`
        : '/api/admin/analytics';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const url = selectedDomain 
        ? `/api/admin/users?domain=${selectedDomain}`
        : '/api/admin/users';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.users);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center">
                <LogoIcons.scalezStatic />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome, {session?.user?.name}</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/projects"
                className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
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
          {/* Add New Domain */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addingDomain}
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {addingDomain ? 'Adding...' : 'Add Domain'}
              </button>
            </form>
          </div>

          {/* Company Domains List */}
          <div className="bg-gray-50 rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Approved Company Domains</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
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
                    <tr key={domain.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {domain.companyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        @{domain.domain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          domain.isActive 
                            ? 'bg-gray-100 text-gray-800' 
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
                          onClick={() => handleToggleDomain(domain.id, domain.isActive)}
                          className={`text-sm px-3 py-1 rounded ${
                            domain.isActive
                              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {domain.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteDomain(domain.id)}
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

          {/* Analytics Overview */}
          {analytics && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Domains</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.domain}>
                      {domain.companyName} ({domain.domain})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{analytics.stats.totalUsers || 0}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{analytics.stats.totalDownloads || 0}</div>
                  <div className="text-sm text-gray-600">Video Downloads</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{analytics.stats.totalProjects || 0}</div>
                  <div className="text-sm text-gray-600">Projects Created</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">${(analytics.stats.totalCost || 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
              </div>

              {/* Domain Stats */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Statistics</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2">Domain</th>
                        <th className="text-left py-2">Users</th>
                        <th className="text-left py-2">Downloads</th>
                        <th className="text-left py-2">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.domainStats.map((stat) => (
                        <tr key={stat.domain} className="border-b border-gray-100">
                          <td className="py-2">{stat.domain}</td>
                          <td className="py-2">{stat.totalUsers || 0}</td>
                          <td className="py-2">{stat.totalDownloads || 0}</td>
                          <td className="py-2">${(stat.totalCost || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>
                <div className="space-y-4">
                  {userDetails.map((user) => (
                    <div key={user.email} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-600">{user.name} • {user.companyDomain}</div>
                          <div className="text-xs text-gray-500">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


            </div>
          )}

        
      </div>
    </div>
  );
}
