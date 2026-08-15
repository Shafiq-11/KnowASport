import { supabase, isSupabaseConfigured } from './supabase.js';
import { eventService } from './eventService.js';
import { registrationService } from './registrationService.js';

const LOCAL_ADMIN_APPS_KEY = 'kas_mock_organizer_apps_v1';
const LOCAL_ADMIN_EVENTS_KEY = 'kas_mock_organizer_events_v1';
const LOCAL_AUDIT_LOGS_KEY = 'kas_mock_audit_logs_v1';

export const adminService = {
  /**
   * Get Platform Overview Metrics with authoritative financial terminology
   */
  async getPlatformMetrics() {
    const allEventsRes = await eventService.getEvents({ limit: 100 });
    const events = allEventsRes.events || [];
    const pendingApps = await this.getPendingApplications();
    const pendingEvents = await this.getPendingEvents();

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
    const publishedEvents = events.filter((e) => e.status === 'published').length;
    const draftEvents = events.filter((e) => e.status === 'draft').length;
    const upcomingEvents = events.filter((e) => new Date(e.start_date) >= new Date() && e.status === 'published').length;

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
      pendingEventsCount: pendingEvents.filter((e) => e.status === 'pending_review').length,
    };
  },

  /**
   * Get all pending organizer applications
   */
  async getPendingApplications() {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredApplications();
      return stored.filter((a) => a.status === 'pending' || a.status === 'under_review');
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
   * Approve Organizer Application
   */
  async approveOrganizerApplication(appId, adminUser) {
    const reviewedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'APPROVE_ORGANIZER', 'organizer_application', appId, { status: 'approved' });

    if (!isSupabaseConfigured) {
      const stored = this._getStoredApplications();
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

      // FIXED: verification_status = 'verified' matching DB check constraint IN ('pending', 'verified', 'rejected', 'suspended')
      await supabase.from('organizers').upsert({
        user_id: app.user_id,
        organization_name: app.organization_name,
        organization_type: app.organization_type,
        city_name: app.city_name,
        district_name: app.district_name,
        verification_status: 'verified',
      });

      return true;
    } catch (err) {
      console.error('Approve application error:', err);
      throw new Error(err.message || 'Could not approve application.');
    }
  },

  /**
   * Reject Organizer Application with reason
   */
  async rejectOrganizerApplication(appId, reason, adminUser) {
    if (!reason || !reason.trim()) throw new Error('Rejection reason required.');
    const reviewedAt = new Date().toISOString();
    await this._logAudit(adminUser?.id, 'REJECT_ORGANIZER', 'organizer_application', appId, { reason });

    if (!isSupabaseConfigured) {
      const stored = this._getStoredApplications();
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
   * Get events pending admin approval (status = pending_review)
   */
  async getPendingEvents() {
    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      return stored.filter((e) => e.status === 'pending_review' || e.status === 'draft');
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      const stored = this._getStoredEvents();
      return stored;
    }
  },

  /**
   * Approve & Publish Event (status: pending_review -> published)
   */
  async approveEvent(eventId, adminUser) {
    await this._logAudit(adminUser?.id, 'PUBLISH_EVENT', 'event', eventId, { status: 'published' });

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      const updated = stored.map((e) => (e.id === eventId ? { ...e, status: 'published' } : e));
      localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Approve event error:', err);
      throw new Error(err.message || 'Could not publish event.');
    }
  },

  /**
   * Reject Event with reason
   */
  async rejectEvent(eventId, reason, adminUser) {
    if (!reason || !reason.trim()) throw new Error('Rejection reason required.');
    await this._logAudit(adminUser?.id, 'REJECT_EVENT', 'event', eventId, { reason });

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      const updated = stored.map((e) =>
        e.id === eventId ? { ...e, status: 'rejected', rejection_reason: reason } : e
      );
      localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      // FIXED: Populate rejection_reason matching DB schema
      const { error } = await supabase
        .from('events')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Reject event error:', err);
      return false;
    }
  },

  /**
   * Request Changes for Event
   */
  async requestEventChanges(eventId, reason, adminUser) {
    if (!reason || !reason.trim()) throw new Error('Reason required.');
    await this._logAudit(adminUser?.id, 'REQUEST_EVENT_CHANGES', 'event', eventId, { reason });

    if (!isSupabaseConfigured) {
      const stored = this._getStoredEvents();
      const updated = stored.map((e) =>
        e.id === eventId ? { ...e, status: 'changes_requested', changes_requested_reason: reason } : e
      );
      localStorage.setItem(LOCAL_ADMIN_EVENTS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'changes_requested', changes_requested_reason: reason })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Request changes error:', err);
      return false;
    }
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
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  _getStoredEvents() {
    try {
      const stored = localStorage.getItem(LOCAL_ADMIN_EVENTS_KEY);
      return stored ? JSON.parse(stored) : [];
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
