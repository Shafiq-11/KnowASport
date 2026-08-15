import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return target URL if redirected from ProtectedRoute
  const returnTo = searchParams.get('from') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn({ email, password });
      navigate(decodeURIComponent(returnTo), { replace: true });
    } catch (err) {
      console.error('Sign in error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email or password is incorrect.');
      } else {
        setError(err.message || 'Could not connect. Please try again.');
      }
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
            Welcome Back to KnowASport
          </h1>
          <p className="text-xs text-neutral-500">
            Sign in to manage your sports event registrations and tickets
          </p>
        </div>

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

        {/* Form */}
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

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-600 text-amber-700 hover:text-amber-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting || authLoading}
            disabled={isSubmitting || authLoading}
            icon={<ArrowRight size={18} />}
            iconPosition="right"
          >
            Sign In
          </Button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-700 text-amber-700 hover:text-amber-800">
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
