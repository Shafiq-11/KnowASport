/**
 * Format a price in Indian Rupees
 * @param {number} amount
 * @param {boolean} showFree - show "Free" for 0 amounts
 */
export function formatPrice(amount, showFree = true) {
  if (amount === 0 || amount === null || amount === undefined) {
    return showFree ? 'Free' : '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date for display
 * @param {string|Date} date
 * @param {Object} options
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Format date as short — "24 AUG"
 */
export function formatDateShort(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(d).toUpperCase();
}

/**
 * Format time — "10:00 AM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  // timeStr could be "HH:MM:SS" from DB or a full ISO string
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${suffix}`;
}

/**
 * Get relative time until registration closes
 * @param {string|Date} deadline
 * @returns {string} e.g. "Closes in 4 days", "Closing tomorrow", "Closed"
 */
export function getRegistrationDeadlineText(deadline) {
  if (!deadline) return '';
  const now = new Date();
  const end = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const diff = end - now;

  if (diff <= 0) return 'Registration closed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 30) return `Closes ${formatDate(end)}`;
  if (days === 1) return 'Closes tomorrow';
  if (days > 1) return `Closes in ${days} days`;
  if (hours > 1) return `Closes in ${hours} hours`;
  if (minutes > 1) return `Closes in ${minutes} minutes`;
  return 'Closing soon';
}

/**
 * Get urgency level for registration deadline (for styling)
 * @returns {'critical'|'urgent'|'normal'|'closed'}
 */
export function getDeadlineUrgency(deadline) {
  if (!deadline) return 'normal';
  const now = new Date();
  const end = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const diff = end - now;

  if (diff <= 0) return 'closed';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 2) return 'critical';
  if (days <= 7) return 'urgent';
  return 'normal';
}

/**
 * Convert a string to URL-safe slug
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate a registration ID (client-side mock — DB will generate real one)
 */
export function generateRegistrationId() {
  const year = new Date().getFullYear();
  const num = Math.floor(100000 + Math.random() * 900000);
  return `KAS-${year}-${num}`;
}

/**
 * Get initials from a full name
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

/**
 * Truncate text to a given length
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Conditional class names (simple alternative to clsx for strings)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Calculate platform fee
 */
export function calculateFees(entryFee, platformFeePercent = 2.5) {
  const platformFee = Math.ceil(entryFee * (platformFeePercent / 100));
  return {
    entryFee,
    platformFee,
    total: entryFee + platformFee,
  };
}

/**
 * Check if registration is open
 */
export function isRegistrationOpen(event) {
  if (!event) return false;
  if (event.status !== 'published') return false;
  const now = new Date();
  const start = event.registration_start ? new Date(event.registration_start) : null;
  const end = event.registration_deadline ? new Date(event.registration_deadline) : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  if (event.max_participants && event.current_participants >= event.max_participants) return false;
  return true;
}

/**
 * Format participant count
 */
export function formatParticipants(current, max) {
  if (!max) return `${current} registered`;
  return `${current} / ${max}`;
}
