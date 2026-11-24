import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { EnrichedMember } from '../../types';
import { addDaysISO, daysBetween, formatDateIN, getTodayISO } from '../../utils/formatters';

const QUICK_REASONS = [
  'Out of Station — Travel',
  'Medical / Injury Recovery',
  'Exams / Work Schedule',
  'Personal Request',
];

interface FreezeMembershipModalProps {
  open: boolean;
  onClose: () => void;
  member: EnrichedMember | null;
}

export function FreezeMembershipModal({ open, onClose, member }: FreezeMembershipModalProps) {
  const { freezeMembership } = useGymData();
  const { toast } = useToast();

  const today = getTodayISO();
  const [startDate, setStartDate] = useState(today);
  const [plannedEndDate, setPlannedEndDate] = useState(addDaysISO(today, 14));
  const [reason, setReason] = useState(QUICK_REASONS[0]);

  useEffect(() => {
    if (!open) return;
    setStartDate(today);
    setPlannedEndDate(addDaysISO(today, 14));
    setReason(QUICK_REASONS[0]);
  }, [open, today]);

  if (!member || !member.currentMembership) return null;

  const pauseDays = Math.max(0, daysBetween(startDate, plannedEndDate));
  const projectedExpiry = member.expiryDate
    ? addDaysISO(member.expiryDate, pauseDays)
    : undefined;

  const applyDurationPreset = (days: number) => {
    setPlannedEndDate(addDaysISO(startDate, days));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member.currentMembership) return;
    if (pauseDays < 1) {
      toast({ title: 'Resume date must be at least 1 day after start date.', variant: 'error' });
      return;
    }

    freezeMembership({
      member_id: member.id,
      membership_id: member.currentMembership.id,
      start_date: startDate,
      planned_end_date: plannedEndDate,
      reason,
    });

    toast({
      title: 'Membership frozen.',
      description: `${member.name}'s plan is paused for ${pauseDays} days.`,
    });
    onClose();
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Freeze Membership"
      subtitle="Pause remaining membership days cleanly and extend expiry upon resume."
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-full border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="freeze-membership-form"
            className="px-5 py-2.5 text-sm font-semibold rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white transition-all whitespace-nowrap"
          >
            Confirm Freeze
          </button>
        </>
      }
    >
      <form id="freeze-membership-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-zinc-900/70 border border-stone-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={member.name} src={member.avatar_url} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">{member.name}</p>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                {member.member_code} · {member.currentPlan?.name || 'Active Plan'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-stone-500 dark:text-zinc-400">Current Expiry</p>
            <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
              {formatDateIN(member.expiryDate)}
            </p>
          </div>
        </div>

        <div>
          <span className={labelClass}>Quick Pause Duration</span>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 21, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => applyDurationPreset(d)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  pauseDays === d
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Freeze Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Planned Resume Date</label>
            <input
              type="date"
              required
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Reason for Freeze</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap ${
                  reason === r
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason..."
            className={inputClass}
          />
        </div>

        <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/50 p-4 flex items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-200">
              {pauseDays > 0 ? `${pauseDays} days freeze window` : 'Select valid resume date'}
            </p>
            <p className="mt-0.5 text-blue-700/80 dark:text-blue-300/80">
              Resuming extends membership expiry automatically.
            </p>
          </div>
          {projectedExpiry && pauseDays > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">Projected New Expiry</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100 tabular-nums">
                {formatDateIN(projectedExpiry)}
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
