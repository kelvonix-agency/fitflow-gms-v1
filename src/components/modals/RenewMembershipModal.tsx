import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { EnrichedMember, PaymentMethod, PaymentStatus } from '../../types';
import { addDaysISO, formatDateIN, formatINR, getTodayISO } from '../../utils/formatters';

interface RenewMembershipModalProps {
  open: boolean;
  onClose: () => void;
  member: EnrichedMember | null;
}

export function RenewMembershipModal({ open, onClose, member }: RenewMembershipModalProps) {
  const { activePlans, renewMembership } = useGymData();
  const { toast } = useToast();

  const today = getTodayISO();
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDaysISO(today, 30));
  const [amount, setAmount] = useState('1500');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');

  useEffect(() => {
    if (!open || !member) return;
    const defaultPlan =
      activePlans.find((p) => p.id === member.currentPlan?.id) || activePlans[0];
    // If current expiry is in the future, start seamlessly after expiry; if expired, start today
    const suggestedStart =
      member.expiryDate && member.expiryDate >= today
        ? addDaysISO(member.expiryDate, 1)
        : today;

    setPlanId(defaultPlan?.id || '');
    setStartDate(suggestedStart);
    setEndDate(
      defaultPlan ? addDaysISO(suggestedStart, defaultPlan.duration_days) : addDaysISO(suggestedStart, 30),
    );
    setAmount(defaultPlan ? String(defaultPlan.price) : '1500');
    setPaymentMethod('UPI');
    setPaymentStatus('Paid');
  }, [open, member, activePlans, today]);

  if (!member) return null;

  const selectedPlan = activePlans.find((p) => p.id === planId);

  const handlePlanChange = (nextId: string) => {
    setPlanId(nextId);
    const plan = activePlans.find((p) => p.id === nextId);
    if (plan) {
      setAmount(String(plan.price));
      setEndDate(addDaysISO(startDate, plan.duration_days));
    }
  };

  const handleStartChange = (nextStart: string) => {
    setStartDate(nextStart);
    if (selectedPlan && nextStart) {
      setEndDate(addDaysISO(nextStart, selectedPlan.duration_days));
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !startDate || !endDate) return;

    renewMembership({
      member_id: member.id,
      plan_id: planId,
      start_date: startDate,
      end_date: endDate,
      amount: Number(amount) || 0,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    });

    toast({
      title: 'Membership renewed successfully.',
      description: `${member.name}'s ${selectedPlan?.name || ''} plan is active until ${formatDateIN(endDate)}.`,
    });
    onClose();
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Renew Membership"
      subtitle="Updates membership expiry, logs payment, and records renewal history."
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
            form="renew-form"
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors"
          >
            Confirm Renewal
          </button>
        </>
      }
    >
      <form id="renew-form" onSubmit={handleConfirm} className="space-y-5">
        {/* Member Summary */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-zinc-900/70 border border-stone-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={member.name} src={member.avatar_url} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">{member.name}</p>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                {member.member_code} · Current: {member.currentPlan?.name || 'None'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-stone-500 dark:text-zinc-400">Current Expiry</p>
            <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
              {formatDateIN(member.expiryDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>New Plan</label>
            <select
              value={planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className={inputClass}
            >
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatINR(p.price)} ({p.duration_days} days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              New Expiry ({selectedPlan?.duration_days || 30} days)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Amount (₹)</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} tabular-nums`}
            />
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

          <div className="sm:col-span-2">
            <label className={labelClass}>Payment Status</label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['Paid', 'Pending'] as PaymentStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPaymentStatus(st)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors ${
                    paymentStatus === st
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                      : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
