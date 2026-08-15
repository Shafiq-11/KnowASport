import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, User, Plus, Search, Filter, ArrowUpDown, Eye, Edit3,
  BarChart3, QrCode, AlertCircle, CheckCircle2, Clock, XCircle, ChevronRight,
  RotateCcw, Trophy, MapPin, DollarSign, LayoutGrid, List, Lock, Send, AlertTriangle
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import VerifiedBadge from '../../components/organizer/VerifiedBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { organizerService } from '../../services/organizerService.js';
import { SPORTS_CATEGORIES, EVENT_TYPES } from '../../utils/constants.js';
import { formatPrice, formatDateShort, formatDate } from '../../utils/formatters.js';

export default function OrganizerEventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventsData, setEventsData] = useState({ events: [], total: 0, statusCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [participationFilter, setParticipationFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Action status state
  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const loadEvents = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const data = await organizerService.getOrganizerEvents(user.id, {
        status: activeTab,
        sport: sportFilter,
        eventType: typeFilter,
        participation: participationFilter,
        search: searchQuery,
        sort: sortOption,
      });
      setEventsData(data);
    } catch (err) {
      console.error('Error loading organizer events:', err);
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadEvents, 200);
    return () => clearTimeout(timer);
  }, [user, activeTab, searchQuery, sportFilter, typeFilter, participationFilter, sortOption]);

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
    setSportFilter('all');
    setTypeFilter('all');
    setParticipationFilter('all');
    setSortOption('newest');
  };

  const handleSubmitForReview = async (eventId) => {
    setSubmittingReviewId(eventId);
    try {
      const success = await organizerService.submitEventForReview(eventId, user);
      if (success) {
        setActionSuccessMsg('Event submitted for Admin review successfully.');
        setTimeout(() => setActionSuccessMsg(''), 4000);
        await loadEvents();
      }
    } catch (err) {
      console.error('Submit review error:', err);
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: eventsData.statusCounts?.all || 0 },
    { id: 'upcoming', label: 'Upcoming', count: eventsData.statusCounts?.upcoming || 0 },
    { id: 'reg_open', label: 'Registration Open', count: eventsData.statusCounts?.reg_open || 0 },
    { id: 'reg_closed', label: 'Registration Closed', count: eventsData.statusCounts?.reg_closed || 0 },
    { id: 'completed', label: 'Completed', count: eventsData.statusCounts?.completed || 0 },
    { id: 'drafts', label: 'Drafts', count: eventsData.statusCounts?.drafts || 0 },
    { id: 'pending', label: 'Pending Approval', count: eventsData.statusCounts?.pending || 0 },
    ...(eventsData.statusCounts?.changes_requested > 0
      ? [{ id: 'changes_requested', label: 'Changes Requested', count: eventsData.statusCounts?.changes_requested }]
      : []),
    { id: 'rejected', label: 'Rejected', count: eventsData.statusCounts?.rejected || 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              My Events
            </h1>
            <VerifiedBadge size="sm" />
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your sports events, registrations and event performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-[12px] bg-green-50 border border-green-200 flex items-center justify-between text-xs font-700 text-green-800 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-green-700 hover:text-green-900 font-800 text-sm">
            ×
          </button>
        </motion.div>
      )}

      {/* ── 2. Event Status Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hidden border-b border-neutral-200">
        {statusTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-3.5 text-xs font-700 whitespace-nowrap rounded-[8px] transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500 text-white shadow-xs font-800'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-neutral-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Filters & Search Control Bar ── */}
      <div className="bg-white rounded-[16px] border border-neutral-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by title, sport, venue, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-[8px] text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Sport Filter */}
          <div>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-[8px] text-xs text-neutral-800 font-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Sports</option>
              {SPORTS_CATEGORIES.map((s) => (
                <option key={s.id} value={s.slug || s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Participation Type (Strict INDIVIDUAL vs TEAM) */}
          <div>
            <select
              value={participationFilter}
              onChange={(e) => setParticipationFilter(e.target.value)}
              className="w-full py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-[8px] text-xs text-neutral-800 font-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Entry Types</option>
              <option value="individual">Individual Entries</option>
              <option value="team">Team Entries</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-[8px] text-xs text-neutral-800 font-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Newest Created</option>
              <option value="start_date_asc">Event Date (Upcoming)</option>
              <option value="registrations_desc">Most Registrations</option>
              <option value="revenue_desc">Highest Revenue</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & View Switcher */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-neutral-900">{eventsData.events.length}</strong> of {eventsData.total} events</span>
            {(searchQuery || sportFilter !== 'all' || typeFilter !== 'all' || participationFilter !== 'all' || activeTab !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-amber-600 hover:text-amber-700 font-700 underline ml-2 flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-[6px]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[4px] transition-colors ${viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[4px] transition-colors ${viewMode === 'table' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Events Display ── */}
      {loading ? (
        <div className="space-y-4">
          <SectionSkeleton count={3} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-6 text-center space-y-3">
          <AlertCircle size={24} className="text-red-500 mx-auto" />
          <p className="text-xs font-700 text-red-800">{error}</p>
          <Button size="sm" variant="outline" onClick={loadEvents}>
            Retry Loading
          </Button>
        </div>
      ) : eventsData.events.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-neutral-200 p-8 shadow-xs">
          {eventsData.statusCounts?.all === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No events yet"
              description="Create your first sports event on KnowASport and start accepting athlete registrations."
              action={() => navigate('/organizer/events/create')}
              actionLabel="Create Event"
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No events match your criteria"
              description="Try adjusting your status tab, sport filter, or search keywords."
              action={handleResetFilters}
              actionLabel="Reset All Filters"
            />
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARDS VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventsData.events.map((evt) => {
            const regCount = evt.registrationsCount || 0;
            const maxCap = evt.maxCap || 100;
            const fillPct = Math.min(100, Math.round((regCount / maxCap) * 100));
            const isTeam = evt.participation_type === 'team';

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[18px] border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Poster Header */}
                  <div className="relative h-40 w-full bg-neutral-100 overflow-hidden">
                    <img
                      src={evt.poster_url || evt.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-800 text-neutral-900 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-[6px] shadow-xs">
                        {evt.sport_name || evt.sport?.name || 'Sports'}
                      </span>

                      {/* Strict Participation Badge */}
                      <span
                        className={`text-[10px] font-800 uppercase tracking-wider px-2 py-0.5 rounded-[5px] flex items-center gap-1 shadow-xs ${
                          isTeam
                            ? 'bg-purple-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isTeam ? <Users size={11} /> : <User size={11} />}
                        {isTeam ? `TEAM (${evt.team_size || 7})` : 'INDIVIDUAL'}
                      </span>
                    </div>

                    {/* Bottom Status on Poster */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                      {/* Lifecycle status */}
                      <span
                        className={`text-[10px] font-800 uppercase tracking-wider px-2 py-0.5 rounded-[5px] backdrop-blur-xs ${
                          evt.status === 'published'
                            ? 'bg-emerald-500/90 text-white'
                            : evt.status === 'draft'
                            ? 'bg-neutral-800/90 text-amber-300'
                            : evt.status === 'pending_review'
                            ? 'bg-amber-500/90 text-white'
                            : evt.status === 'changes_requested'
                            ? 'bg-amber-600/95 text-white'
                            : 'bg-red-500/90 text-white'
                        }`}
                      >
                        {evt.status === 'pending_review'
                          ? 'Pending Approval'
                          : evt.status === 'changes_requested'
                          ? 'Changes Requested'
                          : evt.status.toUpperCase()}
                      </span>

                      {/* Registration state */}
                      {evt.status === 'published' && (
                        <span className="text-[10px] font-700 text-white bg-black/50 px-2 py-0.5 rounded-[4px]">
                          {evt.regStatus === 'open'
                            ? 'Reg Open'
                            : evt.regStatus === 'closing_soon'
                            ? 'Closing Soon'
                            : 'Reg Closed'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3.5">
                    <div>
                      <h3 className="font-800 text-neutral-900 text-sm leading-snug line-clamp-1 hover:text-amber-600 transition-colors">
                        {evt.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mt-1 font-600">
                        <MapPin size={12} className="text-neutral-400 flex-shrink-0" />
                        <span className="truncate">{evt.venue_name}, {evt.city_name}</span>
                      </div>
                    </div>

                    {/* Date & Captured Revenue Row */}
                    <div className="flex items-center justify-between text-xs py-2 px-2.5 bg-neutral-50 rounded-[10px] border border-neutral-100">
                      <div>
                        <span className="text-[10px] font-700 text-neutral-400 uppercase block">Date</span>
                        <span className="font-800 text-neutral-800">{formatDateShort(evt.start_date)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-700 text-neutral-400 uppercase block">Captured</span>
                        <span className="font-800 text-amber-700">{formatPrice(evt.capturedRevenue || 0)}</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-[11px] font-700">
                        <span className="text-neutral-600">Registrations</span>
                        <span className="text-neutral-900 font-800">{regCount} / {maxCap} ({fillPct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Check-in info */}
                    <div className="text-[11px] flex items-center justify-between text-neutral-500">
                      <span>Check-In Attendance:</span>
                      {evt.isCheckInRequired ? (
                        <span className="font-700 text-green-700">{evt.checkedInCount || 0} Checked In</span>
                      ) : (
                        <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-700">
                          Check-in Not Required
                        </span>
                      )}
                    </div>

                    {/* Changes Requested Banner if applicable */}
                    {evt.status === 'changes_requested' && (
                      <div className="p-2.5 rounded-[8px] bg-amber-50 border border-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-900 font-800 text-[11px]">
                          <AlertTriangle size={13} className="text-amber-600" />
                          <span>Admin Feedback</span>
                        </div>
                        <p className="text-[11px] text-amber-800 line-clamp-2">
                          {evt.changes_requested_reason || 'Please update event details and resubmit.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 border-t border-neutral-100 bg-neutral-50/60 rounded-b-[18px] flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    {/* View Analytics */}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate(`/organizer/events/${evt.id}/analytics`)}
                      icon={<BarChart3 size={13} />}
                      title="View Analytics"
                    >
                      Analytics
                    </Button>

                    {/* Manage Registrations */}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate(`/organizer/events/${evt.id}/registrations`)}
                      icon={<Users size={13} />}
                      title="Manage Registrations"
                    >
                      Participants
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Check-In Action */}
                    {evt.isCheckInRequired && evt.status === 'published' && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => navigate(`/organizer/events/${evt.id}/check-in`)}
                        icon={<QrCode size={13} />}
                        className="text-neutral-700"
                      >
                        Check-In
                      </Button>
                    )}

                    {/* Submit for Review (if draft) */}
                    {evt.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="xs"
                        disabled={submittingReviewId === evt.id}
                        onClick={() => handleSubmitForReview(evt.id)}
                        icon={<Send size={12} />}
                      >
                        Submit
                      </Button>
                    )}

                    {/* Edit Event */}
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate(`/organizer/events/${evt.id}`)}
                      icon={<Edit3 size={12} />}
                    >
                      Edit
                    </Button>

                    {/* Public View */}
                    {evt.status === 'published' && evt.slug && (
                      <Link
                        to={`/events/${evt.slug}`}
                        className="p-1.5 rounded-[6px] border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-white"
                        title="View Public Listing"
                      >
                        <Eye size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── DENSE LIST / TABLE VIEW ── */
        <div className="bg-white rounded-[18px] border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-700 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-3">Sport & Type</th>
                  <th className="py-3 px-3">Entry Type</th>
                  <th className="py-3 px-3">Date & Venue</th>
                  <th className="py-3 px-3">Lifecycle Status</th>
                  <th className="py-3 px-3">Registrations</th>
                  <th className="py-3 px-3">Captured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {eventsData.events.map((evt) => {
                  const regCount = evt.registrationsCount || 0;
                  const maxCap = evt.maxCap || 100;
                  const fillPct = Math.min(100, Math.round((regCount / maxCap) * 100));
                  const isTeam = evt.participation_type === 'team';

                  return (
                    <tr key={evt.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Event Poster + Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={evt.poster_url || evt.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'}
                            alt={evt.title}
                            className="w-10 h-10 rounded-[8px] object-cover bg-neutral-100 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-800 text-neutral-900 block truncate max-w-[200px]">
                              {evt.title}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {evt.city_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sport & Type */}
                      <td className="py-3 px-3">
                        <span className="font-700 text-neutral-800 block">{evt.sport_name || evt.sport?.name}</span>
                        <span className="text-[10px] text-neutral-400">{evt.event_type_name || 'Tournament'}</span>
                      </td>

                      {/* Entry Type */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-800 uppercase px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1 ${
                            isTeam ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isTeam ? <Users size={10} /> : <User size={10} />}
                          {isTeam ? `TEAM` : 'INDIV.'}
                        </span>
                      </td>

                      {/* Date & Venue */}
                      <td className="py-3 px-3">
                        <span className="font-700 text-neutral-800 block">{formatDateShort(evt.start_date)}</span>
                        <span className="text-[10px] text-neutral-400 truncate max-w-[140px] block">{evt.venue_name}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-800 uppercase px-2 py-0.5 rounded-[4px] inline-block ${
                            evt.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : evt.status === 'draft'
                              ? 'bg-neutral-100 text-neutral-700'
                              : evt.status === 'pending_review'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {evt.status === 'pending_review' ? 'Pending' : evt.status}
                        </span>
                      </td>

                      {/* Registrations Progress */}
                      <td className="py-3 px-3">
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px] font-700 text-neutral-700">
                            <span>{regCount}</span>
                            <span>{maxCap}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${fillPct}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Captured Revenue */}
                      <td className="py-3 px-3 font-800 text-amber-700">
                        {formatPrice(evt.capturedRevenue || 0)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate(`/organizer/events/${evt.id}/analytics`)}
                            title="Analytics"
                          >
                            <BarChart3 size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate(`/organizer/events/${evt.id}/registrations`)}
                            title="Registrations"
                          >
                            <Users size={13} />
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate(`/organizer/events/${evt.id}`)}
                            title="Edit"
                          >
                            <Edit3 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
