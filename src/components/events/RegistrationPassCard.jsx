import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Copy, Check, Share2, Calendar, MapPin, Trophy,
  ShieldCheck, User, Users, AlertCircle, Loader2, Sparkles, CheckCircle2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import { passPdfService } from '../../services/passPdfService.js';
import { formatDateShort, formatDate, formatPrice } from '../../utils/formatters.js';

export default function RegistrationPassCard({ registration, event, user, onCancel }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const qrCanvasRef = useRef(null);

  if (!registration) return null;

  const regEvent = event || registration.event || {};
  const isConfirmed = registration.status === 'confirmed';
  const isCancelled = registration.status === 'cancelled';
  const isTeam = registration.participation_type === 'team';
  const isFree = registration.payment_status === 'not_required' || registration.total_fee === 0;
  const checkInRequired = regEvent.check_in_required !== false;

  // Pass Code & QR Token
  const passCode = registration.pass_code || ('KAS' + (registration.id?.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || '7X92P'));
  const qrToken = registration.qr_token || `KAS-QR-${passCode}-${(registration.registration_number || '').replace(/[^0-9]/g, '')}`;

  const primaryParticipant = registration.participants?.[0]?.full_name || user?.name || user?.email || 'Participant';

  // Copy Pass Code to Clipboard
  const handleCopyPassCode = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(passCode);
      } else {
        const input = document.createElement('input');
        input.value = passCode;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  // Download PDF Pass
  const handleDownloadPdf = async () => {
    setDownloadError('');
    setDownloading(true);

    try {
      let qrDataUrl = '';
      if (qrCanvasRef.current) {
        const canvas = qrCanvasRef.current.querySelector('canvas');
        if (canvas) {
          qrDataUrl = canvas.toDataURL('image/png');
        }
      }

      await passPdfService.downloadRegistrationPass({
        registration: { ...registration, pass_code: passCode, qr_token: qrToken },
        event: regEvent,
        user,
        qrDataUrl,
      });
    } catch (err) {
      console.error('PDF download error:', err);
      setDownloadError('Unable to download the pass. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Share Pass (if Web Share API supported)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `KnowASport Pass: ${regEvent.title || 'Event'}`,
          text: `Here is my Registration Pass for ${regEvent.title}. Registration ID: ${registration.registration_number}, Pass Code: ${passCode}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or ignored
      }
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-[20px] border border-neutral-200 overflow-hidden shadow-lg space-y-0"
    >
      {/* ── TOP NAVY PASS HEADER ── */}
      <div className="bg-navy-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-800 text-amber-400 uppercase tracking-widest block">
              KnowASport Digital Pass
            </span>
            <span className="text-[10px] bg-navy-800 text-amber-300 font-700 px-2 py-0.5 rounded-full border border-amber-400/20">
              Verified
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-800 font-mono tracking-wide text-white block">
            {registration.registration_number || 'KAS-2026-000000'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isConfirmed ? 'success' : isCancelled ? 'danger' : 'warning'}
            size="md"
          >
            {isConfirmed ? 'CONFIRMED' : isCancelled ? 'CANCELLED' : 'PENDING PAYMENT'}
          </Badge>
        </div>
      </div>

      {/* ── PASS BODY ── */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Tournament Info */}
        <div className="space-y-2 border-b border-neutral-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-800 text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-[6px] border border-amber-200">
              {regEvent.sport_name || 'Sports'}
            </span>
            <span className="text-xs font-700 text-neutral-500 uppercase tracking-wider bg-neutral-100 px-2.5 py-0.5 rounded-[6px]">
              {isTeam ? `Team (${registration.team_size || regEvent.team_size || 1} Players)` : 'Individual'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-800 text-neutral-900 leading-tight">
            {regEvent.title}
          </h2>

          <p className="text-xs text-neutral-500">
            Organized by{' '}
            <span className="font-700 text-neutral-800">
              {regEvent.organizer?.organization_name || 'Verified Sports Council'}
            </span>
          </p>
        </div>

        {/* Schedule & Venue Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-700">
          <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200">
            <Calendar size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-800 text-neutral-900 block">
                {formatDate(regEvent.start_date) || 'Event Date'}
              </span>
              <span className="text-neutral-500 text-[11px]">
                {regEvent.start_time ? `Starts at ${regEvent.start_time}` : 'Reporting 9:00 AM IST'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-neutral-50 border border-neutral-200">
            <MapPin size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-800 text-neutral-900 block">
                {regEvent.venue_name || 'Sports Arena'}
              </span>
              <span className="text-neutral-500 text-[11px]">
                {regEvent.city_name}{regEvent.district_name ? `, ${regEvent.district_name}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Participant / Squad Details */}
        <div className="p-4 sm:p-5 rounded-[14px] bg-neutral-50 border border-neutral-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-800 text-neutral-800 uppercase tracking-wider text-[11px]">
              {isTeam ? 'Squad / Team Entry' : 'Athlete Participant'}
            </span>
            <span className="text-[11px] font-700 text-neutral-500">
              {isTeam ? `Squad of ${registration.team_size || 1}` : 'Single Athlete'}
            </span>
          </div>

          {isTeam ? (
            <div className="space-y-1">
              <span className="font-800 text-neutral-900 text-sm block">Team: {registration.team_name || 'Squad'}</span>
              <span className="text-neutral-600 block">Captain: <strong className="text-neutral-900">{primaryParticipant}</strong></span>
            </div>
          ) : (
            <div className="space-y-0.5">
              <span className="font-800 text-neutral-900 text-sm block">{primaryParticipant}</span>
              <span className="text-neutral-500">Individual Participant Entry</span>
            </div>
          )}
        </div>

        {/* ── SECURITY VERIFICATION CORE: QR + PASS CODE ── */}
        {!isCancelled && (
          <div className="p-6 rounded-[18px] bg-neutral-50 border border-neutral-200 text-center space-y-4 flex flex-col items-center justify-center">
            {/* QR Canvas Box */}
            <div
              ref={qrCanvasRef}
              className="p-3.5 bg-white rounded-[16px] border border-neutral-200 shadow-md inline-block"
            >
              <QRCodeCanvas
                value={qrToken}
                size={160}
                fgColor="#080C18"
                bgColor="#FFFFFF"
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Pass Code with One-Click Copy */}
            <div className="space-y-2 max-w-sm w-full">
              <span className="text-[11px] font-800 text-neutral-500 uppercase tracking-wider block">
                Pass Code (Manual Fallback)
              </span>

              <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-300 rounded-[12px] p-2.5 px-4 shadow-xs">
                <span className="font-mono font-900 text-lg sm:text-xl text-amber-950 tracking-wider select-all">
                  {passCode}
                </span>

                <button
                  type="button"
                  onClick={handleCopyPassCode}
                  aria-label="Copy Pass Code"
                  className="p-1.5 rounded-[8px] bg-white hover:bg-amber-100 border border-amber-200 text-amber-800 transition-colors flex items-center gap-1 text-xs font-700 ml-1 cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-600" />
                      <span className="text-green-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Check-In Instructions */}
            <div className="space-y-1 max-w-md">
              <p className="text-xs font-800 text-neutral-900">
                {checkInRequired
                  ? 'Venue Check-In Required'
                  : 'Direct Entry Confirmed — Check-In Not Required'}
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                {checkInRequired
                  ? 'Present this QR code or Pass Code at the tournament entrance desk for instant verification.'
                  : 'Show this digital pass on your phone if requested by tournament officials.'}
              </p>
            </div>
          </div>
        )}

        {/* Download Error Alert */}
        {downloadError && (
          <div className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 flex items-center justify-between text-xs font-600 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <span>{downloadError}</span>
            </div>
            <Button size="xs" variant="outline" onClick={handleDownloadPdf}>
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* ── PASS ACTION BUTTONS ── */}
      <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canShare && (
            <Button
              variant="outline"
              size="md"
              onClick={handleShare}
              icon={<Share2 size={16} />}
              className="flex-1 sm:flex-none"
            >
              Share Pass
            </Button>
          )}

          {onCancel && !isCancelled && (
            <Button
              variant="ghost"
              size="md"
              onClick={onCancel}
              className="text-red-600 hover:bg-red-50 text-xs font-700"
            >
              Cancel Entry
            </Button>
          )}
        </div>

        <Button
          variant="primary"
          size="lg"
          disabled={downloading || isCancelled}
          onClick={handleDownloadPdf}
          icon={downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          className="w-full sm:w-auto font-800 shadow-sm"
        >
          {downloading ? 'Generating Pass...' : 'Download Pass (PDF)'}
        </Button>
      </div>
    </motion.div>
  );
}
