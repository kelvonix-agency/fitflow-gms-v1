import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Plus } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useTheme } from '../context/ThemeContext';
import { ExpenseModal } from '../components/modals/ExpenseModal';
import { formatINR } from '../utils/formatters';

const METHOD_COLORS = ['#EA580C', '#10B981', '#3B82F6', '#78716C'];

export function RevenuePage() {
  const navigate = useNavigate();
  const { store, metrics } = useGymData();
  const { theme } = useTheme();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const { byMonth, byPlan, byMethod, byExpenseCategory } = useMemo(() => {
    const payments = (store?.payments ?? []).filter((p) => p.status === 'Paid');
    const expenses = store?.expenses ?? [];
    const membershipsById = new Map((store?.memberships ?? []).map((ms) => [ms.id, ms]));
    const plansById = new Map((store?.plans ?? []).map((pl) => [pl.id, pl]));

    // Last 12 months Revenue vs Expenses
    const now = new Date();
    const monthly: Array<{ month: string; revenue: number; expenses: number; profit: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = dt.getFullYear();
      const m = dt.getMonth() + 1;
      const revSum = payments
        .filter((p) => {
          const [py, pm] = p.payment_date.split('-').map(Number);
          return py === y && pm === m;
        })
        .reduce((acc, p) => acc + p.amount, 0);
      const expSum = expenses
        .filter((exp) => {
          const [ey, em] = exp.expense_date.split('-').map(Number);
          return ey === y && em === m;
        })
        .reduce((acc, exp) => acc + exp.amount, 0);
      monthly.push({
        month: dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: revSum,
        expenses: expSum,
        profit: revSum - expSum,
      });
    }

    // By Plan
    const planTotals = new Map<string, number>();
    for (const p of payments) {
      const ms = p.membership_id ? membershipsById.get(p.membership_id) : undefined;
      const planName = ms ? plansById.get(ms.plan_id)?.name || 'Other' : 'Other / Add-ons';
      planTotals.set(planName, (planTotals.get(planName) ?? 0) + p.amount);
    }
    const planData = Array.from(planTotals.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);

    // By Payment Method
    const methodTotals = new Map<string, number>();
    for (const p of payments) {
      methodTotals.set(p.payment_method, (methodTotals.get(p.payment_method) ?? 0) + p.amount);
    }
    const methodData = Array.from(methodTotals.entries()).map(([name, value]) => ({ name, value }));

    // Expenses by Category (All-Time or Current Month? Let's show Current Month + All-Time? Let's show This Month if any, else All)
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    const expCatTotals = new Map<string, number>();
    for (const exp of expenses) {
      const [ey, em] = exp.expense_date.split('-').map(Number);
      if (ey === curY && em === curM) {
        expCatTotals.set(exp.category, (expCatTotals.get(exp.category) ?? 0) + exp.amount);
      }
    }
    const expCatData = Array.from(expCatTotals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      byMonth: monthly,
      byPlan: planData,
      byMethod: methodData,
      byExpenseCategory: expCatData,
    };
  }, [store]);

  const gridStroke = theme === 'dark' ? '#262930' : '#EFECE6';
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#78716C';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Revenue &amp; Profit
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Track gross collections, operating expenses, and true monthly net profit.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] text-xs sm:text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <span>Manage Expenses</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setExpenseModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* P&L KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">This Month Revenue</p>
          <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {formatINR(metrics.thisMonthRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
            {metrics.revenueGrowthPct >= 0 ? '+' : ''}
            {metrics.revenueGrowthPct}% vs last month
          </p>
        </div>

        <div className="rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">This Month Expenses</p>
          <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatINR(metrics.thisMonthExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
            Last month {formatINR(metrics.lastMonthExpenses)}
          </p>
        </div>

        <div className="rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Net Profit (This Month)</p>
          <p
            className={`mt-1.5 font-display text-xl sm:text-2xl font-bold tabular-nums ${
              metrics.thisMonthNetProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatINR(metrics.thisMonthNetProfit)}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
            {metrics.profitMarginPct}% operating margin
          </p>
        </div>

        <div className="rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5">
          <p className="text-xs text-stone-500 dark:text-zinc-400">All-Time Net Profit</p>
          <p
            className={`mt-1.5 font-display text-xl sm:text-2xl font-bold tabular-nums ${
              metrics.totalNetProfit >= 0
                ? 'text-stone-900 dark:text-zinc-100'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatINR(metrics.totalNetProfit)}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
            Gross {formatINR(metrics.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Revenue vs Expenses (12M P&L) */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              Revenue vs. Expenses (12 Months)
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Compare monthly fee collections against operating expenses
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-600" aria-hidden="true" />
              <span>Revenue</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" />
              <span>Expenses</span>
            </span>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMonth} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as {
                    month: string;
                    revenue: number;
                    expenses: number;
                    profit: number;
                  };
                  return (
                    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3.5 py-2.5 shadow-lg text-xs space-y-1">
                      <p className="font-semibold text-stone-900 dark:text-zinc-100">{d.month}</p>
                      <div className="flex items-center justify-between gap-5">
                        <span className="text-stone-500 dark:text-zinc-400">Revenue</span>
                        <span className="font-semibold text-orange-600 tabular-nums">
                          {formatINR(d.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-5">
                        <span className="text-stone-500 dark:text-zinc-400">Expenses</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatINR(d.expenses)}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-5">
                        <span className="text-stone-600 dark:text-zinc-300 font-medium">Net Profit</span>
                        <span
                          className={`font-bold tabular-nums ${
                            d.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                          }`}
                        >
                          {formatINR(d.profit)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="revenue" fill="#EA580C" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdowns: Expense Categories, Revenue by Plan, Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              Expenses by Category
            </h2>
            <span className="text-[11px] text-stone-400 dark:text-zinc-500">This month</span>
          </div>
          {byExpenseCategory.length === 0 ? (
            <p className="py-12 text-center text-xs text-stone-500 dark:text-zinc-400">
              No expenses logged this month yet.
            </p>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byExpenseCategory} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: tickColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tick={{ fontSize: 11, fill: tickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { name: string; amount: number };
                      return (
                        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 shadow-md text-xs">
                          <span className="font-semibold">{d.name}: </span>
                          <span className="tabular-nums">{formatINR(d.amount)}</span>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="amount" fill="#F43F5E" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100 mb-4">
            Revenue by Plan
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPlan} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={102}
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as { name: string; revenue: number };
                    return (
                      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 shadow-md text-xs">
                        <span className="font-semibold">{d.name}: </span>
                        <span className="tabular-nums">{formatINR(d.revenue)}</span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="revenue" fill="#EA580C" radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100 mb-4">
            Payment Modes
          </h2>
          <div className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byMethod}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {byMethod.map((entry, idx) => (
                      <Cell key={entry.name} fill={METHOD_COLORS[idx % METHOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { name: string; value: number };
                      return (
                        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 shadow-md text-xs">
                          <span className="font-semibold">{d.name}: </span>
                          <span className="tabular-nums">{formatINR(d.value)}</span>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {byMethod.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-stone-700 dark:text-zinc-300">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: METHOD_COLORS[idx % METHOD_COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
                    {formatINR(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
    </div>
  );
}
