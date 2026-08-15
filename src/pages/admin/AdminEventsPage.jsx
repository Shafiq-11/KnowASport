import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, AlertTriangle, Calendar, MapPin, Eye } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { adminService } from '../../services/adminService.js';
import { formatDateShort, formatPrice } from '../../utils/formatters.js';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const [modalType, setModalType] = useState(null); // 'reject' | 'changes'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setLoading(true);
      try {
        const list = await adminService.getPendingEvents();
        if (active) setEvents(list || []);
      } catch (err) {
        console.error('Error fetching admin pending events:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, []);

  const handleApprove = async (evt) => {
    setActionId(evt.id);
    try {
      await adminService.approveEvent(evt.id, user);
      setEvents((prev) => prev.map((e) => (e.id === evt.id ? { ...e, status: 'published' } : e)));
    } catch (err) {
      console.error('Approve event error:', err);
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
        setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? { ...e, status: 'rejected' } : e)));
      } else {
        await adminService.requestEventChanges(selectedEvent.id, reasonText, user);
        setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? { ...e, status: 'changes_requested' } : e)));
      }

      setModalType(null);
      setReasonText('');
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="kas-container py-8 lg:py-12 max-w-5xl space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={24} className="text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Admin Event Approval Panel
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Review tournament submissions before they are published to public discovery feeds.
        </p>
      </div>

      {loading ? (
        <SectionSkeleton count={3} />
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((evt) => (
            <div key={evt.id} className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div>
                  <span className="text-[11px] font-800 text-amber-700 uppercase tracking-wide bg-amber-50 px-2 py-0.5 rounded-[4px] mr-2">
                    {evt.sport_name}
                  </span>
                  <span className="font-800 text-neutral-900 text-lg">{evt.title}</span>
                </div>

                <Badge variant={evt.status === 'published' ? 'success' : evt.status === 'rejected' ? 'danger' : 'warning'} size="md">
                  {evt.status.toUpperCase().replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-neutral-700">
                <div>
                  <span className="font-600 text-neutral-400 block">Dates</span>
                  <span className="font-700 text-neutral-900">{formatDateShort(evt.start_date)}</span>
                </div>
                <div>
                  <span className="font-600 text-neutral-400 block">Venue & City</span>
                  <span className="font-700 text-neutral-900">{evt.venue_name}, {evt.city_name}</span>
                </div>
                <div>
                  <span className="font-600 text-neutral-400 block">Participation Model</span>
                  <span className="font-800 text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded-[4px] inline-block mt-0.5">
                    {evt.participation_type === 'team' ? `TEAM (${evt.team_size || 7} Players)` : 'INDIVIDUAL'}
                  </span>
                </div>
                <div>
                  <span className="font-600 text-neutral-400 block">Entry Fee & Check-In</span>
                  <span className="font-700 text-neutral-900">
                    {evt.entry_fee === 0 ? 'Free' : formatPrice(evt.entry_fee)} • {evt.check_in_required !== false ? 'QR Required' : 'No QR'}
                  </span>
                </div>
              </div>

              {evt.status === 'pending_review' && (
                <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(evt);
                      setModalType('reject');
                    }}
                    className="text-red-600 hover:bg-red-50 text-xs"
                  >
                    Reject
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(evt);
                      setModalType('changes');
                    }}
                    className="text-amber-700 text-xs"
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
                  >
                    Approve & Publish
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No pending event reviews"
          description="All submitted events have been reviewed by admin."
        />
      )}

      {/* Action Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-800 text-neutral-900 text-base capitalize">{modalType === 'reject' ? 'Reject Event' : 'Request Event Changes'}</h3>
            <p className="text-xs text-neutral-600">Provide notes for {selectedEvent?.title}:</p>

            <textarea
              rows={3}
              placeholder="e.g. Please update venue details or clarify tournament rules."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full border border-neutral-200 rounded-[8px] p-2.5 text-xs text-neutral-900 focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionId === selectedEvent?.id}
                onClick={handleModalSubmit}
              >
                Submit Decision
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
