-- ============================================================
-- KNOWASPORT — PHASE 10: REGISTRATION PASS CODE & QR ENHANCEMENT
-- ============================================================

-- 1. ADD PASS_CODE COLUMN TO EVENT_REGISTRATIONS
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS pass_code TEXT UNIQUE;

-- 2. CREATE INDEX FOR FAST PASS CODE LOOKUP
CREATE INDEX IF NOT EXISTS idx_registrations_pass_code ON public.event_registrations(pass_code);

-- 3. AUTO-GENERATE PASS CODES FOR ANY EXISTING RECORDS WITHOUT ONE
DO $$
DECLARE
  r RECORD;
  new_code TEXT;
BEGIN
  FOR r IN SELECT id FROM public.event_registrations WHERE pass_code IS NULL LOOP
    -- Generate 8-character human-readable alphanumeric code prefixed with KAS
    new_code := 'KAS' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || r.id::TEXT) FROM 1 FOR 5));
    UPDATE public.event_registrations
    SET pass_code = new_code
    WHERE id = r.id;
  END LOOP;
END $$;
