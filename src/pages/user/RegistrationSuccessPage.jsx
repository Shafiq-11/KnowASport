import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Ticket, Trophy, Calendar, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import RegistrationPassCard from '../../components/events/RegistrationPassCard.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registrationService } from '../../services/registrationService.js';

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
      <div className="kas-container py-16 max-w-2xl mx-auto space-y-4">
        <SectionSkeleton count={2} />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="kas-container py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Ticket size={28} />
        </div>
        <h2 className="text-xl font-800 text-neutral-900">Registration Pass Not Found</h2>
        <p className="text-xs text-neutral-500">
          We couldn't retrieve this registration. Please check your registered events or login again.
        </p>
        <Button size="sm" onClick={() => navigate('/my-registrations')}>Go to My Registrations</Button>
      </div>
    );
  }

  const isConfirmed = registration.status === 'confirmed';

  return (
    <div className="kas-container py-8 lg:py-12 max-w-2xl space-y-6">
      {/* ── Success Header ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-2.5 pb-2"
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md ${isConfirmed ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
          <CheckCircle2 size={32} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
          {isConfirmed ? 'Registration Confirmed!' : 'Registration Created'}
        </h1>

        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
          {isConfirmed
            ? 'Your spot is secured! Your official digital pass with QR Code & Pass Code is ready below.'
            : 'Your registration has been created. Complete payment to generate your confirmed pass.'}
        </p>
      </motion.div>

      {/* ── Official Registration Pass Card Component ── */}
      <RegistrationPassCard
        registration={registration}
        event={registration.event}
        user={user}
      />

      {/* ── Quick Navigation Links ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={() => navigate('/my-registrations')}
          icon={<Ticket size={16} />}
        >
          View All My Registrations
        </Button>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => navigate('/events')}
          icon={<ArrowRight size={16} />}
          iconPosition="right"
        >
          Explore More Events
        </Button>
      </div>
    </div>
  );
}
