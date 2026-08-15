import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, Clock, ArrowLeft, Trophy, MapPin, Share2, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EventCard from '../../components/events/EventCard.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { blogService } from '../../services/blogService.js';
import { useEvents } from '../../hooks/useEvents.js';
import { formatDate, formatDateShort } from '../../utils/formatters.js';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { allEvents } = useEvents();

  useEffect(() => {
    let active = true;

    async function loadArticle() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await blogService.getArticleBySlug(slug);
        if (active) {
          setArticle(data);
          if (data) {
            const rel = await blogService.getRelatedArticles(data.id, data.category);
            setRelatedArticles(rel);
          }
        }
      } catch (err) {
        console.error('Error fetching blog article detail:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArticle();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="kas-container py-12 max-w-3xl space-y-6">
        <SectionSkeleton count={2} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="kas-container py-16 text-center space-y-4 max-w-md">
        <Newspaper size={40} className="text-neutral-400 mx-auto" />
        <h2 className="text-xl font-800 text-neutral-900">Article Not Found</h2>
        <p className="text-xs text-neutral-500">The sports article you requested does not exist or may have been archived.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/blog')} icon={<ArrowLeft size={16} />}>
          Return to Blog
        </Button>
      </div>
    );
  }

  // Related events matching sport or location
  const relatedEvents = allEvents.filter((e) => {
    if (article.sport_name && article.sport_name !== 'All Sports') {
      return e.sport_name.toLowerCase() === article.sport_name.toLowerCase();
    }
    return true;
  }).slice(0, 2);

  return (
    <article className="py-10 lg:py-16 space-y-12">
      {/* SEO Metadata */}
      <title>{`${article.title} | KnowASport`}</title>
      <meta name="description" content={article.excerpt || article.title} />

      {/* Top Header Section */}
      <div className="kas-container max-w-3xl space-y-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-700 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sports Editorial
        </Link>

        <div className="space-y-3">
          <span className="inline-block text-[11px] font-800 uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-[6px]">
            {article.category}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-800 text-neutral-900 tracking-tight leading-[1.15]">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed pt-1">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <span className="font-700 text-neutral-800">{article.author_name || 'KnowASport Editorial'}</span>
              <span>•</span>
              <span>{formatDate(article.published_at)}</span>
              <span>•</span>
              <span>{article.read_time_minutes || 4} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Cover Image */}
      <div className="kas-container max-w-4xl">
        <div className="aspect-[16/9] rounded-[24px] overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Readable Article Content Container (~720px width) */}
      <div className="kas-container max-w-[720px]">
        <div className="prose prose-neutral max-w-none text-neutral-800 leading-relaxed text-sm sm:text-base space-y-6">
          {article.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* RELATED UPCOMING SPORTS EVENTS */}
      {relatedEvents.length > 0 && (
        <div className="bg-amber-50/60 border-y border-amber-200/80 py-10">
          <div className="kas-container max-w-4xl space-y-6">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div>
                <span className="text-[11px] font-800 text-amber-700 uppercase tracking-widest block">Actionable Event Discovery</span>
                <h3 className="text-xl font-800 text-neutral-900 tracking-tight">
                  Related Tournaments & Upcoming Matches
                </h3>
              </div>

              <Link to="/events" className="text-xs font-800 text-amber-700 hover:text-amber-800 flex items-center gap-1">
                View All Events <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RELATED ARTICLES */}
      {relatedArticles.length > 0 && (
        <div className="kas-container max-w-4xl space-y-6 pt-4">
          <h3 className="text-lg font-800 text-neutral-900 tracking-tight border-b border-neutral-100 pb-3">
            You May Also Like
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <div key={rel.id} className="bg-white rounded-[16px] border border-neutral-200 p-4 space-y-2 shadow-xs">
                <span className="text-[10px] font-800 text-amber-700 uppercase tracking-wide bg-amber-50 px-2 py-0.5 rounded-[4px]">
                  {rel.category}
                </span>

                <h4 className="font-800 text-neutral-900 text-sm line-clamp-2 leading-snug">
                  <Link to={`/blog/${rel.slug}`} className="hover:text-amber-700">
                    {rel.title}
                  </Link>
                </h4>

                <span className="text-[11px] text-neutral-500 block pt-1">{formatDateShort(rel.published_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
