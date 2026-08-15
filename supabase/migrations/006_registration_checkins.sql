-- ============================================================
-- KNOWASPORT — PHASE 6A: REGISTRATION CHECK-IN & VERIFICATION MIGRATION
-- ============================================================

-- 1. ADD QR TOKEN AND CHECK-IN COLUMNS TO EVENT_REGISTRATIONS
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS checkin_status TEXT DEFAULT 'not_checked_in' CHECK (checkin_status IN ('not_checked_in', 'checked_in')),
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- 2. CREATE REGISTRATION CHECK-INS AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.registration_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  verification_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES FOR FAST CHECK-IN VERIFICATION
CREATE INDEX IF NOT EXISTS idx_registrations_qr ON public.event_registrations(qr_token);
CREATE INDEX IF NOT EXISTS idx_checkins_event ON public.registration_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_reg ON public.registration_checkins(registration_id);

-- 4. ROW LEVEL SECURITY ON REGISTRATION_CHECKINS
ALTER TABLE public.registration_checkins ENABLE ROW LEVEL SECURITY;

-- Policy: Organizers can read check-in logs for events they own
CREATE POLICY "Organizers read checkins for own events"
  ON public.registration_checkins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON e.organizer_id = o.id
      WHERE e.id = registration_checkins.event_id
        AND o.user_id = auth.uid()
    )
  );

-- Policy: Organizers can insert check-ins for events they own
CREATE POLICY "Organizers insert checkins for own events"
  ON public.registration_checkins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON e.organizer_id = o.id
      WHERE e.id = registration_checkins.event_id
        AND o.user_id = auth.uid()
    )
  );
