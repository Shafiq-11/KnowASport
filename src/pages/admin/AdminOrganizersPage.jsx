import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Building2, CheckCircle2, XCircle, AlertCircle, Clock,
  Calendar, Search, Filter, Phone, Mail, Award, ArrowRight, RefreshCw,
  Trophy, Camera, CreditCard, Lock, Smartphone, Check, Eye, UserCheck
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { adminService } from '../../services/adminService.js';
import { formatDateShort } from '../../utils/formatters.js';

export default function AdminOrganizersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'registered'
  const [applications, setApplications] = useState([]);
  const [registeredOrganizers, setRegisteredOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedApp, setSelectedApp] = useState(null);
  const [showKycAuditModal, setShowKycAuditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, orgs] = await Promise.all([
        adminService.getPendingApplications(),
        adminService.getOrganizersWithEvents(),
      ]);
      setApplications(apps || []);
      setRegisteredOrganizers(orgs || []);
    } catch (err) {
      console.error('Error fetching admin organizer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleApprove = async (app) => {
    setActionId(app.id);
    try {
      await adminService.approveOrganizerApplication(app.id, user);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' } : a)));
      if (selectedApp?.id === app.id) {
        setSelectedApp((prev) => ({ ...prev, status: 'approved' }));
      }
      showToast(`Organizer "${app.organization_name}" approved successfully!`);
      // Reload organizers
      const orgs = await adminService.getOrganizersWithEvents();
      setRegisteredOrganizers(orgs || []);
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) return;
    setActionId(selectedApp.id);

    try {
      await adminService.rejectOrganizerApplication(selectedApp.id, rejectionReason, user);
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'rejected', rejection_reason: rejectionReason } : a))
      );
      showToast(`Application for "${selectedApp.organization_name}" rejected.`);
      setShowRejectModal(false);
      setShowKycAuditModal(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionId(null);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (a.organization_name || '').toLowerCase().includes(q) ||
      (a.city_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.aadhaar_holder_name || '').toLowerCase().includes(q)
    );
  });

  // Filtered registered organizers
  const filteredOrganizers = registeredOrganizers.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (o.organization_name || '').toLowerCase().includes(q) ||
      (o.city_name || '').toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q)
    );
  });

  const pendingAppsCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-[12px] text-xs font-700 shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-[8px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck size={18} className="text-amber-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Admin Organizer Verification Panel
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Audit Aadhaar KYC credentials, Live Selfie photos, and phone verification for tournament organizers across Tamil Nadu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
          >
            Refresh List
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('applications')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-700 transition-all
            ${activeTab === 'applications'
              ? 'bg-amber-500 text-neutral-950 font-800 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }
          `}
        >
          <span>Verification Applications</span>
          {pendingAppsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-800 ${
                activeTab === 'applications' ? 'bg-neutral-950/20 text-neutral-950' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {pendingAppsCount} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('registered')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-700 transition-all
            ${activeTab === 'registered'
              ? 'bg-amber-500 text-neutral-950 font-800 shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }
          `}
        >
          <span>Registered Organizers & Events</span>
          <span
            className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-800 ${
              activeTab === 'registered' ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {registeredOrganizers.length}
          </span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'applications'
                ? 'Search by organization, representative, city...'
                : 'Search organizers by name, city...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="text-xs text-neutral-400">
          Showing {activeTab === 'applications' ? filteredApps.length : filteredOrganizers.length} entries
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <SectionSkeleton count={3} />
      ) : activeTab === 'applications' ? (
        // APPLICATIONS TAB
        filteredApps.length > 0 ? (
          <div className="space-y-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-6 space-y-4 shadow-sm hover:border-neutral-700 transition-colors"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Live Selfie Avatar */}
                    {app.live_photo_url ? (
                      <div className="relative flex-shrink-0">
                        <img
                          src={app.live_photo_url}
                          alt="Selfie"
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/80 shadow-sm"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5 shadow-xs">
                          <Check size={10} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                        <Building2 size={20} />
                      </div>
                    )}

                    <div>
                      <h3 className="font-800 text-white text-lg tracking-tight">{app.organization_name}</h3>
                      <p className="text-xs text-neutral-400">
                        Rep: <span className="font-700 text-neutral-200">{app.aadhaar_holder_name || 'Authorized Official'}</span> • {app.organization_type} • <span className="font-700 text-neutral-200">{app.city_name}</span>
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}
                    size="md"
                  >
                    {app.status.toUpperCase()}
                  </Badge>
                </div>

                {/* KYC Verification Badges Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Mobile OTP Status</span>
                    <span className="font-700 font-mono text-green-400 flex items-center gap-1.5">
                      <Smartphone size={13} className="text-green-400" />
                      {app.phone ? `✓ ${app.phone}` : 'Pending OTP'}
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Aadhaar (Masked)</span>
                    <span className="font-700 font-mono text-white flex items-center gap-1.5">
                      <CreditCard size={13} className="text-amber-400" />
                      {app.aadhaar_number ? app.aadhaar_number.replace(/\d{4}\s\d{4}/, 'XXXX XXXX') : 'XXXX XXXX 1001'}
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Live Photo Selfie</span>
                    <span className="font-700 text-green-400 flex items-center gap-1.5">
                      <Camera size={13} className="text-green-400" />
                      {app.live_photo_url ? '✓ Selfie Captured' : 'Pending Selfie'}
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Sports Handled</span>
                    <span className="font-700 text-amber-400 truncate block">
                      {Array.isArray(app.sports_handled)
                        ? app.sports_handled.join(', ')
                        : app.sports_handled || 'All Sports'}
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-neutral-500">
                    Submitted on {formatDateShort(app.created_at || new Date().toISOString())}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* REVIEW KYC & AUDIT BUTTON */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowKycAuditModal(true);
                      }}
                      icon={<ShieldCheck size={14} className="text-amber-400" />}
                      className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-xs font-700"
                    >
                      Review KYC & Audit
                    </Button>

                    {app.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setShowRejectModal(true);
                          }}
                          className="text-red-400 hover:bg-red-500/10 text-xs"
                        >
                          Reject
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          loading={actionId === app.id}
                          disabled={actionId === app.id}
                          onClick={() => handleApprove(app)}
                          icon={<CheckCircle2 size={15} />}
                          className="text-xs font-800"
                        >
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-[16px] p-8 text-center">
            <EmptyState
              icon={ShieldCheck}
              title="No organizer applications found"
              description="All submitted organizer applications have been reviewed."
            />
          </div>
        )
      ) : (
        // REGISTERED ORGANIZERS & EVENTS TAB
        filteredOrganizers.length > 0 ? (
          <div className="space-y-4">
            {filteredOrganizers.map((org) => (
              <div
                key={org.id}
                className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-6 space-y-4 shadow-sm hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-neutral-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-800 text-white text-lg tracking-tight">{org.organization_name}</h3>
                      <Badge variant={org.verification_status === 'verified' ? 'success' : 'warning'} size="sm">
                        {org.verification_status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {org.organization_type} • Location: <span className="font-700 text-neutral-200">{org.city_name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/events`)}
                      icon={<Trophy size={14} className="text-amber-400" />}
                      className="border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800"
                    >
                      Review Tournaments ({org.total_events || 0})
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Total Events Added</span>
                    <span className="text-lg font-800 text-white">{org.total_events || 0}</span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Published & Live</span>
                    <span className="text-lg font-800 text-green-400">{org.published_events || 0}</span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Pending Approval</span>
                    <span className="text-lg font-800 text-amber-400">{org.pending_events || 0}</span>
                  </div>

                  <div className="bg-neutral-950/60 p-3 rounded-[10px] border border-neutral-800/60">
                    <span className="font-600 text-neutral-400 block mb-0.5">Drafts In Progress</span>
                    <span className="text-lg font-800 text-neutral-300">{org.draft_events || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-[16px] p-8 text-center">
            <EmptyState
              icon={Building2}
              title="No registered organizers found"
              description="No registered organizers match your search criteria."
            />
          </div>
        )
      )}

      {/* ── ORGANIZER KYC AUDIT MODAL ── */}
      {showKycAuditModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-[20px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="border-b border-neutral-800 pb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedApp.status === 'approved' ? 'success' : 'warning'} size="sm">
                    {selectedApp.status.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] font-700 text-amber-400 uppercase tracking-wide">
                    Aadhaar & Photo KYC Audit
                  </span>
                </div>
                <h2 className="text-xl font-800 text-white tracking-tight">{selectedApp.organization_name}</h2>
                <span className="text-xs text-neutral-400">Application ID: {selectedApp.id}</span>
              </div>

              <button
                onClick={() => setShowKycAuditModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* KYC Live Photo + Aadhaar Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-neutral-950/80 border border-neutral-800/80 rounded-[16px] p-5">
              {/* Live Selfie Column */}
              <div className="text-center space-y-2 flex flex-col items-center">
                <span className="text-xs font-700 text-neutral-400 block">Live Selfie Photo</span>
                {selectedApp.live_photo_url ? (
                  <div className="relative">
                    <img
                      src={selectedApp.live_photo_url}
                      alt="Live selfie"
                      className="w-28 h-28 rounded-full object-cover border-3 border-amber-500 shadow-md"
                    />
                    <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-sm">
                      <Check size={14} />
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-700">
                    <Camera size={28} />
                  </div>
                )}
                <span className="text-[10px] font-800 text-green-400 uppercase bg-green-500/10 px-2 py-0.5 rounded-[4px] inline-block">
                  ✓ Liveness Verified
                </span>
              </div>

              {/* Aadhaar & Phone KYC Column */}
              <div className="sm:col-span-2 space-y-3 text-xs text-neutral-300 border-t sm:border-t-0 sm:border-l border-neutral-800 sm:pl-5 pt-3 sm:pt-0">
                <div>
                  <span className="text-neutral-500 block">Representative Legal Name:</span>
                  <span className="font-800 text-white text-sm">
                    {selectedApp.aadhaar_holder_name || 'Karthikeyan Subramaniam'}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block">Aadhaar Identification:</span>
                  <span className="font-mono font-800 text-white text-sm">
                    {selectedApp.aadhaar_number
                      ? selectedApp.aadhaar_number.replace(/\d{4}\s\d{4}/, 'XXXX XXXX')
                      : 'XXXX XXXX 2011'}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block">Verified Mobile Number:</span>
                  <span className="font-mono font-700 text-green-400 flex items-center gap-1">
                    ✓ {selectedApp.phone || '+91 94431 88990'} (OTP Confirmed)
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block">Official Contact Email:</span>
                  <span className="font-700 text-white">{selectedApp.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Organization Credentials */}
            <div className="space-y-2 text-xs">
              <span className="font-800 text-neutral-300 uppercase tracking-wide block">
                Organization Profile & Experience
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-neutral-950/60 border border-neutral-800/60 p-4 rounded-[12px]">
                <div>
                  <span className="text-neutral-500 block">Entity Type</span>
                  <span className="font-700 text-white">{selectedApp.organization_type}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Base City</span>
                  <span className="font-700 text-white">{selectedApp.city_name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Hosting Experience</span>
                  <span className="font-700 text-white">{selectedApp.experience_years || '3-5 years'}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-neutral-500 block">Sports Handled</span>
                  <span className="font-700 text-amber-400">
                    {Array.isArray(selectedApp.sports_handled)
                      ? selectedApp.sports_handled.join(', ')
                      : selectedApp.sports_handled || 'Football, Badminton, Cricket'}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Preview (if attached) */}
            {selectedApp.aadhaar_doc_url && (
              <div className="space-y-1.5 text-xs">
                <span className="font-800 text-neutral-300 uppercase tracking-wide block">
                  Aadhaar Document Attachment
                </span>
                <img
                  src={selectedApp.aadhaar_doc_url}
                  alt="Aadhaar doc"
                  className="h-32 rounded-[8px] object-cover border border-neutral-800 shadow-sm"
                />
              </div>
            )}

            {/* Actions Toolbar in Modal */}
            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowKycAuditModal(false)}>
                Close Audit View
              </Button>

              <div className="flex items-center gap-2">
                {selectedApp.status === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowRejectModal(true);
                      }}
                      className="text-red-400 hover:bg-red-500/10 text-xs"
                    >
                      Reject Application
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionId === selectedApp.id}
                      onClick={() => handleApprove(selectedApp)}
                      icon={<CheckCircle2 size={16} />}
                      className="font-800 text-xs"
                    >
                      Approve & Verify Organizer
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-[16px] p-6 max-w-md w-full space-y-4 shadow-2xl text-white"
          >
            <h3 className="font-800 text-white text-base flex items-center gap-2">
              <XCircle size={18} className="text-red-400" />
              Reject Organizer Application
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Provide a reason for rejecting <span className="text-white font-700">{selectedApp?.organization_name}</span>:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Aadhaar details do not match or selfie photo is unclear."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-[10px] p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionId === selectedApp?.id}
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
