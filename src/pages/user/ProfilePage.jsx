import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Trophy, ShieldCheck, Check, Save,
  Sparkles, ArrowRight, Activity, Calendar, Compass, Star, Award, Heart
} from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { SPORTS, MAJOR_CITIES, SKILL_LEVELS } from '../../utils/constants.js';
import { validateIndianPhoneNumber } from '../../utils/formatters.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cityName, setCityName] = useState('Coimbatore');
  const [districtName, setDistrictName] = useState('Coimbatore');
  const [primarySport, setPrimarySport] = useState('badminton');
  const [secondarySport, setSecondarySport] = useState('cricket');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [playingPosition, setPlayingPosition] = useState('');
  const [athleteBio, setAthleteBio] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
      setPhone(profile?.phone || '');
      setCityName(profile?.city_name || 'Coimbatore');
      setDistrictName(profile?.district_name || 'Coimbatore');
      setPrimarySport(profile?.primary_sport || 'badminton');
      setSecondarySport(profile?.secondary_sport || 'cricket');
      setSkillLevel(profile?.skill_level || 'intermediate');
      setGender(profile?.gender || 'male');
      setDateOfBirth(profile?.date_of_birth || '');
      setPlayingPosition(profile?.playing_position || '');
      setAthleteBio(profile?.bio || '');
    }
  }, [profile, user]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let score = 0;
    if (fullName.trim()) score += 15;
    if (phone.trim()) score += 15;
    if (cityName.trim()) score += 15;
    if (primarySport) score += 20;
    if (skillLevel) score += 15;
    if (gender) score += 10;
    if (playingPosition.trim() || athleteBio.trim()) score += 10;
    return Math.min(100, score);
  };

  const completionPercentage = calculateCompletion();

  const handleCityChange = (newCityName) => {
    setCityName(newCityName);
    const found = MAJOR_CITIES.find((c) => c.name.toLowerCase() === newCityName.toLowerCase());
    if (found) {
      setDistrictName(found.district);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);

    if (phone && !validateIndianPhoneNumber(phone)) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number.');
      setIsSaving(false);
      return;
    }

    try {
      await updateProfile({
        full_name: fullName,
        phone,
        city_name: cityName,
        district_name: districtName,
        primary_sport: primarySport,
        secondary_sport: secondarySport,
        skill_level: skillLevel,
        gender,
        date_of_birth: dateOfBirth,
        playing_position: playingPosition,
        bio: athleteBio,
      });

      // Show the celebration & recommendation prompt modal
      setShowCelebrationModal(true);
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const userEmail = profile?.email || user?.email || '';
  const userRole = profile?.role || 'user';

  return (
    <div className="kas-container py-8 lg:py-12 max-w-4xl space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              My Athlete Profile
            </h1>
            <Badge variant={userRole === 'admin' ? 'danger' : userRole === 'organizer' ? 'warning' : 'neutral'} size="sm">
              {userRole.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500">
            Keep your sports profile updated to receive tailor-made tournament recommendations.
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={signOut} className="text-red-600 hover:bg-red-50 text-xs font-700">
          Sign Out
        </Button>
      </div>

      {/* ── Profile Completion Guide Bar ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-[16px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center font-800 shadow-md flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-800 text-neutral-900">Profile Readiness</span>
              <span className="text-xs font-800 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {completionPercentage}%
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              {completionPercentage >= 90
                ? 'Your profile is fully optimized! We are tailoring tournaments to your preferences.'
                : 'Complete your profile details below to unlock personalized tournament matches.'}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 bg-neutral-200 h-2.5 rounded-full overflow-hidden self-center">
          <div
            className="bg-amber-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Profile Avatar Card */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white rounded-[16px] border border-neutral-200 p-6 text-center space-y-4 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-navy-950 text-amber-400 flex items-center justify-center font-800 text-2xl mx-auto border-2 border-navy-800 shadow-md">
              {(fullName || userEmail)[0]?.toUpperCase()}
            </div>

            <div>
              <h3 className="font-800 text-neutral-900 text-lg">{fullName || 'Athlete'}</h3>
              <p className="text-xs text-neutral-500">{userEmail}</p>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2 text-xs text-neutral-600 text-left">
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Account Type:</span>
                <span className="font-700 text-neutral-900 capitalize">{userRole}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Primary Sport:</span>
                <span className="font-700 text-amber-700 capitalize">{primarySport}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Skill Level:</span>
                <span className="font-700 text-neutral-900 capitalize">{skillLevel}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">City / District:</span>
                <span className="font-700 text-neutral-900">{cityName}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to={`/events?sport=${primarySport}&city=${cityName.toLowerCase()}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] text-xs font-800 bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Trophy size={14} className="text-amber-600" />
                View Matched Events
              </Link>
            </div>
          </div>
        </div>

        {/* Right Editable Profile Form */}
        <div className="md:col-span-8">
          <div className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-800 text-neutral-900 text-lg">
                Personal & Sporting Preferences
              </h3>
              <span className="text-xs text-neutral-400 font-500">Auto-saved to backend</span>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-600 text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Personal Details */}
              <div className="space-y-3">
                <span className="text-xs font-800 text-amber-700 uppercase tracking-wider block">
                  1. Personal Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    icon={<User size={16} />}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={userEmail}
                    disabled
                    helperText="Registered email address (read only)"
                    icon={<Mail size={16} />}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    helperText="For tournament SMS alerts and QR passes"
                    icon={<Phone size={16} />}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-700 text-neutral-700 block">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Location & Sports Preferences */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <span className="text-xs font-800 text-amber-700 uppercase tracking-wider block">
                  2. Sports & Matchmaking Preferences
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-700 text-neutral-700 block">Primary Sport</label>
                    <select
                      value={primarySport}
                      onChange={(e) => setPrimarySport(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {SPORTS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-700 text-neutral-700 block">Skill Level</label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {SKILL_LEVELS.map((sl) => (
                        <option key={sl.value} value={sl.value}>{sl.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-700 text-neutral-700 block">City</label>
                    <select
                      value={cityName}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {MAJOR_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Playing Position / Role"
                    type="text"
                    placeholder="e.g. Batsman, Striker, Singles"
                    value={playingPosition}
                    onChange={(e) => setPlayingPosition(e.target.value)}
                    icon={<Award size={16} />}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-700 text-neutral-700 block">Athlete Tagline / Bio</label>
                  <textarea
                    rows={2}
                    placeholder="Tell local organizers about your sporting experience, achievements, or favorite formats..."
                    value={athleteBio}
                    onChange={(e) => setAthleteBio(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSaving}
                  disabled={isSaving}
                  icon={<Save size={18} />}
                  className="font-800 text-sm px-6 py-3 shadow-md"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── CELEBRATION & RECOMMENDATION MODAL ── */}
      <AnimatePresence>
        {showCelebrationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCelebrationModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg bg-white rounded-[20px] border border-neutral-200 shadow-2xl p-6 sm:p-8 space-y-6 text-center z-10"
            >
              {/* Badge Icon */}
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <Sparkles size={32} />
              </div>

              {/* Title & Personalized Recommendation Message */}
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-800 text-neutral-900 tracking-tight">
                  🎯 Profile Completed Successfully!
                </h3>
                <p className="text-sm font-700 text-amber-800 bg-amber-50 border border-amber-200/80 p-3 rounded-[12px]">
                  “We recommend you the best tournaments matching your sport, city, and skill level.”
                </p>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
                  Your preferences for <strong className="font-700 text-neutral-900 capitalize">{primarySport}</strong> in <strong className="font-700 text-neutral-900">{cityName}</strong> are saved. We've customized your tournament feed so you never miss top competitions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setShowCelebrationModal(false);
                    navigate(`/events?sport=${primarySport}&city=${cityName.toLowerCase()}`);
                  }}
                  icon={<Trophy size={18} />}
                  className="font-800 shadow-md text-sm py-3.5"
                >
                  Explore Recommended Tournaments
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setShowCelebrationModal(false);
                    navigate('/dashboard');
                  }}
                  className="text-neutral-600 hover:text-neutral-900 text-xs font-700"
                >
                  Return to Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
