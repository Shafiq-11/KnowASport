import { supabase, isSupabaseConfigured } from './supabase.js';
import { eventService } from './eventService.js';
import { registrationService } from './registrationService.js';
import { paymentService } from './paymentService.js';
import { MOCK_EVENTS, MOCK_ORGANIZERS } from '../data/mockEvents.js';

const LOCAL_APPS_KEY = 'kas_mock_organizer_apps_v1';
const LOCAL_ORGANIZER_EVENTS_KEY = 'kas_mock_organizer_events_v2';
const LOCAL_ORGANIZER_PROFILES_KEY = 'kas_mock_organizer_profiles_v1';
const LOCAL_PREFERENCES_KEY = 'kas_mock_organizer_prefs_v1';

// Standard KnowASport platform fee: 4% (0% on free events)
const PLATFORM_FEE_RATE = 0.04;

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
      // KYC Verification Data
      aadhaar_number: appData.aadhaar_number || '',
      aadhaar_holder_name: appData.aadhaar_holder_name || '',
      aadhaar_doc_url: appData.aadhaar_doc_url || '',
      live_photo_url: appData.live_photo_url || '',
      is_phone_verified: appData.is_phone_verified !== false,
      is_live_photo_verified: Boolean(appData.live_photo_url),
      is_aadhaar_verified: Boolean(appData.aadhaar_number),
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
   * Get Organizer Profile Details
   */
  async getOrganizerProfile(userId) {
    if (!userId) return null;

    if (!isSupabaseConfigured) {
      const storedProfiles = this._getStoredProfiles();
      if (storedProfiles[userId]) return storedProfiles[userId];

      // Default mock organizer profile
      const defaultProfile = {
        organization_name: 'Coimbatore District Badminton Association',
        organization_type: 'association',
        city_name: 'Coimbatore',
        district_name: 'Coimbatore',
        phone: '+91 98422 12345',
        email: 'contact@cdba.in',
        website_url: 'https://cdba.in',
        description: 'Official governing body for badminton tournaments in Coimbatore district since 1998.',
        verification_status: 'verified',
      };
      return defaultProfile;
    }

    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return {
          organization_name: '',
          organization_type: 'club',
          city_name: 'Coimbatore',
          district_name: 'Coimbatore',
          phone: '',
          email: '',
          website_url: '',
          description: '',
          verification_status: 'pending',
        };
      }

      return data;
    } catch (err) {
      return null;
    }
  },

  /**
   * Update Organizer Profile Details
   */
  async updateOrganizerProfile(userId, profileData) {
    if (!userId) throw new Error('User authentication required.');

    const cleanData = {
      organization_name: profileData.organization_name,
      organization_type: profileData.organization_type || 'club',
      city_name: profileData.city_name || 'Coimbatore',
      district_name: profileData.district_name || 'Coimbatore',
      phone: profileData.phone || '',
      email: profileData.email || '',
      website_url: profileData.website_url || '',
      description: profileData.description || '',
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const storedProfiles = this._getStoredProfiles();
      storedProfiles[userId] = { ...(storedProfiles[userId] || {}), ...cleanData };
      localStorage.setItem(LOCAL_ORGANIZER_PROFILES_KEY, JSON.stringify(storedProfiles));
      return storedProfiles[userId];
    }

    try {
      const { data, error } = await supabase
        .from('organizers')
        .upsert({ user_id: userId, ...cleanData }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase organizer profile update warning:', err.message);
      const storedProfiles = this._getStoredProfiles();
      storedProfiles[userId] = { ...(storedProfiles[userId] || {}), ...cleanData };
      localStorage.setItem(LOCAL_ORGANIZER_PROFILES_KEY, JSON.stringify(storedProfiles));
      return storedProfiles[userId];
    }
  },

  /**
   * Get Dashboard Preferences (metric widgets visibility)
   */
  async getDashboardPreferences(userId) {
    const defaultPrefs = {
      show_revenue_breakdown: true,
      show_registration_trends: true,
      show_sport_performance: true,
      show_checkin_analytics: true,
      show_top_events: true,
      show_recent_registrations: true,
      notify_registrations: true,
      notify_payments: true,
      notify_approvals: true,
      notify_event_updates: true,
    };

    if (!userId) return defaultPrefs;

    try {
      const stored = localStorage.getItem(`${LOCAL_PREFERENCES_KEY}_${userId}`);
      if (stored) return { ...defaultPrefs, ...JSON.parse(stored) };
    } catch (e) {}

    return defaultPrefs;
  },

  /**
   * Update Dashboard Preferences
   */
  async updateDashboardPreferences(userId, prefs) {
    if (!userId) throw new Error('User authentication required.');

    const current = await this.getDashboardPreferences(userId);
    const updated = { ...current, ...prefs };

    try {
      localStorage.setItem(`${LOCAL_PREFERENCES_KEY}_${userId}`, JSON.stringify(updated));
    } catch (e) {}

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({ preferences: updated })
          .eq('id', userId);
      } catch (err) {
        console.warn('Could not sync preferences to DB profiles:', err);
      }
    }

    return updated;
  },

  /**
   * Fetch all raw events belonging strictly to the authenticated organizer
   */
  async _getRawOrganizerEvents(userId) {
    if (!userId) return [];

    let eventsList = [];

    if (!isSupabaseConfigured) {
      const storedEvents = this._getStoredEvents();
      const userStored = storedEvents.filter((e) => e.organizer_id === userId || e.user_id === userId);

      // In dev fallback mode: If this is the primary mock organizer user, link with mock events
      const isPrimaryMockUser = userId.includes('organizer') || userId.includes('cdba') || (!userId.includes('organizer_b') && userStored.length === 0);

      if (isPrimaryMockUser && userStored.length === 0) {
        // Seed default organizer events for mock testing
        const seeded = MOCK_EVENTS.slice(0, 5).map((e, idx) => ({
          ...e,
          organizer_id: userId,
          user_id: userId,
          image_url: e.poster_url || e.image_url,
          status: idx === 3 ? 'draft' : idx === 4 ? 'pending_review' : 'published',
        }));
        storedEvents.push(...seeded);
        localStorage.setItem(LOCAL_ORGANIZER_EVENTS_KEY, JSON.stringify(storedEvents));
        eventsList = seeded;
      } else {
        eventsList = userStored;
      }
    } else {
      try {
        // 1. Find organizer record ID
        const { data: org } = await supabase
          .from('organizers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        let query = supabase
          .from('events')
          .select(`
            *,
            sport:sports(*),
            event_type:event_types(*)
          `)
          .order('created_at', { ascending: false });

        if (org?.id) {
          query = query.or(`organizer_id.eq.${org.id},organizer_id.eq.${userId}`);
        } else {
          query = query.eq('organizer_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        eventsList = data || [];
      } catch (err) {
        console.warn('Supabase raw organizer events fetch warning:', err);
        const storedEvents = this._getStoredEvents();
        eventsList = storedEvents.filter((e) => e.organizer_id === userId || e.user_id === userId);
      }
    }

    return eventsList;
  },

  /**
   * Calculate Rich Dashboard Metrics & Operational KPIs
   */
  async getDashboardMetrics(userId, { dateRange = '30d' } = {}) {
    if (!userId) {
      return {
        totalEvents: 0,
        publishedEvents: 0,
        upcomingEvents: 0,
        draftEvents: 0,
        pendingReviewEvents: 0,
        changesRequestedEvents: 0,
        rejectedEvents: 0,
        completedEvents: 0,
        totalRegistrations: 0,
        confirmedRegistrations: 0,
        pendingRegistrations: 0,
        totalRegistrationPayments: 0,
        capturedPayments: 0,
        platformFees: 0,
        organizerEarnings: 0,
        checkedInCount: 0,
        totalEligibleForCheckin: 0,
        checkinRate: 0,
        registrationTrend: [],
        revenueTrend: [],
        growthComparison: { revenueChange: 0, registrationChange: 0, hasComparisonData: false },
        sportPerformance: [],
        topEvents: [],
        statusOverview: { upcoming: 0, regOpen: 0, regClosed: 0, completed: 0, pending: 0, drafts: 0, changesRequested: 0, rejected: 0 },
        upcomingEventsList: [],
        recentRegistrations: [],
        events: [],
      };
    }

    const rawEvents = await this._getRawOrganizerEvents(userId);
    const today = new Date();

    // Fetch all registrations & payments for organizer events
    let allRegistrations = [];
    let allPayments = [];

    if (!isSupabaseConfigured) {
      const storedRegs = registrationService._getStoredRegistrations();
      const eventIds = new Set(rawEvents.map((e) => e.id));
      allRegistrations = storedRegs.filter((r) => eventIds.has(r.event_id) || eventIds.has(r.event?.id));

      const storedPayments = paymentService._getStoredPayments();
      allPayments = storedPayments.filter((p) => eventIds.has(p.event_id));
    } else {
      try {
        const eventIds = rawEvents.map((e) => e.id);
        if (eventIds.length > 0) {
          const { data: regsData } = await supabase
            .from('event_registrations')
            .select(`
              *,
              participants:registration_participants(*)
            `)
            .in('event_id', eventIds)
            .order('created_at', { ascending: false });
          allRegistrations = regsData || [];

          const { data: payData } = await supabase
            .from('payments')
            .select('*')
            .in('event_id', eventIds)
            .eq('status', 'captured')
            .order('created_at', { ascending: false });
          allPayments = payData || [];
        }
      } catch (e) {
        console.warn('Supabase analytics fetch error:', e);
      }
    }

    // Attach registration details to events
    const eventsWithDetails = rawEvents.map((evt) => {
      const evtRegs = allRegistrations.filter((r) => r.event_id === evt.id || r.event?.id === evt.id);
      const regCount = evtRegs.length;
      const checkedIn = evtRegs.filter((r) => r.checkin_status === 'checked_in').length;
      
      // Authoritative captured payment calculation
      let evtCapturedRevenue = 0;
      evtRegs.forEach((r) => {
        if (r.payment_status === 'paid' || r.status === 'confirmed') {
          evtCapturedRevenue += Number(r.total_fee || evt.entry_fee || 0);
        }
      });

      const maxCap = Number(evt.max_participants || 100);
      const isCheckInRequired = evt.check_in_required !== false;
      const startDate = new Date(evt.start_date);
      const endDate = new Date(evt.end_date || evt.start_date);
      const deadline = new Date(evt.registration_deadline || evt.start_date);

      let regStatus = 'open';
      if (today > deadline) {
        regStatus = 'closed';
      } else if (regCount >= maxCap) {
        regStatus = 'full';
      } else if (today < new Date(evt.registration_start || '2000-01-01')) {
        regStatus = 'upcoming';
      } else {
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft >= 0) {
          regStatus = 'closing_soon';
        }
      }

      return {
        ...evt,
        registrationsCount: regCount,
        checkedInCount: checkedIn,
        capturedRevenue: evtCapturedRevenue,
        maxCap,
        isCheckInRequired,
        regStatus,
        isUpcoming: endDate >= today && evt.status === 'published',
        isCompleted: endDate < today && evt.status === 'published',
      };
    });

    // 1. Portfolio Counts
    const publishedEvents = eventsWithDetails.filter((e) => e.status === 'published').length;
    const upcomingEvents = eventsWithDetails.filter((e) => e.isUpcoming).length;
    const completedEvents = eventsWithDetails.filter((e) => e.isCompleted || e.status === 'completed').length;
    const draftEvents = eventsWithDetails.filter((e) => e.status === 'draft').length;
    const pendingReviewEvents = eventsWithDetails.filter((e) => e.status === 'pending_review').length;
    const changesRequestedEvents = eventsWithDetails.filter((e) => e.status === 'changes_requested').length;
    const rejectedEvents = eventsWithDetails.filter((e) => e.status === 'rejected').length;

    // 2. Registrations & Financial Totals
    const totalRegistrations = allRegistrations.length;
    const confirmedRegistrations = allRegistrations.filter((r) => r.status === 'confirmed' || r.payment_status === 'paid').length;
    const pendingRegistrations = allRegistrations.filter((r) => r.payment_status === 'pending' || r.status === 'pending_payment').length;

    // Total gross captured payments across all organizer events
    const capturedPayments = eventsWithDetails.reduce((sum, e) => sum + e.capturedRevenue, 0);
    const totalRegistrationPayments = capturedPayments;
    
    // Platform / Service Fee calculation (retained by KnowASport)
    const platformFees = Math.round(capturedPayments * PLATFORM_FEE_RATE);
    
    // Net Organizer Earnings
    const organizerEarnings = capturedPayments - platformFees;

    // 3. Check-in Metrics
    let checkedInCount = 0;
    let totalEligibleForCheckin = 0;
    eventsWithDetails.forEach((e) => {
      if (e.isCheckInRequired) {
        checkedInCount += e.checkedInCount;
        totalEligibleForCheckin += e.registrationsCount;
      }
    });
    const checkinRate = totalEligibleForCheckin > 0 ? Math.round((checkedInCount / totalEligibleForCheckin) * 100) : 0;

    // 4. Time Series Generation (Registrations & Revenue over time)
    const daysLimit = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '3m' ? 90 : dateRange === '6m' ? 180 : 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysLimit);

    // Group registrations & revenue by day
    const trendMap = {};
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap[key] = { date: key, label, count: 0, amount: 0, organizerAmount: 0, platformFee: 0 };
    }

    allRegistrations.forEach((r) => {
      const rDate = (r.created_at || new Date().toISOString()).split('T')[0];
      if (trendMap[rDate]) {
        trendMap[rDate].count += 1;
        if (r.payment_status === 'paid' || r.status === 'confirmed') {
          const fee = Number(r.total_fee || 0);
          trendMap[rDate].amount += fee;
          const pFee = Math.round(fee * PLATFORM_FEE_RATE);
          trendMap[rDate].platformFee += pFee;
          trendMap[rDate].organizerAmount += (fee - pFee);
        }
      }
    });

    const registrationTrend = Object.values(trendMap);
    const revenueTrend = Object.values(trendMap);

    // 5. Growth Comparison (vs previous same period)
    const prevCutoffStart = new Date(cutoffDate);
    prevCutoffStart.setDate(prevCutoffStart.getDate() - daysLimit);

    let currentPeriodRevenue = 0;
    let prevPeriodRevenue = 0;
    let currentPeriodRegs = 0;
    let prevPeriodRegs = 0;

    allRegistrations.forEach((r) => {
      const regTime = new Date(r.created_at || 0).getTime();
      const cutTime = cutoffDate.getTime();
      const prevCutTime = prevCutoffStart.getTime();

      if (regTime >= cutTime) {
        currentPeriodRegs += 1;
        if (r.payment_status === 'paid' || r.status === 'confirmed') {
          currentPeriodRevenue += Number(r.total_fee || 0);
        }
      } else if (regTime >= prevCutTime && regTime < cutTime) {
        prevPeriodRegs += 1;
        if (r.payment_status === 'paid' || r.status === 'confirmed') {
          prevPeriodRevenue += Number(r.total_fee || 0);
        }
      }
    });

    const hasComparisonData = prevPeriodRegs > 0 || prevPeriodRevenue > 0;
    const revenueChange = prevPeriodRevenue > 0 ? Number((((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100).toFixed(1)) : 0;
    const registrationChange = prevPeriodRegs > 0 ? Number((((currentPeriodRegs - prevPeriodRegs) / prevPeriodRegs) * 100).toFixed(1)) : 0;

    // 6. Sport Performance Breakdown
    const sportMap = {};
    eventsWithDetails.forEach((e) => {
      const sport = e.sport_name || e.sport?.name || 'General';
      if (!sportMap[sport]) {
        sportMap[sport] = { sport, count: 0, registrations: 0, revenue: 0 };
      }
      sportMap[sport].count += 1;
      sportMap[sport].registrations += e.registrationsCount;
      sportMap[sport].revenue += e.capturedRevenue;
    });

    const sportPerformance = Object.values(sportMap).map((s) => ({
      ...s,
      percentage: totalRegistrations > 0 ? Math.round((s.registrations / totalRegistrations) * 100) : 0,
    })).sort((a, b) => b.registrations - a.registrations);

    // 7. Top Performing Events
    const topEvents = [...eventsWithDetails]
      .sort((a, b) => b.registrationsCount - a.registrationsCount || b.capturedRevenue - a.capturedRevenue)
      .slice(0, 5);

    // 8. Upcoming Events compact list
    const upcomingEventsList = eventsWithDetails
      .filter((e) => e.isUpcoming)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 5);

    // 9. Recent Registrations list
    const recentRegistrations = allRegistrations.slice(0, 10).map((r) => {
      const matchedEvt = eventsWithDetails.find((e) => e.id === r.event_id || e.id === r.event?.id);
      const participantName = r.participants?.[0]?.full_name || r.team_name || r.full_name || 'Registered Participant';
      return {
        id: r.id,
        registration_number: r.registration_number || `REG-${r.id.slice(0, 6)}`,
        participant_name: participantName,
        event_title: matchedEvt?.title || r.event?.title || 'Tournament',
        event_id: r.event_id,
        participation_type: r.participation_type || 'individual',
        payment_status: r.payment_status || 'pending',
        status: r.status || 'pending_payment',
        total_fee: r.total_fee || 0,
        checkin_status: r.checkin_status || 'not_checked_in',
        created_at: r.created_at || new Date().toISOString(),
      };
    });

    // 10. Status Overview
    const statusOverview = {
      upcoming: upcomingEvents,
      regOpen: eventsWithDetails.filter((e) => e.status === 'published' && e.regStatus === 'open').length,
      regClosed: eventsWithDetails.filter((e) => e.status === 'published' && e.regStatus === 'closed').length,
      completed: completedEvents,
      pending: pendingReviewEvents,
      drafts: draftEvents,
      changesRequested: changesRequestedEvents,
      rejected: rejectedEvents,
    };

    return {
      totalEvents: rawEvents.length,
      publishedEvents,
      upcomingEvents,
      draftEvents,
      pendingReviewEvents,
      changesRequestedEvents,
      rejectedEvents,
      completedEvents,
      totalRegistrations,
      confirmedRegistrations,
      pendingRegistrations,
      totalRegistrationPayments,
      capturedPayments,
      platformFees,
      organizerEarnings,
      checkedInCount,
      totalEligibleForCheckin,
      checkinRate,
      registrationTrend,
      revenueTrend,
      growthComparison: {
        revenueChange,
        registrationChange,
        hasComparisonData,
      },
      sportPerformance,
      topEvents,
      statusOverview,
      upcomingEventsList,
      recentRegistrations,
      events: eventsWithDetails,
    };
  },

  /**
   * Get Organizer Events with Full Filtering & Status Tabs
   */
  async getOrganizerEvents(userId, {
    status = 'all',
    sport = 'all',
    eventType = 'all',
    participation = 'all',
    date = 'all',
    search = '',
    sort = 'newest',
    page = 1,
    limit = 100,
  } = {}) {
    if (!userId) return { events: [], total: 0, statusCounts: {} };

    const metrics = await this.getDashboardMetrics(userId);
    let list = [...(metrics.events || [])];
    const today = new Date();

    // Compute status counts for tabs
    const statusCounts = {
      all: list.length,
      upcoming: list.filter((e) => e.isUpcoming).length,
      reg_open: list.filter((e) => e.status === 'published' && (e.regStatus === 'open' || e.regStatus === 'closing_soon')).length,
      reg_closed: list.filter((e) => e.status === 'published' && (e.regStatus === 'closed' || e.regStatus === 'full')).length,
      completed: list.filter((e) => e.isCompleted || e.status === 'completed').length,
      drafts: list.filter((e) => e.status === 'draft').length,
      pending: list.filter((e) => e.status === 'pending_review').length,
      changes_requested: list.filter((e) => e.status === 'changes_requested').length,
      rejected: list.filter((e) => e.status === 'rejected').length,
    };

    // Filter by Status Tab
    if (status === 'upcoming') {
      list = list.filter((e) => e.isUpcoming);
    } else if (status === 'reg_open') {
      list = list.filter((e) => e.status === 'published' && (e.regStatus === 'open' || e.regStatus === 'closing_soon'));
    } else if (status === 'reg_closed') {
      list = list.filter((e) => e.status === 'published' && (e.regStatus === 'closed' || e.regStatus === 'full'));
    } else if (status === 'completed') {
      list = list.filter((e) => e.isCompleted || e.status === 'completed');
    } else if (status === 'drafts') {
      list = list.filter((e) => e.status === 'draft');
    } else if (status === 'pending') {
      list = list.filter((e) => e.status === 'pending_review');
    } else if (status === 'changes_requested') {
      list = list.filter((e) => e.status === 'changes_requested');
    } else if (status === 'rejected') {
      list = list.filter((e) => e.status === 'rejected');
    }

    // Filter by Search
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((e) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.sport_name || '').toLowerCase().includes(q) ||
        (e.venue_name || '').toLowerCase().includes(q) ||
        (e.city_name || '').toLowerCase().includes(q)
      );
    }

    // Filter by Sport
    if (sport && sport !== 'all') {
      list = list.filter((e) => (e.sport_slug === sport || e.sport_name?.toLowerCase() === sport.toLowerCase() || e.sport_id === sport));
    }

    // Filter by Event Type
    if (eventType && eventType !== 'all') {
      list = list.filter((e) => (e.event_type_slug === eventType || e.event_type_name?.toLowerCase() === eventType.toLowerCase()));
    }

    // Filter by Participation Type (Strict INDIVIDUAL vs TEAM)
    if (participation && participation !== 'all') {
      list = list.filter((e) => e.participation_type === participation);
    }

    // Sorting
    if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sort === 'start_date_asc') {
      list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    } else if (sort === 'start_date_desc') {
      list.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } else if (sort === 'registrations_desc') {
      list.sort((a, b) => b.registrationsCount - a.registrationsCount);
    } else if (sort === 'revenue_desc') {
      list.sort((a, b) => b.capturedRevenue - a.capturedRevenue);
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      events: paginated,
      total,
      statusCounts,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
      organizer_id: user.id,
      user_id: user.id,
      slug,
      title: eventData.title,
      sport_name: eventData.sport_name || 'Football',
      event_type_name: eventData.event_type_name || 'Tournament',
      description: eventData.description || '',
      start_date: eventData.start_date || new Date().toISOString().split('T')[0],
      end_date: eventData.end_date || eventData.start_date,
      registration_start: eventData.registration_start || new Date().toISOString().split('T')[0],
      registration_deadline: eventData.registration_deadline || eventData.start_date,
      venue_name: eventData.venue_name || 'Local Sports Complex',
      city_name: eventData.city_name || 'Coimbatore',
      district_name: eventData.district_name || 'Coimbatore',
      participation_type: eventData.participation_type === 'team' ? 'team' : 'individual',
      team_size: Number(eventData.team_size || 1),
      entry_fee: Number(eventData.entry_fee || 0),
      max_participants: Number(eventData.max_participants || 100),
      current_participants: 0,
      image_url: eventData.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      check_in_required: eventData.check_in_required !== false,
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      stored.unshift(newEvent);
      localStorage.setItem(LOCAL_ORGANIZER_EVENTS_KEY, JSON.stringify(stored));
      return newEvent;
    }

    try {
      // Find organizer ID
      const { data: org } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('events')
        .insert({
          organizer_id: org?.id || user.id,
          slug: newEvent.slug,
          title: newEvent.title,
          description: newEvent.description,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          registration_start: newEvent.registration_start,
          registration_deadline: newEvent.registration_deadline,
          venue_name: newEvent.venue_name,
          city_name: newEvent.city_name,
          district_name: newEvent.district_name,
          participation_type: newEvent.participation_type,
          team_size: newEvent.team_size,
          entry_fee: newEvent.entry_fee,
          max_participants: newEvent.max_participants,
          poster_url: newEvent.image_url,
          check_in_required: newEvent.check_in_required,
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
      localStorage.setItem(LOCAL_ORGANIZER_EVENTS_KEY, JSON.stringify(stored));
      return newEvent;
    }
  },

  /**
   * Update existing event
   */
  async updateEvent(eventId, eventData, user) {
    if (!eventId || !user) throw new Error('Event ID and authentication required.');

    const updatePayload = {
      title: eventData.title,
      sport_name: eventData.sport_name,
      event_type_name: eventData.event_type_name,
      description: eventData.description,
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      registration_deadline: eventData.registration_deadline,
      venue_name: eventData.venue_name,
      city_name: eventData.city_name,
      district_name: eventData.district_name,
      participation_type: eventData.participation_type === 'team' ? 'team' : 'individual',
      team_size: Number(eventData.team_size || 1),
      entry_fee: Number(eventData.entry_fee || 0),
      max_participants: Number(eventData.max_participants || 100),
      check_in_required: eventData.check_in_required !== false,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      const updated = stored.map((e) => (e.id === eventId ? { ...e, ...updatePayload } : e));
      localStorage.setItem(LOCAL_ORGANIZER_EVENTS_KEY, JSON.stringify(updated));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('events')
        .update(updatePayload)
        .eq('id', eventId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Supabase update event error:', err);
      const stored = this._getStoredEvents();
      const updated = stored.map((e) => (e.id === eventId ? { ...e, ...updatePayload } : e));
      localStorage.setItem(LOCAL_ORGANIZER_EVENTS_KEY, JSON.stringify(updated));
      return { success: true };
    }
  },

  /**
   * Submit event for admin review (status -> 'pending_review')
   */
  async submitEventForReview(eventId, user) {
    if (!eventId || !user) throw new Error('Event ID and authentication required.');

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      const updated = stored.map((e) => (e.id === eventId ? { ...e, status: 'pending_review' } : e));
      localStorage.setItem(LOCAL_ORGANIZER_EVENTS_KEY, JSON.stringify(updated));
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
   * Resubmit event after Admin changes requested (status -> 'pending_review')
   */
  async resubmitEvent(eventId, eventData, user) {
    if (!eventId || !user) throw new Error('Event ID and authentication required.');

    await this.updateEvent(eventId, eventData, user);
    return this.submitEventForReview(eventId, user);
  },

  /**
   * Delete draft event
   */
  async deleteDraftEvent(eventId, user) {
    if (!eventId || !user) throw new Error('Event ID and authentication required.');

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      const filtered = stored.filter((e) => e.id !== eventId);
      localStorage.setItem(LOCAL_ORGANIZER_EVENTS_KEY, JSON.stringify(filtered));
      return true;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('status', 'draft');

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Delete draft event error:', err);
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

  _getStoredProfiles() {
    try {
      const stored = localStorage.getItem(LOCAL_ORGANIZER_PROFILES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  _getStoredEvents() {
    try {
      const stored = localStorage.getItem(LOCAL_ORGANIZER_EVENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
};
