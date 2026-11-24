import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { useGymData } from '../../context/GymDataContext';
import { useToast } from '../../context/ToastContext';
import { Enquiry, EnrichedMember, Gender, PaymentMethod, PaymentStatus } from '../../types';
import { addDaysISO, formatINR, getTodayISO } from '../../utils/formatters';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  editMember?: EnrichedMember | null;
  initialEnquiry?: Enquiry | null;
  onSuccess?: (memberId: string) => void;
}

export function AddMemberModal({
  open,
  onClose,
  editMember,
  initialEnquiry,
  onSuccess,
}: AddMemberModalProps) {
  const { activePlans, addMember, updateMember } = useGymData();
  const { toast } = useToast();

  const today = getTodayISO();
  const isEdit = Boolean(editMember);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [joiningDate, setJoiningDate] = useState(today);

  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDaysISO(today, 30));

  const [amount, setAmount] = useState('1500');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editMember) {
      setName(editMember.name);
      setAvatarUrl(editMember.avatar_url);
      setPhone(editMember.phone);
      setEmail(editMember.email || '');
      setDob(editMember.date_of_birth || '');
      setGender(editMember.gender || 'Male');
      setAddress(editMember.address || '');
      setEmergencyContact(editMember.emergency_contact || '');
      setJoiningDate(editMember.joining_date);
      setNotes(editMember.notes || '');
      return;
    }

    const matchedPlan =
      activePlans.find((p) =>
        initialEnquiry ? p.name.toLowerCase() === initialEnquiry.interested_plan.toLowerCase() : false,
      ) || activePlans[0];

    setName(initialEnquiry?.name || '');
    setAvatarUrl(undefined);
    setPhone(initialEnquiry?.phone || '');
    setEmail(initialEnquiry?.email || '');
    setDob('');
    setGender('Male');
    setAddress('');
    setEmergencyContact('');
    setJoiningDate(today);
    setPlanId(matchedPlan?.id || '');
    setStartDate(today);
    setEndDate(matchedPlan ? addDaysISO(today, matchedPlan.duration_days) : addDaysISO(today, 30));
    setAmount(matchedPlan ? String(matchedPlan.price) : '1500');
    setPaymentStatus('Paid');
    setPaymentMethod('UPI');
    setTransactionId('');
    setNotes(initialEnquiry?.notes || '');
  }, [open, editMember, initialEnquiry, activePlans, today]);

  const handlePlanChange = (nextPlanId: string) => {
    setPlanId(nextPlanId);
    const plan = activePlans.find((p) => p.id === nextPlanId);
    if (plan) {
      setEndDate(addDaysISO(startDate || today, plan.duration_days));
      setAmount(String(plan.price));
    }
  };

  const handleStartDateChange = (nextStart: string) => {
    setStartDate(nextStart);
    const plan = activePlans.find((p) => p.id === planId);
    if (plan && nextStart) {
      setEndDate(addDaysISO(nextStart, plan.duration_days));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Full name is required.';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = 'Valid 10-digit phone number is required.';
    }
    if (!isEdit) {
      if (!planId) nextErrors.planId = 'Please select a membership plan.';
      if (!startDate) nextErrors.startDate = 'Start date is required.';
      const numAmt = Number(amount);
      if (!Number.isFinite(numAmt) || numAmt < 0) nextErrors.amount = 'Enter a valid amount.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && editMember) {
      updateMember(editMember.id, {
        name: name.trim(),
        avatar_url: avatarUrl,
        phone: phone.trim(),
        email: email.trim() || undefined,
        date_of_birth: dob || undefined,
        gender,
        address: address.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        joining_date: joiningDate,
        notes: notes.trim() || undefined,
      });
      toast({ title: 'Member profile updated', description: `${name.trim()} details saved.` });
      onClose();
      return;
    }

    const created = addMember({
      name: name.trim(),
      avatar_url: avatarUrl,
      phone: phone.trim(),
      email: email.trim() || undefined,
      date_of_birth: dob || undefined,
      gender,
      address: address.trim() || undefined,
      emergency_contact: emergencyContact.trim() || undefined,
      joining_date: joiningDate,
      plan_id: planId,
      start_date: startDate,
      end_date: endDate,
      amount: Number(amount) || 0,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      transaction_id: transactionId.trim() || undefined,
      notes: notes.trim() || undefined,
      converted_from_enquiry_id: initialEnquiry?.id,
    });

    if (created) {
      toast({
        title: 'Member added successfully.',
        description: `${created.name} (${created.member_code}) enrolled.`,
      });
      onSuccess?.(created.id);
      onClose();
    }
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Member Profile' : initialEnquiry ? 'Convert Enquiry to Member' : 'Add New Member'}
      subtitle={
        isEdit
          ? 'Update personal and emergency contact information.'
          : 'Create a member profile, assign a plan, and record initial payment.'
      }
      size="lg"
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
            form="add-member-form"
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors"
          >
            {isEdit ? 'Save Changes' : 'Add Member'}
          </button>
        </>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo & Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-stone-100 dark:border-zinc-800">
          <Avatar name={name || 'New Member'} src={avatarUrl} size="xl" />
          <div>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Profile Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            <p className="mt-1.5 text-xs text-stone-400 dark:text-zinc-500">
              Optional. Clean monogram initials are generated automatically if omitted.
            </p>
          </div>
        </div>

        {/* Personal Details */}
        <div>
          <h3 className="text-xs font-semibold text-stone-900 dark:text-zinc-100 mb-3">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amit Sharma"
                className={inputClass}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className={labelClass}>Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amit.sharma@gmail.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className={inputClass}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Joining Date</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Indiranagar, Bengaluru"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Emergency Contact</label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98450 00000"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Membership & Payment (Create mode) */}
        {!isEdit && (
          <>
            <div className="pt-4 border-t border-stone-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-stone-900 dark:text-zinc-100 mb-3">Membership Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Plan *</label>
                  <select
                    value={planId}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className={inputClass}
                  >
                    {activePlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatINR(p.price)} · {p.duration_days}d)
                      </option>
                    ))}
                  </select>
                  {errors.planId && <p className="mt-1 text-xs text-red-600">{errors.planId}</p>}
                </div>

                <div>
                  <label className={labelClass}>Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className={inputClass}
                  />
                  {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
                </div>

                <div>
                  <label className={labelClass}>End Date (Auto-calculated)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-stone-900 dark:text-zinc-100 mb-3">Initial Payment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                  {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                </div>

                <div>
                  <label className={labelClass}>Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className={inputClass}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
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
                  <label className={labelClass}>Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Auto if empty"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Training goals, health notes, or batch preference..."
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
}
