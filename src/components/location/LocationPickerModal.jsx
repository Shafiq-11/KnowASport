import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, Check } from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext.jsx';
import Button from '../common/Button.jsx';
import { MAJOR_CITIES } from '../../utils/constants.js';

export default function LocationPickerModal({ isOpen, onClose }) {
  const { selectedCity, setCity, clearCity, detectLocation, geoState } = useLocationContext();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCities = MAJOR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (cityName) => {
    setCity(cityName);
    onClose();
  };

  const handleSelectAll = () => {
    clearCity();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="font-800 text-neutral-900 text-base">Select Your City</h3>
                <p className="text-xs text-neutral-500">Discover events happening near you</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Auto Detect CTA */}
          <div className="p-4 bg-amber-50/60 border-b border-amber-100/50">
            <button
              onClick={detectLocation}
              disabled={geoState.loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[8px] bg-white border border-amber-200 text-amber-800 font-700 text-sm hover:bg-amber-100/40 transition-colors shadow-xs"
            >
              <Navigation size={16} className={geoState.loading ? 'animate-spin' : ''} />
              <span>{geoState.loading ? 'Detecting Location...' : 'Use My Current Location'}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-neutral-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city or district..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Cities List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <button
              onClick={handleSelectAll}
              className={`w-full flex items-center justify-between p-3 rounded-[8px] text-sm font-600 transition-colors ${
                !selectedCity ? 'bg-amber-500 text-white' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>All Tamil Nadu</span>
              {!selectedCity && <Check size={16} />}
            </button>

            {filteredCities.map((c) => {
              const isSelected = selectedCity?.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  onClick={() => handleSelect(c.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-[8px] text-sm font-600 transition-colors ${
                    isSelected ? 'bg-amber-500 text-white' : 'text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{c.name}</span>
                    <span className={`text-xs ${isSelected ? 'text-amber-100' : 'text-neutral-400'}`}>
                      ({c.district} District)
                    </span>
                  </div>
                  {isSelected && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
