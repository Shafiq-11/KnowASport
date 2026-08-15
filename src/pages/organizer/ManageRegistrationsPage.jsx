import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, QrCode, Search, Calendar, MapPin, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useEventDetail } from '../../hooks/useEvents.js';
import { organizerService } from '../../services/organizerService.js';
import { formatDateShort, formatPrice } from '../../utils/formatters.js';

export default function ManageRegistrationsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event } = useEventDetail(id);

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  useEffect(() => {
    let active = true;

    async function loadRegs() {
      if (!user || !id) return;
      setLoading(true);

      try {
        const list = await organizerService.getEventRegistrations(id, user.id);
        if (active) setRegistrations(list || []);
      } catch (err) {
        console.error('Error fetching event registrations:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRegs();

    return () => {
      active = false;
    };
  }, [id, user]);

  const filtered = registrations.filter((r) => {
    // Filter Tab
    if (filterTab === 'confirmed' && r.status !== 'confirmed') return false;
    if (filterTab === 'pending' && r.payment_status !== 'pending') return false;
    if (filterTab === 'checked_in' && r.checkin_status !== 'checked_in') return false;
    if (filterTab === 'cancelled' && r.status !== 'cancelled') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRegNum = r.registration_number?.toLowerCase().includes(q);
      const matchTeam = r.team_name?.toLowerCase().includes(q);
      const matchName = r.participants?.some((p) => p.full_name?.toLowerCase().includes(q));
      return matchRegNum || matchTeam || matchName;
    }

    return true;
  });

  return (
    <div className="kas-container py-8 lg:py-12 max-w-5xl space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Organizer Dashboard
        </Link>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/organizer/events/${id}/check-in`)}
          icon={<QrCode size={16} />}
        >
          Open Check-In Scanner
        </Button>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-700 text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-[6px]">
          {event?.sport_name || 'Tournament'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight mt-1">
          {event?.title || 'Event Registrations'}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {registrations.length} Total Registrations • {registrations.filter((r) => r.checkin_status === 'checked_in').length} Checked In
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, team, or KAS ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 gap-3 overflow-x-auto w-full sm:w-auto scrollbar-hidden">
          {[
            { id: 'all', label: `All (${registrations.length})` },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'pending', label: 'Pending Payment' },
            { id: 'checked_in', label: 'Checked In' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`py-2 text-xs font-700 border-b-2 whitespace-nowrap transition-colors ${
                filterTab === tab.id
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations List */}
      {loading ? (
        <SectionSkeleton count={3} />
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-[20px] border border-neutral-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-neutral-100">
            {filtered.map((reg) => (
              <div key={reg.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-800 font-mono text-neutral-900">{reg.registration_number}</span>
                    <Badge variant={reg.status === 'confirmed' ? 'success' : reg.status === 'cancelled' ? 'danger' : 'warning'} size="sm">
                      {reg.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                    {reg.checkin_status === 'checked_in' && (
                      <span className="text-[11px] font-700 text-green-700 bg-green-100 px-2 py-0.5 rounded-[4px]">
                        ✓ CHECKED IN
                      </span>
                    )}
                  </div>

                  <h3 className="font-800 text-neutral-900 text-base">
                    {reg.team_name ? `Team: ${reg.team_name}` : reg.participants?.[0]?.full_name || 'Individual Athlete'}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="capitalize">{reg.participation_type} ({reg.team_size || 1} Players)</span>
                    {reg.participants?.[0]?.phone && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{reg.participants[0].phone}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-600 text-neutral-400 block">Payment Status</span>
                  <span className={`text-xs font-700 capitalize ${reg.payment_status === 'paid' || reg.payment_status === 'not_required' ? 'text-green-600' : 'text-amber-700'}`}>
                    {reg.payment_status.replace('_', ' ')} ({formatPrice(reg.total_fee)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-neutral-200 p-8 text-center space-y-3">
          <EmptyState
            icon={Users}
            title="No registrations found"
            description="No registrations match your active search or filter selection."
          />
        </div>
      )}
    </div>
  );
}
