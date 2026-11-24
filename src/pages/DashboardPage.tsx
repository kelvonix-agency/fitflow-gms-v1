import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Megaphone, Plus } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { KpiRow } from '../components/dashboard/KpiRow';
import { RevenueOverviewCard } from '../components/dashboard/RevenueOverviewCard';
import { MembershipStatusCard } from '../components/dashboard/MembershipStatusCard';
import { ActionCenterCard } from '../components/dashboard/ActionCenterCard';
import { AttendanceTodayCard } from '../components/dashboard/AttendanceTodayCard';
import { BirthdaysTodayCard } from '../components/dashboard/BirthdaysTodayCard';
import { Avatar } from '../components/ui/Avatar';
import {
  StatusBadge,
  statusLabelFromMembership,
  statusToneFromMembership,
} from '../components/ui/StatusBadge';
import { DashboardSkeleton, ErrorState } from '../components/ui/States';
import { AddMemberModal } from '../components/modals/AddMemberModal';
import { RenewMembershipModal } from '../components/modals/RenewMembershipModal';
import { BirthdayWishModal } from '../components/modals/BirthdayWishModal';
import { SendNoticeModal } from '../components/modals/SendNoticeModal';
import { EnrichedMember } from '../types';
import {
  formatDateIN,
  formatFullDateToday,
  formatRelativeTime,
  getFirstName,
  getGreetingTimePrefix,
} from '../utils/formatters';

export function DashboardPage() {
  const navigate = useNavigate();
  const { store, isLoading, error, reload, activeMembersList, birthdaysToday } = useGymData();

  const [addOpen, setAddOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<EnrichedMember | null>(null);
  const [wishMembers, setWishMembers] = useState<EnrichedMember[]>([]);

  if (isLoading && !store) return <DashboardSkeleton />;
  if (error || !store) return <ErrorState message={error || undefined} onRetry={reload} />;

  const ownerName = store.profile.name || 'Rahul Verma';
  const recentMembers = activeMembersList.slice(0, 6);
  const recentActivities = store.activities.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Clean Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-zinc-400">
            {formatFullDateToday()}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            {getGreetingTimePrefix()},{' '}
            <span className="font-inter font-semibold text-stone-900/65 dark:text-zinc-100/70">
              {getFirstName(ownerName)}
            </span>{' '}
            <span role="img" aria-label="wave" className="inline-block">
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Stay on top of your gym, members and daily operations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setNoticeOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] text-stone-700 dark:text-zinc-200 text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
          >
            <Megaphone className="h-3.5 w-3.5 text-orange-600" />
            <span>Send Notice</span>
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Executive 6-Tile KPI Grid */}
      <KpiRow />

      {/* Main Content: Revenue Overview + Membership Status + Action Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-5">
        <div className="md:col-span-2 xl:col-span-5">
          <RevenueOverviewCard />
        </div>
        <div className="md:col-span-1 xl:col-span-3">
          <MembershipStatusCard />
        </div>
        <div className="md:col-span-1 xl:col-span-4">
          <ActionCenterCard onOpenBirthdayWish={() => setWishMembers(birthdaysToday)} />
        </div>
      </div>

      {/* Secondary Content: Attendance + Recent Members + Today's Birthdays */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-5">
        <div className="md:col-span-1 xl:col-span-4 order-1">
          <AttendanceTodayCard />
        </div>

        {/* Members List Preview */}
        <div className="md:col-span-2 xl:col-span-5 order-3 xl:order-2 rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
                  Members Preview
                </h2>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
                  Recent profiles &amp; upcoming expiries
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/members')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-orange-50 dark:hover:bg-orange-950/30 text-xs font-semibold text-orange-600 transition-colors whitespace-nowrap"
              >
                <span>View All Members</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-zinc-800 text-[11px] font-medium text-stone-500 dark:text-zinc-400">
                    <th className="pb-2.5 pr-3">Member</th>
                    <th className="pb-2.5 px-2">Plan</th>
                    <th className="pb-2.5 px-2">Status</th>
                    <th className="pb-2.5 px-2">Expiry</th>
                    <th className="pb-2.5 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/70">
                  {recentMembers.map((m) => (
                    <tr
                      key={m.id}
                      className="group hover:bg-stone-50/90 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/members/${m.id}`)}
                          className="flex items-center gap-2.5 min-w-0 text-left"
                        >
                          <Avatar name={m.name} src={m.avatar_url} size="xs" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors truncate">
                              {m.name}
                            </p>
                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums truncate">
                              {m.phone}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-stone-700 dark:text-zinc-300 whitespace-nowrap">
                        {m.currentPlan?.name || '—'}
                      </td>
                      <td className="py-2.5 px-2">
                        <StatusBadge
                          label={statusLabelFromMembership(m.derivedStatus)}
                          tone={statusToneFromMembership(m.derivedStatus)}
                        />
                      </td>
                      <td className="py-2.5 px-2 text-xs text-stone-600 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                        {formatDateIN(m.expiryDate)}
                      </td>
                      <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${m.id}`)}
                            className="px-2.5 py-1 rounded-full text-xs font-medium text-stone-600 dark:text-zinc-300 hover:bg-stone-200/70 dark:hover:bg-zinc-700"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenewTarget(m)}
                            className="px-2.5 py-1 rounded-full text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile compact app cards */}
            <div className="sm:hidden space-y-2.5">
              {recentMembers.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-stone-50/80 dark:bg-zinc-900/60 border border-stone-100 dark:border-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={m.name} src={m.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                        {m.currentPlan?.name} · {formatDateIN(m.expiryDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge
                      label={statusLabelFromMembership(m.derivedStatus)}
                      tone={statusToneFromMembership(m.derivedStatus)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenewTarget(m);
                      }}
                      className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[11px] font-semibold text-orange-600 dark:text-orange-400"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1 xl:col-span-3 order-2 xl:order-3">
          <BirthdaysTodayCard
            onWishMember={(m) => setWishMembers([m])}
            onWishAll={() => setWishMembers(birthdaysToday)}
          />
        </div>
      </div>

      {/* Bottom Section: Recent Activity Timeline */}
      <section className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              Recent Activity
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
              Live updates across sign-ups, payments, renewals, and attendance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => act.related_member_id && navigate(`/members/${act.related_member_id}`)}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-stone-100 dark:border-zinc-800/80 bg-[#FAF9F6] dark:bg-zinc-900/50 transition-colors ${
                act.related_member_id
                  ? 'cursor-pointer hover:border-orange-200 dark:hover:border-orange-900/50 hover:bg-white dark:hover:bg-zinc-900'
                  : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-stone-800 dark:text-zinc-200 leading-snug">
                  {act.description}
                </p>
                <p className="mt-1.5 text-[11px] text-stone-400 dark:text-zinc-500 capitalize">
                  {act.type.replace(/_/g, ' ')} · {formatRelativeTime(act.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} />
      <SendNoticeModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
      <RenewMembershipModal
        open={Boolean(renewTarget)}
        onClose={() => setRenewTarget(null)}
        member={renewTarget}
      />
      <BirthdayWishModal
        open={wishMembers.length > 0}
        onClose={() => setWishMembers([])}
        members={wishMembers}
      />
    </div>
  );
}
