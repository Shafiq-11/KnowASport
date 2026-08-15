import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard, ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowLeft, Trophy, Calendar, MapPin, Sparkles
} from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registrationService } from '../../services/registrationService.js';
import { paymentService } from '../../services/paymentService.js';
import { formatPrice, formatDateShort } from '../../utils/formatters.js';

export default function PaymentPage() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadReg() {
      if (!user || !registrationId) return;
      setLoading(true);

      try {
        const reg = await registrationService.getRegistrationById(registrationId, user.id);
        if (active) {
          if (reg?.status === 'confirmed' && reg?.payment_status === 'paid') {
            // Already paid, redirect to success
            navigate(`/registration/${registrationId}/success`, { replace: true });
            return;
          }
          setRegistration(reg);
        }
      } catch (err) {
        console.error('Error loading registration for payment:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReg();

    return () => {
      active = false;
    };
  }, [registrationId, user, navigate]);

  // Load Razorpay Script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Standard Razorpay Checkout
  const handleRazorpayPayment = async () => {
    setError('');
    setIsProcessing(true);

    try {
      // 1. Create Payment Order (Server-derived price)
      const orderData = await paymentService.createPaymentOrder({
        registrationId,
        user,
      });

      const resLoaded = await loadRazorpayScript();
      if (!resLoaded || !window.Razorpay) {
        console.warn('Razorpay SDK unavailable, executing test sandbox flow...');
        await handleSandboxTestPayment();
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency,
        name: 'KnowASport',
        description: orderData.event?.title || 'Tournament Entry Fee',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            await paymentService.verifyPayment({
              registrationId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              user,
            });
            navigate(`/registration/${registrationId}/success`, { replace: true });
          } catch (err) {
            navigate(`/payment/${registrationId}/failed`, { replace: true });
          }
        },
        prefill: {
          name: profile?.full_name || user?.user_metadata?.full_name || '',
          email: user?.email || '',
          contact: profile?.phone || '',
        },
        theme: {
          color: '#F59E0B',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        navigate(`/payment/${registrationId}/failed`, { replace: true });
      });
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Could not initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sandbox Test Payment Simulator
  const handleSandboxTestPayment = async () => {
    setError('');
    setIsProcessing(true);

    try {
      await paymentService.simulateTestPaymentSuccess({
        registrationId,
        user,
      });

      navigate(`/registration/${registrationId}/success`, { replace: true });
    } catch (err) {
      console.error('Test payment error:', err);
      setError('Test payment simulation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="kas-container py-16 text-center text-neutral-500">
        Loading payment checkout...
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="kas-container py-16 text-center space-y-4">
        <h2 className="text-xl font-800 text-neutral-900">Registration Not Found</h2>
        <Button size="sm" onClick={() => navigate('/my-registrations')}>Go to My Registrations</Button>
      </div>
    );
  }

  const feeAmount = registration.total_fee || registration.event?.entry_fee || 0;

  return (
    <div className="kas-container py-8 lg:py-12 max-w-2xl space-y-8">
      {/* Back Link */}
      <Link
        to="/my-registrations"
        className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft size={16} /> Back to My Registrations
      </Link>

      {/* Payment Checkout Box */}
      <div className="bg-white rounded-[20px] border border-neutral-200 overflow-hidden shadow-xl space-y-0">
        {/* Header */}
        <div className="bg-navy-950 text-white p-6 sm:p-8 space-y-3 border-b border-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-800 text-amber-400 uppercase tracking-widest block">KnowASport Secure Checkout</span>
            <Badge variant="warning" size="sm">PENDING PAYMENT</Badge>
          </div>
          <h1 className="text-2xl font-800 text-white tracking-tight">Complete Tournament Payment</h1>
          <p className="text-xs text-neutral-300">Registration Pass: <span className="font-mono font-700 text-amber-400">{registration.registration_number}</span></p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-600 text-red-700">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tournament Overview */}
          <div className="p-5 rounded-[14px] bg-neutral-50 border border-neutral-200 space-y-3">
            <h3 className="font-800 text-neutral-900 text-base">{registration.event?.title}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-500" />
                <span>{formatDateShort(registration.event?.start_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-amber-500" />
                <span>{registration.event?.venue_name}, {registration.event?.city_name}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-sm text-neutral-700 pt-2 border-t border-neutral-100">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span>Registration Format</span>
              <span className="font-700 text-neutral-900 capitalize">{registration.participation_type} ({registration.team_name || 'Individual'})</span>
            </div>

            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span>Event Entry Fee</span>
              <span className="font-700 text-neutral-900">{formatPrice(feeAmount)}</span>
            </div>

            <div className="flex justify-between py-2 pt-3 text-base font-800 text-neutral-900">
              <span>Total Payable</span>
              <span className="text-amber-600 text-xl font-800">{formatPrice(feeAmount)}</span>
            </div>
          </div>

          {/* Payment Actions */}
          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isProcessing}
              disabled={isProcessing}
              onClick={handleRazorpayPayment}
              icon={<CreditCard size={20} />}
              className="py-4 font-800 text-base shadow-md"
            >
              PAY {formatPrice(feeAmount)} VIA RAZORPAY
            </Button>

            {/* Test Sandbox Button */}
            <button
              type="button"
              onClick={handleSandboxTestPayment}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-[10px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-700 text-amber-900 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={14} className="text-amber-600" />
              <span>🧪 Test Mode Payment (Sandbox Complete)</span>
            </button>
          </div>

          {/* Security Badges Footer */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-neutral-100 text-xs text-neutral-500 font-500">
            <div className="flex items-center gap-1.5">
              <Lock size={14} className="text-green-600" /> 256-bit SSL Encrypted
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-500" /> Razorpay Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
