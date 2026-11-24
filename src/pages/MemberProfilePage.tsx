import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  CalendarCheck2,
  Edit3,
  FileText,
  MessageCircle,
  Play,
  Plus,
  RefreshCw,
  Snowflake,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import {
  StatusBadge,
  statusLabelFromMembership,
  statusToneFromMembership,
} from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AddMemberModal } from '../components/modals/AddMemberModal';
import { FeeReceiptModal } from '../components/modals/FeeReceiptModal';
import { FreezeMembershipModal } from '../components/modals/FreezeMembershipModal';
import { RenewMembershipModal } from '../components/modals/RenewMembershipModal';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { Payment } from '../types';
import {
  buildWhatsAppUrl,
  formatDateIN,
  formatINR,
  formatRelativeTime,
  getTodayISO,
} from '../utils/formatters';

type ProfileTab = 'overview' | 'membership' | 'payments' | 'attendance' | 'activity';

export function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { store, activeMembersList, archiveMember, resumeMembership, markAttendance } = useGymData();
  const { toast } = useToast();

  const [tab, setTab] = useState<ProfileTab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<Payment | null>(null);

  const member = useMemo(
    () => activeMembersList.find((m) => m.id === id),
    [activeMembersList, id],
  );

  const memberHistory = useMemo(() => {
    if (!store || !member) return { memberships: [], payments: [], attendance: [], activities: [], freezes: [] };
    const plansById = new Map(store.plans.map((p) => [p.id, p]));
    return {
      memberships: store.memberships
        .filter((ms) => ms.member_id === member.id)
        .map((ms) => ({ ...ms, planName: plansById.get(ms.plan_id)?.name || 'Plan' }))
        .sort((a, b) => b.start_date.localeCompare(a.start_date)),
      payments: store.payments
        .filter((p) => p.member_id === member.id)
        .sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
      attendance: store.attendance
        .filter((a) => a.member_id === member.id)
        .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date)),
      activities: store.activities
        .filter((act) => act.related_member_id === member.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      freezes: (store.freezes ?? [])
        .filter((f) => f.member_id === member.id)
        .sort((a, b) => b.start_date.localeCompare(a.start_date)),
    };
  }, [store, member]);

  if (!member) {
    return (
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200 dark:border-zinc-800 p-10 text-center space-y-3">
        <p className="text-base font-semibold text-stone-900 dark:text-zinc-100">
          Member not found
        </p>
        <p className="text-xs text-stone-500 dark:text-zinc-400">
          This member may have been archived or removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors"
        >
          Back to Members
        </button>
      </div>
    );
  }

  const whatsAppMsg = `Hi ${member.name.split(' ')[0]}, greetings from ${store?.gym.name || 'FitFlow Studio'}! Let us know if you need any help with your training schedule.`;
  const whatsAppHref = buildWhatsAppUrl(member.phone, whatsAppMsg);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/members')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Members</span>
      </button>

      {/* Profile Header */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar name={member.name} src={member.avatar_url} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100">
                {member.name}
              </h1>
              <StatusBadge
                label={statusLabelFromMembership(member.derivedStatus)}
                tone={statusToneFromMembership(member.derivedStatus)}
              />
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
              <span className="font-mono-num">{member.member_code}</span> · {member.phone}
              {member.email ? ` · ${member.email}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </a>
          {member.activeFreeze ? (
            <button
              type="button"
              onClick={() => {
                resumeMembership(member.activeFreeze!.id);
                toast({
                  title: 'Membership resumed.',
                  description: `${member.name}'s expiry date has been extended automatically.`,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold transition-all whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Resume Plan</span>
            </button>
          ) : (
            member.currentMembership &&
            member.derivedStatus !== 'expired' && (
              <button
                type="button"
                onClick={() => setFreezeOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Snowflake className="h-3.5 w-3.5 text-blue-500" />
                <span>Freeze Plan</span>
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => setRenewOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold transition-all whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Renew Membership</span>
          </button>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            aria-label="Archive member"
            className="p-2 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.98] transition-all"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active Freeze Banner */}
      {member.activeFreeze && (
        <div className="rounded-[20px] bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Snowflake className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">
                Membership Currently Frozen ({member.activeFreeze.days_frozen} days)
              </p>
              <p className="mt-0.5 text-xs text-blue-800/80 dark:text-blue-200/80 tabular-nums">
                {formatDateIN(member.activeFreeze.start_date)} → {formatDateIN(member.activeFreeze.planned_end_date)} ·{' '}
                {member.activeFreeze.reason}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resumeMembership(member.activeFreeze!.id);
              toast({
                title: 'Membership resumed.',
                description: `${member.name}'s expiry date has been extended automatically.`,
              });
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors whitespace-nowrap"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Resume Now</span>
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Current Plan</p>
          <p className="mt-1 font-display text-lg font-bold text-stone-900 dark:text-zinc-100">
            {member.currentPlan?.name || 'None'}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4">
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            {member.derivedStatus === 'frozen' ? 'Plan Status' : 'Days Remaining'}
          </p>
          <p
            className={`mt-1 font-display text-lg font-bold tabular-nums ${
              member.derivedStatus === 'frozen'
                ? 'text-blue-600 dark:text-blue-400'
                : member.daysRemaining < 0
                  ? 'text-red-600'
                  : member.daysRemaining <= 7
                    ? 'text-amber-600'
                    : 'text-emerald-600'
            }`}
          >
            {member.derivedStatus === 'frozen'
              ? `Frozen (${member.activeFreeze?.days_frozen ?? 0}d)`
              : member.daysRemaining >= 0
                ? `${member.daysRemaining} days`
                : `${Math.abs(member.daysRemaining)}d overdue`}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Total Paid</p>
          <p className="mt-1 font-display text-lg font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {formatINR(member.totalPaid)}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4">
          <p className="text-xs text-stone-500 dark:text-zinc-400">Attendance</p>
          <p className="mt-1 font-display text-lg font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {member.attendanceCount} visits
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 pt-3 border-b border-stone-200/80 dark:border-zinc-800">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'membership', label: 'Membership' },
              { id: 'payments', label: 'Payments' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'activity', label: 'Activity' },
            ] as Array<{ id: ProfileTab; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                  Personal Information
                </h3>
                <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <dt className="text-stone-400 dark:text-zinc-500">Gender</dt>
                    <dd className="mt-0.5 font-medium text-stone-800 dark:text-zinc-200">
                      {member.gender || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 dark:text-zinc-500">Date of Birth</dt>
                    <dd className="mt-0.5 font-medium text-stone-800 dark:text-zinc-200 tabular-nums">
                      {formatDateIN(member.date_of_birth)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 dark:text-zinc-500">Joining Date</dt>
                    <dd className="mt-0.5 font-medium text-stone-800 dark:text-zinc-200 tabular-nums">
                      {formatDateIN(member.joining_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 dark:text-zinc-500">Emergency Contact</dt>
                    <dd className="mt-0.5 font-medium text-stone-800 dark:text-zinc-200 tabular-nums">
                      {member.emergency_contact || '—'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-stone-400 dark:text-zinc-500">Address</dt>
                    <dd className="mt-0.5 font-medium text-stone-800 dark:text-zinc-200">
                      {member.address || '—'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-stone-400 dark:text-zinc-500">Notes</dt>
                    <dd className="mt-0.5 text-stone-600 dark:text-zinc-300">
                      {member.notes || 'No notes added.'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                  Current Membership
                </h3>
                <div className="rounded-2xl bg-stone-50 dark:bg-zinc-900/60 border border-stone-200/80 dark:border-zinc-800 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-zinc-400">Plan</span>
                    <span className="font-semibold text-stone-900 dark:text-zinc-100">
                      {member.currentPlan?.name || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-zinc-400">Start Date</span>
                    <span className="font-medium tabular-nums">
                      {formatDateIN(member.currentMembership?.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-zinc-400">Expiry Date</span>
                    <span className="font-semibold tabular-nums">
                      {formatDateIN(member.expiryDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-zinc-400">Pending Dues</span>
                    <span className="font-semibold tabular-nums">
                      {member.pendingAmount > 0 ? formatINR(member.pendingAmount) : '₹0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'membership' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                    Membership &amp; Renewal History
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRenewOpen(true)}
                    className="text-xs font-semibold text-orange-600 hover:underline"
                  >
                    + Renew Plan
                  </button>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {memberHistory.memberships.map((ms) => (
                    <div key={ms.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-zinc-100">{ms.planName}</p>
                        <p className="text-stone-500 dark:text-zinc-400 tabular-nums">
                          {formatDateIN(ms.start_date)} → {formatDateIN(ms.end_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold tabular-nums">{formatINR(ms.amount)}</span>
                        <StatusBadge
                          label={ms.status.charAt(0).toUpperCase() + ms.status.slice(1)}
                          tone={
                            ms.status === 'active'
                              ? 'success'
                              : ms.status === 'expiring'
                                ? 'warning'
                                : ms.status === 'renewed' || ms.status === 'frozen'
                                  ? 'info'
                                  : 'danger'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {memberHistory.freezes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                    Freeze History
                  </h3>
                  <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                    {memberHistory.freezes.map((frz) => (
                      <div key={frz.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-stone-900 dark:text-zinc-100">{frz.reason}</p>
                          <p className="text-stone-500 dark:text-zinc-400 tabular-nums">
                            {formatDateIN(frz.start_date)} → {formatDateIN(frz.resumed_at || frz.planned_end_date)} ·{' '}
                            {frz.days_frozen} days
                          </p>
                        </div>
                        <StatusBadge
                          label={frz.status === 'active' ? 'Frozen' : 'Resumed'}
                          tone={frz.status === 'active' ? 'info' : 'success'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                  Payment Ledger
                </h3>
                <button
                  type="button"
                  onClick={() => setPaymentOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                {memberHistory.payments.map((p) => (
                  <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-zinc-100">
                        {p.payment_type} · {p.payment_method}
                      </p>
                      <p className="text-stone-500 dark:text-zinc-400 tabular-nums">
                        {p.transaction_id} · {formatDateIN(p.payment_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold tabular-nums">{formatINR(p.amount)}</span>
                      <StatusBadge
                        label={p.status}
                        tone={
                          p.status === 'Paid'
                            ? 'success'
                            : p.status === 'Pending'
                              ? 'warning'
                              : p.status === 'Failed'
                                ? 'danger'
                                : 'neutral'
                        }
                      />
                      {p.status === 'Paid' && (
                        <button
                          type="button"
                          onClick={() => setReceiptTarget(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <FileText className="h-3 w-3 text-orange-600" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                  Recent Check-ins
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    markAttendance(member.id, getTodayISO(), 'present');
                    toast({ title: `Marked ${member.name} present today.` });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-semibold"
                >
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  <span>Mark Present Today</span>
                </button>
              </div>
              {memberHistory.attendance.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-zinc-400 py-4">
                  No attendance check-ins logged for this member yet.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {memberHistory.attendance.map((att) => (
                    <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800 dark:text-zinc-200 tabular-nums">
                        {formatDateIN(att.attendance_date)}
                      </span>
                      <div className="flex items-center gap-3">
                        {att.check_in_time && (
                          <span className="text-stone-500 dark:text-zinc-400 tabular-nums">
                            Check-in {att.check_in_time}
                          </span>
                        )}
                        <StatusBadge
                          label={att.status === 'present' ? 'Present' : 'Absent'}
                          tone={att.status === 'present' ? 'success' : 'neutral'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                Member Activity Timeline
              </h3>
              {memberHistory.activities.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-zinc-400 py-4">
                  Joined gym on {formatDateIN(member.joining_date)}.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {memberHistory.activities.map((act) => (
                    <div key={act.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <span className="font-medium text-stone-800 dark:text-zinc-200">
                        {act.description}
                      </span>
                      <span className="text-stone-400 dark:text-zinc-500 shrink-0">
                        {formatRelativeTime(act.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddMemberModal open={editOpen} onClose={() => setEditOpen(false)} editMember={member} />
      <RenewMembershipModal open={renewOpen} onClose={() => setRenewOpen(false)} member={member} />
      <FreezeMembershipModal open={freezeOpen} onClose={() => setFreezeOpen(false)} member={member} />
      <RecordPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        defaultMemberId={member.id}
      />
      <FeeReceiptModal
        open={Boolean(receiptTarget)}
        onClose={() => setReceiptTarget(null)}
        payment={receiptTarget}
        member={member}
        planName={member.currentPlan?.name}
        validTill={member.expiryDate}
      />
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => {
          archiveMember(member.id);
          toast({ title: 'Member archived.' });
          navigate('/members');
        }}
        title="Archive Member"
        message={`Are you sure you want to archive ${member.name}?`}
        confirmLabel="Archive Member"
      />
    </div>
  );
}
