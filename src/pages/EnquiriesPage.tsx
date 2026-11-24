import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Archive,
  Download,
  Edit3,
  MessageCircle,
  Plus,
  Search,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge, StatusTone } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/States';
import { AddMemberModal } from '../components/modals/AddMemberModal';
import { Enquiry, EnquirySource, EnquiryStatus } from '../types';
import { buildWhatsAppUrl, exportToCSV, formatDateIN, getTodayISO } from '../utils/formatters';

function enquiryTone(status: EnquiryStatus): StatusTone {
  if (status === 'New') return 'info';
  if (status === 'Contacted' || status === 'Interested') return 'warning';
  if (status === 'Converted') return 'success';
  return 'danger';
}

export function EnquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { store, nonArchivedEnquiries, activePlans, addEnquiry, updateEnquiry, archiveEnquiry } =
    useGymData();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Enquiry | null>(null);
  const [convertTarget, setConvertTarget] = useState<Enquiry | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Enquiry | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interestedPlan, setInterestedPlan] = useState('Quarterly');
  const [source, setSource] = useState<EnquirySource>('Walk-in');
  const [status, setStatus] = useState<EnquiryStatus>('New');
  const [followUpDate, setFollowUpDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setInterestedPlan(activePlans[0]?.name || 'Quarterly');
    setSource('Walk-in');
    setStatus('New');
    setFollowUpDate(getTodayISO());
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (e: Enquiry) => {
    setEditing(e);
    setName(e.name);
    setPhone(e.phone);
    setEmail(e.email || '');
    setInterestedPlan(e.interested_plan);
    setSource(e.source);
    setStatus(e.status);
    setFollowUpDate(e.follow_up_date || getTodayISO());
    setNotes(e.notes || '');
    setModalOpen(true);
  };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Name and phone are required.', variant: 'error' });
      return;
    }

    if (editing) {
      updateEnquiry(editing.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        interested_plan: interestedPlan,
        source,
        status,
        follow_up_date: followUpDate || undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: 'Enquiry updated.' });
    } else {
      addEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        interested_plan: interestedPlan,
        source,
        status,
        follow_up_date: followUpDate || undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: 'Enquiry added.' });
    }
    setModalOpen(false);
  };

  const todayISO = getTodayISO();
  const stats = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    return {
      newCount: nonArchivedEnquiries.filter((e) => e.status === 'New').length,
      followUpsToday: nonArchivedEnquiries.filter(
        (e) => e.follow_up_date === todayISO && e.status !== 'Converted' && e.status !== 'Lost',
      ).length,
      convertedThisMonth: nonArchivedEnquiries.filter((e) => {
        if (e.status !== 'Converted') return false;
        const dt = new Date(e.updated_at);
        return dt.getFullYear() === curY && dt.getMonth() + 1 === curM;
      }).length,
    };
  }, [nonArchivedEnquiries, todayISO]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return nonArchivedEnquiries.filter((e) => {
      if (statusFilter !== 'All' && e.status !== statusFilter) return false;
      if (q) {
        return (
          e.name.toLowerCase().includes(q) ||
          e.phone.toLowerCase().includes(q) ||
          e.interested_plan.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [nonArchivedEnquiries, statusFilter, search]);

  const handleExport = () => {
    exportToCSV(
      'fitflow-enquiries.csv',
      ['Name', 'Phone', 'Interested Plan', 'Source', 'Status', 'Follow-up Date', 'Notes'],
      filtered.map((e) => [
        e.name,
        e.phone,
        e.interested_plan,
        e.source,
        e.status,
        e.follow_up_date || '',
        e.notes || '',
      ]),
    );
    toast({ title: 'Enquiries exported to CSV.' });
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Enquiries &amp; Leads
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Track walk-ins, trials, and convert prospects directly into members.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#181A1F] text-xs sm:text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Enquiry</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-zinc-400 truncate">New Leads</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
            {stats.newCount}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-zinc-400 truncate">Follow-ups</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
            {stats.followUpsToday}
          </p>
        </div>
        <div className="rounded-[18px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-3.5 sm:p-5">
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-zinc-400 truncate">Converted</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.convertedThisMonth}
          </p>
        </div>
      </div>

      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead name, phone, or plan..."
              className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-[#F8F7F4] dark:bg-zinc-900 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
            {['All', 'New', 'Contacted', 'Interested', 'Converted', 'Lost'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium active:scale-[0.97] transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No enquiries found"
            description="Log walk-ins or digital leads here to follow up and convert them into members."
            actionLabel="+ Add Enquiry"
            onAction={openCreate}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-zinc-800 text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                    <th className="py-3 pr-3">Name</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Interested Plan</th>
                    <th className="py-3 px-3">Source</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Follow-up</th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                  {filtered.map((enq) => (
                    <tr key={enq.id} className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40">
                      <td className="py-3 pr-3">
                        <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                          {enq.name}
                        </p>
                        {enq.notes && (
                          <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate max-w-[220px]">
                            {enq.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-300 tabular-nums whitespace-nowrap">
                        {enq.phone}
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-stone-800 dark:text-zinc-200">
                        {enq.interested_plan}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-500 dark:text-zinc-400">
                        {enq.source}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge label={enq.status} tone={enquiryTone(enq.status)} />
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                        {formatDateIN(enq.follow_up_date)}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {enq.status !== 'Converted' && (
                            <button
                              type="button"
                              onClick={() => setConvertTarget(enq)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Convert</span>
                            </button>
                          )}
                          <a
                            href={buildWhatsAppUrl(
                              enq.phone,
                              `Hi ${enq.name.split(' ')[0]}, thanks for enquiring at ${store?.gym.name || 'FitFlow Studio'} regarding our ${enq.interested_plan} plan! Would you like to schedule a gym tour?`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp lead"
                            aria-label={`WhatsApp ${enq.name}`}
                            className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openEdit(enq)}
                            title="Edit enquiry"
                            aria-label={`Edit ${enq.name}`}
                            className="p-1.5 rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(enq)}
                            title="Archive enquiry"
                            aria-label={`Archive ${enq.name}`}
                            className="p-1.5 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {filtered.map((enq) => (
                <div
                  key={enq.id}
                  className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 space-y-3 bg-stone-50/50 dark:bg-zinc-900/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                        {enq.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 tabular-nums">
                        {enq.phone} · {enq.interested_plan}
                      </p>
                    </div>
                    <StatusBadge label={enq.status} tone={enquiryTone(enq.status)} />
                  </div>
                  {enq.notes && (
                    <p className="text-xs text-stone-500 dark:text-zinc-400">{enq.notes}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {enq.status !== 'Converted' && (
                      <button
                        type="button"
                        onClick={() => setConvertTarget(enq)}
                        className="flex-1 py-2 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold transition-all"
                      >
                        Convert
                      </button>
                    )}
                    <a
                      href={buildWhatsAppUrl(
                        enq.phone,
                        `Hi ${enq.name.split(' ')[0]}, thanks for enquiring at ${store?.gym.name || 'FitFlow Studio'} regarding our ${enq.interested_plan} plan! Would you like to schedule a gym tour?`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium bg-white dark:bg-zinc-900 text-emerald-600 active:scale-[0.98] transition-all"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => openEdit(enq)}
                      className="px-3 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium bg-white dark:bg-zinc-900 active:scale-[0.98] transition-all"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(enq)}
                      aria-label={`Archive ${enq.name}`}
                      className="p-2 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-400 hover:text-red-600 bg-white dark:bg-zinc-900 active:scale-[0.98] transition-all"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Enquiry Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Enquiry' : 'Add Enquiry'}
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
              form="enquiry-form"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
            >
              {editing ? 'Save Changes' : 'Save Enquiry'}
            </button>
          </>
        }
      >
        <form id="enquiry-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Interested Plan
              </label>
              <select
                value={interestedPlan}
                onChange={(e) => setInterestedPlan(e.target.value)}
                className={inputClass}
              >
                {activePlans.map((pl) => (
                  <option key={pl.id} value={pl.name}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as EnquirySource)}
                className={inputClass}
              >
                {(['Walk-in', 'Instagram', 'Google', 'Referral', 'WhatsApp', 'Website'] as EnquirySource[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EnquiryStatus)}
                className={inputClass}
              >
                {(['New', 'Contacted', 'Interested', 'Converted', 'Lost'] as EnquiryStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Convert to Member prefilled AddMemberModal */}
      <AddMemberModal
        open={Boolean(convertTarget)}
        onClose={() => setConvertTarget(null)}
        initialEnquiry={convertTarget}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) {
            archiveEnquiry(archiveTarget.id);
            toast({ title: 'Enquiry archived.' });
          }
        }}
        title="Archive Enquiry"
        message={`Archive enquiry for ${archiveTarget?.name}?`}
        confirmLabel="Archive"
      />
    </div>
  );
}
