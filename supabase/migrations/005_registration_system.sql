-- ============================================================
-- KNOWASPORT — PHASE 5: EVENT REGISTRATION SYSTEM MIGRATION
-- ============================================================

-- 1. CREATE REGISTRATION NUMBER SEQUENCE
CREATE SEQUENCE IF NOT EXISTS public.registration_number_seq START WITH 10001;

-- 2. CREATE EVENT REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participation_type TEXT NOT NULL CHECK (participation_type IN ('individual', 'team')),
  team_name TEXT,
  team_size INT DEFAULT 1,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('draft', 'pending_payment', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  total_fee NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- 3. CREATE REGISTRATION PARTICIPANTS TABLE
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

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_participants_registration ON public.registration_participants(registration_id);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_participants ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR EVENT_REGISTRATIONS
CREATE POLICY "Users read own registrations"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own registrations"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own registrations status"
  ON public.event_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES FOR REGISTRATION_PARTICIPANTS
CREATE POLICY "Users read own registration participants"
  ON public.registration_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations er
      WHERE er.id = registration_participants.registration_id
        AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own registration participants"
  ON public.registration_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_registrations er
      WHERE er.id = registration_participants.registration_id
        AND er.user_id = auth.uid()
    )
  );

-- 6. SECURE REGISTRATION NUMBER GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TEXT AS $$
DECLARE
  seq_num BIGINT;
  reg_code TEXT;
BEGIN
  seq_num := nextval('public.registration_number_seq');
  reg_code := 'KAS-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN reg_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
