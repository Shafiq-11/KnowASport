import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Search, DollarSign, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { adminService } from '../../services/adminService.js';
import { formatDateShort, formatPrice } from '../../utils/formatters.js';

export default function AdminPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get('status') || 'all';
  const queryParam = searchParams.get('q') || '';

  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({ gross: 0, captured: 0, platform: 0, organizer: 0 });
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [statusFilter, setStatusFilter] = useState(statusParam);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const data = await adminService.getPaymentsList({
          query: searchQuery,
          statusFilter,
        });

        if (active) {
          setPayments(data || []);
          const gross = data.filter((p) => p.status === 'captured').reduce((sum, p) => sum + Number(p.amount || 0), 0);
          setMetrics({
            gross,
            captured: gross,
            platform: 0, // Fee model not configured yet — defaults strictly to 0
            organizer: gross,
          });
        }
      } catch (err) {
        console.error('Error loading admin payments list:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(loadData, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, statusFilter]);

  const updateFilters = (newStatus, newQuery) => {
    const params = {};
    if (newStatus !== 'all') params.status = newStatus;
    if (newQuery.trim()) params.q = newQuery;
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={22} className="text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Razorpay Financial Audit & Transactions
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Audit captured payment orders, order IDs, and entry fee settlements.
          </p>
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Total Registration Payments</span>
          <span className="text-xl font-800 text-white">{formatPrice(metrics.gross)}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Captured Payments</span>
          <span className="text-xl font-800 text-green-400">{formatPrice(metrics.captured)}</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Platform Fees</span>
          <span className="text-xl font-800 text-neutral-400">{formatPrice(metrics.platform)}</span>
          <span className="text-[10px] text-neutral-500 block">Not configured (₹0)</span>
        </div>

        <div className="bg-neutral-900 rounded-[14px] border border-neutral-800 p-4 space-y-1">
          <span className="text-[11px] font-700 text-neutral-400 uppercase tracking-wide block">Organizer Amount</span>
          <span className="text-xl font-800 text-amber-400">{formatPrice(metrics.organizer)}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-72 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search payment or order ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateFilters(statusFilter, e.target.value);
            }}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              updateFilters(e.target.value, searchQuery);
            }}
            className="bg-neutral-950 border border-neutral-800 rounded-[8px] px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="captured">Captured</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {(statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
                setSearchParams({}, { replace: true });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-neutral-800 hover:bg-neutral-700 text-xs font-700 text-neutral-300 transition-colors"
            >
              <RotateCcw size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Payment Records Data Table */}
      {loading ? (
        <SectionSkeleton count={4} />
      ) : payments.length > 0 ? (
        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-700 uppercase tracking-wider text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-600">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-700 text-white">{pay.razorpay_payment_id || pay.id}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">{pay.razorpay_order_id || 'order_kas_1001'}</td>
                    <td className="py-3.5 px-4 font-800 text-green-400">{formatPrice(pay.amount || 0)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-800 uppercase ${
                        pay.status === 'captured' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">{formatDateShort(pay.paid_at || pay.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CreditCard}
          title="No payment records found"
          description="No financial payment records match your search criteria."
        />
      )}
    </div>
  );
}
