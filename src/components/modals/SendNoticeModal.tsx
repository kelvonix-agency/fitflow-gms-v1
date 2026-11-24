import React, { useMemo, useState } from 'react';
import { Check, Copy, Megaphone, MessageCircle, Send } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { buildWhatsAppUrl } from '../../utils/formatters';

interface SendNoticeModalProps {
  open: boolean;
  onClose: () => void;
}

type NoticeAudience = 'All Members' | 'Active Members' | 'Expiring Soon' | 'Expired Members' | 'Frozen Members';

const PRESET_NOTICES = [
  {
    id: 'holiday',
    label: 'Gym Holiday',
    title: 'Gym Closure Notice',
    body: 'Hi {name}, please note that {gym} will remain closed tomorrow for scheduled maintenance & deep sanitization. Regular timings resume the next day!',
  },
  {
    id: 'timing',
    label: 'Timing Update',
    title: 'Updated Batch Timings',
    body: 'Hi {name}, morning strength sessions at {gym} now start at 5:30 AM and evening batch runs till 10:00 PM. See you on the floor!',
  },
  {
    id: 'fee',
    label: 'Fee / Renewal Notice',
    title: 'Membership Renewal Reminder',
    body: 'Hi {name}, this is a quick update from {gym}. Please renew your membership before your expiry date to avoid any interruption in gym access.',
  },
  {
    id: 'offer',
    label: 'Special Offer',
    title: 'Member Upgrade Offer',
    body: 'Hi {name}, {gym} is offering 15% savings on Quarterly and Annual renewals this week. Ask at the front desk to lock in your rate!',
  },
  {
    id: 'custom',
    label: 'Custom Notice',
    title: 'Important Gym Announcement',
    body: 'Hi {name}, quick update from Team {gym}: ',
  },
] as const;

export function SendNoticeModal({ open, onClose }: SendNoticeModalProps) {
  const { store, activeMembersList, sendOwnerNotice } = useGymData();
  const { toast } = useToast();

  const gymName = store?.gym.name || 'FitFlow Studio';
  const [presetId, setPresetId] = useState<string>('holiday');
  const [title, setTitle] = useState<string>(PRESET_NOTICES[0].title);
  const [message, setMessage] = useState<string>(PRESET_NOTICES[0].body);
  const [audience, setAudience] = useState<NoticeAudience>('Active Members');
  const [copied, setCopied] = useState(false);

  const recipients = useMemo(() => {
    switch (audience) {
      case 'Active Members':
        return activeMembersList.filter((m) => m.derivedStatus === 'active');
      case 'Expiring Soon':
        return activeMembersList.filter((m) => m.derivedStatus === 'expiring');
      case 'Expired Members':
        return activeMembersList.filter((m) => m.derivedStatus === 'expired');
      case 'Frozen Members':
        return activeMembersList.filter((m) => m.derivedStatus === 'frozen');
      default:
        return activeMembersList;
    }
  }, [activeMembersList, audience]);

  const formatForMember = (memberName: string) =>
    message
      .replace(/\{name\}/gi, memberName.split(' ')[0])
      .replace(/\{gym\}/gi, gymName);

  const handleSelectPreset = (id: string) => {
    const found = PRESET_NOTICES.find((p) => p.id === id);
    if (!found) return;
    setPresetId(id);
    setTitle(found.title);
    setMessage(found.body);
  };

  const handleCopyBroadcast = async () => {
    const broadcastText = `*${title} — ${gymName}*\n\n${message
      .replace(/\{name\}/gi, 'Member')
      .replace(/\{gym\}/gi, gymName)}`;
    try {
      await navigator.clipboard.writeText(broadcastText);
      setCopied(true);
      toast({ title: 'Notice text copied for broadcast.' });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Could not copy automatically.', variant: 'error' });
    }
  };

  const handleRecordAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Please enter a notice title and message.', variant: 'error' });
      return;
    }
    sendOwnerNotice({
      title: title.trim(),
      message: message.replace(/\{gym\}/gi, gymName).trim(),
      audience,
      recipientCount: recipients.length,
    });
    toast({
      title: `Notice logged for ${recipients.length} ${audience.toLowerCase()}.`,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Member Notice"
      subtitle="Owner announcements, timing updates, holiday notices, or fee alerts sent directly by you."
      size="lg"
    >
      <form onSubmit={handleRecordAndClose} className="space-y-4">
        {/* Preset Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-2">
            Notice Type
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
            {PRESET_NOTICES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  presetId === preset.id
                    ? 'border-orange-600 bg-orange-600 text-white'
                    : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audience + Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-1.5">
              Target Members ({recipients.length})
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as NoticeAudience)}
              className="w-full rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="Active Members">Active Members</option>
              <option value="All Members">All Members</option>
              <option value="Expiring Soon">Expiring Soon (≤7 days)</option>
              <option value="Expired Members">Expired Members</option>
              <option value="Frozen Members">Frozen Members</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-300 mb-1.5">
              Notice Heading
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sunday Maintenance Closure"
              className="w-full rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
        </div>

        {/* Message Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-stone-600 dark:text-zinc-300">
              Information Message
            </label>
            <span className="text-[11px] text-stone-400 dark:text-zinc-500">
              Supports {'{name}'} &amp; {'{gym}'}
            </span>
          </div>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>

        {/* Quick WhatsApp Delivery List */}
        <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-stone-50/80 dark:bg-zinc-900/60 border-b border-stone-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-orange-600" />
              <span>Recipients ({recipients.length})</span>
            </span>
            <button
              type="button"
              onClick={handleCopyBroadcast}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied Broadcast' : 'Copy Broadcast Text'}</span>
            </button>
          </div>

          {recipients.length === 0 ? (
            <p className="py-6 text-center text-xs text-stone-500 dark:text-zinc-400">
              No members currently match “{audience}”.
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800/80">
              {recipients.slice(0, 12).map((m) => (
                <div
                  key={m.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-stone-50/60 dark:hover:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={m.name} src={m.avatar_url} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
                        {m.phone}
                      </p>
                    </div>
                  </div>
                  <a
                    href={buildWhatsAppUrl(m.phone, formatForMember(m.name))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              ))}
              {recipients.length > 12 && (
                <p className="px-4 py-2 text-[11px] text-stone-500 dark:text-zinc-400 text-center">
                  +{recipients.length - 12} more members — use “Copy Broadcast Text” for WhatsApp Broadcast list.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send &amp; Log Notice</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
