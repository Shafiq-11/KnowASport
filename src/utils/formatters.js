/**
 * Format currency in INR (₹)
 */
export function formatPrice(amount) {
  if (amount === 0 || amount === '0' || amount === null || amount === undefined) {
    return 'FREE';
  }
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return 'FREE';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Format date for display (e.g., "15 Aug 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = parseDateSafe(dateString);
  if (!date) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format short date (e.g., "15 Aug")
 */
export function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = parseDateSafe(dateString);
  if (!date) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/**
 * Format time string (e.g., "09:00" -> "9:00 AM")
 */
export function formatTime(timeString) {
  if (!timeString) return '';
  if (String(timeString).includes(':')) {
    const parts = String(timeString).split(':');
    const hour = parseInt(parts[0], 10);
    const min = parts[1] || '00';
    if (isNaN(hour)) return timeString;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${min} ${ampm}`;
  }
  return timeString;
}

/**
 * Safely parse date strings, defaulting to 23:59:59 IST for registration deadlines without explicit time
 */
export function parseDateSafe(dateInput, endOfDayIfNoTime = false) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  let str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    str += endOfDayIfNoTime ? 'T23:59:59+05:30' : 'T00:00:00+05:30';
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Check if registration is currently open for an event.
 * Accepts either an event object or a date string/Date.
 */
export function isRegistrationOpen(eventOrDeadline) {
  if (!eventOrDeadline) return true;

  if (typeof eventOrDeadline === 'object' && !(eventOrDeadline instanceof Date)) {
    const event = eventOrDeadline;

    if (event.status && event.status !== 'published') return false;

    const now = new Date();

    if (event.start_date) {
      const startDate = parseDateSafe(event.start_date, true);
      if (startDate && now > startDate) return false;
    }

    if (event.registration_deadline) {
      const deadline = parseDateSafe(event.registration_deadline, true);
      if (deadline && now > deadline) return false;
    }

    if (event.max_participants && event.registered_count && Number(event.registered_count) >= Number(event.max_participants)) {
      return false;
    }

    return true;
  }

  const deadline = parseDateSafe(eventOrDeadline, true);
  if (!deadline) return true;
  return deadline > new Date();
}

/**
 * Get relative time until registration closes
 */
export function getRegistrationDeadlineText(deadlineInput) {
  if (!deadlineInput) return '';
  const now = new Date();
  const deadline = parseDateSafe(deadlineInput, true);
  if (!deadline) return '';

  const diffMs = deadline - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) return 'Registration Closed';
  if (diffDays <= 1) return 'Closes Today';
  if (diffDays <= 3) return `Closes in ${diffDays} days`;
  return `Closes ${formatDateShort(deadlineInput)}`;
}

export function getDeadlineUrgency(deadlineInput) {
  if (!deadlineInput) return 'normal';
  const now = new Date();
  const deadline = parseDateSafe(deadlineInput, true);
  if (!deadline) return 'normal';

  const diffMs = deadline - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) return 'closed';
  if (diffHours <= 24) return 'critical';
  if (diffHours <= 72) return 'urgent';
  return 'normal';
}

/**
 * Sanitize input to allow strictly up to 10 digits for Indian mobile numbers
 */
export function sanitizePhoneNumber(value) {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 10);
}

/**
 * Validate Indian 10-digit mobile number format
 */
export function validateIndianPhoneNumber(phone) {
  if (!phone) return false;
  const sanitized = sanitizePhoneNumber(phone);
  return /^[6-9]\d{9}$/.test(sanitized);
}
