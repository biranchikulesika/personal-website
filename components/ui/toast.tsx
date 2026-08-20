'use client';

/**
 * Simple toast notification that auto-dismisses after the given duration.
 * Used in admin content-manager and compose-workspace.
 */
export function Toast({
  message,
  durationMs = 3500,
}: {
  message: string;
  durationMs?: number;
}) {
  // The parent should handle unmounting after durationMs.
  // This component is purely presentational.
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-night-soft border border-tinted/30 px-5 py-3 text-sm font-medium text-paper shadow-xl animate-in fade-in slide-in-from-bottom-3">
      {message}
    </div>
  );
}
