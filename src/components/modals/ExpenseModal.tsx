import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { getTodayISO } from '../../utils/formatters';

const CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Utilities',
  'Salaries',
  'Maintenance',
  'Supplies',
  'Marketing',
  'Other',
];

const METHODS: PaymentMethod[] = ['UPI', 'Bank Transfer', 'Cash', 'Card'];

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

export function ExpenseModal({ open, onClose, editExpense }: ExpenseModalProps) {
  const { addExpense, updateExpense } = useGymData();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Utilities');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [expenseDate, setExpenseDate] = useState(getTodayISO());
  const [vendorName, setVendorName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editExpense) {
      setTitle(editExpense.title);
      setCategory(editExpense.category);
      setAmount(String(editExpense.amount));
      setPaymentMethod(editExpense.payment_method);
      setExpenseDate(editExpense.expense_date);
      setVendorName(editExpense.vendor_name || '');
      setNotes(editExpense.notes || '');
    } else {
      setTitle('');
      setCategory('Utilities');
      setAmount('');
      setPaymentMethod('UPI');
      setExpenseDate(getTodayISO());
      setVendorName('');
      setNotes('');
    }
  }, [open, editExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const numericAmount = Number(amount);

    if (!trimmedTitle) {
      toast({ title: 'Please enter an expense title.', variant: 'error' });
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast({ title: 'Please enter a valid expense amount.', variant: 'error' });
      return;
    }

    if (editExpense) {
      updateExpense(editExpense.id, {
        title: trimmedTitle,
        category,
        amount: numericAmount,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        vendor_name: vendorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: 'Expense updated.' });
    } else {
      addExpense({
        title: trimmedTitle,
        category,
        amount: numericAmount,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        vendor_name: vendorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: 'Expense logged successfully.' });
    }
    onClose();
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editExpense ? 'Edit Expense' : 'Log Gym Expense'}
      subtitle="Track rent, payroll, utilities, and equipment costs for accurate Net Profit."
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-full border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="expense-form"
            className="px-5 py-2.5 text-sm font-semibold rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white transition-all whitespace-nowrap"
          >
            {editExpense ? 'Save Changes' : 'Save Expense'}
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Expense Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., BESCOM Electricity Bill or Trainer Salary"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className={inputClass}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Amount (₹) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 12500"
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
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Expense Date</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Vendor / Payee (Optional)</label>
          <input
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder="e.g., ProFit Equipment Care"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Notes (Optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Invoice ref or additional details"
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
}
