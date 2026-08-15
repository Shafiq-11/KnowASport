import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, ArrowRight, Download, QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registrationService } from '../../services/registrationService.js';
import { passPdfService } from '../../services/passPdfService.js';
import { formatPrice, formatDateShort } from '../../utils/formatters.js';
import { sectionRevealVariants, staggerItemVariants } from '../../utils/motion.js';

export default function MyRegistrationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchRegistrations() {
      if (!user) return;
      setLoading(true);

      try {
        const list = await registrationService.getUserRegistrations(user.id);
        if (active) setRegistrations(list || []);
      } catch (err) {
        console.error('Error fetching user registrations:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchRegistrations();

    return () => {
      active = false;
    };
  }, [user]);

  const handleQuickDownload = async (e, reg) => {
    e.stopPropagation();
    setDownloadingId(reg.id);
    try {
      await passPdfService.downloadRegistrationPass({
        registration: reg,
        event: reg.event,
        user,
      });
    } catch (err) {
      console.error('Quick download pass error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = registrations.filter((r) => {
    if (filterTab === 'upcoming') return r.status !== 'cancelled' && r.status !== 'completed';
    if (filterTab === 'pending') return r.payment_status === 'pending';
    if (filterTab === 'confirmed') return r.status === 'confirmed';
    if (filterTab === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  return (
    <div className="kas-container py-8 lg:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Ticket size={24} className="text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            My Registrations
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Manage your tournament passes, digital QR tickets, and registration statuses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-4 overflow-x-auto scrollbar-hidden">
        {[
          { id: 'all', label: `All (${registrations.length})` },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'pending', label: 'Pending Payment' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`py-3 text-xs font-700 border-b-2 whitespace-nowrap transition-colors ${
              filterTab === tab.id
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <SectionSkeleton count={3} />
      ) : filtered.length > 0 ? (
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filtered.map((reg) => {
            const isConfirmed = reg.status === 'confirmed';

            return (
              <motion.div
                key={reg.id}
                variants={staggerItemVariants}
                className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div>
                      <span className="text-[11px] font-800 text-neutral-500 font-mono block uppercase">
                        {reg.registration_number}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-800 text-amber-600 uppercase tracking-wide">
                          {reg.event?.sport_name || 'Sports'}
                        </span>
                        {reg.pass_code && isConfirmed && (
                          <span className="text-[10px] bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded-[4px] border border-amber-200 font-mono">
                            Pass: {reg.pass_code}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={isConfirmed ? 'success' : reg.status === 'cancelled' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {reg.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-800 text-neutral-900 text-lg line-clamp-1">{reg.event?.title || 'Tournament Event'}</h3>
                    <div className="flex flex-col gap-1 text-xs text-neutral-600 pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-neutral-400" />
                        <span>{formatDateShort(reg.event?.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-neutral-400" />
                        <span>{reg.event?.venue_name}, {reg.event?.city_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-neutral-400 font-600">Payment</span>
                    <span className={`text-xs font-700 capitalize ${reg.payment_status === 'paid' || reg.payment_status === 'not_required' ? 'text-green-600' : 'text-amber-700'}`}>
                      {reg.payment_status?.replace('_', ' ') || 'Free'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {reg.payment_status === 'pending' && reg.status !== 'cancelled' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/payment/${reg.id}`)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-800"
                      >
                        Complete Payment
                      </Button>
                    ) : isConfirmed ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={downloadingId === reg.id}
                          onClick={(e) => handleQuickDownload(e, reg)}
                          icon={downloadingId === reg.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          className="text-xs"
                        >
                          Pass PDF
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/my-registrations/${reg.id}`)}
                          icon={<QrCode size={13} />}
                          className="text-xs font-800"
                        >
                          View Pass
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/my-registrations/${reg.id}`)}
                        icon={<ArrowRight size={14} />}
                        iconPosition="right"
                      >
                        Details
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="bg-white rounded-[12px] border border-neutral-200 p-8 shadow-xs">
          <EmptyState
            icon={Ticket}
            title="No registrations found"
            description="You haven't registered for any events in this filter view yet. Explore sports events across Tamil Nadu!"
            action={() => navigate('/events')}
            actionLabel="Explore Events"
          />
        </div>
      )}
    </div>
  );
}
