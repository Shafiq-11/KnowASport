import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, LayoutDashboard, UserCheck, Calendar, Users, Ticket, CreditCard,
  BarChart3, FileText, ChevronLeft, ShieldCheck, LogOut, Newspaper
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { to: '/admin/organizers', icon: UserCheck, label: 'Organizers' },
      { to: '/admin/events', icon: Calendar, label: 'Events' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/registrations', icon: Ticket, label: 'Registrations' },
      { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { to: '/admin/blog', icon: Newspaper, label: 'Blog & Editorial' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { to: '/admin/reports', icon: BarChart3, label: 'Reports & TN' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-white">
      {/* Admin sidebar — dark high-contrast console */}
      <aside className="hidden lg:flex flex-col w-64 bg-neutral-900 border-r border-neutral-800 fixed top-0 bottom-0 left-0 z-30">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-neutral-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-[8px] bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Trophy size={16} className="text-white" />
          </div>
          <div>
            <span className="font-800 text-[15px] text-white tracking-tight block">
              Know<span className="text-amber-500">A</span>Sport
            </span>
            <span className="text-[10px] font-700 text-amber-400 uppercase tracking-widest block">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto space-y-4 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="text-[10px] font-800 text-neutral-500 uppercase tracking-widest px-3 block mb-1">
                {section.title}
              </span>
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2 rounded-[8px] text-[13px] font-700
                    transition-colors duration-150
                    ${isActive
                      ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                      : 'text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-200'
                    }
                  `}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-neutral-800 p-4 space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-700 transition-colors"
          >
            <LogOut size={15} />
            Sign Out of Console
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-700 text-neutral-400 hover:text-white transition-colors pl-1"
          >
            <ChevronLeft size={16} />
            Back to Public Site
          </button>
        </div>
      </aside>

      {/* Main content container with smooth transition */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen bg-neutral-950">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
