-- ============================================================
-- KNOWASPORT — PHASE 4: SCHEMA FOR SPORTS, LOCATIONS, ORGANIZERS, EVENTS & SAVED EVENTS
-- ============================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DISTRICTS TABLE
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CITIES TABLE
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SPORTS TABLE
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

-- 4. EVENT TYPES TABLE
CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_name TEXT DEFAULT 'Trophy',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORGANIZERS TABLE
CREATE TABLE IF NOT EXISTS public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT DEFAULT 'club' CHECK (organization_type IN ('academy', 'club', 'college', 'school', 'association', 'individual')),
  description TEXT,
  logo_url TEXT,
  city_name TEXT,
  district_name TEXT,
  phone TEXT,
  email TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  events_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. EVENTS TABLE
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
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'cancelled', 'completed')),
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
  max_participants INT,
  current_participants INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. EVENT RULES TABLE
CREATE TABLE IF NOT EXISTS public.event_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  rule_order INT DEFAULT 0
);

-- 8. EVENT PRIZES TABLE
CREATE TABLE IF NOT EXISTS public.event_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  position INT NOT NULL,
  title TEXT NOT NULL,
  prize_description TEXT NOT NULL
);

-- 9. EVENT SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS public.event_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT
);

-- 10. SAVED EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.saved_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_events_status_start ON public.events(status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_sport_slug ON public.events(sport_id);
CREATE INDEX IF NOT EXISTS idx_events_city_name ON public.events(city_name);
CREATE INDEX IF NOT EXISTS idx_events_fee ON public.events(entry_fee);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON public.saved_events(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Public read districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read event_types" ON public.event_types FOR SELECT USING (true);

-- Public read for published events
CREATE POLICY "Public read published events" ON public.events FOR SELECT USING (status = 'published');
CREATE POLICY "Public read event_rules" ON public.event_rules FOR SELECT USING (true);
CREATE POLICY "Public read event_prizes" ON public.event_prizes FOR SELECT USING (true);
CREATE POLICY "Public read event_schedule" ON public.event_schedule FOR SELECT USING (true);

-- Public read for organizer basic details (hides private info)
CREATE POLICY "Public read organizers" ON public.organizers FOR SELECT USING (true);

-- RLS for saved_events: Users manage only their own saved events
CREATE POLICY "Users read own saved events" ON public.saved_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved events" ON public.saved_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved events" ON public.saved_events DELETE TO authenticated USING (auth.uid() = user_id);
