import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import MobileBottomNav from '../components/common/MobileBottomNav.jsx';
import ScrollToTop from '../components/common/ScrollToTop.jsx';

/**
 * PublicLayout
 * Wraps all public-facing pages with stable Navbar and Footer
 */
export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <ScrollToTop />
      <Navbar />

      {/* Page content with fast, seamless crossfade (no white flash gap) */}
      <main className="flex-1 pb-16 lg:pb-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />

      {/* Mobile bottom navigation (visible below lg breakpoint) */}
      <MobileBottomNav />
    </div>
  );
}
