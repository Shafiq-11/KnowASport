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
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${suffix}`;
}

/**
 * Check if event registration is currently open
 */
export function isRegistrationOpen(deadlineDate) {
  if (!deadlineDate) return true;
  return new Date(deadlineDate) > new Date();
}

/**
 * Get relative time until registration closes
 */
export function getRegistrationDeadlineText(deadlineDate) {
  if (!deadlineDate) return '';
  const now = new Date();
  const deadline = new Date(deadlineDate);
  const diffMs = deadline - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) return 'Registration Closed';
  if (diffDays === 1) return 'Closes Today';
  if (diffDays <= 3) return `Closes in ${diffDays} days`;
  return `Closes ${formatDateShort(deadlineDate)}`;
}

export function getDeadlineUrgency(deadlineDate) {
  if (!deadlineDate) return 'normal';
  const now = new Date();
  const deadline = new Date(deadlineDate);
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
 * Validate 10-digit Indian mobile number (Starts with 6-9, exactly 10 digits)
 */
export function validateIndianPhoneNumber(phone) {
  if (!phone) return false;
  const digitsOnly = sanitizePhoneNumber(phone);
  return /^[6-9][0-9]{9}$/.test(digitsOnly);
}
