import { supabase, isSupabaseConfigured } from './supabase.js';

const LOCAL_BLOG_KEY = 'kas_mock_blog_articles_v1';

export const blogService = {
  /**
   * Get Published Articles for Public Blog
   */
  async getPublishedArticles({ category = 'all', sport = 'all', search = '', limit = 12 } = {}) {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredArticles();
      return stored.filter((a) => {
        if (a.status !== 'published') return false;
        if (category !== 'all' && a.category?.toLowerCase() !== category.toLowerCase()) return false;
        if (sport !== 'all' && a.sport_name?.toLowerCase() !== sport.toLowerCase()) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q);
        }
        return true;
      }).slice(0, limit);
    }

    try {
      let q = supabase.from('blog_articles').select('*').eq('status', 'published').order('published_at', { ascending: false });
      if (category !== 'all') q = q.eq('category', category);
      if (sport !== 'all') q = q.eq('sport_name', sport);
      if (search.trim()) q = q.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);

      const { data, error } = await q.limit(limit);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase blog query warning:', err.message);
      return this._getStoredArticles().filter((a) => a.status === 'published');
    }
  },

  /**
   * Get Featured Story for Blog Hero
   */
  async getFeaturedArticle() {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredArticles().filter((a) => a.status === 'published');
      return stored.find((a) => a.featured) || stored[0] || null;
    }

    try {
      const { data } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('status', 'published')
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return data;

      // Fallback to latest published article
      const { data: latest } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return latest || null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Get Single Article by Slug
   */
  async getArticleBySlug(slug) {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredArticles();
      return stored.find((a) => a.slug === slug && a.status === 'published') || null;
    }

    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const stored = this._getStoredArticles();
      return stored.find((a) => a.slug === slug) || null;
    }
  },

  /**
   * Get Related Articles for Article Page
   */
  async getRelatedArticles(articleId, category) {
    const list = await this.getPublishedArticles({ limit: 6 });
    return list.filter((a) => a.id !== articleId).slice(0, 3);
  },

  /**
   * Admin: Get All Articles (Draft, Published, Archived)
   */
  async getAllArticlesAdmin() {
    if (!isSupabaseConfigured) {
      return this._getStoredArticles();
    }

    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      return this._getStoredArticles();
    }
  },

  /**
   * Admin: Create New Article
   */
  async createArticle(articleData) {
    const newArticle = {
      id: `art_${Date.now()}`,
      title: articleData.title,
      slug: articleData.slug || articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: articleData.excerpt || '',
      content: articleData.content || '',
      cover_image: articleData.cover_image || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800',
      category: articleData.category || 'Tamil Nadu Sports',
      sport_name: articleData.sport_name || 'All Sports',
      author_name: articleData.author_name || 'KnowASport Editorial',
      status: articleData.status || 'published',
      featured: Boolean(articleData.featured),
      read_time_minutes: Number(articleData.read_time_minutes || 4),
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const stored = this._getStoredArticles();
      stored.unshift(newArticle);
      localStorage.setItem(LOCAL_BLOG_KEY, JSON.stringify(stored));
      return newArticle;
    }

    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .insert(newArticle)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Create article error:', err);
      throw new Error(err.message || 'Could not create article.');
    }
  },

  /**
   * Admin: Update Article
   */
  async updateArticle(id, articleData) {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredArticles();
      const updated = stored.map((a) => (a.id === id ? { ...a, ...articleData, updated_at: new Date().toISOString() } : a));
      localStorage.setItem(LOCAL_BLOG_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('blog_articles')
        .update({ ...articleData, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Update article error:', err);
      return false;
    }
  },

  /**
   * Admin: Delete Article
   */
  async deleteArticle(id) {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredArticles();
      const updated = stored.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_BLOG_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase.from('blog_articles').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      return false;
    }
  },

  _getStoredArticles() {
    try {
      const stored = localStorage.getItem(LOCAL_BLOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
};
