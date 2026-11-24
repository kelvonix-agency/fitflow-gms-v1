import React, { useEffect, useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { EnrichedMember } from '../../types';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { buildWhatsAppUrl } from '../../utils/formatters';

interface BirthdayWishModalProps {
  open: boolean;
  onClose: () => void;
  members: EnrichedMember[];
}

export function BirthdayWishModal({ open, onClose, members }: BirthdayWishModalProps) {
  const { store, logBirthdayWish } = useGymData();
  const { toast } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const gymName = store?.gym.name || 'FitFlow Studio';
  const activeMember = members.find((m) => m.id === selectedMemberId) || members[0];

  useEffect(() => {
    if (!open || members.length === 0) return;
    const first = members[0];
    setSelectedMemberId(first.id);
    const firstName = first.name.split(' ')[0];
    setMessage(
      `Happy Birthday, ${firstName}! 🎉 Wishing you a fantastic year ahead filled with strength, health, and new milestones. — Team ${gymName}`,
    );
    setCopied(false);
  }, [open, members, gymName]);

  const handleSelectMember = (member: EnrichedMember) => {
    setSelectedMemberId(member.id);
    const firstName = member.name.split(' ')[0];
    setMessage(
      `Happy Birthday, ${firstName}! 🎉 Wishing you a fantastic year ahead filled with strength, health, and new milestones. — Team ${gymName}`,
    );
    setCopied(false);
  };

  if (!activeMember) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      logBirthdayWish(activeMember.id, message);
      toast({ title: 'Message copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Unable to copy automatically', variant: 'error' });
    }
  };

  const handleWhatsAppClick = () => {
    logBirthdayWish(activeMember.id, message);
    toast({ title: `Opening WhatsApp for ${activeMember.name}` });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={members.length > 1 ? 'Send Birthday Wishes' : `Birthday Wish · ${activeMember.name}`}
      subtitle="Preview and customize the greeting before copying or opening WhatsApp click-to-chat."
      size="md"
    >
      <div className="space-y-4">
        {members.length > 1 && (
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mb-2">
              Select member ({members.length} celebrating)
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMember(m)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    m.id === activeMember.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                      : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Avatar name={m.name} src={m.avatar_url} size="xs" />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 border border-stone-200/80 dark:border-zinc-800">
          <Avatar name={activeMember.name} src={activeMember.avatar_url} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">{activeMember.name}</p>
            <p className="text-xs text-stone-500 dark:text-zinc-400 tabular-nums">{activeMember.phone}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
            Personalized Message Preview
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-[14px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
          <p className="mt-1.5 text-[11px] text-stone-400 dark:text-zinc-500">
            WhatsApp click-to-chat opens the prefilled conversation directly in WhatsApp for manual send.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied' : 'Copy Message'}</span>
          </button>
          <a
            href={buildWhatsAppUrl(activeMember.phone, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-sm font-semibold text-white transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Open WhatsApp</span>
          </a>
        </div>
      </div>
    </Modal>
  );
}
