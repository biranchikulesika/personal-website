"use client";

/**
 * Renders a toast notification at the bottom-center of its container.
 * Use with the useToast hook: pass the message prop.
 */
export function ToastView({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-tinted/20 bg-night-soft px-5 py-3 text-sm font-medium text-paper shadow-lg backdrop-blur-sm">
        <span>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-1 text-ink-soft transition-colors hover:text-paper"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
