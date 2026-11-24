import { createSeedData, DEFAULT_GYM_ID } from '../data/seedData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { GymStoreState } from '../types';

const STORAGE_KEY = 'fitflow_gym_store_v2';

export interface DataSourceMode {
  mode: 'supabase' | 'demo';
}

export function getDataSourceMode(): DataSourceMode {
  return { mode: isSupabaseConfigured() ? 'supabase' : 'demo' };
}

export async function loadGymStore(): Promise<GymStoreState> {
  // Attempt Supabase fetch when configured & authenticated, otherwise use persistent localStorage store
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const userId = sessionData.session.user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profile?.gym_id) {
          const gymId = profile.gym_id;
          const [
            gymRes,
            plansRes,
            membersRes,
            membershipsRes,
            paymentsRes,
            attendanceRes,
            enquiriesRes,
            birthdayRes,
            festivalRes,
            notifRes,
            actRes,
            staffRes,
          ] = await Promise.all([
            supabase.from('gyms').select('*').eq('id', gymId).single(),
            supabase.from('membership_plans').select('*').eq('gym_id', gymId),
            supabase.from('members').select('*').eq('gym_id', gymId),
            supabase.from('memberships').select('*').eq('gym_id', gymId),
            supabase.from('payments').select('*').eq('gym_id', gymId),
            supabase.from('attendance').select('*').eq('gym_id', gymId),
            supabase.from('enquiries').select('*').eq('gym_id', gymId),
            supabase.from('birthday_messages').select('*').eq('gym_id', gymId),
            supabase.from('festival_messages').select('*').eq('gym_id', gymId),
            supabase.from('notifications').select('*').eq('gym_id', gymId),
            supabase.from('activities').select('*').eq('gym_id', gymId).order('created_at', { ascending: false }).limit(50),
            supabase.from('staff').select('*').eq('gym_id', gymId),
          ]);

          if (gymRes.data) {
            return {
              profile,
              gym: gymRes.data,
              notificationPrefs: loadNotificationPrefs(),
              plans: plansRes.data ?? [],
              members: membersRes.data ?? [],
              memberships: membershipsRes.data ?? [],
              freezes: [],
              payments: paymentsRes.data ?? [],
              expenses: [],
              attendance: attendanceRes.data ?? [],
              enquiries: enquiriesRes.data ?? [],
              birthdayMessages: birthdayRes.data ?? [],
              festivalMessages: festivalRes.data ?? [],
              notifications: notifRes.data ?? [],
              activities: actRes.data ?? [],
              staff: staffRes.data ?? [],
            };
          }
        }
      }
    } catch {
      // Fallback transparently to persistent local demo data if Supabase tables aren't provisioned yet
    }
  }

  return loadLocalDemoStore();
}

export function loadLocalDemoStore(): GymStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GymStoreState;
      if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.plans)) {
        if (!Array.isArray(parsed.expenses) || !Array.isArray(parsed.freezes)) {
          const seededDefaults = createSeedData();
          const hydrated: GymStoreState = {
            ...parsed,
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : seededDefaults.expenses,
            freezes: Array.isArray(parsed.freezes) ? parsed.freezes : seededDefaults.freezes,
          };
          saveLocalDemoStore(hydrated);
          return hydrated;
        }
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse failures and re-seed cleanly
  }
  const seeded = createSeedData();
  saveLocalDemoStore(seeded);
  return seeded;
}

export function saveLocalDemoStore(state: GymStoreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Handle storage quota gracefully
  }
}

export function resetLocalDemoStore(): GymStoreState {
  const fresh = createSeedData();
  saveLocalDemoStore(fresh);
  return fresh;
}

const PREFS_KEY = 'fitflow_notif_prefs';

function loadNotificationPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // default
  }
  return {
    expiry_reminder: true,
    payment_reminder: true,
    birthday_reminder: true,
    renewal_reminder: true,
  };
}

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getActiveGymId(state?: GymStoreState): string {
  return state?.gym?.id || DEFAULT_GYM_ID;
}
