import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Trophy, LayoutDashboard, Calendar, Users, BarChart3, Plus, LogOut, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/organizer/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/organizer/events',      icon: Calendar,        label: 'My Events' },
];

export default function OrganizerLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Sidebar */}
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
            Organizer
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
                  ? 'text-amber-600 bg-amber-50'
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
              className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white text-[13px] font-700 rounded-[8px] py-2.5 hover:bg-amber-400 active:bg-amber-600 transition-colors duration-150"
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
            className="flex items-center gap-2 text-[13px] text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ChevronLeft size={14} />
            Back to KnowASport
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
