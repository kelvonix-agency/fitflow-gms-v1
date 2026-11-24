import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowUpDown,
  Download,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import {
  StatusBadge,
  statusLabelFromMembership,
  statusToneFromMembership,
} from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ExportDownloadOverlay } from '../components/ui/ExportDownloadOverlay';
import { EmptyState, DashboardSkeleton, ErrorState } from '../components/ui/States';
import { AddMemberModal } from '../components/modals/AddMemberModal';
import { RenewMembershipModal } from '../components/modals/RenewMembershipModal';
import { EnrichedMember } from '../types';
import { exportToCSV, formatDateIN, formatINR } from '../utils/formatters';

type FilterType = 'all' | 'active' | 'expiring' | 'frozen' | 'expired' | 'payment_due';
type SortField = 'name' | 'joining_date' | 'expiryDate' | 'payment';

export function MembersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeMembersList, metrics, isLoading, error, reload, archiveMember } = useGymData();
  const { toast } = useToast();

  const initialFilter = (searchParams.get('filter') as FilterType) || 'all';
  const [filter, setFilter] = useState<FilterType>(
    ['all', 'active', 'expiring', 'frozen', 'expired', 'payment_due'].includes(initialFilter)
      ? initialFilter
      : 'all',
  );
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('expiryDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EnrichedMember | null>(null);
  const [renewTarget, setRenewTarget] = useState<EnrichedMember | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<EnrichedMember | null>(null);
  const [exportOverlayOpen, setExportOverlayOpen] = useState(false);

  useEffect(() => {
    const param = searchParams.get('filter') as FilterType | null;
    if (param && ['all', 'active', 'expiring', 'frozen', 'expired', 'payment_due'].includes(param)) {
      setFilter(param);
      setPage(1);
    }
  }, [searchParams]);

  const handleFilterChange = (next: FilterType) => {
    setFilter(next);
    setPage(1);
    if (next === 'all') {
      searchParams.delete('filter');
    } else {
      searchParams.set('filter', next);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeMembersList
      .filter((m) => {
        if (filter === 'active' && m.derivedStatus !== 'active') return false;
        if (filter === 'expiring' && m.derivedStatus !== 'expiring') return false;
        if (filter === 'frozen' && m.derivedStatus !== 'frozen') return false;
        if (filter === 'expired' && m.derivedStatus !== 'expired') return false;
        if (filter === 'payment_due' && m.paymentStatus !== 'Due') return false;
        if (q) {
          return (
            m.name.toLowerCase().includes(q) ||
            m.phone.toLowerCase().includes(q) ||
            m.member_code.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'joining_date') cmp = a.joining_date.localeCompare(b.joining_date);
        else if (sortField === 'expiryDate') {
          cmp = (a.expiryDate || '').localeCompare(b.expiryDate || '');
        } else if (sortField === 'payment') {
          cmp = a.pendingAmount - b.pendingAmount;
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [activeMembersList, filter, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((a) => !a);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExport = () => {
    exportToCSV(
      'fitflow-members.csv',
      ['Member ID', 'Name', 'Phone', 'Email', 'Plan', 'Status', 'Join Date', 'Expiry Date', 'Payment'],
      filtered.map((m) => [
        m.member_code,
        m.name,
        m.phone,
        m.email || '',
        m.currentPlan?.name || '',
        statusLabelFromMembership(m.derivedStatus),
        m.joining_date,
        m.expiryDate || '',
        m.paymentStatus === 'Due' ? `Due ${m.pendingAmount}` : 'Paid',
      ]),
    );
    setExportOverlayOpen(true);
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Members
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            Manage all gym members in one place.
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
            onClick={() => {
              setEditTarget(null);
              setAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { label: 'Total', value: metrics.totalMembers, key: 'all' as FilterType },
          { label: 'Active', value: metrics.activeCount, key: 'active' as FilterType },
          { label: 'Expiring', value: metrics.expiringCount, key: 'expiring' as FilterType },
          { label: 'Expired', value: metrics.expiredCount, key: 'expired' as FilterType },
        ].map((st) => (
          <button
            key={st.label}
            type="button"
            onClick={() => handleFilterChange(st.key)}
            className={`text-left rounded-[18px] p-4 border transition-colors ${
              filter === st.key
                ? 'bg-orange-50/70 dark:bg-orange-950/25 border-orange-300 dark:border-orange-800'
                : 'bg-white dark:bg-[#181A1F] border-stone-200/80 dark:border-zinc-800 hover:border-stone-300'
            }`}
          >
            <p className="text-xs text-stone-500 dark:text-zinc-400">{st.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 dark:text-zinc-100 tabular-nums">
              {st.value}
            </p>
          </button>
        ))}
      </div>

      {/* Toolbar: Search + Filters + Sort */}
      <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, or member ID..."
              className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-[#F8F7F4] dark:bg-zinc-900 pl-10 pr-4 py-2 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'expiring', label: 'Expiring Soon' },
                { id: 'frozen', label: `Frozen (${metrics.frozenCount})` },
                { id: 'expired', label: 'Expired' },
                { id: 'payment_due', label: 'Payment Due' },
              ] as Array<{ id: FilterType; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium active:scale-[0.97] transition-all whitespace-nowrap shrink-0 ${
                  filter === tab.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200/70 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {paginated.length === 0 ? (
          <EmptyState
            icon={Users}
            title={activeMembersList.length === 0 ? 'No members yet.' : 'No matching members found.'}
            description={
              activeMembersList.length === 0
                ? 'Add your first member and start managing your gym.'
                : 'Try adjusting your search query or status filter.'
            }
            actionLabel={activeMembersList.length === 0 ? '+ Add Member' : 'Reset Filters'}
            onAction={() => {
              if (activeMembersList.length === 0) setAddModalOpen(true);
              else {
                setSearch('');
                handleFilterChange('all');
              }
            }}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-zinc-800 text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
                    <th className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-zinc-100"
                      >
                        <span>Member</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('joining_date')}
                        className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-zinc-100"
                      >
                        <span>Join Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('expiryDate')}
                        className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-zinc-100"
                      >
                        <span>Expiry Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('payment')}
                        className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-zinc-100"
                      >
                        <span>Payment</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                  {paginated.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/members/${m.id}`)}
                          className="flex items-center gap-3 text-left group"
                        >
                          <Avatar name={m.name} src={m.avatar_url} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
                              {m.name}
                            </p>
                            <p className="text-[11px] font-mono-num text-stone-400 dark:text-zinc-500">
                              {m.member_code}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-600 dark:text-zinc-300 tabular-nums whitespace-nowrap">
                        {m.phone}
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-stone-800 dark:text-zinc-200 whitespace-nowrap">
                        {m.currentPlan?.name || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          label={statusLabelFromMembership(m.derivedStatus)}
                          tone={statusToneFromMembership(m.derivedStatus)}
                        />
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                        {formatDateIN(m.joining_date)}
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-700 dark:text-zinc-300 tabular-nums whitespace-nowrap">
                        {formatDateIN(m.expiryDate)}
                      </td>
                      <td className="py-3 px-3">
                        {m.paymentStatus === 'Due' ? (
                          <StatusBadge
                            label={`Due ${formatINR(m.pendingAmount)}`}
                            tone="warning"
                          />
                        ) : (
                          <StatusBadge label="Paid" tone="success" />
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${m.id}`)}
                            title="View profile"
                            aria-label={`View ${m.name}`}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenewTarget(m)}
                            title="Renew membership"
                            aria-label={`Renew ${m.name}`}
                            className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(m);
                              setAddModalOpen(true);
                            }}
                            title="Edit member"
                            aria-label={`Edit ${m.name}`}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(m)}
                            title="Archive member"
                            aria-label={`Archive ${m.name}`}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
            <div className="md:hidden space-y-3">
              {paginated.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 space-y-3 bg-[#F8F7F4]/60 dark:bg-zinc-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="flex items-center gap-3 text-left min-w-0"
                    >
                      <Avatar name={m.name} src={m.avatar_url} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate">
                          {m.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-zinc-400 tabular-nums">
                          {m.member_code} · {m.phone}
                        </p>
                      </div>
                    </button>
                    <StatusBadge
                      label={statusLabelFromMembership(m.derivedStatus)}
                      tone={statusToneFromMembership(m.derivedStatus)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-200/70 dark:border-zinc-800">
                    <div>
                      <span className="text-stone-400 dark:text-zinc-500">Plan: </span>
                      <span className="font-medium text-stone-800 dark:text-zinc-200">
                        {m.currentPlan?.name || '—'}
                      </span>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="text-stone-400 dark:text-zinc-500">Expiry: </span>
                      <span className="font-medium text-stone-800 dark:text-zinc-200">
                        {formatDateIN(m.expiryDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="flex-1 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewTarget(m)}
                      className="flex-1 py-2 rounded-full bg-orange-600 text-white text-xs font-semibold active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      Renew
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTarget(m);
                        setAddModalOpen(true);
                      }}
                      aria-label={`Edit ${m.name}`}
                      className="p-2 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:text-stone-900 bg-white dark:bg-zinc-900 active:scale-[0.97] transition-all"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(m)}
                      aria-label={`Archive ${m.name}`}
                      className="p-2 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-500 hover:text-red-600 bg-white dark:bg-zinc-900 active:scale-[0.97] transition-all"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-zinc-800 text-xs text-stone-500 dark:text-zinc-400">
              <span className="tabular-nums">
                Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of{' '}
                {filtered.length} members
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-zinc-800 whitespace-nowrap"
                >
                  Previous
                </button>
                <span className="tabular-nums font-medium text-stone-700 dark:text-zinc-200">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-zinc-800 whitespace-nowrap"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AddMemberModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditTarget(null);
        }}
        editMember={editTarget}
      />

      <RenewMembershipModal
        open={Boolean(renewTarget)}
        onClose={() => setRenewTarget(null)}
        member={renewTarget}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) {
            archiveMember(archiveTarget.id);
            toast({ title: 'Member archived.', description: `${archiveTarget.name} moved to archive.` });
          }
        }}
        title="Archive Member"
        message={`Are you sure you want to archive ${archiveTarget?.name || 'this member'}? They will be hidden from the active member list while preserving payment history.`}
        confirmLabel="Archive Member"
      />

      <ExportDownloadOverlay
        open={exportOverlayOpen}
        filename="fitflow-members.csv"
        label="Downloading Members"
        onComplete={() => setExportOverlayOpen(false)}
      />
    </div>
  );
}
