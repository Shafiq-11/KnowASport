import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, MapPin, Users, User, DollarSign, QrCode, ArrowLeft,
  BarChart3, CheckCircle2, AlertCircle, Clock, ShieldCheck, Download
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useEventDetail } from '../../hooks/useEvents.js';
import { organizerService } from '../../services/organizerService.js';
import { formatDate, formatPrice, formatDateShort } from '../../utils/formatters.js';

const PLATFORM_FEE_RATE = 0.04;

export default function OrganizerEventAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event } = useEventDetail(id);

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!user || !id) return;
      setLoading(true);

      try {
        const regs = await organizerService.getEventRegistrations(id, user.id);
        if (active) setRegistrations(regs || []);
      } catch (err) {
        console.error('Error fetching analytics registrations:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id, user]);

  const totalRegs = registrations.length;
  const confirmedRegs = registrations.filter((r) => r.status === 'confirmed' || r.payment_status === 'paid');
  const pendingRegs = registrations.filter((r) => r.payment_status === 'pending' || r.status === 'pending_payment');
  const checkedInRegs = registrations.filter((r) => r.checkin_status === 'checked_in');

  // Captured payment calculation
  const totalGrossRevenue = confirmedRegs.reduce((sum, r) => sum + Number(r.total_fee || event?.entry_fee || 0), 0);
  const platformFee = Math.round(totalGrossRevenue * PLATFORM_FEE_RATE);
  const organizerAmount = totalGrossRevenue - platformFee;

  const maxCap = Number(event?.max_participants || 100);
  const capacityPct = Math.min(100, Math.round((totalRegs / Math.max(1, maxCap)) * 100));
  const isCheckInRequired = event?.check_in_required !== false;
  const isTeam = event?.participation_type === 'team';

  // Group registrations by day
  const dailyRegMap = {};
  registrations.forEach((r) => {
    const d = (r.created_at || new Date().toISOString()).split('T')[0];
    dailyRegMap[d] = (dailyRegMap[d] || 0) + 1;
  });
  const dailyTimeline = Object.entries(dailyRegMap).map(([date, count]) => ({ date, count }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Events
        </Link>
        <span className="text-xs font-700 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-[6px]">
          Tournament Performance Drill-Down
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-800 text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
              {event?.sport_name || 'Sports'}
            </span>
            <span
              className={`text-[10px] font-800 uppercase px-2 py-0.5 rounded ${
                isTeam ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isTeam ? `TEAM (${event?.team_size || 7})` : 'INDIVIDUAL'}
            </span>
            <Badge
              variant={event?.status === 'published' ? 'success' : event?.status === 'draft' ? 'neutral' : 'warning'}
              size="sm"
            >
              {event?.status ? event.status.toUpperCase() : 'PUBLISHED'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight mt-1.5">
            {event?.title || 'Event Analytics'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {event?.venue_name}, {event?.city_name} • Start: {formatDate(event?.start_date)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/organizer/events/${id}/registrations`)}
            icon={<Users size={14} />}
          >
            Manage Participants
          </Button>
          {isCheckInRequired && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/organizer/events/${id}/check-in`)}
              icon={<QrCode size={14} />}
            >
              Check-In Portal
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <SectionSkeleton count={4} />
      ) : (
        <>
          {/* ── 1. Top KPI Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Registrations */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider block">Registrations</span>
              <span className="text-2xl font-800 text-neutral-900 block">{totalRegs} / {maxCap}</span>
              <span className="text-[11px] text-amber-700 font-700 block">{capacityPct}% Capacity Filled</span>
            </div>

            {/* Confirmed Entries */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider block">Confirmed Entries</span>
              <span className="text-2xl font-800 text-emerald-600 block">{confirmedRegs.length}</span>
              <span className="text-[11px] text-neutral-400 font-600 block">{pendingRegs.length} Pending Payment</span>
            </div>

            {/* Check-In Status */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider block">Check-In Attendance</span>
              {isCheckInRequired ? (
                <>
                  <span className="text-2xl font-800 text-green-700 block">{checkedInRegs.length}</span>
                  <span className="text-[11px] text-green-600 font-700 block">
                    {totalRegs > 0 ? Math.round((checkedInRegs.length / totalRegs) * 100) : 0}% of registered
                  </span>
                </>
              ) : (
                <div className="pt-1">
                  <span className="text-xs font-700 text-amber-800 bg-amber-50 px-2 py-1 rounded block">
                    Check-in Not Required
                  </span>
                </div>
              )}
            </div>

            {/* Captured Revenue */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider block">Captured Revenue</span>
              <span className="text-2xl font-800 text-neutral-900 block">{formatPrice(totalGrossRevenue)}</span>
              <span className="text-[11px] text-neutral-400 font-600 block">From confirmed payments</span>
            </div>
          </div>

          {/* ── 2. Financial Settlement Breakdown ── */}
          <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-4">
            <h2 className="font-800 text-neutral-900 text-sm">Financial Revenue Settlement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[11px] font-700 text-neutral-500 uppercase block">Total Registration Payments</span>
                <span className="text-xl font-800 text-neutral-900 block">{formatPrice(totalGrossRevenue)}</span>
                <span className="text-[10px] text-neutral-400 block">Gross entry fees paid</span>
              </div>

              <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[11px] font-700 text-neutral-500 uppercase block">KnowASport Platform Fee</span>
                <span className="text-xl font-800 text-neutral-700 block">{formatPrice(platformFee)}</span>
                <span className="text-[10px] text-neutral-400 block">4% standard technology fee</span>
              </div>

              <div className="p-4 rounded-[12px] bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-[11px] font-800 text-amber-900 uppercase block">Organizer Net Amount</span>
                <span className="text-xl font-800 text-amber-700 block">{formatPrice(organizerAmount)}</span>
                <span className="text-[10px] text-amber-800 block">Attributable organizer earnings</span>
              </div>
            </div>
          </div>

          {/* ── 3. Visual Capacity & Check-in Progress ── */}
          <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-5">
            <h2 className="font-800 text-neutral-900 text-sm">Capacity & Attendance Ratios</h2>

            <div className="space-y-4 text-xs">
              {/* Capacity Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-700 text-neutral-800">
                  <span>Registration Capacity Fill</span>
                  <span>{totalRegs} / {maxCap} Athletes ({capacityPct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${capacityPct}%` }} />
                </div>
              </div>

              {/* Check-In Progress */}
              {isCheckInRequired && (
                <div className="space-y-1.5">
                  <div className="flex justify-between font-700 text-neutral-800">
                    <span>Verified On-Site Check-In Ratio</span>
                    <span>{checkedInRegs.length} / {totalRegs} Verified ({totalRegs > 0 ? Math.round((checkedInRegs.length / totalRegs) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalRegs > 0 ? Math.round((checkedInRegs.length / totalRegs) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Participant Roster Preview ── */}
          <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-800 text-neutral-900 text-sm">Participant Registrations ({registrations.length})</h3>
              <Button
                size="xs"
                variant="outline"
                onClick={() => navigate(`/organizer/events/${id}/registrations`)}
              >
                View Full Roster
              </Button>
            </div>

            {registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-700 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Participant</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {registrations.slice(0, 8).map((reg) => {
                      const name = reg.participants?.[0]?.full_name || reg.team_name || reg.full_name || 'Participant';
                      return (
                        <tr key={reg.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-800 text-neutral-900">{name}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-700 uppercase bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                              {reg.participation_type || (isTeam ? 'team' : 'individual')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={reg.payment_status === 'paid' ? 'success' : reg.payment_status === 'failed' ? 'danger' : 'neutral'}
                              size="xs"
                            >
                              {reg.payment_status?.toUpperCase() || 'PAID'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            {isCheckInRequired ? (
                              <span className={`text-[10px] font-700 ${reg.checkin_status === 'checked_in' ? 'text-green-700' : 'text-neutral-400'}`}>
                                {reg.checkin_status === 'checked_in' ? 'Checked In' : 'Not Checked In'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400">N/A</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-400 text-[11px]">
                            {formatDateShort(reg.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 py-6 text-center">No participants registered yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
