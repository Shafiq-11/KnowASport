import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Search } from 'lucide-react';
import EventCard from '../../components/events/EventCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { savedEventService } from '../../services/savedEventService.js';
import { eventService } from '../../services/eventService.js';
import { sectionRevealVariants, staggerItemVariants } from '../../utils/motion.js';

export default function SavedEventsPage() {
  const { user } = useAuth();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSaved() {
      if (!user) return;
      setLoading(true);

      try {
        const savedIds = await savedEventService.getSavedEventIds(user.id);
        if (savedIds && savedIds.length > 0) {
          const allRes = await eventService.getEvents({ limit: 50 });
          const filtered = (allRes.events || []).filter((e) => savedIds.includes(e.id));
          if (active) setSavedEvents(filtered);
        } else {
          if (active) setSavedEvents([]);
        }
      } catch (err) {
        console.error('Error loading saved events:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSaved();

    return () => {
      active = false;
    };
  }, [user]);

  const handleSaveToggle = async (eventId, isSaved) => {
    if (!user) return;
    if (!isSaved) {
      await savedEventService.unsaveEvent(user.id, eventId);
      setSavedEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  return (
    <div className="kas-container py-8 lg:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Heart size={22} className="text-red-500 fill-red-500" />
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
            Saved Events
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Your bookmarked tournaments and matches
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <SectionSkeleton count={3} />
      ) : savedEvents.length > 0 ? (
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {savedEvents.map((evt) => (
            <motion.div key={evt.id} variants={staggerItemVariants}>
              <EventCard
                event={evt}
                isSaved={true}
                onSaveToggle={handleSaveToggle}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="bg-white rounded-[12px] border border-neutral-200 p-8 shadow-xs">
          <EmptyState
            icon={Heart}
            title="No saved events yet"
            description="Explore tournaments across Tamil Nadu and click the heart icon to save your favorite events."
          />
        </div>
      )}
    </div>
  );
}
