import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, user, profile, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated as admin, redirect to /admin/dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const role = profile?.role || user?.user_metadata?.role;
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, profile, user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const { user: authedUser, error: authErr } = await signIn({ email, password });
      if (authErr) throw authErr;

      // Note: AdminRoute will perform the second-layer role check.
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid administrative credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-white">
      {/* Search Engine Robots Noindex Tag */}
      <meta name="robots" content="noindex, nofollow" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-[24px] p-8 space-y-6 shadow-2xl"
      >
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-[10px] bg-amber-500 flex items-center justify-center mx-auto shadow-md">
            <Trophy size={20} className="text-white" />
          </div>

          <div className="pt-1">
            <h1 className="text-lg font-800 text-white tracking-tight">
              Know<span className="text-amber-500">A</span>Sport
            </h1>
            <span className="text-[11px] font-800 text-amber-400 uppercase tracking-widest block mt-0.5">
              Admin Access Console
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Minimal Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-700 text-neutral-400 block">Admin Email</label>
            <input
              type="email"
              required
              placeholder="admin@knowasport.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-[10px] px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-700 text-neutral-400 block">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-[10px] px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={submitting}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
            className="font-800 bg-amber-500 hover:bg-amber-600 text-neutral-950 mt-2 py-3"
          >
            Sign In to Console
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-800/80 text-center">
          <span className="text-[10px] text-neutral-600 uppercase tracking-widest block">
            Internal Operations System • Authorized Access Only
          </span>
        </div>
      </motion.div>
    </div>
  );
}
