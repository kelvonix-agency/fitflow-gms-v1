import { DerivedMembershipStatus } from '../types';

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const [fy, fm, fd] = fromDateStr.split('-').map(Number);
  const [ty, tm, td] = toDateStr.split('-').map(Number);
  const from = new Date(fy, (fm || 1) - 1, fd || 1);
  const to = new Date(ty, (tm || 1) - 1, td || 1);
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function deriveMembershipStatus(endDateStr?: string, referenceDateStr = getTodayISO()): DerivedMembershipStatus {
  if (!endDateStr) return 'expired';
  const remaining = daysBetween(referenceDateStr, endDateStr);
  if (remaining < 0) return 'expired';
  if (remaining <= 7) return 'expiring';
  return 'active';
}

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDateIN(dateStr?: string): string {
  if (!dateStr) return '—';
  const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
  const dt = new Date(normalized);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatFullDateToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatRelativeTime(isoStr: string): string {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDateIN(isoStr);
}

export function getFirstName(name: string): string {
  return name.trim().split(' ')[0] || 'Rahul';
}

export function getGreetingTimePrefix(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getDynamicGreeting(name: string): string {
  return `${getGreetingTimePrefix()}, ${getFirstName(name)}`;
}

export function formatPhoneIN(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  if (last10.length !== 10) return phone;
  return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildReceiptWhatsAppText(params: {
  gymName: string;
  gymPhone?: string;
  memberName: string;
  memberCode: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  paymentDate: string;
  planName?: string;
  validTill?: string;
}): string {
  const lines = [
    `*${params.gymName} — Fee Receipt*`,
    `Receipt No: RCP-${params.transactionId}`,
    `Member: ${params.memberName} (${params.memberCode})`,
    params.planName ? `Plan: ${params.planName}` : undefined,
    params.validTill ? `Valid Till: ${formatDateIN(params.validTill)}` : undefined,
    `Payment Type: ${params.paymentType}`,
    `Amount Paid: ${formatINR(params.amount)}`,
    `Mode: ${params.paymentMethod}`,
    `Date: ${formatDateIN(params.paymentDate)}`,
    `Status: PAID`,
    '',
    `Thank you for training with ${params.gymName}!`,
    params.gymPhone ? `Desk: ${params.gymPhone}` : undefined,
  ].filter(Boolean);
  return lines.join('\n');
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const [y, m, d] = dob.split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const mDiff = today.getMonth() + 1 - m;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

export function exportToCSV(filename: string, headers: string[], rows: Array<Array<string | number | undefined>>): void {
  const escape = (val: string | number | undefined) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
