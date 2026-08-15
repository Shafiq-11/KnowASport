import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Building2, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { adminService } from '../../services/adminService.js';

export default function AdminOrganizersPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadApps() {
      setLoading(true);
      try {
        const list = await adminService.getPendingApplications();
        if (active) setApplications(list || []);
      } catch (err) {
        console.error('Error fetching admin organizer applications:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadApps();

    return () => {
      active = false;
    };
  }, []);

  const handleApprove = async (app) => {
    setActionId(app.id);
    try {
      await adminService.approveOrganizerApplication(app.id, user);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' } : a)));
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
      setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'rejected', rejection_reason: rejectionReason } : a)));
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="kas-container py-8 lg:py-12 max-w-5xl space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={24} className="text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Admin Organizer Verification Panel
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Review and approve organization credentials before organizers can list public sports events.
        </p>
      </div>

      {loading ? (
        <SectionSkeleton count={3} />
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="font-800 text-neutral-900 text-lg">{app.organization_name}</h3>
                  <p className="text-xs text-neutral-500">
                    {app.organization_type} • Base: <span className="font-700 text-neutral-800">{app.city_name}</span>
                  </p>
                </div>

                <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'} size="md">
                  {app.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-700">
                <div>
                  <span className="font-600 text-neutral-400 block">Contact Phone</span>
                  <span className="font-700 font-mono text-neutral-900">{app.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-600 text-neutral-400 block">Official Email</span>
                  <span className="font-700 text-neutral-900">{app.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-600 text-neutral-400 block">Sports Handled</span>
                  <span className="font-700 text-neutral-900">{Array.isArray(app.sports_handled) ? app.sports_handled.join(', ') : app.sports_handled || 'All Sports'}</span>
                </div>
                <div>
                  <span className="font-600 text-neutral-400 block">Experience</span>
                  <span className="font-700 text-neutral-900">{app.experience_years || '1-3 years'}</span>
                </div>
              </div>

              {app.status === 'pending' && (
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedApp(app);
                      setShowRejectModal(true);
                    }}
                    className="text-red-600 hover:bg-red-50 text-xs"
                  >
                    Reject Application
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionId === app.id}
                    disabled={actionId === app.id}
                    onClick={() => handleApprove(app)}
                    icon={<CheckCircle2 size={16} />}
                  >
                    Approve Organizer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No pending organizer applications"
          description="All submitted organizer applications have been reviewed."
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-800 text-neutral-900 text-base">Reject Application</h3>
            <p className="text-xs text-neutral-600">Provide a reason for rejecting {selectedApp?.organization_name}:</p>

            <textarea
              rows={3}
              placeholder="e.g. Organization details incomplete or unverified contact info."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-neutral-200 rounded-[8px] p-2.5 text-xs text-neutral-900 focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
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
          </div>
        </div>
      )}
    </div>
  );
}
