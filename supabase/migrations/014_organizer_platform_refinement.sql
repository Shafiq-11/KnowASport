-- ============================================================
-- KNOWASPORT — PHASE 9: ORGANIZER PLATFORM REFINEMENT MIGRATION
-- ============================================================

-- 1. ADD PREFERENCES COLUMN TO PROFILES FOR DASHBOARD & NOTIFICATIONS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "show_revenue_breakdown": true,
    "show_registration_trends": true,
    "show_sport_performance": true,
    "show_checkin_analytics": true,
    "show_top_events": true,
    "show_recent_registrations": true,
    "notify_registrations": true,
    "notify_payments": true,
    "notify_approvals": true,
    "notify_event_updates": true
  }'::jsonb;

-- 2. ENSURE ORGANIZERS TABLE HAS WEBSITE & CUSTOM PREFERENCES
ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
  ADD COLUMN IF NOT EXISTS custom_settings JSONB DEFAULT '{}'::jsonb;

-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR ORGANIZERS

-- Enable RLS on events if not already enabled
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Organizers can select their own events (any status: draft, pending_review, published, rejected, completed, etc.)
CREATE POLICY "Organizers read own events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizers o
      WHERE o.id = events.organizer_id
        AND o.user_id = auth.uid()
    )
  );

-- Organizers can insert their own draft events
CREATE POLICY "Organizers insert own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizers o
      WHERE o.id = events.organizer_id
        AND o.user_id = auth.uid()
    )
  );

-- Organizers can update their own events (when draft, pending_review, or changes_requested)
CREATE POLICY "Organizers update own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizers o
      WHERE o.id = events.organizer_id
        AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizers o
      WHERE o.id = events.organizer_id
        AND o.user_id = auth.uid()
    )
  );

-- Organizers can read registrations for events they own
CREATE POLICY "Organizers read registrations for own events"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON e.organizer_id = o.id
      WHERE e.id = event_registrations.event_id
        AND o.user_id = auth.uid()
    )
  );

-- Organizers can read payments for events they own
CREATE POLICY "Organizers read payments for own events"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON e.organizer_id = o.id
      WHERE e.id = payments.event_id
        AND o.user_id = auth.uid()
    )
  );

-- Organizers can update their own organizer profile
CREATE POLICY "Organizers update own organizer profile"
  ON public.organizers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Organizers can insert their own organizer profile
CREATE POLICY "Organizers insert own organizer profile"
  ON public.organizers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON public.organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
