-- ============================================================
-- KNOWASPORT — PHASE 7: ORGANIZER PLATFORM MIGRATION
-- ============================================================

-- 1. CREATE ORGANIZER APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city_name TEXT,
  district_name TEXT,
  description TEXT,
  sports_handled TEXT[],
  experience_years TEXT,
  website_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. ENSURE ORGANIZERS TABLE HAS USER_ID LINK & VERIFICATION FIELDS
ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 3. INDEXES FOR ORGANIZER APPLICATIONS & LOOKUPS
CREATE INDEX IF NOT EXISTS idx_organizer_apps_user ON public.organizer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_apps_status ON public.organizer_applications(status);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users read own application
CREATE POLICY "Users read own organizer application"
  ON public.organizer_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users insert own application
CREATE POLICY "Users insert own organizer application"
  ON public.organizer_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users update own application if status is pending or draft
CREATE POLICY "Users update own pending organizer application"
  ON public.organizer_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
