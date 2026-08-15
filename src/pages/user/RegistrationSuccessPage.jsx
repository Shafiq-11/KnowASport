import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Ticket, Trophy, Calendar, MapPin, ArrowRight, User, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registrationService } from '../../services/registrationService.js';
import { formatPrice, formatDateShort } from '../../utils/formatters.js';

export default function RegistrationSuccessPage() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchReg() {
      if (!user || !registrationId) return;
      setLoading(true);

      try {
        const reg = await registrationService.getRegistrationById(registrationId, user.id);
        if (active) setRegistration(reg);
      } catch (err) {
        console.error('Error fetching registration confirmation:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchReg();

    return () => {
      active = false;
    };
  }, [registrationId, user]);

  if (loading) {
    return (
      <div className="kas-container py-16 text-center text-neutral-500">
        Retrieving registration confirmation...
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
  const isFree = registration.payment_status === 'not_required' || registration.total_fee === 0;

  // Secure opaque token (contains no PII)
  const qrToken = registration.qr_token || `KAS-V-${registration.id}`;

  return (
    <div className="kas-container py-12 max-w-2xl space-y-8">
      {/* ── Success Header ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-3"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${isConfirmed ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
          <CheckCircle2 size={36} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
          {isConfirmed ? 'Registration Confirmed!' : 'Registration Created'}
        </h1>

        <p className="text-sm text-neutral-600 max-w-md mx-auto">
          {isConfirmed
            ? 'Your spot is secured! Your digital entry ticket is ready below.'
            : 'Your registration has been created. Payment is required to confirm your spot.'}
        </p>
      </motion.div>

      {/* ── Digital Ticket Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-[20px] border border-neutral-200 overflow-hidden shadow-lg"
      >
        {/* Top Ticket Header */}
        <div className="bg-navy-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800">
          <div>
            <span className="text-[11px] font-800 text-amber-400 uppercase tracking-widest block">KnowASport Digital Ticket</span>
            <span className="text-xl font-800 font-mono tracking-wide text-white">{registration.registration_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isConfirmed ? 'success' : 'warning'} size="md">
              {isConfirmed ? 'CONFIRMED' : 'PENDING PAYMENT'}
            </Badge>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-700 text-amber-600 uppercase tracking-wide">{registration.event?.sport_name}</span>
            <h2 className="text-xl font-800 text-neutral-900 leading-snug">{registration.event?.title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 text-xs text-neutral-700">
            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-700 text-neutral-900 block">{formatDateShort(registration.event?.start_date)}</span>
                <span className="text-neutral-500">Event Date</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-700 text-neutral-900 block">{registration.event?.venue_name}</span>
                <span className="text-neutral-500">{registration.event?.city_name}</span>
              </div>
            </div>
          </div>

          {/* Participant / Team details */}
          <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
            <span className="font-700 text-neutral-500 uppercase tracking-wider block">Participant Details</span>
            {registration.participation_type === 'team' ? (
              <div>
                <span className="font-800 text-neutral-900 text-sm block">Team: {registration.team_name}</span>
                <span className="text-neutral-600">{registration.team_size || registration.participants?.length} Squad Players</span>
              </div>
            ) : (
              <div>
                <span className="font-800 text-neutral-900 text-sm block">{registration.participants?.[0]?.full_name || user?.email}</span>
                <span className="text-neutral-600">Individual Participant</span>
              </div>
            )}
          </div>

          {/* Real QR Ticket SVG Component */}
          <div className="p-6 rounded-[16px] bg-neutral-50 border border-neutral-200 text-center space-y-3 flex flex-col items-center justify-center">
            <div className="p-3 bg-white rounded-[12px] border border-neutral-200 shadow-sm inline-block">
              <QRCodeSVG value={qrToken} size={140} fgColor="#080C18" level="M" />
            </div>
            <div>
              <p className="text-xs font-700 text-neutral-900">
                {registration.event?.check_in_required !== false
                  ? 'Venue Check-In Required'
                  : 'No Venue Check-In Required'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {registration.event?.check_in_required !== false
                  ? 'Present this QR code or Registration ID at the venue reporting desk for entry.'
                  : 'Direct entry confirmed. Show this digital pass if requested at the venue.'}
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Footer Actions */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={() => navigate('/my-registrations')}
          >
            View My Registrations
          </Button>

          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => navigate('/events')}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            Explore More Events
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
