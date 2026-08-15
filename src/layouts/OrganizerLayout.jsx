import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Trophy, LayoutDashboard, Calendar, Users, BarChart3, Plus, LogOut,
  ChevronLeft, Settings, Menu, X, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/organizer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/organizer/events',    icon: Calendar,        label: 'My Events' },
  { to: '/organizer/settings',  icon: Settings,        label: 'Settings' },
];

export default function OrganizerLayout() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50">
      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden bg-white border-b border-neutral-200 px-4 h-15 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[6px] bg-amber-500 flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="font-800 text-[15px] text-neutral-900">
            Know<span className="text-amber-500">A</span>Sport
          </span>
          <span className="text-[10px] font-800 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ml-1 uppercase">
            Organizer
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-neutral-600 hover:text-neutral-900 rounded-[8px] hover:bg-neutral-100"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Drawer Navigation ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 space-y-1 z-30 overflow-hidden"
          >
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[13px] font-600
                  transition-colors ${
                    isActive
                      ? 'text-amber-600 bg-amber-50 font-800'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                `}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}

            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/organizer/events/create');
                }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white text-[13px] font-700 rounded-[8px] py-2.5 hover:bg-amber-400"
              >
                <Plus size={15} />
                Create Event
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-1 text-[12px] font-600 text-neutral-500 py-2 hover:text-neutral-800"
              >
                <ChevronLeft size={14} />
                Back to KnowASport
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-neutral-100 fixed top-0 bottom-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-neutral-100 flex-shrink-0">
          <div className="w-7 h-7 rounded-[6px] bg-amber-500 flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="font-800 text-[15px] text-neutral-900">
            Know<span className="text-amber-500">A</span>Sport
          </span>
        </div>

        {/* Role label */}
        <div className="px-5 py-3 border-b border-neutral-100">
          <span className="text-[11px] font-700 text-amber-600 uppercase tracking-wider">
            Organizer Platform
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-5 py-2.5 text-[13px] font-600
                transition-colors duration-150 mb-0.5
                ${isActive
                  ? 'text-amber-600 bg-amber-50 font-800'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                }
              `}
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="px-5 pt-4">
            <button
              onClick={() => navigate('/organizer/events/create')}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white text-[13px] font-700 rounded-[8px] py-2.5 hover:bg-amber-400 active:bg-amber-600 transition-colors duration-150 shadow-xs"
            >
              <Plus size={15} />
              Create Event
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[13px] text-neutral-500 hover:text-neutral-700 transition-colors font-600"
          >
            <ChevronLeft size={14} />
            Back to KnowASport
          </button>
        </div>
      </aside>

      {/* ── Main Content Container ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
