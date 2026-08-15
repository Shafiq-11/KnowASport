-- ============================================================
-- KNOWASPORT — PHASE 8.5: SPORTS BLOG & EDITORIAL SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'Tamil Nadu Sports',
  sport_name TEXT DEFAULT 'All Sports',
  author_name TEXT DEFAULT 'KnowASport Editorial',
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT false,
  read_time_minutes INTEGER DEFAULT 4,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_blog_slug ON public.blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status ON public.blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_featured ON public.blog_articles(featured);
CREATE INDEX IF NOT EXISTS idx_blog_category ON public.blog_articles(category);

-- RLS POLICIES
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Public read published blog articles"
  ON public.blog_articles FOR SELECT
  TO public
  USING (status = 'published');

-- Admins can manage all blog articles
CREATE POLICY "Admins full control blog articles"
  ON public.blog_articles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
