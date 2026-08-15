/**
 * Tamil Nadu Districts — complete list
 */
export const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Villupuram', 'Virudhunagar',
];

/**
 * Major cities for quick navigation
 */
export const MAJOR_CITIES = [
  { name: 'Chennai', district: 'Chennai' },
  { name: 'Coimbatore', district: 'Coimbatore' },
  { name: 'Madurai', district: 'Madurai' },
  { name: 'Tiruppur', district: 'Tiruppur' },
  { name: 'Salem', district: 'Salem' },
  { name: 'Tiruchirapalli', district: 'Tiruchirappalli' },
  { name: 'Erode', district: 'Erode' },
  { name: 'Vellore', district: 'Vellore' },
  { name: 'Thanjavur', district: 'Thanjavur' },
  { name: 'Hosur', district: 'Krishnagiri' },
  { name: 'Tirunelveli', district: 'Tirunelveli' },
  { name: 'Kancheepuram', district: 'Kancheepuram' },
];

/**
 * Sports with metadata
 */
export const SPORTS = [
  { id: 'cricket',     name: 'Cricket',      slug: 'cricket',      emoji: '🏏', badgeClass: 'sport-badge-cricket' },
  { id: 'football',   name: 'Football',     slug: 'football',     emoji: '⚽', badgeClass: 'sport-badge-football' },
  { id: 'badminton',  name: 'Badminton',    slug: 'badminton',    emoji: '🏸', badgeClass: 'sport-badge-badminton' },
  { id: 'volleyball', name: 'Volleyball',   slug: 'volleyball',   emoji: '🏐', badgeClass: 'sport-badge-volleyball' },
  { id: 'basketball', name: 'Basketball',   slug: 'basketball',   emoji: '🏀', badgeClass: 'sport-badge-basketball' },
  { id: 'athletics',  name: 'Athletics',    slug: 'athletics',    emoji: '🏃', badgeClass: 'sport-badge-athletics' },
  { id: 'kabaddi',    name: 'Kabaddi',      slug: 'kabaddi',      emoji: '🤼', badgeClass: 'sport-badge-kabaddi' },
  { id: 'chess',      name: 'Chess',        slug: 'chess',        emoji: '♟️', badgeClass: 'sport-badge-chess' },
  { id: 'tennis',     name: 'Tennis',       slug: 'tennis',       emoji: '🎾', badgeClass: 'sport-badge-tennis' },
  { id: 'tabletennis',name: 'Table Tennis', slug: 'table-tennis', emoji: '🏓', badgeClass: 'sport-badge-tabletennis' },
];

export const SPORTS_CATEGORIES = SPORTS;

/**
 * Event Types — What kind of event is this?
 */
export const EVENT_TYPES = [
  { id: 'local',        name: 'Local Events',     slug: 'local',        icon: 'MapPin',        description: 'Small & town-level community competitions' },
  { id: 'sports_event', name: 'Sports Events',    slug: 'sports-event', icon: 'Trophy',        description: 'General open sports meets' },
  { id: 'club',         name: 'Club Events',      slug: 'club',         icon: 'Shield',        description: 'Academy & sports club tournaments' },
  { id: 'turf',         name: 'Turf Events',      slug: 'turf',         icon: 'Goal',          description: 'Synthetic turf football & futsal events' },
  { id: 'college',      name: 'College Events',   slug: 'college',      icon: 'GraduationCap', description: 'Inter-college & collegiate championships' },
  { id: 'school',       name: 'School Events',    slug: 'school',       icon: 'School',        description: 'Inter-school sports competitions' },
  { id: 'district',     name: 'District Events',  slug: 'district',     icon: 'Flag',          description: 'District level association cups' },
  { id: 'open',         name: 'Open Tournaments', slug: 'open',         icon: 'Globe',         description: 'Open entry state-wide tournaments' },
  { id: 'championship', name: 'Championships',   slug: 'championship', icon: 'Award',         description: 'State rating & major championships' },
  { id: 'league',       name: 'Leagues',          slug: 'league',       icon: 'Medal',         description: 'Multi-weekend league formats' },
];

/**
 * Event status labels and styles
 */
export const EVENT_STATUS = {
  draft:          { label: 'Draft',          color: 'neutral' },
  pending_review: { label: 'Pending Review', color: 'warning' },
  published:      { label: 'Published',      color: 'success' },
  rejected:       { label: 'Rejected',       color: 'danger' },
  completed:      { label: 'Completed',      color: 'neutral' },
  cancelled:      { label: 'Cancelled',      color: 'danger' },
};

/**
 * Registration status labels
 */
export const REGISTRATION_STATUS = {
  pending_payment: { label: 'Payment Pending', color: 'warning' },
  confirmed:       { label: 'Confirmed',       color: 'success' },
  cancelled:       { label: 'Cancelled',       color: 'danger' },
  checked_in:      { label: 'Checked In',      color: 'info' },
};

/**
 * Participation types
 */
export const PARTICIPATION_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'team',       label: 'Team' },
  { value: 'both',       label: 'Individual & Team' },
];

/**
 * Gender options
 */
export const GENDER_OPTIONS = [
  { value: 'all',    label: 'All' },
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
];

/**
 * Skill level options
 */
export const SKILL_LEVELS = [
  { value: 'all',          label: 'All Levels' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
  { value: 'professional', label: 'Professional' },
];

/**
 * Sort options for events listing
 */
export const SORT_OPTIONS = [
  { value: 'recommended',         label: 'Recommended' },
  { value: 'registration_closing', label: 'Registration Closing Soon' },
  { value: 'upcoming',            label: 'Upcoming' },
  { value: 'popular',             label: 'Most Popular' },
  { value: 'newest',              label: 'Newest' },
  { value: 'price_low',           label: 'Price: Low to High' },
  { value: 'price_high',          label: 'Price: High to Low' },
];

/**
 * Date filter presets
 */
export const DATE_FILTERS = [
  { value: 'all',       label: 'Any Date' },
  { value: 'today',     label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'weekend',   label: 'This Weekend' },
  { value: 'this_month', label: 'This Month' },
];

/**
 * Price filter presets
 */
export const PRICE_FILTERS = [
  { value: 'all',        label: 'All Prices' },
  { value: 'free',       label: 'Free' },
  { value: 'under_250',  label: 'Under ₹250' },
  { value: '250_500',    label: '₹250 – ₹500' },
  { value: '500_1000',   label: '₹500 – ₹1,000' },
  { value: 'above_1000', label: '₹1,000+' },
];

/**
 * Platform fee (percentage)
 */
export const PLATFORM_FEE_PERCENT = 2.5;

/**
 * Nav links for desktop
 */
export const NAV_LINKS = [
  { href: '/events',          label: 'Events' },
  { href: '/events?tab=sports', label: 'Sports' },
  { href: '/events?location=nearby', label: 'Nearby' },
  { href: '/my-registrations', label: 'My Registrations' },
];
