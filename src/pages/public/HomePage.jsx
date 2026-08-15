import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, MapPin, ArrowRight, Clock, Sparkles, ChevronRight, Layers,
  Calendar, ShieldCheck, Globe, Users, Newspaper, BookOpen
} from 'lucide-react';
import EventCard from '../../components/events/EventCard.jsx';
import Button from '../../components/common/Button.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import { useEvents } from '../../hooks/useEvents.js';
import { blogService } from '../../services/blogService.js';
import { useLocationContext } from '../../context/LocationContext.jsx';
import { SPORTS } from '../../utils/constants.js';
import { formatDateShort } from '../../utils/formatters.js';

export default function HomePage() {
  const navigate = useNavigate();
  const { selectedCity } = useLocationContext();
  const { allEvents } = useEvents();

  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadEditorial() {
      try {
        const feat = await blogService.getFeaturedArticle();
        const list = await blogService.getPublishedArticles({ limit: 3 });
        if (active) {
          setFeaturedArticle(feat);
          setArticles(list || []);
        }
      } catch (err) {
        console.error('Error loading home blog articles:', err);
      }
    }

    loadEditorial();

    return () => {
      active = false;
    };
  }, []);

  // 4 curated upcoming events
  const curatedUpcomingEvents = [...allEvents]
    .filter((e) => e.status === 'published' || !e.status)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 4);

  // 4-Step Organizer Process Data
  const organizerSteps = [
    { number: '01', title: 'ORGANIZE', description: 'Create your tournament or sporting event.', icon: Calendar },
    { number: '02', title: 'GET APPROVED', description: 'Submit your event for KnowASport verification.', icon: ShieldCheck },
    { number: '03', title: 'LIST YOUR EVENT', description: 'Once approved, your event becomes discoverable on KnowASport.', icon: Globe },
    { number: '04', title: 'GET PLAYERS', description: 'Reach athletes and participants looking for events.', icon: Users },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* ── 1. HERO SECTION ── */}
      <section className="relative overflow-hidden bg-navy-950 text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="kas-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 border border-navy-800 text-amber-400 text-xs font-700">
                <Sparkles size={14} className="text-amber-400" />
                <span>Tamil Nadu's Official Sports Discovery Hub</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-800 tracking-tight leading-[1.1] text-white">
                Find your next <span className="text-amber-400">game</span>.
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-400">
                Discover cricket leagues, football tournaments, badminton opens, and local turf matches across Tamil Nadu.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/events')}
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                  className="w-full sm:w-auto font-800 text-base"
                >
                  Explore Events
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/blog')}
                  icon={<BookOpen size={18} />}
                  className="w-full sm:w-auto border-navy-800 text-neutral-200 hover:bg-navy-900 text-base font-700"
                >
                  Read Sports News
                </Button>
              </div>
            </motion.div>

            {/* Right Search Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-5 bg-navy-900/90 border border-navy-800 rounded-[24px] p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-2">
                <span className="text-xs font-800 text-amber-400 uppercase tracking-widest block">Quick Search</span>
                <h3 className="text-xl font-800 text-white">Search Tournaments</h3>
              </div>

              <SearchBar size="lg" placeholder="Search sport, city, or event..." />

              <div className="pt-4 border-t border-navy-800/80 flex items-center justify-between text-xs text-neutral-400">
                <span>Popular:</span>
                <div className="flex flex-wrap gap-2">
                  {['Football', 'Cricket', 'Badminton', 'Kabaddi'].map((s) => (
                    <button
                      key={s}
                      onClick={() => navigate(`/events?sport=${s.toLowerCase()}`)}
                      className="px-2.5 py-1 rounded-[6px] bg-navy-950 border border-navy-800 text-neutral-300 hover:text-amber-400 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. UPCOMING NEAR YOU (CURATED EVENTS) ── */}
      <section className="kas-container space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Curated Discovery</span>
            <h2 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Upcoming Near You
            </h2>
          </div>

          <Link
            to="/events"
            className="text-xs font-800 text-amber-700 hover:text-amber-800 flex items-center gap-1.5"
          >
            View All Events <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {curatedUpcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* ── 3. WHAT'S HAPPENING IN SPORTS (COMPACT EDITORIAL SECTION) ── */}
      {articles.length > 0 && (
        <section className="bg-neutral-900 text-white py-12 lg:py-16">
          <div className="kas-container space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-800 text-amber-400 uppercase tracking-widest mb-1">
                  <Newspaper size={14} />
                  <span>KnowASport Editorial</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
                  What's Happening in Sports
                </h2>
              </div>

              <Link
                to="/blog"
                className="text-xs font-800 text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
              >
                Read All Sports Updates <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Featured Main Story */}
              {featuredArticle && (
                <div className="lg:col-span-7 bg-neutral-950 rounded-[20px] border border-neutral-800 overflow-hidden flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={featuredArticle.cover_image}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <span className="text-[10px] font-800 uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                        {featuredArticle.category}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-800 text-white tracking-tight leading-snug">
                        <Link to={`/blog/${featuredArticle.slug}`} className="hover:text-amber-400 transition-colors">
                          {featuredArticle.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {featuredArticle.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-800/80">
                    <span>{formatDateShort(featuredArticle.published_at)}</span>
                    <Link to={`/blog/${featuredArticle.slug}`} className="font-800 text-amber-400 hover:text-amber-300 flex items-center gap-1">
                      Read Story <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Smaller Secondary Articles */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {articles.filter((a) => a.id !== featuredArticle?.id).slice(0, 2).map((art) => (
                  <div
                    key={art.id}
                    className="bg-neutral-950 rounded-[16px] border border-neutral-800 p-5 space-y-3 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-800 uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                        {art.category}
                      </span>
                      <h4 className="font-800 text-white text-base leading-snug line-clamp-2">
                        <Link to={`/blog/${art.slug}`} className="hover:text-amber-400">
                          {art.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/80">
                      <span>{formatDateShort(art.published_at)}</span>
                      <Link to={`/blog/${art.slug}`} className="font-800 text-amber-400 flex items-center gap-1">
                        Read <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. EXPLORE SPORTS (COMPACT SPORTS DISCOVERY) ── */}
      <section className="kas-container space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Categories</span>
            <h2 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Explore Sports
            </h2>
          </div>

          <Link to="/events" className="text-xs font-800 text-amber-700 hover:text-amber-800 flex items-center gap-1">
            All Sports <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => navigate(`/events?sport=${sport.id}`)}
              className="p-4 rounded-[16px] bg-white border border-neutral-200 text-center space-y-2 hover:border-amber-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-[12px] bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors flex items-center justify-center mx-auto text-xl font-800">
                🏆
              </div>
              <span className="font-800 text-neutral-900 text-sm block">{sport.name}</span>
              <span className="text-[11px] text-neutral-500 block">Explore →</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 5. FOR ORGANIZERS (4-STEP ONBOARDING) ── */}
      <section className="kas-container">
        <div className="bg-white rounded-[24px] border border-neutral-200 p-8 lg:p-12 space-y-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Organizer Platform</span>
            <h2 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Host Your Tournament on KnowASport
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Get verified, list your tournament, accept online payments, and scan athlete QR codes at entry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {organizerSteps.map((step) => {
              const IconComp = step.icon;
              return (
                <div key={step.number} className="p-5 rounded-[16px] bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-800 text-amber-600 text-xs">{step.number}</span>
                    <IconComp size={18} className="text-neutral-500" />
                  </div>
                  <h3 className="font-800 text-neutral-900 text-sm uppercase tracking-wide">{step.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/organizer/register')}
              icon={<ArrowRight size={18} />}
              className="font-800"
            >
              Become an Organizer
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
