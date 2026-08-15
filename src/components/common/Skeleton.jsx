/**
 * Skeleton loader components
 * Shapes: box | text | circle | card
 */
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded-[4px]"
          style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`skeleton rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/**
 * Event card skeleton — matches EventCard dimensions
 */
export function EventCardSkeleton() {
  return (
    <div
      className="bg-white rounded-[12px] overflow-hidden border border-neutral-100"
      aria-hidden="true"
    >
      {/* Image area */}
      <div className="skeleton h-48 w-full" />

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Sport badge */}
        <Skeleton className="h-5 w-20 rounded-[6px]" />

        {/* Title */}
        <SkeletonText lines={2} />

        {/* Meta row */}
        <div className="flex gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-100 pt-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-28 rounded-[6px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic section skeleton — for page-level loading
 */
export function SectionSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
