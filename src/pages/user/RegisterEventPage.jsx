import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, User, Users, Calendar, MapPin, CheckCircle2, ArrowRight, ArrowLeft,
  AlertCircle, ShieldCheck, Clock
} from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useEventDetail } from '../../hooks/useEvents.js';
import { useAuth } from '../../hooks/useAuth.js';
import { registrationService } from '../../services/registrationService.js';
import { formatPrice, formatDate, formatDateShort } from '../../utils/formatters.js';
import { MAJOR_CITIES } from '../../utils/constants.js';

export default function RegisterEventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { event, isOpen, loading: eventLoading } = useEventDetail(slug);

  const [step, setStep] = useState(1); // 1: Info, 2: Review
  const [selectedFormat, setSelectedFormat] = useState('individual');
  const [teamName, setTeamName] = useState('');
  
  // Individual / Primary Participant State
  const [primaryParticipant, setPrimaryParticipant] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    email: '',
    city_name: 'Coimbatore',
  });

  // Team Members State (Array of players)
  const [teamPlayers, setTeamPlayers] = useState([]);

  const [error, setError] = useState('');
  const [duplicateRegistrationId, setDuplicateRegistrationId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize participant defaults from profile & event format
  useEffect(() => {
    if (profile || user) {
      setPrimaryParticipant({
        full_name: profile?.full_name || user?.user_metadata?.full_name || '',
        date_of_birth: '2000-01-01',
        gender: 'male',
        phone: profile?.phone || '',
        email: profile?.email || user?.email || '',
        city_name: profile?.city_name || 'Coimbatore',
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (event) {
      const pType = (event.participation_type || 'individual').toLowerCase();
      if (pType === 'team') {
        setSelectedFormat('team');
      } else {
        setSelectedFormat('individual');
      }

      // Initialize team players if team format
      const requiredSize = event.team_size || event.team_size_min || 5;
      const initialPlayers = Array.from({ length: requiredSize }, (_, i) => ({
        full_name: i === 0 ? (profile?.full_name || user?.user_metadata?.full_name || '') : '',
        phone: i === 0 ? (profile?.phone || '') : '',
        gender: 'male',
      }));
      setTeamPlayers(initialPlayers);
    }
  }, [event, profile, user]);

  if (eventLoading) {
    return (
      <div className="kas-container py-16 text-center text-neutral-500">
        Loading tournament registration...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="kas-container py-16 text-center space-y-4">
        <h2 className="text-xl font-800 text-neutral-900">Event Not Found</h2>
        <Button size="sm" onClick={() => navigate('/events')}>Browse Events</Button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="kas-container py-16 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Clock size={24} />
        </div>
        <h2 className="text-2xl font-800 text-neutral-900">Registration Unavailable</h2>
        <p className="text-sm text-neutral-600">
          Registration for <span className="font-700 text-neutral-900">{event.title}</span> is currently closed or has reached capacity.
        </p>
        <Button size="sm" onClick={() => navigate('/events')}>Browse Other Events</Button>
      </div>
    );
  }

  const handlePlayerChange = (index, field, value) => {
    const updated = [...teamPlayers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamPlayers(updated);
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError('');

    if (selectedFormat === 'team') {
      if (!teamName.trim()) {
        setError('Please enter your team name.');
        return;
      }
      for (let i = 0; i < teamPlayers.length; i++) {
        if (!teamPlayers[i].full_name.trim()) {
          setError(`Please enter the full name for Player ${i + 1}.`);
          return;
        }
      }
    } else {
      if (!primaryParticipant.full_name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!primaryParticipant.email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setError('');
    setDuplicateRegistrationId(null);
    setIsSubmitting(true);

    try {
      const participantsToSubmit =
        selectedFormat === 'team'
          ? teamPlayers.map((p) => ({
              full_name: p.full_name,
              phone: p.phone,
              gender: p.gender,
              city_name: primaryParticipant.city_name,
            }))
          : [primaryParticipant];

      const res = await registrationService.createRegistration({
        eventId: event.id,
        participationType: selectedFormat,
        teamName: selectedFormat === 'team' ? teamName : null,
        teamSize: selectedFormat === 'team' ? teamPlayers.length : 1,
        participants: participantsToSubmit,
        user,
      });

      if (res.status === 'confirmed' || res.payment_status === 'not_required' || !event.entry_fee || Number(event.entry_fee) === 0) {
        navigate(`/registration/${res.id}/success`, { replace: true });
      } else {
        navigate(`/payment/${res.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Registration submission error:', err);
      if (err.existingRegistrationId) {
        setDuplicateRegistrationId(err.existingRegistrationId);
        setError('You are already registered for this tournament.');
      } else {
        setError(err.message || 'Could not complete registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFree = !event.entry_fee || Number(event.entry_fee) === 0;

  return (
    <div className="kas-container py-8 lg:py-12 max-w-3xl space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-700 text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-[6px]">
            {event.sport_name}
          </span>
          <span className="text-xs font-600 text-neutral-400">•</span>
          <span className="text-xs font-600 text-neutral-500">{event.event_type_name || 'Tournament'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
          Event Registration
        </h1>
        <p className="text-sm font-600 text-neutral-700">{event.title}</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between relative max-w-md mx-auto">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 z-0 transition-all duration-300"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />

        <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-800 text-xs transition-colors ${step >= 1 ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
          1
        </div>
        <span className="relative z-10 text-xs font-700 text-neutral-800 bg-white px-2">
          {step === 1 ? 'Participant Details' : 'Review & Confirm'}
        </span>
        <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-800 text-xs transition-colors ${step === 2 ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
          2
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-[12px] bg-red-50 border border-red-200 space-y-2 text-xs font-600 text-red-700"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          {duplicateRegistrationId && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/my-registrations/${duplicateRegistrationId}`)}
              >
                View Existing Registration
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* STEP 1: PARTICIPANT / TEAM FORM */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Format Selector if event allows both */}
          {event.participation_type === 'both' && (
            <div className="bg-white p-4 rounded-[12px] border border-neutral-200 space-y-2">
              <label className="text-xs font-700 text-neutral-700 block">Select Participation Category</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('individual')}
                  className={`p-3 rounded-[8px] border text-xs font-700 flex items-center justify-center gap-2 transition-colors ${selectedFormat === 'individual' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-neutral-200 text-neutral-600'}`}
                >
                  <User size={16} /> Individual
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat('team')}
                  className={`p-3 rounded-[8px] border text-xs font-700 flex items-center justify-center gap-2 transition-colors ${selectedFormat === 'team' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-neutral-200 text-neutral-600'}`}
                >
                  <Users size={16} /> Team
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleStep1Submit} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
            {selectedFormat === 'team' ? (
              /* ── TEAM REGISTRATION FORM ── */
              <div className="space-y-6">
                <h3 className="font-800 text-neutral-900 text-base pb-2 border-b border-neutral-100 flex items-center gap-2">
                  <Users size={18} className="text-amber-500" />
                  Team Details ({teamPlayers.length} Players Squad)
                </h3>

                <Input
                  label="Team Name"
                  placeholder="e.g. Coimbatore Strikers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />

                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-700 uppercase tracking-wider text-neutral-500">Player Squad Roster</h4>
                  {teamPlayers.map((player, idx) => (
                    <div key={idx} className="p-4 rounded-[10px] bg-neutral-50 border border-neutral-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-700 text-neutral-900">
                        <span>Player {idx + 1} {idx === 0 && '(Captain)'}</span>
                        {idx === 0 && <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-[4px]">Primary Contact</span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          placeholder={`Full Name of Player ${idx + 1}`}
                          value={player.full_name}
                          onChange={(e) => handlePlayerChange(idx, 'full_name', e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Phone Number (Optional)"
                          value={player.phone}
                          onChange={(e) => handlePlayerChange(idx, 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── INDIVIDUAL REGISTRATION FORM ── */
              <div className="space-y-6">
                <h3 className="font-800 text-neutral-900 text-base pb-2 border-b border-neutral-100 flex items-center gap-2">
                  <User size={18} className="text-amber-500" />
                  Participant Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={primaryParticipant.full_name}
                    onChange={(e) => setPrimaryParticipant({ ...primaryParticipant, full_name: e.target.value })}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={primaryParticipant.email}
                    onChange={(e) => setPrimaryParticipant({ ...primaryParticipant, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={primaryParticipant.phone}
                    onChange={(e) => setPrimaryParticipant({ ...primaryParticipant, phone: e.target.value })}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-700 text-neutral-700 block">City</label>
                    <select
                      value={primaryParticipant.city_name}
                      onChange={(e) => setPrimaryParticipant({ ...primaryParticipant, city_name: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {MAJOR_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
                Continue to Review
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* STEP 2: REVIEW & CONFIRMATION */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="font-800 text-neutral-900 text-lg pb-3 border-b border-neutral-100">
              Review Registration Summary
            </h3>

            {/* Event Summary Card */}
            <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-3 text-xs text-neutral-700">
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="font-600">Tournament</span>
                <span className="font-800 text-neutral-900">{event.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="font-600">Date</span>
                <span className="font-700 text-neutral-900">{formatDateShort(event.start_date)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="font-600">Venue</span>
                <span className="font-700 text-neutral-900">{event.venue_name}, {event.city_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="font-600">Format</span>
                <span className="font-700 text-neutral-900 capitalize">
                  {selectedFormat === 'team' ? `Team (${teamName})` : 'Individual'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-600">Entry Fee</span>
                <span className="font-800 text-base text-neutral-900">
                  {isFree ? <span className="text-green-600 font-700">Free</span> : formatPrice(event.entry_fee)}
                </span>
              </div>
            </div>

            {/* Status Notice */}
            <div className={`p-4 rounded-[12px] border text-xs font-600 leading-relaxed ${isFree ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              {isFree ? (
                <span>✓ Free Registration — Your spot will be instantly confirmed upon submission.</span>
              ) : (
                <span>ℹ Registration Created — Payment of {formatPrice(event.entry_fee)} is required to confirm participation.</span>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
              <Button variant="ghost" size="md" onClick={() => setStep(1)} icon={<ArrowLeft size={16} />}>
                Back to Edit
              </Button>

              <Button
                variant="primary"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                icon={<CheckCircle2 size={18} />}
                iconPosition="right"
              >
                Confirm Registration
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
