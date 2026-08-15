import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Trophy, User, Users, ShieldCheck, Share2, Heart,
  ArrowRight, FileText, CheckCircle, Info, ChevronRight
} from 'lucide-react';
import EventCard from '../../components/events/EventCard.jsx';
import EventTimeline from '../../components/events/EventTimeline.jsx';
import OrganizerCard from '../../components/organizer/OrganizerCard.jsx';
import VerifiedBadge from '../../components/organizer/VerifiedBadge.jsx';
import Button from '../../components/common/Button.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { useEventDetail } from '../../hooks/useEvents.js';
import {
  formatPrice, formatDate, formatDateShort, formatTime,
  getRegistrationDeadlineText, getDeadlineUrgency
} from '../../utils/formatters.js';
import { SPORTS } from '../../utils/constants.js';
import SEOHead from '../../components/common/SEOHead.jsx';

export default function EventDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { event, relatedEvents, isOpen } = useEventDetail(slug);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  if (!event) {
    return <NotFoundPage />;
  }

  const sport = SPORTS.find((s) => s.id === event.sport_id || s.slug === event.sport_slug);
  const deadlineText = getRegistrationDeadlineText(event.registration_deadline);
  const urgency = getDeadlineUrgency(event.registration_deadline);
  const isFree = !event.entry_fee || event.entry_fee === 0;

  const handleRegisterClick = () => {
    navigate(`/events/${event.slug}/register`);
  };

  const pType = (event.participation_type || 'individual').toLowerCase();
  const teamSize = event.team_size || event.team_size_min;

  return (
    <div className="pb-24 lg:pb-16 space-y-8">
      <SEOHead
        title={`${event.title} | KnowASport`}
        description={`${event.title} — ${event.sport_name || 'Sports'} tournament in ${event.venue_name}, ${event.city_name}. Date: ${formatDate(event.start_date)}. View details and register on KnowASport.`}
        ogImage={event.poster_url}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: event.title,
          startDate: event.start_date,
          endDate: event.end_date || event.start_date,
          location: {
            '@type': 'Place',
            name: event.venue_name,
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.city_name,
              addressRegion: 'Tamil Nadu',
              addressCountry: 'IN',
            },
          },
          offers: {
            '@type': 'Offer',
            price: event.entry_fee || 0,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
          },
        }}
      />
      {/* ── Breadcrumb Header ── */}
      <div className="bg-white border-b border-neutral-200 py-3">
        <div className="kas-container flex items-center gap-2 text-xs font-500 text-neutral-500">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/events" className="hover:text-neutral-900 transition-colors">Events</Link>
          <ChevronRight size={12} />
          <span className="text-neutral-900 font-600 truncate">{event.title}</span>
        </div>
      </div>

      {/* ── Hero Banner Section ── */}
      <div className="kas-container">
        <div className="bg-white rounded-[16px] border border-neutral-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Event Poster Side */}
            <div className="lg:col-span-7 relative min-h-[260px] lg:min-h-[400px] bg-neutral-900 flex items-center justify-center overflow-hidden">
              {event.poster_url ? (
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy-950 to-navy-800 flex items-center justify-center p-8 text-white">
                  <span className="text-7xl">{sport?.emoji || '🏆'}</span>
                </div>
              )}

              {/* Save Button */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setSaved(!saved)}
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white transition-colors"
                  aria-label="Save event"
                >
                  <Heart size={18} className={saved ? 'fill-red-500 text-red-500' : 'text-neutral-600'} />
                </button>
              </div>
            </div>

            {/* Event Details Side */}
            <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-700 px-2.5 py-0.5 rounded-[6px] uppercase tracking-wide ${sport?.badgeClass || 'bg-amber-100 text-amber-900'}`}>
                    {sport?.name || event.sport_name}
                  </span>
                  <VerifiedBadge size="xs" />
                </div>

                <h1 className="text-2xl lg:text-3xl font-800 text-neutral-900 leading-tight">
                  {event.title}
                </h1>

                {/* Organizer Link */}
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <span>Organized by</span>
                  <span className="font-700 text-neutral-900">{event.organizer.organization_name}</span>
                </div>

                {/* Key Metadata */}
                <div className="space-y-3 pt-2 text-sm text-neutral-700 border-t border-neutral-100">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-700 text-neutral-900 block">
                        {formatDate(event.start_date)}
                        {event.end_date && event.end_date !== event.start_date && ` – ${formatDate(event.end_date)}`}
                      </span>
                      <span className="text-xs text-neutral-500">Event Dates</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-700 text-neutral-900 block">{event.venue_name}</span>
                      <span className="text-xs text-neutral-500">{event.venue_address || `${event.city_name}, ${event.district_name}`}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {pType === 'team' ? (
                      <Users size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <User size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-700 text-neutral-900 block uppercase">
                        {pType === 'team' ? `Team Event (${teamSize || 7} Players)` : 'Individual Event'}
                      </span>
                      <span className="text-xs text-neutral-500">Participation Format</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-700 text-neutral-900 block">{deadlineText}</span>
                      <span className="text-xs text-neutral-500">Registration Deadline</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Register Card */}
              <div className="pt-4 border-t border-neutral-100 bg-neutral-50/80 p-4 rounded-[12px] flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-600 text-neutral-500 block">Registration Fee</span>
                  <span className="text-2xl font-800 text-neutral-900">
                    {isFree ? <span className="text-green-600">Free</span> : formatPrice(event.entry_fee)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!isOpen}
                  onClick={handleRegisterClick}
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                >
                  {isOpen ? 'Register Now' : 'Registration Closed'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Tabs Navigation ── */}
      <div className="kas-container">
        <div className="flex border-b border-neutral-200 overflow-x-auto scrollbar-hidden gap-8">
          {[
            { id: 'about', label: 'About Event' },
            { id: 'schedule', label: 'Schedule & Timeline' },
            { id: 'rules', label: 'Rules & Format' },
            { id: 'prizes', label: 'Prizes & Rewards' },
            { id: 'organizer', label: 'Organizer Info' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 text-sm font-700 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content Sections ── */}
      <div className="kas-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Left Content Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ABOUT */}
            {activeTab === 'about' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white rounded-[12px] border border-neutral-200 p-6 space-y-4">
                  <h3 className="text-lg font-800 text-neutral-900">About the Tournament</h3>
                  <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </div>
                </div>

                {/* Quick Specs Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-[10px] border border-neutral-200">
                    <span className="text-xs text-neutral-400 block font-600 mb-1">Participation</span>
                    <span className="text-sm font-700 text-neutral-900 capitalize">
                      {pType === 'team' ? `Team (${teamSize || 7})` : pType}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-[10px] border border-neutral-200">
                    <span className="text-xs text-neutral-400 block font-600 mb-1">Age Limits</span>
                    <span className="text-sm font-700 text-neutral-900">{event.age_min} – {event.age_max} Yrs</span>
                  </div>
                  <div className="bg-white p-4 rounded-[10px] border border-neutral-200">
                    <span className="text-xs text-neutral-400 block font-600 mb-1">Category</span>
                    <span className="text-sm font-700 text-neutral-900 capitalize">{event.gender_restriction}</span>
                  </div>
                  <div className="bg-white p-4 rounded-[10px] border border-neutral-200">
                    <span className="text-xs text-neutral-400 block font-600 mb-1">Event Type</span>
                    <span className="text-sm font-700 text-neutral-900">{event.event_type_name || 'Open'}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCHEDULE */}
            {activeTab === 'schedule' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-[12px] border border-neutral-200 p-6 space-y-4">
                  <h3 className="text-lg font-800 text-neutral-900">Tournament Schedule</h3>
                  <EventTimeline schedule={event.schedule} />
                </div>
              </motion.div>
            )}

            {/* RULES */}
            {activeTab === 'rules' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-[12px] border border-neutral-200 p-6 space-y-4">
                  <h3 className="text-lg font-800 text-neutral-900">Competition Rules & Regulations</h3>
                  <ul className="space-y-3">
                    {event.rules?.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-neutral-700">
                        <CheckCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* PRIZES */}
            {activeTab === 'prizes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-[12px] border border-neutral-200 p-6 space-y-4">
                  <h3 className="text-lg font-800 text-neutral-900">Prizes & Honours</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {event.prizes?.map((prize, idx) => (
                      <div key={idx} className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-[12px] space-y-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-800 text-sm">
                          #{prize.position}
                        </div>
                        <h4 className="font-800 text-neutral-900 text-base">{prize.title}</h4>
                        <p className="text-xs text-amber-900 font-600">{prize.prize_description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ORGANIZER */}
            {activeTab === 'organizer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <OrganizerCard organizer={event.organizer} />
              </motion.div>
            )}
          </div>

          {/* Right Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Registration Box */}
            <div className="bg-white rounded-[12px] border border-neutral-200 p-5 space-y-4 shadow-sm">
              <h4 className="font-800 text-neutral-900 text-base">Tournament Summary</h4>
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span>Entry Fee</span>
                  <span className="font-700 text-neutral-900">{isFree ? 'Free' : formatPrice(event.entry_fee)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span>Registered Participants</span>
                  <span className="font-700 text-neutral-900">{event.current_participants} / {event.max_participants || 'Unlimited'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span>Format</span>
                  <span className="font-700 text-neutral-900 capitalize">{pType === 'team' ? `Team (${teamSize || 7})` : pType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span>Registration Status</span>
                  <span className={`font-700 ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={!isOpen}
                onClick={handleRegisterClick}
              >
                {isOpen ? 'Register Now' : 'Registration Closed'}
              </Button>
            </div>

            {/* Organizer Widget */}
            <OrganizerCard organizer={event.organizer} />
          </div>

        </div>
      </div>

      {/* ── Related Events Section ── */}
      {relatedEvents.length > 0 && (
        <div className="kas-container pt-8 border-t border-neutral-200">
          <div className="kas-section-header">
            <h2 className="kas-section-title">Similar Events You Might Like</h2>
            <p className="kas-section-subtitle">More tournaments in {event.sport_name} or {event.city_name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      )}

      {/* ── Sticky Mobile Bottom CTA Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 p-4 shadow-xl flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-neutral-400 block font-600">Entry Fee</span>
          <span className="text-xl font-800 text-neutral-900">
            {isFree ? <span className="text-green-600">Free</span> : formatPrice(event.entry_fee)}
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={!isOpen}
          onClick={handleRegisterClick}
          className="px-6"
        >
          {isOpen ? 'Register Now' : 'Closed'}
        </Button>
      </div>
    </div>
  );
}
