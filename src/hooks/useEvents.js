import { useState, useEffect, useMemo } from 'react';
import { eventService } from '../services/eventService.js';
import { isRegistrationOpen } from '../utils/formatters.js';

export function useEvents(initialFilters = {}) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.q || '');
  const [sportFilter, setSportFilter] = useState(initialFilters.sport || 'all');
  const [eventTypeFilter, setEventTypeFilter] = useState(initialFilters.eventType || 'all');
  const [cityFilter, setCityFilter] = useState(initialFilters.city || 'all');
  const [dateFilter, setDateFilter] = useState(initialFilters.date || 'all');
  const [priceFilter, setPriceFilter] = useState(initialFilters.price || 'all');
  const [participationFilter, setParticipationFilter] = useState(initialFilters.participation || 'all');
  const [genderFilter, setGenderFilter] = useState(initialFilters.gender || 'all');
  const [sortBy, setSortBy] = useState(initialFilters.sort || 'recommended');

  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events from eventService
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const res = await eventService.getEvents({
          sport: sportFilter,
          eventType: eventTypeFilter,
          city: cityFilter,
          price: priceFilter,
          participation: participationFilter,
          gender: genderFilter,
          date: dateFilter,
          search: searchQuery,
          sort: sortBy,
          limit: 30,
        });

        if (active) {
          setEvents(res.events || []);
          if (!allEvents.length) {
            // Also keep an unfiltered set for section highlights
            const allRes = await eventService.getEvents({ limit: 30 });
            setAllEvents(allRes.events || []);
          }
        }
      } catch (err) {
        if (active) {
          console.error('Error in useEvents hook:', err);
          setError("Couldn't load events. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [
    sportFilter, eventTypeFilter, cityFilter, priceFilter,
    participationFilter, genderFilter, dateFilter, searchQuery, sortBy
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (sportFilter !== 'all') count++;
    if (eventTypeFilter !== 'all') count++;
    if (cityFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    if (priceFilter !== 'all') count++;
    if (participationFilter !== 'all') count++;
    if (genderFilter !== 'all') count++;
    return count;
  }, [searchQuery, sportFilter, eventTypeFilter, cityFilter, dateFilter, priceFilter, participationFilter, genderFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSportFilter('all');
    setEventTypeFilter('all');
    setCityFilter('all');
    setDateFilter('all');
    setPriceFilter('all');
    setParticipationFilter('all');
    setGenderFilter('all');
    setSortBy('recommended');
  };

  return {
    events,
    allEvents: allEvents.length ? allEvents : events,
    loading,
    error,
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
  };
}

export function useEventDetail(slug) {
  const [data, setData] = useState({ event: null, relatedEvents: [], loading: true });

  useEffect(() => {
    let active = true;

    async function fetchDetail() {
      if (!slug) return;
      setData(prev => ({ ...prev, loading: true }));

      try {
        const res = await eventService.getEventBySlug(slug);
        if (active && res) {
          setData({
            event: res.event,
            relatedEvents: res.relatedEvents || [],
            loading: false,
          });
        }
      } catch (e) {
        if (active) setData(prev => ({ ...prev, loading: false }));
      }
    }

    fetchDetail();

    return () => {
      active = false;
    };
  }, [slug]);

  return {
    event: data.event,
    relatedEvents: data.relatedEvents,
    loading: data.loading,
    isOpen: data.event ? isRegistrationOpen(data.event) : false,
  };
}
