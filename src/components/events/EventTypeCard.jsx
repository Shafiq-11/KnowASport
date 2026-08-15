import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Trophy, Shield, Goal, GraduationCap, School, Flag, Globe, Award, Medal, ArrowUpRight
} from 'lucide-react';
import { EVENT_TYPES } from '../../utils/constants.js';

const ICON_MAP = {
  MapPin,
  Trophy,
  Shield,
  Goal,
  GraduationCap,
  School,
  Flag,
  Globe,
  Award,
  Medal,
};

export default function EventTypeCard({ eventType, onClick }) {
  if (!eventType) return null;

  const typeData = EVENT_TYPES.find(t => t.id === eventType.id || t.slug === eventType.slug) || eventType;
  const IconComponent = ICON_MAP[typeData.icon] || Trophy;

  const href = `/events?eventType=${typeData.slug}`;

  const content = (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="group relative flex flex-col justify-between p-4 rounded-[12px] bg-white border border-neutral-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 h-full cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-[10px] bg-navy-950 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-navy-950 transition-colors duration-200">
          <IconComponent size={20} />
        </div>

        <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
          <ArrowUpRight size={14} />
        </div>
      </div>

      <div>
        <h4 className="font-700 text-neutral-900 text-sm group-hover:text-amber-700 transition-colors mb-1">
          {typeData.name}
        </h4>
        {typeData.description && (
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {typeData.description}
          </p>
        )}
      </div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={() => onClick(typeData)} className="w-full text-left focus:outline-none">
        {content}
      </button>
    );
  }

  return (
    <Link to={href} className="block h-full focus:outline-none">
      {content}
    </Link>
  );
}
