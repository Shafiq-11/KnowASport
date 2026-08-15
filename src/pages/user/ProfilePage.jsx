import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Trophy, ShieldCheck, Check, Save } from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { SPORTS, MAJOR_CITIES, SKILL_LEVELS } from '../../utils/constants.js';

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cityName, setCityName] = useState('Coimbatore');
  const [districtName, setDistrictName] = useState('Coimbatore');
  const [primarySport, setPrimarySport] = useState('badminton');
  const [skillLevel, setSkillLevel] = useState('intermediate');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
      setPhone(profile?.phone || '');
      setCityName(profile?.city_name || 'Coimbatore');
      setDistrictName(profile?.district_name || 'Coimbatore');
      setPrimarySport(profile?.primary_sport || 'badminton');
      setSkillLevel(profile?.skill_level || 'intermediate');
    }
  }, [profile, user]);

  const handleCityChange = (newCityName) => {
    setCityName(newCityName);
    const found = MAJOR_CITIES.find(c => c.name.toLowerCase() === newCityName.toLowerCase());
    if (found) {
      setDistrictName(found.district);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsSaving(true);

    try {
      await updateProfile({
        full_name: fullName,
        phone,
        city_name: cityName,
        district_name: districtName,
        primary_sport: primarySport,
        skill_level: skillLevel,
      });

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
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
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              My Profile
            </h1>
            <Badge variant={userRole === 'admin' ? 'danger' : userRole === 'organizer' ? 'warning' : 'neutral'} size="sm">
              {userRole.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500">
            Manage your personal details and athlete preferences
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={signOut} className="text-red-600 hover:bg-red-50">
          Sign Out
        </Button>
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

            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="font-700 text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Sport:</span>
                <span className="font-700 text-neutral-900 capitalize">{primarySport}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-700 text-neutral-900">{cityName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Editable Profile Form */}
        <div className="md:col-span-8">
          <div className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-800 text-neutral-900 text-lg pb-3 border-b border-neutral-100">
              Personal & Sport Information
            </h3>

            {/* Success Alert */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-[8px] bg-green-50 border border-green-200 flex items-center gap-2 text-xs font-600 text-green-800"
              >
                <Check size={16} className="text-green-600" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-600 text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
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
                  helperText="Email address cannot be changed"
                  icon={<Mail size={16} />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<Phone size={16} />}
                />

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
              </div>

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

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSaving}
                  disabled={isSaving}
                  icon={<Save size={16} />}
                >
                  Save Profile Updates
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
