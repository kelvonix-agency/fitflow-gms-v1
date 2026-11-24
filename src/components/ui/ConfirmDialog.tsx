import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-xl text-white transition-colors whitespace-nowrap ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-stone-600 dark:text-zinc-300 leading-relaxed pt-1">{message}</p>
      </div>
    </Modal>
  );
}
