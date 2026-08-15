import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, AlertCircle, CheckCircle2, ShieldCheck, Lock,
  AlertTriangle, Send, Calendar, MapPin, DollarSign, Users, User
} from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { eventService } from '../../services/eventService.js';
import { organizerService } from '../../services/organizerService.js';
import { SPORTS_CATEGORIES, EVENT_TYPES, MAJOR_CITIES } from '../../utils/constants.js';

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resubmittedSuccess, setResubmittedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    sport_name: 'Football',
    event_type_name: 'Turf Event',
    description: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    venue_name: '',
    city_name: 'Coimbatore',
    district_name: 'Coimbatore',
    participation_type: 'individual',
    team_size: 1,
    entry_fee: 0,
    max_participants: 100,
    check_in_required: true,
  });

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      setLoading(true);
      try {
        const data = await eventService.getEventById(id);
        if (active && data) {
          setEvent(data);
          setFormData({
            title: data.title || '',
            sport_name: data.sport_name || 'Football',
            event_type_name: data.event_type_name || 'Turf Event',
            description: data.description || '',
            start_date: data.start_date ? data.start_date.split('T')[0] : '',
            end_date: data.end_date ? data.end_date.split('T')[0] : '',
            registration_deadline: data.registration_deadline ? data.registration_deadline.split('T')[0] : '',
            venue_name: data.venue_name || '',
            city_name: data.city_name || 'Coimbatore',
            district_name: data.district_name || 'Coimbatore',
            participation_type: data.participation_type === 'team' ? 'team' : 'individual',
            team_size: Number(data.team_size || 1),
            entry_fee: Number(data.entry_fee || 0),
            max_participants: Number(data.max_participants || 100),
            check_in_required: data.check_in_required !== false,
          });
        }
      } catch (err) {
        console.error('Error loading event for edit:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvent();

    return () => {
      active = false;
    };
  }, [id]);

  const isParticipationLocked = event && event.status === 'published' && Number(event.current_participants || 0) > 0;

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSavedSuccess(false);
    setIsSubmitting(true);

    try {
      await organizerService.updateEvent(id, formData, user);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Update event error:', err);
      setError(err.message || 'Could not update event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const ok = await organizerService.resubmitEvent(id, formData, user);
      if (ok) {
        setResubmittedSuccess(true);
        setTimeout(() => navigate('/organizer/events'), 2000);
      }
    } catch (err) {
      console.error('Resubmit event error:', err);
      setError(err.message || 'Could not resubmit event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-8">
        <SectionSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Organizer Platform</span>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">Edit Tournament Specs</h1>
        </div>

        <Link to="/organizer/events" className="text-xs font-700 text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={16} /> My Events
        </Link>
      </div>

      {/* Changes Requested Banner */}
      {event?.status === 'changes_requested' && (
        <div className="p-4 rounded-[14px] bg-amber-50 border border-amber-300 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-800">
            <AlertTriangle size={16} className="text-amber-600" />
            <span>Admin Reviewer Requested Modifications</span>
          </div>
          <p className="text-amber-800 font-600">
            {event.changes_requested_reason || 'Please review and update tournament details as requested by the admin team, then click "Save & Resubmit for Review".'}
          </p>
        </div>
      )}

      {resubmittedSuccess && (
        <div className="p-4 rounded-[12px] bg-green-50 border border-green-200 flex items-center justify-between text-xs font-700 text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span>Tournament resubmitted for Admin review. Redirecting to My Events...</span>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-[12px] bg-green-50 border border-green-200 flex items-center justify-between text-xs font-700 text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span>Tournament specifications saved successfully.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-2 text-xs font-600 text-red-700">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-[18px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <Input
          label="Tournament Title *"
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
              className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-xs text-neutral-900 font-600 focus:ring-2 focus:ring-amber-500"
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
              className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-xs text-neutral-900 font-600 focus:ring-2 focus:ring-amber-500"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* STRICT MUTUALLY EXCLUSIVE PARTICIPATION MODEL */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-700 text-neutral-800 block">Participation Entry Type *</label>
            {isParticipationLocked && (
              <span className="text-[10px] font-800 text-amber-700 flex items-center gap-1">
                <Lock size={12} /> Locked after registrations begin
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`p-4 rounded-[12px] border flex items-start gap-3 transition-colors ${
              formData.participation_type === 'individual' ? 'bg-amber-50 border-amber-400 text-amber-950 font-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700 font-600'
            } ${isParticipationLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="participation_type"
                value="individual"
                disabled={isParticipationLocked}
                checked={formData.participation_type === 'individual'}
                onChange={() => setFormData({ ...formData, participation_type: 'individual', team_size: 1 })}
                className="mt-0.5 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-800 text-neutral-900 block flex items-center gap-1.5">
                  <User size={13} /> Individual Entry
                </span>
                <span className="text-[11px] text-neutral-500 block font-normal mt-0.5">Single athlete per registration</span>
              </div>
            </label>

            <label className={`p-4 rounded-[12px] border flex items-start gap-3 transition-colors ${
              formData.participation_type === 'team' ? 'bg-amber-50 border-amber-400 text-amber-950 font-800' : 'bg-neutral-50 border-neutral-200 text-neutral-700 font-600'
            } ${isParticipationLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="participation_type"
                value="team"
                disabled={isParticipationLocked}
                checked={formData.participation_type === 'team'}
                onChange={() => setFormData({ ...formData, participation_type: 'team', team_size: formData.team_size > 1 ? formData.team_size : 7 })}
                className="mt-0.5 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-800 text-neutral-900 block flex items-center gap-1.5">
                  <Users size={13} /> Team Entry
                </span>
                <span className="text-[11px] text-neutral-500 block font-normal mt-0.5">Club or squad registration</span>
              </div>
            </label>
          </div>

          {formData.participation_type === 'team' && (
            <div className="pt-2 max-w-xs">
              <Input
                label="Team Squad Size (Athletes per team) *"
                type="number"
                min="2"
                max="30"
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: Number(e.target.value) })}
                required
              />
            </div>
          )}
        </div>

        {/* Date & Deadline Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Tournament Start Date *"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
          <Input
            label="Tournament End Date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
          <Input
            label="Registration Deadline *"
            type="date"
            value={formData.registration_deadline}
            onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
            required
          />
        </div>

        {/* Venue & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Venue / Ground Name *"
            value={formData.venue_name}
            onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
            placeholder="e.g. Nehru Stadium Courts"
            required
          />
          <div className="space-y-1.5">
            <label className="text-xs font-700 text-neutral-700 block">City / District</label>
            <select
              value={formData.city_name}
              onChange={(e) => {
                const city = e.target.value;
                const found = MAJOR_CITIES.find((c) => c.name.toLowerCase() === city.toLowerCase());
                setFormData({
                  ...formData,
                  city_name: city,
                  district_name: found ? found.district : city,
                });
              }}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-xs text-neutral-900 font-600 focus:ring-2 focus:ring-amber-500"
            >
              {MAJOR_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Entry Fee & Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Registration Entry Fee (₹) — Set 0 for Free"
            type="number"
            min="0"
            step="10"
            value={formData.entry_fee}
            onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
          />
          <Input
            label="Maximum Participant Capacity *"
            type="number"
            min="1"
            max="2000"
            value={formData.max_participants}
            onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
            required
          />
        </div>

        {/* Check-In Requirement Toggle */}
        <div className="p-4 rounded-[12px] border border-neutral-200 bg-neutral-50 flex items-start justify-between gap-4">
          <div>
            <span className="font-800 text-neutral-900 text-xs block">On-Site QR Check-In Verification</span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Require athlete QR pass scanning at event entrance. If disabled, check-in metrics will be marked as not required.
            </span>
          </div>
          <input
            type="checkbox"
            checked={formData.check_in_required}
            onChange={(e) => setFormData({ ...formData, check_in_required: e.target.checked })}
            className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-300"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-700 text-neutral-700 block">Tournament Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide tournament format, eligibility rules, prize details..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2 text-xs text-neutral-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-between items-center gap-3">
          <Button variant="ghost" size="md" onClick={() => navigate('/organizer/events')}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {event?.status === 'changes_requested' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                onClick={handleResubmit}
                icon={<Send size={15} />}
                className="bg-amber-600 hover:bg-amber-500"
              >
                Save & Resubmit to Admin
              </Button>
            )}

            <Button type="submit" variant={event?.status === 'changes_requested' ? 'outline' : 'primary'} size="md" disabled={isSubmitting} icon={<Save size={15} />}>
              Save Specs
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
