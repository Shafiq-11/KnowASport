-- ============================================================
-- KNOWASPORT — PHASE 7.5: REFINEMENTS, ADMIN WORKFLOW & CHECK-IN TOGGLE MIGRATION
-- ============================================================

-- 1. ADD CHECK_IN_REQUIRED TOGGLE TO EVENTS TABLE
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS check_in_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS changes_requested_reason TEXT;

-- 2. ENHANCE ORGANIZER_APPLICATIONS FOR SECURE VERIFICATION & ADMIN AUDIT
ALTER TABLE public.organizer_applications
  ADD COLUMN IF NOT EXISTS verification_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 3. CREATE ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_events_checkin ON public.events(check_in_required);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.admin_audit_logs(admin_user_id);

-- 5. SECURITY: RESTRICT SENSITIVE VERIFICATION DOCS FROM PUBLIC ACCESS
-- Ordinary users & public SELECT policies DO NOT include verification_doc_url or pan_number
