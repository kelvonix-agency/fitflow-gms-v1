import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { PaymentMethod, PaymentStatus, PaymentType } from '../../types';
import { getTodayISO } from '../../utils/formatters';

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  defaultMemberId?: string;
}

export function RecordPaymentModal({ open, onClose, defaultMemberId }: RecordPaymentModalProps) {
  const { activeMembersList, recordPayment } = useGymData();
  const { toast } = useToast();

  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('1500');
  const [paymentType, setPaymentType] = useState<PaymentType>('Renewal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [status, setStatus] = useState<PaymentStatus>('Paid');
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (!open) return;
    const targetId = defaultMemberId || activeMembersList[0]?.id || '';
    setMemberId(targetId);
    const targetMember = activeMembersList.find((m) => m.id === targetId);
    setAmount(targetMember?.currentPlan ? String(targetMember.currentPlan.price) : '1500');
    setPaymentType('Renewal');
    setPaymentMethod('UPI');
    setStatus('Paid');
    setPaymentDate(getTodayISO());
    setTransactionId('');
  }, [open, defaultMemberId, activeMembersList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    recordPayment({
      member_id: memberId,
      amount: Number(amount) || 0,
      payment_type: paymentType,
      payment_method: paymentMethod,
      status,
      payment_date: paymentDate,
      transaction_id: transactionId.trim() || undefined,
    });
    toast({ title: 'Payment recorded successfully.' });
    onClose();
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      subtitle="Log a member fee, renewal payment, or add-on purchase."
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="record-payment-form"
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors"
          >
            Save Payment
          </button>
        </>
      }
    >
      <form id="record-payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Member</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputClass}>
            {activeMembersList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.member_code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Amount (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} tabular-nums`}
            />
          </div>

          <div>
            <label className={labelClass}>Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className={inputClass}
            >
              <option value="New Membership">New Membership</option>
              <option value="Renewal">Renewal</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className={inputClass}
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              className={inputClass}
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Transaction ID</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Auto-generated if blank"
              className={inputClass}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
