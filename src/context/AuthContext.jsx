import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase.js';

const AuthContext = createContext(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'kas_mock_session_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'kas_mock_profile_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Initialize Auth Session on App Load
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          // Real Supabase Session Fetch
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile(currentSession.user.id, currentSession.user.email);
          }
        } else {
          // Dev Mock Fallback Session Load
          const storedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          if (mounted && storedSession && storedProfile) {
            const parsedUser = JSON.parse(storedSession);
            const parsedProfile = JSON.parse(storedProfile);
            setUser(parsedUser);
            setProfile(parsedProfile);
            setSession({ user: parsedUser });
          }
        }
      } catch (err) {
        console.error('Error initializing auth session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // 2. Listen to Supabase Auth Changes if configured
    let authSubscription = null;
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id, currentSession.user.email);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      authSubscription = subscription;
    }

    return () => {
      mounted = false;
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  // Fetch or create profile helper
  async function fetchProfile(userId, email) {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
      } else if (error && error.code === 'PGRST116') {
        // Profile not found, fallback construct basic profile
        const defaultProf = {
          id: userId,
          email: email,
          full_name: user?.user_metadata?.full_name || email.split('@')[0],
          role: 'user',
          is_active: true,
        };
        setProfile(defaultProf);
      }
    } catch (e) {
      console.warn('Could not fetch Supabase profile table, fallback local state used:', e);
    }
  }

  // ── SIGN UP ──
  const signUp = async ({ email, password, fullName }) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) throw error;

        // Construct initial profile state
        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          const newProfile = {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            role: 'user',
            city_name: 'Coimbatore',
            district_name: 'Coimbatore',
            primary_sport: 'badminton',
            skill_level: 'intermediate',
            is_active: true,
          };
          setProfile(newProfile);
        }
        return { user: data.user, session: data.session };
      } else {
        // Dev Mock Fallback Signup
        const mockUser = {
          id: `usr_${Date.now()}`,
          email,
          user_metadata: { full_name: fullName },
        };
        const mockProfile = {
          id: mockUser.id,
          email,
          full_name: fullName,
          role: 'user',
          city_name: 'Coimbatore',
          district_name: 'Coimbatore',
          primary_sport: 'badminton',
          skill_level: 'intermediate',
          is_active: true,
          created_at: new Date().toISOString(),
        };

        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile));

        setUser(mockUser);
        setProfile(mockProfile);
        setSession({ user: mockUser });
        return { user: mockUser, session: { user: mockUser } };
      }
    } finally {
      setLoading(false);
    }
  };

  // ── SIGN IN ──
  const signIn = async ({ email, password }) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, data.user.email);
        return { user: data.user, session: data.session };
      } else {
        // Dev Mock Fallback Login
        const mockUser = {
          id: `usr_mock_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          user_metadata: { full_name: email.split('@')[0] },
        };
        const mockProfile = {
          id: mockUser.id,
          email,
          full_name: email.split('@')[0].toUpperCase(),
          role: email.toLowerCase().includes('admin')
            ? 'admin'
            : email.toLowerCase().includes('organizer')
            ? 'organizer'
            : 'user',
          city_name: 'Coimbatore',
          district_name: 'Coimbatore',
          primary_sport: 'badminton',
          skill_level: 'intermediate',
          is_active: true,
          created_at: new Date().toISOString(),
        };

        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile));

        setUser(mockUser);
        setProfile(mockProfile);
        setSession({ user: mockUser });
        return { user: mockUser, session: { user: mockUser } };
      }
    } finally {
      setLoading(false);
    }
  };

  // ── SIGN OUT ──
  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // ── UPDATE PROFILE ──
  const updateProfile = async (allowedUpdates) => {
    if (!user) throw new Error('Not authenticated');

    // Never allow updating role via frontend updateProfile
    const safeUpdates = { ...allowedUpdates };
    delete safeUpdates.role;
    delete safeUpdates.id;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id);

      if (error) console.warn('Supabase DB profile update warning:', error.message);
    }

    // Update state & local backup
    const updated = { ...profile, ...safeUpdates, updated_at: new Date().toISOString() };
    setProfile(updated);
    if (!isSupabaseConfigured) {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }
    return updated;
  };

  // ── FORGOT / RESET PASSWORD ──
  const resetPassword = async (email) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAuthenticated: Boolean(user),
        signUp,
        signIn,
        signOut,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
