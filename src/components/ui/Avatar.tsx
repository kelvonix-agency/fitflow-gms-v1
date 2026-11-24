import React, { useState } from 'react';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
};

const PALETTES = [
  'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300',
  'bg-stone-200 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
];

function pickPalette(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${SIZE_MAP[size]} rounded-full object-cover shrink-0 border border-stone-200 dark:border-zinc-700 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${SIZE_MAP[size]} ${pickPalette(name)} rounded-full flex items-center justify-center font-semibold shrink-0 select-none ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
