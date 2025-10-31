import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [auditStats, setAuditStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    todayLogins: 0,
    todaySignups: 0,
    weekLogins: 0,
    weekSignups: 0,
    monthLogins: 0,
    monthSignups: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setAuditStats({
      totalUsers: 247,
      totalAdmins: 3,
      todayLogins: 24,
      todaySignups: 5,
      weekLogins: 189,
      weekSignups: 31,
      monthLogins: 742,
      monthSignups: 87,
    });

    setChartData([
      { date: 'Sep 09', logins: 15, signups: 2 },
      { date: 'Sep 10', logins: 23, signups: 4 },
      { date: 'Sep 11', logins: 18, signups: 1 },
      { date: 'Sep 12', logins: 32, signups: 6 },
      { date: 'Sep 13', logins: 27, signups: 3 },
      { date: 'Sep 14', logins: 21, signups: 5 },
      { date: 'Sep 15', logins: 19, signups: 2 },
      { date: 'Sep 16', logins: 28, signups: 4 },
      { date: 'Sep 17', logins: 34, signups: 7 },
      { date: 'Sep 18', logins: 25, signups: 3 },
      { date: 'Sep 19', logins: 29, signups: 5 },
      { date: 'Sep 20', logins: 31, signups: 6 },
      { date: 'Sep 21', logins: 26, signups: 4 },
      { date: 'Sep 22', logins: 24, signups: 5 },
    ]);

    setUsers([
      { id: '1', email: 'john.doe@example.com', full_name: 'John Doe', role: 'admin', created_at: '2024-01-15T10:00:00Z' },
      { id: '2', email: 'jane.smith@example.com', full_name: 'Jane Smith', role: 'user', created_at: '2024-02-20T14:30:00Z' },
      { id: '3', email: 'mike.johnson@example.com', full_name: 'Mike Johnson', role: 'user', created_at: '2024-03-10T09:15:00Z' },
      { id: '4', email: 'sarah.wilson@example.com', full_name: 'Sarah Wilson', role: 'user', created_at: '2024-04-05T16:45:00Z' },
    ]);

    setLoading(false);
  }, []);

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 text-gray-900">
              <span className="text-lg font-semibold">Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Back to Features</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="text-2xl font-bold text-gray-900">{auditStats.totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Admins</div>
            <div className="text-2xl font-bold text-gray-900">{auditStats.totalAdmins}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Today's Logins</div>
            <div className="text-2xl font-bold text-gray-900">{auditStats.todayLogins}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Weekly Activity</div>
            <div className="text-2xl font-bold text-gray-900">{auditStats.weekLogins}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">User Management</div>
              <div className="text-sm text-gray-500">Manage users and their roles</div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add User</button>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{u.full_name || 'No name'}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                  <div className="text-xs text-gray-500">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                  <select
                    value={u.role}
                    onChange={() => {}}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-lg font-semibold text-gray-900 mb-2">Daily Activity (Sample)</div>
          <div className="grid grid-cols-14 gap-1 text-xs text-gray-600">
            {chartData.map((d, i) => (
              <div key={i} className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded">
                <div className="font-medium text-gray-900">{d.date}</div>
                <div>Logins: {d.logins}</div>
                <div>Signups: {d.signups}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
