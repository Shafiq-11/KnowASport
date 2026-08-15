import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Ticket, Calendar, MapPin, Trophy, ShieldCheck, User, Users, Clock,
  ChevronLeft, AlertCircle, CheckCircle2, Ban
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import VerifiedBadge from '../../components/organizer/VerifiedBadge.jsx';
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
      <div className="kas-container py-16 text-center text-neutral-500">
        Loading ticket details...
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="kas-container py-16 text-center space-y-4">
        <h2 className="text-xl font-800 text-neutral-900">Registration Not Found</h2>
        <Button size="sm" onClick={() => navigate('/my-registrations')}>Go to My Registrations</Button>
      </div>
    );
  }

  const isConfirmed = registration.status === 'confirmed';
  const isCancelled = registration.status === 'cancelled';
  const qrToken = registration.qr_token || `KAS-V-${registration.id}`;

  return (
    <div className="kas-container py-8 lg:py-12 max-w-3xl space-y-8">
      {/* Top Back Link */}
      <Link
        to="/my-registrations"
        className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ChevronLeft size={16} /> Back to My Registrations
      </Link>

      {/* Main Ticket Container */}
      <div className="bg-white rounded-[20px] border border-neutral-200 overflow-hidden shadow-lg space-y-0">
        {/* Ticket Top Banner */}
        <div className="bg-navy-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800">
          <div>
            <span className="text-xs font-800 text-amber-400 uppercase tracking-widest block">KnowASport Registration Pass</span>
            <span className="text-2xl font-800 font-mono tracking-wide text-white">{registration.registration_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isConfirmed ? 'success' : isCancelled ? 'danger' : 'warning'} size="md">
              {registration.status.toUpperCase().replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Ticket Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Tournament Overview */}
          <div className="space-y-2 border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-700 text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-[6px]">
                {registration.event?.sport_name || 'Sports'}
              </span>
              <VerifiedBadge size="xs" />
            </div>

            <h1 className="text-2xl font-800 text-neutral-900 leading-tight">
              {registration.event?.title}
            </h1>

            <p className="text-xs text-neutral-500">
              Organized by <span className="font-700 text-neutral-900">{registration.event?.organizer?.organization_name || 'Verified Sports Council'}</span>
            </p>
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-700">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-700 text-neutral-900 block">{formatDate(registration.event?.start_date)}</span>
                <span className="text-neutral-500">Tournament Date</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-700 text-neutral-900 block">{registration.event?.venue_name}</span>
                <span className="text-neutral-500">{registration.event?.city_name}, {registration.event?.district_name}</span>
              </div>
            </div>
          </div>

          {/* Participant Roster Box */}
          <div className="p-5 rounded-[14px] bg-neutral-50 border border-neutral-200 space-y-3">
            <h4 className="font-800 text-neutral-900 text-sm flex items-center justify-between">
              <span>{registration.participation_type === 'team' ? `Team: ${registration.team_name}` : 'Participant Details'}</span>
              <span className="text-xs font-600 text-neutral-500 capitalize">{registration.participation_type}</span>
            </h4>

            <div className="space-y-2 text-xs">
              {registration.participants && registration.participants.length > 0 ? (
                registration.participants.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-neutral-200/60 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-neutral-200 font-700 text-[10px] text-neutral-700 flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <span className="font-700 text-neutral-900">{p.full_name}</span>
                      {p.player_role === 'captain' && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-700 px-1.5 py-0.5 rounded-[4px]">Captain</span>
                      )}
                    </div>
                    {p.phone && <span className="text-neutral-500 font-mono">{p.phone}</span>}
                  </div>
                ))
              ) : (
                <p className="text-neutral-600">{user?.email}</p>
              )}
            </div>
          </div>

          {/* QR Ticket SVG Box */}
          {!isCancelled && (
            <div className="p-6 rounded-[16px] bg-neutral-50 border border-neutral-200 text-center space-y-3 flex flex-col items-center justify-center">
              <div className="p-3 bg-white rounded-[12px] border border-neutral-200 shadow-sm inline-block">
                <QRCodeSVG value={qrToken} size={140} fgColor="#080C18" level="M" />
              </div>
              <div>
                <p className="text-xs font-700 text-neutral-900">Show this QR Code or Registration ID at venue check-in</p>
                <p className="text-[11px] text-neutral-500">
                  {isConfirmed
                    ? 'Organizers can scan this QR code or enter Registration ID at the venue entrance.'
                    : 'Check-in requires completed payment verification.'}
                </p>
              </div>
            </div>
          )}

          {/* Payment Status Bar */}
          <div className="p-4 rounded-[12px] bg-neutral-100 border border-neutral-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500 font-600 block">Total Entry Fee</span>
              <span className="font-800 text-sm text-neutral-900">
                {registration.total_fee === 0 ? <span className="text-green-600 font-700">Free</span> : formatPrice(registration.total_fee)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-neutral-500 font-600 block">Payment Status</span>
              <span className={`font-700 capitalize ${registration.payment_status === 'paid' || registration.payment_status === 'not_required' ? 'text-green-600' : 'text-amber-700'}`}>
                {registration.payment_status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-4">
          <Link
            to={`/events/${registration.event?.slug}`}
            className="text-xs font-700 text-amber-700 hover:text-amber-800"
          >
            View Event Details Page
          </Link>

          {!isCancelled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-red-600 hover:bg-red-50 text-xs"
            >
              Cancel Registration
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-800 text-neutral-900 text-base">Cancel Registration?</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to cancel registration <span className="font-700 text-neutral-900">{registration.registration_number}</span>? This action cannot be undone.
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
