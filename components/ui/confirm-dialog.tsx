'use client';

import { useEffect, useRef } from 'react';

type ConfirmDialogVariant = 'danger' | 'warning' | 'default';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  /** When set, the user must type this exact string to enable the confirm button. */
  requireTypeConfirm?: string;
}

const variantButtonStyles: Record<ConfirmDialogVariant, string> = {
  danger: 'bg-red-700',
  warning: 'bg-accent',
  default: 'bg-accent',
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  requireTypeConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typedRef = useRef('');

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && requireTypeConfirm) {
      inputRef.current?.focus();
    }
  }, [open, requireTypeConfirm]);

  if (!open) return null;

  const typeConfirmed = !requireTypeConfirm || typedRef.current === requireTypeConfirm;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-3xl border border-tinted/20 bg-night-soft p-6 shadow-2xl animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="font-serif text-xl font-normal text-paper">
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-mid">
            {description}
          </p>
        )}

        {requireTypeConfirm && (
          <input
            ref={inputRef}
            type="text"
            placeholder={`Type "${requireTypeConfirm}" to confirm`}
            onChange={(e) => {
              typedRef.current = e.target.value;
              // Force re-render by toggling a hidden state
              e.currentTarget.closest('[data-dialog]')?.setAttribute(
                'data-typed',
                e.target.value === requireTypeConfirm ? 'yes' : 'no',
              );
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && typeConfirmed) {
                onConfirm();
              }
            }}
            className="mt-3 w-full rounded-xl border border-tinted/20 bg-night px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-accent focus:outline-none"
          />
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-medium text-gray-mid hover:text-paper transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading || !typeConfirmed}
            onClick={onConfirm}
            className={`rounded-full px-5 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50 transition-all ${variantButtonStyles[variant]}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
