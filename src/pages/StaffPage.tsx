import React, { useState } from 'react';
import { Edit3, Plus, Trash2, UserCog } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/States';
import { StaffMember, StaffRole, StaffStatus } from '../types';
import { formatDateIN, getTodayISO } from '../utils/formatters';

export function StaffPage() {
  const { activeStaff, addStaff, updateStaff, removeStaff } = useGymData();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('Trainer');
  const [joiningDate, setJoiningDate] = useState(getTodayISO());
  const [status, setStatus] = useState<StaffStatus>('Active');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setRole('Trainer');
    setJoiningDate(getTodayISO());
    setStatus('Active');
    setModalOpen(true);
  };

  const openEdit = (st: StaffMember) => {
    setEditing(st);
    setName(st.name);
    setPhone(st.phone);
    setEmail(st.email || '');
    setRole(st.role);
    setJoiningDate(st.joining_date);
    setStatus(st.status);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Name and phone are required.', variant: 'error' });
      return;
    }

    if (editing) {
      updateStaff(editing.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        role,
        joining_date: joiningDate,
        status,
      });
      toast({ title: 'Staff member updated.' });
    } else {
      addStaff({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        role,
        joining_date: joiningDate,
        status,
      });
      toast({ title: 'Staff member added.' });
    }
    setModalOpen(false);
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Staff
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Manage trainers, receptionists, and gym floor managers.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold self-start sm:self-auto transition-all whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {activeStaff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff members added"
          description="Add trainers, receptionists, and managers to keep contact details handy."
          actionLabel="+ Add Staff"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeStaff.map((s) => (
            <div
              key={s.id}
              className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 flex flex-col justify-between gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={s.name} src={s.avatar_url} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{s.role}</p>
                  </div>
                </div>
                <StatusBadge
                  label={s.status}
                  tone={s.status === 'Active' ? 'success' : 'neutral'}
                />
              </div>

              <div className="space-y-1 text-xs text-stone-600 dark:text-zinc-400">
                <p className="tabular-nums">{s.phone}</p>
                {s.email && <p className="truncate">{s.email}</p>}
                <p className="text-stone-400 dark:text-zinc-500 tabular-nums">
                  Joined {formatDateIN(s.joining_date)}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(s)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 active:scale-[0.98] transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Staff Member' : 'Add Staff Member'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-stone-200 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="staff-form"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
            >
              {editing ? 'Save Changes' : 'Add Staff'}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Full Name *
              </label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Phone *
              </label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Email
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Role
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputClass}>
                {(['Trainer', 'Receptionist', 'Manager', 'Other'] as StaffRole[]).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Status
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value as StaffStatus)} className={inputClass}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) {
            removeStaff(removeTarget.id);
            toast({ title: 'Staff member removed.' });
          }
        }}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${removeTarget?.name} from your active staff directory?`}
        confirmLabel="Remove"
      />
    </div>
  );
}
