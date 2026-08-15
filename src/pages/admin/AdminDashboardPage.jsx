import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Trophy, Users, ArrowRight, CheckCircle2, AlertCircle, Clock,
  DollarSign, Ticket, Building2, BarChart3, FileText, UserCheck, CreditCard
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { adminService } from '../../services/adminService.js';
import { formatPrice } from '../../utils/formatters.js';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOrganizers: 0,
    verifiedOrganizers: 0,
    publishedEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    confirmedRegistrations: 0,
    pendingPaymentRegistrations: 0,
    cancelledRegistrations: 0,
    totalRegistrationPayments: 0,
    capturedPayments: 0,
    platformFees: 0,
    organizerAmount: 0,
    pendingApplicationsCount: 0,
    pendingEventsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      try {
        const data = await adminService.getPlatformMetrics();
        if (active) setMetrics(data);
      } catch (err) {
        console.error('Error loading admin platform metrics:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  const totalNeedsAttention = metrics.pendingApplicationsCount + metrics.pendingEventsCount;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Dashboard Top Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-800 text-amber-400 uppercase tracking-widest block">System Operations</span>
          <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
            KnowASport Control Console
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time platform overview, financial audit snapshot, and event moderation management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/reports')}
            icon={<BarChart3 size={15} />}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
          >
            Analytics & TN
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/organizers')}
            icon={<ShieldCheck size={15} />}
            className="text-xs font-800"
          >
            Review Queue ({metrics.pendingApplicationsCount})
          </Button>
        </div>
      </div>

      {/* Needs Attention Bar */}
      {totalNeedsAttention > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-[16px] p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-800 text-xs uppercase tracking-wider">
            <AlertCircle size={16} />
            <span>NEEDS ATTENTION ({totalNeedsAttention})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-200">
            {metrics.pendingApplicationsCount > 0 && (
              <div className="bg-neutral-900/90 p-3.5 rounded-[10px] border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-800 text-white block">{metrics.pendingApplicationsCount} Organizer Applications</span>
                  <span className="text-neutral-400 text-[11px]">Identity & organization credentials awaiting verification</span>
                </div>
                <Button size="xs" variant="primary" onClick={() => navigate('/admin/organizers')}>Review</Button>
              </div>
            )}

            {metrics.pendingEventsCount > 0 && (
              <div className="bg-neutral-900/90 p-3.5 rounded-[10px] border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-800 text-white block">{metrics.pendingEventsCount} Events Pending Review</span>
                  <span className="text-neutral-400 text-[11px]">Submitted tournaments awaiting publishing approval</span>
                </div>
                <Button size="xs" variant="primary" onClick={() => navigate('/admin/events')}>Review</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Platform Overview */}
      <div className="space-y-3">
        <h2 className="text-xs font-800 text-neutral-400 uppercase tracking-widest">Platform Overview</h2>
        {loading ? (
          <SectionSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Users</span>
              <span className="text-2xl font-800 text-white">{metrics.totalUsers}</span>
            </div>

            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Organizers</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-800 text-amber-400">{metrics.totalOrganizers}</span>
                <span className="text-[11px] text-green-400 font-700">{metrics.verifiedOrganizers} Verified</span>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Published Events</span>
              <span className="text-2xl font-800 text-green-400">{metrics.publishedEvents}</span>
            </div>

            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Registrations</span>
              <span className="text-2xl font-800 text-white">{metrics.totalRegistrations}</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Financial Overview with Authoritative Terminology */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-800 text-neutral-400 uppercase tracking-widest">Financial Summary</h2>
          <span className="text-[11px] font-700 text-neutral-500">Authoritative Settlement Figures</span>
        </div>

        {loading ? (
          <SectionSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Registration Payments</span>
              <span className="text-xl font-800 text-white">{formatPrice(metrics.totalRegistrationPayments)}</span>
              <span className="text-[10px] text-neutral-500 block">Gross user entry fees</span>
            </div>

            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Captured Payments</span>
              <span className="text-xl font-800 text-green-400">{formatPrice(metrics.capturedPayments)}</span>
              <span className="text-[10px] text-neutral-500 block">Gateway processed</span>
            </div>

            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Platform Fees</span>
              <span className="text-xl font-800 text-neutral-400">{formatPrice(metrics.platformFees)}</span>
              <span className="text-[10px] text-neutral-500 block">Not configured (₹0)</span>
            </div>

            <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
              <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Organizer Amount</span>
              <span className="text-xl font-800 text-amber-400">{formatPrice(metrics.organizerAmount)}</span>
              <span className="text-[10px] text-neutral-500 block">Attributable to organizers</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Action Launchers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-[8px] bg-amber-500/20 text-amber-400 flex items-center justify-center font-800">
              <UserCheck size={16} />
            </div>
            <h3 className="font-800 text-white text-base">Organizer Verification</h3>
            <p className="text-xs text-neutral-400">Inspect applicant credentials and approve organization status.</p>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/admin/organizers')} className="border-neutral-800 text-neutral-300 text-xs">
            Open Applications ({metrics.pendingApplicationsCount})
          </Button>
        </div>

        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-[8px] bg-amber-500/20 text-amber-400 flex items-center justify-center font-800">
              <Trophy size={16} />
            </div>
            <h3 className="font-800 text-white text-base">Event Approval</h3>
            <p className="text-xs text-neutral-400">Review submitted tournaments and publish to public discovery.</p>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/admin/events')} className="border-neutral-800 text-neutral-300 text-xs">
            Open Submissions ({metrics.pendingEventsCount})
          </Button>
        </div>

        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-[8px] bg-amber-500/20 text-amber-400 flex items-center justify-center font-800">
              <CreditCard size={16} />
            </div>
            <h3 className="font-800 text-white text-base">Financial Transactions</h3>
            <p className="text-xs text-neutral-400">Audit Razorpay payment orders and registration settlements.</p>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/admin/payments')} className="border-neutral-800 text-neutral-300 text-xs">
            View Payment Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
