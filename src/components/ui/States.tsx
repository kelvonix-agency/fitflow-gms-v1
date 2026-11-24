import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-[20px] border border-dashed border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#181A1F]">
      <div className="h-12 w-12 rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1.5 text-sm text-stone-500 dark:text-zinc-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong.',
  message = 'Unable to load your gym data.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[20px] border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#181A1F]">
      <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1.5 text-sm text-stone-500 dark:text-zinc-400 max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-stone-200 dark:bg-zinc-800" />
          <div className="h-4 w-72 rounded-lg bg-stone-200/70 dark:bg-zinc-800/70" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-stone-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/70 dark:border-zinc-800 p-5 space-y-3">
              <div className="h-4 w-28 rounded bg-stone-200 dark:bg-zinc-800" />
              <div className="h-9 w-20 rounded bg-stone-200 dark:bg-zinc-800" />
              <div className="h-3 w-40 rounded bg-stone-100 dark:bg-zinc-800/70" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200/70 dark:border-zinc-800 p-5 space-y-3">
              <div className="h-4 w-20 rounded bg-stone-200 dark:bg-zinc-800" />
              <div className="h-7 w-16 rounded bg-stone-200 dark:bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-stone-100 dark:bg-zinc-800/70" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 h-80 rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/70 dark:border-zinc-800" />
        <div className="lg:col-span-3 h-80 rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/70 dark:border-zinc-800" />
        <div className="lg:col-span-4 h-80 rounded-[20px] bg-white dark:bg-[#181A1F] border border-stone-200/70 dark:border-zinc-800" />
      </div>
    </div>
  );
}
