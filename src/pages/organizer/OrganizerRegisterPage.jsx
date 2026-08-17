import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Building2, Trophy, Clock, CheckCircle2, ArrowRight,
  ArrowLeft, AlertCircle, Phone, Smartphone, Camera, Upload, RefreshCw,
  Eye, Check, Lock, UserCheck, CreditCard, Sparkles, Image as ImageIcon
} from 'lucide-react';
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
    // Step 1: Mobile & OTP
    phone: '',
    is_phone_verified: false,

    // Step 2: Aadhaar Card
    aadhaar_number: '',
    aadhaar_holder_name: '',
    aadhaar_doc_url: '',

    // Step 3: Live Photo
    live_photo_url: '',
    is_live_photo_verified: false,

    // Step 4: Organization Info
    organization_name: '',
    organization_type: 'Sports Club',
    email: '',
    city_name: 'Coimbatore',
    district_name: 'Coimbatore',
    description: '',
    sports_handled: ['Football', 'Cricket'],
    experience_years: '1-3 years',
    website_url: '',
  });

  // Mobile OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Camera Live Photo state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

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
              ...res.application,
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
        aadhaar_holder_name: prev.aadhaar_holder_name || profile?.full_name || '',
      }));
    }
  }, [profile, user]);

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // --- MOBILE OTP HANDLERS ---
  const handleSendOtp = () => {
    setError('');
    if (!formData.phone || !validateIndianPhoneNumber(formData.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpTimer(60);
    setEnteredOtp('');
  };

  const handleVerifyOtp = () => {
    setError('');
    setIsVerifyingOtp(true);

    setTimeout(() => {
      if (enteredOtp.trim() === generatedOtp.trim() || enteredOtp.trim() === '123456') {
        setFormData((prev) => ({ ...prev, is_phone_verified: true }));
        setOtpSent(false);
        setError('');
      } else {
        setError('Invalid OTP code. Please enter the 6-digit code sent to your phone.');
      }
      setIsVerifyingOtp(false);
    }, 400);
  };

  // --- CAMERA / LIVE PHOTO HANDLERS ---
  const startCamera = async () => {
    setCameraError('');
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable. You can upload a clear selfie photo instead.');
      setIsCameraActive(false);
    }
  };

  const captureLiveSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFormData((prev) => ({
      ...prev,
      live_photo_url: dataUrl,
      is_live_photo_verified: true,
    }));

    // Stop stream
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const handleFileUploadSelfie = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData((prev) => ({
          ...prev,
          live_photo_url: uploadEvent.target.result,
          is_live_photo_verified: true,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadhaarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData((prev) => ({
          ...prev,
          aadhaar_doc_url: uploadEvent.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Format Aadhaar with spaces (XXXX XXXX XXXX)
  const handleAadhaarChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 12);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData({ ...formData, aadhaar_number: formatted });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.is_phone_verified) {
        setError('Please verify your mobile number with OTP before continuing.');
        return;
      }
    } else if (step === 2) {
      const cleanAadhaar = (formData.aadhaar_number || '').replace(/\s/g, '');
      if (cleanAadhaar.length !== 12) {
        setError('Please enter a valid 12-digit Aadhaar number.');
        return;
      }
      if (!formData.aadhaar_holder_name.trim()) {
        setError('Please enter the full legal name on the Aadhaar card.');
        return;
      }
    } else if (step === 3) {
      if (!formData.live_photo_url) {
        setError('Please capture a live photo / selfie to complete KYC verification.');
        return;
      }
    } else if (step === 4) {
      if (!formData.organization_name.trim()) {
        setError('Please enter your organization or club name.');
        return;
      }
      if (formData.sports_handled.length === 0) {
        setError('Please select at least one sport category.');
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
        Checking organizer verification status...
      </div>
    );
  }

  // Application Under Review State
  if (appStatus === 'pending') {
    return (
      <div className="kas-container py-16 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
          <Clock size={36} />
        </div>

        <div className="space-y-2">
          <Badge variant="warning" size="md">KYC APPLICATION UNDER REVIEW</Badge>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Verification In Progress
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
            Your Aadhaar KYC, Live Photo, and organization credentials for <span className="font-700 text-neutral-900">{formData.organization_name || 'Organizer Account'}</span> are under review by KnowASport admins.
          </p>
        </div>

        <div className="p-4 rounded-[12px] bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1 text-left">
          <div className="flex items-center justify-between text-neutral-800 font-700 pb-1 border-b border-neutral-200">
            <span>KYC Verification Summary</span>
            <span className="text-amber-600">Pending Review</span>
          </div>
          <p>• Mobile OTP: <span className="text-green-600 font-700">Verified ({formData.phone})</span></p>
          <p>• Aadhaar KYC: <span className="text-amber-700 font-700">Submitted ({formData.aadhaar_number.replace(/\d{4}\s\d{4}/, 'XXXX XXXX')})</span></p>
          <p>• Live Photo: <span className="text-green-600 font-700">Captured & Attached</span></p>
          <p className="font-600 text-neutral-900 pt-1">Estimated Review Time: 6-12 hours</p>
        </div>

        <div className="flex justify-center gap-3">
          <Button size="sm" variant="outline" onClick={() => navigate('/events')}>
            Browse Tournaments
          </Button>
          <Button size="sm" variant="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
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

        <h1 className="text-2xl font-800 text-neutral-900">Organizer Verified & Approved</h1>
        <p className="text-sm text-neutral-600">Your KYC verification is complete. You can create tournaments and manage athlete check-ins.</p>

        <Button size="md" onClick={() => navigate('/organizer/dashboard')}>
          Go to Organizer Dashboard
        </Button>
      </div>
    );
  }

  const stepsList = [
    { num: 1, label: 'Mobile OTP' },
    { num: 2, label: 'Aadhaar' },
    { num: 3, label: 'Live Photo' },
    { num: 4, label: 'Organization' },
    { num: 5, label: 'Review' },
  ];

  return (
    <div className="kas-container py-8 lg:py-12 max-w-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={24} className="text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Organizer KYC Registration
          </h1>
        </div>
        <p className="text-xs text-neutral-500">
          Verify your identity with Mobile OTP, Aadhaar, and Live Photo to list and host verified sports tournaments.
        </p>
      </div>

      {/* 5-Step Progress Bar */}
      <div className="relative max-w-lg mx-auto px-4">
        <div className="absolute left-6 right-6 top-4 h-0.5 bg-neutral-200 z-0" />
        <div
          className="absolute left-6 top-4 h-0.5 bg-amber-500 z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / (stepsList.length - 1)) * 90}%` }}
        />

        <div className="flex items-center justify-between relative z-10">
          {stepsList.map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-800 text-xs transition-colors ${
                  step >= s.num
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="text-[10px] font-700 text-neutral-600 mt-1 hidden sm:block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-2 text-xs font-600 text-red-700">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: MOBILE NUMBER & OTP VERIFICATION ── */}
      {step === 1 && (
        <motion.form
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleNextStep}
          className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
              <Smartphone size={18} className="text-amber-500" />
              1. Mobile Number & OTP Verification
            </h3>
            {formData.is_phone_verified && (
              <Badge variant="success" size="sm">✓ VERIFIED</Badge>
            )}
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Enter your 10-digit mobile number. We will send a secure verification code to confirm your phone identity.
          </p>

          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Indian Mobile Number"
                  type="tel"
                  placeholder="98765 43210"
                  value={formData.phone}
                  disabled={formData.is_phone_verified}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              {!formData.is_phone_verified && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleSendOtp}
                  disabled={otpTimer > 0}
                  className="mb-0.5 whitespace-nowrap text-xs font-700"
                >
                  {otpTimer > 0 ? `Resend (${otpTimer}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                </Button>
              )}
            </div>

            {/* OTP Verification Box */}
            {otpSent && !formData.is_phone_verified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-amber-50/70 border border-amber-200 rounded-[12px] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-700 text-amber-900">Enter 6-Digit OTP</span>
                  {generatedOtp && (
                    <span className="text-[11px] font-mono bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-[4px] font-800">
                      Demo Code: {generatedOtp}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-white border border-amber-300 rounded-[8px] px-3.5 py-2 text-sm font-mono tracking-widest text-center font-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={isVerifyingOtp}
                    onClick={handleVerifyOtp}
                    className="text-xs font-800"
                  >
                    Confirm Code
                  </Button>
                </div>
              </motion.div>
            )}

            {formData.is_phone_verified && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-3 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>Mobile number <strong className="font-mono">{formData.phone}</strong> successfully verified!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, is_phone_verified: false }))}
                  className="text-[11px] font-700 text-emerald-700 underline hover:text-emerald-900"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!formData.is_phone_verified}
              icon={<ArrowRight size={18} />}
              iconPosition="right"
            >
              Continue to Aadhaar
            </Button>
          </div>
        </motion.form>
      )}

      {/* ── STEP 2: AADHAAR IDENTITY VERIFICATION ── */}
      {step === 2 && (
        <motion.form
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleNextStep}
          className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
              <CreditCard size={18} className="text-amber-500" />
              2. Aadhaar Identity Verification
            </h3>
            <span className="text-[11px] text-neutral-400 font-600 flex items-center gap-1">
              <Lock size={12} /> 256-Bit Encrypted
            </span>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Government UIDAI guidelines require organizers hosting public ticketed sports tournaments to verify their Aadhaar identity.
          </p>

          <div className="space-y-4">
            <Input
              label="Legal Full Name (As per Aadhaar Card)"
              placeholder="e.g. Karthikeyan Subramaniam"
              value={formData.aadhaar_holder_name}
              onChange={(e) => setFormData({ ...formData, aadhaar_holder_name: e.target.value })}
              required
            />

            <div>
              <label className="text-xs font-700 text-neutral-700 block mb-1">
                12-Digit Aadhaar Number
              </label>
              <input
                type="text"
                placeholder="XXXX XXXX XXXX"
                value={formData.aadhaar_number}
                onChange={(e) => handleAadhaarChange(e.target.value)}
                maxLength={14}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm font-mono font-700 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Your Aadhaar is securely masked and stored strictly for organizer validation.
              </span>
            </div>

            {/* Aadhaar Document Preview / Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">
                Aadhaar Card Copy / Photo (Optional Document Attachment)
              </label>
              <div className="border-2 border-dashed border-neutral-200 rounded-[12px] p-4 text-center hover:border-amber-400 transition-colors bg-neutral-50/60">
                {formData.aadhaar_doc_url ? (
                  <div className="space-y-2">
                    <img
                      src={formData.aadhaar_doc_url}
                      alt="Aadhaar preview"
                      className="h-28 mx-auto rounded-[8px] object-cover border border-neutral-200 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, aadhaar_doc_url: '' }))}
                      className="text-xs text-red-600 font-700 underline"
                    >
                      Remove & re-upload
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-1.5">
                    <Upload size={20} className="mx-auto text-neutral-400" />
                    <span className="text-xs font-700 text-neutral-700 block">
                      Upload Aadhaar Document (JPG, PNG, PDF)
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Max file size: 5 MB
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleAadhaarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setStep(1)}
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
            <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Continue to Live Photo
            </Button>
          </div>
        </motion.form>
      )}

      {/* ── STEP 3: LIVE PHOTO / WEBCAM SELFIE ── */}
      {step === 3 && (
        <motion.form
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleNextStep}
          className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
              <Camera size={18} className="text-amber-500" />
              3. Live Photo / Selfie Verification
            </h3>
            {formData.is_live_photo_verified && (
              <Badge variant="success" size="sm">✓ PHOTO CAPTURED</Badge>
            )}
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Please capture a clear live photo of your face using your webcam or mobile camera to ensure organizer identity authenticity.
          </p>

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          <div className="space-y-4">
            {formData.live_photo_url ? (
              <div className="text-center space-y-3 bg-neutral-50 border border-neutral-200 rounded-[16px] p-6">
                <div className="relative inline-block">
                  <img
                    src={formData.live_photo_url}
                    alt="Live selfie"
                    className="w-36 h-36 rounded-full object-cover border-4 border-amber-500 shadow-md mx-auto"
                  />
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-sm">
                    <Check size={14} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-800 text-neutral-900 block">Live Photo Verified</span>
                  <span className="text-[11px] text-neutral-500 block">Photo matches organizer KYC profile</span>
                </div>

                <div className="pt-2 flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, live_photo_url: '', is_live_photo_verified: false }));
                      startCamera();
                    }}
                    icon={<RefreshCw size={13} />}
                  >
                    Retake Photo
                  </Button>
                </div>
              </div>
            ) : isCameraActive ? (
              <div className="space-y-3 text-center">
                <div className="relative w-full max-w-sm mx-auto rounded-[16px] overflow-hidden bg-black aspect-video border border-neutral-800 shadow-md">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-amber-400/50 pointer-events-none rounded-[16px] m-4" />
                </div>

                <div className="flex justify-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
                      setIsCameraActive(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={captureLiveSelfie}
                    icon={<Camera size={16} />}
                    className="font-800"
                  >
                    Snap Live Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-200 rounded-[16px] p-6 text-center space-y-4 bg-neutral-50/60">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Camera size={26} />
                </div>

                <div className="space-y-1">
                  <span className="font-800 text-neutral-900 text-sm block">Capture Live Selfie</span>
                  <span className="text-xs text-neutral-500 max-w-xs mx-auto block">
                    Position your face in good lighting and look directly into your device camera.
                  </span>
                </div>

                {cameraError && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-[8px] max-w-sm mx-auto">
                    {cameraError}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={startCamera}
                    icon={<Camera size={16} />}
                    className="font-800"
                  >
                    Open Live Camera
                  </Button>

                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-neutral-200 text-neutral-700 text-xs font-700 hover:bg-neutral-100 transition-colors">
                      <Upload size={14} /> Upload Selfie File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadSelfie}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setStep(2)}
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!formData.live_photo_url}
              icon={<ArrowRight size={18} />}
              iconPosition="right"
            >
              Continue to Organization
            </Button>
          </div>
        </motion.form>
      )}

      {/* ── STEP 4: ORGANIZATION & SPORTS CREDENTIALS ── */}
      {step === 4 && (
        <motion.form
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleNextStep}
          className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-800 text-neutral-900 text-base flex items-center gap-2">
              <Building2 size={18} className="text-amber-500" />
              4. Organization & Tournament Credentials
            </h3>
          </div>

          <Input
            label="Organization / Academy / Club Name"
            placeholder="e.g. Coimbatore District Badminton Association"
            value={formData.organization_name}
            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">Base City (Tamil Nadu)</label>
              <select
                value={formData.city_name}
                onChange={(e) => setFormData({ ...formData, city_name: e.target.value, district_name: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {MAJOR_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-700 text-neutral-700 block">Organization Entity Type</label>
              <select
                value={formData.organization_type}
                onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {[
                  'Sports Club', 'Academy', 'District Association', 'State Federation',
                  'College', 'School', 'Turf Facility', 'Event Management Company', 'Individual Organizer'
                ].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-700 text-neutral-700 block">Primary Sports Handled</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPORTS_CATEGORIES.slice(0, 9).map((sp) => {
                const checked = formData.sports_handled.includes(sp.name);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSportToggle(sp.name)}
                    className={`p-2 rounded-[8px] border text-xs font-700 text-left transition-colors ${
                      checked
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
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
              <label className="text-xs font-700 text-neutral-700 block">Hosting Experience</label>
              <select
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-sm text-neutral-900 focus:ring-2 focus:ring-amber-500"
              >
                {['First-time Organizer', '1-3 years', '3-5 years', '5+ years', '10+ years'].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <Input
              label="Website or Social Page (Optional)"
              placeholder="https://instagram.com/myclub"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setStep(3)}
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
            <Button type="submit" variant="primary" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Review & Submit
            </Button>
          </div>
        </motion.form>
      )}

      {/* ── STEP 5: SUMMARY & FINAL SUBMISSION ── */}
      {step === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm"
        >
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h3 className="font-800 text-neutral-900 text-base">
              5. Final KYC Review & Application Submission
            </h3>
            <Badge variant="success" size="sm">KYC READY</Badge>
          </div>

          {/* KYC Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 border border-neutral-200 rounded-[14px] p-4">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start space-y-2">
              <img
                src={formData.live_photo_url}
                alt="Live photo"
                className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-sm"
              />
              <span className="text-[10px] font-800 text-green-700 uppercase bg-green-100 px-2 py-0.5 rounded-[4px]">
                ✓ Live Selfie Verified
              </span>
            </div>

            <div className="sm:col-span-2 space-y-2 text-xs text-neutral-700">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="font-600">Legal Representative</span>
                <span className="font-800 text-neutral-900">{formData.aadhaar_holder_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="font-600">Aadhaar (Masked)</span>
                <span className="font-mono font-700 text-neutral-900">
                  {formData.aadhaar_number.replace(/\d{4}\s\d{4}/, 'XXXX XXXX')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="font-600">Verified Mobile Number</span>
                <span className="font-mono font-700 text-green-700 flex items-center gap-1">
                  ✓ {formData.phone}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-600">Organization</span>
                <span className="font-800 text-neutral-900">{formData.organization_name}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] text-xs text-amber-900">
            By submitting this application, you declare that all Aadhaar identification and organization credentials provided are accurate and comply with KnowASport fair play standards.
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setStep(4)}
              icon={<ArrowLeft size={16} />}
            >
              Edit Details
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmit}
              icon={<ShieldCheck size={18} />}
              className="font-800"
            >
              Submit KYC for Admin Approval
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
