import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      // Still set submitted to true or show generic message for security
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center kas-container py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-[16px] border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-[10px] bg-amber-500 flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-800 text-neutral-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-neutral-500">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-[12px] text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-700 text-neutral-900 text-sm">Check Your Inbox</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              If an account exists for <span className="font-700 text-neutral-900">{email}</span>, you'll receive a password reset link shortly.
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-xs font-700 text-amber-700 hover:text-amber-800">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-600 text-red-700"
              >
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="athlete@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={<ArrowRight size={18} />}
                iconPosition="right"
              >
                Send Reset Link
              </Button>
            </form>

            <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
              Remember your password?{' '}
              <Link to="/login" className="font-700 text-amber-700 hover:text-amber-800">
                Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
