import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Building2, Trophy, Clock, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { organizerService } from '../../services/organizerService.js';
import { MAJOR_CITIES, SPORTS_CATEGORIES } from '../../utils/constants.js';
import { validateIndianPhoneNumber } from '../../utils/formatters.js';

export default function OrganizerRegisterPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);
  const [appStatus, setAppStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'Sports Club',
    phone: '',
    email: '',
    city_name: 'Coimbatore',
    district_name: 'Coimbatore',
    description: '',
    sports_handled: ['Football', 'Cricket'],
    experience_years: '1-3 years',
    website_url: '',
  });

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await organizerService.getApplicationStatus(user.id);
        if (active) {
          setAppStatus(res.status);
          if (res.application) {
            setFormData((prev) => ({
              ...prev,
              organization_name: res.application.organization_name || '',
              phone: res.application.phone || '',
              description: res.application.description || '',
            }));
          }
        }
      } catch (err) {
        console.error('Error checking application status:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkStatus();

    return () => {
      active = false;
    };
  }, [user]);

  // Pre-fill profile info
  useEffect(() => {
    if (profile || user) {
      setFormData((prev) => ({
        ...prev,
        phone: prev.phone || profile?.phone || '',
        email: prev.email || profile?.email || user?.email || '',
        city_name: prev.city_name || profile?.city_name || 'Coimbatore',
      }));
    }
  }, [profile, user]);

  const handleSportToggle = (sportName) => {
    setFormData((prev) => {
      const exists = prev.sports_handled.includes(sportName);
      if (exists) {
        return { ...prev, sports_handled: prev.sports_handled.filter((s) => s !== sportName) };
      } else {
        return { ...prev, sports_handled: [...prev.sports_handled, sportName] };
      }
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.organization_name.trim()) {
        setError('Please enter your organization name.');
        return;
      }
      if (!formData.phone || !validateIndianPhoneNumber(formData.phone)) {
        setError('Enter a valid 10-digit mobile number.');
        return;
      }
    }

    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await organizerService.submitApplication(formData, user);
      setAppStatus('pending');
    } catch (err) {
      console.error('Application submission error:', err);
      setError(err.message || 'Could not submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="kas-container py-16 text-center text-neutral-500">
        Checking organizer application status...
      </div>
    );
  }

  // Application Under Review State
  if (appStatus === 'pending') {
    return (
      <div className="kas-container py-16 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Clock size={36} />
        </div>

        <div className="space-y-2">
          <Badge variant="warning" size="md">UNDER REVIEW</Badge>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Application Submitted
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
            Your application for <span className="font-700 text-neutral-900">{formData.organization_name || 'Organizer Account'}</span> is under review by KnowASport admins.
          </p>
        </div>

        <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
          <p>We review organization details to ensure athlete safety and tournament quality.</p>
          <p className="font-600 text-neutral-900">Estimated Review Time: 12-24 hours</p>
        </div>

        <Button size="sm" onClick={() => navigate('/events')}>Browse Public Events</Button>
      </div>
    );
  }

  // Already Approved State
  if (appStatus === 'approved') {
    return (
      <div className="kas-container py-16 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={36} />
        </div>

        <h1 className="text-2xl font-800 text-neutral-900">Organizer Approved</h1>
        <p className="text-sm text-neutral-600">Your account is active. You can create and publish sports events.</p>

        <Button size="md" onClick={() => navigate('/organizer/dashboard')}>Go to Organizer Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="kas-container py-8 lg:py-12 max-w-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Building2 size={22} className="text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Become a KnowASport Organizer
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Publish tournaments, manage team registrations, and verify athlete entry passes across Tamil Nadu.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between relative max-w-md mx-auto">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />

        {[1, 2, 3].map((s) => (
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

      {/* STEP 1: ORGANIZATION INFO */}
      {step === 1 && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleNextStep} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base border-b border-neutral-100 pb-3">
            1. Organization & Contact Details
          </h3>

          <Input
            label="Organization / Club Name"
            placeholder="e.g. Coimbatore Sports Academy"
            value={formData.organization_name}
            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Input
              label="Official Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">Base City</label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">Organization Type</label>
              <select
                value={formData.organization_type}
                onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {['Sports Club', 'Academy', 'College', 'School', 'Turf Facility', 'Gym & Fitness', 'Event Company', 'Community', 'Individual Organizer'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Continue
            </Button>
          </div>
        </motion.form>
      )}

      {/* STEP 2: SPORTS & EXPERIENCE */}
      {step === 2 && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleNextStep} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base border-b border-neutral-100 pb-3">
            2. Sports Handled & Experience
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-700 text-neutral-700 block">Select Primary Sports</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SPORTS_CATEGORIES.slice(0, 9).map((sp) => {
                const checked = formData.sports_handled.includes(sp.name);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSportToggle(sp.name)}
                    className={`p-2.5 rounded-[8px] border text-xs font-700 text-left transition-colors ${
                      checked ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '}{sp.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">Event Experience</label>
              <select
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {['First-time Organizer', '1-3 years', '3-5 years', '5+ years'].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <Input
              label="Website or Instagram Page (Optional)"
              placeholder="https://instagram.com/myclub"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(1)} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Continue
            </Button>
          </div>
        </motion.form>
      )}

      {/* STEP 3: REVIEW & SUBMIT */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-800 text-neutral-900 text-base border-b border-neutral-100 pb-3">
            3. Review & Submit Application
          </h3>

          <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 space-y-2 text-xs text-neutral-700">
            <div className="flex justify-between py-1 border-b border-neutral-200/60">
              <span className="font-600">Organization</span>
              <span className="font-800 text-neutral-900">{formData.organization_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200/60">
              <span className="font-600">Type</span>
              <span className="font-700 text-neutral-900">{formData.organization_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200/60">
              <span className="font-600">Base City</span>
              <span className="font-700 text-neutral-900">{formData.city_name}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-600">Sports Handled</span>
              <span className="font-700 text-neutral-900">{formData.sports_handled.join(', ')}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(2)} icon={<ArrowLeft size={16} />}>
              Edit Details
            </Button>
            <Button
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmit}
              icon={<ShieldCheck size={18} />}
            >
              Submit Application
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
