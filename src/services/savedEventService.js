import { supabase, isSupabaseConfigured } from './supabase.js';

const LOCAL_SAVED_KEY = 'kas_mock_saved_events_v1';

export const savedEventService = {
  /**
   * Get all saved event IDs for the current user
   */
  async getSavedEventIds(userId) {
    if (!userId) return [];

    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem(`${LOCAL_SAVED_KEY}_${userId}`);
        return stored ? JSON.parse(stored) : ['evt-1', 'evt-2'];
      } catch (e) {
        return [];
      }
    }

    try {
      const { data, error } = await supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map((row) => row.event_id);
    } catch (err) {
      console.warn('Supabase saved events fetch failed:', err.message);
      return [];
    }
  },

  /**
   * Save an event for the user
   */
  async saveEvent(userId, eventId) {
    if (!userId || !eventId) return false;

    if (!isSupabaseConfigured) {
      const current = await this.getSavedEventIds(userId);
      if (!current.includes(eventId)) {
        const updated = [...current, eventId];
        localStorage.setItem(`${LOCAL_SAVED_KEY}_${userId}`, JSON.stringify(updated));
      }
      return true;
    }

    try {
      const { error } = await supabase
        .from('saved_events')
        .insert({ user_id: userId, event_id: eventId });

      if (error && error.code !== '23505') throw error; // Ignore duplicate insert
      return true;
    } catch (err) {
      console.error('Save event error:', err.message);
      return false;
    }
  },

  /**
   * Unsave an event for the user
   */
  async unsaveEvent(userId, eventId) {
    if (!userId || !eventId) return false;

    if (!isSupabaseConfigured) {
      const current = await this.getSavedEventIds(userId);
      const updated = current.filter((id) => id !== eventId);
      localStorage.setItem(`${LOCAL_SAVED_KEY}_${userId}`, JSON.stringify(updated));
      return true;
    }

    try {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Unsave event error:', err.message);
      return false;
    }
  },
};
