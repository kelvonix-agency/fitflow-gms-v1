import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useGymData } from '../../context/GymDataContext';

export function MembershipStatusCard() {
  const navigate = useNavigate();
  const { metrics } = useGymData();

  const total = metrics.totalMembers;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const data = [
    { name: 'Active', value: metrics.activeCount, color: '#10B981', filter: 'active' },
    { name: 'Expiring', value: metrics.expiringCount, color: '#F59E0B', filter: 'expiring' },
    { name: 'Frozen', value: metrics.frozenCount, color: '#3B82F6', filter: 'frozen' },
    { name: 'Expired', value: metrics.expiredCount, color: '#EF4444', filter: 'expired' },
  ];

  return (
    <div className="h-full rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div>
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">Membership Status</h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
          Click a status to filter members
        </p>
      </div>

      <div className="relative h-48 w-full my-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={78}
              paddingAngle={3}
              stroke="none"
              onClick={(entry) => navigate(`/members?filter=${entry.filter}`)}
              className="cursor-pointer focus:outline-none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 shadow-lg text-xs">
                    <span className="font-semibold text-stone-900 dark:text-zinc-100">{d.name}: </span>
                    <span className="tabular-nums text-stone-600 dark:text-zinc-300">
                      {d.value} ({pct(d.value)}%)
                    </span>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {total}
          </span>
          <span className="text-[11px] text-stone-500 dark:text-zinc-400">Total</span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
        {data.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => navigate(`/members?filter=${item.filter}`)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800/70 transition-colors text-left"
          >
            <span className="flex items-center gap-2.5 text-xs font-medium text-stone-700 dark:text-zinc-300">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </span>
            <span className="text-xs font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
              {item.value}{' '}
              <span className="font-normal text-stone-400 dark:text-zinc-500">({pct(item.value)}%)</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
