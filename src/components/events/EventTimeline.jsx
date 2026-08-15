import { Calendar, Clock } from 'lucide-react';
import { formatDateShort } from '../../utils/formatters.js';

export default function EventTimeline({ schedule = [] }) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="text-sm text-neutral-500 italic py-4">
        Detailed match schedule will be communicated by the organizer after registration closes.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-200">
      {schedule.map((item, idx) => (
        <div key={idx} className="relative group">
          {/* Bullet dot */}
          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-amber-500 shadow-sm group-hover:bg-amber-500 transition-colors duration-150" />

          <div className="bg-white rounded-[10px] border border-neutral-100 p-4 shadow-sm hover:border-neutral-200 transition-colors">
            <div className="flex items-center gap-3 flex-wrap text-xs font-600 text-amber-700 mb-1">
              <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-[4px]">
                <Calendar size={12} />
                {formatDateShort(item.date)}
              </span>
              <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-[4px]">
                <Clock size={12} />
                {item.time}
              </span>
            </div>

            <h4 className="font-700 text-neutral-900 text-sm mb-1">
              {item.title}
            </h4>

            {item.description && (
              <p className="text-xs text-neutral-500 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
