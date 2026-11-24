import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Cake,
  Clock,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useGymData } from '../../context/GymDataContext';
import { formatINR } from '../../utils/formatters';

export function ActionCenterCard({ onOpenBirthdayWish }: { onOpenBirthdayWish: () => void }) {
  const navigate = useNavigate();
  const { metrics, birthdaysToday } = useGymData();

  const items = [
    {
      id: 'expired',
      title: `${metrics.expiredCount} Expired Memberships`,
      subtitle: 'Follow up with these members',
      cta: 'View',
      icon: AlertTriangle,
      iconTone: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
      onClick: () => navigate('/members?filter=expired'),
    },
    {
      id: 'expiring',
      title: `${metrics.expiringCount} Memberships Expiring Soon`,
      subtitle: 'Within next 7 days',
      cta: 'View',
      icon: Clock,
      iconTone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      onClick: () => navigate('/members?filter=expiring'),
    },
    {
      id: 'pending',
      title: `${metrics.pendingPaymentsCount} Pending Payments`,
      subtitle: `Total ${formatINR(metrics.pendingPaymentsTotal)}`,
      cta: 'View',
      icon: CreditCard,
      iconTone: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
      onClick: () => navigate('/payments?status=Pending'),
    },
    {
      id: 'birthdays',
      title: `${birthdaysToday.length} ${birthdaysToday.length === 1 ? 'Birthday' : 'Birthdays'} Today`,
      subtitle: birthdaysToday.length > 0 ? 'Send personalized wishes' : 'Check upcoming birthdays',
      cta: 'Wish',
      icon: Cake,
      iconTone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
      onClick: () =>
        birthdaysToday.length > 0 ? onOpenBirthdayWish() : navigate('/communication/birthdays'),
    },
    {
      id: 'renewals',
      title: `${metrics.renewalsThisWeekCount} Renewals This Week`,
      subtitle: 'Keep retention steady',
      cta: 'View',
      icon: RefreshCw,
      iconTone: 'bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-300',
      onClick: () => navigate('/renewals'),
    },
  ];

  return (
    <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
            Needs Your Attention
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
            Daily priorities ranked for quick action
          </p>
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={item.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  item.onClick();
                }
              }}
              className="group flex items-center justify-between gap-3 p-3 rounded-2xl border border-stone-100 dark:border-zinc-800/80 hover:border-orange-200 dark:hover:border-orange-900/60 hover:bg-[#FAF9F6] dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconTone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 truncate tabular-nums">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 group-hover:bg-orange-600 group-hover:text-white text-xs font-semibold text-stone-700 dark:text-zinc-200 transition-colors shrink-0">
                <span>{item.cta}</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
