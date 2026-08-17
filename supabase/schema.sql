-- ============================================================
-- KNOWASPORT — PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Master Migration Script for Supabase PostgreSQL
-- ============================================================

-- Enable pgcrypto for UUID and cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE & AUTH TRIGGER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  city_name TEXT DEFAULT 'Coimbatore',
  district_name TEXT DEFAULT 'Coimbatore',
  primary_sport TEXT DEFAULT 'badminton',
  skill_level TEXT DEFAULT 'intermediate',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Automatic handle_new_user trigger on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. REFERENCE TABLES: DISTRICTS, CITIES, SPORTS & EVENT TYPES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  badge_class TEXT,
  emoji TEXT DEFAULT '🏆',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_name TEXT DEFAULT 'Trophy',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. ORGANIZERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT DEFAULT 'club' CHECK (organization_type IN ('academy', 'club', 'college', 'school', 'association', 'individual', 'turf', 'company')),
  description TEXT,
  logo_url TEXT,
  city_name TEXT,
  district_name TEXT,
  phone TEXT,
  email TEXT,
  aadhaar_number TEXT,
  live_photo_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  verified_at TIMESTAMPTZ,
  events_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizers_user ON public.organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_status ON public.organizers(verification_status);

-- ============================================================
-- 4. ORGANIZER VERIFICATION APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_type TEXT DEFAULT 'Sports Club',
  phone TEXT,
  email TEXT,
  city_name TEXT DEFAULT 'Coimbatore',
  district_name TEXT DEFAULT 'Coimbatore',
  description TEXT,
  sports_handled JSONB DEFAULT '["Football", "Cricket"]'::jsonb,
  experience_years TEXT DEFAULT '1-3 years',
  website_url TEXT,
  aadhaar_number TEXT,
  aadhaar_holder_name TEXT,
  aadhaar_doc_url TEXT,
  live_photo_url TEXT,
  is_phone_verified BOOLEAN DEFAULT false,
  is_live_photo_verified BOOLEAN DEFAULT false,
  is_aadhaar_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_apps_status ON public.organizer_applications(status);

-- ============================================================
-- 5. EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.organizers(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES public.sports(id) ON DELETE SET NULL,
  event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  poster_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'pending_review', 'published', 'changes_requested', 'rejected', 'cancelled', 'completed')),
  rejection_reason TEXT,
  changes_requested_reason TEXT,
  entry_fee NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  start_date DATE NOT NULL,
  end_date DATE,
  registration_start TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  city_name TEXT NOT NULL,
  district_name TEXT NOT NULL,
  participation_type TEXT DEFAULT 'individual' CHECK (participation_type IN ('individual', 'team', 'both')),
  team_size INT DEFAULT 1,
  minimum_age INT DEFAULT 5,
  maximum_age INT DEFAULT 99,
  gender_category TEXT DEFAULT 'all' CHECK (gender_category IN ('all', 'male', 'female')),
  max_participants INT DEFAULT 100,
  current_participants INT DEFAULT 0,
  check_in_required BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_status_start ON public.events(status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city_name);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);

-- Sub-event detail tables
CREATE TABLE IF NOT EXISTS public.event_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  rule_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.event_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  position INT NOT NULL,
  title TEXT NOT NULL,
  prize_description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.event_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT
);

-- ============================================================
-- 6. REGISTRATIONS & PARTICIPANTS TABLE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.registration_number_seq START WITH 10001;

CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TEXT AS $$
DECLARE
  seq_num BIGINT;
BEGIN
  seq_num := nextval('public.registration_number_seq');
  RETURN 'KAS-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL DEFAULT public.generate_registration_number(),
  pass_code TEXT UNIQUE NOT NULL,
  qr_token TEXT UNIQUE NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participation_type TEXT NOT NULL CHECK (participation_type IN ('individual', 'team')),
  team_name TEXT,
  team_size INT DEFAULT 1,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('draft', 'pending_payment', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  total_fee NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  checkin_status TEXT DEFAULT 'pending' CHECK (checkin_status IN ('pending', 'checked_in', 'cancelled')),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_regs_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_regs_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_regs_qr ON public.event_registrations(qr_token);
CREATE INDEX IF NOT EXISTS idx_regs_pass ON public.event_registrations(pass_code);

CREATE TABLE IF NOT EXISTS public.registration_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT,
  email TEXT,
  city_name TEXT,
  district_name TEXT,
  player_role TEXT DEFAULT 'member' CHECK (player_role IN ('captain', 'member', 'individual')),
  player_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parts_reg ON public.registration_participants(registration_id);

-- ============================================================
-- 7. CHECK-IN LOGS & ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registration_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_token TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_event ON public.registration_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_reg ON public.registration_checkins(registration_id);

-- ============================================================
-- 8. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'captured' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. NOTIFICATIONS, BLOG & ADMIN AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_type TEXT,
  related_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Sports News',
  author_name TEXT DEFAULT 'KnowASport Editorial Team',
  cover_image TEXT,
  is_published BOOLEAN DEFAULT true,
  read_time TEXT DEFAULT '4 min read',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Reference Tables: Public Read
CREATE POLICY "Public read districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read event_types" ON public.event_types FOR SELECT USING (true);
CREATE POLICY "Public read blog_posts" ON public.blog_posts FOR SELECT USING (is_published = true);

-- Profiles: Users read/update their own profile
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Organizers: Public read basic info, organizer manages own profile
CREATE POLICY "Public read organizers" ON public.organizers FOR SELECT USING (true);
CREATE POLICY "Organizers update own profile" ON public.organizers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Organizer Applications: Users manage own application
CREATE POLICY "Users read own application" ON public.organizer_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own application" ON public.organizer_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own application" ON public.organizer_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Events: Public reads published, Organizers manage their own events
CREATE POLICY "Public read published events" ON public.events FOR SELECT USING (status = 'published');
CREATE POLICY "Organizers read own events" ON public.events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = events.organizer_id AND user_id = auth.uid())
);
CREATE POLICY "Organizers insert own events" ON public.events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = events.organizer_id AND user_id = auth.uid())
);
CREATE POLICY "Organizers update own events" ON public.events FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = events.organizer_id AND user_id = auth.uid())
);

-- Event Details: Rules, Prizes, Schedule public read
CREATE POLICY "Public read rules" ON public.event_rules FOR SELECT USING (true);
CREATE POLICY "Public read prizes" ON public.event_prizes FOR SELECT USING (true);
CREATE POLICY "Public read schedule" ON public.event_schedule FOR SELECT USING (true);

-- Event Registrations:
-- 1. Users can read/create/update their own registrations
CREATE POLICY "Users read own registrations" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own registrations" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Organizers can read registrations for their own events
CREATE POLICY "Organizers read event registrations" ON public.event_registrations FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON e.organizer_id = o.id
    WHERE e.id = event_registrations.event_id AND o.user_id = auth.uid()
  )
);

-- Registration Participants: Users read own participants, Organizers read participants for their events
CREATE POLICY "Users read own participants" ON public.registration_participants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.event_registrations er WHERE er.id = registration_participants.registration_id AND er.user_id = auth.uid())
);
CREATE POLICY "Users insert own participants" ON public.registration_participants FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.event_registrations er WHERE er.id = registration_participants.registration_id AND er.user_id = auth.uid())
);
CREATE POLICY "Organizers read event participants" ON public.registration_participants FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations er
    JOIN public.events e ON er.event_id = e.id
    JOIN public.organizers o ON e.organizer_id = o.id
    WHERE er.id = registration_participants.registration_id AND o.user_id = auth.uid()
  )
);

-- Registration Check-ins: Organizers can insert check-in logs and read check-in logs for their events
CREATE POLICY "Organizers insert checkins" ON public.registration_checkins FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON e.organizer_id = o.id
    WHERE e.id = registration_checkins.event_id AND o.user_id = auth.uid()
  )
);
CREATE POLICY "Organizers read checkins" ON public.registration_checkins FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON e.organizer_id = o.id
    WHERE e.id = registration_checkins.event_id AND o.user_id = auth.uid()
  )
);

-- Notifications & Saved Events: Scoped to logged-in user
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage saved events" ON public.saved_events FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 11. SUPABASE STORAGE BUCKETS CONFIGURATION
-- ============================================================
-- Insert Storage Buckets if storage schema exists
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('event-media', 'event-media', true),
  ('avatars', 'avatars', true),
  ('organizer-kyc', 'organizer-kyc', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage RLS Policies
CREATE POLICY "Public read event media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-media');

CREATE POLICY "Authenticated users upload event media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-media');

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Organizers read own KYC files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'organizer-kyc' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Organizers upload own KYC files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'organizer-kyc' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 12. TURNKEY INITIAL SEED DATA
-- ============================================================
-- Districts
INSERT INTO public.districts (name, slug) VALUES
  ('Coimbatore', 'coimbatore'),
  ('Chennai', 'chennai'),
  ('Madurai', 'madurai'),
  ('Tiruppur', 'tiruppur'),
  ('Salem', 'salem'),
  ('Erode', 'erode'),
  ('Tiruchirappalli', 'tiruchirappalli'),
  ('Thanjavur', 'thanjavur'),
  ('Krishnagiri', 'krishnagiri'),
  ('Vellore', 'vellore'),
  ('Tirunelveli', 'tirunelveli'),
  ('Dindigul', 'dindigul')
ON CONFLICT (name) DO NOTHING;

-- Cities
INSERT INTO public.cities (name, slug, is_popular) VALUES
  ('Coimbatore', 'coimbatore', true),
  ('Chennai', 'chennai', true),
  ('Madurai', 'madurai', true),
  ('Tiruppur', 'tiruppur', true),
  ('Salem', 'salem', true),
  ('Erode', 'erode', true),
  ('Trichy', 'trichy', true),
  ('Thanjavur', 'thanjavur', false),
  ('Hosur', 'hosur', true),
  ('Vellore', 'vellore', false),
  ('Tirunelveli', 'tirunelveli', false),
  ('Dindigul', 'dindigul', false)
ON CONFLICT (name) DO NOTHING;

-- Sports
INSERT INTO public.sports (name, slug, description, badge_class, emoji) VALUES
  ('Cricket', 'cricket', 'T20, T10, Leather & Tennis ball tournaments across Tamil Nadu', 'bg-blue-100 text-blue-800 border-blue-200', '🏏'),
  ('Football', 'football', '5v5, 7v7, 11v11 turf and grass ground leagues', 'bg-emerald-100 text-emerald-800 border-emerald-200', '⚽'),
  ('Badminton', 'badminton', 'Singles and Doubles indoor court championships', 'bg-amber-100 text-amber-900 border-amber-200', '🏸'),
  ('Volleyball', 'volleyball', 'Outdoor clay court and indoor volleyball cups', 'bg-orange-100 text-orange-800 border-orange-200', '🏐'),
  ('Basketball', 'basketball', '3v3 half-court and 5v5 full-court showdowns', 'bg-indigo-100 text-indigo-800 border-indigo-200', '🏀'),
  ('Athletics', 'athletics', 'Marathons, 10K runs, track and field meets', 'bg-rose-100 text-rose-800 border-rose-200', '🏃'),
  ('Kabaddi', 'kabaddi', 'Traditional and Pro-style mat & clay Kabaddi tournaments', 'bg-red-100 text-red-800 border-red-200', '🤼'),
  ('Chess', 'chess', 'FIDE rated and open rapid/blitz chess contests', 'bg-purple-100 text-purple-800 border-purple-200', '♟️'),
  ('Tennis', 'tennis', 'Hard and clay court tennis open tournaments', 'bg-lime-100 text-lime-800 border-lime-200', '🎾'),
  ('Table Tennis', 'table-tennis', 'Indoor ping-pong singles and doubles leagues', 'bg-teal-100 text-teal-800 border-teal-200', '🏓')
ON CONFLICT (slug) DO NOTHING;

-- Event Types
INSERT INTO public.event_types (name, slug, icon_name, description) VALUES
  ('Local Event', 'local', 'MapPin', 'Friendly neighborhood and community matches'),
  ('Sports Event', 'sports', 'Trophy', 'General open sporting competitions'),
  ('Club Event', 'club', 'Shield', 'Events hosted by registered sports clubs'),
  ('Turf Event', 'turf', 'Goal', 'Fast-paced turf tournaments under floodlights'),
  ('College Event', 'college', 'GraduationCap', 'Inter-collegiate and university tournaments'),
  ('School Event', 'school', 'School', 'Inter-school junior championships'),
  ('District Event', 'district', 'Flag', 'Official district-level sports meets'),
  ('Open Tournament', 'open-tournament', 'Globe', 'State-wide open registration tournaments'),
  ('Championship', 'championship', 'Award', 'High-stakes championship cups with grand prizes'),
  ('League', 'league', 'Medal', 'Multi-week season league format')
ON CONFLICT (slug) DO NOTHING;

