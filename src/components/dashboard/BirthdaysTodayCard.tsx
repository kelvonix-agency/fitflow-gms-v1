import React from 'react';
import { Cake, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { useGymData } from '../../context/GymDataContext';
import { EnrichedMember } from '../../types';

export function BirthdaysTodayCard({
  onWishMember,
  onWishAll,
}: {
  onWishMember: (member: EnrichedMember) => void;
  onWishAll: () => void;
}) {
  const navigate = useNavigate();
  const { birthdaysToday } = useGymData();

  return (
    <div className="h-full rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              Today&apos;s Birthdays
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
              {birthdaysToday.length > 0
                ? `${birthdaysToday.length} ${birthdaysToday.length === 1 ? 'member' : 'members'} celebrating today`
                : 'No member birthdays today'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/communication/birthdays')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-orange-50 dark:hover:bg-orange-950/30 text-xs font-semibold text-orange-600 transition-colors whitespace-nowrap"
          >
            <span>All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {birthdaysToday.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-10 w-10 rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 flex items-center justify-center mb-2.5">
              <Cake className="h-5 w-5" />
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              No birthdays today. Check upcoming birthdays this week.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {birthdaysToday.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-stone-50/80 dark:bg-zinc-900/60 border border-stone-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.name} src={m.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                      Today · {m.currentPlan?.name || 'Member'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onWishMember(m)}
                  className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-600 text-xs font-semibold text-stone-700 dark:text-zinc-200 transition-colors shrink-0"
                >
                  Wish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {birthdaysToday.length > 0 && (
        <button
          type="button"
          onClick={onWishAll}
          className="mt-4 w-full py-2.5 px-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors"
        >
          Wish All Birthday Members
        </button>
      )}
    </div>
  );
}
