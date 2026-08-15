import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, MapPin, ArrowRight, Clock, Sparkles, ChevronRight, Layers,
  Calendar, ShieldCheck, Globe, Users, Newspaper, BookOpen,
  GraduationCap, School, Building2, Award, Goal, Shield, CheckCircle2
} from 'lucide-react';
import EventCard from '../../components/events/EventCard.jsx';
import Button from '../../components/common/Button.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import { useEvents } from '../../hooks/useEvents.js';
import { blogService } from '../../services/blogService.js';
import { useLocationContext } from '../../context/LocationContext.jsx';
import { SPORTS, EVENT_TYPES } from '../../utils/constants.js';
import { formatDateShort } from '../../utils/formatters.js';
import SEOHead from '../../components/common/SEOHead.jsx';

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

  // Event Types with custom icons for Section B
  const eventTypeCards = [
    { id: 'college', name: 'College Events', icon: GraduationCap, description: 'Inter-college meets', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { id: 'school', name: 'School Events', icon: School, description: 'Inter-school sports', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { id: 'open', name: 'Open Sports Events', icon: Globe, description: 'Open entry tournaments', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { id: 'club', name: 'Club Events', icon: Shield, description: 'Academy & club cups', color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { id: 'local', name: 'Local Events', icon: MapPin, description: 'Community town meets', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { id: 'turf', name: 'Turf Events', icon: Goal, description: 'Synthetic turf & futsal', color: 'text-teal-600 bg-teal-50 border-teal-100' },
    { id: 'championship', name: 'Tournaments', icon: Award, description: 'State & district cups', color: 'text-rose-600 bg-rose-50 border-rose-100' },
  ];

  // 4-Step Organizer Process Data
  const organizerSteps = [
    { number: '01', title: 'ORGANIZE', description: 'Create your tournament or sporting event.', icon: Calendar },
    { number: '02', title: 'GET APPROVED', description: 'Submit your event for KnowASport verification.', icon: ShieldCheck },
    { number: '03', title: 'LIST YOUR EVENT', description: 'Once approved, your event becomes discoverable on KnowASport.', icon: Globe },
    { number: '04', title: 'GET PLAYERS', description: 'Reach athletes and participants looking for events.', icon: Users },
  ];

  return (
    <div className="space-y-16 pb-16">
      <SEOHead
        title="KnowASport — Discover Sports Events Across Tamil Nadu"
        description="Find cricket leagues, football tournaments, badminton opens, and local turf matches across Tamil Nadu with KnowASport."
      />

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

      {/* ── 3. SECTION A: EXPLORE SPORTS ── */}
      <section className="kas-container space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Explore By Sport</span>
            <h2 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Browse Sports Disciplines
            </h2>
          </div>

          <Link to="/events" className="text-xs font-800 text-amber-700 hover:text-amber-800 flex items-center gap-1">
            All Sports <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {SPORTS.slice(0, 10).map((sport) => (
            <button
              key={sport.id}
              onClick={() => navigate(`/events?sport=${sport.id}`)}
              className="p-4 rounded-[16px] bg-white border border-neutral-200 text-center space-y-2 hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-[12px] bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors flex items-center justify-center mx-auto text-2xl">
                {sport.emoji || '🏆'}
              </div>
              <span className="font-800 text-neutral-900 text-sm block">{sport.name}</span>
              <span className="text-[11px] text-neutral-500 block group-hover:text-amber-600 font-600">Explore →</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. SECTION B: EXPLORE EVENT TYPES ── */}
      <section className="kas-container space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <span className="text-xs font-800 text-amber-600 uppercase tracking-widest block">Targeted Categories</span>
            <h2 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Explore Event Types
            </h2>
          </div>

          <Link to="/events" className="text-xs font-800 text-amber-700 hover:text-amber-800 flex items-center gap-1">
            All Types <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {eventTypeCards.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => navigate(`/events?eventType=${type.id}`)}
                className="p-4 rounded-[16px] bg-white border border-neutral-200 flex flex-col justify-between text-left space-y-3 hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${type.color}`}>
                  <IconComponent size={20} />
                </div>
                <div>
                  <h3 className="font-800 text-neutral-900 text-xs sm:text-sm leading-snug group-hover:text-amber-700 transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 5. WHAT'S HAPPENING IN SPORTS (EDITORIAL SECTION) ── */}
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

      {/* ── 6. ORGANIZER PLATFORM ENHANCED BOX ── */}
      <section className="kas-container">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white rounded-[24px] border border-navy-800 p-8 lg:p-12 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 border border-navy-800 text-amber-400 text-xs font-700">
              <Trophy size={14} className="text-amber-400" />
              <span>For Tournament Organizers</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-800 text-white tracking-tight">
              Have an Event? Bring it to <span className="text-amber-400">KnowASport</span>.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-400">
              Create your tournament, get verified by KnowASport, list events to athletes across Tamil Nadu, accept online payments, and scan athlete QR codes at venue entry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {organizerSteps.map((step) => {
              const IconComp = step.icon;
              return (
                <div
                  key={step.number}
                  className="p-5 rounded-[18px] bg-navy-900/80 border border-navy-800/80 space-y-3 hover:border-amber-500/40 transition-colors backdrop-blur-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-800 text-amber-400 text-xs tracking-wider">{step.number}</span>
                    <div className="w-8 h-8 rounded-[8px] bg-navy-950 border border-navy-800 flex items-center justify-center">
                      <IconComp size={16} className="text-amber-400" />
                    </div>
                  </div>
                  <h3 className="font-800 text-white text-sm uppercase tracking-wide">{step.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-400">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/organizer/register')}
              icon={<ArrowRight size={18} />}
              className="w-full sm:w-auto font-800 text-base"
            >
              Become an Organizer
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
