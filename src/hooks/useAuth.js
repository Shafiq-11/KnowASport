import { useAuthContext } from '../context/AuthContext.jsx';

/**
 * useAuth Hook
 * 
 * Access authentication state, current user, profile details, and auth actions.
 * 
 * Usage:
 * const { user, profile, isAuthenticated, loading, signIn, signUp, signOut } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}
