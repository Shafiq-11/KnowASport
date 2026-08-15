import { RotateCcw, Filter } from 'lucide-react';
import { SPORTS, EVENT_TYPES, MAJOR_CITIES, DATE_FILTERS, PRICE_FILTERS } from '../../utils/constants.js';

export default function EventFilters({
  sportFilter,
  setSportFilter,
  eventTypeFilter,
  setEventTypeFilter,
  cityFilter,
  setCityFilter,
  dateFilter,
  setDateFilter,
  priceFilter,
  setPriceFilter,
  participationFilter,
  setParticipationFilter,
  genderFilter,
  setGenderFilter,
  activeFiltersCount,
  clearAllFilters,
}) {
  return (
    <div className="bg-white rounded-[12px] border border-neutral-200 p-5 space-y-6 shadow-sm sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-neutral-700" />
          <h3 className="font-700 text-neutral-900 text-base">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-700 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs font-600 text-amber-700 hover:text-amber-800 transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Sport Filter */}
      <div className="space-y-2">
        <label className="text-xs font-700 uppercase tracking-wider text-neutral-500 block">
          Sport
        </label>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3 py-2 text-sm text-neutral-800 font-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Sports</option>
          {SPORTS.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Event Type Filter */}
      <div className="space-y-2">
        <label className="text-xs font-700 uppercase tracking-wider text-neutral-500 block">
          Event Type
        </label>
        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3 py-2 text-sm text-neutral-800 font-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Event Types</option>
          {EVENT_TYPES.map((et) => (
            <option key={et.id} value={et.slug}>
              {et.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <label className="text-xs font-700 uppercase tracking-wider text-neutral-500 block">
          City / Location
        </label>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3 py-2 text-sm text-neutral-800 font-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Tamil Nadu</option>
          {MAJOR_CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Entry Fee Range Filter */}
      <div className="space-y-2">
        <label className="text-xs font-700 uppercase tracking-wider text-neutral-500 block">
          Entry Fee
        </label>
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3 py-2 text-sm text-neutral-800 font-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {PRICE_FILTERS.map((pf) => (
            <option key={pf.value} value={pf.value}>
              {pf.label}
            </option>
          ))}
        </select>
      </div>

      {/* Participation Type */}
      <div className="space-y-2">
        <label className="text-xs font-700 uppercase tracking-wider text-neutral-500 block">
          Format / Participation
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'all', label: 'All Formats' },
            { value: 'individual', label: 'Individual' },
            { value: 'team', label: 'Team' },
          ].map((pt) => (
            <button
              key={pt.value}
              onClick={() => setParticipationFilter(pt.value)}
              className={`px-3 py-1.5 text-xs font-600 rounded-[6px] border transition-colors ${
                participationFilter === pt.value
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filter */}
      <div className="space-y-2">
        <label className="text-xs font-700 uppercase tracking-wider text-neutral-500 block">
          Date & Timing
        </label>
        <div className="flex flex-col gap-1.5">
          {DATE_FILTERS.map((df) => (
            <label
              key={df.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-600 cursor-pointer transition-colors ${
                dateFilter === df.value
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <input
                type="radio"
                name="dateFilter"
                value={df.value}
                checked={dateFilter === df.value}
                onChange={() => setDateFilter(df.value)}
                className="accent-amber-500"
              />
              <span>{df.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="text-xs font-700 uppercase tracking-wider text-neutral-500 block">
          Category / Gender
        </label>
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-[8px] px-3 py-2 text-sm text-neutral-800 font-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Categories</option>
          <option value="male">Male Only</option>
          <option value="female">Female Only</option>
        </select>
      </div>
    </div>
  );
}
