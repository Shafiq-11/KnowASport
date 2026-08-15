-- ============================================================
-- KNOWASPORT — PHASE 4: SEED DATA FOR TAMIL NADU SPORTS & EVENTS
-- ============================================================

-- 1. SEED DISTRICTS
INSERT INTO public.districts (name, slug) VALUES
  ('Coimbatore', 'coimbatore'),
  ('Chennai', 'chennai'),
  ('Madurai', 'madurai'),
  ('Tiruppur', 'tiruppur'),
  ('Salem', 'salem'),
  ('Erode', 'erode'),
  ('Tiruchirappalli', 'tiruchirappalli'),
  ('Thanjavur', 'thanjavur'),
  ('Krishnagiri', 'krishnagiri'),
  ('Vellore', 'vellore'),
  ('Tirunelveli', 'tirunelveli'),
  ('Dindigul', 'dindigul')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED CITIES
INSERT INTO public.cities (name, slug, is_popular) VALUES
  ('Coimbatore', 'coimbatore', true),
  ('Chennai', 'chennai', true),
  ('Madurai', 'madurai', true),
  ('Tiruppur', 'tiruppur', true),
  ('Salem', 'salem', true),
  ('Erode', 'erode', true),
  ('Trichy', 'trichy', true),
  ('Thanjavur', 'thanjavur', false),
  ('Hosur', 'hosur', true),
  ('Vellore', 'vellore', false),
  ('Tirunelveli', 'tirunelveli', false),
  ('Dindigul', 'dindigul', false)
ON CONFLICT (name) DO NOTHING;

-- 3. SEED SPORTS
INSERT INTO public.sports (name, slug, description, badge_class, emoji) VALUES
  ('Cricket', 'cricket', 'T20, T10, Leather & Tennis ball tournaments across Tamil Nadu', 'bg-blue-100 text-blue-800 border-blue-200', '🏏'),
  ('Football', 'football', '5v5, 7v7, 11v11 turf and grass ground leagues', 'bg-emerald-100 text-emerald-800 border-emerald-200', '⚽'),
  ('Badminton', 'badminton', 'Singles and Doubles indoor court championships', 'bg-amber-100 text-amber-900 border-amber-200', '🏸'),
  ('Volleyball', 'volleyball', 'Outdoor clay court and indoor volleyball cups', 'bg-orange-100 text-orange-800 border-orange-200', '🏐'),
  ('Basketball', 'basketball', '3v3 half-court and 5v5 full-court showdowns', 'bg-indigo-100 text-indigo-800 border-indigo-200', '🏀'),
  ('Athletics', 'athletics', 'Marathons, 10K runs, track and field meets', 'bg-rose-100 text-rose-800 border-rose-200', '🏃'),
  ('Kabaddi', 'kabaddi', 'Traditional and Pro-style mat & clay Kabaddi tournaments', 'bg-red-100 text-red-800 border-red-200', '🤼'),
  ('Chess', 'chess', 'FIDE rated and open rapid/blitz chess contests', 'bg-purple-100 text-purple-800 border-purple-200', '♟️'),
  ('Tennis', 'tennis', 'Hard and clay court tennis open tournaments', 'bg-lime-100 text-lime-800 border-lime-200', '🎾'),
  ('Table Tennis', 'table-tennis', 'Indoor ping-pong singles and doubles leagues', 'bg-teal-100 text-teal-800 border-teal-200', '🏓')
ON CONFLICT (slug) DO NOTHING;

-- 4. SEED EVENT TYPES
INSERT INTO public.event_types (name, slug, icon_name, description) VALUES
  ('Local Event', 'local', 'MapPin', 'Friendly neighborhood and community matches'),
  ('Sports Event', 'sports', 'Trophy', 'General open sporting competitions'),
  ('Club Event', 'club', 'Shield', 'Events hosted by registered sports clubs'),
  ('Turf Event', 'turf', 'Goal', 'Fast-paced turf tournaments under floodlights'),
  ('College Event', 'college', 'GraduationCap', 'Inter-collegiate and university tournaments'),
  ('School Event', 'school', 'School', 'Inter-school junior championships'),
  ('District Event', 'district', 'Flag', 'Official district-level sports meets'),
  ('Open Tournament', 'open-tournament', 'Globe', 'State-wide open registration tournaments'),
  ('Championship', 'championship', 'Award', 'High-stakes championship cups with grand prizes'),
  ('League', 'league', 'Medal', 'Multi-week season league format')
ON CONFLICT (slug) DO NOTHING;
