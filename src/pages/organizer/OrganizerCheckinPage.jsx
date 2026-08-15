import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Camera, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, RefreshCw,
  Search, Users, User, ShieldCheck, Clock, Check, ChevronRight
} from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useEventDetail } from '../../hooks/useEvents.js';
import { checkinService } from '../../services/checkinService.js';
import { formatDateShort, formatPrice } from '../../utils/formatters.js';

export default function OrganizerCheckinPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event, loading: eventLoading } = useEventDetail(eventId);

  const [stats, setStats] = useState({ total: 0, checkedIn: 0, remaining: 0, pendingPayment: 0, cancelled: 0 });
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scanner & Verification States
  const [manualCode, setManualCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load event check-in stats & recent checkins
  useEffect(() => {
    let active = true;

    async function loadStats() {
      if (!user || !eventId) return;
      setLoading(true);

      try {
        const s = await checkinService.getEventCheckinStats(eventId, user.id);
        const recent = await checkinService.getRecentCheckins(eventId, user.id);
        if (active) {
          setStats(s);
          setRecentCheckins(recent || []);
        }
      } catch (err) {
        console.error('Error loading checkin stats:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [eventId, user]);

  // Handle Code / QR Verification
  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || manualCode;
    if (!code || !code.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await checkinService.verifyRegistrationCode({
        eventId: event?.id || eventId,
        codeOrToken: code,
        userId: user?.id,
      });

      setVerificationResult(res);
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationResult({
        status: 'INVALID',
        message: 'Could not verify registration code. Please try again.',
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
        eventId: event?.id || eventId,
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

      setTimeout(() => {
        setVerificationResult(null);
        setManualCode('');
      }, 2500);
    } catch (err) {
      console.error('Checkin confirmation error:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="kas-container py-6 lg:py-10 max-w-2xl space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          to="/organizer/check-in"
          className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={16} /> All Organizer Events
        </Link>
        <span className="text-xs font-700 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-[6px]">
          Organize Check-In
        </span>
      </div>

      {/* ── Event Summary Header ── */}
      <div className="bg-navy-950 text-white rounded-[16px] p-6 space-y-4 shadow-md">
        <div>
          <span className="text-xs font-800 text-amber-400 uppercase tracking-widest block">Live Event Check-In</span>
          <h1 className="text-xl sm:text-2xl font-800 text-white">{event?.title || 'Tournament Check-In'}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{event?.venue_name}, {event?.city_name}</p>
        </div>

        {/* Counter Pills */}
        {event?.check_in_required !== false ? (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-navy-800 text-center">
            <div className="bg-navy-900 p-2.5 rounded-[10px] border border-navy-800">
              <span className="text-xs text-neutral-400 block font-600">Total</span>
              <span className="text-lg font-800 text-white">{stats.total}</span>
            </div>

            <div className="bg-green-950/80 p-2.5 rounded-[10px] border border-green-800 text-green-400">
              <span className="text-xs text-green-400 block font-600">Checked In</span>
              <span className="text-lg font-800 text-white">{stats.checkedIn}</span>
            </div>

            <div className="bg-navy-900 p-2.5 rounded-[10px] border border-navy-800">
              <span className="text-xs text-neutral-400 block font-600">Remaining</span>
              <span className="text-lg font-800 text-amber-400">{stats.remaining}</span>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-navy-800 text-center text-xs font-700 text-amber-400">
            Check-In Not Required for this Event
          </div>
        )}
      </div>

      {/* ── Main Scan & Entry Actions ── */}
      <div className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-5 shadow-sm">
        <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
          <QrCode size={18} className="text-amber-500" />
          Verify Participant Registration
        </h3>

        {/* Primary Large Camera Scan Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => setIsCameraActive(!isCameraActive)}
          icon={<Camera size={20} />}
          className="py-4 text-base font-800 shadow-md"
        >
          {isCameraActive ? 'Close Camera Scanner' : '📷 Open Camera QR Scanner'}
        </Button>

        {/* Camera View Finder Simulation */}
        <AnimatePresence>
          {isCameraActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-navy-950 rounded-[14px] p-6 text-center text-white space-y-4 border border-navy-800 relative overflow-hidden"
            >
              <div className="w-48 h-48 border-2 border-dashed border-amber-400 rounded-[16px] mx-auto flex items-center justify-center relative bg-navy-900/60">
                <QrCode size={64} className="text-amber-400 opacity-60 animate-pulse" />
                <span className="absolute bottom-3 text-[10px] text-neutral-400">Align QR Code within frame</span>
              </div>

              <p className="text-xs text-neutral-300">
                Point camera at KnowASport digital ticket pass.
              </p>

              {/* Demo scan simulation button */}
              <button
                onClick={() => {
                  setIsCameraActive(false);
                  handleVerify('KAS-2026-10001');
                }}
                className="text-xs font-700 text-amber-400 underline hover:text-amber-300"
              >
                Simulate Instant QR Scan
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-neutral-400 font-600">
          <div className="flex-1 h-px bg-neutral-200" />
          <span>OR ENTER REGISTRATION ID</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Manual Code Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex gap-2"
        >
          <div className="flex-1">
            <Input
              placeholder="e.g. KAS-2026-000124"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              inputClassName="font-mono font-700 uppercase"
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="md"
            loading={isVerifying}
            disabled={isVerifying || !manualCode.trim()}
          >
            Verify
          </Button>
        </form>
      </div>

      {/* ── VERIFICATION RESULT OVERLAY / CARD ── */}
      <AnimatePresence>
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="space-y-4"
          >
            {/* 1. VALID & READY FOR CHECK-IN */}
            {verificationResult.status === 'VALID' && (
              <div className="bg-white rounded-[16px] border-2 border-green-500 p-6 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-green-700 font-800 text-base">
                    <CheckCircle2 size={22} className="text-green-600" />
                    <span>✓ VALID REGISTRATION</span>
                  </div>
                  <Badge variant="success" size="sm">READY</Badge>
                </div>

                <div className="space-y-2 text-xs text-neutral-700">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="font-600">Registration Number</span>
                    <span className="font-800 font-mono text-neutral-900">{verificationResult.registration.registration_number}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="font-600">Participant / Team</span>
                    <span className="font-800 text-neutral-900 text-sm">
                      {verificationResult.registration.team_name || verificationResult.registration.participants?.[0]?.full_name || 'Athlete'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="font-600">Format</span>
                    <span className="font-700 text-neutral-900 capitalize">
                      {verificationResult.registration.participation_type} ({verificationResult.registration.team_size || 1} Players)
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="font-600">Payment Status</span>
                    <span className="font-700 text-green-600 capitalize">
                      ✓ {verificationResult.registration.payment_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isConfirming}
                  disabled={isConfirming}
                  onClick={handleConfirmCheckin}
                  className="bg-green-600 hover:bg-green-700 text-white font-800 py-3.5 shadow-md"
                >
                  CONFIRM CHECK-IN NOW
                </Button>
              </div>
            )}

            {/* 2. SUCCESSFUL CHECK-IN CONFIRMATION OVERLAY */}
            {verificationResult.status === 'CHECKED_IN_SUCCESS' && (
              <div className="bg-green-500 text-white rounded-[16px] p-6 text-center space-y-3 shadow-lg">
                <CheckCircle2 size={48} className="mx-auto text-white" />
                <h3 className="text-xl font-800">✓ CHECK-IN SUCCESSFUL</h3>
                <p className="text-xs text-green-100">
                  {verificationResult.registration?.team_name || verificationResult.registration?.participants?.[0]?.full_name} is now checked in.
                </p>
              </div>
            )}

            {/* 3. ALREADY CHECKED IN WARNING */}
            {verificationResult.status === 'ALREADY_CHECKED_IN' && (
              <div className="bg-amber-50 rounded-[16px] border-2 border-amber-400 p-6 space-y-3 text-amber-900 shadow-md">
                <div className="flex items-center gap-2 font-800 text-base text-amber-800">
                  <AlertTriangle size={22} className="text-amber-600" />
                  <span>⚠ ALREADY CHECKED IN</span>
                </div>
                <p className="text-xs font-600">{verificationResult.message}</p>
                <div className="text-xs border-t border-amber-200/80 pt-2 font-700 text-neutral-900">
                  Registration: {verificationResult.registration?.registration_number}
                </div>
              </div>
            )}

            {/* 4. PAYMENT REQUIRED WARNING */}
            {verificationResult.status === 'PAYMENT_REQUIRED' && (
              <div className="bg-red-50 rounded-[16px] border-2 border-red-400 p-6 space-y-3 text-red-900 shadow-md">
                <div className="flex items-center gap-2 font-800 text-base text-red-800">
                  <XCircle size={22} className="text-red-600" />
                  <span>⚠ PAYMENT REQUIRED</span>
                </div>
                <p className="text-xs font-600">{verificationResult.message}</p>
                <div className="text-xs border-t border-red-200/80 pt-2 text-neutral-900">
                  Registration: {verificationResult.registration?.registration_number} (Entry Fee: {formatPrice(verificationResult.registration?.total_fee)})
                </div>
              </div>
            )}

            {/* 5. WRONG EVENT WARNING */}
            {verificationResult.status === 'WRONG_EVENT' && (
              <div className="bg-amber-50 rounded-[16px] border-2 border-amber-400 p-6 space-y-3 text-amber-900 shadow-md">
                <div className="flex items-center gap-2 font-800 text-base text-amber-800">
                  <AlertTriangle size={22} className="text-amber-600" />
                  <span>⚠ WRONG EVENT</span>
                </div>
                <p className="text-xs font-600">{verificationResult.message}</p>
              </div>
            )}

            {/* 6. INVALID / CANCELLED ERROR */}
            {(verificationResult.status === 'INVALID' || verificationResult.status === 'CANCELLED') && (
              <div className="bg-red-50 rounded-[16px] border-2 border-red-400 p-6 space-y-2 text-red-900 shadow-md">
                <div className="flex items-center gap-2 font-800 text-base text-red-800">
                  <XCircle size={22} className="text-red-600" />
                  <span>✕ {verificationResult.status === 'CANCELLED' ? 'REGISTRATION CANCELLED' : 'INVALID REGISTRATION'}</span>
                </div>
                <p className="text-xs font-600">{verificationResult.message}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recent Check-Ins Feed ── */}
      <div className="bg-white rounded-[16px] border border-neutral-200 p-6 space-y-4 shadow-sm">
        <h3 className="font-800 text-neutral-900 text-base">Recent Successful Check-Ins</h3>

        {recentCheckins.length > 0 ? (
          <div className="space-y-2 text-xs">
            {recentCheckins.map((chk, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-800">
                    ✓
                  </div>
                  <div>
                    <span className="font-700 text-neutral-900 block">
                      {chk.registration?.team_name || chk.registration?.participants?.[0]?.full_name || 'Athlete'}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {chk.registration?.registration_number || chk.verification_token}
                    </span>
                  </div>
                </div>

                <span className="text-neutral-500 font-500">
                  {new Date(chk.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 py-4 text-center">
            No check-ins recorded for this tournament session yet.
          </p>
        )}
      </div>
    </div>
  );
}
