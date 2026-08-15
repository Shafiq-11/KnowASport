import { CheckCircle2 } from 'lucide-react';

export default function VerifiedBadge({ size = 'sm', className = '' }) {
  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-700 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 ${textSizes[size]} ${className}`}
      title="Verified Organizer"
    >
      <CheckCircle2 size={iconSizes[size]} className="text-blue-600 fill-blue-100" />
      <span>Verified</span>
    </span>
  );
}
