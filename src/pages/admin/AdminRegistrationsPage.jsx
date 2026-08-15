import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Search, CheckCircle2, Clock, XCircle, Filter, RotateCcw } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { adminService } from '../../services/adminService.js';
import { formatDateShort, formatPrice } from '../../utils/formatters.js';

export default function AdminRegistrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get('status') || 'all';
  const sportParam = searchParams.get('sport') || 'all';
  const queryParam = searchParams.get('q') || '';

  const [registrations, setRegistrations] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [sportFilter, setSportFilter] = useState(sportParam);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const data = await adminService.getRegistrationsList({
          query: searchQuery,
          statusFilter,
          sportFilter,
        });

        if (active) {
          setRegistrations(data || []);
          setMetrics({
            total: data.length,
            confirmed: data.filter((r) => r.status === 'confirmed').length,
            pending: data.filter((r) => r.payment_status === 'pending').length,
            cancelled: data.filter((r) => r.status === 'cancelled').length,
          });
        }
      } catch (err) {
        console.error('Error loading admin registrations:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(loadData, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, statusFilter, sportFilter]);

  // Sync state to URL search parameters
  const updateFilters = (newStatus, newSport, newQuery) => {
    const params = {};
    if (newStatus !== 'all') params.status = newStatus;
    if (newSport !== 'all') params.sport = newSport;
    if (newQuery.trim()) params.q = newQuery;
    setSearchParams(params, { replace: true });
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    updateFilters(val, sportFilter, searchQuery);
  };

  const handleSportChange = (val) => {
    setSportFilter(val);
    updateFilters(statusFilter, val, searchQuery);
  };

  const handleQueryChange = (val) => {
    setSearchQuery(val);
    updateFilters(statusFilter, sportFilter, val);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSportFilter('all');
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={22} className="text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Event Registration Audit Trail
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Search and verify athlete registration codes, squad rosters, and settlement statuses.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Registrations</span>
          <span className="text-2xl font-800 text-white">{metrics.total}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Confirmed Passes</span>
          <span className="text-2xl font-800 text-green-400">{metrics.confirmed}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Pending Payment</span>
          <span className="text-2xl font-800 text-amber-400">{metrics.pending}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Cancelled</span>
          <span className="text-2xl font-800 text-neutral-400">{metrics.cancelled}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-72 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search registration ID, player, team..."
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-[8px] px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending Payment</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sportFilter}
            onChange={(e) => handleSportChange(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-[8px] px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 capitalize"
          >
            <option value="all">All Sports</option>
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="badminton">Badminton</option>
            <option value="kabaddi">Kabaddi</option>
            <option value="volleyball">Volleyball</option>
          </select>

          {(statusFilter !== 'all' || sportFilter !== 'all' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-neutral-800 hover:bg-neutral-700 text-xs font-700 text-neutral-300 transition-colors"
            >
              <RotateCcw size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Registrations Data Table */}
      {loading ? (
        <SectionSkeleton count={4} />
      ) : registrations.length > 0 ? (
        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-700 uppercase tracking-wider text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Registration Code</th>
                  <th className="py-3 px-4">Tournament Event</th>
                  <th className="py-3 px-4">Participant / Squad</th>
                  <th className="py-3 px-4">Entry Fee</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-600">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-700 text-amber-400">{reg.registration_number}</td>
                    <td className="py-3.5 px-4 font-700 text-white">{reg.event?.title || 'Sports Event'}</td>
                    <td className="py-3.5 px-4">{reg.team_name || reg.captain_name || 'Individual Player'}</td>
                    <td className="py-3.5 px-4">{reg.total_fee === 0 ? 'Free' : formatPrice(reg.total_fee || 0)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-800 uppercase ${
                        reg.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {reg.payment_status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-800 uppercase ${
                        reg.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="No registrations found"
          description="No tournament registrations match your selected search and filter criteria."
        />
      )}
    </div>
  );
}
