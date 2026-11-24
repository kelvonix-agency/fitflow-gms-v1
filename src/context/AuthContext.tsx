import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthSession {
  email: string;
  name: string;
  rememberMe: boolean;
  isDemo: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  session: AuthSession | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ ok: boolean; error?: string }>;
  loginWithDemo: () => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = 'fitflow_auth_session_v1';
const AUTH_LOGGED_OUT_KEY = 'fitflow_auth_logged_out_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (mounted && data.session?.user) {
            setSession({
              email: data.session.user.email || 'rahul@fitflowgym.in',
              name: (data.session.user.user_metadata?.name as string) || 'Rahul Verma',
              rememberMe: true,
              isDemo: false,
            });
            setIsAuthLoading(false);
            return;
          }
        } catch {
          // Fall back to local session check
        }
      }

      try {
        const localRaw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (mounted && localRaw) {
          setSession(JSON.parse(localRaw) as AuthSession);
        } else if (mounted && !isSupabaseConfigured() && localStorage.getItem(AUTH_LOGGED_OUT_KEY) !== '1') {
          const demoSession: AuthSession = {
            email: 'rahul@fitflowgym.in',
            name: 'Rahul Verma',
            rememberMe: true,
            isDemo: true,
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoSession));
          setSession(demoSession);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const persistSession = (next: AuthSession) => {
    setSession(next);
    localStorage.removeItem(AUTH_LOGGED_OUT_KEY);
    const serialized = JSON.stringify(next);
    if (next.rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters.' };
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        if (cleanEmail === 'rahul@fitflowgym.in' && password === 'demo1234') {
          persistSession({ email: cleanEmail, name: 'Rahul Verma', rememberMe, isDemo: true });
          return { ok: true };
        }
        return { ok: false, error: error.message };
      }
      if (data.user) {
        persistSession({
          email: data.user.email || cleanEmail,
          name: (data.user.user_metadata?.name as string) || 'Rahul Verma',
          rememberMe,
          isDemo: false,
        });
        return { ok: true };
      }
    }

    if (cleanEmail === 'rahul@fitflowgym.in' && password !== 'demo1234' && password.length < 6) {
      return { ok: false, error: 'Invalid credentials. Try demo password: demo1234' };
    }

    const derivedName = cleanEmail === 'rahul@fitflowgym.in' ? 'Rahul Verma' : cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    persistSession({
      email: cleanEmail,
      name: derivedName,
      rememberMe,
      isDemo: true,
    });
    return { ok: true };
  };

  const loginWithDemo = async () => {
    persistSession({
      email: 'rahul@fitflowgym.in',
      name: 'Rahul Verma',
      rememberMe: true,
      isDemo: true,
    });
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setSession(null);
    localStorage.setItem(AUTH_LOGGED_OUT_KEY, '1');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const requestPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session),
        isAuthLoading,
        session,
        login,
        loginWithDemo,
        logout,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
