import { motion } from 'framer-motion';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LocationCard({ city }) {
  if (!city) return null;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
    >
      <Link
        to={`/events?city=${encodeURIComponent(city.name.toLowerCase())}`}
        className="group block bg-white rounded-[12px] border border-neutral-200 p-4 hover:border-amber-400 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center font-700 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
              <MapPin size={18} />
            </div>
            <div>
              <h4 className="font-700 text-neutral-900 text-sm group-hover:text-amber-700 transition-colors">
                {city.name}
              </h4>
              <span className="text-xs text-neutral-400">
                {city.district} District
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
            <ArrowUpRight size={16} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
