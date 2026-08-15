import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Users, QrCode, Plus, CheckCircle2, Clock, DollarSign,
  ArrowRight, Edit3, Eye, AlertCircle, FileText, BarChart3
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import VerifiedBadge from '../../components/organizer/VerifiedBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { organizerService } from '../../services/organizerService.js';
import { formatPrice, formatDateShort } from '../../utils/formatters.js';

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    totalRegistrations: 0,
    checkedInCount: 0,
    totalRevenue: 0,
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!user) return;
      setLoading(true);

      try {
        const data = await organizerService.getDashboardMetrics(user.id);
        if (active) setMetrics(data);
      } catch (err) {
        console.error('Error loading organizer dashboard:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [user]);

  // Categorize events
  const today = new Date();
  const upcomingEvents = metrics.events.filter((e) => new Date(e.end_date || e.start_date) >= today && e.status !== 'draft' && e.status !== 'rejected');
  const finishedEvents = metrics.events.filter((e) => new Date(e.end_date || e.start_date) < today && e.status === 'published');
  const draftEvents = metrics.events.filter((e) => e.status === 'draft');
  const pendingReviewEvents = metrics.events.filter((e) => e.status === 'pending_review');
  const rejectedEvents = metrics.events.filter((e) => e.status === 'rejected');

  const displayedEvents =
    tab === 'upcoming'
      ? upcomingEvents
      : tab === 'finished'
      ? finishedEvents
      : tab === 'drafts'
      ? draftEvents
      : tab === 'pending'
      ? pendingReviewEvents
      : tab === 'rejected'
      ? rejectedEvents
      : metrics.events;

  // Needs Attention Items
  const needsAttentionEvents = metrics.events.filter(
    (e) => e.status === 'pending_review' || e.status === 'changes_requested' || e.status === 'draft'
  );

  return (
    <div className="kas-container py-8 lg:py-12 space-y-8 max-w-6xl">
      {/* ── 1. Dashboard Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Organizer Operations Dashboard
            </h1>
            <VerifiedBadge size="sm" />
          </div>
          <p className="text-sm text-neutral-500">
            Real-time tournament analytics, athlete registration progress, check-in operations, and captured revenues.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/organizer/events/create')}
          icon={<Plus size={18} />}
          className="font-800 shadow-md"
        >
          Create New Event
        </Button>
      </div>

      {/* ── 2. Operational KPI Cards ── */}
      {loading ? (
        <SectionSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Total Events</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-800 text-neutral-900">{metrics.totalEvents}</span>
              <span className="text-xs text-green-600 font-700">{metrics.publishedEvents} Published</span>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Total Registrations</span>
            <span className="text-2xl sm:text-3xl font-800 text-neutral-900">{metrics.totalRegistrations}</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Checked In Athletes</span>
            <span className="text-2xl sm:text-3xl font-800 text-green-600">{metrics.checkedInCount}</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Captured Revenue</span>
            <span className="text-2xl sm:text-3xl font-800 text-amber-600">{formatPrice(metrics.totalRevenue)}</span>
          </div>
        </div>
      )}

      {/* ── 3. Needs Attention Section ── */}
      {!loading && needsAttentionEvents.length > 0 && (
        <div className="bg-amber-50 rounded-[16px] border border-amber-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-800 text-xs uppercase tracking-wider">
            <AlertCircle size={16} className="text-amber-600" />
            <span>NEEDS YOUR ATTENTION ({needsAttentionEvents.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-800">
            {needsAttentionEvents.map((evt) => (
              <div key={evt.id} className="bg-white p-3.5 rounded-[10px] border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-800 text-neutral-900 block">{evt.title}</span>
                  <span className="text-neutral-500 text-[11px] capitalize">
                    {evt.status === 'pending_review'
                      ? 'Awaiting Admin Approval'
                      : evt.status === 'draft'
                      ? 'Draft — Ready for Submission'
                      : 'Changes Requested'}
                  </span>
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigate(`/organizer/events/${evt.id}/edit`)}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Tournament Events Management List & Tabs ── */}
      <div className="bg-white rounded-[20px] border border-neutral-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <h2 className="font-800 text-neutral-900 text-lg">My Sports Tournaments</h2>

          {/* Categorization Tabs */}
          <div className="flex border-b sm:border-b-0 border-neutral-200 gap-3 overflow-x-auto scrollbar-hidden">
            {[
              { id: 'upcoming', label: `Upcoming (${upcomingEvents.length})` },
              { id: 'finished', label: `Finished (${finishedEvents.length})` },
              { id: 'drafts', label: `Drafts (${draftEvents.length})` },
              { id: 'pending', label: `Pending Review (${pendingReviewEvents.length})` },
              { id: 'rejected', label: `Rejected (${rejectedEvents.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-1.5 px-3 rounded-[8px] text-xs font-700 whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 font-800'
                    : 'text-neutral-500 hover:text-neutral-900 bg-neutral-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {displayedEvents.length > 0 ? (
          <div className="space-y-4">
            {displayedEvents.map((evt) => {
              const maxCap = Number(evt.max_participants || 200);
              const regCount = evt.registrationsCount || 0;
              const fillPct = Math.min(100, Math.round((regCount / maxCap) * 100));
              const isCheckInRequired = evt.check_in_required !== false;

              return (
                <div
                  key={evt.id}
                  className="p-5 rounded-[16px] bg-neutral-50 border border-neutral-200 space-y-4 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={evt.image_url}
                        alt={evt.title}
                        className="w-16 h-16 rounded-[12px] object-cover bg-neutral-200 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-800 text-amber-700 uppercase tracking-wide bg-amber-100 px-2 py-0.5 rounded-[4px]">
                            {evt.sport_name}
                          </span>
                          <Badge
                            variant={evt.status === 'published' ? 'success' : evt.status === 'draft' ? 'warning' : 'neutral'}
                            size="sm"
                          >
                            {evt.status.toUpperCase().replace('_', ' ')}
                          </Badge>
                        </div>

                        <h3 className="font-800 text-neutral-900 text-base">{evt.title}</h3>

                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <span>{formatDateShort(evt.start_date)}</span>
                          <span>•</span>
                          <span>{evt.venue_name}, {evt.city_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/organizer/events/${evt.id}/analytics`)}
                        icon={<BarChart3 size={14} />}
                      >
                        Analytics
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/organizer/events/${evt.id}/registrations`)}
                        icon={<Users size={14} />}
                      >
                        Participants
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/organizer/events/${evt.id}/check-in`)}
                        icon={<QrCode size={14} />}
                      >
                        Check-In
                      </Button>

                      {evt.status === 'published' && (
                        <Link
                          to={`/events/${evt.slug}`}
                          className="p-2 rounded-[8px] border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-white"
                          title="View Public Event Page"
                        >
                          <Eye size={16} />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Visual Registration Progress & Check-In Status Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-200/80 text-xs">
                    {/* Registration Capacity Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-700 text-neutral-800">
                        <span>Registration Capacity</span>
                        <span>{regCount} / {maxCap} ({fillPct}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Check-in Attendance Status */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-700 text-neutral-800">
                        <span>Check-In Attendance</span>
                        {isCheckInRequired ? (
                          <span>{evt.checkedInCount || 0} / {regCount} Checked In</span>
                        ) : (
                          <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-800 uppercase">
                            Check-in Not Required
                          </span>
                        )}
                      </div>
                      {isCheckInRequired && (
                        <div className="w-full h-2.5 rounded-full bg-neutral-200 overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.round(((evt.checkedInCount || 0) / Math.max(1, regCount)) * 100))}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No events in this view"
            description="There are currently no tournaments matching the selected tab category."
            action={() => navigate('/organizer/events/create')}
            actionLabel="Create Event"
          />
        )}
      </div>
    </div>
  );
}
