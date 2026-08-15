/**
 * KnowASport Badge
 * Used for sport labels, status indicators, and tags
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-[6px]';

  const variants = {
    default:  'bg-neutral-100 text-neutral-700',
    primary:  'bg-amber-100 text-amber-800',
    success:  'bg-green-100 text-green-800',
    warning:  'bg-yellow-100 text-yellow-800',
    danger:   'bg-red-100 text-red-800',
    info:     'bg-blue-100 text-blue-800',
    dark:     'bg-neutral-800 text-neutral-100',
    outline:  'border border-neutral-300 text-neutral-600 bg-transparent',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-neutral-400',
    primary: 'bg-amber-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger:  'bg-red-500',
    info:    'bg-blue-500',
    dark:    'bg-neutral-300',
    outline: 'bg-neutral-400',
  };

  return (
    <span
      className={[
        base,
        variants[variant] || variants.default,
        sizes[size] || sizes.sm,
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant] || dotColors.default}`}
        />
      )}
      {children}
    </span>
  );
}
