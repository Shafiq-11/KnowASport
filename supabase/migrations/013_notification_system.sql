-- ============================================================
-- KNOWASPORT — PHASE 8.8: NOTIFICATION SYSTEM MIGRATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'registration_confirmed',
    'payment_success',
    'payment_failed',
    'event_updated',
    'event_cancelled',
    'event_reminder',
    'checkin_information',
    'organizer_approved',
    'organizer_rejected',
    'event_approved',
    'event_changes_requested',
    'event_rejected',
    'new_organizer_application',
    'new_event_submission'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  related_type TEXT,
  related_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_lookup ON public.notifications(user_id, read, created_at DESC);

-- Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own notifications
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
