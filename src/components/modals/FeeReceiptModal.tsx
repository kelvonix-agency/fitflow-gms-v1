import React from 'react';
import { CheckCircle2, Copy, MessageCircle, Printer } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { BrandLogo } from '../BrandLogo';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { Payment } from '../../types';
import {
  buildReceiptWhatsAppText,
  buildWhatsAppUrl,
  formatDateIN,
  formatINR,
} from '../../utils/formatters';

interface FeeReceiptModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  member?: {
    name: string;
    member_code: string;
    phone: string;
    email?: string;
  } | null;
  planName?: string;
  validTill?: string;
}

export function FeeReceiptModal({
  open,
  onClose,
  payment,
  member,
  planName,
  validTill,
}: FeeReceiptModalProps) {
  const { store } = useGymData();
  const { toast } = useToast();

  if (!payment) return null;

  const gymName = store?.gym.name || 'FitFlow Studio';
  const gymPhone = store?.gym.phone || '';
  const gymAddress = store?.gym.address || '';
  const gymEmail = store?.gym.email || '';

  const memberName = member?.name || 'Gym Member';
  const memberCode = member?.member_code || '—';

  const receiptText = buildReceiptWhatsAppText({
    gymName,
    gymPhone,
    memberName,
    memberCode,
    transactionId: payment.transaction_id,
    amount: payment.amount,
    paymentMethod: payment.payment_method,
    paymentType: payment.payment_type,
    paymentDate: payment.payment_date,
    planName,
    validTill,
  });

  const whatsAppHref = member?.phone ? buildWhatsAppUrl(member.phone, receiptText) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      toast({ title: 'Receipt copied to clipboard.' });
    } catch {
      toast({ title: 'Unable to copy receipt.', variant: 'error' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Digital Fee Receipt"
      subtitle={`Receipt RCP-${payment.transaction_id}`}
      size="md"
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Text</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
          {whatsAppHref ? (
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Send on WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-orange-600 text-white text-xs sm:text-sm font-semibold"
            >
              Done
            </button>
          )}
        </div>
      }
    >
      <div
        id="printable-fee-receipt"
        className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-[#FAF9F6] dark:bg-zinc-900/60 p-5 sm:p-6 space-y-5"
      >
        {/* Receipt Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <BrandLogo gymName={gymName} logoUrl={store?.gym.logo_url} />
            {gymAddress && (
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                {gymAddress}
              </p>
            )}
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
              {[gymPhone, gymEmail].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{payment.status.toUpperCase()}</span>
            </span>
            <p className="mt-2 text-[11px] font-mono-num text-stone-500 dark:text-zinc-400">
              RCP-{payment.transaction_id}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
              {formatDateIN(payment.payment_date)}
            </p>
          </div>
        </div>

        {/* Member & Transaction Summary */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-[11px] text-stone-400 dark:text-zinc-500">Billed To</p>
            <p className="mt-0.5 font-semibold text-stone-900 dark:text-zinc-100">{memberName}</p>
            <p className="text-stone-500 dark:text-zinc-400 font-mono-num">{memberCode}</p>
            {member?.phone && (
              <p className="text-stone-500 dark:text-zinc-400 tabular-nums">{member.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] text-stone-400 dark:text-zinc-500">Payment Mode</p>
            <p className="mt-0.5 font-semibold text-stone-900 dark:text-zinc-100">
              {payment.payment_method}
            </p>
            <p className="text-stone-500 dark:text-zinc-400 font-mono-num">{payment.transaction_id}</p>
          </div>
        </div>

        {/* Line Item */}
        <div className="rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-[#181A1F] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="px-4 py-3.5 flex items-start justify-between gap-4 text-xs">
            <div>
              <p className="font-semibold text-stone-900 dark:text-zinc-100">
                {planName ? `${planName} — ${payment.payment_type}` : payment.payment_type}
              </p>
              {validTill && (
                <p className="mt-0.5 text-[11px] text-stone-500 dark:text-zinc-400 tabular-nums">
                  Membership valid till {formatDateIN(validTill)}
                </p>
              )}
            </div>
            <span className="font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
              {formatINR(payment.amount)}
            </span>
          </div>
          <div className="px-4 py-3 bg-stone-50/80 dark:bg-zinc-900/50 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300">Total Paid</span>
            <span className="font-display text-lg font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
              {formatINR(payment.amount)}
            </span>
          </div>
        </div>

        <p className="text-center text-[11px] text-stone-400 dark:text-zinc-500">
          Computer-generated fee receipt · Thank you for training with {gymName}
        </p>
      </div>
    </Modal>
  );
}
