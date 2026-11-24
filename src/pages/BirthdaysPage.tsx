import React, { useState } from 'react';
import { Cake, MessageCircle } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { Avatar } from '../components/ui/Avatar';
import {
  StatusBadge,
  statusLabelFromMembership,
  statusToneFromMembership,
} from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/States';
import { BirthdayWishModal } from '../components/modals/BirthdayWishModal';
import { EnrichedMember } from '../types';
import { buildWhatsAppUrl, calculateAge, formatDateIN } from '../utils/formatters';

export function BirthdaysPage() {
  const { store, birthdaysToday, upcomingBirthdays7Days, birthdaysThisMonth } = useGymData();
  const [wishTargets, setWishTargets] = useState<EnrichedMember[]>([]);

  const gymName = store?.gym.name || 'FitFlow Studio';

  const getWhatsAppUrl = (m: EnrichedMember) => {
    const first = m.name.split(' ')[0];
    const msg = `Happy Birthday, ${first}! 🎉 Wishing you a fantastic year ahead filled with strength and health. — Team ${gymName}`;
    return buildWhatsAppUrl(m.phone, msg);
  };

  const renderSection = (title: string, subtitle: string, list: EnrichedMember[], showWishAll = false) => (
    <section className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">{title}</h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        {showWishAll && list.length > 0 && (
          <button
            type="button"
            onClick={() => setWishTargets(list)}
            className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold self-start sm:self-auto transition-all whitespace-nowrap"
          >
            Wish All ({list.length})
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Cake}
          title={`No ${title.toLowerCase()}`}
          description="Members with matching birth dates will appear here automatically."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {list.map((m) => {
            const age = calculateAge(m.date_of_birth);
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 flex flex-col justify-between gap-4 bg-stone-50/50 dark:bg-zinc-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={m.name} src={m.avatar_url} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 tabular-nums">
                        {formatDateIN(m.date_of_birth)}
                        {age !== null ? ` · Turning ${age}` : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={statusLabelFromMembership(m.derivedStatus)}
                    tone={statusToneFromMembership(m.derivedStatus)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWishTargets([m])}
                    className="flex-1 py-2 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-orange-500 active:scale-[0.98] text-xs font-semibold text-stone-800 dark:text-zinc-200 transition-all"
                  >
                    Wish
                  </button>
                  <a
                    href={getWhatsAppUrl(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold transition-all"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
          Member Birthdays
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
          Preview personalized birthday greetings and send via WhatsApp click-to-chat.
        </p>
      </div>

      {renderSection("Today's Birthdays", 'Members celebrating their birthday today', birthdaysToday, true)}
      {renderSection('Upcoming Birthdays', 'Celebrating in the next 7 days', upcomingBirthdays7Days)}
      {renderSection('This Month', 'All member birthdays this month', birthdaysThisMonth)}

      <BirthdayWishModal
        open={wishTargets.length > 0}
        onClose={() => setWishTargets([])}
        members={wishTargets}
      />
    </div>
  );
}
