import { supabase, isSupabaseConfigured } from './supabase.js';
import { eventService } from './eventService.js';
import { notificationService } from './notificationService.js';
import { parseDateSafe } from '../utils/formatters.js';

const LOCAL_REGISTRATIONS_KEY = 'kas_mock_registrations_v1';

/**
 * Generate human-friendly 8-character pass code (e.g. KAS7X92P)
 */
export function generatePassCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous characters 0, O, 1, I
  let code = 'KAS';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Normalize and enrich registration records with pass_code and qr_token
 */
function enrichRegistration(reg) {
  if (!reg) return null;
  const passCode = reg.pass_code || ('KAS' + (reg.id.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || '7X92P'));
  const regNum = reg.registration_number || `KAS-2026-${reg.id.slice(-6)}`;
  const qrToken = reg.qr_token || `KAS-QR-${passCode}-${regNum.replace(/[^0-9]/g, '').slice(-6)}`;

  return {
    ...reg,
    pass_code: passCode,
    qr_token: qrToken,
    registration_number: regNum,
  };
}

export const registrationService = {
  /**
   * Create a new registration (Individual or Team)
   */
  async createRegistration({ eventId, participationType = 'individual', teamName = '', teamSize = 1, participants = [], user }) {
    if (!user) {
      throw new Error('User must be logged in to register for an event.');
    }

    // 1. Fetch Authoritative Event Data
    const allRes = await eventService.getEvents({ limit: 100 });
    const event = allRes.events.find((e) => e.id === eventId || e.slug === eventId);

    if (!event) {
      throw new Error('Event not found.');
    }

    if (event.status !== 'published') {
      throw new Error('This event is not open for registration.');
    }

    // Check deadline using safe IST date parsing
    const now = new Date();
    const deadline = parseDateSafe(event.registration_deadline, true);
    if (deadline && now > deadline) {
      throw new Error('Registration for this event has closed.');
    }

    // Check capacity
    if (event.max_participants && event.current_participants >= event.max_participants) {
      throw new Error('This event has reached maximum capacity.');
    }

    // Authoritative Participation Type Enforcement
    const authoritativeType = (event.participation_type || 'individual').toLowerCase();
    const requestedType = (participationType || authoritativeType).toLowerCase();

    if (requestedType !== authoritativeType) {
      throw new Error(`This event only accepts ${authoritativeType} registrations.`);
    }

    // 2. Check for Duplicate Registration
    const existing = await this.getUserRegistrations(user.id);
    const alreadyRegistered = existing.some((r) => r.event_id === event.id && r.status !== 'cancelled');
    if (alreadyRegistered) {
      const dup = existing.find((r) => r.event_id === event.id && r.status !== 'cancelled');
      const err = new Error('You are already registered for this event.');
      err.existingRegistrationId = dup?.id;
      throw err;
    }

    // 3. Determine Pricing & Status
    const isFree = !event.entry_fee || Number(event.entry_fee) === 0;
    const registrationStatus = isFree ? 'confirmed' : 'pending_payment';
    const paymentStatus = isFree ? 'not_required' : 'pending';
    const totalFee = Number(event.entry_fee || 0);

    // 4. Generate Registration Number, Pass Code & QR Token
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const regNumber = `KAS-2026-${randomCode}`;
    const passCode = generatePassCode();
    const qrToken = `KAS-QR-${passCode}-${randomCode}`;

    if (!isSupabaseConfigured) {
      // Dev Fallback Registration Storage
      const newReg = {
        id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        registration_number: regNumber,
        pass_code: passCode,
        qr_token: qrToken,
        event_id: event.id,
        event: event,
        user_id: user.id,
        participation_type: participationType,
        team_name: teamName || null,
        team_size: teamSize,
        status: registrationStatus,
        payment_status: paymentStatus,
        total_fee: totalFee,
        currency: 'INR',
        participants: participants.map((p, idx) => ({
          id: `part_${Date.now()}_${idx}`,
          full_name: p.full_name,
          date_of_birth: p.date_of_birth || null,
          gender: p.gender || 'male',
          phone: p.phone || '',
          email: p.email || '',
          city_name: p.city_name || event.city_name,
          player_role: idx === 0 ? (participationType === 'team' ? 'captain' : 'individual') : 'member',
          player_number: idx + 1,
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stored = this._getStoredRegistrations();
      stored.unshift(newReg);
      localStorage.setItem(LOCAL_REGISTRATIONS_KEY, JSON.stringify(stored));

      // Trigger notifications for free/confirmed registration
      if (isFree) {
        await notificationService.createNotification({
          userId: user.id,
          type: 'registration_confirmed',
          title: 'Registration Confirmed',
          message: `Your registration for ${event.title} is confirmed. Pass Code: ${passCode}`,
          relatedType: 'event',
          relatedId: event.slug || event.id,
        });

        if (event.check_in_required !== false) {
          await notificationService.createNotification({
            userId: user.id,
            type: 'checkin_information',
            title: 'QR Registration Pass Ready',
            message: `Check-in required for ${event.title}. Present your QR code or Pass Code (${passCode}) at entry.`,
            relatedType: 'event',
            relatedId: event.slug || event.id,
          });
        }
      }

      return newReg;
    }

    try {
      // Insert Registration
      const { data: reg, error: regErr } = await supabase
        .from('event_registrations')
        .insert({
          registration_number: regNumber,
          pass_code: passCode,
          qr_token: qrToken,
          event_id: event.id,
          user_id: user.id,
          participation_type: participationType,
          team_name: teamName || null,
          team_size: teamSize,
          status: registrationStatus,
          payment_status: paymentStatus,
          total_fee: totalFee,
        })
        .select()
        .single();

      if (regErr) throw regErr;

      // Insert Participants
      const participantRows = participants.map((p, idx) => ({
        registration_id: reg.id,
        full_name: p.full_name,
        date_of_birth: p.date_of_birth || null,
        gender: p.gender || 'male',
        phone: p.phone || null,
        email: p.email || null,
        city_name: p.city_name || event.city_name,
        player_role: idx === 0 ? (participationType === 'team' ? 'captain' : 'individual') : 'member',
        player_number: idx + 1,
      }));

      const { error: partErr } = await supabase
        .from('registration_participants')
        .insert(participantRows);

      if (partErr) console.warn('Supabase participants insert warning:', partErr.message);

      return enrichRegistration({ ...reg, event, participants: participantRows });
    } catch (err) {
      console.error('Supabase registration insert error:', err);
      throw new Error(err.message || 'Could not complete registration. Please try again.');
    }
  },

  /**
   * Fetch all registrations for a specific user
   */
  async getUserRegistrations(userId) {
    if (!userId) return [];

    if (!isSupabaseConfigured) {
      const stored = this._getStoredRegistrations();
      return stored.filter((r) => r.user_id === userId).map(enrichRegistration);
    }

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          event:events(*),
          participants:registration_participants(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(enrichRegistration);
    } catch (err) {
      console.warn('Supabase user registrations fetch warning:', err.message);
      const stored = this._getStoredRegistrations();
      return stored.filter((r) => r.user_id === userId).map(enrichRegistration);
    }
  },

  /**
   * Fetch single registration details by ID (Strict User Ownership Enforced)
   */
  async getRegistrationById(registrationId, userId) {
    if (!registrationId || !userId) return null;

    if (!isSupabaseConfigured) {
      const stored = this._getStoredRegistrations();
      const found = stored.find((r) => r.id === registrationId && r.user_id === userId);
      return found ? enrichRegistration(found) : null;
    }

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          event:events(*, organizer:organizers(*)),
          participants:registration_participants(*)
        `)
        .eq('id', registrationId)
        .eq('user_id', userId)
        .single();

      if (error || !data) throw error || new Error('Registration not found or access denied.');
      return enrichRegistration(data);
    } catch (err) {
      console.warn('Supabase registration detail fetch warning:', err.message);
      const stored = this._getStoredRegistrations();
      const found = stored.find((r) => r.id === registrationId && r.user_id === userId);
      return found ? enrichRegistration(found) : null;
    }
  },

  /**
   * Cancel registration
   */
  async cancelRegistration(registrationId, userId) {
    if (!registrationId || !userId) return false;

    if (!isSupabaseConfigured) {
      const stored = this._getStoredRegistrations();
      const updated = stored.map((r) =>
        r.id === registrationId && r.user_id === userId
          ? { ...r, status: 'cancelled', updated_at: new Date().toISOString() }
          : r
      );
      localStorage.setItem(LOCAL_REGISTRATIONS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', registrationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Cancel registration error:', err.message);
      return false;
    }
  },

  _getStoredRegistrations() {
    try {
      const stored = localStorage.getItem(LOCAL_REGISTRATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
};
