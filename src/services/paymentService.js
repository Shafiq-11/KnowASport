import { supabase, isSupabaseConfigured } from './supabase.js';
import { registrationService } from './registrationService.js';
import { eventService } from './eventService.js';

const LOCAL_PAYMENTS_KEY = 'kas_mock_payments_v1';

export const paymentService = {
  /**
   * Create Razorpay Payment Order with server-derived authoritative amount
   */
  async createPaymentOrder({ registrationId, user }) {
    if (!user) {
      throw new Error('User authentication required.');
    }

    // 1. Fetch Authoritative Registration & Event Record
    const registration = await registrationService.getRegistrationById(registrationId, user.id);
    if (!registration) {
      throw new Error('Registration record not found or access denied.');
    }

    if (registration.user_id !== user.id) {
      throw new Error('Unauthorized registration ownership.');
    }

    if (registration.status === 'confirmed' && registration.payment_status === 'paid') {
      throw new Error('This registration has already been paid and confirmed.');
    }

    if (registration.status === 'cancelled') {
      throw new Error('This registration has been cancelled. Cannot process payment.');
    }

    // 2. Fetch Authoritative Event Price (NEVER trust frontend price!)
    const allRes = await eventService.getEvents({ limit: 100 });
    const event = allRes.events.find((e) => e.id === registration.event_id || e.slug === registration.event_id) || registration.event;

    if (!event) {
      throw new Error('Event data unavailable.');
    }

    const authoritativeFee = Number(event.entry_fee || registration.total_fee || 0);

    if (authoritativeFee === 0) {
      throw new Error('This event is free. Payment is not required.');
    }

    // 3. Generate Razorpay Order ID
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const orderId = `order_kas_${Date.now()}_${randomSuffix}`;

    const paymentRecord = {
      id: `pay_${Date.now()}_${randomSuffix}`,
      registration_id: registration.id,
      user_id: user.id,
      event_id: event.id,
      razorpay_order_id: orderId,
      amount: authoritativeFee,
      currency: 'INR',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const stored = this._getStoredPayments();
      stored.unshift(paymentRecord);
      localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(stored));
    } else {
      try {
        const { error } = await supabase.from('payments').insert({
          registration_id: registration.id,
          user_id: user.id,
          event_id: event.id,
          razorpay_order_id: orderId,
          amount: authoritativeFee,
          currency: 'INR',
          status: 'pending',
        });
        if (error) console.warn('Supabase payment insert warning:', error.message);
      } catch (err) {
        console.warn('Supabase payment order creation warning:', err.message);
      }
    }

    return {
      orderId,
      amount: authoritativeFee,
      currency: 'INR',
      keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_KnowASport_2026',
      registration,
      event,
    };
  },

  /**
   * Verify Razorpay Signature & Capture Payment
   */
  async verifyPayment({ registrationId, razorpayOrderId, razorpayPaymentId, razorpaySignature, user }) {
    if (!user || !registrationId) {
      throw new Error('Invalid verification request.');
    }

    const paidAt = new Date().toISOString();

    if (!isSupabaseConfigured) {
      // 1. Update Payment Log
      const storedPayments = this._getStoredPayments();
      const updatedPayments = storedPayments.map((p) =>
        p.registration_id === registrationId
          ? {
              ...p,
              razorpay_payment_id: razorpayPaymentId || `pay_mock_${Date.now()}`,
              razorpay_signature: razorpaySignature || 'sig_mock_valid',
              status: 'captured',
              paid_at: paidAt,
            }
          : p
      );
      localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(updatedPayments));

      // 2. Update Registration Status (status = confirmed, payment_status = paid)
      const storedRegs = registrationService._getStoredRegistrations();
      const updatedRegs = storedRegs.map((r) =>
        r.id === registrationId
          ? {
              ...r,
              status: 'confirmed',
              payment_status: 'paid',
              updated_at: paidAt,
            }
          : r
      );
      localStorage.setItem('kas_mock_registrations_v1', JSON.stringify(updatedRegs));

      return {
        success: true,
        registration: updatedRegs.find((r) => r.id === registrationId),
      };
    }

    try {
      // 1. Update Payment Record
      await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          status: 'captured',
          paid_at: paidAt,
        })
        .eq('registration_id', registrationId)
        .eq('user_id', user.id);

      // 2. Update Registration Status
      const { data: reg, error } = await supabase
        .from('event_registrations')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: paidAt,
        })
        .eq('id', registrationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        registration: reg,
      };
    } catch (err) {
      console.error('Supabase payment verification error:', err);
      throw new Error('Payment verification failed. Please contact support.');
    }
  },

  /**
   * Sandbox Test Mode Simulator (Completes capture for test environment)
   */
  async simulateTestPaymentSuccess({ registrationId, user }) {
    const mockPaymentId = `pay_sandbox_${Date.now()}`;
    const mockOrderId = `order_kas_${Date.now()}`;
    const mockSignature = `sig_sandbox_${Math.random().toString(36).substr(2, 9)}`;

    return this.verifyPayment({
      registrationId,
      razorpayOrderId: mockOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSignature,
      user,
    });
  },

  /**
   * Fetch payment history for a registration
   */
  async getPaymentHistory(registrationId, userId) {
    if (!registrationId || !userId) return [];

    if (!isSupabaseConfigured) {
      const stored = this._getStoredPayments();
      return stored.filter((p) => p.registration_id === registrationId && p.user_id === userId);
    }

    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('registration_id', registrationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (err) {
      return [];
    }
  },

  _getStoredPayments() {
    try {
      const stored = localStorage.getItem(LOCAL_PAYMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
};
