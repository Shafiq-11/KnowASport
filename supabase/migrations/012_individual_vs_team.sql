-- ============================================================
-- KNOWASPORT — PHASE 8.6: STRICT INDIVIDUAL VS TEAM EVENT MIGRATION
-- ============================================================

-- 1. Safely update any existing events set to 'both' to 'individual'
UPDATE public.events
SET participation_type = 'individual'
WHERE participation_type = 'both' OR participation_type IS NULL;

-- 2. Drop existing participation_type constraint if exists
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_participation_type_check;

-- 3. Add strict binary constraint for participation_type
ALTER TABLE public.events
ADD CONSTRAINT events_participation_type_check
CHECK (participation_type IN ('individual', 'team'));
