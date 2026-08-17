import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Camera, CheckCircle2, AlertTriangle, XCircle, ArrowLeft,
  RefreshCw, Search, Users, User, ShieldCheck, Clock, Check,
  ChevronRight, Keyboard, ArrowRight, ShieldAlert
} from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import QRCameraScanner from '../../components/organizer/QRCameraScanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useEventDetail } from '../../hooks/useEvents.js';
import { checkinService } from '../../services/checkinService.js';
import { formatDateShort, formatPrice } from '../../utils/formatters.js';

export default function OrganizerCheckinPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event, loading: eventLoading } = useEventDetail(eventId);

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, remaining: 0, pendingPayment: 0, cancelled: 0 });
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scanner & Verification States
  const [manualCode, setManualCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);

  // Canonical Event ID
  const canonicalEventId = event?.id || eventId;

  // Load event check-in stats & recent checkins
  const loadCheckinData = async () => {
    if (!user || !canonicalEventId) return;
    setLoading(true);

    try {
      const [s, recent] = await Promise.all([
        checkinService.getEventCheckinStats(canonicalEventId, user.id),
        checkinService.getRecentCheckins(canonicalEventId, user.id),
      ]);
      setStats(s);
      setRecentCheckins(recent || []);
    } catch (err) {
      console.error('Error loading checkin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckinData();
  }, [canonicalEventId, user]);

  // Handle Code / QR Verification
  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || manualCode;
    if (!code || !String(code).trim()) return;

    setIsVerifying(true);
    setIsScannerPaused(true);
    setVerificationResult(null);

    try {
      const res = await checkinService.verifyRegistrationCode({
        eventId: canonicalEventId,
        codeOrToken: code,
        userId: user?.id,
      });

      setVerificationResult(res);
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationResult({
        status: 'INVALID',
        message: 'Unable to verify registration. Check your internet connection and try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Confirm Check-In Action
  const handleConfirmCheckin = async () => {
    if (!verificationResult?.registration) return;
    setIsConfirming(true);

    try {
      const confirmed = await checkinService.confirmCheckin({
        eventId: canonicalEventId,
        registrationId: verificationResult.registration.id,
        userId: user?.id,
      });

      // Update local stats and recent feed
      setStats((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn + 1,
        remaining: Math.max(0, prev.remaining - 1),
      }));

      const newRecentItem = {
        id: confirmed.id || `chk_${Date.now()}`,
        checked_in_at: new Date().toISOString(),
        registration: verificationResult.registration,
      };

      setRecentCheckins((prev) => [newRecentItem, ...prev.slice(0, 9)]);

      // Display brief success overlay & reset for next scan
      setVerificationResult({
        status: 'CHECKED_IN_SUCCESS',
        registration: verificationResult.registration,
        message: 'Check-in confirmed successfully!',
      });
    } catch (err) {
      console.error('Checkin confirmation error:', err);
      setVerificationResult({
        status: 'INVALID',
        message: err.message || 'Check-in failed. Please try again.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Reset / Scan Next Participant
  const handleScanNext = () => {
    setVerificationResult(null);
    setManualCode('');
    setIsScannerPaused(false);
  };

  const isCheckInRequired = event?.check_in_required !== false;

  return (
    <div className="kas-container py-6 lg:py-10 max-w-2xl space-y-6">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          to="/organizer/check-in"
          className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={16} /> All Organizer Events
        </Link>
        <span className="text-xs font-800 text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-[6px]">
          Organizer Live Entrance
        </span>
      </div>

      {/* ── Event Summary Header ── */}
      <div className="bg-navy-950 text-white rounded-[16px] p-6 space-y-4 shadow-md border border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-800 text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-[4px]">
              {event?.sport_name || 'Tournament'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {formatDateShort(event?.start_date)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-800 text-white tracking-tight">
            {event?.title || 'Tournament Check-In'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">{event?.venue_name}, {event?.city_name}</p>
        </div>

        {/* Counter Pills */}
        {isCheckInRequired ? (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-navy-800/80 text-center">
            <div className="bg-navy-900/80 p-2.5 rounded-[10px] border border-navy-800">
              <span className="text-[11px] text-neutral-400 block font-600">Total Registered</span>
              <span className="text-lg font-800 text-white">{stats.total}</span>
            </div>

            <div className="bg-green-950/60 p-2.5 rounded-[10px] border border-green-800/60 text-green-400">
              <span className="text-[11px] text-green-400 block font-600">Checked In</span>
              <span className="text-lg font-800 text-white">{stats.checkedIn}</span>
            </div>

            <div className="bg-navy-900/80 p-2.5 rounded-[10px] border border-navy-800">
              <span className="text-[11px] text-neutral-400 block font-600">Remaining</span>
              <span className="text-lg font-800 text-amber-400">{stats.remaining}</span>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-navy-800/80 text-center text-xs font-700 text-amber-400 flex items-center justify-center gap-1.5">
            <ShieldAlert size={16} /> Check-In is not required for this event.
          </div>
        )}
      </div>

      {/* If Check-In Is Disabled For Event */}
      {!isCheckInRequired ? (
        <div className="bg-white rounded-[16px] border border-neutral-200 p-8 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-base font-800 text-neutral-900">Check-In Not Required</h3>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
            This tournament does not have mandatory QR entrance check-in enabled. Athletes can enter directly with confirmed ticket registration.
          </p>
          <Button size="sm" onClick={() => navigate('/organizer/check-in')}>
            Return to Check-In Selection
          </Button>
        </div>
      ) : (
        /* ── Main Check-In Console ── */
        <div className="space-y-6">
          {/* Method Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-[12px] border border-neutral-200">
            <button
              onClick={() => {
                setActiveTab('camera');
                setVerificationResult(null);
              }}
              className={`
                flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-xs font-800 transition-all
                ${activeTab === 'camera'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
                }
              `}
            >
              <Camera size={16} className={activeTab === 'camera' ? 'text-amber-500' : ''} />
              <span>Scan Ticket QR</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('manual');
                setVerificationResult(null);
              }}
              className={`
                flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-xs font-800 transition-all
                ${activeTab === 'manual'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
                }
              `}
            >
              <Keyboard size={16} className={activeTab === 'manual' ? 'text-amber-500' : ''} />
              <span>Enter Pass Code</span>
            </button>
          </div>

          {/* ── TAB 1: CAMERA QR SCANNER ── */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <QRCameraScanner
                onScan={handleVerify}
                isPaused={isScannerPaused || Boolean(verificationResult)}
                disabled={isVerifying}
              />
            </div>
          )}

          {/* ── TAB 2: MANUAL PASS CODE INPUT ── */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
                  <Keyboard size={18} className="text-amber-500" />
                  Manual Pass Code Verification
                </h3>
                <p className="text-xs text-neutral-500">
                  Enter the 8-character Pass Code (e.g. <strong className="font-mono text-neutral-800">KAS7X92P</strong>) or Registration Number from the athlete pass.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="flex gap-2"
              >
                <div className="flex-1">
                  <Input
                    placeholder="e.g. KAS7X92P or KAS-2026-000124"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    inputClassName="font-mono font-700 uppercase tracking-wider"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isVerifying}
                  disabled={isVerifying || !manualCode.trim()}
                  className="font-800"
                >
                  Verify Pass
                </Button>
              </form>
            </div>
          )}

          {/* ── VERIFICATION RESULT CARDS ── */}
          <AnimatePresence mode="wait">
            {/* 1. VALID REGISTRATION & READY FOR CHECK-IN */}
            {verificationResult?.status === 'VALID' && (
              <motion.div
                key="valid-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-[18px] border-2 border-green-500 p-6 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-green-700 font-800 text-base">
                    <CheckCircle2 size={22} className="text-green-600 flex-shrink-0" />
                    <span>✓ VALID REGISTRATION</span>
                  </div>
                  <Badge variant="success" size="md">CONFIRMED</Badge>
                </div>

                <div className="space-y-2 text-xs text-neutral-700 bg-neutral-50 p-4 rounded-[12px] border border-neutral-200/70">
                  <div className="flex justify-between py-1 border-b border-neutral-200/60">
                    <span className="font-600 text-neutral-500">Registration Number</span>
                    <span className="font-800 font-mono text-neutral-900">
                      {verificationResult.registration.registration_number}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60">
                    <span className="font-600 text-neutral-500">Pass Code</span>
                    <span className="font-800 font-mono text-amber-700">
                      {verificationResult.registration.pass_code || 'KAS7X92P'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60">
                    <span className="font-600 text-neutral-500">Participant / Team</span>
                    <span className="font-800 text-neutral-900 text-sm">
                      {verificationResult.registration.team_name ||
                        verificationResult.registration.participants?.[0]?.full_name ||
                        'Athlete'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60">
                    <span className="font-600 text-neutral-500">Format & Capacity</span>
                    <span className="font-700 text-neutral-900 capitalize">
                      {verificationResult.registration.participation_type} (
                      {verificationResult.registration.team_size || 1} Players)
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="font-600 text-neutral-500">Payment Status</span>
                    <span className="font-700 text-green-700 capitalize flex items-center gap-1">
                      <Check size={14} /> Confirmed (
                      {verificationResult.registration.payment_status?.replace('_', ' ') || 'Paid'})
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleScanNext}
                    className="text-xs"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isConfirming}
                    disabled={isConfirming}
                    onClick={handleConfirmCheckin}
                    className="bg-green-600 hover:bg-green-700 text-white font-800 py-3.5 shadow-md text-sm"
                  >
                    CONFIRM CHECK-IN NOW
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 2. CHECK-IN SUCCESS CONFIRMATION */}
            {verificationResult?.status === 'CHECKED_IN_SUCCESS' && (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="bg-green-600 text-white rounded-[18px] p-6 text-center space-y-4 shadow-xl"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} className="text-white" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-800 tracking-tight">✓ CHECK-IN SUCCESSFUL</h3>
                  <p className="text-xs text-green-100 font-600">
                    {verificationResult.registration?.team_name ||
                      verificationResult.registration?.participants?.[0]?.full_name}{' '}
                    has been checked in at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleScanNext}
                  className="bg-white text-green-800 hover:bg-green-50 border-white font-800 text-xs px-6 py-2.5 shadow-sm"
                >
                  Scan Next Participant
                </Button>
              </motion.div>
            )}

            {/* 3. ALREADY CHECKED IN WARNING */}
            {verificationResult?.status === 'ALREADY_CHECKED_IN' && (
              <motion.div
                key="already-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-amber-50 rounded-[18px] border-2 border-amber-400 p-6 space-y-4 text-amber-900 shadow-md"
              >
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2 font-800 text-base text-amber-900">
                    <AlertTriangle size={22} className="text-amber-600 flex-shrink-0" />
                    <span>ALREADY CHECKED IN</span>
                  </div>
                  <Badge variant="warning" size="sm">DUPLICATE</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-800">
                  <p className="font-700 text-amber-950">{verificationResult.message}</p>
                  <p>
                    Participant:{' '}
                    <strong className="font-800 text-neutral-900">
                      {verificationResult.registration?.team_name ||
                        verificationResult.registration?.participants?.[0]?.full_name}
                    </strong>
                  </p>
                  <p className="font-mono text-neutral-600">
                    Reg ID: {verificationResult.registration?.registration_number}
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScanNext}
                    className="border-amber-400 text-amber-900 hover:bg-amber-100 text-xs font-700"
                  >
                    Scan Next Participant
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 4. WRONG EVENT WARNING */}
            {verificationResult?.status === 'WRONG_EVENT' && (
              <motion.div
                key="wrong-event-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-red-50 rounded-[18px] border-2 border-red-400 p-6 space-y-3 text-red-900 shadow-md"
              >
                <div className="flex items-center gap-2 font-800 text-base text-red-800">
                  <XCircle size={22} className="text-red-600 flex-shrink-0" />
                  <span>WRONG TOURNAMENT EVENT</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  {verificationResult.message}
                </p>
                <div className="pt-2 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleScanNext} className="text-red-800 text-xs font-700">
                    Scan Next
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 5. PAYMENT REQUIRED WARNING */}
            {verificationResult?.status === 'PAYMENT_REQUIRED' && (
              <motion.div
                key="payment-required-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-amber-50 rounded-[18px] border-2 border-amber-400 p-6 space-y-3 text-amber-900 shadow-md"
              >
                <div className="flex items-center gap-2 font-800 text-base text-amber-900">
                  <AlertTriangle size={22} className="text-amber-600 flex-shrink-0" />
                  <span>PAYMENT PENDING</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {verificationResult.message}
                </p>
                <div className="pt-2 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleScanNext} className="text-amber-900 text-xs font-700">
                    Scan Next
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 6. CANCELLED REGISTRATION WARNING */}
            {verificationResult?.status === 'CANCELLED' && (
              <motion.div
                key="cancelled-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-red-50 rounded-[18px] border-2 border-red-400 p-6 space-y-3 text-red-900 shadow-md"
              >
                <div className="flex items-center gap-2 font-800 text-base text-red-800">
                  <XCircle size={22} className="text-red-600 flex-shrink-0" />
                  <span>REGISTRATION CANCELLED</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  {verificationResult.message}
                </p>
                <div className="pt-2 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleScanNext} className="text-red-800 text-xs font-700">
                    Scan Next
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 7. INVALID CODE / NOT FOUND */}
            {verificationResult?.status === 'INVALID' && (
              <motion.div
                key="invalid-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-red-50 rounded-[18px] border border-red-300 p-5 space-y-3 text-red-900 shadow-sm"
              >
                <div className="flex items-center gap-2 font-800 text-sm text-red-800">
                  <XCircle size={18} className="text-red-600 flex-shrink-0" />
                  <span>INVALID REGISTRATION</span>
                </div>
                <p className="text-xs text-red-700">
                  {verificationResult.message}
                </p>
                <div className="pt-1 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleScanNext} className="text-red-800 text-xs font-700">
                    Try Another Code
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RECENT CHECK-INS FEED ── */}
          <div className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-800 text-neutral-900 text-sm flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                Recent Check-Ins ({recentCheckins.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCheckinData}
                icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                Refresh
              </Button>
            </div>

            {recentCheckins.length > 0 ? (
              <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto">
                {recentCheckins.map((chk) => (
                  <div key={chk.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-800 text-neutral-900 block">
                        {chk.registration?.team_name || chk.registration?.participants?.[0]?.full_name || 'Participant'}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {chk.registration?.registration_number || chk.registration_id}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-green-700 font-700 text-[11px] flex items-center gap-1">
                        <Check size={12} /> Checked In
                      </span>
                      <span className="text-[10px] text-neutral-400 block font-mono">
                        {chk.checked_in_at
                          ? new Date(chk.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400">
                No participants checked in yet today.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
