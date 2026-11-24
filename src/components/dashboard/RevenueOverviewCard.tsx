import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGymData } from '../../context/GymDataContext';
import { useTheme } from '../../context/ThemeContext';
import { addDaysISO, formatDateIN, formatINR, getTodayISO } from '../../utils/formatters';

type RangeKey = '7D' | '30D' | '3M' | '1Y';

export function RevenueOverviewCard() {
  const { store, metrics } = useGymData();
  const { theme } = useTheme();
  const [range, setRange] = useState<RangeKey>('30D');

  const chartData = useMemo(() => {
    const payments = (store?.payments ?? []).filter((p) => p.status === 'Paid');
    const todayISO = getTodayISO();

    if (range === '7D' || range === '30D') {
      const days = range === '7D' ? 7 : 30;
      const byDay = new Map<string, number>();
      for (const p of payments) {
        byDay.set(p.payment_date, (byDay.get(p.payment_date) ?? 0) + p.amount);
      }

      const points: Array<{ label: string; fullDate: string; revenue: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const dtStr = addDaysISO(todayISO, -i);
        const dt = new Date(dtStr + 'T00:00:00');
        const label = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        points.push({
          label,
          fullDate: formatDateIN(dtStr),
          revenue: byDay.get(dtStr) ?? 0,
        });
      }
      return points;
    }

    if (range === '3M') {
      // Weekly buckets across last 12 weeks
      const points: Array<{ label: string; fullDate: string; revenue: number }> = [];
      for (let w = 11; w >= 0; w--) {
        const end = addDaysISO(todayISO, -w * 7);
        const start = addDaysISO(end, -6);
        const sum = payments
          .filter((p) => p.payment_date >= start && p.payment_date <= end)
          .reduce((acc, p) => acc + p.amount, 0);
        const dt = new Date(end + 'T00:00:00');
        points.push({
          label: dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          fullDate: `${formatDateIN(start)} – ${formatDateIN(end)}`,
          revenue: sum,
        });
      }
      return points;
    }

    // 1Y: Monthly buckets across last 12 months
    const now = new Date();
    const points: Array<{ label: string; fullDate: string; revenue: number }> = [];
    for (let m = 11; m >= 0; m--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const y = dt.getFullYear();
      const mon = dt.getMonth() + 1;
      const sum = payments
        .filter((p) => {
          const [py, pm] = p.payment_date.split('-').map(Number);
          return py === y && pm === mon;
        })
        .reduce((acc, p) => acc + p.amount, 0);
      points.push({
        label: dt.toLocaleDateString('en-IN', { month: 'short' }),
        fullDate: dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        revenue: sum,
      });
    }
    return points;
  }, [store, range]);

  const periodTotal = useMemo(
    () => chartData.reduce((acc, item) => acc + item.revenue, 0),
    [chartData],
  );

  const gridStroke = theme === 'dark' ? '#262930' : '#EFECE6';
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#78716C';

  return (
    <div className="h-full rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-zinc-400">Revenue Overview</p>
          <div className="mt-1.5 flex items-baseline gap-3 flex-wrap">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums">
              {formatINR(metrics.thisMonthRevenue)}
            </h2>
            <span
              className={`text-xs font-semibold tabular-nums ${
                metrics.revenueGrowthPct >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {metrics.revenueGrowthPct >= 0 ? '+' : ''}
              {metrics.revenueGrowthPct}% vs last month
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-stone-100 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800 self-start">
          {(['7D', '30D', '3M', '1Y'] as RangeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                range === key
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="fitflowOrangeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EA580C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EA580C" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              minTickGap={22}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as { fullDate: string; revenue: number };
                return (
                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3 py-2 shadow-lg">
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400">{item.fullDate}</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-zinc-100 tabular-nums mt-0.5">
                      {formatINR(item.revenue)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#EA580C"
              strokeWidth={2.2}
              fill="url(#fitflowOrangeFill)"
              activeDot={{ r: 5, fill: '#EA580C', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-800 grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">Expenses (Month)</p>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums truncate">
            {formatINR(metrics.thisMonthExpenses)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
            Net Profit ({metrics.profitMarginPct}%)
          </p>
          <p
            className={`mt-0.5 text-xs sm:text-sm font-semibold tabular-nums truncate ${
              metrics.thisMonthNetProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatINR(metrics.thisMonthNetProfit)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">{range} Collected</p>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400 tabular-nums truncate">
            {formatINR(periodTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
