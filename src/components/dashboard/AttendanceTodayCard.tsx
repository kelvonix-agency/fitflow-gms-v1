import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { useGymData } from '../../context/GymDataContext';
import { useTheme } from '../../context/ThemeContext';
import { addDaysISO, getTodayISO } from '../../utils/formatters';

export function AttendanceTodayCard() {
  const navigate = useNavigate();
  const { store, metrics } = useGymData();
  const { theme } = useTheme();

  const barData = useMemo(() => {
    const todayISO = getTodayISO();
    const records = store?.attendance ?? [];
    const points: Array<{ day: string; present: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dtStr = addDaysISO(todayISO, -i);
      const count = records.filter(
        (r) => r.attendance_date === dtStr && r.status === 'present',
      ).length;
      const dt = new Date(dtStr + 'T00:00:00');
      points.push({
        day: dt.toLocaleDateString('en-IN', { weekday: 'short' }),
        present: count,
      });
    }
    return points;
  }, [store]);

  const tickColor = theme === 'dark' ? '#9CA3AF' : '#78716C';

  return (
    <div className="h-full rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
            Today&apos;s Attendance
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
            Check-in summary &amp; 7-day trend
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/attendance')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-orange-50 dark:hover:bg-orange-950/30 text-xs font-semibold text-orange-600 transition-colors whitespace-nowrap"
        >
          <span>View Attendance</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-stone-50 dark:bg-zinc-900/70 p-3">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">Present</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metrics.presentToday}
          </p>
        </div>
        <div className="rounded-2xl bg-stone-50 dark:bg-zinc-900/70 p-3">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">Absent</p>
          <p className="mt-1 font-display text-xl font-bold text-stone-700 dark:text-zinc-300 tabular-nums">
            {metrics.absentToday}
          </p>
        </div>
        <div className="rounded-2xl bg-stone-50 dark:bg-zinc-900/70 p-3">
          <p className="text-[11px] text-stone-500 dark:text-zinc-400">Active</p>
          <p className="mt-1 font-display text-xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {metrics.activeCount}
          </p>
        </div>
      </div>

      <div className="mt-5 h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { day: string; present: number };
                return (
                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 px-2.5 py-1.5 shadow-md text-xs">
                    <span className="font-semibold text-stone-900 dark:text-zinc-100">{d.day}: </span>
                    <span className="tabular-nums text-stone-600 dark:text-zinc-300">
                      {d.present} check-ins
                    </span>
                  </div>
                );
              }}
            />
            <Bar dataKey="present" fill="#EA580C" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
