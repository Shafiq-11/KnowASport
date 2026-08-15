import { supabase, isSupabaseConfigured } from './supabase.js';

const LOCAL_NOTIFICATIONS_KEY = 'kas_mock_notifications_v1';

export const notificationService = {
  /**
   * Get user notifications
   */
  async getUserNotifications(userId, { limit = 20 } = {}) {
    if (!userId) return [];

    if (!isSupabaseConfigured) {
      const stored = this._getStoredNotifications();
      let userList = stored.filter((n) => n.user_id === userId || n.user_id === 'all_users');
      
      // Seed default initial notifications if empty for dev
      if (userList.length === 0) {
        userList = this._seedInitialNotifications(userId);
      }

      return userList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase notifications query fallback:', err.message);
      const stored = this._getStoredNotifications();
      return stored.filter((n) => n.user_id === userId).slice(0, limit);
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    if (!userId) return 0;

    if (!isSupabaseConfigured) {
      const list = await this.getUserNotifications(userId);
      return list.filter((n) => !n.read).length;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      const list = await this.getUserNotifications(userId);
      return list.filter((n) => !n.read).length;
    }
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId, userId) {
    if (!notificationId) return;

    if (!isSupabaseConfigured) {
      const stored = this._getStoredNotifications();
      const updated = stored.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      const stored = this._getStoredNotifications();
      const updated = stored.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return true;
    }
  },

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    if (!userId) return;

    if (!isSupabaseConfigured) {
      const stored = this._getStoredNotifications();
      const updated = stored.map((n) => (n.user_id === userId || n.user_id === 'all_users' ? { ...n, read: true } : n));
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (err) {
      const stored = this._getStoredNotifications();
      const updated = stored.map((n) => (n.user_id === userId ? { ...n, read: true } : n));
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return true;
    }
  },

  /**
   * Create a new notification
   */
  async createNotification({ userId, type, title, message, relatedType = null, relatedId = null }) {
    if (!userId || !title || !message) return null;

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      type,
      title,
      message,
      read: false,
      related_type: relatedType,
      related_id: relatedId,
      created_at: new Date().toISOString(),
    };

    const stored = this._getStoredNotifications();
    
    // Idempotency / Duplicate Prevention Check (same type & relatedId within 1 minute)
    const isDuplicate = stored.some(
      (n) => n.user_id === userId && n.type === type && n.related_id === relatedId && (Date.now() - new Date(n.created_at).getTime() < 60000)
    );
    if (isDuplicate) return null;

    stored.unshift(notification);
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(stored));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          type,
          title,
          message,
          read: false,
          related_type: relatedType,
          related_id: relatedId,
        });
      } catch (e) {
        console.warn('Supabase notification create warning:', e.message);
      }
    }

    return notification;
  },

  _getStoredNotifications() {
    try {
      const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  _seedInitialNotifications(userId) {
    const defaultNotifs = [
      {
        id: `notif_seed_1_${userId}`,
        user_id: userId,
        type: 'registration_confirmed',
        title: 'Registration Confirmed',
        message: 'Your registration for Coimbatore Open Badminton Championship 2026 is confirmed.',
        read: false,
        related_type: 'event',
        related_id: 'coimbatore-open-badminton-championship-2026',
        created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: `notif_seed_2_${userId}`,
        user_id: userId,
        type: 'payment_success',
        title: 'Payment Successful',
        message: 'Payment of ₹500 for Coimbatore Open Badminton Championship was captured successfully.',
        read: false,
        related_type: 'registration',
        related_id: 'reg_1',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: `notif_seed_3_${userId}`,
        user_id: userId,
        type: 'checkin_information',
        title: 'QR Ticket Ready for Entry',
        message: 'Check-in is required at Nehru Stadium courts. Show your digital QR pass at reporting desk.',
        read: true,
        related_type: 'event',
        related_id: 'coimbatore-open-badminton-championship-2026',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];

    const stored = this._getStoredNotifications();
    const merged = [...defaultNotifs, ...stored];
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(merged));
    return defaultNotifs;
  },
};
