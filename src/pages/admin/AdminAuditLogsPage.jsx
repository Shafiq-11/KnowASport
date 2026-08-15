import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, Clock, Lock } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { adminService } from '../../services/adminService.js';
import { formatDate } from '../../utils/formatters.js';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      setLoading(true);
      try {
        const data = await adminService.getAuditLogs();
        if (active) setLogs(data || []);
      } catch (err) {
        console.error('Error loading admin audit logs:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLogs();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="border-b border-neutral-800 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={22} className="text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Immutable Admin Audit Logs
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Append-only audit trail logging every administrative verification, publication, and moderation decision.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-700 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-[8px] border border-green-500/20">
          <Lock size={14} />
          <span>Append-Only Security Active</span>
        </div>
      </div>

      {loading ? (
        <SectionSkeleton count={4} />
      ) : logs.length > 0 ? (
        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-700 uppercase tracking-wider text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-600">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-neutral-400">{formatDate(log.created_at)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-800 bg-amber-500/20 text-amber-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-white">{log.target_type}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">{log.target_id}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                      {JSON.stringify(log.details_json || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No audit logs recorded"
          description="Administrative moderation actions will be recorded here automatically."
        />
      )}
    </div>
  );
}
