import React, { useMemo, useState } from 'react';
import { Check, Copy, MessageCircle, Sparkles } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import { buildWhatsAppUrl } from '../utils/formatters';

const DEFAULT_FESTIVALS = [
  'New Year',
  'Republic Day',
  'Holi',
  'Independence Day',
  'Janmashtami',
  'Diwali',
  'Christmas',
];

type AudienceType = 'All Members' | 'Active Members' | 'Expired Members' | 'Custom Members';

export function FestivalWishesPage() {
  const { store, activeMembersList, logFestivalWish } = useGymData();
  const { toast } = useToast();

  const [festival, setFestival] = useState('Diwali');
  const [customFestival, setCustomFestival] = useState('');
  const [audience, setAudience] = useState<AudienceType>('Active Members');
  const [customIds, setCustomIds] = useState<string[]>([]);
  const [template, setTemplate] = useState(
    'Happy {festival}, {name}! Wishing you happiness, health and success. — Team FitFlow',
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const effectiveFestival = festival === '__custom__' ? customFestival.trim() || 'Festival' : festival;

  const audienceMembers = useMemo(() => {
    if (audience === 'All Members') return activeMembersList;
    if (audience === 'Active Members') {
      return activeMembersList.filter((m) => m.derivedStatus === 'active');
    }
    if (audience === 'Expired Members') {
      return activeMembersList.filter((m) => m.derivedStatus === 'expired');
    }
    const idSet = new Set(customIds);
    return activeMembersList.filter((m) => idSet.has(m.id));
  }, [activeMembersList, audience, customIds]);

  const renderMessage = (memberName: string) =>
    template
      .replace(/\{festival\}/gi, effectiveFestival)
      .replace(/\{name\}/gi, memberName.split(' ')[0]);

  const toggleCustomMember = (id: string) => {
    setCustomIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCopy = async (memberId: string, memberName: string) => {
    const msg = renderMessage(memberName);
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedId(memberId);
      logFestivalWish(effectiveFestival, template, audience);
      toast({ title: `Copied wish for ${memberName}.` });
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast({ title: 'Could not copy to clipboard', variant: 'error' });
    }
  };

  const getWhatsAppHref = (phone: string, memberName: string) => {
    const msg = renderMessage(memberName);
    return buildWhatsAppUrl(phone, msg);
  };

  const sampleMember = audienceMembers[0] || activeMembersList[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
          Festival Wishes
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
          Compose personalized festival greetings for your members using WhatsApp click-to-chat or copy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Composer */}
        <div className="lg:col-span-5 rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-2">
              1. Select Festival
            </label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
              {DEFAULT_FESTIVALS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFestival(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border active:scale-[0.97] transition-all whitespace-nowrap shrink-0 ${
                    festival === f
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFestival('__custom__')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border active:scale-[0.97] transition-all whitespace-nowrap shrink-0 ${
                  festival === '__custom__'
                    ? 'border-orange-600 bg-orange-600 text-white'
                    : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                }`}
              >
                + Custom
              </button>
            </div>
            {festival === '__custom__' && (
              <input
                type="text"
                value={customFestival}
                onChange={(e) => setCustomFestival(e.target.value)}
                placeholder="Enter festival or gym anniversary name..."
                className="mt-3 w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-2">
              2. Target Audience
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['All Members', 'Active Members', 'Expired Members', 'Custom Members'] as AudienceType[]).map(
                (aud) => (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => setAudience(aud)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-colors ${
                      audience === aud
                        ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300'
                    }`}
                  >
                    {aud}
                  </button>
                ),
              )}
            </div>

            {audience === 'Custom Members' && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-stone-200 dark:border-zinc-800 p-2 space-y-1">
                {activeMembersList.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={customIds.includes(m.id)}
                      onChange={() => toggleCustomMember(m.id)}
                      className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>{m.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1.5">
              3. Message Template
            </label>
            <textarea
              rows={4}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full rounded-[14px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <p className="mt-1.5 text-[11px] text-stone-400 dark:text-zinc-500">
              Placeholders: <code className="font-mono-num">{'{name}'}</code> and{' '}
              <code className="font-mono-num">{'{festival}'}</code>.
            </p>
          </div>

          {sampleMember && (
            <div className="rounded-2xl bg-stone-50 dark:bg-zinc-900/60 border border-stone-200/80 dark:border-zinc-800 p-4">
              <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 mb-1">
                Live Preview ({sampleMember.name})
              </p>
              <p className="text-xs text-stone-800 dark:text-zinc-200 leading-relaxed">
                {renderMessage(sampleMember.name)}
              </p>
            </div>
          )}
        </div>

        {/* Personalized Recipients List */}
        <div className="lg:col-span-7 rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
                Recipients ({audienceMembers.length})
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Copy or open WhatsApp click-to-chat per member for {store?.gym.name || 'FitFlow Studio'}.
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-orange-600 shrink-0" />
          </div>

          {audienceMembers.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 dark:text-zinc-400">
              Select at least one member in the audience filter to prepare personalized wishes.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-zinc-800 max-h-[540px] overflow-y-auto pr-1">
              {audienceMembers.map((m) => (
                <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={m.name} src={m.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                        {m.name}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400 line-clamp-2">
                        {renderMessage(m.name)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.name)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                    >
                      {copiedId === m.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={getWhatsAppHref(m.phone, m.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logFestivalWish(effectiveFestival, template, audience)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold transition-all"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
