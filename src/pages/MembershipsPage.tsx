import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, Edit3, Layers, Plus } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/States';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MembershipPlan } from '../types';
import { formatINR } from '../utils/formatters';

export function MembershipsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activePlans, activeMembersList, createPlan, updatePlan, archivePlan } = useGymData();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MembershipPlan | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openCreate = () => {
    setEditingPlan(null);
    setName('');
    setPrice('');
    setDurationDays('30');
    setDescription('');
    setModalOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(String(plan.price));
    setDurationDays(String(plan.duration_days));
    setDescription(plan.description);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = Number(price);
    const numDays = Number(durationDays);
    if (!name.trim() || !Number.isFinite(numPrice) || numPrice < 0 || !Number.isFinite(numDays) || numDays <= 0) {
      toast({ title: 'Please fill valid plan name, price, and duration.', variant: 'error' });
      return;
    }

    if (editingPlan) {
      updatePlan(editingPlan.id, {
        name: name.trim(),
        price: numPrice,
        duration_days: numDays,
        description: description.trim(),
      });
      toast({ title: 'Membership plan updated.' });
    } else {
      createPlan({
        name: name.trim(),
        price: numPrice,
        duration_days: numDays,
        description: description.trim(),
      });
      toast({ title: 'Membership plan created.' });
    }
    setModalOpen(false);
  };

  const memberCountByPlan = new Map<string, number>();
  for (const m of activeMembersList) {
    if (m.currentPlan?.id) {
      memberCountByPlan.set(m.currentPlan.id, (memberCountByPlan.get(m.currentPlan.id) ?? 0) + 1);
    }
  }

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Membership Plans
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Configure pricing tiers, durations, and active packages.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-sm font-semibold transition-all self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Create Plan</span>
        </button>
      </div>

      {activePlans.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No membership plans yet"
          description="Create your first membership tier so you can enroll members."
          actionLabel="+ Create Plan"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activePlans.map((plan) => {
            const count = memberCountByPlan.get(plan.id) ?? 0;
            return (
              <div
                key={plan.id}
                className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold text-stone-900 dark:text-zinc-100">
                        {plan.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400 tabular-nums">
                        {plan.duration_days} days · {count} enrolled
                      </p>
                    </div>
                    <StatusBadge label="Active" tone="success" />
                  </div>

                  <p className="mt-4 font-display text-3xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
                    {formatINR(plan.price)}
                  </p>

                  <p className="mt-2.5 text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                    {plan.description || 'Standard gym floor & equipment access.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveTarget(plan)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 active:scale-[0.98] transition-all"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="plan-form"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
            >
              {editingPlan ? 'Save Plan' : 'Create Plan'}
            </button>
          </>
        }
      >
        <form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quarterly Transformation"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4000"
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Duration (Days) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="90"
                className={`${inputClass} tabular-nums`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's included in this plan..."
              className={inputClass}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) {
            archivePlan(archiveTarget.id);
            toast({ title: 'Membership plan archived.' });
          }
        }}
        title="Archive Membership Plan"
        message={`Archive "${archiveTarget?.name}"? Existing members on this plan will keep their current records, but new enrollments will be hidden.`}
        confirmLabel="Archive Plan"
      />
    </div>
  );
}
