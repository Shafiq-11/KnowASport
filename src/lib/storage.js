import { supabase, isSupabaseConfigured } from './supabase.js';

export const storageService = {
  /**
   * Upload an event poster/banner image to 'event-media' storage bucket
   */
  async uploadEventPoster(file, eventSlugOrId) {
    if (!file) throw new Error('No file provided for upload.');

    if (!isSupabaseConfigured) {
      // In local dev fallback mode, convert to base64 Data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${eventSlugOrId || 'event'}-${Date.now()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      const { data, error } = await supabase.storage
        .from('event-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('event-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('Supabase storage upload failed, fallback to data URL:', err.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  },

  /**
   * Upload an organizer KYC document or selfie to 'organizer-kyc' storage bucket
   */
  async uploadKycDocument(file, userId, docType = 'document') {
    if (!file) throw new Error('No file provided for upload.');

    if (!isSupabaseConfigured) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    try {
      const fileExt = file.name?.split('.').pop() || 'jpg';
      const fileName = `${userId || 'org'}-${docType}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('organizer-kyc')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('organizer-kyc')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('KYC storage upload warning:', err.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  },

  /**
   * Upload a user avatar to 'avatars' storage bucket
   */
  async uploadAvatar(file, userId) {
    if (!file) throw new Error('No avatar file provided.');

    if (!isSupabaseConfigured) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('Avatar storage upload warning:', err.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  },
};
