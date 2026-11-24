import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MessageCircle, RefreshCw } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RenewMembershipModal } from '../components/modals/RenewMembershipModal';
import { EmptyState } from '../components/ui/States';
import { EnrichedMember } from '../types';
import { buildWhatsAppUrl, formatDateIN, formatINR } from '../utils/formatters';

export function RenewalsPage() {
  const navigate = useNavigate();
  const { store, activeMembersList } = useGymData();
  const [renewTarget, setRenewTarget] = useState<EnrichedMember | null>(null);

  const buckets = useMemo(() => {
    const eligible = activeMembersList.filter((m) => m.derivedStatus !== 'frozen');
    const expired = eligible
      .filter((m) => m.daysRemaining < 0)
      .sort((a, b) => b.daysRemaining - a.daysRemaining);
    const in3Days = eligible
      .filter((m) => m.daysRemaining >= 0 && m.daysRemaining <= 3)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
    const in7Days = eligible
      .filter((m) => m.daysRemaining > 3 && m.daysRemaining <= 7)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
    const in30Days = eligible
      .filter((m) => m.daysRemaining > 7 && m.daysRemaining <= 30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return [
      { key: 'expired', title: 'Expired', tone: 'danger' as const, items: expired },
      { key: '3d', title: 'Expiring in 3 Days', tone: 'warning' as const, items: in3Days },
      { key: '7d', title: 'Expiring in 7 Days', tone: 'warning' as const, items: in7Days },
      { key: '30d', title: 'Expiring in 30 Days', tone: 'info' as const, items: in30Days },
    ];
  }, [activeMembersList]);

  const gymName = store?.gym.name || 'FitFlow Studio';

  const getReminderHref = (m: EnrichedMember) => {
    const first = m.name.split(' ')[0];
    const msg =
      m.daysRemaining < 0
        ? `Hi ${first}, your ${m.currentPlan?.name || 'gym'} membership at ${gymName} expired on ${formatDateIN(m.expiryDate)}. Renew today to continue your workouts uninterrupted!`
        : `Hi ${first}, gentle reminder from ${gymName}: your ${m.currentPlan?.name || 'gym'} membership expires on ${formatDateIN(m.expiryDate)}. Let us know when you'd like to renew!`;
    return buildWhatsAppUrl(m.phone, msg);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
          Membership Renewals
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
          Prioritize expired and upcoming renewals to keep member retention high.
        </p>
      </div>

      {buckets.every((b) => b.items.length === 0) ? (
        <EmptyState
          icon={RefreshCw}
          title="All memberships are up to date"
          description="No memberships are expired or due for renewal within the next 30 days."
        />
      ) : (
        <div className="space-y-6">
          {buckets.map((bucket) => (
            <section
              key={bucket.key}
              className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
                    {bucket.title}
                  </h2>
                  <StatusBadge label={`${bucket.items.length}`} tone={bucket.tone} />
                </div>
              </div>

              {bucket.items.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-zinc-500 py-2">
                  No members in this window.
                </p>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-100 dark:border-zinc-800 text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                          <th className="pb-2.5 pr-3">Member</th>
                          <th className="pb-2.5 px-3">Current Plan</th>
                          <th className="pb-2.5 px-3">Expiry</th>
                          <th className="pb-2.5 px-3">Days Remaining</th>
                          <th className="pb-2.5 px-3">Amount</th>
                          <th className="pb-2.5 pl-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                        {bucket.items.map((m) => (
                          <tr key={m.id} className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40">
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={m.name} src={m.avatar_url} size="sm" />
                                <div>
                                  <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                                    {m.name}
                                  </p>
                                  <p className="text-xs text-stone-500 dark:text-zinc-400 tabular-nums">
                                    {m.phone}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-xs font-medium text-stone-700 dark:text-zinc-300">
                              {m.currentPlan?.name || '—'}
                            </td>
                            <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-400 tabular-nums">
                              {formatDateIN(m.expiryDate)}
                            </td>
                            <td className="py-3 px-3 text-xs font-semibold tabular-nums">
                              {m.daysRemaining < 0 ? (
                                <span className="text-red-600 dark:text-red-400">
                                  {Math.abs(m.daysRemaining)}d overdue
                                </span>
                              ) : m.daysRemaining === 0 ? (
                                <span className="text-amber-600">Expires today</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">
                                  {m.daysRemaining}d left
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
                              {formatINR(m.currentPlan?.price || 0)}
                            </td>
                            <td className="py-3 pl-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setRenewTarget(m)}
                                  className="px-3.5 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold transition-all"
                                >
                                  Renew
                                </button>
                                <a
                                  href={getReminderHref(m)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp Reminder"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                                >
                                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Remind</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/members/${m.id}`)}
                                  aria-label={`View ${m.name}`}
                                  className="p-1.5 rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-2.5">
                    {bucket.items.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3.5 space-y-3 bg-stone-50/50 dark:bg-zinc-900/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={m.name} src={m.avatar_url} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{m.name}</p>
                              <p className="text-xs text-stone-500 dark:text-zinc-400">
                                {m.currentPlan?.name} · {formatINR(m.currentPlan?.price || 0)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold tabular-nums shrink-0 ${
                              m.daysRemaining < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {m.daysRemaining < 0
                              ? `${Math.abs(m.daysRemaining)}d overdue`
                              : m.daysRemaining === 0
                                ? 'Expires today'
                                : `${m.daysRemaining}d left`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRenewTarget(m)}
                            className="flex-1 py-2 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold transition-all"
                          >
                            Renew
                          </button>
                          <a
                            href={getReminderHref(m)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium bg-white dark:bg-zinc-900 active:scale-[0.98] transition-all"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Remind</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          ))}
        </div>
      )}

      <RenewMembershipModal
        open={Boolean(renewTarget)}
        onClose={() => setRenewTarget(null)}
        member={renewTarget}
      />
    </div>
  );
}
