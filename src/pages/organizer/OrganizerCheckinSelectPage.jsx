import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Calendar, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { checkinService } from '../../services/checkinService.js';
import { formatDateShort } from '../../utils/formatters.js';

export default function OrganizerCheckinSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadOrganizerEvents() {
      if (!user) return;
      setLoading(true);

      try {
        const list = await checkinService.getOrganizerEvents(user.id);
        if (active) setEvents(list || []);
      } catch (err) {
        console.error('Error loading organizer events:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrganizerEvents();

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="kas-container py-8 lg:py-12 max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <QrCode size={24} className="text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Organizer Event Check-In
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Select a tournament to open live entrance check-in and QR verification
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <SectionSkeleton count={3} />
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-700 text-amber-700 uppercase tracking-wide bg-amber-50 px-2.5 py-0.5 rounded-[6px]">
                    {evt.sport_name || 'Sports'}
                  </span>
                  <Badge variant="success" size="sm">ACTIVE EVENT</Badge>
                </div>

                <h3 className="font-800 text-neutral-900 text-lg">{evt.title}</h3>

                <div className="flex flex-col gap-1.5 text-xs text-neutral-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-neutral-400" />
                    <span>{formatDateShort(evt.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-neutral-400" />
                    <span>{evt.venue_name}, {evt.city_name}</span>
                  </div>
                </div>

                {/* Progress Stats Bar */}
                <div className="p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-700 text-neutral-900">
                    <span>Check-in Status</span>
                    <span className="text-green-700">{evt.stats?.checkedIn || 0} / {evt.stats?.total || 0} Checked In</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{
                        width: `${evt.stats?.total ? Math.min(100, Math.round(((evt.stats?.checkedIn || 0) / evt.stats.total) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => navigate(`/organizer/events/${evt.slug || evt.id}/check-in`)}
                  icon={<QrCode size={16} />}
                >
                  OPEN CHECK-IN SCANNER
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-neutral-200 p-8 text-center space-y-3">
          <p className="text-sm text-neutral-600">No active events found for your organizer account.</p>
          <Button size="sm" onClick={() => navigate('/events')}>Explore Events</Button>
        </div>
      )}
    </div>
  );
}
