import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'success' }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 3600);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-20 right-4 z-50 flex flex-col gap-2.5 sm:bottom-5 sm:right-5 max-w-[calc(100vw-2rem)] sm:max-w-sm pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3.5 shadow-lg transition-all duration-200"
          >
            {item.variant === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
            {item.variant === 'error' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
            {item.variant === 'info' && <Info className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 leading-snug">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
