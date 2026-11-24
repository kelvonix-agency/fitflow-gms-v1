import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  IndianRupee,
  Printer,
  Receipt,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useTheme } from '../context/ThemeContext';
import { ExportDownloadOverlay } from '../components/ui/ExportDownloadOverlay';
import { StatusBadge } from '../components/ui/StatusBadge';
import { addDaysISO, exportToCSV, formatDateIN, formatINR, getTodayISO } from '../utils/formatters';

type ReportType =
  | 'profit_loss'
  | 'revenue'
  | 'expenses'
  | 'member_growth'
  | 'expiry'
  | 'attendance'
  | 'payments';
type DateRangeKey = '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';

interface SummaryMetric {
  label: string;
  value: string;
  sub: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
}

interface BreakdownRow {
  label: string;
  valueText: string;
  pct: number;
  color: string;
}

const REPORT_TABS: Array<{ id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'profit_loss', label: 'Profit & Loss', icon: TrendingUp },
  { id: 'revenue', label: 'Revenue', icon: IndianRupee },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'member_growth', label: 'Member Growth', icon: Users },
  { id: 'expiry', label: 'Expiry & Retention', icon: Clock },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const RANGE_OPTIONS: Array<{ id: DateRangeKey; label: string }> = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
  { id: 'custom', label: 'Custom' },
];

const BREAKDOWN_COLORS = ['#EA580C', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
const PAGE_SIZE = 25;

export function ReportsPage() {
  const { store, activeMembersList } = useGymData();
  const { theme } = useTheme();

  const todayISO = getTodayISO();
  const [reportType, setReportType] = useState<ReportType>('profit_loss');
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('6m');
  const [customStart, setCustomStart] = useState(addDaysISO(todayISO, -180));
  const [customEnd, setCustomEnd] = useState(todayISO);
  const [tableQuery, setTableQuery] = useState('');
  const [page, setPage] = useState(1);
  const [exportOverlayOpen, setExportOverlayOpen] = useState(false);

  useEffect(() => {
    setPage(1);
    setTableQuery('');
  }, [reportType, rangeKey, customStart, customEnd]);

  const { startDate, endDate } = useMemo(() => {
    if (rangeKey === 'custom') return { startDate: customStart, endDate: customEnd };
    const daysMap: Record<Exclude<DateRangeKey, 'custom'>, number> = {
      '7d': 7,
      '30d': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
    };
    return {
      startDate: addDaysISO(todayISO, -daysMap[rangeKey]),
      endDate: todayISO,
    };
  }, [rangeKey, customStart, customEnd, todayISO]);

  const reportData = useMemo(() => {
    const payments = store?.payments ?? [];
    const expenses = store?.expenses ?? [];
    const attendance = store?.attendance ?? [];
    const membersById = new Map(activeMembersList.map((m) => [m.id, m]));

    if (reportType === 'profit_loss') {
      const paidInPeriod = payments.filter(
        (p) => p.status === 'Paid' && p.payment_date >= startDate && p.payment_date <= endDate,
      );
      const expInPeriod = expenses.filter(
        (e) => e.expense_date >= startDate && e.expense_date <= endDate,
      );

      const monthMap = new Map<string, { revenue: number; expenses: number }>();
      for (const p of paidInPeriod) {
        const key = p.payment_date.slice(0, 7);
        const cur = monthMap.get(key) ?? { revenue: 0, expenses: 0 };
        cur.revenue += p.amount;
        monthMap.set(key, cur);
      }
      for (const e of expInPeriod) {
        const key = e.expense_date.slice(0, 7);
        const cur = monthMap.get(key) ?? { revenue: 0, expenses: 0 };
        cur.expenses += e.amount;
        monthMap.set(key, cur);
      }

      const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const totalRev = paidInPeriod.reduce((acc, p) => acc + p.amount, 0);
      const totalExp = expInPeriod.reduce((acc, e) => acc + e.amount, 0);
      const netProfit = totalRev - totalExp;
      const marginPct = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;

      const catMap = new Map<string, number>();
      for (const e of expInPeriod) {
        catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
      }
      const breakdown: BreakdownRow[] = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, amt], idx) => ({
          label: cat,
          valueText: formatINR(amt),
          pct: totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0,
          color: BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length],
        }));

      const chart = sortedMonths.map(([ym, vals]) => {
        const [y, m] = ym.split('-').map(Number);
        const label = new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        });
        return {
          label,
          revenue: vals.revenue,
          expenses: vals.expenses,
          value: vals.revenue - vals.expenses,
        };
      });

      const summaryCards: SummaryMetric[] = [
        {
          label: 'Gross Revenue',
          value: formatINR(totalRev),
          sub: `${paidInPeriod.length} paid receipts`,
          tone: 'positive',
        },
        {
          label: 'Total Expenses',
          value: formatINR(totalExp),
          sub: `${expInPeriod.length} expense entries`,
          tone: 'negative',
        },
        {
          label: 'Net Profit',
          value: formatINR(netProfit),
          sub: netProfit >= 0 ? 'Operating surplus' : 'Operating deficit',
          tone: netProfit >= 0 ? 'positive' : 'negative',
        },
        {
          label: 'Profit Margin',
          value: `${marginPct}%`,
          sub: `${sortedMonths.length} active months`,
        },
      ];

      return {
        chartKind: 'dual_bar' as const,
        chartTitle: 'Monthly Revenue vs. Expenses',
        chartSubtitle: 'Side-by-side cash inflow and operating expenditure comparison',
        breakdownTitle: 'Top Cost Drivers',
        breakdown,
        summaryCards,
        chart,
        headers: ['Month', 'Gross Revenue', 'Expenses', 'Net Profit'],
        currencyCols: [1, 2, 3],
        profitCol: 3,
        statusCol: -1,
        rows: sortedMonths.map(([ym, vals]) => [
          ym,
          vals.revenue,
          vals.expenses,
          vals.revenue - vals.expenses,
        ]),
      };
    }

    if (reportType === 'expenses') {
      const filteredExp = expenses
        .filter((e) => e.expense_date >= startDate && e.expense_date <= endDate)
        .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
      const totalExp = filteredExp.reduce((acc, e) => acc + e.amount, 0);
      const byCategory = new Map<string, number>();
      for (const e of filteredExp) {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
      }
      const sortedCats = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
      const topCat = sortedCats[0];

      const chart = sortedCats.map(([label, value]) => ({ label, value }));
      const breakdown: BreakdownRow[] = sortedCats.slice(0, 5).map(([cat, amt], idx) => ({
        label: cat,
        valueText: formatINR(amt),
        pct: totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0,
        color: BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length],
      }));

      const summaryCards: SummaryMetric[] = [
        {
          label: 'Total Spend',
          value: formatINR(totalExp),
          sub: 'Selected period',
          tone: 'negative',
        },
        {
          label: 'Top Category',
          value: topCat ? topCat[0] : '—',
          sub: topCat ? formatINR(topCat[1]) : 'No spend logged',
        },
        {
          label: 'Expense Entries',
          value: `${filteredExp.length}`,
          sub: 'Recorded vouchers',
        },
        {
          label: 'Avg Per Entry',
          value: formatINR(filteredExp.length > 0 ? Math.round(totalExp / filteredExp.length) : 0),
          sub: 'Mean ticket cost',
        },
      ];

      return {
        chartKind: 'bar' as const,
        chartTitle: 'Expenses by Category',
        chartSubtitle: 'Distribution of gym operating costs across categories',
        breakdownTitle: 'Category Share',
        breakdown,
        summaryCards,
        chart,
        headers: ['Date', 'Title', 'Category', 'Vendor', 'Method', 'Amount'],
        currencyCols: [5],
        profitCol: -1,
        statusCol: -1,
        rows: filteredExp.map((e) => [
          e.expense_date,
          e.title,
          e.category,
          e.vendor_name || '—',
          e.payment_method,
          e.amount,
        ]),
      };
    }

    if (reportType === 'revenue' || reportType === 'payments') {
      const filtered = payments
        .filter(
          (p) =>
            p.payment_date >= startDate &&
            p.payment_date <= endDate &&
            (reportType === 'payments' || p.status === 'Paid'),
        )
        .sort((a, b) => b.payment_date.localeCompare(a.payment_date));

      const paidList = filtered.filter((p) => p.status === 'Paid');
      const pendingList = filtered.filter((p) => p.status === 'Pending');
      const collectedSum = paidList.reduce((acc, p) => acc + p.amount, 0);
      const pendingSum = pendingList.reduce((acc, p) => acc + p.amount, 0);

      const byDate = new Map<string, number>();
      for (const p of paidList) {
        byDate.set(p.payment_date, (byDate.get(p.payment_date) ?? 0) + p.amount);
      }
      const chart = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dt, value]) => ({ label: formatDateIN(dt), value }));

      const byMethod = new Map<string, number>();
      for (const p of paidList) {
        byMethod.set(p.payment_method, (byMethod.get(p.payment_method) ?? 0) + p.amount);
      }
      const breakdown: BreakdownRow[] = Array.from(byMethod.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([mode, amt], idx) => ({
          label: mode,
          valueText: formatINR(amt),
          pct: collectedSum > 0 ? Math.round((amt / collectedSum) * 100) : 0,
          color: BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length],
        }));

      const summaryCards: SummaryMetric[] = [
        {
          label: 'Collected Revenue',
          value: formatINR(collectedSum),
          sub: `${paidList.length} paid receipts`,
          tone: 'positive',
        },
        {
          label: 'Pending Dues',
          value: formatINR(pendingSum),
          sub: `${pendingList.length} open invoices`,
          tone: pendingSum > 0 ? 'warning' : 'default',
        },
        {
          label: 'Transactions',
          value: `${filtered.length}`,
          sub: 'All payment events',
        },
        {
          label: 'Avg Ticket Size',
          value: formatINR(paidList.length > 0 ? Math.round(collectedSum / paidList.length) : 0),
          sub: 'Per paid transaction',
        },
      ];

      return {
        chartKind: 'area' as const,
        chartTitle: reportType === 'revenue' ? 'Revenue Collection Trend' : 'Daily Settled Collections',
        chartSubtitle: 'Chronological inflow across UPI, card, cash, and bank transfers',
        breakdownTitle: 'Payment Mode Split',
        breakdown,
        summaryCards,
        chart,
        headers: ['Date', 'Transaction ID', 'Member', 'Method', 'Status', 'Amount'],
        currencyCols: [5],
        profitCol: -1,
        statusCol: 4,
        rows: filtered.map((p) => [
          p.payment_date,
          p.transaction_id,
          membersById.get(p.member_id)?.name || 'Member',
          p.payment_method,
          p.status,
          p.amount,
        ]),
      };
    }

    if (reportType === 'member_growth') {
      const filtered = activeMembersList
        .filter((m) => m.joining_date >= startDate && m.joining_date <= endDate)
        .sort((a, b) => b.joining_date.localeCompare(a.joining_date));

      const byDate = new Map<string, number>();
      for (const m of filtered) {
        byDate.set(m.joining_date, (byDate.get(m.joining_date) ?? 0) + 1);
      }
      const chart = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dt, value]) => ({ label: formatDateIN(dt), value }));

      const planCounts = new Map<string, number>();
      let totalPlanValue = 0;
      for (const m of filtered) {
        const planName = m.currentPlan?.name || 'No Plan';
        planCounts.set(planName, (planCounts.get(planName) ?? 0) + 1);
        totalPlanValue += m.currentPlan?.price || 0;
      }
      const sortedPlans = Array.from(planCounts.entries()).sort((a, b) => b[1] - a[1]);
      const breakdown: BreakdownRow[] = sortedPlans.slice(0, 5).map(([plan, count], idx) => ({
        label: plan,
        valueText: `${count} joined`,
        pct: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0,
        color: BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length],
      }));

      const activeJoiners = filtered.filter((m) => m.derivedStatus === 'active').length;
      const summaryCards: SummaryMetric[] = [
        {
          label: 'New Admissions',
          value: `${filtered.length}`,
          sub: 'Joined in period',
          tone: 'positive',
        },
        {
          label: 'Still Active',
          value: `${activeJoiners}`,
          sub:
            filtered.length > 0
              ? `${Math.round((activeJoiners / filtered.length) * 100)}% retained`
              : '0% retained',
        },
        {
          label: 'Avg Plan Value',
          value: formatINR(filtered.length > 0 ? Math.round(totalPlanValue / filtered.length) : 0),
          sub: 'Initial sign-up value',
        },
        {
          label: 'Top Plan',
          value: sortedPlans[0]?.[0] || '—',
          sub: sortedPlans[0] ? `${sortedPlans[0][1]} members` : 'No joins',
        },
      ];

      return {
        chartKind: 'area' as const,
        chartTitle: 'Member Sign-Up Velocity',
        chartSubtitle: 'New admissions recorded over the selected window',
        breakdownTitle: 'Plan Mix (New Joins)',
        breakdown,
        summaryCards,
        chart,
        headers: ['Member ID', 'Name', 'Phone', 'Plan', 'Join Date', 'Status'],
        currencyCols: [],
        profitCol: -1,
        statusCol: 5,
        rows: filtered.map((m) => [
          m.member_code,
          m.name,
          m.phone,
          m.currentPlan?.name || '—',
          m.joining_date,
          m.derivedStatus,
        ]),
      };
    }

    if (reportType === 'expiry') {
      const expired = activeMembersList.filter((m) => m.derivedStatus === 'expired');
      const expiring = activeMembersList.filter((m) => m.derivedStatus === 'expiring');
      const frozen = activeMembersList.filter((m) => m.derivedStatus === 'frozen');
      const active = activeMembersList.filter((m) => m.derivedStatus === 'active');
      const filtered = [...expired, ...expiring];
      const estRenewalValue = filtered.reduce((acc, m) => acc + (m.currentPlan?.price || 0), 0);

      const chart = [
        { label: 'Active', value: active.length },
        { label: 'Expiring ≤7d', value: expiring.length },
        { label: 'Expired', value: expired.length },
        { label: 'Frozen', value: frozen.length },
      ];

      const totalRoster = activeMembersList.length || 1;
      const breakdown: BreakdownRow[] = [
        {
          label: 'Active',
          valueText: `${active.length} members`,
          pct: Math.round((active.length / totalRoster) * 100),
          color: '#10B981',
        },
        {
          label: 'Expiring ≤7d',
          valueText: `${expiring.length} members`,
          pct: Math.round((expiring.length / totalRoster) * 100),
          color: '#F59E0B',
        },
        {
          label: 'Expired',
          valueText: `${expired.length} members`,
          pct: Math.round((expired.length / totalRoster) * 100),
          color: '#EF4444',
        },
        {
          label: 'Frozen',
          valueText: `${frozen.length} members`,
          pct: Math.round((frozen.length / totalRoster) * 100),
          color: '#3B82F6',
        },
      ];

      const summaryCards: SummaryMetric[] = [
        {
          label: 'Expired Roster',
          value: `${expired.length}`,
          sub: 'Immediate win-back',
          tone: expired.length > 0 ? 'negative' : 'default',
        },
        {
          label: 'Expiring ≤7 Days',
          value: `${expiring.length}`,
          sub: 'Due for reminder',
          tone: expiring.length > 0 ? 'warning' : 'default',
        },
        {
          label: 'Renewal Opportunity',
          value: formatINR(estRenewalValue),
          sub: 'Potential renewal revenue',
          tone: 'positive',
        },
        {
          label: 'Frozen Plans',
          value: `${frozen.length}`,
          sub: 'Paused memberships',
        },
      ];

      return {
        chartKind: 'bar' as const,
        chartTitle: 'Roster Retention Health',
        chartSubtitle: 'Current standing across active, expiring, expired, and frozen memberships',
        breakdownTitle: 'Roster Share',
        breakdown,
        summaryCards,
        chart,
        headers: ['Member ID', 'Name', 'Phone', 'Plan', 'Expiry Date', 'Status'],
        currencyCols: [],
        profitCol: -1,
        statusCol: 5,
        rows: filtered.map((m) => [
          m.member_code,
          m.name,
          m.phone,
          m.currentPlan?.name || '—',
          m.expiryDate || '',
          m.derivedStatus,
        ]),
      };
    }

    // attendance
    const filteredAtt = attendance
      .filter((a) => a.attendance_date >= startDate && a.attendance_date <= endDate)
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
    const presentOnly = filteredAtt.filter((a) => a.status === 'present');
    const absentOnly = filteredAtt.filter((a) => a.status === 'absent');

    const byDate = new Map<string, number>();
    for (const a of presentOnly) {
      byDate.set(a.attendance_date, (byDate.get(a.attendance_date) ?? 0) + 1);
    }
    const sortedDates = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const chart = sortedDates.map(([dt, value]) => ({ label: formatDateIN(dt), value }));

    const peakEntry = sortedDates.reduce<{ date: string; count: number } | null>(
      (best, [dt, cnt]) => (!best || cnt > best.count ? { date: dt, count: cnt } : best),
      null,
    );
    const uniqueVisitors = new Set(presentOnly.map((a) => a.member_id)).size;
    const avgDaily = sortedDates.length > 0 ? Math.round(presentOnly.length / sortedDates.length) : 0;

    const totalMarked = filteredAtt.length || 1;
    const breakdown: BreakdownRow[] = [
      {
        label: 'Present Check-ins',
        valueText: `${presentOnly.length}`,
        pct: Math.round((presentOnly.length / totalMarked) * 100),
        color: '#10B981',
      },
      {
        label: 'Marked Absent',
        valueText: `${absentOnly.length}`,
        pct: Math.round((absentOnly.length / totalMarked) * 100),
        color: '#EF4444',
      },
    ];

    const summaryCards: SummaryMetric[] = [
      {
        label: 'Total Check-ins',
        value: `${presentOnly.length}`,
        sub: 'Present marks',
        tone: 'positive',
      },
      {
        label: 'Daily Average',
        value: `${avgDaily}`,
        sub: `Across ${sortedDates.length} active days`,
      },
      {
        label: 'Unique Members',
        value: `${uniqueVisitors}`,
        sub: 'Distinct gym visitors',
      },
      {
        label: 'Peak Attendance',
        value: peakEntry ? `${peakEntry.count}` : '0',
        sub: peakEntry ? formatDateIN(peakEntry.date) : 'No check-ins',
      },
    ];

    return {
      chartKind: 'area' as const,
      chartTitle: 'Daily Gym Footfall',
      chartSubtitle: 'Verified check-ins per day across the selected timeframe',
      breakdownTitle: 'Attendance Ratio',
      breakdown,
      summaryCards,
      chart,
      headers: ['Date', 'Member', 'Status', 'Check-in Time'],
      currencyCols: [],
      profitCol: -1,
      statusCol: 2,
      rows: filteredAtt.map((a) => [
        a.attendance_date,
        membersById.get(a.member_id)?.name || 'Member',
        a.status,
        a.check_in_time || '—',
      ]),
    };
  }, [store, activeMembersList, reportType, startDate, endDate]);

  const filteredRows = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return reportData.rows;
    return reportData.rows.filter((row) =>
      row.some((cell) => String(cell ?? '').toLowerCase().includes(q)),
    );
  }, [reportData.rows, tableQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const reportFilename = `fitflow-${reportType}-report.csv`;

  const handleExport = () => {
    exportToCSV(reportFilename, reportData.headers, filteredRows);
    setExportOverlayOpen(true);
  };

  const gridStroke = theme === 'dark' ? '#262930' : '#EFECE6';
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#78716C';

  const statusTone = (val: string) => {
    const low = val.toLowerCase();
    if (low === 'paid' || low === 'active' || low === 'present') return 'success' as const;
    if (low === 'pending' || low === 'expiring') return 'warning' as const;
    if (low === 'frozen') return 'info' as const;
    if (low === 'failed' || low === 'expired' || low === 'absent') return 'danger' as const;
    return 'neutral' as const;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Audit P&amp;L margins, collections, retention risk, and daily footfall in one studio.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs sm:text-sm font-medium text-stone-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Unified Report Type & Timeframe Bar */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
          {REPORT_TABS.map((r) => {
            const Icon = r.icon;
            const active = reportType === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setReportType(r.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium active:scale-[0.97] transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100/90 dark:bg-zinc-800/90 text-stone-600 dark:text-zinc-300 hover:bg-stone-200/70 dark:hover:bg-zinc-700/70'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center p-1 rounded-xl bg-stone-100 dark:bg-zinc-800/90">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRangeKey(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  rangeKey === opt.id
                    ? 'bg-white dark:bg-[#181A1F] text-stone-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {rangeKey === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs tabular-nums"
              />
              <span className="text-xs text-stone-400">–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs tabular-nums"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4-Card Executive Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {reportData.summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]"
          >
            <p className="text-xs font-medium text-stone-500 dark:text-zinc-400">{card.label}</p>
            <p
              className={`mt-1.5 font-display text-xl sm:text-2xl font-bold tracking-tight tabular-nums truncate ${
                card.tone === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : card.tone === 'negative'
                    ? 'text-rose-600 dark:text-rose-400'
                    : card.tone === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-stone-900 dark:text-zinc-100'
              }`}
            >
              {card.value}
            </p>
            <p className="mt-1 text-[11px] text-stone-400 dark:text-zinc-500 truncate">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* 2-Column Analytics Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Primary Visualization */}
        <div className="lg:col-span-8 rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
                {reportData.chartTitle}
              </h2>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
                {reportData.chartSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400 shrink-0">
              {reportData.chartKind === 'dual_bar' && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                    Expenses
                  </span>
                </>
              )}
              <span className="tabular-nums text-[11px] text-stone-400 dark:text-zinc-500">
                {formatDateIN(startDate)} – {formatDateIN(endDate)}
              </span>
            </div>
          </div>

          {reportData.chart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center rounded-2xl bg-stone-50/70 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800 px-4">
              <p className="text-sm font-medium text-stone-700 dark:text-zinc-300">
                No records in this timeframe
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                Try switching to 6M / 1Y or choosing another report category.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {reportData.chartKind === 'dual_bar' ? (
                  <BarChart data={reportData.chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as {
                          label: string;
                          revenue: number;
                          expenses: number;
                          value: number;
                        };
                        return (
                          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3.5 py-2.5 shadow-lg text-xs space-y-1">
                            <p className="font-semibold text-stone-900 dark:text-zinc-100">{d.label}</p>
                            <p className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                              Revenue: {formatINR(d.revenue)}
                            </p>
                            <p className="text-rose-600 dark:text-rose-400 tabular-nums">
                              Expenses: {formatINR(d.expenses)}
                            </p>
                            <p className="pt-1 border-t border-stone-100 dark:border-zinc-800 font-semibold tabular-nums">
                              Net: {formatINR(d.value)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="revenue" fill="#10B981" radius={[5, 5, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="expenses" fill="#F43F5E" radius={[5, 5, 0, 0]} maxBarSize={26} />
                  </BarChart>
                ) : reportData.chartKind === 'area' ? (
                  <AreaChart data={reportData.chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EA580C" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#EA580C" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as { label: string; value: number };
                        return (
                          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 shadow-md text-xs">
                            <span className="font-semibold">{d.label}: </span>
                            <span className="tabular-nums">
                              {reportType === 'revenue' || reportType === 'payments'
                                ? formatINR(d.value)
                                : d.value}
                            </span>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#EA580C"
                      strokeWidth={2.4}
                      fill="url(#reportAreaFill)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={reportData.chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as { label: string; value: number };
                        return (
                          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 shadow-md text-xs">
                            <span className="font-semibold">{d.label}: </span>
                            <span className="tabular-nums">
                              {reportType === 'expenses' ? formatINR(d.value) : d.value}
                            </span>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" fill="#EA580C" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Composition Breakdown Panel */}
        <div className="lg:col-span-4 rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              {reportData.breakdownTitle}
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
              Proportional breakdown for this report
            </p>

            {reportData.breakdown.length === 0 ? (
              <p className="py-12 text-center text-xs text-stone-400 dark:text-zinc-500">
                No breakdown data available in this range.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {reportData.breakdown.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-stone-800 dark:text-zinc-200 truncate">
                        {item.label}
                      </span>
                      <span className="text-stone-600 dark:text-zinc-300 font-semibold tabular-nums whitespace-nowrap">
                        {item.valueText}{' '}
                        <span className="text-stone-400 dark:text-zinc-500 font-normal">
                          ({item.pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, item.pct)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
            <span>Rows ready to export</span>
            <span className="font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
              {filteredRows.length} records
            </span>
          </div>
        </div>
      </div>

      {/* Report Explorer Table */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              Detailed Ledger ({filteredRows.length})
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Filter rows before exporting to CSV
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableQuery}
              onChange={(e) => {
                setTableQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search report rows..."
              className="w-full rounded-full border border-stone-200 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-900/60 pl-9 pr-3.5 py-2 text-xs text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <p className="py-10 text-center text-xs text-stone-500 dark:text-zinc-400">
            No matching rows found for the selected filter.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-zinc-800 text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                    {reportData.headers.map((h) => (
                      <th key={h} className="py-2.5 pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                  {paginatedRows.map((row, i) => (
                    <tr key={i} className="text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40">
                      {row.map((cell, j) => {
                        const isStatus = j === reportData.statusCol;
                        const isCurrency =
                          typeof cell === 'number' && reportData.currencyCols.includes(j);
                        const isProfit = j === reportData.profitCol && typeof cell === 'number';
                        return (
                          <td
                            key={j}
                            className={`py-2.5 pr-4 tabular-nums whitespace-nowrap ${
                              isProfit
                                ? (cell as number) >= 0
                                  ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                  : 'font-semibold text-rose-600 dark:text-rose-400'
                                : isCurrency
                                  ? 'font-medium text-stone-900 dark:text-zinc-100'
                                  : ''
                            }`}
                          >
                            {isStatus ? (
                              <StatusBadge label={String(cell)} tone={statusTone(String(cell))} />
                            ) : isCurrency ? (
                              formatINR(cell as number)
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-zinc-400">
                <span className="tabular-nums">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 w-8 rounded-full border border-stone-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-zinc-800"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 font-medium tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 w-8 rounded-full border border-stone-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-zinc-800"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ExportDownloadOverlay
        open={exportOverlayOpen}
        filename={reportFilename}
        label="Downloading Report"
        onComplete={() => setExportOverlayOpen(false)}
      />
    </div>
  );
}
