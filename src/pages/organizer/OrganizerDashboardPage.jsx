import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Users, QrCode, Plus, CheckCircle2, Clock, DollarSign,
  ArrowRight, Edit3, Eye, AlertCircle, FileText, BarChart3, TrendingUp,
  TrendingDown, Minus, ShieldCheck, ArrowUpRight, ArrowDownRight, Layers,
  Activity, CheckSquare, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import VerifiedBadge from '../../components/organizer/VerifiedBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { organizerService } from '../../services/organizerService.js';
import { formatPrice, formatDateShort, formatRelativeTime } from '../../utils/formatters.js';

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [preferences, setPreferences] = useState({
    show_revenue_breakdown: true,
    show_registration_trends: true,
    show_sport_performance: true,
    show_checkin_analytics: true,
    show_top_events: true,
    show_recent_registrations: true,
  });
  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '3m' | '6m' | '1y'
  const [chartMode, setChartMode] = useState('revenue'); // 'revenue' | 'registrations'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const [metricsData, prefsData] = await Promise.all([
        organizerService.getDashboardMetrics(user.id, { dateRange }),
        organizerService.getDashboardPreferences(user.id),
      ]);
      setMetrics(metricsData);
      if (prefsData) setPreferences(prefsData);
    } catch (err) {
      console.error('Error loading organizer operations dashboard:', err);
      setError('Unable to load dashboard analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, dateRange]);

  // Needs Attention Events (Pending Review, Changes Requested, Drafts)
  const needsAttentionEvents = metrics?.events?.filter(
    (e) => e.status === 'pending_review' || e.status === 'changes_requested' || e.status === 'draft'
  ) || [];

  // Helper for trend badge
  const renderTrendBadge = (changePct, label) => {
    if (!metrics?.growthComparison?.hasComparisonData || changePct === undefined || changePct === null) {
      return null;
    }

    if (changePct > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-700 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[5px]">
          <ArrowUpRight size={12} /> +{changePct}% {label}
        </span>
      );
    }
    if (changePct < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-700 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-[5px]">
          <ArrowDownRight size={12} /> {changePct}% {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-700 text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-[5px]">
        <Minus size={12} /> No Change
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Sports Operations Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Organizer Dashboard
            </h1>
            <VerifiedBadge size="sm" />
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Overview of your events, registrations and revenue.
          </p>
        </div>

        {/* Date Filter & CTA Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Period Selector */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-[10px] text-xs font-700">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '3m', label: '3M' },
              { id: '6m', label: '6M' },
              { id: '1y', label: '1Y' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDateRange(p.id)}
                className={`py-1.5 px-3 rounded-[7px] transition-colors ${
                  dateRange === p.id
                    ? 'bg-white text-neutral-900 shadow-xs font-800'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/organizer/events/create')}
            icon={<Plus size={16} />}
            className="font-700 shadow-xs"
          >
            Create Event
          </Button>
        </div>
      </div>

      {/* Error Fallback */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-6 text-center space-y-3">
          <AlertCircle size={24} className="text-red-500 mx-auto" />
          <p className="text-xs font-700 text-red-800">{error}</p>
          <Button size="sm" variant="outline" onClick={loadDashboardData}>
            Retry Loading
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <SectionSkeleton count={4} />
          <SectionSkeleton count={2} />
        </div>
      ) : !metrics ? null : (
        <>
          {/* ── 2. Top Metric KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Events */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider">Total Events</span>
                <span className="p-1.5 rounded-[8px] bg-amber-50 text-amber-600">
                  <Trophy size={15} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-800 text-neutral-900">{metrics.totalEvents}</span>
                <span className="text-xs text-neutral-500 font-600">({metrics.publishedEvents} Published)</span>
              </div>
              <div className="text-[11px] text-neutral-500 font-600">
                <span className="text-amber-700 font-700">{metrics.upcomingEvents} Upcoming</span> • {metrics.completedEvents} Completed
              </div>
            </div>

            {/* Total Registrations */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider">Total Registrations</span>
                <span className="p-1.5 rounded-[8px] bg-blue-50 text-blue-600">
                  <Users size={15} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-800 text-neutral-900">{metrics.totalRegistrations}</span>
                {renderTrendBadge(metrics.growthComparison?.registrationChange, 'period')}
              </div>
              <div className="text-[11px] text-neutral-500 font-600">
                <span className="text-green-700 font-700">{metrics.confirmedRegistrations} Confirmed</span> • {metrics.pendingRegistrations} Pending
              </div>
            </div>

            {/* Checked-In Participants */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider">Checked-In Athletes</span>
                <span className="p-1.5 rounded-[8px] bg-green-50 text-green-600">
                  <QrCode size={15} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-800 text-green-600">{metrics.checkedInCount}</span>
                <span className="text-xs text-neutral-500 font-600">({metrics.checkinRate}%)</span>
              </div>
              <div className="text-[11px] text-neutral-500 font-600">
                Of {metrics.totalEligibleForCheckin} eligible participants
              </div>
            </div>

            {/* Captured Revenue */}
            <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-2 shadow-xs hover:border-neutral-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider">Captured Payments</span>
                <span className="p-1.5 rounded-[8px] bg-emerald-50 text-emerald-600">
                  <DollarSign size={15} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-800 text-neutral-900">
                  {formatPrice(metrics.capturedPayments)}
                </span>
                {renderTrendBadge(metrics.growthComparison?.revenueChange, 'period')}
              </div>
              <div className="text-[11px] text-neutral-500 font-600">
                Gross successfully settled entries
              </div>
            </div>
          </div>

          {/* ── 3. Financial & Revenue Breakdown Card ── */}
          {preferences.show_revenue_breakdown && (
            <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h2 className="font-800 text-neutral-900 text-base">Financial Settlement Breakdown</h2>
                  <p className="text-xs text-neutral-500">
                    Gross participant entries, KnowASport service fees, and net organizer earnings.
                  </p>
                </div>

                <span className="text-[11px] font-700 text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-[6px] border border-neutral-100">
                  Authoritative Captured Payments
                </span>
              </div>

              {/* 3-Tier Financial Hierarchy */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Registration Payments */}
                <div className="p-4 rounded-[14px] bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider block">
                    Total Registration Payments
                  </span>
                  <span className="text-2xl font-800 text-neutral-900 block">
                    {formatPrice(metrics.totalRegistrationPayments)}
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Total amount paid by participants for your events.
                  </p>
                </div>

                {/* KnowASport Platform Fees */}
                <div className="p-4 rounded-[14px] bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-neutral-500 uppercase tracking-wider block">
                    Platform / Service Fees
                  </span>
                  <span className="text-2xl font-800 text-neutral-700 block">
                    {formatPrice(metrics.platformFees)}
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Standard KnowASport platform gateway & tech fee (4%).
                  </p>
                </div>

                {/* Organizer Earnings (Net) */}
                <div className="p-4 rounded-[14px] bg-amber-50/70 border border-amber-200 space-y-1">
                  <span className="text-[11px] font-800 text-amber-900 uppercase tracking-wider block">
                    Organizer Amount (Earnings)
                  </span>
                  <span className="text-2xl font-800 text-amber-700 block">
                    {formatPrice(metrics.organizerEarnings)}
                  </span>
                  <p className="text-[11px] text-amber-900/80">
                    Net amount attributable to the organizer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. Needs Attention Action Banner ── */}
          {needsAttentionEvents.length > 0 && (
            <div className="bg-amber-50 rounded-[18px] border border-amber-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-950 font-800 text-xs uppercase tracking-wider">
                  <AlertCircle size={16} className="text-amber-600" />
                  <span>Action Items Requiring Your Attention ({needsAttentionEvents.length})</span>
                </div>
                <Link to="/organizer/events" className="text-xs font-700 text-amber-800 hover:text-amber-950 underline">
                  View in My Events →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {needsAttentionEvents.map((evt) => (
                  <div key={evt.id} className="bg-white p-3.5 rounded-[12px] border border-amber-200/80 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <span className="font-800 text-neutral-900 text-xs block truncate">{evt.title}</span>
                      <span className="text-[11px] text-neutral-500 capitalize block">
                        {evt.status === 'pending_review'
                          ? 'Awaiting Admin Approval'
                          : evt.status === 'changes_requested'
                          ? 'Changes Requested by Admin'
                          : 'Draft — Ready to Submit'}
                      </span>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => navigate(`/organizer/events/${evt.id}`)}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. Operational Trend Charts Section ── */}
          {(preferences.show_registration_trends || preferences.show_revenue_breakdown) && (
            <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h2 className="font-800 text-neutral-900 text-base">Performance Trends Over Time</h2>
                  <p className="text-xs text-neutral-500">
                    Real historical trend analysis for {dateRange.toUpperCase()} duration.
                  </p>
                </div>

                {/* Chart Mode Switcher */}
                <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-[10px] text-xs font-700">
                  <button
                    onClick={() => setChartMode('revenue')}
                    className={`py-1 px-3 rounded-[6px] transition-colors ${
                      chartMode === 'revenue' ? 'bg-white text-neutral-900 shadow-xs font-800' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Revenue Trend (₹)
                  </button>
                  <button
                    onClick={() => setChartMode('registrations')}
                    className={`py-1 px-3 rounded-[6px] transition-colors ${
                      chartMode === 'registrations' ? 'bg-white text-neutral-900 shadow-xs font-800' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Registrations Count
                  </button>
                </div>
              </div>

              {/* Chart Visualizer Container */}
              <div className="pt-2">
                {chartMode === 'revenue' ? (
                  /* Revenue Trend Area / Bars */
                  <div className="space-y-3">
                    <div className="h-48 w-full flex items-end gap-1.5 sm:gap-2 pt-6 px-2">
                      {metrics.revenueTrend.map((item, idx) => {
                        const maxVal = Math.max(...metrics.revenueTrend.map((t) => t.amount), 100);
                        const heightPct = Math.max(8, Math.round((item.amount / maxVal) * 100));

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                            {/* Hover Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                              {item.label}: {formatPrice(item.amount)}
                            </div>

                            {/* Bar Column */}
                            <div
                              className="w-full bg-amber-500 rounded-t-[4px] group-hover:bg-amber-400 transition-all duration-300 min-h-[4px]"
                              style={{ height: `${heightPct}%` }}
                            />
                            {/* Axis Label (show sparser labels on small screens) */}
                            {idx % (dateRange === '7d' ? 1 : dateRange === '30d' ? 5 : 12) === 0 && (
                              <span className="text-[10px] text-neutral-400 font-600 block truncate max-w-[36px]">
                                {item.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100 font-600">
                      <span>Total Captured for Period: <strong>{formatPrice(metrics.revenueTrend.reduce((s, t) => s + t.amount, 0))}</strong></span>
                      <span>Organizer Net: <strong>{formatPrice(metrics.revenueTrend.reduce((s, t) => s + t.organizerAmount, 0))}</strong></span>
                    </div>
                  </div>
                ) : (
                  /* Registrations Trend */
                  <div className="space-y-3">
                    <div className="h-48 w-full flex items-end gap-1.5 sm:gap-2 pt-6 px-2">
                      {metrics.registrationTrend.map((item, idx) => {
                        const maxCount = Math.max(...metrics.registrationTrend.map((t) => t.count), 5);
                        const heightPct = Math.max(8, Math.round((item.count / maxCount) * 100));

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                              {item.label}: {item.count} registrations
                            </div>

                            {/* Bar */}
                            <div
                              className="w-full bg-blue-500 rounded-t-[4px] group-hover:bg-blue-400 transition-all duration-300 min-h-[4px]"
                              style={{ height: `${heightPct}%` }}
                            />

                            {idx % (dateRange === '7d' ? 1 : dateRange === '30d' ? 5 : 12) === 0 && (
                              <span className="text-[10px] text-neutral-400 font-600 block truncate max-w-[36px]">
                                {item.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100 font-600">
                      <span>Total Registrations for Period: <strong>{metrics.registrationTrend.reduce((s, t) => s + t.count, 0)}</strong></span>
                      <span>Average Daily: <strong>{(metrics.registrationTrend.reduce((s, t) => s + t.count, 0) / metrics.registrationTrend.length).toFixed(1)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 6. Two Column Section: Sport Performance & Event Portfolio ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sport Performance */}
            {preferences.show_sport_performance && (
              <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="font-800 text-neutral-900 text-sm flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" />
                    Sport Performance Distribution
                  </h3>
                  <span className="text-xs text-neutral-400 font-600">{metrics.sportPerformance.length} Sports</span>
                </div>

                {metrics.sportPerformance.length > 0 ? (
                  <div className="space-y-3.5">
                    {metrics.sportPerformance.map((item) => (
                      <div key={item.sport} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-700 text-neutral-800">
                          <span>{item.sport} ({item.count} {item.count === 1 ? 'event' : 'events'})</span>
                          <span>{item.registrations} registrations • {formatPrice(item.revenue)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 py-6 text-center">No sport data recorded yet.</p>
                )}
              </div>
            )}

            {/* Event Status Portfolio Overview */}
            <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-800 text-neutral-900 text-sm flex items-center gap-2">
                  <Layers size={16} className="text-neutral-700" />
                  Tournament Portfolio Overview
                </h3>
                <Link to="/organizer/events" className="text-xs font-700 text-amber-600 hover:text-amber-700">
                  Manage Events →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-neutral-500 block">Upcoming</span>
                  <span className="text-xl font-800 text-neutral-900 block">{metrics.statusOverview.upcoming}</span>
                </div>

                <div className="p-3.5 rounded-[12px] bg-green-50/60 border border-green-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-green-800 block">Reg. Open</span>
                  <span className="text-xl font-800 text-green-700 block">{metrics.statusOverview.regOpen}</span>
                </div>

                <div className="p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-neutral-500 block">Reg. Closed</span>
                  <span className="text-xl font-800 text-neutral-900 block">{metrics.statusOverview.regClosed}</span>
                </div>

                <div className="p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-neutral-500 block">Completed</span>
                  <span className="text-xl font-800 text-neutral-900 block">{metrics.statusOverview.completed}</span>
                </div>

                <div className="p-3.5 rounded-[12px] bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-amber-800 block">Pending Review</span>
                  <span className="text-xl font-800 text-amber-700 block">{metrics.statusOverview.pending}</span>
                </div>

                <div className="p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-700 text-neutral-500 block">Drafts</span>
                  <span className="text-xl font-800 text-neutral-700 block">{metrics.statusOverview.drafts}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 7. Top Performing Events & Upcoming Events ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Events Leaderboard */}
            {preferences.show_top_events && (
              <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="font-800 text-neutral-900 text-sm flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    Top Performing Events
                  </h3>
                  <span className="text-xs text-neutral-400 font-600">By Registrations</span>
                </div>

                {metrics.topEvents.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {metrics.topEvents.map((evt, idx) => (
                      <div key={evt.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-600 font-800 text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-800 text-neutral-900 text-xs block truncate max-w-[220px]">
                              {evt.title}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              {evt.sport_name} • {formatDateShort(evt.start_date)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-800 text-neutral-900 text-xs block">
                            {evt.registrationsCount} entries
                          </span>
                          <span className="text-[11px] text-amber-700 font-700 block">
                            {formatPrice(evt.capturedRevenue || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 py-6 text-center">No event registrations recorded yet.</p>
                )}
              </div>
            )}

            {/* Upcoming Events Next in Schedule */}
            <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-800 text-neutral-900 text-sm flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  Upcoming Next in Schedule
                </h3>
                <Link to="/organizer/events?tab=upcoming" className="text-xs font-700 text-amber-600 hover:text-amber-700">
                  View All ({metrics.upcomingEvents}) →
                </Link>
              </div>

              {metrics.upcomingEventsList.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {metrics.upcomingEventsList.map((evt) => (
                    <div key={evt.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={evt.poster_url || evt.image_url}
                          alt={evt.title}
                          className="w-10 h-10 rounded-[8px] object-cover bg-neutral-100 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <span className="font-800 text-neutral-900 text-xs block truncate max-w-[200px]">
                            {evt.title}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate block">
                            {formatDateShort(evt.start_date)} • {evt.venue_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => navigate(`/organizer/events/${evt.id}/registrations`)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 py-6 text-center">No upcoming events scheduled.</p>
              )}
            </div>
          </div>

          {/* ── 8. Recent Registrations Live Feed ── */}
          {preferences.show_recent_registrations && (
            <div className="bg-white rounded-[20px] border border-neutral-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-800 text-neutral-900 text-sm flex items-center gap-2">
                  <Activity size={16} className="text-amber-500" />
                  Recent Athlete Registrations
                </h3>
                <span className="text-xs text-neutral-400 font-600">Latest 10 entries</span>
              </div>

              {metrics.recentRegistrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-400 font-700 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Participant</th>
                        <th className="py-2.5 px-3">Tournament</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3">Check-In</th>
                        <th className="py-2.5 px-3 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {metrics.recentRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-800 text-neutral-900">{reg.participant_name}</td>
                          <td className="py-2.5 px-3 text-neutral-700 truncate max-w-[200px]">{reg.event_title}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-700 uppercase bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                              {reg.participation_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={reg.payment_status === 'paid' ? 'success' : reg.payment_status === 'failed' ? 'danger' : 'neutral'}
                              size="xs"
                            >
                              {reg.payment_status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-700 ${reg.checkin_status === 'checked_in' ? 'text-green-700' : 'text-neutral-400'}`}>
                              {reg.checkin_status === 'checked_in' ? 'Checked In' : 'Not Checked In'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-400 text-[11px]">
                            {formatDateShort(reg.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 py-6 text-center">No recent registrations received.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
