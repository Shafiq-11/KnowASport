import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import MobileBottomNav from '../components/common/MobileBottomNav.jsx';
import ScrollToTop from '../components/common/ScrollToTop.jsx';
import { pageTransitionVariants } from '../utils/motion.js';

/**
 * PublicLayout
 * Wraps all public-facing pages with Navbar and Footer
 */
export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <ScrollToTop />
      <Navbar />

      {/* Page content with subtle fade transition */}
      <main className="flex-1 pb-16 lg:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Mobile bottom navigation (visible below lg breakpoint) */}
      <MobileBottomNav />
    </div>
  );
}
