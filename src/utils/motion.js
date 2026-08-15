/**
 * KnowASport — Motion & Animation System Tokens & Variants
 * 
 * Guidelines:
 * - Smooth, fast (150ms-400ms), natural, premium, sporty.
 * - Non-intrusive micro-interactions.
 * - Accessible: respects prefers-reduced-motion.
 */

// Easing presets
export const EASINGS = {
  default: [0.4, 0, 0.2, 1],
  out: [0, 0, 0.2, 1],
  spring: [0.34, 1.56, 0.64, 1],
};

// Page Transition Variant
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.28, ease: EASINGS.default }
  },
  exit: { 
    opacity: 0, 
    y: -4,
    transition: { duration: 0.18, ease: EASINGS.out }
  }
};

// Scroll Reveal Variant for Container / Section
export const sectionRevealVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: EASINGS.default,
      staggerChildren: 0.06,
      delayChildren: 0.02,
    }
  }
};

// Stagger Item Variant (Event cards, sport cards, location cards)
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASINGS.default }
  }
};

// Micro-interaction presets
export const buttonPressAnimation = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15, ease: EASINGS.out }
};

export const cardHoverAnimation = {
  whileHover: { y: -3 },
  transition: { duration: 0.2, ease: EASINGS.default }
};

export const bookmarkSaveAnimation = {
  scale: [1, 1.15, 1],
  transition: { duration: 0.25, ease: EASINGS.spring }
};

export const drawerVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 26, stiffness: 280 }
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: EASINGS.out }
  }
};
