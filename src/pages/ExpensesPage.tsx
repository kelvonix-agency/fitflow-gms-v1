import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Edit3, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ExportDownloadOverlay } from '../components/ui/ExportDownloadOverlay';
import { EmptyState } from '../components/ui/States';
import { ExpenseModal } from '../components/modals/ExpenseModal';
import { Expense, ExpenseCategory } from '../types';
import { exportToCSV, formatDateIN, formatINR } from '../utils/formatters';

const CATEGORY_FILTERS: Array<'All' | ExpenseCategory> = [
  'All',
  'Rent',
  'Salaries',
  'Utilities',
  'Maintenance',
  'Supplies',
  'Marketing',
  'Other',
];

type PeriodFilter = 'this_month' | 'last_month' | '3m' | 'all';

export function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { store, metrics, deleteExpense } = useGymData();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ExpenseCategory>('All');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this_month');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [exportOverlayOpen, setExportOverlayOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditTarget(null);
      setModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    const prevDt = new Date(curY, now.getMonth() - 1, 1);
    const prevY = prevDt.getFullYear();
    const prevM = prevDt.getMonth() + 1;
    const threeMonthsAgo = new Date(curY, now.getMonth() - 2, 1);
    const threeMonthsISO = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

    return (store?.expenses ?? [])
      .filter((exp) => {
        if (categoryFilter !== 'All' && exp.category !== categoryFilter) return false;
        const [ey, em] = exp.expense_date.split('-').map(Number);
        if (periodFilter === 'this_month' && (ey !== curY || em !== curM)) return false;
        if (periodFilter === 'last_month' && (ey !== prevY || em !== prevM)) return false;
        if (periodFilter === '3m' && exp.expense_date < threeMonthsISO) return false;

        if (q) {
          return (
            exp.title.toLowerCase().includes(q) ||
            exp.category.toLowerCase().includes(q) ||
            (exp.vendor_name?.toLowerCase().includes(q) ?? false)
          );
        }
        return true;
      })
      .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  }, [store, search, categoryFilter, periodFilter]);

  const filteredTotal = useMemo(
    () => filtered.reduce((acc, exp) => acc + exp.amount, 0),
    [filtered],
  );

  const handleExport = () => {
    exportToCSV(
      'fitflow-expenses.csv',
      ['Date', 'Title', 'Category', 'Vendor', 'Method', 'Amount', 'Notes'],
      filtered.map((exp) => [
        exp.expense_date,
        exp.title,
        exp.category,
        exp.vendor_name || '',
        exp.payment_method,
        exp.amount,
        exp.notes || '',
      ]),
    );
    setExportOverlayOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Track rent, payroll, utilities, and equipment costs to measure true gym profit.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] text-xs sm:text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">This Month Expenses</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatINR(metrics.thisMonthExpenses)}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Last Month Expenses</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {formatINR(metrics.lastMonthExpenses)}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">This Month Net Profit</p>
          <p
            className={`mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums ${
              metrics.thisMonthNetProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatINR(metrics.thisMonthNetProfit)}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
            {metrics.profitMarginPct}% margin
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Filtered Total ({filtered.length})</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {formatINR(filteredTotal)}
          </p>
        </div>
      </div>

      {/* Ledger Card */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expense title or vendor..."
              className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-[#F8F7F4] dark:bg-zinc-900 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-medium"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium active:scale-[0.97] transition-all whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200/70 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description="Log your first gym expense or widen the date and category filters."
            actionLabel="+ Log Expense"
            onAction={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-zinc-800 text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                    <th className="py-3 pr-3">Expense</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Vendor</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                  {filtered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40">
                      <td className="py-3 pr-3">
                        <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100">
                          {exp.title}
                        </p>
                        {exp.notes && (
                          <p className="text-[11px] text-stone-400 dark:text-zinc-500 truncate max-w-xs">
                            {exp.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-stone-700 dark:text-zinc-300">
                        {exp.category}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-500 dark:text-zinc-400">
                        {exp.vendor_name || '—'}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-300">
                        {exp.payment_method}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                        {formatDateIN(exp.expense_date)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(exp);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${exp.title}`}
                            className="p-1.5 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(exp)}
                            aria-label={`Delete ${exp.title}`}
                            className="p-1.5 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {filtered.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 space-y-2.5 bg-stone-50/50 dark:bg-zinc-900/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                        {exp.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                        {exp.category} · {exp.payment_method}
                        {exp.vendor_name ? ` · ${exp.vendor_name}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                      {formatINR(exp.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/70 dark:border-zinc-800 text-xs">
                    <span className="text-stone-500 dark:text-zinc-400 tabular-nums">
                      {formatDateIN(exp.expense_date)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(exp);
                          setModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(exp)}
                        aria-label={`Delete ${exp.title}`}
                        className="p-1.5 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-500 hover:text-red-600 bg-white dark:bg-zinc-900"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ExpenseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        editExpense={editTarget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteExpense(deleteTarget.id);
            toast({ title: 'Expense deleted.' });
          }
        }}
        title="Delete Expense"
        message={`Remove "${deleteTarget?.title || 'this expense'}" (${formatINR(deleteTarget?.amount || 0)}) from your ledger?`}
        confirmLabel="Delete Expense"
      />

      <ExportDownloadOverlay
        open={exportOverlayOpen}
        filename="fitflow-expenses.csv"
        label="Downloading Expenses"
        onComplete={() => setExportOverlayOpen(false)}
      />
    </div>
  );
}
