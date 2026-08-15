import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Ticket, Calendar, MapPin, Trophy, ShieldCheck, User, Users, Clock,
  ChevronLeft, AlertCircle, CheckCircle2, Ban
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import VerifiedBadge from '../../components/organizer/VerifiedBadge.jsx';
import RegistrationPassCard from '../../components/events/RegistrationPassCard.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registrationService } from '../../services/registrationService.js';
import { formatPrice, formatDate, formatDateShort } from '../../utils/formatters.js';

export default function RegistrationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadReg() {
      if (!user || !id) return;
      setLoading(true);

      try {
        const reg = await registrationService.getRegistrationById(id, user.id);
        if (active) setRegistration(reg);
      } catch (err) {
        console.error('Error fetching registration detail:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReg();

    return () => {
      active = false;
    };
  }, [id, user]);

  const handleCancelRegistration = async () => {
    if (!user || !registration) return;
    setCancelling(true);

    try {
      await registrationService.cancelRegistration(registration.id, user.id);
      setRegistration((prev) => ({ ...prev, status: 'cancelled' }));
      setShowCancelModal(false);
    } catch (err) {
      console.error('Cancel registration error:', err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="kas-container py-12 max-w-3xl space-y-4">
        <SectionSkeleton count={3} />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="kas-container py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Ticket size={28} />
        </div>
        <h2 className="text-xl font-800 text-neutral-900">Registration Not Found</h2>
        <p className="text-xs text-neutral-500">
          This registration does not exist or you do not have permission to view it.
        </p>
        <Button size="sm" onClick={() => navigate('/my-registrations')}>Go to My Registrations</Button>
      </div>
    );
  }

  const isCancelled = registration.status === 'cancelled';

  return (
    <div className="kas-container py-8 lg:py-12 max-w-3xl space-y-6">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-registrations"
          className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ChevronLeft size={16} /> Back to My Registrations
        </Link>

        <Link
          to={`/events/${registration.event?.slug || registration.event?.id}`}
          className="text-xs font-700 text-amber-600 hover:text-amber-700"
        >
          View Public Event Details →
        </Link>
      </div>

      {/* Main Registration Pass Card */}
      <RegistrationPassCard
        registration={registration}
        event={registration.event}
        user={user}
        onCancel={!isCancelled ? () => setShowCancelModal(true) : null}
      />

      {/* Participant Roster Details Section */}
      <div className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-800 text-neutral-900 text-sm border-b border-neutral-100 pb-3 flex items-center justify-between">
          <span>{registration.participation_type === 'team' ? `Team Squad: ${registration.team_name}` : 'Registered Athlete'}</span>
          <span className="text-xs font-600 text-neutral-500 capitalize">{registration.participation_type} Entry</span>
        </h3>

        <div className="space-y-2 text-xs">
          {registration.participants && registration.participants.length > 0 ? (
            registration.participants.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-neutral-100 font-800 text-[10px] text-neutral-700 flex items-center justify-center border border-neutral-200">
                    {idx + 1}
                  </div>
                  <span className="font-700 text-neutral-900">{p.full_name}</span>
                  {p.player_role === 'captain' && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-700 px-1.5 py-0.5 rounded-[4px]">
                      Captain
                    </span>
                  )}
                </div>

                <div className="text-neutral-500 font-medium">
                  {p.city_name || registration.event?.city_name}
                </div>
              </div>
            ))
          ) : (
            <p className="text-neutral-600 font-semibold">{user?.email}</p>
          )}
        </div>

        {/* Payment Summary */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-500 font-600 block">Registration Fee</span>
            <span className="font-800 text-sm text-neutral-900">
              {registration.total_fee === 0 ? <span className="text-green-600 font-700">Free</span> : formatPrice(registration.total_fee)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-neutral-500 font-600 block">Payment Status</span>
            <span className={`font-700 capitalize ${registration.payment_status === 'paid' || registration.payment_status === 'not_required' ? 'text-green-600' : 'text-amber-700'}`}>
              {registration.payment_status?.replace('_', ' ') || 'Confirmed'}
            </span>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-800 text-neutral-900 text-base">Cancel Registration?</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to cancel registration <span className="font-700 text-neutral-900">{registration.registration_number}</span>? This action cannot be undone and your spot will be released.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(false)}>
                Keep Registration
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={cancelling}
                disabled={cancelling}
                onClick={handleCancelRegistration}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
