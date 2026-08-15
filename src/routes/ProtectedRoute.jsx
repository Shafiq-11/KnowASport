import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Skeleton } from '../components/common/Skeleton.jsx';

/**
 * ProtectedRoute Component
 * 
 * Guards routes that require user authentication.
 * Redirects unauthenticated visitors to /login with return target parameter.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="kas-container py-16 flex flex-col items-center justify-center space-y-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-48 h-4 rounded-[6px]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTarget = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${returnTarget}`} replace />;
  }

  return children;
}
