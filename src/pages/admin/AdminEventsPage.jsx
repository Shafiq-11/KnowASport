import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, CheckCircle2, XCircle, AlertTriangle, Calendar, MapPin,
  Search, Filter, Eye, Clock, RotateCcw, Building2, ChevronRight,
  ShieldCheck, AlertCircle, RefreshCw, FileText, Check, DollarSign,
  Users, QrCode, Lock, ExternalLink
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { adminService } from '../../services/adminService.js';
import { formatDateShort, formatDate, formatPrice } from '../../utils/formatters.js';
import { SPORTS_CATEGORIES } from '../../utils/constants.js';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('all');

  // Modal state
  const [modalType, setModalType] = useState(null); // 'reject' | 'changes' | 'audit'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const list = await adminService.getAllEvents({
        status: statusFilter,
        search: searchQuery,
        sport: sportFilter,
      });
      setEvents(list || []);
    } catch (err) {
      console.error('Error fetching admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadEvents, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, sportFilter]);

  // Compute status badge counts from all events
  const [allEventsCache, setAllEventsCache] = useState([]);
  useEffect(() => {
    let active = true;
    async function loadCache() {
      try {
        const full = await adminService.getAllEvents();
        if (active) setAllEventsCache(full || []);
      } catch (e) {
        console.warn('Load cache error:', e);
      }
    }
    loadCache();
    return () => {
      active = false;
    };
  }, [actionId]);

  const statusCounts = {
    all: allEventsCache.length,
    pending_review: allEventsCache.filter((e) => e.status === 'pending_review').length,
    published: allEventsCache.filter((e) => e.status === 'published').length,
    changes_requested: allEventsCache.filter((e) => e.status === 'changes_requested').length,
    draft: allEventsCache.filter((e) => e.status === 'draft').length,
    rejected: allEventsCache.filter((e) => e.status === 'rejected').length,
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleApprove = async (evt) => {
    setActionId(evt.id);
    try {
      await adminService.approveEvent(evt.id, user);

      setAllEventsCache((prev) =>
        prev.map((e) =>
          e.id === evt.id ? { ...e, status: 'published', rejection_reason: null, changes_requested_reason: null } : e
        )
      );

      setEvents((prev) => {
        if (statusFilter === 'pending_review' || statusFilter === 'draft' || statusFilter === 'changes_requested' || statusFilter === 'rejected') {
          return prev.filter((e) => e.id !== evt.id);
        }
        return prev.map((e) =>
          e.id === evt.id ? { ...e, status: 'published', rejection_reason: null, changes_requested_reason: null } : e
        );
      });

      if (selectedEvent?.id === evt.id) {
        setSelectedEvent((prev) => ({
          ...prev,
          status: 'published',
          rejection_reason: null,
          changes_requested_reason: null,
        }));
      }
      showToast(`Tournament "${evt.title}" approved and published to discovery!`);
    } catch (err) {
      console.error('Approve event error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleUnpublish = async (evt) => {
    setActionId(evt.id);
    try {
      await adminService.unpublishEvent(evt.id, user);

      setAllEventsCache((prev) =>
        prev.map((e) => (e.id === evt.id ? { ...e, status: 'draft' } : e))
      );

      setEvents((prev) => {
        if (statusFilter === 'published') {
          return prev.filter((e) => e.id !== evt.id);
        }
        return prev.map((e) => (e.id === evt.id ? { ...e, status: 'draft' } : e));
      });

      if (selectedEvent?.id === evt.id) {
        setSelectedEvent((prev) => ({ ...prev, status: 'draft' }));
      }
      showToast(`Tournament "${evt.title}" unpublished and reverted to draft.`);
    } catch (err) {
      console.error('Unpublish error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedEvent || !reasonText.trim()) return;
    setActionId(selectedEvent.id);

    try {
      if (modalType === 'reject') {
        await adminService.rejectEvent(selectedEvent.id, reasonText, user);

        setAllEventsCache((prev) =>
          prev.map((e) =>
            e.id === selectedEvent.id ? { ...e, status: 'rejected', rejection_reason: reasonText } : e
          )
        );

        setEvents((prev) => {
          if (statusFilter === 'pending_review' || statusFilter === 'published' || statusFilter === 'changes_requested') {
            return prev.filter((e) => e.id !== selectedEvent.id);
          }
          return prev.map((e) =>
            e.id === selectedEvent.id ? { ...e, status: 'rejected', rejection_reason: reasonText } : e
          );
        });

        showToast(`Tournament "${selectedEvent.title}" rejected with feedback.`);
      } else {
        await adminService.requestEventChanges(selectedEvent.id, reasonText, user);

        setAllEventsCache((prev) =>
          prev.map((e) =>
            e.id === selectedEvent.id
              ? { ...e, status: 'changes_requested', changes_requested_reason: reasonText }
              : e
          )
        );

        setEvents((prev) => {
          if (statusFilter === 'pending_review' || statusFilter === 'published') {
            return prev.filter((e) => e.id !== selectedEvent.id);
          }
          return prev.map((e) =>
            e.id === selectedEvent.id
              ? { ...e, status: 'changes_requested', changes_requested_reason: reasonText }
              : e
          );
        });

        showToast(`Changes requested from organizer for "${selectedEvent.title}".`);
      }

      setModalType(null);
      setReasonText('');
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionId(null);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Submissions', count: statusCounts.all },
    { id: 'pending_review', label: 'Pending Approval', count: statusCounts.pending_review, highlight: statusCounts.pending_review > 0 },
    { id: 'published', label: 'Published & Live', count: statusCounts.published },
    { id: 'changes_requested', label: 'Changes Requested', count: statusCounts.changes_requested },
    { id: 'draft', label: 'Organizer Drafts', count: statusCounts.draft },
    { id: 'rejected', label: 'Rejected', count: statusCounts.rejected },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-[12px] text-xs font-700 shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-[8px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy size={18} className="text-amber-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Admin Event Approval Panel
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Review, verify, and audit tournament submissions before they are published to public discovery feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadEvents}
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-800">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-700 whitespace-nowrap transition-all
              ${statusFilter === tab.id
                ? 'bg-amber-500 text-neutral-950 shadow-sm font-800'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }
            `}
          >
            <span>{tab.label}</span>
            <span
              className={`
                px-1.5 py-0.5 rounded-[4px] text-[10px] font-800
                ${statusFilter === tab.id
                  ? 'bg-neutral-950/20 text-neutral-950'
                  : tab.highlight
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-neutral-800 text-neutral-400'
                }
              `}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search tournament, organizer, city, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="w-full md:w-48 bg-neutral-950 border border-neutral-800 rounded-[8px] px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Sports</option>
            {SPORTS_CATEGORIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <SectionSkeleton count={3} />
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((evt) => {
            const organizerLabel = evt.organizer_name || evt.organizer?.organization_name || 'Organizer';
            const isPending = evt.status === 'pending_review';
            const isDraft = evt.status === 'draft';
            const isPublished = evt.status === 'published';
            const isChanges = evt.status === 'changes_requested';
            const isRejected = evt.status === 'rejected';

            return (
              <div
                key={evt.id}
                className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-6 space-y-4 shadow-sm hover:border-neutral-700 transition-colors"
              >
                {/* Top Row: Sport, Title, Organizer, Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-neutral-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-800 text-amber-400 uppercase tracking-wide bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-[4px]">
                        {evt.sport_name || 'Sports'}
                      </span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Building2 size={13} className="text-neutral-500" />
                        Organizer: <span className="font-700 text-neutral-200">{organizerLabel}</span>
                      </span>
                    </div>
                    <h3 className="font-800 text-white text-lg tracking-tight pt-1">
                      {evt.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={
                        isPublished
                          ? 'success'
                          : isRejected
                          ? 'danger'
                          : isPending
                          ? 'warning'
                          : isChanges
                          ? 'warning'
                          : 'default'
                      }
                      size="md"
                    >
                      {evt.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Event Key Metrics Details */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Tournament Dates</span>
                    <span className="font-700 text-white flex items-center gap-1.5">
                      <Calendar size={13} className="text-amber-400" />
                      {formatDateShort(evt.start_date)}
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Venue & Location</span>
                    <span className="font-700 text-white flex items-center gap-1.5 truncate">
                      <MapPin size={13} className="text-amber-400 flex-shrink-0" />
                      {evt.venue_name}, {evt.city_name}
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Participation Format</span>
                    <span className="font-700 text-amber-400">
                      {evt.participation_type === 'team'
                        ? `TEAM (${evt.team_size || 7} Players)`
                        : 'INDIVIDUAL'}
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Entry Fee & Check-In</span>
                    <span className="font-700 text-white">
                      {evt.entry_fee === 0 ? 'Free Entry' : formatPrice(evt.entry_fee)} •{' '}
                      {evt.check_in_required !== false ? 'QR Required' : 'No QR'}
                    </span>
                  </div>
                </div>

                {/* Feedback Notes (if changes requested or rejected) */}
                {(evt.changes_requested_reason || evt.rejection_reason) && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-800 block">Admin Feedback Note:</span>
                      <span>{evt.changes_requested_reason || evt.rejection_reason}</span>
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-neutral-500">
                    Created on {formatDateShort(evt.created_at || evt.start_date)}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* AUDIT / INSPECT BUTTON */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(evt);
                        setModalType('audit');
                      }}
                      icon={<ShieldCheck size={14} className="text-amber-400" />}
                      className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-xs font-700"
                    >
                      Review & Audit
                    </Button>

                    {/* Actions for Pending Review */}
                    {isPending && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(evt);
                            setReasonText('');
                            setModalType('reject');
                          }}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
                        >
                          Reject
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(evt);
                            setReasonText('');
                            setModalType('changes');
                          }}
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
                        >
                          Request Changes
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          loading={actionId === evt.id}
                          disabled={actionId === evt.id}
                          onClick={() => handleApprove(evt)}
                          icon={<CheckCircle2 size={16} />}
                          className="text-xs font-800"
                        >
                          Approve & Publish
                        </Button>
                      </>
                    )}

                    {/* Actions for Draft Events */}
                    {isDraft && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(evt)}
                        loading={actionId === evt.id}
                        icon={<CheckCircle2 size={15} />}
                        className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-xs"
                      >
                        Direct Publish
                      </Button>
                    )}

                    {/* Actions for Published Events */}
                    {isPublished && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnpublish(evt)}
                        loading={actionId === evt.id}
                        className="text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs"
                      >
                        Unpublish to Draft
                      </Button>
                    )}

                    {/* Actions for Changes Requested / Rejected */}
                    {(isChanges || isRejected) && (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={actionId === evt.id}
                        onClick={() => handleApprove(evt)}
                        icon={<RotateCcw size={14} />}
                        className="text-xs"
                      >
                        Re-Approve & Publish
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-[16px] p-8 text-center">
          <EmptyState
            icon={Trophy}
            title={
              statusFilter === 'pending_review'
                ? 'No Pending Tournament Submissions'
                : `No ${statusFilter.replace('_', ' ')} tournaments found`
            }
            description="All organizer events have been processed or match your current filter criteria."
          />
          {statusFilter !== 'all' && (
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={() => setStatusFilter('all')}>
                View All Submissions
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── EVENT REVIEW & AUDIT MODAL ── */}
      {modalType === 'audit' && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-[20px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="border-b border-neutral-800 pb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-800 text-amber-400 uppercase tracking-wide bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-[4px]">
                    {selectedEvent.sport_name || 'Tournament'}
                  </span>
                  <Badge
                    variant={
                      selectedEvent.status === 'published'
                        ? 'success'
                        : selectedEvent.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {selectedEvent.status.toUpperCase().replace('_', ' ')}
                  </Badge>
                </div>
                <h2 className="text-xl font-800 text-white tracking-tight">{selectedEvent.title}</h2>
                <span className="text-xs text-neutral-400 font-mono block">Event ID: {selectedEvent.id}</span>
              </div>

              <button
                onClick={() => setModalType(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* Organizer Verification Card */}
            <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-[14px] p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="font-800 text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 size={14} className="text-amber-400" />
                  Organizer Credentials
                </span>
                <span className="text-[10px] font-700 text-green-400 bg-green-500/10 px-2 py-0.5 rounded-[4px]">
                  KYC Verified Organizer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300">
                <div>
                  <span className="text-neutral-500 block">Organization:</span>
                  <span className="font-700 text-white">
                    {selectedEvent.organizer_name || selectedEvent.organizer?.organization_name || 'Registered Sports Club'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Location Base:</span>
                  <span className="font-700 text-white">{selectedEvent.city_name || 'Tamil Nadu'}</span>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2 text-xs">
              <span className="font-800 text-neutral-300 uppercase tracking-wide block">
                Verification & Operational Checklist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-neutral-950/60 border border-neutral-800/60 p-3 rounded-[10px] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </div>
                  <div>
                    <span className="font-700 text-white block">Venue Verification</span>
                    <span className="text-[11px] text-neutral-400">{selectedEvent.venue_name}, {selectedEvent.city_name}</span>
                  </div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800/60 p-3 rounded-[10px] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </div>
                  <div>
                    <span className="font-700 text-white block">Participation Format</span>
                    <span className="text-[11px] text-neutral-400">
                      {selectedEvent.participation_type === 'team'
                        ? `Team (${selectedEvent.team_size || 7} Players)`
                        : 'Individual Entry'}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800/60 p-3 rounded-[10px] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </div>
                  <div>
                    <span className="font-700 text-white block">Ticket Entry Fee</span>
                    <span className="text-[11px] text-neutral-400">
                      {selectedEvent.entry_fee === 0 ? 'Free Entry' : formatPrice(selectedEvent.entry_fee)}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800/60 p-3 rounded-[10px] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </div>
                  <div>
                    <span className="font-700 text-white block">QR Code Athlete Check-In</span>
                    <span className="text-[11px] text-neutral-400">
                      {selectedEvent.check_in_required !== false ? 'Required on Match Day' : 'Self Check-in'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description / Rules */}
            {selectedEvent.description && (
              <div className="space-y-1 text-xs">
                <span className="font-800 text-neutral-300 uppercase tracking-wide block">
                  Tournament Overview & Rules
                </span>
                <p className="bg-neutral-950/60 border border-neutral-800/60 p-3 rounded-[10px] text-neutral-300 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {/* Action Buttons inside Audit Modal */}
            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => setModalType(null)}>
                Close Audit View
              </Button>

              <div className="flex items-center gap-2">
                {selectedEvent.status === 'pending_review' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReasonText('');
                        setModalType('reject');
                      }}
                      className="text-red-400 hover:bg-red-500/10 text-xs"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReasonText('');
                        setModalType('changes');
                      }}
                      className="border-amber-500/30 text-amber-400 text-xs"
                    >
                      Request Changes
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionId === selectedEvent.id}
                      onClick={() => handleApprove(selectedEvent)}
                      icon={<CheckCircle2 size={15} />}
                      className="font-800 text-xs"
                    >
                      Approve & Publish
                    </Button>
                  </>
                )}

                {selectedEvent.status === 'draft' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionId === selectedEvent.id}
                    onClick={() => handleApprove(selectedEvent)}
                    icon={<CheckCircle2 size={15} />}
                    className="font-800 text-xs"
                  >
                    Direct Publish Tournament
                  </Button>
                )}

                {selectedEvent.status === 'published' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={actionId === selectedEvent.id}
                    onClick={() => handleUnpublish(selectedEvent)}
                    className="border-neutral-700 text-neutral-300 text-xs"
                  >
                    Unpublish to Draft
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Action Modal (Reject / Request Changes) */}
      {(modalType === 'reject' || modalType === 'changes') && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-[16px] p-6 max-w-md w-full space-y-4 shadow-2xl text-white"
          >
            <h3 className="font-800 text-white text-base capitalize flex items-center gap-2">
              {modalType === 'reject' ? (
                <>
                  <XCircle size={18} className="text-red-400" />
                  Reject Tournament Submission
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="text-amber-400" />
                  Request Event Changes
                </>
              )}
            </h3>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Provide feedback for <span className="text-white font-700">{selectedEvent?.title}</span>. The organizer will receive an official notification with these notes:
            </p>

            <textarea
              rows={4}
              placeholder={
                modalType === 'reject'
                  ? 'e.g. Tournament fails safety guidelines or contains invalid contact details.'
                  : 'e.g. Please clarify team eligibility criteria or add venue schedule details.'
              }
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-[10px] p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <Button variant="ghost" size="sm" onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionId === selectedEvent?.id}
                onClick={handleModalSubmit}
                className={modalType === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                {modalType === 'reject' ? 'Confirm Rejection' : 'Submit Change Request'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
