import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SPORTS } from '../../utils/constants.js';

/**
 * SportCard
 * Visual sport category card for the home page grid
 */
export default function SportCard({ sport, onClick }) {
  if (!sport) return null;

  const sportData = SPORTS.find(s => s.id === sport.id || s.slug === sport.slug) || sport;

  // Each sport has a distinct visual card color
  const cardColors = {
    cricket:     { bg: 'bg-green-50', border: 'border-green-100', hover: 'hover:bg-green-100', text: 'text-green-800', accent: 'bg-green-600' },
    football:    { bg: 'bg-blue-50',  border: 'border-blue-100',  hover: 'hover:bg-blue-100',  text: 'text-blue-800',  accent: 'bg-blue-600' },
    badminton:   { bg: 'bg-violet-50',border: 'border-violet-100',hover: 'hover:bg-violet-100',text: 'text-violet-800',accent: 'bg-violet-600' },
    volleyball:  { bg: 'bg-orange-50',border: 'border-orange-100',hover: 'hover:bg-orange-100',text: 'text-orange-800',accent: 'bg-orange-500' },
    basketball:  { bg: 'bg-red-50',   border: 'border-red-100',   hover: 'hover:bg-red-100',   text: 'text-red-800',   accent: 'bg-red-600' },
    athletics:   { bg: 'bg-cyan-50',  border: 'border-cyan-100',  hover: 'hover:bg-cyan-100',  text: 'text-cyan-800',  accent: 'bg-cyan-600' },
    kabaddi:     { bg: 'bg-amber-50', border: 'border-amber-100', hover: 'hover:bg-amber-100', text: 'text-amber-800', accent: 'bg-amber-600' },
    chess:       { bg: 'bg-neutral-50',border:'border-neutral-200',hover:'hover:bg-neutral-100',text: 'text-neutral-800',accent:'bg-neutral-700'},
    tennis:      { bg: 'bg-emerald-50',border:'border-emerald-100',hover:'hover:bg-emerald-100',text:'text-emerald-800',accent:'bg-emerald-600'},
    tabletennis: { bg: 'bg-rose-50',  border: 'border-rose-100',  hover: 'hover:bg-rose-100',  text: 'text-rose-800',  accent: 'bg-rose-600' },
  };

  const colors = cardColors[sportData.id] || cardColors.chess;
  const href = `/events?sport=${sportData.slug}`;

  const content = (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`
        relative flex flex-col items-center justify-center gap-3
        ${colors.bg} ${colors.border} ${colors.hover}
        border rounded-[12px] p-5 cursor-pointer
        transition-colors duration-200
        focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
        group
      `}
    >
      <span className="text-3xl" role="img" aria-label={sportData.name}>
        {sportData.emoji}
      </span>
      <span className={`text-[13px] font-700 ${colors.text} text-center leading-tight`}>
        {sportData.name}
      </span>
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={() => onClick(sportData)} className="w-full focus:outline-none">
        {content}
      </button>
    );
  }

  return (
    <Link to={href} className="focus:outline-none block">
      {content}
    </Link>
  );
}
