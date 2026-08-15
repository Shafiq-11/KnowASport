import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, MapPin, Users, DollarSign, QrCode, ArrowLeft, BarChart3, CheckCircle2, AlertCircle
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useEventDetail } from '../../hooks/useEvents.js';
import { organizerService } from '../../services/organizerService.js';
import { formatDate, formatPrice } from '../../utils/formatters.js';

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
  const paidRegs = registrations.filter((r) => r.payment_status === 'paid' || r.payment_status === 'not_required');
  const checkedInRegs = registrations.filter((r) => r.checkin_status === 'checked_in');
  const totalRev = paidRegs.reduce((sum, r) => sum + Number(r.total_fee || event?.entry_fee || 0), 0);
  const capacityPct = Math.min(100, Math.round((totalRegs / Math.max(1, event?.max_participants || 100)) * 100));

  return (
    <div className="kas-container py-8 lg:py-12 max-w-5xl space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <span className="text-xs font-700 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-[6px]">
          Tournament Analytics
        </span>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-700 text-amber-600 uppercase tracking-wider">{event?.sport_name}</span>
        <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight mt-1">
          {event?.title || 'Event Analytics'}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {event?.venue_name}, {event?.city_name} • Start Date: {formatDate(event?.start_date)}
        </p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <SectionSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Total Registrations</span>
            <span className="text-2xl font-800 text-neutral-900">{totalRegs} / {event?.max_participants || 100}</span>
            <span className="text-[11px] text-amber-600 font-700 block">{capacityPct}% Capacity Filled</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Paid / Free Confirmed</span>
            <span className="text-2xl font-800 text-green-600">{paidRegs.length}</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Checked In Athletes</span>
            <span className="text-2xl font-800 text-green-700">{checkedInRegs.length}</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Captured Revenue</span>
            <span className="text-2xl font-800 text-amber-600">{formatPrice(totalRev)}</span>
          </div>
        </div>
      )}

      {/* Visual Progress Breakdown */}
      <div className="bg-white rounded-[20px] border border-neutral-200 p-6 space-y-6 shadow-sm">
        <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
          <BarChart3 size={18} className="text-amber-500" />
          Event Performance Overview
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-700 text-neutral-900 mb-1">
              <span>Capacity Progress</span>
              <span>{totalRegs} / {event?.max_participants || 100} Registered</span>
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${capacityPct}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-700 text-neutral-900 mb-1">
              <span>Check-In Attendance Ratio</span>
              <span>{checkedInRegs.length} / {Math.max(1, totalRegs)} Checked In</span>
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.round((checkedInRegs.length / Math.max(1, totalRegs)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
