import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Users, DollarSign, Image as ImageIcon, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { organizerService } from '../../services/organizerService.js';
import { SPORTS_CATEGORIES, EVENT_TYPES, MAJOR_CITIES } from '../../utils/constants.js';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    sport_name: 'Football',
    event_type_name: 'Turf Event',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    registration_deadline: new Date().toISOString().split('T')[0],
    venue_name: '',
    city_name: 'Coimbatore',
    district_name: 'Coimbatore',
    participation_type: 'individual', // Default strictly set to individual
    team_size: 1,
    entry_fee: 499,
    max_participants: 200,
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  });

  const handleNext = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.title.trim()) {
        setError('Please enter a tournament title.');
        return;
      }
    }

    if (step === 2) {
      if (new Date(formData.registration_deadline) > new Date(formData.start_date)) {
        setError('Registration deadline cannot be after the tournament start date.');
        return;
      }
    }

    if (step === 3) {
      if (!formData.venue_name.trim()) {
        setError('Please enter venue name.');
        return;
      }
      if (!formData.participation_type) {
        setError('Please select a participation type.');
        return;
      }
    }

    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await organizerService.createEventDraft(formData, user);
      setSubmittedStatus('draft');
    } catch (err) {
      console.error('Save draft error:', err);
      setError(err.message || 'Could not save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const created = await organizerService.createEventDraft(formData, user);
      await organizerService.submitEventForReview(created.id, user);
      setSubmittedStatus('pending_review');
    } catch (err) {
      console.error('Submit review error:', err);
      setError(err.message || 'Could not submit event for review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedStatus) {
    return (
      <div className="kas-container py-16 text-center space-y-6 max-w-lg">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>

        <h2 className="text-2xl font-800 text-neutral-900">
          {submittedStatus === 'draft' ? 'Tournament Saved as Draft' : 'Submitted for Approval'}
        </h2>

        <p className="text-xs text-neutral-600 leading-relaxed">
          {submittedStatus === 'draft'
            ? 'Your event draft has been saved. You can publish or submit it for admin review anytime.'
            : 'Your sports event has been submitted to KnowASport Admin for review. Once verified, it will be published to public discovery.'}
        </p>

        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/organizer/dashboard')}>
            Organizer Dashboard
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/events')}>
            View Public Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="kas-container py-8 lg:py-12 space-y-8 max-w-3xl">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Organizer Platform</span>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">Create Sports Event</h1>
        </div>

        <Link to="/organizer/dashboard" className="text-xs font-700 text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between relative max-w-md mx-auto">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />

        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-800 text-xs transition-colors ${
              step >= s ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-2 text-xs font-600 text-red-700">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: BASIC INFO */}
      {step === 1 && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleNext} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base border-b border-neutral-100 pb-3">
            1. Basic Tournament Information
          </h3>

          <Input
            label="Tournament Title"
            placeholder="e.g. Coimbatore Weekend Football Cup 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">Sport</label>
              <select
                value={formData.sport_name}
                onChange={(e) => setFormData({ ...formData, sport_name: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {SPORTS_CATEGORIES.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">Event Type</label>
              <select
                value={formData.event_type_name}
                onChange={(e) => setFormData({ ...formData, event_type_name: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-700 text-neutral-700 block">Description</label>
            <textarea
              rows={4}
              placeholder="Describe tournament rules, match length, and schedule overview..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] p-3 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Next: Schedule & Dates
            </Button>
          </div>
        </motion.form>
      )}

      {/* STEP 2: DATES */}
      {step === 2 && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleNext} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base border-b border-neutral-100 pb-3">
            2. Dates & Registration Deadline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tournament Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value })}
              required
            />

            <Input
              label="Registration Deadline"
              type="date"
              value={formData.registration_deadline}
              onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
              required
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(1)} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Next: Venue & Participation
            </Button>
          </div>
        </motion.form>
      )}

      {/* STEP 3: VENUE & STRICT MUTUALLY EXCLUSIVE PARTICIPATION MODEL */}
      {step === 3 && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleNext} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base border-b border-neutral-100 pb-3">
            3. Venue & Participation Format
          </h3>

          <Input
            label="Venue Name"
            placeholder="e.g. KickOff Turf Arena"
            value={formData.venue_name}
            onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-700 text-neutral-700 block">City</label>
            <select
              value={formData.city_name}
              onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
            >
              {MAJOR_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* STRICT MUTUALLY EXCLUSIVE PARTICIPATION MODEL RADIO BUTTONS */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-700 text-neutral-800 block">Participation Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-4 rounded-[12px] border flex items-start gap-3 cursor-pointer transition-colors ${
                formData.participation_type === 'individual' ? 'bg-amber-50 border-amber-400 text-amber-950 font-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700 font-600'
              }`}>
                <input
                  type="radio"
                  name="participation_type"
                  value="individual"
                  checked={formData.participation_type === 'individual'}
                  onChange={() => setFormData({ ...formData, participation_type: 'individual', team_size: 1 })}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-800 text-neutral-900 block">○ Individual Event</span>
                  <span className="text-[11px] text-neutral-500 block font-normal mt-0.5">Single athlete entries (e.g. Singles Badminton, Marathon, Chess)</span>
                </div>
              </label>

              <label className={`p-4 rounded-[12px] border flex items-start gap-3 cursor-pointer transition-colors ${
                formData.participation_type === 'team' ? 'bg-amber-50 border-amber-400 text-amber-950 font-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700 font-600'
              }`}>
                <input
                  type="radio"
                  name="participation_type"
                  value="team"
                  checked={formData.participation_type === 'team'}
                  onChange={() => setFormData({ ...formData, participation_type: 'team', team_size: formData.team_size > 1 ? formData.team_size : 7 })}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-800 text-neutral-900 block">○ Team Event</span>
                  <span className="text-[11px] text-neutral-500 block font-normal mt-0.5">Club or squad entries (e.g. Football, Cricket, Volleyball)</span>
                </div>
              </label>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed pt-1">
              Each event supports one participation type. If you offer both individual and team competitions, create separate events.
            </p>
          </div>

          {/* DYNAMIC FORM REACTION: Show Team Specs ONLY for Team Events */}
          {formData.participation_type === 'team' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-[12px] bg-amber-50/50 border border-amber-200/80 space-y-3">
              <Input
                label="Team Squad Size (Players per Team)"
                type="number"
                min="2"
                max="30"
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: Number(e.target.value) })}
                required
              />
              <span className="text-[11px] text-amber-900 block font-600">
                Team size specifies maximum registered squad players per team entry.
              </span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Entry Fee (₹)"
              type="number"
              min="0"
              placeholder="0 for Free"
              value={formData.entry_fee}
              onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
              required
            />

            <Input
              label={formData.participation_type === 'team' ? 'Maximum Team Capacity' : 'Maximum Participant Capacity'}
              type="number"
              min="1"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
              required
            />
          </div>

          {/* Check-In Required Setting Box */}
          <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.check_in_required !== false}
                onChange={(e) => setFormData({ ...formData, check_in_required: e.target.checked })}
                className="w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500"
              />
              <span className="text-xs font-700 text-neutral-900">Require Event Entry Check-In at Venue</span>
            </label>
            <p className="text-[11px] text-neutral-500 pl-7 leading-relaxed">
              When enabled, athletes receive a digital QR ticket for scanner verification.
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(2)} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Next: Review & Submit
            </Button>
          </div>
        </motion.form>
      )}

      {/* STEP 4: REVIEW & ACTIONS */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base border-b border-neutral-100 pb-3">
            4. Review & Event Submission
          </h3>

          <div className="bg-neutral-50 p-5 rounded-[12px] border border-neutral-200 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Tournament Title:</span>
              <span className="font-800 text-neutral-900">{formData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Sport & Type:</span>
              <span className="font-700 text-neutral-900">{formData.sport_name} ({formData.event_type_name})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Participation Model:</span>
              <span className="font-800 text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                {formData.participation_type === 'team' ? `TEAM (${formData.team_size} Players)` : 'INDIVIDUAL'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Venue & City:</span>
              <span className="font-700 text-neutral-900">{formData.venue_name}, {formData.city_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Entry Fee:</span>
              <span className="font-800 text-neutral-900">₹{formData.entry_fee}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button variant="ghost" size="md" onClick={() => setStep(3)} icon={<ArrowLeft size={16} />}>
              Back to Specs
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="outline" size="md" onClick={handleSaveDraft} disabled={isSubmitting} className="flex-1 sm:flex-none">
                Save Draft
              </Button>
              <Button variant="primary" size="lg" onClick={handleSubmitForReview} disabled={isSubmitting} className="flex-1 sm:flex-none font-800">
                Submit for Approval
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
