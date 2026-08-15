import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, Trophy, Calendar, DollarSign, Users } from 'lucide-react';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { adminService } from '../../services/adminService.js';
import { formatPrice } from '../../utils/formatters.js';

export default function AdminReportsPage() {
  const [metrics, setMetrics] = useState(null);
  const [reportData, setReportData] = useState({ districts: [], sports: [] });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      try {
        const mData = await adminService.getPlatformMetrics();
        const rData = await adminService.getReportsData();
        if (active) {
          setMetrics(mData);
          setReportData(rData);
        }
      } catch (err) {
        console.error('Error loading admin reports:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [dateRange]);

  const totalDistrictEvents = reportData.districts.reduce((sum, d) => sum + d.count, 0);
  const totalSportEvents = reportData.sports.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={24} className="text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Platform Analytics & Tamil Nadu Reports
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Comprehensive platform statistics, district activity breakdown, and sports distribution analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-[8px] p-1">
          {['all', '30d', '7d', 'today'].map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-700 uppercase transition-colors ${
                dateRange === r ? 'bg-amber-500 text-neutral-950 font-800' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {r === 'all' ? 'All Time' : r === '30d' ? '30 Days' : r === '7d' ? '7 Days' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {/* Numeric Overview Cards */}
      {loading || !metrics ? (
        <SectionSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
            <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Users</span>
            <span className="text-2xl font-800 text-white">{metrics.totalUsers}</span>
            <span className="text-[10px] text-neutral-500 block">{metrics.verifiedOrganizers} Verified Organizers</span>
          </div>

          <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
            <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Published Events</span>
            <span className="text-2xl font-800 text-green-400">{metrics.publishedEvents}</span>
            <span className="text-[10px] text-neutral-500 block">{metrics.draftEvents} Drafts</span>
          </div>

          <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
            <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Registrations</span>
            <span className="text-2xl font-800 text-white">{metrics.totalRegistrations}</span>
            <span className="text-[10px] text-green-400 block">{metrics.confirmedRegistrations} Confirmed</span>
          </div>

          <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
            <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Registration Payments</span>
            <span className="text-xl font-800 text-amber-400">{formatPrice(metrics.totalRegistrationPayments)}</span>
            <span className="text-[10px] text-neutral-500 block">Gross user entry fees</span>
          </div>
        </div>
      )}

      {/* Visual Analytics Grid */}
      {loading ? (
        <SectionSkeleton count={2} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tamil Nadu District Activity */}
          <div className="bg-neutral-900 rounded-[20px] border border-neutral-800 p-6 space-y-4 shadow-sm">
            <h3 className="font-800 text-white text-base flex items-center gap-2">
              <MapPin size={18} className="text-amber-400" />
              Tamil Nadu District Activity
            </h3>

            {reportData.districts.length > 0 ? (
              <div className="space-y-3 pt-2">
                {reportData.districts.map((d) => {
                  const pct = Math.round((d.count / Math.max(1, totalDistrictEvents)) * 100);
                  return (
                    <div key={d.name} className="space-y-1 text-xs">
                      <div className="flex justify-between font-700 text-white">
                        <span>{d.name}</span>
                        <span>{d.count} Event{d.count > 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 py-4">District activity statistics will populate as tournaments are published.</p>
            )}
          </div>

          {/* Sports Category Breakdown */}
          <div className="bg-neutral-900 rounded-[20px] border border-neutral-800 p-6 space-y-4 shadow-sm">
            <h3 className="font-800 text-white text-base flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              Sports Category Breakdown
            </h3>

            {reportData.sports.length > 0 ? (
              <div className="space-y-3 pt-2">
                {reportData.sports.map((s) => {
                  const pct = Math.round((s.count / Math.max(1, totalSportEvents)) * 100);
                  return (
                    <div key={s.name} className="space-y-1 text-xs">
                      <div className="flex justify-between font-700 text-white">
                        <span>{s.name}</span>
                        <span>{s.count} Event{s.count > 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 py-4">Sports category statistics will populate as events are registered.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
