import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
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
    } catch (err) {
      console.error('Update event error:', err);
      setError(err.message || 'Could not update event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="kas-container py-12 max-w-3xl space-y-4">
        <SectionSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="kas-container py-8 lg:py-12 space-y-8 max-w-3xl">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Organizer Platform</span>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">Edit Tournament Specs</h1>
        </div>

        <Link to="/organizer/dashboard" className="text-xs font-700 text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-[12px] bg-green-50 border border-green-200 flex items-center justify-between text-xs font-700 text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span>Tournament specifications saved successfully.</span>
          </div>
          <Button size="xs" variant="outline" onClick={() => navigate('/organizer/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-2 text-xs font-600 text-red-700">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <Input
          label="Tournament Title"
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

        {/* STRICT MUTUALLY EXCLUSIVE PARTICIPATION MODEL */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-700 text-neutral-800 block">Participation Type *</label>
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
                <span className="text-xs font-800 text-neutral-900 block">○ Individual Event</span>
                <span className="text-[11px] text-neutral-500 block font-normal mt-0.5">Single athlete entries</span>
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
                <span className="text-xs font-800 text-neutral-900 block">○ Team Event</span>
                <span className="text-[11px] text-neutral-500 block font-normal mt-0.5">Club or squad entries</span>
              </div>
            </label>
          </div>

          {isParticipationLocked && (
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-[8px] border border-amber-200">
              Participation type cannot be changed after registrations begin.
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
          <Button variant="ghost" size="md" onClick={() => navigate('/organizer/dashboard')}>
            Cancel
          </Button>

          <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} icon={<Save size={18} />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
