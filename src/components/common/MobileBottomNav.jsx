import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, Ticket, User } from 'lucide-react';

/**
 * MobileBottomNav
 * Fixed bottom navigation bar for mobile users (hidden on lg+)
 * Shows: Home, Explore, Saved, Registrations, Profile
 */
const mobileNavItems = [
  { to: '/',                icon: Home,   label: 'Home' },
  { to: '/events',          icon: Search, label: 'Explore' },
  { to: '/saved',           icon: Heart,  label: 'Saved' },
  { to: '/my-registrations',icon: Ticket, label: 'My Events' },
  { to: '/profile',         icon: User,   label: 'Profile' },
];

export default function MobileBottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 safe-area-inset-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center justify-center gap-0.5 text-center
              transition-colors duration-150 focus-visible:outline-none
              ${isActive
                ? 'text-amber-600'
                : 'text-neutral-400 hover:text-neutral-600'
              }
            `}
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <div className={`w-10 h-7 flex items-center justify-center rounded-full transition-colors duration-150 ${isActive ? 'bg-amber-50' : ''}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-600 leading-none ${isActive ? 'text-amber-600' : 'text-neutral-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
