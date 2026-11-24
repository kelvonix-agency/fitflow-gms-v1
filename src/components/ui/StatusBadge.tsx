import React from 'react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

const TONE_CLASSES: Record<StatusTone, { dot: string; text: string; bg: string }> = {
  success: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  warning: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  danger: {
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
  },
  info: {
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  neutral: {
    dot: 'bg-stone-400 dark:bg-zinc-500',
    text: 'text-stone-700 dark:text-zinc-300',
    bg: 'bg-stone-100 dark:bg-zinc-800',
  },
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const styles = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 ${styles.bg} ${styles.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function statusToneFromMembership(status: 'active' | 'expiring' | 'expired' | 'frozen'): StatusTone {
  if (status === 'active') return 'success';
  if (status === 'expiring') return 'warning';
  if (status === 'frozen') return 'info';
  return 'danger';
}

export function statusLabelFromMembership(status: 'active' | 'expiring' | 'expired' | 'frozen'): string {
  if (status === 'active') return 'Active';
  if (status === 'expiring') return 'Expiring';
  if (status === 'frozen') return 'Frozen';
  return 'Expired';
}
