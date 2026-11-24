import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityItem,
  AttendanceRecord,
  AttendanceStatus,
  Enquiry,
  EnrichedMember,
  Expense,
  ExpenseCategory,
  GymProfile,
  GymStoreState,
  Member,
  Membership,
  MembershipFreeze,
  MembershipPlan,
  NotificationItem,
  NotificationPreferences,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  StaffMember,
  UserProfile,
} from '../types';
import {
  generateId,
  getActiveGymId,
  loadGymStore,
  resetLocalDemoStore,
  saveLocalDemoStore,
} from '../services/gymService';
import {
  addDaysISO,
  daysBetween,
  deriveMembershipStatus,
  formatINR,
  getTodayISO,
} from '../utils/formatters';

export interface AddMemberInput {
  name: string;
  avatar_url?: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergency_contact?: string;
  joining_date: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string;
  notes?: string;
  converted_from_enquiry_id?: string;
}

export interface RenewMembershipInput {
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
}

export interface RecordPaymentInput {
  member_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  status: PaymentStatus;
  payment_date: string;
  transaction_id?: string;
  membership_id?: string;
}

export interface AddExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: PaymentMethod;
  expense_date: string;
  vendor_name?: string;
  notes?: string;
}

export interface FreezeMembershipInput {
  member_id: string;
  membership_id: string;
  start_date: string;
  planned_end_date: string;
  reason: string;
}

interface GymDataContextValue {
  store: GymStoreState | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  resetDemoData: () => void;

  // Computed lists & metrics
  activeMembersList: EnrichedMember[];
  allPlans: MembershipPlan[];
  activePlans: MembershipPlan[];
  nonArchivedEnquiries: Enquiry[];
  activeStaff: StaffMember[];
  unreadNotificationsCount: number;
  birthdaysToday: EnrichedMember[];
  upcomingBirthdays7Days: EnrichedMember[];
  birthdaysThisMonth: EnrichedMember[];

  metrics: {
    totalMembers: number;
    activeCount: number;
    expiringCount: number;
    expiredCount: number;
    frozenCount: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowthPct: number;
    totalRevenue: number;
    thisWeekRevenue: number;
    todayRevenue: number;
    thisMonthExpenses: number;
    lastMonthExpenses: number;
    totalExpenses: number;
    thisMonthNetProfit: number;
    totalNetProfit: number;
    profitMarginPct: number;
    newMembersThisMonth: number;
    pendingPaymentsCount: number;
    pendingPaymentsTotal: number;
    renewalsThisWeekCount: number;
    presentToday: number;
    absentToday: number;
  };

  // Actions
  addMember: (input: AddMemberInput) => EnrichedMember | null;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  archiveMember: (memberId: string) => void;
  renewMembership: (input: RenewMembershipInput) => void;
  freezeMembership: (input: FreezeMembershipInput) => void;
  resumeMembership: (freezeId: string) => void;
  recordPayment: (input: RecordPaymentInput) => void;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => void;
  addExpense: (input: AddExpenseInput) => void;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  createPlan: (input: Omit<MembershipPlan, 'id' | 'gym_id' | 'created_at' | 'updated_at' | 'status'>) => void;
  updatePlan: (planId: string, updates: Partial<MembershipPlan>) => void;
  archivePlan: (planId: string) => void;
  markAttendance: (memberId: string, date: string, status: AttendanceStatus, checkInTime?: string) => void;
  bulkMarkAttendance: (memberIds: string[], date: string, status: AttendanceStatus) => void;
  addEnquiry: (input: Omit<Enquiry, 'id' | 'gym_id' | 'created_at' | 'updated_at'>) => void;
  updateEnquiry: (enquiryId: string, updates: Partial<Enquiry>) => void;
  archiveEnquiry: (enquiryId: string) => void;
  logBirthdayWish: (memberId: string, message: string) => void;
  logFestivalWish: (festival: string, template: string, audience: string) => void;
  sendOwnerNotice: (input: { title: string; message: string; audience: string; recipientCount: number }) => void;
  addStaff: (input: Omit<StaffMember, 'id' | 'gym_id' | 'created_at'>) => void;
  updateStaff: (staffId: string, updates: Partial<StaffMember>) => void;
  removeStaff: (staffId: string) => void;
  updateGymProfile: (updates: Partial<GymProfile>) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updateNotificationPrefs: (prefs: NotificationPreferences) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const GymDataContext = createContext<GymDataContextValue | undefined>(undefined);

export function GymDataProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<GymStoreState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await loadGymStore();
      setStore(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load gym workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const commitStore = useCallback((updater: (prev: GymStoreState) => GymStoreState) => {
    setStore((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveLocalDemoStore(next);
      return next;
    });
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = resetLocalDemoStore();
    setStore(fresh);
  }, []);

  const activeMembersList = useMemo<EnrichedMember[]>(() => {
    if (!store) return [];
    const todayISO = getTodayISO();
    const plansById = new Map(store.plans.map((p) => [p.id, p]));

    // Group memberships per member, pick latest by end_date then created_at
    const membershipsByMember = new Map<string, Membership[]>();
    for (const ms of store.memberships) {
      const arr = membershipsByMember.get(ms.member_id) ?? [];
      arr.push(ms);
      membershipsByMember.set(ms.member_id, arr);
    }

    const paymentsByMember = new Map<string, Payment[]>();
    for (const p of store.payments) {
      const arr = paymentsByMember.get(p.member_id) ?? [];
      arr.push(p);
      paymentsByMember.set(p.member_id, arr);
    }

    const attendanceCountByMember = new Map<string, number>();
    for (const a of store.attendance) {
      if (a.status === 'present') {
        attendanceCountByMember.set(a.member_id, (attendanceCountByMember.get(a.member_id) ?? 0) + 1);
      }
    }

    const activeFreezeByMembership = new Map<string, MembershipFreeze>();
    for (const f of store.freezes ?? []) {
      if (f.status === 'active') {
        activeFreezeByMembership.set(f.membership_id, f);
      }
    }

    return store.members
      .filter((m) => m.status !== 'archived')
      .map((member) => {
        const list = (membershipsByMember.get(member.id) ?? []).slice().sort((a, b) => {
          if (a.end_date !== b.end_date) return b.end_date.localeCompare(a.end_date);
          return b.created_at.localeCompare(a.created_at);
        });
        const currentMembership = list[0];
        const currentPlan = currentMembership ? plansById.get(currentMembership.plan_id) : undefined;
        const activeFreeze = currentMembership ? activeFreezeByMembership.get(currentMembership.id) : undefined;
        const derivedStatus = activeFreeze
          ? ('frozen' as const)
          : deriveMembershipStatus(currentMembership?.end_date, todayISO);
        const daysRemaining = currentMembership ? daysBetween(todayISO, currentMembership.end_date) : -999;

        const memPayments = paymentsByMember.get(member.id) ?? [];
        const pendingAmount = memPayments
          .filter((p) => p.status === 'Pending')
          .reduce((sum, p) => sum + p.amount, 0);
        const totalPaid = memPayments
          .filter((p) => p.status === 'Paid')
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          ...member,
          currentMembership,
          currentPlan,
          activeFreeze,
          derivedStatus,
          daysRemaining,
          expiryDate: currentMembership?.end_date,
          paymentStatus: pendingAmount > 0 ? 'Due' : 'Paid',
          pendingAmount,
          totalPaid,
          attendanceCount: attendanceCountByMember.get(member.id) ?? 0,
        };
      });
  }, [store]);

  const allPlans = useMemo(() => store?.plans ?? [], [store]);
  const activePlans = useMemo(() => (store?.plans ?? []).filter((p) => p.status === 'active'), [store]);
  const nonArchivedEnquiries = useMemo(
    () => (store?.enquiries ?? []).filter((e) => e.status !== 'Archived'),
    [store],
  );
  const activeStaff = useMemo(() => (store?.staff ?? []).filter((s) => s.status !== 'Archived'), [store]);
  const unreadNotificationsCount = useMemo(
    () => (store?.notifications ?? []).filter((n) => !n.id.startsWith('notif-') && !n.is_read).length,
    [store],
  );

  const { birthdaysToday, upcomingBirthdays7Days, birthdaysThisMonth } = useMemo(() => {
    const now = new Date();
    const todayM = now.getMonth() + 1;
    const todayD = now.getDate();

    const todayList: EnrichedMember[] = [];
    const upcomingList: EnrichedMember[] = [];
    const monthList: EnrichedMember[] = [];

    for (const m of activeMembersList) {
      if (!m.date_of_birth) continue;
      const parts = m.date_of_birth.split('-').map(Number);
      const bm = parts[1];
      const bd = parts[2];
      if (!bm || !bd) continue;

      if (bm === todayM) {
        monthList.push(m);
      }

      if (bm === todayM && bd === todayD) {
        todayList.push(m);
        continue;
      }

      // Check next 7 days (handling month/year rollover)
      const nextBday = new Date(now.getFullYear(), bm - 1, bd);
      if (nextBday < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        nextBday.setFullYear(now.getFullYear() + 1);
      }
      const diffDays = Math.round(
        (nextBday.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000,
      );
      if (diffDays >= 1 && diffDays <= 7) {
        upcomingList.push(m);
      }
    }

    return {
      birthdaysToday: todayList,
      upcomingBirthdays7Days: upcomingList,
      birthdaysThisMonth: monthList,
    };
  }, [activeMembersList]);

  const metrics = useMemo(() => {
    if (!store) {
      return {
        totalMembers: 0,
        activeCount: 0,
        expiringCount: 0,
        expiredCount: 0,
        frozenCount: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        revenueGrowthPct: 0,
        totalRevenue: 0,
        thisWeekRevenue: 0,
        todayRevenue: 0,
        thisMonthExpenses: 0,
        lastMonthExpenses: 0,
        totalExpenses: 0,
        thisMonthNetProfit: 0,
        totalNetProfit: 0,
        profitMarginPct: 0,
        newMembersThisMonth: 0,
        pendingPaymentsCount: 0,
        pendingPaymentsTotal: 0,
        renewalsThisWeekCount: 0,
        presentToday: 0,
        absentToday: 0,
      };
    }

    const todayISO = getTodayISO();
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const prevMonthDate = new Date(curYear, curMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();
    const weekStartISO = addDaysISO(todayISO, -6);

    const activeCount = activeMembersList.filter((m) => m.derivedStatus === 'active').length;
    const expiringCount = activeMembersList.filter((m) => m.derivedStatus === 'expiring').length;
    const expiredCount = activeMembersList.filter((m) => m.derivedStatus === 'expired').length;
    const frozenCount = activeMembersList.filter((m) => m.derivedStatus === 'frozen').length;
    const renewalsThisWeekCount = activeMembersList.filter(
      (m) => m.derivedStatus !== 'frozen' && m.daysRemaining >= 0 && m.daysRemaining <= 7,
    ).length;

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let totalRevenue = 0;
    let thisWeekRevenue = 0;
    let todayRevenue = 0;
    let pendingPaymentsCount = 0;
    let pendingPaymentsTotal = 0;

    for (const p of store.payments) {
      if (p.status === 'Paid') {
        totalRevenue += p.amount;
        const [py, pm] = p.payment_date.split('-').map(Number);
        if (py === curYear && pm === curMonth + 1) {
          thisMonthRevenue += p.amount;
        } else if (py === prevYear && pm === prevMonth + 1) {
          lastMonthRevenue += p.amount;
        }
        if (p.payment_date >= weekStartISO && p.payment_date <= todayISO) {
          thisWeekRevenue += p.amount;
        }
        if (p.payment_date === todayISO) {
          todayRevenue += p.amount;
        }
      } else if (p.status === 'Pending') {
        pendingPaymentsCount++;
        pendingPaymentsTotal += p.amount;
      }
    }

    let thisMonthExpenses = 0;
    let lastMonthExpenses = 0;
    let totalExpenses = 0;
    for (const exp of store.expenses ?? []) {
      totalExpenses += exp.amount;
      const [ey, em] = exp.expense_date.split('-').map(Number);
      if (ey === curYear && em === curMonth + 1) {
        thisMonthExpenses += exp.amount;
      } else if (ey === prevYear && em === prevMonth + 1) {
        lastMonthExpenses += exp.amount;
      }
    }

    const thisMonthNetProfit = thisMonthRevenue - thisMonthExpenses;
    const totalNetProfit = totalRevenue - totalExpenses;
    const profitMarginPct =
      thisMonthRevenue > 0 ? Math.round((thisMonthNetProfit / thisMonthRevenue) * 1000) / 10 : 0;

    const revenueGrowthPct =
      lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
        : thisMonthRevenue > 0
          ? 100
          : 0;

    const newMembersThisMonth = activeMembersList.filter((m) => {
      const [jy, jm] = m.joining_date.split('-').map(Number);
      return jy === curYear && jm === curMonth + 1;
    }).length;

    const todaysAtt = store.attendance.filter((a) => a.attendance_date === todayISO);
    const presentToday = todaysAtt.filter((a) => a.status === 'present').length;
    const absentToday = todaysAtt.filter((a) => a.status === 'absent').length;

    return {
      totalMembers: activeMembersList.length,
      activeCount,
      expiringCount,
      expiredCount,
      frozenCount,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowthPct,
      totalRevenue,
      thisWeekRevenue,
      todayRevenue,
      thisMonthExpenses,
      lastMonthExpenses,
      totalExpenses,
      thisMonthNetProfit,
      totalNetProfit,
      profitMarginPct,
      newMembersThisMonth,
      pendingPaymentsCount,
      pendingPaymentsTotal,
      renewalsThisWeekCount,
      presentToday,
      absentToday,
    };
  }, [store, activeMembersList]);

  // Transactional actions
  const addMember = useCallback(
    (input: AddMemberInput): EnrichedMember | null => {
      if (!store) return null;
      const nowISO = new Date().toISOString();
      const gymId = getActiveGymId(store);
      const nextNum =
        store.members.reduce((max, m) => {
          const parsed = parseInt(m.member_code.replace(/\D/g, ''), 10);
          return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
        }, 1000) + 1;

      const memberId = generateId('mem');
      const memberCode = `FF-${nextNum}`;
      const newMember: Member = {
        id: memberId,
        gym_id: gymId,
        member_code: memberCode,
        name: input.name.trim(),
        avatar_url: input.avatar_url,
        phone: input.phone.trim(),
        email: input.email?.trim() || undefined,
        date_of_birth: input.date_of_birth || undefined,
        gender: input.gender || 'Male',
        address: input.address?.trim() || undefined,
        emergency_contact: input.emergency_contact?.trim() || undefined,
        joining_date: input.joining_date,
        status: 'active',
        notes: input.notes?.trim() || undefined,
        created_at: nowISO,
        updated_at: nowISO,
      };

      const derived = deriveMembershipStatus(input.end_date);
      const membershipId = generateId('mship');
      const newMembership: Membership = {
        id: membershipId,
        gym_id: gymId,
        member_id: memberId,
        plan_id: input.plan_id,
        start_date: input.start_date,
        end_date: input.end_date,
        status: derived,
        amount: input.amount,
        created_at: nowISO,
      };

      const newPayment: Payment = {
        id: generateId('pay'),
        gym_id: gymId,
        member_id: memberId,
        membership_id: membershipId,
        transaction_id: input.transaction_id?.trim() || `TXN-${Date.now().toString().slice(-7)}`,
        amount: input.amount,
        payment_method: input.payment_method,
        payment_type: 'New Membership',
        status: input.payment_status,
        payment_date: input.start_date,
        created_at: nowISO,
      };

      const plan = store.plans.find((p) => p.id === input.plan_id);
      const newActivity: ActivityItem = {
        id: generateId('act'),
        gym_id: gymId,
        type: 'member_joined',
        description: `${newMember.name} joined on ${plan?.name ?? 'membership'} plan`,
        related_member_id: memberId,
        created_at: nowISO,
      };

      commitStore((prev) => ({
        ...prev,
        members: [newMember, ...prev.members],
        memberships: [newMembership, ...prev.memberships],
        payments: [newPayment, ...prev.payments],
        activities: [newActivity, ...prev.activities],
        enquiries: input.converted_from_enquiry_id
          ? prev.enquiries.map((e) =>
              e.id === input.converted_from_enquiry_id
                ? { ...e, status: 'Converted', updated_at: nowISO }
                : e,
            )
          : prev.enquiries,
      }));

      return {
        ...newMember,
        currentMembership: newMembership,
        currentPlan: plan,
        derivedStatus: derived,
        daysRemaining: daysBetween(getTodayISO(), input.end_date),
        expiryDate: input.end_date,
        paymentStatus: input.payment_status === 'Pending' ? 'Due' : 'Paid',
        pendingAmount: input.payment_status === 'Pending' ? input.amount : 0,
        totalPaid: input.payment_status === 'Paid' ? input.amount : 0,
        attendanceCount: 0,
      };
    },
    [store, commitStore],
  );

  const updateMember = useCallback(
    (memberId: string, updates: Partial<Member>) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const target = prev.members.find((m) => m.id === memberId);
        const gymId = getActiveGymId(prev);
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'profile_updated',
          description: `${updates.name || target?.name || 'Member'} profile updated`,
          related_member_id: memberId,
          created_at: nowISO,
        };
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.id === memberId ? { ...m, ...updates, updated_at: nowISO } : m,
          ),
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const archiveMember = useCallback(
    (memberId: string) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const target = prev.members.find((m) => m.id === memberId);
        const gymId = getActiveGymId(prev);
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'profile_updated',
          description: `${target?.name || 'Member'} archived`,
          related_member_id: memberId,
          created_at: nowISO,
        };
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.id === memberId ? { ...m, status: 'archived', updated_at: nowISO } : m,
          ),
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const renewMembership = useCallback(
    (input: RenewMembershipInput) => {
      const nowISO = new Date().toISOString();
      const todayISO = getTodayISO();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const member = prev.members.find((m) => m.id === input.member_id);
        const plan = prev.plans.find((p) => p.id === input.plan_id);
        const newMembershipId = generateId('mship');

        // Mark older active/expiring memberships for this member as renewed
        const updatedMemberships = prev.memberships.map((ms) =>
          ms.member_id === input.member_id && ms.status !== 'renewed'
            ? { ...ms, status: 'renewed' as const }
            : ms,
        );

        const newMembership: Membership = {
          id: newMembershipId,
          gym_id: gymId,
          member_id: input.member_id,
          plan_id: input.plan_id,
          start_date: input.start_date,
          end_date: input.end_date,
          status: deriveMembershipStatus(input.end_date, todayISO),
          amount: input.amount,
          created_at: nowISO,
        };

        const newPayment: Payment = {
          id: generateId('pay'),
          gym_id: gymId,
          member_id: input.member_id,
          membership_id: newMembershipId,
          transaction_id: `TXN-${Date.now().toString().slice(-7)}`,
          amount: input.amount,
          payment_method: input.payment_method,
          payment_type: 'Renewal',
          status: input.payment_status,
          payment_date: todayISO,
          created_at: nowISO,
        };

        const actRenewal: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'membership_renewed',
          description: `${member?.name || 'Member'} renewed ${plan?.name || 'membership'} (${formatINR(input.amount)})`,
          related_member_id: input.member_id,
          created_at: nowISO,
        };

        const notifRenewal: NotificationItem = {
          id: generateId('notif'),
          gym_id: gymId,
          type: 'renewal',
          title: 'Membership renewed',
          message: `${member?.name || 'Member'} renewed ${plan?.name || ''} plan through ${input.end_date}.`,
          link: `/members/${input.member_id}`,
          is_read: false,
          created_at: nowISO,
        };

        return {
          ...prev,
          memberships: [newMembership, ...updatedMemberships],
          payments: [newPayment, ...prev.payments],
          activities: [actRenewal, ...prev.activities],
          notifications: [notifRenewal, ...prev.notifications],
        };
      });
    },
    [commitStore],
  );

  const recordPayment = useCallback(
    (input: RecordPaymentInput) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const member = prev.members.find((m) => m.id === input.member_id);
        const newPayment: Payment = {
          id: generateId('pay'),
          gym_id: gymId,
          member_id: input.member_id,
          membership_id: input.membership_id,
          transaction_id: input.transaction_id?.trim() || `TXN-${Date.now().toString().slice(-7)}`,
          amount: input.amount,
          payment_method: input.payment_method,
          payment_type: input.payment_type,
          status: input.status,
          payment_date: input.payment_date,
          created_at: nowISO,
        };

        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'payment_received',
          description: `${formatINR(input.amount)} ${input.payment_method} payment (${input.status}) for ${member?.name || 'Member'}`,
          related_member_id: input.member_id,
          created_at: nowISO,
        };

        return {
          ...prev,
          payments: [newPayment, ...prev.payments],
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const freezeMembership = useCallback(
    (input: FreezeMembershipInput) => {
      const nowISO = new Date().toISOString();
      const plannedDays = Math.max(1, daysBetween(input.start_date, input.planned_end_date));
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const member = prev.members.find((m) => m.id === input.member_id);
        const newFreeze: MembershipFreeze = {
          id: generateId('frz'),
          gym_id: gymId,
          member_id: input.member_id,
          membership_id: input.membership_id,
          start_date: input.start_date,
          planned_end_date: input.planned_end_date,
          days_frozen: plannedDays,
          reason: input.reason.trim() || 'Personal Request',
          status: 'active',
          created_at: nowISO,
        };
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'membership_frozen',
          description: `${member?.name || 'Member'} membership paused for ${plannedDays} days (${newFreeze.reason})`,
          related_member_id: input.member_id,
          created_at: nowISO,
        };
        return {
          ...prev,
          freezes: [newFreeze, ...(prev.freezes ?? [])],
          memberships: prev.memberships.map((ms) =>
            ms.id === input.membership_id ? { ...ms, status: 'frozen' } : ms,
          ),
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const resumeMembership = useCallback(
    (freezeId: string) => {
      const nowISO = new Date().toISOString();
      const todayISO = getTodayISO();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const targetFreeze = (prev.freezes ?? []).find((f) => f.id === freezeId);
        if (!targetFreeze || targetFreeze.status === 'completed') return prev;

        const member = prev.members.find((m) => m.id === targetFreeze.member_id);
        const elapsedDays = Math.max(0, daysBetween(targetFreeze.start_date, todayISO));
        const extendDays = elapsedDays > 0 ? elapsedDays : targetFreeze.days_frozen;

        const updatedMemberships = prev.memberships.map((ms) => {
          if (ms.id !== targetFreeze.membership_id) return ms;
          const nextEnd = addDaysISO(ms.end_date, extendDays);
          return {
            ...ms,
            end_date: nextEnd,
            status: deriveMembershipStatus(nextEnd, todayISO),
          };
        });

        const updatedFreezes = (prev.freezes ?? []).map((f) =>
          f.id === freezeId
            ? {
                ...f,
                status: 'completed' as const,
                resumed_at: todayISO,
                days_frozen: extendDays,
              }
            : f,
        );

        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'membership_resumed',
          description: `${member?.name || 'Member'} plan resumed (+${extendDays} days extended)`,
          related_member_id: targetFreeze.member_id,
          created_at: nowISO,
        };

        return {
          ...prev,
          freezes: updatedFreezes,
          memberships: updatedMemberships,
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const addExpense = useCallback(
    (input: AddExpenseInput) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const expense: Expense = {
          ...input,
          id: generateId('exp'),
          gym_id: gymId,
          title: input.title.trim(),
          vendor_name: input.vendor_name?.trim() || undefined,
          notes: input.notes?.trim() || undefined,
          created_at: nowISO,
        };
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'expense_logged',
          description: `Logged ${formatINR(expense.amount)} expense: ${expense.title} (${expense.category})`,
          created_at: nowISO,
        };
        return {
          ...prev,
          expenses: [expense, ...(prev.expenses ?? [])],
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const updateExpense = useCallback(
    (expenseId: string, updates: Partial<Expense>) => {
      commitStore((prev) => ({
        ...prev,
        expenses: (prev.expenses ?? []).map((exp) =>
          exp.id === expenseId ? { ...exp, ...updates } : exp,
        ),
      }));
    },
    [commitStore],
  );

  const deleteExpense = useCallback(
    (expenseId: string) => {
      commitStore((prev) => ({
        ...prev,
        expenses: (prev.expenses ?? []).filter((exp) => exp.id !== expenseId),
      }));
    },
    [commitStore],
  );

  const updatePaymentStatus = useCallback(
    (paymentId: string, status: PaymentStatus) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const target = prev.payments.find((p) => p.id === paymentId);
        const member = prev.members.find((m) => m.id === target?.member_id);
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'payment_received',
          description: `Payment ${target?.transaction_id || ''} marked ${status} (${member?.name || 'Member'})`,
          related_member_id: target?.member_id,
          created_at: nowISO,
        };
        return {
          ...prev,
          payments: prev.payments.map((p) => (p.id === paymentId ? { ...p, status } : p)),
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const createPlan = useCallback(
    (input: Omit<MembershipPlan, 'id' | 'gym_id' | 'created_at' | 'updated_at' | 'status'>) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const plan: MembershipPlan = {
          ...input,
          id: generateId('plan'),
          gym_id: gymId,
          status: 'active',
          created_at: nowISO,
          updated_at: nowISO,
        };
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'plan_created',
          description: `Created plan "${plan.name}" (${formatINR(plan.price)} / ${plan.duration_days} days)`,
          created_at: nowISO,
        };
        return {
          ...prev,
          plans: [plan, ...prev.plans],
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const updatePlan = useCallback(
    (planId: string, updates: Partial<MembershipPlan>) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => ({
        ...prev,
        plans: prev.plans.map((p) => (p.id === planId ? { ...p, ...updates, updated_at: nowISO } : p)),
      }));
    },
    [commitStore],
  );

  const archivePlan = useCallback(
    (planId: string) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => ({
        ...prev,
        plans: prev.plans.map((p) => (p.id === planId ? { ...p, status: 'archived', updated_at: nowISO } : p)),
      }));
    },
    [commitStore],
  );

  const markAttendance = useCallback(
    (memberId: string, date: string, status: AttendanceStatus, checkInTime?: string) => {
      const nowISO = new Date().toISOString();
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const existing = prev.attendance.find(
          (a) => a.member_id === memberId && a.attendance_date === date,
        );
        const updatedAttendance = existing
          ? prev.attendance.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    status,
                    check_in_time: status === 'present' ? checkInTime || a.check_in_time || defaultTime : undefined,
                  }
                : a,
            )
          : [
              {
                id: generateId('att'),
                gym_id: gymId,
                member_id: memberId,
                attendance_date: date,
                status,
                check_in_time: status === 'present' ? checkInTime || defaultTime : undefined,
                created_at: nowISO,
              },
              ...prev.attendance,
            ];

        return {
          ...prev,
          attendance: updatedAttendance,
        };
      });
    },
    [commitStore],
  );

  const bulkMarkAttendance = useCallback(
    (memberIds: string[], date: string, status: AttendanceStatus) => {
      const nowISO = new Date().toISOString();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const idSet = new Set(memberIds);
        const remaining = prev.attendance.filter(
          (a) => !(a.attendance_date === date && idSet.has(a.member_id)),
        );
        const inserted: AttendanceRecord[] = memberIds.map((memberId) => ({
          id: generateId('att'),
          gym_id: gymId,
          member_id: memberId,
          attendance_date: date,
          status,
          check_in_time: status === 'present' ? timeStr : undefined,
          created_at: nowISO,
        }));
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'attendance_marked',
          description: `Attendance marked ${status} for ${memberIds.length} members`,
          created_at: nowISO,
        };
        return {
          ...prev,
          attendance: [...inserted, ...remaining],
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const addEnquiry = useCallback(
    (input: Omit<Enquiry, 'id' | 'gym_id' | 'created_at' | 'updated_at'>) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const enquiry: Enquiry = {
          ...input,
          id: generateId('enq'),
          gym_id: gymId,
          created_at: nowISO,
          updated_at: nowISO,
        };
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'enquiry_added',
          description: `New enquiry logged for ${enquiry.name} (${enquiry.interested_plan})`,
          created_at: nowISO,
        };
        return {
          ...prev,
          enquiries: [enquiry, ...prev.enquiries],
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const updateEnquiry = useCallback(
    (enquiryId: string, updates: Partial<Enquiry>) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => ({
        ...prev,
        enquiries: prev.enquiries.map((e) =>
          e.id === enquiryId ? { ...e, ...updates, updated_at: nowISO } : e,
        ),
      }));
    },
    [commitStore],
  );

  const archiveEnquiry = useCallback(
    (enquiryId: string) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => ({
        ...prev,
        enquiries: prev.enquiries.map((e) =>
          e.id === enquiryId ? { ...e, status: 'Archived', updated_at: nowISO } : e,
        ),
      }));
    },
    [commitStore],
  );

  const logBirthdayWish = useCallback(
    (memberId: string, message: string) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const member = prev.members.find((m) => m.id === memberId);
        return {
          ...prev,
          birthdayMessages: [
            {
              id: generateId('bday'),
              gym_id: gymId,
              member_id: memberId,
              message,
              sent_at: nowISO,
              created_at: nowISO,
            },
            ...prev.birthdayMessages,
          ],
          activities: [
            {
              id: generateId('act'),
              gym_id: gymId,
              type: 'wish_sent',
              description: `Birthday wish prepared for ${member?.name || 'Member'}`,
              related_member_id: memberId,
              created_at: nowISO,
            },
            ...prev.activities,
          ],
        };
      });
    },
    [commitStore],
  );

  const logFestivalWish = useCallback(
    (festival: string, template: string, audience: string) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        return {
          ...prev,
          festivalMessages: [
            {
              id: generateId('fest'),
              gym_id: gymId,
              festival,
              message_template: template,
              audience,
              created_at: nowISO,
            },
            ...prev.festivalMessages,
          ],
          activities: [
            {
              id: generateId('act'),
              gym_id: gymId,
              type: 'wish_sent',
              description: `Prepared ${festival} greetings for ${audience}`,
              created_at: nowISO,
            },
            ...prev.activities,
          ],
        };
      });
    },
    [commitStore],
  );

  const addStaff = useCallback(
    (input: Omit<StaffMember, 'id' | 'gym_id' | 'created_at'>) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => ({
        ...prev,
        staff: [
          {
            ...input,
            id: generateId('stf'),
            gym_id: getActiveGymId(prev),
            created_at: nowISO,
          },
          ...prev.staff,
        ],
      }));
    },
    [commitStore],
  );

  const updateStaff = useCallback(
    (staffId: string, updates: Partial<StaffMember>) => {
      commitStore((prev) => ({
        ...prev,
        staff: prev.staff.map((s) => (s.id === staffId ? { ...s, ...updates } : s)),
      }));
    },
    [commitStore],
  );

  const removeStaff = useCallback(
    (staffId: string) => {
      commitStore((prev) => ({
        ...prev,
        staff: prev.staff.map((s) => (s.id === staffId ? { ...s, status: 'Archived' } : s)),
      }));
    },
    [commitStore],
  );

  const updateGymProfile = useCallback(
    (updates: Partial<GymProfile>) => {
      commitStore((prev) => ({
        ...prev,
        gym: { ...prev.gym, ...updates },
      }));
    },
    [commitStore],
  );

  const updateUserProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      commitStore((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updates },
      }));
    },
    [commitStore],
  );

  const updateNotificationPrefs = useCallback(
    (prefs: NotificationPreferences) => {
      try {
        localStorage.setItem('fitflow_notif_prefs', JSON.stringify(prefs));
      } catch {
        // ignore
      }
      commitStore((prev) => ({
        ...prev,
        notificationPrefs: prefs,
      }));
    },
    [commitStore],
  );

  const sendOwnerNotice = useCallback(
    (input: { title: string; message: string; audience: string; recipientCount: number }) => {
      const nowISO = new Date().toISOString();
      commitStore((prev) => {
        const gymId = getActiveGymId(prev);
        const notif: NotificationItem = {
          id: generateId('notif'),
          gym_id: gymId,
          type: 'announcement',
          title: `Sent: ${input.title}`,
          message: `${input.audience} (${input.recipientCount} members) — ${input.message}`,
          link: '/members',
          is_read: true,
          created_at: nowISO,
        };
        const act: ActivityItem = {
          id: generateId('act'),
          gym_id: gymId,
          type: 'notice_sent',
          description: `Owner sent notice "${input.title}" to ${input.audience} (${input.recipientCount} members)`,
          created_at: nowISO,
        };
        return {
          ...prev,
          notifications: [notif, ...prev.notifications],
          activities: [act, ...prev.activities],
        };
      });
    },
    [commitStore],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      commitStore((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      }));
    },
    [commitStore],
  );

  const markAllNotificationsRead = useCallback(() => {
    commitStore((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
    }));
  }, [commitStore]);

  return (
    <GymDataContext.Provider
      value={{
        store,
        isLoading,
        error,
        reload,
        resetDemoData,
        activeMembersList,
        allPlans,
        activePlans,
        nonArchivedEnquiries,
        activeStaff,
        unreadNotificationsCount,
        birthdaysToday,
        upcomingBirthdays7Days,
        birthdaysThisMonth,
        metrics,
        addMember,
        updateMember,
        archiveMember,
        renewMembership,
        freezeMembership,
        resumeMembership,
        recordPayment,
        updatePaymentStatus,
        addExpense,
        updateExpense,
        deleteExpense,
        createPlan,
        updatePlan,
        archivePlan,
        markAttendance,
        bulkMarkAttendance,
        addEnquiry,
        updateEnquiry,
        archiveEnquiry,
        logBirthdayWish,
        logFestivalWish,
        sendOwnerNotice,
        addStaff,
        updateStaff,
        removeStaff,
        updateGymProfile,
        updateUserProfile,
        updateNotificationPrefs,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </GymDataContext.Provider>
  );
}

export function useGymData(): GymDataContextValue {
  const ctx = useContext(GymDataContext);
  if (!ctx) throw new Error('useGymData must be used inside GymDataProvider');
  return ctx;
}
