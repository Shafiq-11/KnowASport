import { supabase, isSupabaseConfigured } from './supabase.js';
import { MOCK_EVENTS } from '../data/mockEvents.js';
import { SPORTS, EVENT_TYPES, MAJOR_CITIES } from '../utils/constants.js';

/**
 * EventService — Data Access Layer for KnowASport Events
 * 
 * Handles querying events, sports, event types, and detail views from Supabase.
 * Includes a seamless fallback to the local seed dataset when Supabase environment variables are not yet set up.
 */

export const eventService = {
  /**
   * Fetch paginated events with search, multi-criteria filtering, and sorting
   */
  async getEvents({
    sport = 'all',
    eventType = 'all',
    city = 'all',
    price = 'all',
    participation = 'all',
    gender = 'all',
    date = 'all',
    search = '',
    sort = 'recommended',
    page = 1,
    limit = 12,
  } = {}) {
    if (!isSupabaseConfigured) {
      // Local Fallback Filter Logic
      return this._getMockEventsFiltered({
        sport, eventType, city, price, participation, gender, date, search, sort, page, limit
      });
    }

    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:organizers(*),
          sport:sports(*),
          event_type:event_types(*)
        `, { count: 'exact' })
        .eq('status', 'published');

      // 1. Search Query
      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`title.ilike.%${q}%,venue_name.ilike.%${q}%,city_name.ilike.%${q}%`);
      }

      // 2. Sport Filter
      if (sport && sport !== 'all') {
        query = query.eq('sport_slug', sport);
      }

      // 3. Event Type Filter
      if (eventType && eventType !== 'all') {
        query = query.eq('event_type_slug', eventType);
      }

      // 4. City Filter
      if (city && city !== 'all') {
        query = query.ilike('city_name', city);
      }

      // 5. Price Filter
      if (price === 'free') {
        query = query.eq('entry_fee', 0);
      } else if (price === 'paid') {
        query = query.gt('entry_fee', 0);
      } else if (price === 'under_250') {
        query = query.lt('entry_fee', 250);
      } else if (price === '250_500') {
        query = query.gte('entry_fee', 250).lte('entry_fee', 500);
      } else if (price === '500_1000') {
        query = query.gte('entry_fee', 500).lte('entry_fee', 1000);
      } else if (price === 'above_1000') {
        query = query.gt('entry_fee', 1000);
      }

      // 6. Participation Filter
      if (participation && participation !== 'all') {
        query = query.or(`participation_type.eq.${participation},participation_type.eq.both`);
      }

      // 7. Gender Filter
      if (gender && gender !== 'all') {
        query = query.or(`gender_category.eq.${gender},gender_category.eq.all`);
      }

      // 8. Sorting
      if (sort === 'upcoming') {
        query = query.order('start_date', { ascending: true });
      } else if (sort === 'registration_closing') {
        query = query.order('registration_deadline', { ascending: true });
      } else if (sort === 'price_low') {
        query = query.order('entry_fee', { ascending: true });
      } else if (sort === 'price_high') {
        query = query.order('entry_fee', { ascending: false });
      } else if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        // Recommended default: featured first, then start date
        query = query.order('is_featured', { ascending: false }).order('start_date', { ascending: true });
      }

      // 9. Pagination Range
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        events: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (err) {
      console.warn('Supabase events query failed, using fallback dataset:', err.message);
      return this._getMockEventsFiltered({
        sport, eventType, city, price, participation, gender, date, search, sort, page, limit
      });
    }
  },

  /**
   * Fetch single event details by unique slug along with rules, prizes, schedule, and related events
   */
  async getEventBySlug(slug) {
    if (!isSupabaseConfigured) {
      const found = MOCK_EVENTS.find((e) => e.slug === slug);
      if (!found) return null;

      const related = MOCK_EVENTS.filter(
        (e) => e.id !== found.id && (e.sport_slug === found.sport_slug || e.city_name === found.city_name)
      ).slice(0, 3);

      return { event: found, relatedEvents: related };
    }

    try {
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:organizers(*),
          rules:event_rules(*),
          prizes:event_prizes(*),
          schedule:event_schedule(*)
        `)
        .eq('slug', slug)
        .single();

      if (error || !event) throw error || new Error('Event not found');

      // Fetch related events (same sport or city)
      const { data: related } = await supabase
        .from('events')
        .select('*, organizer:organizers(*)')
        .eq('status', 'published')
        .neq('id', event.id)
        .or(`sport_id.eq.${event.sport_id},city_name.eq.${event.city_name}`)
        .limit(3);

      return {
        event,
        relatedEvents: related || [],
      };
    } catch (err) {
      console.warn('Supabase event details fetch failed, trying local fallback:', err.message);
      const found = MOCK_EVENTS.find((e) => e.slug === slug);
      if (!found) return null;

      const related = MOCK_EVENTS.filter(
        (e) => e.id !== found.id && (e.sport_slug === found.sport_slug || e.city_name === found.city_name)
      ).slice(0, 3);

      return { event: found, relatedEvents: related };
    }
  },

  /**
   * Internal Mock Filtering Helper for Dev Fallback
   */
  _getMockEventsFiltered({
    sport, eventType, city, price, participation, gender, date, search, sort, page, limit
  }) {
    let list = [...MOCK_EVENTS];

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.city_name.toLowerCase().includes(q) ||
          e.venue_name.toLowerCase().includes(q) ||
          e.sport_name.toLowerCase().includes(q)
      );
    }

    if (sport && sport !== 'all') {
      list = list.filter((e) => e.sport_slug === sport || e.sport_id === sport);
    }

    if (eventType && eventType !== 'all') {
      list = list.filter((e) => e.event_type_slug === eventType);
    }

    if (city && city !== 'all') {
      list = list.filter(
        (e) => e.city_name.toLowerCase() === city.toLowerCase() || e.district_name.toLowerCase() === city.toLowerCase()
      );
    }

    if (price && price !== 'all') {
      const fee = e => e.entry_fee || 0;
      if (price === 'free') list = list.filter((e) => fee(e) === 0);
      else if (price === 'paid') list = list.filter((e) => fee(e) > 0);
      else if (price === 'under_250') list = list.filter((e) => fee(e) < 250);
      else if (price === '250_500') list = list.filter((e) => fee(e) >= 250 && fee(e) <= 500);
      else if (price === '500_1000') list = list.filter((e) => fee(e) >= 500 && fee(e) <= 1000);
      else if (price === 'above_1000') list = list.filter((e) => fee(e) > 1000);
    }

    if (participation && participation !== 'all') {
      list = list.filter(
        (e) => e.participation_type === 'both' || e.participation_type === participation
      );
    }

    if (gender && gender !== 'all') {
      list = list.filter((e) => e.gender_restriction === 'all' || e.gender_restriction === gender);
    }

    // Sort
    if (sort === 'upcoming') {
      list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    } else if (sort === 'registration_closing') {
      list.sort((a, b) => new Date(a.registration_deadline) - new Date(b.registration_deadline));
    } else if (sort === 'price_low') {
      list.sort((a, b) => (a.entry_fee || 0) - (b.entry_fee || 0));
    } else if (sort === 'price_high') {
      list.sort((a, b) => (b.entry_fee || 0) - (a.entry_fee || 0));
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      events: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
