import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ShieldAlert, CheckCircle2, UserX, Clock, UserCheck } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { adminService } from '../../services/adminService.js';
import { formatDateShort } from '../../utils/formatters.js';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalOrganizers: 0, verifiedOrganizers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoading(true);
      try {
        const data = await adminService.getUsersList({ query: searchQuery, roleFilter });
        const mData = await adminService.getPlatformMetrics();
        if (active) {
          setUsersList(data || []);
          setMetrics(mData);
        }
      } catch (err) {
        console.error('Error loading admin users list:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(loadUsers, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, roleFilter]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={22} className="text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              User & Account Directory
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Search registered athlete players, student participants, and organizers.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Users</span>
          <span className="text-2xl font-800 text-white">{metrics.totalUsers}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Organizers</span>
          <span className="text-2xl font-800 text-amber-400">{metrics.totalOrganizers}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Verified Organizers</span>
          <span className="text-2xl font-800 text-green-400">{metrics.verifiedOrganizers}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Pending Applications</span>
          <span className="text-2xl font-800 text-amber-400">{metrics.pendingApplicationsCount || 0}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-72 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 rounded-[8px] px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 capitalize"
        >
          <option value="all">All Roles</option>
          <option value="user">Athlete Users</option>
          <option value="organizer">Organizers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <SectionSkeleton count={4} />
      ) : usersList.length > 0 ? (
        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-700 uppercase tracking-wider text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">City Base</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-600">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-700 text-white">{usr.full_name || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">{usr.email || 'N/A'}</td>
                    <td className="py-3.5 px-4">{usr.city_name || 'Coimbatore'}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-800 ${
                        usr.role === 'admin'
                          ? 'bg-red-500/20 text-red-400'
                          : usr.role === 'organizer'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {usr.role || 'User'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">{formatDateShort(usr.created_at)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-green-400 font-700 text-[11px] uppercase tracking-wide">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No registered accounts match your search filters."
        />
      )}
    </div>
  );
}
