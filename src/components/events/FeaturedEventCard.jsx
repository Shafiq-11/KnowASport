import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight, ShieldCheck, Clock, Users } from 'lucide-react';
import { formatPrice, formatDateShort, getRegistrationDeadlineText } from '../../utils/formatters.js';
import { SPORTS } from '../../utils/constants.js';

export default function FeaturedEventCard({ event }) {
  const [imgError, setImgError] = useState(false);

  if (!event) return null;

  const sport = SPORTS.find(s => s.id === event.sport_id || s.slug === event.sport_slug);
  const deadlineText = getRegistrationDeadlineText(event.registration_deadline);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative bg-navy-900 rounded-[16px] overflow-hidden text-white shadow-xl border border-navy-800"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Image side */}
        <div className="lg:col-span-7 relative min-h-[240px] lg:min-h-[380px] bg-navy-950">
          {event.poster_url && !imgError ? (
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full h-full object-cover opacity-90"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-600 to-navy-900 flex items-center justify-center p-8">
              <span className="text-6xl">{sport?.emoji || '🏆'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-navy-900" />
          
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-navy-950 font-800 text-xs tracking-wider uppercase">
              Featured Tournament
            </span>
          </div>
        </div>

        {/* Info side */}
        <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-700 px-2.5 py-0.5 rounded-[6px] uppercase tracking-wide ${sport?.badgeClass || 'bg-amber-100 text-amber-900'}`}>
                {sport?.name || event.sport_name}
              </span>
              <span className="text-xs text-neutral-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-amber-400" /> Verified Organizer
              </span>
            </div>

            <h3 className="text-xl lg:text-2xl font-800 text-white mb-4 leading-tight">
              {event.title}
            </h3>

            <div className="space-y-2.5 text-sm text-neutral-300 mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-amber-400 flex-shrink-0" />
                <span>{formatDateShort(event.start_date)} – {formatDateShort(event.end_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-amber-400 flex-shrink-0" />
                <span className="truncate">{event.venue_name}, {event.city_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Clock size={14} className="text-red-400 flex-shrink-0" />
                <span>{deadlineText}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-navy-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-neutral-400 block">Registration Fee</span>
              <span className="text-2xl font-800 text-white">
                {event.entry_fee === 0 ? 'Free' : formatPrice(event.entry_fee)}
              </span>
            </div>

            <Link
              to={`/events/${event.slug}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-navy-950 font-800 text-sm transition-colors duration-150 shadow-md"
            >
              View & Register
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
