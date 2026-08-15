import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button.jsx';

/**
 * AdminRoute Guard
 * Enforces two-layer security:
 * 1. User must be authenticated
 * 2. User role must be strictly 'admin'
 */
export default function AdminRoute({ children }) {
  const { user, profile, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
          <span className="text-xs font-700 text-neutral-400 block tracking-wide">
            Verifying Administrative Privileges...
          </span>
        </div>
      </div>
    );
  }

  // Layer 1: Unauthenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Layer 2: Authenticated but NOT an authorized Admin
  const role = profile?.role || user?.app_metadata?.role || user?.user_metadata?.role;
  const isAdmin = role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-[20px] p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-[12px] bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-800 text-white">Access Restricted</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your account does not have administrative privileges to access the KnowASport Control Console.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-neutral-800 hover:bg-neutral-700 text-xs font-700 text-white transition-colors"
            >
              <ArrowLeft size={16} /> Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
