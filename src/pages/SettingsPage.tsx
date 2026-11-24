import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon, RotateCcw, Sun, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGymData } from '../context/GymDataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

type SettingsTab = 'gym' | 'appearance' | 'notifications' | 'account';

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const {
    store,
    updateGymProfile,
    updateUserProfile,
    updateNotificationPrefs,
    resetDemoData,
  } = useGymData();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const initialTab = (searchParams.get('tab') as SettingsTab) || 'gym';
  const [tab, setTab] = useState<SettingsTab>(
    ['gym', 'appearance', 'notifications', 'account'].includes(initialTab) ? initialTab : 'gym',
  );
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Gym form
  const [gymName, setGymName] = useState(store?.gym.name || 'FitFlow Studio');
  const [gymLogo, setGymLogo] = useState(store?.gym.logo_url || '');
  const [gymPhone, setGymPhone] = useState(store?.gym.phone || '');
  const [gymEmail, setGymEmail] = useState(store?.gym.email || '');
  const [gymAddress, setGymAddress] = useState(store?.gym.address || '');
  const [gymHours, setGymHours] = useState(store?.gym.opening_hours || '');
  const [gymWebsite, setGymWebsite] = useState(store?.gym.website || '');
  const [gymInstagram, setGymInstagram] = useState(store?.gym.instagram || '');

  // Account form
  const [ownerName, setOwnerName] = useState(store?.profile.name || '');
  const [ownerEmail, setOwnerEmail] = useState(store?.profile.email || '');
  const [ownerAvatar, setOwnerAvatar] = useState(store?.profile.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const param = searchParams.get('tab') as SettingsTab | null;
    if (param && ['gym', 'appearance', 'notifications', 'account'].includes(param)) {
      setTab(param);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!store) return;
    setGymName(store.gym.name);
    setGymLogo(store.gym.logo_url || '');
    setGymPhone(store.gym.phone);
    setGymEmail(store.gym.email);
    setGymAddress(store.gym.address);
    setGymHours(store.gym.opening_hours);
    setGymWebsite(store.gym.website);
    setGymInstagram(store.gym.instagram);
    setOwnerName(store.profile.name);
    setOwnerEmail(store.profile.email);
    setOwnerAvatar(store.profile.avatar_url || '');
  }, [store]);

  const handleImageUpload = (cb: (dataUrl: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') cb(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) {
      toast({ title: 'Gym name cannot be empty.', variant: 'error' });
      return;
    }
    updateGymProfile({
      name: gymName.trim(),
      logo_url: gymLogo || undefined,
      phone: gymPhone.trim(),
      email: gymEmail.trim(),
      address: gymAddress.trim(),
      opening_hours: gymHours.trim(),
      website: gymWebsite.trim(),
      instagram: gymInstagram.trim(),
    });
    toast({ title: 'Settings updated.', description: 'Gym profile saved across workspace.' });
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = ownerName.trim();
    const trimmedEmail = ownerEmail.trim();

    if (!trimmedName) {
      toast({ title: 'Owner name cannot be empty.', variant: 'error' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ title: 'Please enter a valid email address.', variant: 'error' });
      return;
    }
    if (newPassword.trim() && newPassword.trim().length < 6) {
      toast({ title: 'Password must be at least 6 characters.', variant: 'error' });
      return;
    }

    updateUserProfile({
      name: trimmedName,
      email: trimmedEmail,
      avatar_url: ownerAvatar || undefined,
    });

    const hadPasswordInput = Boolean(newPassword.trim());
    setNewPassword('');
    toast({
      title: 'Account updated.',
      description:
        hadPasswordInput && session?.isDemo
          ? 'Profile saved. Demo sign-in password remains demo1234.'
          : undefined,
    });
  };

  const inputClass =
    'w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30';
  const labelClass = 'block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5';

  const prefs = store?.notificationPrefs || {
    expiry_reminder: true,
    payment_reminder: true,
    birthday_reminder: true,
    renewal_reminder: true,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
          Configure your gym branding, theme preference, reminders, and owner account.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
        {(
          [
            { id: 'gym', label: 'Gym Profile' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'account', label: 'Account' },
          ] as Array<{ id: SettingsTab; label: string }>
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setSearchParams({ tab: t.id }, { replace: true });
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium active:scale-[0.97] transition-all whitespace-nowrap shrink-0 ${
              tab === t.id
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 text-stone-600 dark:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gym' && (
        <form
          onSubmit={handleSaveGym}
          className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100 dark:border-zinc-800">
            <Avatar name={gymName} src={gymLogo || undefined} size="xl" />
            <div>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Gym Logo</span>
                <input type="file" accept="image/*" onChange={handleImageUpload(setGymLogo)} className="hidden" />
              </label>
              <p className="mt-1.5 text-xs text-stone-400 dark:text-zinc-500">
                Displayed in the sidebar and member messages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Gym Name</label>
              <input type="text" value={gymName} onChange={(e) => setGymName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={gymPhone} onChange={(e) => setGymPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={gymEmail} onChange={(e) => setGymEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Opening Hours</label>
              <input type="text" value={gymHours} onChange={(e) => setGymHours(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <input type="text" value={gymAddress} onChange={(e) => setGymAddress(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input type="text" value={gymWebsite} onChange={(e) => setGymWebsite(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Instagram</label>
              <input type="text" value={gymInstagram} onChange={(e) => setGymInstagram(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-sm font-semibold transition-all whitespace-nowrap"
            >
              Save Gym Profile
            </button>
          </div>
        </form>
      )}

      {tab === 'appearance' && (
        <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">Theme Mode</h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
              Your preference is saved automatically across sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast({ title: 'Light Mode enabled.' });
              }}
              className={`p-5 rounded-2xl border text-left transition-all ${
                theme === 'light'
                  ? 'border-orange-600 bg-orange-50/50 dark:bg-orange-950/20'
                  : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-semibold">Light Mode</span>
              </div>
              <p className="mt-1.5 text-xs text-stone-500 dark:text-zinc-400">
                Warm off-white canvas with crisp white elevated cards.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                toast({ title: 'Dark Mode enabled.' });
              }}
              className={`p-5 rounded-2xl border text-left transition-all ${
                theme === 'dark'
                  ? 'border-orange-600 bg-orange-50/50 dark:bg-orange-950/20'
                  : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Moon className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-semibold">Dark Mode</span>
              </div>
              <p className="mt-1.5 text-xs text-stone-500 dark:text-zinc-400">
                Deep charcoal background with low-glare surfaces.
              </p>
            </button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              Reminder Preferences
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
              Choose which operational alerts appear in your notification inbox.
            </p>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-zinc-800">
            {[
              {
                key: 'expiry_reminder' as const,
                title: 'Membership expiry reminder',
                desc: 'Alert when memberships expire or approach expiry within 7 days.',
              },
              {
                key: 'payment_reminder' as const,
                title: 'Payment reminder',
                desc: 'Alert for pending or failed member payments.',
              },
              {
                key: 'birthday_reminder' as const,
                title: 'Birthday reminder',
                desc: 'Daily morning summary of member birthdays.',
              },
              {
                key: 'renewal_reminder' as const,
                title: 'Renewal reminder',
                desc: 'Weekly digest of upcoming renewals due.',
              },
            ].map((item) => (
              <label key={item.key} className="py-4 flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-zinc-100">{item.title}</p>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={(e) => {
                    updateNotificationPrefs({ ...prefs, [item.key]: e.target.checked });
                    toast({ title: 'Notification preference updated.' });
                  }}
                  className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-5">
          <form
            onSubmit={handleSaveAccount}
            className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-stone-100 dark:border-zinc-800">
              <Avatar name={ownerName} src={ownerAvatar || undefined} size="xl" />
              <div>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-medium cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Change Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload(setOwnerAvatar)} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Owner Name</label>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>New Password (Optional)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={session?.isDemo ? 'Demo mode keeps demo1234' : 'Leave blank to keep current password'}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-sm font-semibold transition-all whitespace-nowrap"
              >
                Update Account
              </button>
            </div>
          </form>

          <div className="rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/80 dark:border-zinc-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                Reset Demo Workspace
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Restore the original 56 seeded Indian members, plans, and transactions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetDialogOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all shrink-0 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={() => {
          resetDemoData();
          toast({ title: 'Demo workspace restored.' });
        }}
        title="Reset Demo Data"
        message="This will replace your local changes with the fresh seeded FitFlow demo dataset. Continue?"
        confirmLabel="Reset Data"
        variant="warning"
      />
    </div>
  );
}
