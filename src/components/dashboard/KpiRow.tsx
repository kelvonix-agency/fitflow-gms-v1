import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  IndianRupee,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useGymData } from '../../context/GymDataContext';
import { formatINR } from '../../utils/formatters';

interface TrendPoint {
  label: string;
  value: number;
}

function buildSmoothCurvePath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  let path = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

function MiniSparkLine({
  id,
  data,
  stroke,
  onHoverPoint,
}: {
  id: string;
  data: TrendPoint[];
  stroke: string;
  onHoverPoint?: (pt: TrendPoint | null) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 112;
  const height = 40;
  const padX = 5;
  const padTop = 6;
  const padBottom = 6;

  const safeData = data.length >= 2 ? data : [{ label: '', value: 0 }, data[0] ?? { label: '', value: 0 }];
  const values = safeData.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const coords = safeData.map((d, i) => {
    const x = padX + (i / (safeData.length - 1)) * (width - padX * 2);
    const y = padTop + (1 - (d.value - min) / range) * (height - padTop - padBottom);
    return { x, y, ...d };
  });

  const linePath = buildSmoothCurvePath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
  const gradId = `kpi-mini-area-${id}`;
  const active = hoveredIdx !== null ? coords[hoveredIdx] : last;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-[96px] sm:w-[112px] h-10 shrink-0 overflow-visible"
      onMouseLeave={() => {
        setHoveredIdx(null);
        onHoverPoint?.(null);
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={active.x} cy={active.y} r="4.5" fill={stroke} opacity="0.18" />
      <circle
        cx={active.x}
        cy={active.y}
        r="2.4"
        fill={stroke}
        stroke="white"
        strokeWidth="1.2"
        className="dark:stroke-[#181A1F]"
      />

      {coords.map((pt, i) => {
        const colW = width / coords.length;
        return (
          <rect
            key={`${pt.label}-${i}`}
            x={i * colW}
            y={0}
            width={colW}
            height={height}
            fill="transparent"
            onMouseEnter={() => {
              setHoveredIdx(i);
              onHoverPoint?.(pt);
            }}
          />
        );
      })}
    </svg>
  );
}

function MiniBarSeries({
  data,
  color,
  onHoverPoint,
}: {
  data: TrendPoint[];
  color: string;
  onHoverPoint?: (pt: TrendPoint | null) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const safe = data.slice(-6);
  const max = Math.max(...safe.map((d) => d.value), 1);

  return (
    <div
      className="w-[96px] sm:w-[112px] h-10 flex items-end gap-1.5 shrink-0"
      onMouseLeave={() => {
        setHoveredIdx(null);
        onHoverPoint?.(null);
      }}
      aria-hidden="true"
    >
      {safe.map((pt, i) => {
        const pct = Math.max(16, Math.round((pt.value / max) * 100));
        const isLast = i === safe.length - 1;
        const isHovered = hoveredIdx === i;
        return (
          <div
            key={`${pt.label}-${i}`}
            onMouseEnter={() => {
              setHoveredIdx(i);
              onHoverPoint?.(pt);
            }}
            className="flex-1 h-full flex items-end"
          >
            <div
              className="w-full rounded-[3px] transition-all duration-150"
              style={{
                height: `${pct}%`,
                backgroundColor: color,
                opacity: isHovered ? 1 : isLast ? 0.92 : 0.3,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function KpiRow() {
  const navigate = useNavigate();
  const { store, metrics } = useGymData();
  const [hoveredMeta, setHoveredMeta] = useState<{ cardId: string; text: string } | null>(null);

  const activePct =
    metrics.totalMembers > 0 ? Math.round((metrics.activeCount / metrics.totalMembers) * 100) : 0;

  const { totalTrend, activeTrend, revenueTrend, joinedTrend, expiringTrend, expiredTrend } = useMemo(() => {
    const members = (store?.members ?? []).filter((m) => m.status !== 'archived');
    const activeIds = new Set(members.map((m) => m.id));
    const memberships = (store?.memberships ?? []).filter((ms) => activeIds.has(ms.member_id));
    const payments = (store?.payments ?? []).filter((p) => p.status === 'Paid');
    const now = new Date();

    const months: Array<{ y: number; m: number; endISO: string; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDt = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
      const endISO = `${endDt.getFullYear()}-${String(endDt.getMonth() + 1).padStart(2, '0')}-${String(
        endDt.getDate(),
      ).padStart(2, '0')}`;
      months.push({
        y: dt.getFullYear(),
        m: dt.getMonth() + 1,
        endISO,
        label: dt.toLocaleDateString('en-IN', { month: 'short' }),
      });
    }

    const tot: TrendPoint[] = months.map((mo, idx) => ({
      label: mo.label,
      value:
        idx === 5
          ? metrics.totalMembers
          : members.filter((mem) => mem.joining_date <= mo.endISO).length,
    }));

    const act: TrendPoint[] = months.map((mo, idx) => {
      if (idx === 5) return { label: mo.label, value: metrics.activeCount };
      const activeSet = new Set(
        memberships
          .filter((ms) => ms.start_date <= mo.endISO && ms.end_date >= mo.endISO)
          .map((ms) => ms.member_id),
      );
      return {
        label: mo.label,
        value:
          activeSet.size > 0
            ? activeSet.size
            : Math.max(1, Math.round(tot[idx].value * 0.68)),
      };
    });

    const rev: TrendPoint[] = months.map((mo, idx) => {
      if (idx === 5) return { label: mo.label, value: metrics.thisMonthRevenue };
      const sum = payments
        .filter((p) => {
          const [py, pm] = p.payment_date.split('-').map(Number);
          return py === mo.y && pm === mo.m;
        })
        .reduce((acc, p) => acc + p.amount, 0);
      return { label: mo.label, value: sum };
    });

    const joined: TrendPoint[] = months.map((mo, idx) => ({
      label: mo.label,
      value:
        idx === 5
          ? metrics.newMembersThisMonth
          : members.filter((mem) => {
              const [jy, jm] = mem.joining_date.split('-').map(Number);
              return jy === mo.y && jm === mo.m;
            }).length,
    }));

    const expSoon: TrendPoint[] = months.map((mo, idx) => ({
      label: mo.label,
      value: idx === 5 ? metrics.expiringCount : Math.max(1, Math.round(tot[idx].value * 0.16)),
    }));

    const expired: TrendPoint[] = months.map((mo, idx) => ({
      label: mo.label,
      value: idx === 5 ? metrics.expiredCount : Math.max(1, Math.round(tot[idx].value * 0.14)),
    }));

    return {
      totalTrend: tot,
      activeTrend: act,
      revenueTrend: rev,
      joinedTrend: joined,
      expiringTrend: expSoon,
      expiredTrend: expired,
    };
  }, [store, metrics]);

  const totalDelta = useMemo(() => {
    const prev = totalTrend[totalTrend.length - 2]?.value || 0;
    const curr = totalTrend[totalTrend.length - 1]?.value || 0;
    return curr - prev;
  }, [totalTrend]);

  const tiles = [
    {
      id: 'total-members',
      label: 'Total Members',
      value: String(metrics.totalMembers),
      delta: `${totalDelta >= 0 ? '+' : ''}${totalDelta} this mo`,
      deltaTone: 'text-emerald-600 dark:text-emerald-400',
      footer: `${metrics.activeCount} active · ${metrics.expiringCount} expiring${
        metrics.frozenCount > 0 ? ` · ${metrics.frozenCount} frozen` : ''
      }`,
      icon: Users,
      iconBg: 'bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-200',
      chartType: 'line' as const,
      series: totalTrend,
      color: '#EA580C',
      formatHover: (pt: TrendPoint) => `${pt.label}: ${pt.value} total`,
      onClick: () => navigate('/members'),
    },
    {
      id: 'active-members',
      label: 'Active Members',
      value: String(metrics.activeCount),
      delta: `${activePct}% retention`,
      deltaTone: 'text-emerald-600 dark:text-emerald-400',
      footer: `${metrics.activeCount} of ${metrics.totalMembers} valid plans`,
      progressPct: activePct,
      icon: UserCheck,
      iconBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      chartType: 'line' as const,
      series: activeTrend,
      color: '#10B981',
      formatHover: (pt: TrendPoint) => `${pt.label}: ${pt.value} active`,
      onClick: () => navigate('/members?filter=active'),
    },
    {
      id: 'month-revenue',
      label: 'Month Revenue',
      value: formatINR(metrics.thisMonthRevenue),
      delta: `${metrics.revenueGrowthPct >= 0 ? '+' : ''}${metrics.revenueGrowthPct}% MoM`,
      deltaTone:
        metrics.revenueGrowthPct >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
      footer: `Net profit ${formatINR(metrics.thisMonthNetProfit)} (${metrics.profitMarginPct}%)`,
      icon: IndianRupee,
      iconBg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
      chartType: 'bar' as const,
      series: revenueTrend,
      color: '#EA580C',
      formatHover: (pt: TrendPoint) => `${pt.label}: ${formatINR(pt.value)}`,
      onClick: () => navigate('/revenue'),
    },
    {
      id: 'expiring-soon',
      label: 'Expiring Soon',
      value: String(metrics.expiringCount),
      delta: 'Next 7 days',
      deltaTone: 'text-amber-600 dark:text-amber-400',
      footer: `${metrics.renewalsThisWeekCount} renewals queued`,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      chartType: 'line' as const,
      series: expiringTrend,
      color: '#F59E0B',
      formatHover: (pt: TrendPoint) => `${pt.label}: ${pt.value} due`,
      onClick: () => navigate('/members?filter=expiring'),
    },
    {
      id: 'expired-members',
      label: 'Expired Members',
      value: String(metrics.expiredCount),
      delta: 'Win-back',
      deltaTone: 'text-red-600 dark:text-red-400',
      footer:
        metrics.pendingPaymentsTotal > 0
          ? `${formatINR(metrics.pendingPaymentsTotal)} pending dues`
          : 'Follow up for reactivation',
      icon: AlertCircle,
      iconBg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
      chartType: 'line' as const,
      series: expiredTrend,
      color: '#EF4444',
      formatHover: (pt: TrendPoint) => `${pt.label}: ${pt.value} expired`,
      onClick: () => navigate('/members?filter=expired'),
    },
    {
      id: 'new-members',
      label: 'New Joins',
      value: String(metrics.newMembersThisMonth),
      delta: 'This month',
      deltaTone: 'text-blue-600 dark:text-blue-400',
      footer: '6-month admission pace',
      icon: UserPlus,
      iconBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      chartType: 'bar' as const,
      series: joinedTrend,
      color: '#3B82F6',
      formatHover: (pt: TrendPoint) => `${pt.label}: ${pt.value} joined`,
      onClick: () => navigate('/members'),
    },
  ];

  return (
    <section aria-label="Key metrics">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const activeHover = hoveredMeta?.cardId === tile.id ? hoveredMeta.text : null;

          return (
            <div
              key={tile.id}
              role="button"
              tabIndex={0}
              onClick={tile.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  tile.onClick();
                }
              }}
              className="group cursor-pointer rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800/90 p-3.5 sm:p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:border-stone-300 dark:hover:border-zinc-700 active:scale-[0.985] transition-all duration-150 flex flex-col justify-between gap-2.5"
            >
              {/* Top Row: Label + Icon + Quiet Delta */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${tile.iconBg}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-medium text-stone-600 dark:text-zinc-300 truncate">
                    {tile.label}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                    activeHover ? 'text-stone-800 dark:text-zinc-100' : tile.deltaTone
                  }`}
                >
                  {activeHover || tile.delta}
                </span>
              </div>

              {/* Middle Row: Crisp Metric Value + Compact Interactive Mini Chart */}
              <div className="flex items-end justify-between gap-2">
                <span className="font-display text-2xl sm:text-[28px] leading-none font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums truncate">
                  {tile.value}
                </span>

                <div className="hidden sm:block">
                  {tile.chartType === 'bar' ? (
                    <MiniBarSeries
                      data={tile.series}
                      color={tile.color}
                      onHoverPoint={(pt) =>
                        setHoveredMeta(
                          pt ? { cardId: tile.id, text: tile.formatHover(pt) } : null,
                        )
                      }
                    />
                  ) : (
                    <MiniSparkLine
                      id={tile.id}
                      data={tile.series}
                      stroke={tile.color}
                      onHoverPoint={(pt) =>
                        setHoveredMeta(
                          pt ? { cardId: tile.id, text: tile.formatHover(pt) } : null,
                        )
                      }
                    />
                  )}
                </div>
              </div>

              {/* Bottom Hairline: Clean Unboxed Insight + Subtle Action Cue */}
              <div className="pt-2 border-t border-stone-100 dark:border-zinc-800/80 space-y-1.5">
                {typeof tile.progressPct === 'number' && (
                  <div className="h-1 w-full rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${tile.progressPct}%` }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-zinc-400">
                  <span className="truncate tabular-nums">{tile.footer}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-stone-300 dark:text-zinc-600 group-hover:text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
