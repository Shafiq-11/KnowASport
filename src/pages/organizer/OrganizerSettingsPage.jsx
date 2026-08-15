import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Shield, Sliders, Bell, CheckCircle2, AlertCircle, Save, Lock,
  KeyRound, UserCheck, Eye, EyeOff, Globe, Phone, Mail, MapPin, Sparkles
} from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import VerifiedBadge from '../../components/organizer/VerifiedBadge.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { organizerService } from '../../services/organizerService.js';
import { MAJOR_CITIES } from '../../utils/constants.js';
import { validateIndianPhoneNumber } from '../../utils/formatters.js';

export default function OrganizerSettingsPage() {
  const navigate = useNavigate();
  const { user, profile, changePassword, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'preferences' | 'notifications'
  const [loading, setLoading] = useState(true);

  // Profile / Organization Details State
  const [orgData, setOrgData] = useState({
    organization_name: '',
    organization_type: 'club',
    city_name: 'Coimbatore',
    district_name: 'Coimbatore',
    phone: '',
    email: '',
    website_url: '',
    description: '',
    verification_status: 'pending',
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Metric Preferences State
  const [metricPrefs, setMetricPrefs] = useState({
    show_revenue_breakdown: true,
    show_registration_trends: true,
    show_sport_performance: true,
    show_checkin_analytics: true,
    show_top_events: true,
    show_recent_registrations: true,
  });

  // Notification Preferences State
  const [notifyPrefs, setNotifyPrefs] = useState({
    notify_registrations: true,
    notify_payments: true,
    notify_approvals: true,
    notify_event_updates: true,
  });

  // Feedback messages
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      if (!user) return;
      setLoading(true);

      try {
        const [orgProfile, prefs] = await Promise.all([
          organizerService.getOrganizerProfile(user.id),
          organizerService.getDashboardPreferences(user.id),
        ]);

        if (active) {
          if (orgProfile) {
            setOrgData({
              organization_name: orgProfile.organization_name || profile?.full_name || '',
              organization_type: orgProfile.organization_type || 'club',
              city_name: orgProfile.city_name || profile?.city_name || 'Coimbatore',
              district_name: orgProfile.district_name || profile?.district_name || 'Coimbatore',
              phone: orgProfile.phone || profile?.phone || '',
              email: orgProfile.email || user.email || '',
              website_url: orgProfile.website_url || '',
              description: orgProfile.description || '',
              verification_status: orgProfile.verification_status || 'verified',
            });
          }

          if (prefs) {
            setMetricPrefs({
              show_revenue_breakdown: prefs.show_revenue_breakdown !== false,
              show_registration_trends: prefs.show_registration_trends !== false,
              show_sport_performance: prefs.show_sport_performance !== false,
              show_checkin_analytics: prefs.show_checkin_analytics !== false,
              show_top_events: prefs.show_top_events !== false,
              show_recent_registrations: prefs.show_recent_registrations !== false,
            });

            setNotifyPrefs({
              notify_registrations: prefs.notify_registrations !== false,
              notify_payments: prefs.notify_payments !== false,
              notify_approvals: prefs.notify_approvals !== false,
              notify_event_updates: prefs.notify_event_updates !== false,
            });
          }
        }
      } catch (err) {
        console.error('Error loading organizer settings:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [user, profile]);

  const clearMessages = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleCityChange = (newCity) => {
    const found = MAJOR_CITIES.find((c) => c.name.toLowerCase() === newCity.toLowerCase());
    setOrgData({
      ...orgData,
      city_name: newCity,
      district_name: found ? found.district : newCity,
    });
  };

  // ── 1. Save Profile Details ──
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);

    if (orgData.phone && !validateIndianPhoneNumber(orgData.phone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      setIsSaving(false);
      return;
    }

    try {
      await organizerService.updateOrganizerProfile(user.id, orgData);
      setSuccessMsg('Organizer profile details updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Failed to update organization profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 2. Save Password Change ──
  const handleSavePassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);

    if (passwordForm.newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      setIsSaving(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      setIsSaving(false);
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setSuccessMsg('Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Password change error:', err);
      setErrorMsg(err.message || 'Failed to update password. Please verify current password.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 3. Save Metric Preferences ──
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);

    try {
      await organizerService.updateDashboardPreferences(user.id, {
        ...metricPrefs,
        ...notifyPrefs,
      });
      setSuccessMsg('Dashboard display preferences saved successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save preferences error:', err);
      setErrorMsg('Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Organization Details', icon: Building2 },
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'preferences', label: 'Dashboard Metrics', icon: Sliders },
    { id: 'notifications', label: 'Notification Alerts', icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Organizer Settings
            </h1>
            <VerifiedBadge size="sm" />
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your organization profile, security, password, and dashboard preferences.
          </p>
        </div>
      </div>

      {/* Global Feedback Banners */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-[12px] bg-green-50 border border-green-200 flex items-center justify-between text-xs font-700 text-green-800 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-green-700 hover:text-green-900 font-800">
            ×
          </button>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-2 text-xs font-600 text-red-700 shadow-xs"
        >
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-700 hover:text-red-900 font-800">
            ×
          </button>
        </motion.div>
      )}

      {/* ── Settings Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hidden border-b border-neutral-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id);
              clearMessages();
            }}
            className={`flex items-center gap-2 py-2 px-3.5 text-xs font-700 whitespace-nowrap rounded-[8px] transition-colors ${
              activeTab === id
                ? 'bg-amber-50 text-amber-900 border border-amber-300 font-800 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <Icon size={14} className={activeTab === id ? 'text-amber-600' : 'text-neutral-400'} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-[20px] border border-neutral-200 p-8 shadow-xs">
          <SectionSkeleton count={3} />
        </div>
      ) : (
        /* ── TAB CONTENT ── */
        <div className="bg-white rounded-[20px] border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* ── 1. ORGANIZATION PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="font-800 text-neutral-900 text-base">Organization Information</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Public and operational details visible on your tournament listings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Organization / Academy Name *"
                  value={orgData.organization_name}
                  onChange={(e) => setOrgData({ ...orgData, organization_name: e.target.value })}
                  placeholder="e.g. Coimbatore Sports Academy"
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-700 text-neutral-700 block">Organization Type</label>
                  <select
                    value={orgData.organization_type}
                    onChange={(e) => setOrgData({ ...orgData, organization_type: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-xs text-neutral-900 font-600 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="club">Sports Club</option>
                    <option value="academy">Sports Academy</option>
                    <option value="association">District / State Association</option>
                    <option value="college">College / University</option>
                    <option value="school">School</option>
                    <option value="individual">Individual Organizer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Contact Phone"
                  value={orgData.phone}
                  onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                />

                <Input
                  label="Display Email"
                  value={orgData.email}
                  onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                  placeholder="contact@organization.com"
                  type="email"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-700 text-neutral-700 block">Operating City</label>
                  <select
                    value={orgData.city_name}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-xs text-neutral-900 font-600 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    {MAJOR_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Official Website URL"
                  value={orgData.website_url}
                  onChange={(e) => setOrgData({ ...orgData, website_url: e.target.value })}
                  placeholder="https://yourorganization.in"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-700 text-neutral-700 block">About Organization</label>
                <textarea
                  rows={3}
                  value={orgData.description}
                  onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                  placeholder="Brief summary of sporting credentials and tournament organizing background..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  icon={<Save size={15} />}
                >
                  Save Profile Details
                </Button>
              </div>
            </form>
          )}

          {/* ── 2. SECURITY & PASSWORD TAB ── */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-6">
              <div>
                <h3 className="font-800 text-neutral-900 text-base">Change Account Password</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Update your login password securely using encrypted Supabase Authentication.
                </p>
              </div>

              <div className="max-w-md space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-700 text-neutral-700 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-700 text-neutral-700 block">New Password (Min. 6 characters) *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-700 text-neutral-700 block">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                <span className="font-800 text-neutral-800 block flex items-center gap-1.5">
                  <Lock size={12} className="text-amber-600" />
                  Security Protocol Notice
                </span>
                <p>
                  Passwords are processed exclusively through secure cryptographic hashing. Plaintext passwords are never stored or accessible by platform administrators.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  icon={<KeyRound size={15} />}
                >
                  Update Password
                </Button>
              </div>
            </form>
          )}

          {/* ── 3. METRIC PREFERENCES TAB ── */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div>
                <h3 className="font-800 text-neutral-900 text-base">Dashboard Metrics Customization</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Choose which secondary operational metrics and analytical widgets appear on your dashboard.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'show_revenue_breakdown',
                    label: 'Financial & Revenue Settlement Breakdown',
                    desc: 'Displays gross payments, KnowASport platform fees, and net organizer earnings.',
                  },
                  {
                    key: 'show_registration_trends',
                    label: 'Registration & Revenue Time-Series Trends',
                    desc: 'Displays visual trend charts for daily and weekly event entries.',
                  },
                  {
                    key: 'show_sport_performance',
                    label: 'Sport Performance Distribution',
                    desc: 'Displays distribution of event participation across different sports.',
                  },
                  {
                    key: 'show_checkin_analytics',
                    label: 'Athlete Check-In Attendance Analytics',
                    desc: 'Shows check-in attendance ratios for verified check-in events.',
                  },
                  {
                    key: 'show_top_events',
                    label: 'Top Performing Events Leaderboard',
                    desc: 'Highlights your most popular tournaments by registrations count.',
                  },
                  {
                    key: 'show_recent_registrations',
                    label: 'Recent Registrations Live Feed',
                    desc: 'Displays a live table of latest incoming athlete entries.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="p-4 rounded-[12px] border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-800 text-neutral-900 text-xs block">{item.label}</span>
                      <span className="text-[11px] text-neutral-500 mt-0.5 block">{item.desc}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={metricPrefs[item.key]}
                      onChange={(e) => setMetricPrefs({ ...metricPrefs, [item.key]: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-300"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  icon={<Save size={15} />}
                >
                  Save Display Preferences
                </Button>
              </div>
            </form>
          )}

          {/* ── 4. NOTIFICATION PREFERENCES TAB ── */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div>
                <h3 className="font-800 text-neutral-900 text-base">Organizer Notification Alerts</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Control operational alert categories sent to your organizer inbox and account.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'notify_registrations',
                    label: 'New Athlete Registrations',
                    desc: 'Receive alerts whenever an athlete or team registers for your tournaments.',
                  },
                  {
                    key: 'notify_payments',
                    label: 'Payment Captures & Settlements',
                    desc: 'Receive notifications when entry fees are successfully captured.',
                  },
                  {
                    key: 'notify_approvals',
                    label: 'Admin Moderation & Approvals',
                    desc: 'Receive alerts when submitted tournaments are approved or feedback is requested.',
                  },
                  {
                    key: 'notify_event_updates',
                    label: 'Event Lifecycle & Deadline Reminders',
                    desc: 'Alerts for registration closing dates and tournament start dates.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="p-4 rounded-[12px] border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-800 text-neutral-900 text-xs block">{item.label}</span>
                      <span className="text-[11px] text-neutral-500 mt-0.5 block">{item.desc}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={notifyPrefs[item.key]}
                      onChange={(e) => setNotifyPrefs({ ...notifyPrefs, [item.key]: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-300"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  icon={<Save size={15} />}
                >
                  Save Notification Settings
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
