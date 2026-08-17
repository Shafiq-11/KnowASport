import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are valid and properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('your-anon-key') &&
  !supabaseAnonKey.includes('placeholder')
);

// Fallback dummy credentials to prevent createClient from crashing if env vars are missing
const dummyUrl = 'https://placeholder-project.supabase.co';
const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : dummyUrl,
  isSupabaseConfigured ? supabaseAnonKey : dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'kas_supabase_auth_token',
    },
  }
);

/**
 * Helper to get clean, human-readable error messages from Supabase responses
 */
export function formatSupabaseError(error, defaultMessage = 'An unexpected database error occurred.') {
  if (!error) return defaultMessage;
  const msg = error.message || error.error_description || String(error);
  
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return 'A record with these details already exists.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox.';
  }
  if (msg.includes('JWT expired') || msg.includes('token is expired')) {
    return 'Your session has expired. Please log in again.';
  }
  if (msg.includes('Row-level security') || msg.includes('policy')) {
    return 'You do not have permission to perform this action.';
  }
  return msg || defaultMessage;
}
