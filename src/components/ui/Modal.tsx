import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const MAX_W_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, subtitle, size = 'md', children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-[1px] transition-opacity duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${MAX_W_CLASS[size]} rounded-t-[26px] sm:rounded-[22px] bg-white dark:bg-[#181A1F] border border-stone-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[92vh] transition-transform duration-150`}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 border-b border-stone-200/80 dark:border-zinc-800">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-stone-900 dark:text-zinc-100">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-5 sm:px-6 py-5 ${!footer ? 'pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5' : ''}`}>
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/40 sm:rounded-b-[22px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
