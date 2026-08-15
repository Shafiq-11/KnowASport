import VerifiedBadge from './VerifiedBadge.jsx';
import { MapPin, Phone, Mail, Award } from 'lucide-react';

export default function OrganizerCard({ organizer }) {
  if (!organizer) return null;

  return (
    <div className="bg-white rounded-[12px] border border-neutral-200 p-5 shadow-card">
      <div className="flex items-start gap-4">
        {/* Organizer Logo */}
        <div className="w-14 h-14 rounded-[10px] bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {organizer.logo_url ? (
            <img
              src={organizer.logo_url}
              alt={organizer.organization_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-800 text-neutral-400">
              {organizer.organization_name[0]}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-700 text-neutral-900 text-base leading-tight truncate">
              {organizer.organization_name}
            </h4>
            {organizer.verification_status === 'verified' && <VerifiedBadge size="xs" />}
          </div>

          <p className="text-xs text-neutral-500 line-clamp-2 mb-3">
            {organizer.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 border-t border-neutral-100 pt-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-neutral-400" />
              <span>{organizer.city_name}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Award size={13} className="text-amber-500" />
              <span className="font-600">{organizer.events_count || 10}+ Events Conducted</span>
            </div>

            {organizer.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={13} className="text-neutral-400" />
                <span>{organizer.phone}</span>
              </div>
            )}

            {organizer.email && (
              <div className="flex items-center gap-1.5">
                <Mail size={13} className="text-neutral-400" />
                <span className="truncate">{organizer.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
