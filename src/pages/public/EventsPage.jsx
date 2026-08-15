import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, RotateCcw, X, SlidersHorizontal, Search } from 'lucide-react';
import EventCard from '../../components/events/EventCard.jsx';
import EventFilters from '../../components/events/EventFilters.jsx';
import FilterDrawer from '../../components/events/FilterDrawer.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useEvents } from '../../hooks/useEvents.js';
import { SORT_OPTIONS, SPORTS, EVENT_TYPES, MAJOR_CITIES, PRICE_FILTERS } from '../../utils/constants.js';
import { sectionRevealVariants, staggerItemVariants } from '../../utils/motion.js';

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize hook with URL params if present
  const initialFromUrl = {
    q: searchParams.get('q') || '',
    sport: searchParams.get('sport') || 'all',
    eventType: searchParams.get('eventType') || 'all',
    city: searchParams.get('city') || 'all',
    date: searchParams.get('date') || 'all',
    price: searchParams.get('price') || 'all',
    participation: searchParams.get('participation') || 'all',
    sort: searchParams.get('sort') || 'recommended',
  };

  const {
    events,
    searchQuery,
    setSearchQuery,
    sportFilter,
    setSportFilter,
    eventTypeFilter,
    setEventTypeFilter,
    cityFilter,
    setCityFilter,
    dateFilter,
    setDateFilter,
    priceFilter,
    setPriceFilter,
    participationFilter,
    setParticipationFilter,
    genderFilter,
    setGenderFilter,
    sortBy,
    setSortBy,
    activeFiltersCount,
    clearAllFilters,
  } = useEvents(initialFromUrl);

  // Simulate fast loading skeleton on filter changes
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, [sportFilter, eventTypeFilter, cityFilter, dateFilter, priceFilter, participationFilter, searchQuery, sortBy]);

  // Synchronize URL search params with filter changes
  useEffect(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (sportFilter !== 'all') params.sport = sportFilter;
    if (eventTypeFilter !== 'all') params.eventType = eventTypeFilter;
    if (cityFilter !== 'all') params.city = cityFilter;
    if (dateFilter !== 'all') params.date = dateFilter;
    if (priceFilter !== 'all') params.price = priceFilter;
    if (participationFilter !== 'all') params.participation = participationFilter;
    if (sortBy !== 'recommended') params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [searchQuery, sportFilter, eventTypeFilter, cityFilter, dateFilter, priceFilter, participationFilter, sortBy, setSearchParams]);

  const activeSportObj = SPORTS.find((s) => s.slug === sportFilter || s.id === sportFilter);
  const activeTypeObj = EVENT_TYPES.find((et) => et.slug === eventTypeFilter || et.id === eventTypeFilter);
  const activePriceObj = PRICE_FILTERS.find((pf) => pf.value === priceFilter);

  // Contextual heading title
  const getContextualTitle = () => {
    if (activeSportObj && activeTypeObj) {
      return `${activeSportObj.name} · ${activeTypeObj.name}`;
    }
    if (activeSportObj) {
      return `${activeSportObj.name} Events`;
    }
    if (activeTypeObj) {
      return `${activeTypeObj.name}s`;
    }
    if (cityFilter !== 'all') {
      return `Sports Events in ${cityFilter}`;
    }
    return 'Discover Sports Events';
  };

  return (
    <div className="kas-container py-8 lg:py-12 space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight capitalize">
            {getContextualTitle()}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Browse and register for sports tournaments happening across Tamil Nadu
          </p>
        </div>

        {/* Search Bar on Page Header */}
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onSearch={(val) => setSearchQuery(val)}
            placeholder="Search sport, city, venue..."
            size="md"
          />
        </div>
      </div>

      {/* ── Top Bar: Active Chips & Mobile Filter Button ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Active Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-neutral-900 text-white font-700 shadow-xs"
          >
            <SlidersHorizontal size={14} />
            <span>Filters ({activeFiltersCount})</span>
          </button>

          {activeFiltersCount > 0 && (
            <>
              {sportFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-[6px] font-600">
                  Sport: {activeSportObj?.name || sportFilter}
                  <X size={12} className="cursor-pointer hover:text-amber-700" onClick={() => setSportFilter('all')} />
                </span>
              )}

              {eventTypeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-navy-900 text-amber-400 border border-navy-800 px-2.5 py-1 rounded-[6px] font-600">
                  Type: {activeTypeObj?.name || eventTypeFilter}
                  <X size={12} className="cursor-pointer hover:text-white" onClick={() => setEventTypeFilter('all')} />
                </span>
              )}

              {cityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-[6px] font-600">
                  City: {cityFilter}
                  <X size={12} className="cursor-pointer hover:text-amber-700" onClick={() => setCityFilter('all')} />
                </span>
              )}

              {priceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-[6px] font-600">
                  Price: {activePriceObj?.label || priceFilter}
                  <X size={12} className="cursor-pointer hover:text-amber-700" onClick={() => setPriceFilter('all')} />
                </span>
              )}

              {participationFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-[6px] font-600 capitalize">
                  Format: {participationFilter}
                  <X size={12} className="cursor-pointer hover:text-amber-700" onClick={() => setParticipationFilter('all')} />
                </span>
              )}

              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-[6px] font-600 capitalize">
                  Date: {dateFilter.replace('_', ' ')}
                  <X size={12} className="cursor-pointer hover:text-amber-700" onClick={() => setDateFilter('all')} />
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-amber-700 hover:text-amber-800 font-700 underline pl-1"
              >
                Clear all
              </button>
            </>
          )}
        </div>

        {/* Sort & Count Dropdown */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
          <span className="text-xs font-600 text-neutral-500 whitespace-nowrap">
            {events.length} {events.length === 1 ? 'event' : 'events'} found
          </span>

          <div className="flex items-center gap-2">
            <label className="text-xs font-600 text-neutral-500 hidden sm:inline">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-neutral-200 rounded-[8px] px-3 py-1.5 text-xs font-600 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Layout Grid: Desktop Sidebar + Results ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-3">
          <EventFilters
            sportFilter={sportFilter}
            setSportFilter={setSportFilter}
            eventTypeFilter={eventTypeFilter}
            setEventTypeFilter={setEventTypeFilter}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            participationFilter={participationFilter}
            setParticipationFilter={setParticipationFilter}
            genderFilter={genderFilter}
            setGenderFilter={setGenderFilter}
            activeFiltersCount={activeFiltersCount}
            clearAllFilters={clearAllFilters}
          />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-9">
          {isLoading ? (
            <SectionSkeleton count={6} />
          ) : events.length > 0 ? (
            <motion.div
              variants={sectionRevealVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {events.map((evt) => (
                <motion.div key={evt.id} variants={staggerItemVariants}>
                  <EventCard event={evt} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="bg-white rounded-[12px] border border-neutral-200 p-8 shadow-xs">
              <EmptyState
                icon={Search}
                title="No events found"
                description="Try changing your filters or exploring another location."
                action={clearAllFilters}
                actionLabel="Clear All Filters"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        sportFilter={sportFilter}
        setSportFilter={setSportFilter}
        eventTypeFilter={eventTypeFilter}
        setEventTypeFilter={setEventTypeFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        priceFilter={priceFilter}
        setPriceFilter={setPriceFilter}
        participationFilter={participationFilter}
        setParticipationFilter={setParticipationFilter}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        activeFiltersCount={activeFiltersCount}
        clearAllFilters={clearAllFilters}
      />
    </div>
  );
}
