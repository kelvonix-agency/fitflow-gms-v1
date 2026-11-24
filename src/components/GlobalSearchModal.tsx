import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Search, UserCheck, Users, Layers, ArrowRight, X, Receipt } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { formatDateIN, formatINR } from '../utils/formatters';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const { activeMembersList, store, allPlans, nonArchivedEnquiries } = useGymData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        members: activeMembersList.slice(0, 4),
        payments: (store?.payments ?? []).slice(0, 3),
        expenses: (store?.expenses ?? []).slice(0, 3),
        plans: allPlans.filter((p) => p.status === 'active').slice(0, 3),
        enquiries: nonArchivedEnquiries.slice(0, 3),
      };
    }

    const membersById = new Map(activeMembersList.map((m) => [m.id, m]));

    const members = activeMembersList
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q) ||
          (m.currentPlan?.name.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 5);

    const payments = (store?.payments ?? [])
      .filter((p) => {
        const mem = membersById.get(p.member_id);
        return (
          p.transaction_id.toLowerCase().includes(q) ||
          p.payment_method.toLowerCase().includes(q) ||
          (mem?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 4);

    const expenses = (store?.expenses ?? [])
      .filter(
        (ex) =>
          ex.title.toLowerCase().includes(q) ||
          ex.category.toLowerCase().includes(q) ||
          (ex.vendor_name?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 4);

    const plans = allPlans
      .filter((p) => p.status === 'active' && p.name.toLowerCase().includes(q))
      .slice(0, 4);

    const enquiries = nonArchivedEnquiries
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.phone.toLowerCase().includes(q) ||
          e.interested_plan.toLowerCase().includes(q),
      )
      .slice(0, 4);

    return { members, payments, expenses, plans, enquiries };
  }, [query, activeMembersList, store, allPlans, nonArchivedEnquiries]);

  if (!open) return null;

  const membersById = new Map(activeMembersList.map((m) => [m.id, m]));

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const hasAny =
    results.members.length > 0 ||
    results.payments.length > 0 ||
    results.expenses.length > 0 ||
    results.plans.length > 0 ||
    results.enquiries.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/45 backdrop-blur-[1px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-[24px] bg-white dark:bg-[#181A1F] border border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200/80 dark:border-zinc-800">
          <Search className="h-4 w-4 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members, payments, expenses, plans..."
            className="flex-1 bg-transparent text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[11px] font-mono-num rounded-full border border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!hasAny && (
            <div className="py-10 text-center text-sm text-stone-500 dark:text-zinc-400">
              No matching records found for “{query}”.
            </div>
          )}

          {results.members.length > 0 && (
            <div>
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-stone-400 dark:text-zinc-500">
                Members
              </p>
              <div className="space-y-0.5">
                {results.members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => go(`/members/${m.id}`)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Users className="h-4 w-4 text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                          {m.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                          {m.member_code} · {m.currentPlan?.name || 'No plan'} · {m.phone}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.payments.length > 0 && (
            <div>
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-stone-400 dark:text-zinc-500">
                Payments
              </p>
              <div className="space-y-0.5">
                {results.payments.map((p) => {
                  const mem = membersById.get(p.member_id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => go(`/payments?search=${encodeURIComponent(p.transaction_id)}`)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CreditCard className="h-4 w-4 text-stone-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                            {mem?.name || 'Member'} · <span className="tabular-nums">{formatINR(p.amount)}</span>
                          </p>
                          <p className="text-xs text-stone-500 dark:text-zinc-400">
                            {p.transaction_id} · {p.payment_method} · {formatDateIN(p.payment_date)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-stone-500 dark:text-zinc-400 shrink-0">
                        {p.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {results.expenses.length > 0 && (
            <div>
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-stone-400 dark:text-zinc-500">
                Expenses
              </p>
              <div className="space-y-0.5">
                {results.expenses.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => go('/expenses')}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Receipt className="h-4 w-4 text-rose-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                          {ex.title} · <span className="tabular-nums">{formatINR(ex.amount)}</span>
                        </p>
                        <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                          {ex.category} · {ex.vendor_name || ex.payment_method} · {formatDateIN(ex.expense_date)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.plans.length > 0 && (
            <div>
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-stone-400 dark:text-zinc-500">
                Membership Plans
              </p>
              <div className="space-y-0.5">
                {results.plans.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => go('/memberships')}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Layers className="h-4 w-4 text-stone-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                          {pl.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-zinc-400">
                          {formatINR(pl.price)} · {pl.duration_days} days
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.enquiries.length > 0 && (
            <div>
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-stone-400 dark:text-zinc-500">
                Enquiries
              </p>
              <div className="space-y-0.5">
                {results.enquiries.map((enq) => (
                  <button
                    key={enq.id}
                    type="button"
                    onClick={() => go('/enquiries')}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-stone-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserCheck className="h-4 w-4 text-stone-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                          {enq.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-zinc-400">
                          {enq.interested_plan} · {enq.status} · {enq.phone}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
