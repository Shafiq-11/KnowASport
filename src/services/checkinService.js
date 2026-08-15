import { supabase, isSupabaseConfigured } from './supabase.js';
import { registrationService } from './registrationService.js';
import { eventService } from './eventService.js';

const LOCAL_CHECKINS_KEY = 'kas_mock_checkins_v1';

export const checkinService = {
  /**
   * Get all events managed by an organizer
   */
  async getOrganizerEvents(userId) {
    if (!userId) return [];

    const allRes = await eventService.getEvents({ limit: 100 });
    const events = allRes.events || [];

    // Attach check-in summary counts to each event
    const eventsWithStats = await Promise.all(
      events.map(async (evt) => {
        const stats = await this.getEventCheckinStats(evt.id, userId);
        return {
          ...evt,
          stats,
        };
      })
    );

    return eventsWithStats;
  },

  /**
   * Get check-in statistics for an event
   */
  async getEventCheckinStats(eventId, userId) {
    if (!eventId) return { total: 0, checkedIn: 0, remaining: 0, pendingPayment: 0, cancelled: 0 };

    if (!isSupabaseConfigured) {
      const storedRegs = registrationService._getStoredRegistrations();
      const eventRegs = storedRegs.filter((r) => r.event_id === eventId);
      const total = eventRegs.length;
      const checkedIn = eventRegs.filter((r) => r.checkin_status === 'checked_in').length;
      const cancelled = eventRegs.filter((r) => r.status === 'cancelled').length;
      const pendingPayment = eventRegs.filter((r) => r.payment_status === 'pending' && r.status !== 'cancelled').length;
      const remaining = total - checkedIn - cancelled;

      return { total, checkedIn, remaining: Math.max(0, remaining), pendingPayment, cancelled };
    }

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('status, payment_status, checkin_status')
        .eq('event_id', eventId);

      if (error) throw error;

      const regs = data || [];
      const total = regs.length;
      const checkedIn = regs.filter((r) => r.checkin_status === 'checked_in').length;
      const cancelled = regs.filter((r) => r.status === 'cancelled').length;
      const pendingPayment = regs.filter((r) => r.payment_status === 'pending' && r.status !== 'cancelled').length;
      const remaining = Math.max(0, total - checkedIn - cancelled);

      return { total, checkedIn, remaining, pendingPayment, cancelled };
    } catch (err) {
      console.warn('Supabase check-in stats query fallback:', err.message);
      return { total: 0, checkedIn: 0, remaining: 0, pendingPayment: 0, cancelled: 0 };
    }
  },

  /**
   * Verify QR token or Manual Pass Code / Registration Number
   * Safe for venue verification without exposing sensitive athlete PII.
   */
  async verifyRegistrationCode({ eventId, codeOrToken, userId }) {
    if (!codeOrToken || !eventId) {
      return { status: 'INVALID', message: 'No registration pass code provided.' };
    }

    const cleanInput = codeOrToken.trim().toUpperCase();

    // 1. Fetch Registration Record
    let registration = null;

    if (!isSupabaseConfigured) {
      const stored = registrationService._getStoredRegistrations();
      registration = stored.find((r) => {
        const passCode = (r.pass_code || ('KAS' + (r.id.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || '7X92P'))).toUpperCase();
        const regNum = (r.registration_number || '').toUpperCase();
        const qrTok = (r.qr_token || `KAS-QR-${passCode}-${regNum.replace(/[^0-9]/g, '')}`).toUpperCase();
        const legacyTok = `KAS-V-${r.id}`.toUpperCase();

        return (
          passCode === cleanInput ||
          regNum === cleanInput ||
          qrTok === cleanInput ||
          legacyTok === cleanInput
        );
      });
    } else {
      try {
        const { data, error } = await supabase
          .from('event_registrations')
          .select(`
            id,
            registration_number,
            pass_code,
            qr_token,
            event_id,
            participation_type,
            team_name,
            team_size,
            status,
            payment_status,
            checkin_status,
            checked_in_at,
            created_at,
            event:events(id, title, sport_name, check_in_required, venue_name, city_name),
            participants:registration_participants(id, full_name, player_role, player_number)
          `)
          .or(`pass_code.eq.${cleanInput},registration_number.eq.${cleanInput},qr_token.eq.${cleanInput}`)
          .maybeSingle();

        if (!error && data) registration = data;
      } catch (e) {
        console.warn('Supabase code lookup warning:', e.message);
      }
    }

    // 2. Perform Validation Rules
    if (!registration) {
      return {
        status: 'INVALID',
        message: 'Registration Not Found. Verify the pass code and try again.',
      };
    }

    // Check Event Match (Reject cross-event check-ins)
    if (registration.event_id !== eventId && registration.event?.id !== eventId) {
      return {
        status: 'WRONG_EVENT',
        registration,
        message: 'This registration is not valid for this event.',
      };
    }

    // Check if Event Has Check-In Enabled
    if (registration.event?.check_in_required === false) {
      return {
        status: 'NOT_REQUIRED',
        registration,
        message: 'Check-in is not required for this event. Direct entry is confirmed.',
      };
    }

    // Check Registration Status
    if (registration.status === 'cancelled') {
      return {
        status: 'CANCELLED',
        registration,
        message: 'This registration has been cancelled and is no longer valid.',
      };
    }

    // Check Payment Status
    if (registration.total_fee > 0 && registration.payment_status === 'pending') {
      return {
        status: 'PAYMENT_REQUIRED',
        registration,
        message: 'Payment has not been completed. Entry requires confirmed status.',
      };
    }

    // Check if Already Checked In (Prevent duplicate check-in)
    if (registration.checkin_status === 'checked_in') {
      const checkinTime = registration.checked_in_at
        ? new Date(registration.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Earlier';
      return {
        status: 'ALREADY_CHECKED_IN',
        registration,
        message: `Already Checked In at ${checkinTime}.`,
      };
    }

    // Valid & Ready for Check-in
    return {
      status: 'VALID',
      registration,
      message: 'Registration pass verified. Ready for check-in confirmation.',
    };
  },

  /**
   * Confirm check-in for a verified registration
   */
  async confirmCheckin({ eventId, registrationId, userId }) {
    const checkedInAt = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const storedRegs = registrationService._getStoredRegistrations();
      const updatedRegs = storedRegs.map((r) =>
        r.id === registrationId
          ? { ...r, checkin_status: 'checked_in', checked_in_at: checkedInAt }
          : r
      );
      localStorage.setItem('kas_mock_registrations_v1', JSON.stringify(updatedRegs));

      const logEntry = {
        id: `chk_${Date.now()}`,
        registration_id: registrationId,
        event_id: eventId,
        checked_in_by: userId,
        checked_in_at: checkedInAt,
        registration: updatedRegs.find((r) => r.id === registrationId),
      };

      const storedLogs = this._getStoredCheckinLogs();
      storedLogs.unshift(logEntry);
      localStorage.setItem(LOCAL_CHECKINS_KEY, JSON.stringify(storedLogs));

      return logEntry;
    }

    try {
      // Atomic Update
      const { data: reg, error: regErr } = await supabase
        .from('event_registrations')
        .update({ checkin_status: 'checked_in', checked_in_at: checkedInAt })
        .eq('id', registrationId)
        .select()
        .single();

      if (regErr) throw regErr;

      // Insert Check-in Log
      const { data: log, error: logErr } = await supabase
        .from('registration_checkins')
        .insert({
          registration_id: registrationId,
          event_id: eventId,
          checked_in_by: userId,
          checked_in_at: checkedInAt,
          verification_token: reg.pass_code || reg.qr_token || reg.registration_number,
        })
        .select()
        .single();

      if (logErr) console.warn('Supabase checkin log warning:', logErr.message);

      return { ...log, registration: reg };
    } catch (err) {
      console.error('Confirm checkin error:', err);
      throw new Error(err.message || 'Check-in failed. Please try again.');
    }
  },

  /**
   * Fetch recent check-ins for the event feed
   */
  async getRecentCheckins(eventId, userId) {
    if (!eventId) return [];

    if (!isSupabaseConfigured) {
      const storedLogs = this._getStoredCheckinLogs();
      return storedLogs.filter((l) => l.event_id === eventId).slice(0, 10);
    }

    try {
      const { data, error } = await supabase
        .from('registration_checkins')
        .select(`
          *,
          registration:event_registrations(id, registration_number, pass_code, participation_type, team_name, participants:registration_participants(id, full_name, player_role))
        `)
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase recent checkins fetch warning:', err.message);
      const storedLogs = this._getStoredCheckinLogs();
      return storedLogs.filter((l) => l.event_id === eventId).slice(0, 10);
    }
  },

  _getStoredCheckinLogs() {
    try {
      const stored = localStorage.getItem(LOCAL_CHECKINS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
};
