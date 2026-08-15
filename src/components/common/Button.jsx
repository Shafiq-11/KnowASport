import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * KnowASport Button
 *
 * Variants: primary | secondary | ghost | danger | success
 * Sizes: sm | md | lg
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;

  const base = `
    inline-flex items-center justify-center gap-2 font-semibold
    transition-all duration-150 cursor-pointer select-none
    focus-visible:outline-2 focus-visible:outline-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-amber-500 text-white
      hover:bg-amber-400 active:bg-amber-600
      focus-visible:outline-amber-500
      rounded-[8px]
    `,
    secondary: `
      bg-white text-neutral-800 border border-neutral-200
      hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100
      focus-visible:outline-neutral-400
      rounded-[8px]
    `,
    ghost: `
      bg-transparent text-neutral-600
      hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200
      focus-visible:outline-neutral-400
      rounded-[8px]
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-500 active:bg-red-700
      focus-visible:outline-red-500
      rounded-[8px]
    `,
    success: `
      bg-green-600 text-white
      hover:bg-green-500 active:bg-green-700
      focus-visible:outline-green-500
      rounded-[8px]
    `,
    outline: `
      bg-transparent text-amber-600 border-2 border-amber-500
      hover:bg-amber-50 active:bg-amber-100
      focus-visible:outline-amber-500
      rounded-[8px]
    `,
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-base',
  };

  const classes = [
    base,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ').replace(/\s+/g, ' ').trim();

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      className={classes}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : (
        icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </motion.button>
  );
}
