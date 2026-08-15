import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Heart, ArrowRight, User, Users, Clock } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import {
  formatPrice,
  formatDateShort,
  getRegistrationDeadlineText,
  getDeadlineUrgency,
} from '../../utils/formatters.js';
import { SPORTS } from '../../utils/constants.js';

/**
 * KnowASport EventCard
 *
 * The signature event discovery card.
 * Shows: image, sport badge, title, date, location, participation format, fee, deadline.
 */
export default function EventCard({ event, onSaveToggle, isSaved = false }) {
  const [saved, setSaved] = useState(isSaved);
  const [imgError, setImgError] = useState(false);

  if (!event) return null;

  const sport = SPORTS.find(s => s.id === event.sport_id || s.slug === event.sport_slug);
  const deadlineText = getRegistrationDeadlineText(event.registration_deadline);
  const urgency = getDeadlineUrgency(event.registration_deadline);
  const isFree = !event.entry_fee || event.entry_fee === 0;
  const registrationClosed = urgency === 'closed';

  const urgencyStyles = {
    critical: 'text-red-600 bg-red-50',
    urgent:   'text-amber-700 bg-amber-50',
    normal:   'text-neutral-500 bg-neutral-50',
    closed:   'text-neutral-400 bg-neutral-50',
  };

  function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    onSaveToggle?.(event.id, next);
  }

  // Format participation type label
  const renderParticipationLabel = () => {
    const pType = (event.participation_type || 'individual').toLowerCase();
    const teamSize = event.team_size || event.team_size_min;

    if (pType === 'team') {
      return (
        <div className="flex items-center gap-1 text-[12px] font-700 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px]">
          <Users size={13} className="text-amber-600 flex-shrink-0" />
          <span>TEAM {teamSize ? `(${teamSize} Players)` : ''}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-[12px] font-700 text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-[4px]">
        <User size={13} className="text-neutral-500 flex-shrink-0" />
        <span>INDIVIDUAL</span>
      </div>
    );
  };

  // Fallback gradient for missing images
  const fallbackGradients = [
    'from-blue-900 to-blue-700',
    'from-green-900 to-green-700',
    'from-violet-900 to-violet-700',
    'from-orange-900 to-orange-700',
    'from-cyan-900 to-cyan-700',
    'from-rose-900 to-rose-700',
  ];
  const gradientIndex = event.id ? event.id.charCodeAt(0) % fallbackGradients.length : 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link
        to={`/events/${event.slug}`}
        className="group flex flex-col bg-white rounded-[12px] border border-neutral-100 overflow-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        style={{ boxShadow: 'var(--shadow-card)' }}
        aria-label={`${event.title} — ${formatDateShort(event.start_date)} in ${event.city_name}`}
      >
        {/* ── Image ── */}
        <div className="relative overflow-hidden aspect-[16/9] bg-neutral-100 flex-shrink-0">
          {event.poster_url && !imgError ? (
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${fallbackGradients[gradientIndex]} flex items-center justify-center`}
            >
              <span className="text-5xl opacity-80" role="img" aria-label={sport?.name}>
                {sport?.emoji || '🏆'}
              </span>
            </div>
          )}

          {/* Save button */}
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.85 }}
            transition={{ duration: 0.1 }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={saved ? 'Remove from saved' : 'Save event'}
            type="button"
          >
            <motion.div
              animate={{ scale: saved ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                size={15}
                className={saved ? 'fill-red-500 text-red-500' : 'text-neutral-500'}
              />
            </motion.div>
          </motion.button>

          {/* Featured badge */}
          {event.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-amber-500 text-white text-[11px] font-700">
                ★ Featured
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col gap-2.5 p-4 flex-1">
          {/* Top badges: Sport + Participation */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {sport && (
              <span className={`text-[11px] font-700 px-2 py-0.5 rounded-[6px] uppercase tracking-wide ${sport.badgeClass}`}>
                {sport.name}
              </span>
            )}
            {renderParticipationLabel()}
          </div>

          {/* Title */}
          <h3 className="font-700 text-neutral-900 text-[15px] leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors duration-150">
            {event.title}
          </h3>

          {/* Date + Location */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-neutral-500 text-[13px]">
              <Calendar size={13} className="flex-shrink-0 text-neutral-400" />
              <span>{formatDateShort(event.start_date)}</span>
              {event.end_date && event.end_date !== event.start_date && (
                <span>– {formatDateShort(event.end_date)}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500 text-[13px]">
              <MapPin size={13} className="flex-shrink-0 text-neutral-400" />
              <span className="line-clamp-1">
                {event.venue_name ? `${event.venue_name}, ` : ''}{event.city_name}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-100 pt-2.5 mt-auto">
            <div className="flex items-center justify-between gap-2">
              {/* Fee */}
              <div className="flex flex-col">
                <span className="text-[15px] font-800 text-neutral-900">
                  {isFree ? (
                    <span className="text-green-600 font-700">Free</span>
                  ) : (
                    formatPrice(event.entry_fee)
                  )}
                </span>
                {!isFree && (
                  <span className="text-[11px] text-neutral-400">entry fee</span>
                )}
              </div>

              {/* Deadline pill */}
              <div className={`flex items-center gap-1 text-[11px] font-600 px-2 py-1 rounded-[6px] ${urgencyStyles[urgency]}`}>
                <Clock size={10} />
                <span className="whitespace-nowrap">
                  {registrationClosed ? 'Closed' : deadlineText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer: View Event → ── */}
        <div className="px-4 pb-3.5 -mt-1">
          <div className="flex items-center justify-between text-[13px]">
            {event.current_participants != null && (
              <div className="flex items-center gap-1 text-neutral-400">
                <Users size={12} />
                <span>
                  {event.current_participants} registered
                  {event.max_participants ? ` / ${event.max_participants}` : ''}
                </span>
              </div>
            )}
            <span className="ml-auto flex items-center gap-1 text-amber-600 font-600 group-hover:gap-2 transition-all duration-200">
              View Event <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
