"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  typeToConfirm?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  typeToConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Reset typed confirmation value on modal open
  useEffect(() => {
    if (isOpen) {
      setTypedValue("");
      // Give focus to input if type-to-confirm is enabled, otherwise safe focus on cancel button
      setTimeout(() => {
        if (typeToConfirm && inputRef.current) {
          inputRef.current.focus();
        } else if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, typeToConfirm]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isConfirmed = !typeToConfirm || typedValue === typeToConfirm;

  function handleSubmit() {
    if (isConfirmed && !isLoading) {
      onConfirm();
    }
  }

  const confirmBtnStyles =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-paper"
      : variant === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-paper"
      : "bg-accent hover:bg-accent-hover text-night";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-3xl border border-tinted/20 bg-night-soft p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-paper"
      >
        <div className="flex items-center gap-3">
          {variant === "danger" && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-400"
              aria-hidden="true"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3 L14 13 L2 13 Z" />
                <line x1="8" y1="6.5" x2="8" y2="9.5" />
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
              </svg>
            </span>
          )}
          {variant === "warning" && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400"
              aria-hidden="true"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="6" />
                <line x1="8" y1="5" x2="8" y2="8.5" />
                <circle cx="8" cy="11" r="0.5" fill="currentColor" />
              </svg>
            </span>
          )}
          <h3
            id="confirm-dialog-title"
            className="font-serif text-xl sm:text-2xl font-normal text-paper leading-tight"
          >
            {title}
          </h3>
        </div>

        <div
          id="confirm-dialog-description"
          className="mt-3 text-sm leading-relaxed text-gray-mid"
        >
          {description}
        </div>

        {typeToConfirm && (
          <div className="mt-4">
            <label
              htmlFor="type-to-confirm-input"
              className="block text-xs font-medium text-ink-soft mb-1.5"
            >
              Type <b className="text-paper">{typeToConfirm}</b> to confirm:
            </label>
            <input
              id="type-to-confirm-input"
              ref={inputRef}
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isConfirmed) {
                  handleSubmit();
                }
              }}
              placeholder={`Type "${typeToConfirm}"`}
              disabled={isLoading}
              className="w-full rounded-xl border border-tinted/20 bg-night px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/40 focus:border-tinted/40 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-medium text-gray-mid hover:text-paper hover:bg-tinted/10 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isLoading}
            onClick={handleSubmit}
            className={`rounded-full px-5 py-2 text-xs font-semibold shadow-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed ${confirmBtnStyles}`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
