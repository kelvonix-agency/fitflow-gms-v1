import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await requestPasswordReset(email);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Could not process reset request.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] dark:bg-[#0B0C0E] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo gymName="FitFlow" />
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-stone-500 dark:text-zinc-400">
            Enter your account email and we will send password recovery instructions.
          </p>
        </div>

        <div className="rounded-[26px] bg-white dark:bg-[#181A1F] border border-stone-200/90 dark:border-zinc-800 shadow-sm p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <div className="mx-auto h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
                Check your inbox
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                If an account exists for <span className="font-medium text-stone-800 dark:text-zinc-200">{email}</span>, a reset link has been sent.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@fitflowgym.in"
                  className="w-full rounded-[12px] border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold active:scale-[0.98] transition-all"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 pt-2 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to login</span>
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
