import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithDemo } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('rahul@fitflowgym.in');
  const [password, setPassword] = useState('demo1234');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password, rememberMe);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Unable to sign in.');
      return;
    }
    toast({ title: 'Welcome back to FitFlow.' });
    navigate('/dashboard', { replace: true });
  };

  const handleDemo = async () => {
    setLoading(true);
    await loginWithDemo();
    setLoading(false);
    toast({ title: 'Signed in with Demo Account.' });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] dark:bg-[#0B0C0E] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo gymName="FitFlow" />
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Sign in to your gym
          </h1>
          <p className="mt-1.5 text-sm text-stone-500 dark:text-zinc-400">
            Manage members, renewals, attendance, and revenue in one place.
          </p>
        </div>

        <div className="relative">
          <a
            href="https://gym-for-haryana.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Back to website"
            title="Back to website"
            className="mb-3 sm:mb-0 sm:absolute sm:-left-14 sm:top-6 h-10 w-10 rounded-full bg-white dark:bg-[#181A1F] border border-stone-200/90 dark:border-zinc-800 shadow-xs hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 text-stone-600 dark:text-zinc-300 flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>

          <div className="rounded-[26px] bg-white dark:bg-[#181A1F] border border-stone-200/90 dark:border-zinc-800 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@fitflowgym.in"
                className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-stone-600 dark:text-zinc-400">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-orange-600 hover:text-orange-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 pr-10 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-stone-600 dark:text-zinc-400 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
              />
              <span>Remember me on this device</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              <span>{loading ? 'Signing in...' : 'Log In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-800" />
            <span className="text-[11px] font-medium text-stone-400 dark:text-zinc-500">Demo Access</span>
            <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full border border-stone-200 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 text-sm font-medium text-stone-800 dark:text-zinc-200 transition-colors"
          >
            Continue with Demo Account
          </button>

          <p className="mt-4 text-center text-[11px] text-stone-400 dark:text-zinc-500">
            Demo credentials: rahul@fitflowgym.in · demo1234
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
