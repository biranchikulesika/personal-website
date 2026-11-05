"use client";

import { useEffect, useRef, useState } from "react";
import { toastStore } from "./toast-store";
import type { ToastItem, ToastType } from "./toast-types";

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case "success":
      return (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper border border-tinted/30"
          aria-hidden="true"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
        </span>
      );
    case "error":
      return (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper border border-tinted/30"
          aria-hidden="true"
        >
          <svg
            className="h-3 w-3"
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
      );
    case "warning":
      return (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper border border-tinted/30"
          aria-hidden="true"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3.5 L13.5 13 L2.5 13 Z" />
            <line x1="8" y1="7" x2="8" y2="9.5" />
            <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
          </svg>
        </span>
      );
    case "loading":
      return (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-paper/70"
          aria-hidden="true"
        >
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      );
    case "info":
    default:
      return (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper border border-tinted/30"
          aria-hidden="true"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="7" x2="8" y2="11" />
            <circle cx="8" cy="4.5" r="0.5" fill="currentColor" />
          </svg>
        </span>
      );
  }
}

function ToastElement({ toast }: { toast: ToastItem }) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const startXRef = useRef<number | null>(null);
  const currentOffsetRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    startXRef.current = e.clientX;
    currentOffsetRef.current = 0;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const diff = e.clientX - startXRef.current;
    currentOffsetRef.current = diff;
    setOffsetX(diff);
  };

  const finishDrag = (pointerElement: HTMLDivElement, pointerId: number) => {
    if (startXRef.current === null) return;
    const diff = currentOffsetRef.current;
    startXRef.current = null;
    setIsDragging(false);

    try {
      if (pointerElement.hasPointerCapture(pointerId)) {
        pointerElement.releasePointerCapture(pointerId);
      }
    } catch {
      // safe fallback
    }

    // Dismiss if swiped more than 60px in either direction
    if (Math.abs(diff) > 60) {
      setIsDismissing(true);
      const targetOffset = diff > 0 ? 320 : -320;
      setOffsetX(targetOffset);
      setTimeout(() => {
        toastStore.dismiss(toast.id);
      }, 160);
    } else {
      setOffsetX(0);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e.currentTarget, e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e.currentTarget, e.pointerId);
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        transform: `translateX(${offsetX}px)`,
        opacity: isDismissing
          ? 0
          : Math.max(0.1, 1 - Math.abs(offsetX) / 260),
        transition: isDragging
          ? "none"
          : "transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease",
      }}
      className="pointer-events-auto flex w-full sm:max-w-sm items-start gap-3 rounded-2xl border border-tinted/20 bg-night-soft/95 backdrop-blur-md px-4 py-3 shadow-2xl text-xs sm:text-sm text-paper select-none touch-pan-y cursor-grab active:cursor-grabbing hover:border-tinted/40 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="pt-0.5">
        {toast.icon || <ToastIcon type={toast.type} />}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <p className="font-sans font-medium text-paper leading-snug break-words">
          {toast.message}
        </p>
        {toast.description && (
          <p className="mt-1 text-xs text-gray-mid leading-relaxed break-words">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={toast.action.onClick}
            className="mt-2 text-xs font-semibold text-paper/90 underline underline-offset-2 hover:text-paper focus:outline-none"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>(() => toastStore.getToasts());

  useEffect(() => {
    return toastStore.subscribe((updated) => {
      setToasts(updated);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:left-auto sm:right-6 sm:w-auto z-[100] pointer-events-none flex flex-col gap-2.5 items-center sm:items-end"
    >
      {toasts.map((item) => (
        <ToastElement key={item.id} toast={item} />
      ))}
    </aside>
  );
}
