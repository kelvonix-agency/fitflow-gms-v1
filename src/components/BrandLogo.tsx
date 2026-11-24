import React from 'react';

export function BrandLogo({
  gymName = 'FitFlow',
  logoUrl,
  collapsed = false,
}: {
  gymName?: string;
  logoUrl?: string;
  collapsed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={gymName}
          referrerPolicy="no-referrer"
          className="h-9 w-9 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-zinc-700"
        />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6.5 6.5v11" />
            <path d="M17.5 6.5v11" />
            <path d="M3.5 9v6" />
            <path d="M20.5 9v6" />
            <path d="M6.5 12h11" />
          </svg>
        </div>
      )}
      {!collapsed && (
        <span className="font-display text-lg font-bold tracking-tight text-stone-900 dark:text-zinc-100 truncate">
          {gymName}
        </span>
      )}
    </div>
  );
}
