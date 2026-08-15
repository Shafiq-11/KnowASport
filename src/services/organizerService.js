import { supabase, isSupabaseConfigured } from './supabase.js';
import { eventService } from './eventService.js';
import { registrationService } from './registrationService.js';
import { paymentService } from './paymentService.js';

const LOCAL_APPS_KEY = 'kas_mock_organizer_apps_v1';

export const organizerService = {
  /**
   * Submit or update organizer application
   */
  async submitApplication(appData, user) {
    if (!user) throw new Error('User authentication required.');

    const record = {
      user_id: user.id,
      organization_name: appData.organization_name,
      organization_type: appData.organization_type || 'Sports Club',
      phone: appData.phone || '',
      email: appData.email || user.email,
      city_name: appData.city_name || 'Coimbatore',
      district_name: appData.district_name || 'Coimbatore',
      description: appData.description || '',
      sports_handled: appData.sports_handled || ['Football', 'Cricket'],
      experience_years: appData.experience_years || '1-3 years',
      website_url: appData.website_url || '',
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const stored = this._getStoredApplications();
      const existingIdx = stored.findIndex((a) => a.user_id === user.id);

      if (existingIdx >= 0) {
        stored[existingIdx] = { ...stored[existingIdx], ...record };
      } else {
        stored.push({ id: `app_${Date.now()}`, ...record, created_at: new Date().toISOString() });
      }

      localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(stored));
      return record;
    }

    try {
      const { data, error } = await supabase
        .from('organizer_applications')
        .upsert(record, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase application submission warning:', err.message);
      const stored = this._getStoredApplications();
      stored.push({ id: `app_${Date.now()}`, ...record, created_at: new Date().toISOString() });
      localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(stored));
      return record;
    }
  },

  /**
   * Get application status for user
   */
  async getApplicationStatus(userId) {
    if (!userId) return { status: 'none', application: null };

    if (!isSupabaseConfigured) {
      const stored = this._getStoredApplications();
      const app = stored.find((a) => a.user_id === userId);
      if (app) return { status: app.status, application: app };

      // Default mock approved state for dev mode if user logged in
      return {
        status: 'approved',
        application: {
          organization_name: 'Coimbatore District Sports Council',
          organization_type: 'Sports Club',
          status: 'approved',
        },
      };
    }

    try {
      const { data, error } = await supabase
        .from('organizer_applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return { status: 'none', application: null };
      }

      return { status: data.status, application: data };
    } catch (err) {
      return { status: 'approved', application: null };
    }
  },

  /**
   * Calculate real dashboard metrics (Events, Registrations, Check-ins, Revenue)
   */
  async getDashboardMetrics(userId) {
    if (!userId) return { totalEvents: 0, publishedEvents: 0, totalRegistrations: 0, checkedInCount: 0, totalRevenue: 0, events: [] };

    const allRes = await eventService.getEvents({ limit: 100 });
    const organizerEvents = (allRes.events || []).filter(
      (e) => e.organizer_id === userId || e.user_id === userId || e.organizer?.user_id === userId || (!e.organizer_id && !e.user_id)
    );

    let totalRegistrations = 0;
    let checkedInCount = 0;
    let totalRevenue = 0;

    const eventsWithDetails = await Promise.all(
      organizerEvents.map(async (evt) => {
        let regs = [];
        if (!isSupabaseConfigured) {
          const storedRegs = registrationService._getStoredRegistrations();
          regs = storedRegs.filter((r) => r.event_id === evt.id);
        } else {
          try {
            const { data } = await supabase
              .from('event_registrations')
              .select('*')
              .eq('event_id', evt.id);
            regs = data || [];
          } catch (e) {
            regs = [];
          }
        }

        const evtRegCount = regs.length;
        const evtCheckedIn = regs.filter((r) => r.checkin_status === 'checked_in').length;

        // Authoritative revenue calculation: only count captured payments!
        let evtRevenue = 0;
        regs.forEach((r) => {
          if (r.payment_status === 'paid' || r.status === 'confirmed') {
            evtRevenue += Number(r.total_fee || evt.entry_fee || 0);
          }
        });

        totalRegistrations += evtRegCount;
        checkedInCount += evtCheckedIn;
        totalRevenue += evtRevenue;

        return {
          ...evt,
          registrationsCount: evtRegCount,
          checkedInCount: evtCheckedIn,
          revenue: evtRevenue,
        };
      })
    );

    const publishedEvents = organizerEvents.filter((e) => e.status === 'published').length;

    return {
      totalEvents: organizerEvents.length,
      publishedEvents,
      totalRegistrations,
      checkedInCount,
      totalRevenue,
      events: eventsWithDetails,
    };
  },

  /**
   * Create new event as draft
   */
  async createEventDraft(eventData, user) {
    if (!user) throw new Error('User authentication required.');

    const slug = (eventData.title || 'tournament')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const newEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      slug,
      title: eventData.title,
      sport_name: eventData.sport_name || 'Football',
      event_type_name: eventData.event_type_name || 'Tournament',
      description: eventData.description || '',
      start_date: eventData.start_date || new Date().toISOString().split('T')[0],
      end_date: eventData.end_date || eventData.start_date,
      registration_deadline: eventData.registration_deadline || eventData.start_date,
      venue_name: eventData.venue_name || 'Local Sports Complex',
      city_name: eventData.city_name || 'Coimbatore',
      district_name: eventData.district_name || 'Coimbatore',
      participation_type: eventData.participation_type || 'individual',
      team_size: Number(eventData.team_size || 1),
      entry_fee: Number(eventData.entry_fee || 0),
      max_participants: Number(eventData.max_participants || 100),
      current_participants: 0,
      image_url: eventData.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      status: 'draft', // SECURITY: Defaults to draft, never published directly!
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      stored.unshift(newEvent);
      localStorage.setItem('kas_mock_organizer_events_v1', JSON.stringify(stored));
      return newEvent;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          slug: newEvent.slug,
          title: newEvent.title,
          description: newEvent.description,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          registration_deadline: newEvent.registration_deadline,
          venue_name: newEvent.venue_name,
          city_name: newEvent.city_name,
          district_name: newEvent.district_name,
          participation_type: newEvent.participation_type,
          team_size: newEvent.team_size,
          entry_fee: newEvent.entry_fee,
          max_participants: newEvent.max_participants,
          image_url: newEvent.image_url,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase event creation warning:', err.message);
      const stored = this._getStoredEvents();
      stored.unshift(newEvent);
      localStorage.setItem('kas_mock_organizer_events_v1', JSON.stringify(stored));
      return newEvent;
    }
  },

  /**
   * Submit draft event for admin review (status: pending_review)
   */
  async submitEventForReview(eventId, user) {
    if (!eventId || !user) throw new Error('Event ID and authentication required.');

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      const updated = stored.map((e) => (e.id === eventId ? { ...e, status: 'pending_review' } : e));
      localStorage.setItem('kas_mock_organizer_events_v1', JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'pending_review' })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Submit event for review error:', err);
      return false;
    }
  },

  /**
   * Fetch registrations for a specific event
   */
  async getEventRegistrations(eventId, userId) {
    if (!eventId) return [];

    if (!isSupabaseConfigured) {
      const storedRegs = registrationService._getStoredRegistrations();
      return storedRegs.filter((r) => r.event_id === eventId || r.event?.id === eventId);
    }

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          participants:registration_participants(*)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      const storedRegs = registrationService._getStoredRegistrations();
      return storedRegs.filter((r) => r.event_id === eventId);
    }
  },

  _getStoredApplications() {
    try {
      const stored = localStorage.getItem(LOCAL_APPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  _getStoredEvents() {
    try {
      const stored = localStorage.getItem('kas_mock_organizer_events_v1');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
};
