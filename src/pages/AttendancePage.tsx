import React, { useMemo, useState } from 'react';
import { CalendarCheck2, Check, Download, Search, X } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/States';
import { exportToCSV, formatDateIN, getTodayISO } from '../utils/formatters';

export function AttendancePage() {
  const { store, activeMembersList, metrics, markAttendance, bulkMarkAttendance } = useGymData();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [search, setSearch] = useState('');

  const recordsForDate = useMemo(() => {
    const map = new Map<string, { status: 'present' | 'absent'; check_in_time?: string }>();
    for (const r of store?.attendance ?? []) {
      if (r.attendance_date === selectedDate) {
        map.set(r.member_id, { status: r.status, check_in_time: r.check_in_time });
      }
    }
    return map;
  }, [store, selectedDate]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeMembersList
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q)
        );
      })
      .map((m) => {
        const rec = recordsForDate.get(m.id);
        return {
          member: m,
          status: rec?.status,
          checkInTime: rec?.check_in_time,
        };
      });
  }, [activeMembersList, recordsForDate, search]);

  const presentCount = Array.from(recordsForDate.values()).filter((v) => v.status === 'present').length;
  const absentCount = Array.from(recordsForDate.values()).filter((v) => v.status === 'absent').length;

  const handleExport = () => {
    exportToCSV(
      `fitflow-attendance-${selectedDate}.csv`,
      ['Member ID', 'Member', 'Date', 'Status', 'Check-in Time'],
      rows.map((r) => [
        r.member.member_code,
        r.member.name,
        selectedDate,
        r.status || 'Unmarked',
        r.checkInTime || '',
      ]),
    );
    toast({ title: 'Attendance exported to CSV.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Mark daily member check-ins for {formatDateIN(selectedDate)}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="Select attendance date"
            className="rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 dark:text-zinc-200"
          />
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] text-xs sm:text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const ids = activeMembersList
                .filter((m) => m.derivedStatus !== 'expired')
                .map((m) => m.id);
              bulkMarkAttendance(ids, selectedDate, 'present');
              toast({ title: `Marked ${ids.length} active members present.` });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          >
            <CalendarCheck2 className="h-4 w-4" />
            <span>Mark Active Present</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-zinc-400 truncate">Present</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {presentCount}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-zinc-400 truncate">Absent</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-700 dark:text-zinc-300 tabular-nums">
            {absentCount}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-zinc-400 truncate">Active Roster</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {metrics.activeCount}
          </p>
        </div>
      </div>

      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member to mark attendance..."
              className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-[#F8F7F4] dark:bg-zinc-900 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <p className="text-xs text-stone-400 dark:text-zinc-500">
            Tap Present or Absent to log daily check-ins
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="No matching members"
            description="Try clearing your search query."
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-zinc-800 text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                    <th className="py-3 pr-3">Member</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Check-in Time</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                  {rows.map(({ member, status, checkInTime }) => (
                    <tr key={member.id} className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} src={member.avatar_url} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                              {member.member_code} · {member.currentPlan?.name || 'No plan'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {status === 'present' ? (
                          <StatusBadge label="Present" tone="success" />
                        ) : status === 'absent' ? (
                          <StatusBadge label="Absent" tone="neutral" />
                        ) : (
                          <StatusBadge label="Unmarked" tone="warning" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-400 tabular-nums">
                        {checkInTime || '—'}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-500 dark:text-zinc-400 tabular-nums">
                        {formatDateIN(selectedDate)}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              markAttendance(member.id, selectedDate, 'present');
                              toast({ title: `${member.name} marked present.` });
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium active:scale-[0.97] transition-all ${
                              status === 'present'
                                ? 'bg-emerald-600 text-white'
                                : 'border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Present</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              markAttendance(member.id, selectedDate, 'absent');
                              toast({ title: `${member.name} marked absent.`, variant: 'info' });
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium active:scale-[0.97] transition-all ${
                              status === 'absent'
                                ? 'bg-stone-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                                : 'border border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile App Cards */}
            <div className="md:hidden space-y-2.5">
              {rows.map(({ member, status, checkInTime }) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 space-y-3 bg-stone-50/50 dark:bg-zinc-900/40"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={member.name} src={member.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate tabular-nums">
                          {member.member_code} · {checkInTime ? `In at ${checkInTime}` : member.currentPlan?.name || 'No plan'}
                        </p>
                      </div>
                    </div>
                    {status === 'present' ? (
                      <StatusBadge label="Present" tone="success" />
                    ) : status === 'absent' ? (
                      <StatusBadge label="Absent" tone="neutral" />
                    ) : (
                      <StatusBadge label="Unmarked" tone="warning" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        markAttendance(member.id, selectedDate, 'present');
                        toast({ title: `${member.name} marked present.` });
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold active:scale-[0.97] transition-all ${
                        status === 'present'
                          ? 'bg-emerald-600 text-white'
                          : 'border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-200'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Present</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markAttendance(member.id, selectedDate, 'absent');
                        toast({ title: `${member.name} marked absent.`, variant: 'info' });
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold active:scale-[0.97] transition-all ${
                        status === 'absent'
                          ? 'bg-stone-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                          : 'border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-500 dark:text-zinc-400'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
