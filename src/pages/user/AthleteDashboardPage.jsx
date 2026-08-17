import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, MapPin, Ticket, Bookmark, CheckCircle2, Clock, AlertCircle,
  ArrowRight, Activity, User, ShieldCheck, PieChart, TrendingUp, Users, Sparkles, Compass
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registrationService } from '../../services/registrationService.js';
import { savedEventService } from '../../services/savedEventService.js';
import { eventService } from '../../services/eventService.js';
import { formatDateShort, formatPrice } from '../../utils/formatters.js';

export default function AthleteDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!user) return;
      setLoading(true);

      try {
        const [regs, savedIds, eventsData] = await Promise.all([
          registrationService.getUserRegistrations(user.id),
          savedEventService.getSavedEventIds(user.id),
          eventService.getEvents({
            sport: profile?.primary_sport || undefined,
            limit: 3,
          }),
        ]);

        if (active) {
          setRegistrations(regs || []);
          setSavedCount(savedIds.length);
          setRecommendedEvents(eventsData?.events || []);
        }
      } catch (err) {
        console.error('Error loading athlete dashboard:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [user, profile]);

  // Derived Metrics
  const totalRegistered = registrations.length;
  const upcomingRegs = registrations.filter((r) => r.status !== 'cancelled' && r.status !== 'completed');
  const completedRegs = registrations.filter((r) => r.status === 'completed' || (new Date(r.event?.end_date || r.event?.start_date) < new Date()));
  const pendingPaymentRegs = registrations.filter((r) => r.payment_status === 'pending' && r.status !== 'cancelled');

  // Sport activity breakdown & time series
  const sportCounts = {};
  let individualCount = 0;
  let teamCount = 0;
  const monthlyActivity = {};

  registrations.forEach((r) => {
    const sName = r.event?.sport_name || 'Other Sports';
    sportCounts[sName] = (sportCounts[sName] || 0) + 1;

    if (r.registration_type === 'team' || r.team_name) {
      teamCount += 1;
    } else {
      individualCount += 1;
    }

    if (r.created_at) {
      const monthYear = new Date(r.created_at).toLocaleString('en-US', { month: 'short' });
      monthlyActivity[monthYear] = (monthlyActivity[monthYear] || 0) + 1;
    }
  });

  const sportActivityList = Object.entries(sportCounts).sort((a, b) => b[1] - a[1]);
  const monthlyActivityList = Object.entries(monthlyActivity);
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Athlete';
  const cityName = profile?.city_name || 'Coimbatore';
  const primarySport = profile?.primary_sport || 'badminton';

  const isProfileIncomplete = !profile?.phone || !profile?.primary_sport || !profile?.city_name;

  return (
    <div className="kas-container py-8 lg:py-12 space-y-8 max-w-5xl">
      {/* ── 1. PROFILE & GREETING HEADER ── */}
      <div className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Athlete Profile</span>
            <span className="text-xs font-700 text-neutral-400">• {cityName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs text-neutral-500">
            Here is your sports tournament activity, pass roster, and participation history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/saved')}
            icon={<Bookmark size={16} />}
          >
            Saved ({savedCount})
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/events')}
            icon={<Trophy size={16} />}
          >
            Explore Events
          </Button>
        </div>
      </div>

      {/* ── 2. PROFILE COMPLETION PROMPT BANNER ── */}
      {isProfileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-[18px] p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-200" />
              <span className="text-sm font-800 tracking-wide uppercase text-amber-100">
                Complete Your Athlete Profile
              </span>
            </div>
            <p className="text-xs text-amber-100 max-w-xl leading-relaxed">
              Fill in your primary sport, mobile number, and city to unlock personalized tournament recommendations and 1-click check-in.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/profile')}
            className="bg-white text-neutral-900 hover:bg-neutral-100 border-white font-800 text-xs px-5 py-2.5 flex-shrink-0 shadow-md"
          >
            Complete Profile Now →
          </Button>
        </motion.div>
      )}

      {/* ── 3. SUMMARY METRICS ── */}
      {loading ? (
        <SectionSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Events Joined</span>
            <span className="text-2xl sm:text-3xl font-800 text-neutral-900">{totalRegistered}</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Upcoming Matches</span>
            <span className="text-2xl sm:text-3xl font-800 text-amber-600">{upcomingRegs.length}</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Completed</span>
            <span className="text-2xl sm:text-3xl font-800 text-green-600">{completedRegs.length}</span>
          </div>

          <div className="bg-white rounded-[16px] border border-neutral-200 p-5 space-y-1 shadow-xs">
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wide block">Pending Payment</span>
            <span className="text-2xl sm:text-3xl font-800 text-red-600">{pendingPaymentRegs.length}</span>
          </div>
        </div>
      )}

      {/* ── 4. RECOMMENDED TOURNAMENTS FOR YOU ── */}
      {recommendedEvents.length > 0 && (
        <div className="bg-white rounded-[20px] border border-neutral-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
                <Compass size={18} className="text-amber-500" />
                Recommended Tournaments For You
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Curated based on your preference for <strong className="capitalize text-neutral-800">{primarySport}</strong> in <strong className="text-neutral-800">{cityName}</strong>
              </p>
            </div>
            <Link
              to={`/events?sport=${primarySport}&city=${cityName.toLowerCase()}`}
              className="text-xs font-700 text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              See All <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendedEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/events/${evt.slug || evt.id}`)}
                className="p-4 rounded-[14px] bg-neutral-50 border border-neutral-200 space-y-2.5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-800 uppercase text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-[4px]">
                      {evt.sport_name || 'Sports'}
                    </span>
                    <span className="font-800 text-neutral-900 font-mono">
                      {evt.entry_fee > 0 ? formatPrice(evt.entry_fee) : 'FREE'}
                    </span>
                  </div>

                  <h4 className="font-800 text-neutral-900 text-sm line-clamp-1">{evt.title}</h4>
                  
                  <div className="text-xs text-neutral-500 flex items-center gap-1">
                    <MapPin size={12} className="text-neutral-400" />
                    <span className="truncate">{evt.venue_name || evt.city_name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">{formatDateShort(evt.start_date)}</span>
                  <span className="font-700 text-amber-700">Register →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. ACTION REQUIRED: PENDING PAYMENTS ── */}
      {pendingPaymentRegs.length > 0 && (
        <div className="bg-amber-50 rounded-[16px] border border-amber-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 font-800 text-amber-900 text-base">
            <AlertCircle size={20} className="text-amber-600" />
            <span>ACTION REQUIRED: Pending Payments ({pendingPaymentRegs.length})</span>
          </div>

          <div className="space-y-3">
            {pendingPaymentRegs.map((reg) => (
              <div key={reg.id} className="bg-white p-4 rounded-[12px] border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-800 font-mono text-neutral-900 block">{reg.registration_number}</span>
                  <span className="font-700 text-neutral-900 text-sm">{reg.event?.title}</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/payment/${reg.id}`)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-800"
                >
                  Complete Payment
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. UPCOMING EVENTS ROSTER ── */}
      <div className="bg-white rounded-[20px] border border-neutral-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
            <Calendar size={18} className="text-amber-600" />
            Upcoming Tournament Passes
          </h3>
          <Link to="/my-registrations" className="text-xs font-700 text-amber-700 hover:text-amber-800">
            View All Passes ({upcomingRegs.length})
          </Link>
        </div>

        {upcomingRegs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingRegs.slice(0, 4).map((reg) => (
              <div key={reg.id} className="p-4 rounded-[14px] bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-800 font-mono text-neutral-500">{reg.registration_number}</span>
                  <Badge variant={reg.status === 'confirmed' ? 'success' : 'warning'} size="sm">
                    {reg.status.toUpperCase()}
                  </Badge>
                </div>

                <h4 className="font-800 text-neutral-900 text-sm line-clamp-1">{reg.event?.title}</h4>

                <div className="flex items-center justify-between text-xs text-neutral-600 pt-2 border-t border-neutral-200/60">
                  <span>{formatDateShort(reg.event?.start_date)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/my-registrations/${reg.id}`)}
                    className="text-xs text-amber-700 font-700"
                  >
                    Digital Ticket →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Ticket}
            title="Start Your Sports Journey"
            description="You haven't joined any sports tournaments yet. Explore open events across Tamil Nadu!"
            action={() => navigate('/events')}
            actionLabel="Explore Events"
          />
        )}
      </div>

      {/* ── 7. SPORT PARTICIPATION & ACTIVITY TREND ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sport Activity Horizontal Bar Chart */}
        <div className="bg-white rounded-[20px] border border-neutral-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
            <Activity size={18} className="text-amber-500" />
            Sport Participation Breakdown
          </h3>

          {sportActivityList.length > 0 ? (
            <div className="space-y-3 pt-2">
              {sportActivityList.map(([sportName, count]) => {
                const percentage = Math.round((count / Math.max(1, totalRegistered)) * 100);
                return (
                  <div key={sportName} className="space-y-1 text-xs">
                    <div className="flex justify-between font-700 text-neutral-900">
                      <span>{sportName}</span>
                      <span>{count} Event{count > 1 ? 's' : ''} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4">
              Your sports activity breakdown will appear here as you join tournaments across Tamil Nadu.
            </p>
          )}
        </div>

        {/* Monthly Activity Trend / Format Breakdown */}
        <div className="bg-white rounded-[20px] border border-neutral-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" />
            Registration Activity Trend
          </h3>

          {monthlyActivityList.length > 0 ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-end gap-3 h-28 pt-4 border-b border-neutral-100 pb-2">
                {monthlyActivityList.map(([mName, mCount]) => (
                  <div key={mName} className="flex-1 flex flex-col items-center gap-1.5 text-[11px] h-full justify-end">
                    <span className="font-800 text-neutral-900">{mCount}</span>
                    <div
                      className="w-full max-w-[28px] bg-amber-500 rounded-t-[4px] transition-all duration-500"
                      style={{ height: `${Math.min(100, Math.max(15, mCount * 25))}px` }}
                    />
                    <span className="text-neutral-500 font-700 text-[10px] uppercase">{mName}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-600 font-700 pt-1">
                <span>Participation Ratio:</span>
                <span>{individualCount} Individual / {teamCount} Team</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4">
              Your activity trend will appear here as you join more events.
            </p>
          )}
        </div>
      </div>

      {/* ── 8. RECENTLY COMPLETED EVENTS ── */}
      {completedRegs.length > 0 && (
        <div className="bg-white rounded-[20px] border border-neutral-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" />
            Recently Completed Tournaments
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {completedRegs.slice(0, 3).map((reg) => (
              <div key={reg.id} className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                <span className="text-[10px] font-800 uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded-[4px]">
                  COMPLETED
                </span>
                <h4 className="font-800 text-neutral-900 text-sm line-clamp-1">{reg.event?.title}</h4>
                <div className="text-neutral-500 flex items-center justify-between text-[11px]">
                  <span>{reg.event?.sport_name}</span>
                  <span>{formatDateShort(reg.event?.start_date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
