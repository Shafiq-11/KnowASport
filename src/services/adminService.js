import { supabase, isSupabaseConfigured } from './supabase.js';
import { eventService } from './eventService.js';
import { registrationService } from './registrationService.js';
import { notificationService } from './notificationService.js';
import { MOCK_EVENTS, MOCK_ORGANIZERS } from '../data/mockEvents.js';

const LOCAL_ADMIN_APPS_KEY = 'kas_mock_organizer_apps_v1';
const LOCAL_ADMIN_EVENTS_KEY = 'kas_mock_organizer_events_v2';
const LOCAL_AUDIT_LOGS_KEY = 'kas_mock_audit_logs_v1';

export const adminService = {
  /**
   * Get Platform Overview Metrics with authoritative financial terminology
   */
  async getPlatformMetrics() {
    const allEventsRes = await eventService.getEvents({ limit: 100 });
    const events = allEventsRes.events || [];
    const pendingApps = await this.getPendingApplications();
    const allAdminEvents = await this.getAllEvents();
    const pendingEvents = allAdminEvents.filter((e) => e.status === 'pending_review');

    let totalUsers = 120;
    let totalOrganizers = 15;
    let verifiedOrganizers = 8;
    let suspendedOrganizers = 0;
    let totalRegistrations = 0;
    let confirmedRegistrations = 0;
    let pendingPaymentRegistrations = 0;
    let cancelledRegistrations = 0;
    let totalRegistrationPayments = 0;
    let capturedPayments = 0;
    let platformFees = 0;

    if (!isSupabaseConfigured) {
      const storedRegs = registrationService._getStoredRegistrations();
      totalRegistrations = storedRegs.length;
      storedRegs.forEach((r) => {
        if (r.status === 'confirmed') confirmedRegistrations += 1;
        if (r.payment_status === 'pending') pendingPaymentRegistrations += 1;
        if (r.status === 'cancelled') cancelledRegistrations += 1;

        if (r.payment_status === 'paid' || r.status === 'confirmed') {
          totalRegistrationPayments += Number(r.total_fee || 0);
        }
      });
      capturedPayments = totalRegistrationPayments;
    } else {
      try {
        const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: orgCount } = await supabase.from('organizers').select('*', { count: 'exact', head: true });
        // FIXED: Query verification_status = 'verified' matching DB check constraint
        const { count: vCount } = await supabase.from('organizers').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified');
        const { count: rCount } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true });
        const { count: confCount } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed');
        const { count: pendCount } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending');
        const { count: cancCount } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');
        const { data: payData } = await supabase.from('payments').select('amount').eq('status', 'captured');

        if (uCount) totalUsers = uCount;
        if (orgCount) totalOrganizers = orgCount;
        if (vCount) verifiedOrganizers = vCount;
        if (rCount) totalRegistrations = rCount;
        if (confCount) confirmedRegistrations = confCount;
        if (pendCount) pendingPaymentRegistrations = pendCount;
        if (cancCount) cancelledRegistrations = cancCount;

        if (payData) {
          totalRegistrationPayments = payData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          capturedPayments = totalRegistrationPayments;
        }
      } catch (e) {
        console.warn('Supabase admin metrics query warning:', e.message);
      }
    }

    const organizerAmount = totalRegistrationPayments - platformFees;
    const publishedEvents = allAdminEvents.filter((e) => e.status === 'published').length;
    const draftEvents = allAdminEvents.filter((e) => e.status === 'draft').length;
    const upcomingEvents = allAdminEvents.filter((e) => new Date(e.start_date) >= new Date() && e.status === 'published').length;

    return {
      totalUsers,
      totalOrganizers,
      verifiedOrganizers,
      suspendedOrganizers,
      publishedEvents,
      draftEvents,
      upcomingEvents,
      totalRegistrations,
      confirmedRegistrations,
      pendingPaymentRegistrations,
      cancelledRegistrations,
      totalRegistrationPayments,
      capturedPayments,
      platformFees,
      organizerAmount,
      pendingApplicationsCount: pendingApps.filter((a) => a.status === 'pending').length,
      pendingEventsCount: pendingEvents.length,
    };
  },

  /**
   * Get all pending organizer applications
   */
  async getPendingApplications() {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredApplications();
      return stored;
    }

    try {
      const { data, error } = await supabase
        .from('organizer_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      const stored = this._getStoredApplications();
      return stored;
    }
  },

  /**
   * Get Registered Organizers with their event counts
   */
  async getOrganizersWithEvents() {
    const applications = await this.getPendingApplications();
    const allEvents = await this.getAllEvents();

    if (!isSupabaseConfigured) {
      // Build list from MOCK_ORGANIZERS and stored applications
      const orgMap = new Map();

      // 1. Initial Mock Organizers
      const initialOrgs = [
        {
          id: 'usr_org_1',
          user_id: 'usr_org_1',
          organization_name: 'Coimbatore District Badminton Association',
          organization_type: 'association',
          city_name: 'Coimbatore',
          phone: '+91 98422 12345',
          email: 'contact@cdba.in',
          verification_status: 'verified',
          created_at: '2026-01-10T10:00:00Z',
        },
        {
          id: 'usr_org_2',
          user_id: 'usr_org_2',
          organization_name: 'Chennai Sports Club & Academy',
          organization_type: 'academy',
          city_name: 'Chennai',
          phone: '+91 94440 98765',
          email: 'events@chennaisportsclub.org',
          verification_status: 'verified',
          created_at: '2026-01-15T12:00:00Z',
        },
        {
          id: 'usr_org_3',
          user_id: 'usr_org_3',
          organization_name: 'Tiruppur Volleyball Development Association',
          organization_type: 'association',
          city_name: 'Tiruppur',
          phone: '+91 98941 55443',
          email: 'info@tiruppurvolley.in',
          verification_status: 'verified',
          created_at: '2026-02-01T09:00:00Z',
        },
      ];

      initialOrgs.forEach((o) => orgMap.set(o.id, o));

      // 2. Add from approved/registered applications
      applications.forEach((app) => {
        const key = app.user_id || app.id;
        orgMap.set(key, {
          id: app.id,
          user_id: app.user_id || app.id,
          organization_name: app.organization_name,
          organization_type: app.organization_type,
          city_name: app.city_name,
          phone: app.phone,
          email: app.email,
          verification_status: app.status === 'approved' ? 'verified' : app.status,
          created_at: app.created_at || new Date().toISOString(),
        });
      });

      const list = Array.from(orgMap.values()).map((org) => {
        const orgEvents = allEvents.filter(
          (e) => e.organizer_id === org.id || e.organizer_id === org.user_id || e.user_id === org.user_id
        );
        return {
          ...org,
          total_events: orgEvents.length,
          published_events: orgEvents.filter((e) => e.status === 'published').length,
          pending_events: orgEvents.filter((e) => e.status === 'pending_review').length,
          draft_events: orgEvents.filter((e) => e.status === 'draft').length,
        };
      });

      return list;
    }

    try {
      const { data: orgs, error } = await supabase
        .from('organizers')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (orgs || []).map((org) => {
        const orgEvents = allEvents.filter(
          (e) => e.organizer_id === org.id || e.organizer_id === org.user_id
        );
        return {
          id: org.id,
          user_id: org.user_id,
          organization_name: org.organization_name || org.profile?.full_name || 'Organizer',
          organization_type: org.organization_type || 'organization',
          city_name: org.city_name || org.profile?.city_name || 'Tamil Nadu',
          phone: org.phone || org.profile?.phone || 'N/A',
          email: org.email || org.profile?.email || 'N/A',
          verification_status: org.verification_status || 'verified',
          created_at: org.created_at,
          total_events: orgEvents.length,
          published_events: orgEvents.filter((e) => e.status === 'published').length,
          pending_events: orgEvents.filter((e) => e.status === 'pending_review').length,
          draft_events: orgEvents.filter((e) => e.status === 'draft').length,
        };
      });
    } catch (err) {
      console.warn('Supabase getOrganizersWithEvents warning:', err.message);
      return [];
    }
  },

  /**
   * Approve Organizer Application
   */
  async approveOrganizerApplication(appId, adminUser) {
    const reviewedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'APPROVE_ORGANIZER', 'organizer_application', appId, { status: 'approved' });

    const stored = this._getStoredApplications();
    const targetApp = stored.find((a) => a.id === appId || a.user_id === appId);
    const targetUserId = targetApp?.user_id || appId;

    await notificationService.createNotification({
      userId: targetUserId,
      type: 'organizer_approved',
      title: 'Organizer Account Approved',
      message: 'Your organizer account has been approved. You can now list public sports events on KnowASport.',
      relatedType: 'organizer',
      relatedId: appId,
    });

    if (!isSupabaseConfigured) {
      const updated = stored.map((a) =>
        a.id === appId || a.user_id === appId
          ? { ...a, status: 'approved', reviewed_at: reviewedAt }
          : a
      );
      localStorage.setItem(LOCAL_ADMIN_APPS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { data: app, error: appErr } = await supabase
        .from('organizer_applications')
        .update({ status: 'approved', reviewed_at: reviewedAt })
        .eq('id', appId)
        .select()
        .single();

      if (appErr) throw appErr;

      if (app?.user_id) {
        await supabase.from('profiles').update({ role: 'organizer' }).eq('id', app.user_id);
        await supabase.from('organizers').upsert({
          user_id: app.user_id,
          organization_name: app.organization_name,
          organization_type: app.organization_type,
          city_name: app.city_name,
          district_name: app.district_name || app.city_name,
          phone: app.phone,
          email: app.email,
          verification_status: 'verified',
          verified_at: reviewedAt,
        });
      }

      return true;
    } catch (err) {
      console.error('Approve application error:', err);
      return false;
    }
  },

  /**
   * Reject Organizer Application with reason
   */
  async rejectOrganizerApplication(appId, reason, adminUser) {
    if (!reason || !reason.trim()) throw new Error('Rejection reason required.');
    const reviewedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'REJECT_ORGANIZER', 'organizer_application', appId, { reason });

    const stored = this._getStoredApplications();
    const targetApp = stored.find((a) => a.id === appId || a.user_id === appId);
    const targetUserId = targetApp?.user_id || appId;

    await notificationService.createNotification({
      userId: targetUserId,
      type: 'organizer_rejected',
      title: 'Organizer Application Update',
      message: `Your organizer application was rejected: ${reason}`,
      relatedType: 'organizer',
      relatedId: appId,
    });

    if (!isSupabaseConfigured) {
      const updated = stored.map((a) =>
        a.id === appId || a.user_id === appId
          ? { ...a, status: 'rejected', rejection_reason: reason, reviewed_at: reviewedAt }
          : a
      );
      localStorage.setItem(LOCAL_ADMIN_APPS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('organizer_applications')
        .update({ status: 'rejected', rejection_reason: reason, reviewed_at: reviewedAt })
        .eq('id', appId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Reject application error:', err);
      return false;
    }
  },

  /**
   * Approve Event and Publish to Discovery Feed
   */
  async approveEvent(eventId, adminUser) {
    const moderatedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'APPROVE_EVENT', 'event', eventId, { status: 'published' });

    const stored = this._getStoredEvents();
    const targetEvt = stored.find((e) => e.id === eventId || e.slug === eventId);
    const targetUserId = targetEvt?.user_id || targetEvt?.organizer_id || targetEvt?.organizer?.user_id;

    if (targetUserId) {
      try {
        await notificationService.createNotification({
          userId: targetUserId,
          type: 'event_approved',
          title: 'Tournament Approved & Published!',
          message: `Your sports event "${targetEvt?.title || 'Tournament'}" has been approved by admin and is now live on public discovery!`,
          relatedType: 'event',
          relatedId: eventId,
        });
      } catch (ne) {
        console.warn('Notification send warning:', ne.message);
      }
    }

    const updated = stored.map((e) =>
      e.id === eventId || e.slug === eventId
        ? {
            ...e,
            status: 'published',
            published_at: e.published_at || moderatedAt,
            moderated_at: moderatedAt,
            moderated_by: adminUser?.id || 'admin',
            changes_requested_reason: null,
            rejection_reason: null,
          }
        : e
    );
    localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('events')
          .update({
            status: 'published',
            updated_at: moderatedAt,
          })
          .eq('id', eventId);

        if (error) console.warn('Supabase approve event warning:', error.message);
      } catch (err) {
        console.warn('Supabase approve event error:', err);
      }
    }

    return true;
  },

  /**
   * Reject Event with reason
   */
  async rejectEvent(eventId, reason, adminUser) {
    if (!reason || !reason.trim()) throw new Error('Rejection reason required.');
    const moderatedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'REJECT_EVENT', 'event', eventId, { reason });

    const stored = this._getStoredEvents();
    const targetEvt = stored.find((e) => e.id === eventId || e.slug === eventId);
    const targetUserId = targetEvt?.user_id || targetEvt?.organizer_id || targetEvt?.organizer?.user_id;

    if (targetUserId) {
      try {
        await notificationService.createNotification({
          userId: targetUserId,
          type: 'event_rejected',
          title: 'Tournament Submission Rejected',
          message: `Your tournament "${targetEvt?.title || 'Event'}" was rejected: ${reason}`,
          relatedType: 'event',
          relatedId: eventId,
        });
      } catch (ne) {
        console.warn('Notification send warning:', ne.message);
      }
    }

    const updated = stored.map((e) =>
      e.id === eventId || e.slug === eventId
        ? {
            ...e,
            status: 'rejected',
            rejection_reason: reason,
            moderated_at: moderatedAt,
            moderated_by: adminUser?.id || 'admin',
          }
        : e
    );
    localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('events')
          .update({
            status: 'rejected',
            updated_at: moderatedAt,
          })
          .eq('id', eventId);

        if (error) console.warn('Supabase reject event warning:', error.message);
      } catch (err) {
        console.warn('Supabase reject event error:', err);
      }
    }

    return true;
  },

  /**
   * Request Changes for an Event
   */
  async requestEventChanges(eventId, reason, adminUser) {
    if (!reason || !reason.trim()) throw new Error('Change request notes required.');
    const moderatedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'REQUEST_CHANGES_EVENT', 'event', eventId, { reason });

    const stored = this._getStoredEvents();
    const targetEvt = stored.find((e) => e.id === eventId || e.slug === eventId);
    const targetUserId = targetEvt?.user_id || targetEvt?.organizer_id || targetEvt?.organizer?.user_id;

    if (targetUserId) {
      try {
        await notificationService.createNotification({
          userId: targetUserId,
          type: 'event_changes_requested',
          title: 'Modifications Requested for Tournament',
          message: `Admin requested changes for "${targetEvt?.title || 'Event'}": ${reason}`,
          relatedType: 'event',
          relatedId: eventId,
        });
      } catch (ne) {
        console.warn('Notification send warning:', ne.message);
      }
    }

    const updated = stored.map((e) =>
      e.id === eventId || e.slug === eventId
        ? {
            ...e,
            status: 'changes_requested',
            changes_requested_reason: reason,
            moderated_at: moderatedAt,
            moderated_by: adminUser?.id || 'admin',
          }
        : e
    );
    localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('events')
          .update({
            status: 'changes_requested',
            updated_at: moderatedAt,
          })
          .eq('id', eventId);

        if (error) console.warn('Supabase requestEventChanges warning:', error.message);
      } catch (err) {
        console.warn('Supabase requestEventChanges error:', err);
      }
    }

    return true;
  },

  /**
   * Unpublish Event back to Draft
   */
  async unpublishEvent(eventId, adminUser) {
    const moderatedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'UNPUBLISH_EVENT', 'event', eventId, { status: 'draft' });

    const stored = this._getStoredEvents();
    const targetEvt = stored.find((e) => e.id === eventId || e.slug === eventId);
    const targetUserId = targetEvt?.user_id || targetEvt?.organizer_id || targetEvt?.organizer?.user_id;

    if (targetUserId) {
      try {
        await notificationService.createNotification({
          userId: targetUserId,
          type: 'event_unpublished',
          title: 'Tournament Unpublished',
          message: `Your tournament "${targetEvt?.title || 'Event'}" has been reverted to draft by an admin.`,
          relatedType: 'event',
          relatedId: eventId,
        });
      } catch (ne) {
        console.warn('Notification send warning:', ne.message);
      }
    }

    const updated = stored.map((e) =>
      e.id === eventId || e.slug === eventId
        ? {
            ...e,
            status: 'draft',
            moderated_at: moderatedAt,
            moderated_by: adminUser?.id || 'admin',
          }
        : e
    );
    localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('events')
          .update({
            status: 'draft',
            updated_at: moderatedAt,
          })
          .eq('id', eventId);

        if (error) console.warn('Supabase unpublishEvent warning:', error.message);
      } catch (err) {
        console.warn('Supabase unpublishEvent error:', err);
      }
    }

    return true;
  },

  /**
   * Get all events with full filtering (Unified Admin event access)
   */
  async getAllEvents({ status = 'all', search = '', sport = 'all' } = {}) {
    let list = [];

    if (!isSupabaseConfigured) {
      list = this._getStoredEvents();
    } else {
      try {
        let query = supabase
          .from('events')
          .select(`
            *,
            organizer:organizers(*),
            sport:sports(*),
            event_type:event_types(*)
          `)
          .order('created_at', { ascending: false });

        if (status !== 'all') {
          query = query.eq('status', status);
        }
        if (sport !== 'all') {
          query = query.eq('sport_slug', sport);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Also merge any local session-added events to ensure immediate sync
        const stored = this._getStoredEvents();
        const dbIds = new Set((data || []).map((e) => e.id));
        const missingLocal = stored.filter((e) => !dbIds.has(e.id));
        list = [...(data || []), ...missingLocal];
      } catch (err) {
        console.warn('Supabase events query warning, falling back to local:', err.message);
        list = this._getStoredEvents();
      }
    }

    // Filter by Status Tab
    if (status && status !== 'all') {
      list = list.filter((e) => e.status === status);
    }

    // Filter by Sport
    if (sport && sport !== 'all') {
      list = list.filter(
        (e) =>
          e.sport_slug === sport ||
          e.sport_name?.toLowerCase() === sport.toLowerCase() ||
          e.sport_id === sport
      );
    }

    // Filter by Search Query
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.organizer_name || e.organizer?.organization_name || '').toLowerCase().includes(q) ||
          (e.sport_name || '').toLowerCase().includes(q) ||
          (e.venue_name || '').toLowerCase().includes(q) ||
          (e.city_name || '').toLowerCase().includes(q)
      );
    }

    return list;
  },

  /**
   * Fetch Users List with role filter
   */
  async getUsersList({ query = '', roleFilter = 'all' } = {}) {
    if (!isSupabaseConfigured) {
      const list = [
        { id: 'usr_1', full_name: 'Arun Kumar', email: 'arun@example.com', city_name: 'Coimbatore', role: 'user', user_status: 'active', created_at: new Date().toISOString() },
        { id: 'usr_2', full_name: 'Priya Sundaram', email: 'priya@example.com', city_name: 'Chennai', role: 'organizer', user_status: 'active', created_at: new Date().toISOString() },
        { id: 'usr_3', full_name: 'Karthik Raja', email: 'karthik@example.com', city_name: 'Madurai', role: 'user', user_status: 'active', created_at: new Date().toISOString() },
      ];
      return list.filter((u) => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        }
        return true;
      });
    }

    try {
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (roleFilter !== 'all') q = q.eq('role', roleFilter);
      if (query.trim()) q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
      const { data } = await q.limit(50);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Fetch Registrations Audit Trail for Admin with multi-filter support
   */
  async getRegistrationsList({ query = '', statusFilter = 'all', sportFilter = 'all' } = {}) {
    if (!isSupabaseConfigured) {
      const stored = registrationService._getStoredRegistrations();
      return stored.filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (sportFilter !== 'all' && r.event?.sport_id !== sportFilter && r.event?.sport_name?.toLowerCase() !== sportFilter.toLowerCase()) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          return (
            r.registration_number?.toLowerCase().includes(q) ||
            r.team_name?.toLowerCase().includes(q) ||
            r.captain_name?.toLowerCase().includes(q) ||
            r.event?.title?.toLowerCase().includes(q)
          );
        }
        return true;
      });
    }

    try {
      let q = supabase.from('event_registrations').select('*, event:events(*), participants:registration_participants(*)').order('created_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (query.trim()) q = q.or(`registration_number.ilike.%${query}%,team_name.ilike.%${query}%`);
      const { data } = await q.limit(50);
      return data || [];
    } catch (err) {
      return registrationService._getStoredRegistrations();
    }
  },

  /**
   * Fetch Payments Audit Trail for Admin
   */
  async getPaymentsList({ query = '', statusFilter = 'all' } = {}) {
    if (!isSupabaseConfigured) {
      const list = [
        { id: 'pay_1', registration_id: 'reg_1', razorpay_order_id: 'order_kas_1001', razorpay_payment_id: 'pay_rzp_9921', amount: 499, currency: 'INR', status: 'captured', paid_at: new Date().toISOString() },
        { id: 'pay_2', registration_id: 'reg_2', razorpay_order_id: 'order_kas_1002', razorpay_payment_id: 'pay_rzp_9922', amount: 250, currency: 'INR', status: 'captured', paid_at: new Date().toISOString() },
      ];
      return list.filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          return p.razorpay_order_id?.toLowerCase().includes(q) || p.razorpay_payment_id?.toLowerCase().includes(q);
        }
        return true;
      });
    }

    try {
      let q = supabase.from('payments').select('*, registration:event_registrations(*)').order('created_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (query.trim()) q = q.or(`razorpay_order_id.ilike.%${query}%,razorpay_payment_id.ilike.%${query}%`);
      const { data } = await q.limit(50);
      return data || [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Fetch Audit Logs History
   */
  async getAuditLogs() {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredAuditLogs();
      return stored.length > 0
        ? stored
        : [
            { id: 'log_1', action: 'APPROVE_ORGANIZER', target_type: 'organizer_application', target_id: 'app_101', details_json: { status: 'approved' }, created_at: new Date().toISOString() },
            { id: 'log_2', action: 'PUBLISH_EVENT', target_type: 'event', target_id: 'evt_201', details_json: { status: 'published' }, created_at: new Date().toISOString() },
          ];
    }

    try {
      const { data } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    } catch (err) {
      return this._getStoredAuditLogs();
    }
  },

  /**
   * Fetch Reports Data (District Activity & Sports Distribution)
   */
  async getReportsData() {
    const allRes = await eventService.getEvents({ limit: 100 });
    const events = allRes.events || [];

    const districtCounts = {};
    const sportCounts = {};

    events.forEach((evt) => {
      const dName = evt.district_name || evt.city_name || 'Coimbatore';
      const sName = evt.sport_name || 'Football';

      districtCounts[dName] = (districtCounts[dName] || 0) + 1;
      sportCounts[sName] = (sportCounts[sName] || 0) + 1;
    });

    return {
      districts: Object.entries(districtCounts).map(([name, count]) => ({ name, count })),
      sports: Object.entries(sportCounts).map(([name, count]) => ({ name, count })),
    };
  },

  async _logAudit(adminUserId, action, targetType, targetId, detailsJson = {}) {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      admin_user_id: adminUserId || 'admin_system',
      action,
      target_type: targetType,
      target_id: targetId,
      details_json: detailsJson,
      created_at: new Date().toISOString(),
    };

    const logs = this._getStoredAuditLogs();
    logs.unshift(entry);
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(logs));

    if (isSupabaseConfigured && adminUserId) {
      try {
        const isValidUuid = typeof adminUserId === 'string' && /^[0-9a-fA-F-]{36}$/.test(adminUserId);
        await supabase.from('admin_audit_logs').insert({
          admin_user_id: isValidUuid ? adminUserId : null,
          action,
          target_type: targetType,
          target_id: targetId,
          details_json: detailsJson,
        });
      } catch (e) {
        console.warn('Supabase audit log write warning:', e.message);
      }
    }
  },

  _getStoredApplications() {
    try {
      const stored = localStorage.getItem(LOCAL_ADMIN_APPS_KEY);
      if (stored) return JSON.parse(stored);

      const initialApps = [
        {
          id: 'app_101',
          user_id: 'usr_org_app_1',
          organization_name: 'Trichy United Sports Club',
          organization_type: 'Sports Club',
          city_name: 'Tiruchirappalli',
          district_name: 'Tiruchirappalli',
          sports_handled: ['Football', 'Cricket'],
          experience_years: '3-5 years',
          phone: '+91 94431 88990',
          email: 'contact@trichysports.org',
          aadhaar_number: '5421 8839 2011',
          aadhaar_holder_name: 'Karthikeyan Subramaniam',
          aadhaar_doc_url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=80',
          live_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          is_phone_verified: true,
          is_live_photo_verified: true,
          is_aadhaar_verified: true,
          status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'app_102',
          user_id: 'usr_org_app_2',
          organization_name: 'Erode District Badminton Guild',
          organization_type: 'Academy',
          city_name: 'Erode',
          district_name: 'Erode',
          sports_handled: ['Badminton'],
          experience_years: '5+ years',
          phone: '+91 98427 11223',
          email: 'admin@erodeshuttles.in',
          aadhaar_number: '7890 1234 5678',
          aadhaar_holder_name: 'Venkatesh Ramanathan',
          aadhaar_doc_url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=80',
          live_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
          is_phone_verified: true,
          is_live_photo_verified: true,
          is_aadhaar_verified: true,
          status: 'pending',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 'app_103',
          user_id: 'usr_org_1',
          organization_name: 'Coimbatore District Badminton Association',
          organization_type: 'Association',
          city_name: 'Coimbatore',
          district_name: 'Coimbatore',
          sports_handled: ['Badminton'],
          experience_years: '10+ years',
          phone: '+91 98422 12345',
          email: 'contact@cdba.in',
          aadhaar_number: '9920 4410 8823',
          aadhaar_holder_name: 'Senthil Kumar Balaji',
          aadhaar_doc_url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=80',
          live_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
          is_phone_verified: true,
          is_live_photo_verified: true,
          is_aadhaar_verified: true,
          status: 'approved',
          created_at: '2026-01-10T10:00:00Z',
        },
      ];
      localStorage.setItem(LOCAL_ADMIN_APPS_KEY, JSON.stringify(initialApps));
      return initialApps;
    } catch (e) {
      return [];
    }
  },

  _getStoredEvents() {
    try {
      const stored = localStorage.getItem(LOCAL_ADMIN_EVENTS_KEY);
      if (stored) return JSON.parse(stored);

      const initialEvents = MOCK_EVENTS.map((e, idx) => ({
        ...e,
        organizer_name: e.organizer?.organization_name || 'Verified Sports Club',
        status: idx === 0 ? 'published' : idx === 1 ? 'pending_review' : idx === 2 ? 'pending_review' : idx === 3 ? 'changes_requested' : idx === 4 ? 'draft' : 'published',
        changes_requested_reason: idx === 3 ? 'Please clarify tournament registration fee structure and upload venue schedule.' : undefined,
      }));
      localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(initialEvents));
      return initialEvents;
    } catch (e) {
      return [];
    }
  },

  _getStoredAuditLogs() {
    try {
      const stored = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
};
