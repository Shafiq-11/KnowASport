import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronDown, User, LogOut, Ticket,
  Heart, Trophy, LayoutDashboard, Plus, Bell
} from 'lucide-react';
import Button from '../common/Button.jsx';
import SearchBar from '../common/SearchBar.jsx';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * KnowASport Navbar
 * Desktop: full horizontal nav with search
 * Mobile: hamburger with slide-in drawer
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication Context
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const role = profile?.role || 'user'; // 'user' | 'organizer' | 'admin'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Scroll shadow
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function onOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '/events',           label: 'Events' },
    { href: '/blog',             label: 'Blog' },
    { href: '/my-registrations', label: 'My Registrations', protected: true },
    { href: '/saved',            label: 'Saved Events', protected: true },
  ];

  const navLinkClass = (isActive) => `
    text-[14px] font-600 transition-colors duration-150
    ${isActive
      ? 'text-amber-600'
      : 'text-neutral-600 hover:text-neutral-900'
    }
  `;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Athlete';

  return (
    <>
      <header
        className={`
          sticky top-0 z-50 bg-white
          transition-shadow duration-200
          ${scrolled ? 'shadow-[0_1px_8px_0_rgba(0,0,0,0.08)]' : 'border-b border-neutral-100'}
        `}
      >
        <div className="kas-container">
          <div className="flex items-center gap-4 h-16">

            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-[6px]"
              aria-label="KnowASport — Home"
            >
              <div className="w-8 h-8 rounded-[8px] bg-amber-500 flex items-center justify-center flex-shrink-0">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="font-800 text-[17px] text-neutral-900 tracking-tight">
                Know<span className="text-amber-500">A</span>Sport
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <nav className="hidden lg:flex items-center gap-6 ml-2" aria-label="Main navigation">
              {navLinks.map(link => {
                if (link.protected && !isAuthenticated) return null;
                return (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    className={({ isActive }) => navLinkClass(isActive)}
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* ── Search (desktop) ── */}
            <div className="hidden md:block flex-1 max-w-xs ml-auto">
              <SearchBar size="sm" />
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2 ml-2">
              {isAuthenticated ? (
                <>
                  {/* Organize CTA */}
                  {role !== 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:inline-flex"
                      onClick={() => navigate(role === 'organizer' ? '/organizer/dashboard' : '/organizer/register')}
                    >
                      {role === 'organizer' ? 'Dashboard' : 'Organize'}
                    </Button>
                  )}

                  {/* Notifications */}
                  <button
                    className="hidden sm:flex w-9 h-9 rounded-[8px] items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" aria-hidden />
                  </button>

                  {/* Profile dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(o => !o)}
                      className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-[8px] hover:bg-neutral-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      aria-expanded={profileOpen}
                      aria-haspopup="true"
                    >
                      <div className="w-8 h-8 rounded-full bg-navy-950 text-amber-400 flex items-center justify-center font-800 text-xs flex-shrink-0 border border-navy-800">
                        {displayName[0].toUpperCase()}
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-neutral-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-100 rounded-[12px] shadow-lg overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 border-b border-neutral-100">
                            <p className="text-sm font-700 text-neutral-900 truncate">{displayName}</p>
                            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                          </div>
                          <div className="py-1.5">
                            <DropdownLink to="/dashboard" icon={LayoutDashboard}>My Dashboard</DropdownLink>
                            <DropdownLink to="/profile" icon={User}>Profile</DropdownLink>
                            <DropdownLink to="/my-registrations" icon={Ticket}>My Registrations</DropdownLink>
                            <DropdownLink to="/saved" icon={Heart}>Saved Events</DropdownLink>

                            <div className="my-1 border-t border-neutral-100" />

                            <DropdownLink to="/organizer/dashboard" icon={Trophy}>Organizer Dashboard</DropdownLink>
                            {role !== 'organizer' && (
                              <DropdownLink to="/organizer/apply" icon={Plus}>Become an Organizer</DropdownLink>
                            )}
                          </div>
                          <div className="border-t border-neutral-100 py-1.5">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-500 text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <LogOut size={14} />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/signup')}
                  >
                    Get Started
                  </Button>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[8px] text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ml-1"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.span key="x" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }} transition={{ duration: 0.15 }}>
                      <X size={20} />
                    </motion.span>
                  ) : (
                    <motion.span key="menu" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} transition={{ duration: 0.15 }}>
                      <Menu size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />

            {/* Drawer */}
            <motion.nav
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-white z-50 shadow-xl flex flex-col overflow-y-auto"
              aria-label="Mobile navigation"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-100 flex-shrink-0">
                <Link to="/" className="font-800 text-[17px] text-neutral-900">
                  Know<span className="text-amber-500">A</span>Sport
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <X size={18} className="text-neutral-500" />
                </button>
              </div>

              {/* User badge if authenticated */}
              {isAuthenticated && (
                <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-navy-950 text-amber-400 flex items-center justify-center font-800 text-sm">
                    {displayName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-700 text-neutral-900 truncate">{displayName}</p>
                    <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="px-5 py-4 border-b border-neutral-100">
                <SearchBar size="sm" />
              </div>

              {/* Nav links */}
              <div className="flex-1 py-4">
                {navLinks.map(link => {
                  if (link.protected && !isAuthenticated) return null;
                  return (
                    <NavLink
                      key={link.href}
                      to={link.href}
                      className={({ isActive }) => `
                        flex items-center px-5 py-3 text-[14px] font-600 transition-colors duration-150
                        ${isActive ? 'text-amber-600 bg-amber-50' : 'text-neutral-700 hover:bg-neutral-50'}
                      `}
                    >
                      {link.label}
                    </NavLink>
                  );
                })}

                {isAuthenticated && (
                  <>
                    <div className="mx-5 my-3 border-t border-neutral-100" />
                    <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-2.5 px-5 py-3 text-[14px] font-600 transition-colors ${isActive ? 'text-amber-600 bg-amber-50' : 'text-neutral-700 hover:bg-neutral-50'}`}>
                      <User size={16} className="text-neutral-400" /> Profile
                    </NavLink>
                    <NavLink to="/saved" className={({ isActive }) => `flex items-center gap-2.5 px-5 py-3 text-[14px] font-600 transition-colors ${isActive ? 'text-amber-600 bg-amber-50' : 'text-neutral-700 hover:bg-neutral-50'}`}>
                      <Heart size={16} className="text-neutral-400" /> Saved Events
                    </NavLink>
                  </>
                )}
              </div>

              {/* CTA footer */}
              <div className="px-5 py-5 border-t border-neutral-100 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Button variant="outline" size="md" fullWidth onClick={() => navigate('/organizer/register')}>
                      Organize an Event
                    </Button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 text-sm font-600 text-red-600 py-2 hover:bg-red-50 rounded-[8px] transition-colors"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" size="md" fullWidth onClick={() => navigate('/signup')}>
                      Get Started
                    </Button>
                    <Button variant="secondary" size="md" fullWidth onClick={() => navigate('/login')}>
                      Sign in
                    </Button>
                  </>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DropdownLink({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-2 text-[13px] font-500
        transition-colors duration-150
        ${isActive ? 'text-amber-600 bg-amber-50' : 'text-neutral-700 hover:bg-neutral-50'}
      `}
    >
      <Icon size={14} className="flex-shrink-0" />
      {children}
    </NavLink>
  );
}
