-- ============================================================
-- KNOWASPORT — PHASE 8: ADMIN CONTROL CENTER MIGRATION
-- ============================================================

-- 1. ADD USER STATUS TO PROFILES TABLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_status TEXT DEFAULT 'active' CHECK (user_status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 2. CREATE ORGANIZER INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.organizer_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES FOR ADMIN SEARCH & PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payments_lookup ON public.payments(razorpay_order_id, razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_registrations_number ON public.event_registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.organizer_incidents(status);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.organizer_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read audit logs created by system/admin actions
CREATE POLICY "Authenticated users read admin audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (true);
