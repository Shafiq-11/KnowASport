import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button.jsx';

/**
 * KnowASport EmptyState
 * Shown when a list or section has no content
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  compact = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        flex flex-col items-center justify-center text-center
        ${compact ? 'py-10 px-6' : 'py-20 px-6'}
      `}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-[12px] bg-neutral-100 flex items-center justify-center mb-4">
          <Icon size={24} className="text-neutral-400" />
        </div>
      )}

      <h3 className="text-base font-700 text-neutral-800 mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-neutral-500 max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}

      {action && actionLabel && (
        <Button variant="primary" size="sm" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
