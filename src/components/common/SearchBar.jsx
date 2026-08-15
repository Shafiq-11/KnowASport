import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * KnowASport SearchBar
 * Used in Navbar and Events page header
 */
export default function SearchBar({
  placeholder = 'Search events, sports, cities…',
  initialValue = '',
  onSearch,
  size = 'md',       // sm | md | lg
  className = '',
  autoFocus = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const sizes = {
    sm: 'h-10 text-sm pl-9 pr-3',
    md: 'h-11 text-sm pl-10 pr-4',
    lg: 'h-13 text-base pl-12 pr-5',
  };

  const iconSizes = {
    sm: 15,
    md: 16,
    lg: 18,
  };

  const iconPositions = {
    sm: 'left-3',
    md: 'left-3.5',
    lg: 'left-4',
  };

  function handleSubmit(e) {
    e.preventDefault();
    const q = value.trim();
    if (onSearch) {
      onSearch(q);
    } else if (q) {
      navigate(`/events?q=${encodeURIComponent(q)}`);
    }
  }

  function handleClear() {
    setValue('');
    inputRef.current?.focus();
    onSearch?.('');
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      {/* Search icon */}
      <Search
        size={iconSizes[size] || 16}
        className={`absolute ${iconPositions[size] || 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150 ${
          focused ? 'text-amber-500' : 'text-neutral-400'
        }`}
      />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
          w-full bg-white border rounded-[10px] font-medium
          text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal
          transition-all duration-200 focus:outline-none
          ${sizes[size] || sizes.md}
          ${focused
            ? 'border-amber-400 ring-3 ring-amber-100 shadow-sm'
            : 'border-neutral-200 hover:border-neutral-300'
          }
        `}
      />

      {/* Clear button */}
      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            onClick={handleClear}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Clear search"
          >
            <X size={11} className="text-neutral-600" />
          </motion.button>
        )}
      </AnimatePresence>
    </form>
  );
}
