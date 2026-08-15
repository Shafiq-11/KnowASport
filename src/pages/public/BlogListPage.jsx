import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, Search, Clock, Calendar, ArrowRight, Sparkles, BookOpen, Tag } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { blogService } from '../../services/blogService.js';
import { formatDateShort } from '../../utils/formatters.js';
import SEOHead from '../../components/common/SEOHead.jsx';

const BLOG_CATEGORIES = [
  'All',
  'Tamil Nadu Sports',
  'Local Events',
  'Tournament Updates',
  'Athlete Stories',
  'Sports Tips',
  'Community',
  'Event Highlights',
];

export default function BlogListPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBlog() {
      setLoading(true);
      try {
        const feat = await blogService.getFeaturedArticle();
        const list = await blogService.getPublishedArticles({
          category: selectedCategory === 'All' ? 'all' : selectedCategory,
          search: searchQuery,
        });

        if (active) {
          setFeaturedArticle(feat);
          setArticles(list || []);
        }
      } catch (err) {
        console.error('Error loading blog articles:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(loadBlog, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchQuery]);

  return (
    <div className="kas-container py-8 lg:py-12 space-y-10">
      <SEOHead
        title="Tamil Nadu Sports News & Updates | KnowASport"
        description="Latest sports news, tournament updates, local sports coverage, athlete stories and community news from Tamil Nadu."
      />
      {/* Page Header */}
      <title>Tamil Nadu Sports News & Editorial | KnowASport</title>
      <meta name="description" content="Read authentic local sports stories, tournament updates, athlete spotlights, and sporting tips across Tamil Nadu." />

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto border-b border-neutral-100 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-800 uppercase tracking-widest">
          <Newspaper size={14} className="text-amber-600" />
          <span>KnowASport Editorial</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-800 text-neutral-900 tracking-tight">
          Tamil Nadu Sports Stories & Updates
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Local tournament coverage, athlete profiles, and sports highlights from across Tamil Nadu.
        </p>
      </div>

      {/* Search & Category Tabs Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="w-full sm:w-80 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search sports articles & stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-[10px] pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          <span className="text-xs font-700 text-neutral-500">{articles.length} Article{articles.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hidden">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-700 whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Story Hero (if available and no search query) */}
      {!searchQuery && selectedCategory === 'All' && featuredArticle && (
        <div className="bg-white rounded-[24px] border border-neutral-200 overflow-hidden shadow-sm hover:border-neutral-300 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-7 aspect-[16/9] lg:aspect-auto overflow-hidden">
              <img
                src={featuredArticle.cover_image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="inline-block text-[11px] font-800 uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-[6px]">
                  FEATURED STORY • {featuredArticle.category}
                </span>

                <h2 className="text-xl sm:text-2xl font-800 text-neutral-900 tracking-tight leading-snug">
                  <Link to={`/blog/${featuredArticle.slug}`} className="hover:text-amber-700 transition-colors">
                    {featuredArticle.title}
                  </Link>
                </h2>

                <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3 leading-relaxed">
                  {featuredArticle.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-3">
                  <span>{formatDateShort(featuredArticle.published_at)}</span>
                  <span>•</span>
                  <span>{featuredArticle.read_time_minutes || 4} min read</span>
                </div>

                <Link
                  to={`/blog/${featuredArticle.slug}`}
                  className="font-800 text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  Read Article <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Grid */}
      {loading ? (
        <SectionSkeleton count={6} />
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-[20px] border border-neutral-200 overflow-hidden flex flex-col justify-between shadow-xs hover:border-neutral-300 hover:shadow-md transition-all group"
            >
              <div className="space-y-4">
                <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-800 uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px]">
                    {article.category}
                  </span>

                  <h3 className="font-800 text-neutral-900 text-base leading-snug line-clamp-2">
                    <Link to={`/blog/${article.slug}`} className="hover:text-amber-700 transition-colors">
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-100/60 mt-4">
                <span>{formatDateShort(article.published_at)}</span>
                <Link to={`/blog/${article.slug}`} className="font-800 text-amber-700 hover:text-amber-800 flex items-center gap-1">
                  Read <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No sports stories yet"
          description="Check back soon for authentic Tamil Nadu sports news, tournament coverage, and local athlete highlights."
        />
      )}
    </div>
  );
}
