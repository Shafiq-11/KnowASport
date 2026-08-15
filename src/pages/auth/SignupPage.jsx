import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({ email, password, fullName });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Sign up error:', err);
      if (err.message?.includes('already registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'Could not create account. Please try again.');
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
            Create Your Account
          </h1>
          <p className="text-xs text-neutral-500">
            Join thousands of sports enthusiasts across Tamil Nadu
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
            label="Full Name"
            type="text"
            placeholder="e.g. Ramesh Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User size={16} />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="athlete@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
          />

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
            Create Account
          </Button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="font-700 text-amber-700 hover:text-amber-800">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
