import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import EventFilters from './EventFilters.jsx';
import Button from '../common/Button.jsx';
import { drawerVariants } from '../../utils/motion.js';

export default function FilterDrawer({
  isOpen,
  onClose,
  activeFiltersCount,
  clearAllFilters,
  ...filterProps
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-xs"
          />

          {/* Drawer Sheet */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[20px] max-h-[85vh] flex flex-col overflow-hidden lg:hidden shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-800 text-neutral-900 text-lg">Filter Events</h3>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-700 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <EventFilters
                {...filterProps}
                activeFiltersCount={activeFiltersCount}
                clearAllFilters={clearAllFilters}
              />
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center gap-3 flex-shrink-0">
              {activeFiltersCount > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={clearAllFilters}
                  className="flex-1"
                  icon={<RotateCcw size={14} />}
                >
                  Reset
                </Button>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
