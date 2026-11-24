import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, Download, FileText, Plus, Search } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/States';
import { ExportDownloadOverlay } from '../components/ui/ExportDownloadOverlay';
import { FeeReceiptModal } from '../components/modals/FeeReceiptModal';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import { addDaysISO, exportToCSV, formatDateIN, formatINR, getTodayISO } from '../utils/formatters';

export function PaymentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { store, metrics, updatePaymentStatus } = useGymData();
  const { toast } = useToast();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'All');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | 'month'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [recordOpen, setRecordOpen] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<Payment | null>(null);
  const [exportOverlayOpen, setExportOverlayOpen] = useState(false);

  useEffect(() => {
    const st = searchParams.get('status');
    const q = searchParams.get('search');
    if (st) setStatusFilter(st);
    if (q) setSearch(q);
  }, [searchParams]);

  const membersById = useMemo(
    () => new Map((store?.members ?? []).map((m) => [m.id, m])),
    [store],
  );
  const membershipsById = useMemo(
    () => new Map((store?.memberships ?? []).map((ms) => [ms.id, ms])),
    [store],
  );
  const plansById = useMemo(
    () => new Map((store?.plans ?? []).map((p) => [p.id, p])),
    [store],
  );

  const filtered = useMemo(() => {
    const todayISO = getTodayISO();
    const weekAgoISO = addDaysISO(todayISO, -6);
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    const q = search.trim().toLowerCase();

    return (store?.payments ?? [])
      .filter((p) => {
        if (statusFilter !== 'All' && p.status !== statusFilter) return false;
        if (methodFilter !== 'All' && p.payment_method !== methodFilter) return false;
        if (dateFilter === 'today' && p.payment_date !== todayISO) return false;
        if (dateFilter === '7d' && (p.payment_date < weekAgoISO || p.payment_date > todayISO)) return false;
        if (dateFilter === 'month') {
          const [py, pm] = p.payment_date.split('-').map(Number);
          if (py !== curY || pm !== curM) return false;
        }
        if (q) {
          const mem = membersById.get(p.member_id);
          return (
            p.transaction_id.toLowerCase().includes(q) ||
            (mem?.name.toLowerCase().includes(q) ?? false) ||
            (mem?.member_code.toLowerCase().includes(q) ?? false)
          );
        }
        return true;
      })
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  }, [store, statusFilter, methodFilter, dateFilter, search, membersById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getPlanName = (membershipId?: string) => {
    if (!membershipId) return '—';
    const ms = membershipsById.get(membershipId);
    if (!ms) return '—';
    return plansById.get(ms.plan_id)?.name || '—';
  };

  const handleExport = () => {
    exportToCSV(
      'fitflow-payments.csv',
      ['Transaction ID', 'Member', 'Type', 'Plan', 'Amount', 'Method', 'Status', 'Date'],
      filtered.map((p) => [
        p.transaction_id,
        membersById.get(p.member_id)?.name || 'Member',
        p.payment_type,
        getPlanName(p.membership_id),
        p.amount,
        p.payment_method,
        p.status,
        p.payment_date,
      ]),
    );
    setExportOverlayOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Payments
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Track collected fees, pending dues, and transaction history.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] text-xs sm:text-sm font-medium text-stone-700 dark:text-zinc-200 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setRecordOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Total Collected</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {formatINR(metrics.totalRevenue)}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Pending ({metrics.pendingPaymentsCount})</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatINR(metrics.pendingPaymentsTotal)}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">This Month</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {formatINR(metrics.thisMonthRevenue)}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Today</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatINR(metrics.todayRevenue)}
          </p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search member or transaction ID..."
              className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-[#F8F7F4] dark:bg-zinc-900 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as 'all' | 'today' | '7d' | 'month');
                setPage(1);
              }}
              className="w-full sm:w-auto rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="month">This Month</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                setPage(1);
                if (val === 'All') searchParams.delete('status');
                else searchParams.set('status', val);
                setSearchParams(searchParams, { replace: true });
              }}
              className="w-full sm:w-auto rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium"
            >
              <option value="All">All Statuses</option>
              {(['Paid', 'Pending', 'Failed', 'Refunded'] as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium"
            >
              <option value="All">All Methods</option>
              {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No transactions found"
            description="Adjust your filters or record a new payment."
            actionLabel="+ Record Payment"
            onAction={() => setRecordOpen(true)}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-zinc-800 text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                    <th className="py-3 pr-3">Transaction ID</th>
                    <th className="py-3 px-3">Member</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                  {paginated.map((p) => {
                    const member = membersById.get(p.member_id);
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40">
                        <td className="py-3 pr-3 text-xs font-mono-num text-stone-600 dark:text-zinc-400">
                          {p.transaction_id}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => member && navigate(`/members/${member.id}`)}
                            className="text-xs font-semibold text-stone-900 dark:text-zinc-100 hover:text-orange-600"
                          >
                            {member?.name || 'Member'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-300">
                          {p.payment_type}
                        </td>
                        <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-300">
                          {getPlanName(p.membership_id)}
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-300">
                          {p.payment_method}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge
                            label={p.status}
                            tone={
                              p.status === 'Paid'
                                ? 'success'
                                : p.status === 'Pending'
                                  ? 'warning'
                                  : p.status === 'Failed'
                                    ? 'danger'
                                    : 'neutral'
                            }
                          />
                        </td>
                        <td className="py-3 px-3 text-xs text-stone-500 dark:text-zinc-400 tabular-nums">
                          {formatDateIN(p.payment_date)}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          {p.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => {
                                updatePaymentStatus(p.id, 'Paid');
                                toast({ title: 'Payment marked as Paid.' });
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Mark Paid</span>
                            </button>
                          ) : p.status === 'Paid' ? (
                            <button
                              type="button"
                              onClick={() => setReceiptTarget(p)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 text-orange-600" />
                              <span>Receipt</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => member && navigate(`/members/${member.id}`)}
                              className="px-3 py-1 rounded-full text-xs font-medium text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800"
                            >
                              View Member
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {paginated.map((p) => {
                const member = membersById.get(p.member_id);
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 space-y-2.5 bg-stone-50/50 dark:bg-zinc-900/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => member && navigate(`/members/${member.id}`)}
                          className="text-left text-sm font-semibold text-stone-900 dark:text-zinc-100 hover:text-orange-600 transition-colors truncate block"
                        >
                          {member?.name || 'Member'}
                        </button>
                        <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono-num">
                          {p.transaction_id} · {p.payment_method}
                        </p>
                      </div>
                      <StatusBadge
                        label={p.status}
                        tone={
                          p.status === 'Paid'
                            ? 'success'
                            : p.status === 'Pending'
                              ? 'warning'
                              : p.status === 'Failed'
                                ? 'danger'
                                : 'neutral'
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/70 dark:border-zinc-800">
                      <span className="text-stone-500 tabular-nums">{formatDateIN(p.payment_date)}</span>
                      <span className="font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
                        {formatINR(p.amount)}
                      </span>
                    </div>
                    {p.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          updatePaymentStatus(p.id, 'Paid');
                          toast({ title: 'Payment marked as Paid.' });
                        }}
                        className="w-full py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                    {p.status === 'Paid' && (
                      <button
                        type="button"
                        onClick={() => setReceiptTarget(p)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-200 text-xs font-semibold active:scale-[0.98] transition-all"
                      >
                        <FileText className="h-3.5 w-3.5 text-orange-600" />
                        <span>View / Share Receipt</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-zinc-800 text-xs text-stone-500 dark:text-zinc-400">
              <span className="tabular-nums">
                Page {safePage} of {totalPages} ({filtered.length} transactions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-zinc-800 whitespace-nowrap"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-zinc-800 whitespace-nowrap"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <RecordPaymentModal open={recordOpen} onClose={() => setRecordOpen(false)} />
      <FeeReceiptModal
        open={Boolean(receiptTarget)}
        onClose={() => setReceiptTarget(null)}
        payment={receiptTarget}
        member={receiptTarget ? membersById.get(receiptTarget.member_id) : undefined}
        planName={receiptTarget ? getPlanName(receiptTarget.membership_id) : undefined}
        validTill={
          receiptTarget?.membership_id
            ? membershipsById.get(receiptTarget.membership_id)?.end_date
            : undefined
        }
      />
      <ExportDownloadOverlay
        open={exportOverlayOpen}
        filename="fitflow-payments.csv"
        label="Downloading Payments"
        onComplete={() => setExportOverlayOpen(false)}
      />
    </div>
  );
}
