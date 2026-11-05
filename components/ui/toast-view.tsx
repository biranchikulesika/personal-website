"use client";

/**
 * Legacy ToastView component.
 *
 * Kept for full backwards-compatibility. Global notifications are now rendered
 * cleanly via the centralised ToastContainer in the root layout.
 */
export function ToastView({
  message = null,
  onDismiss,
}: {
  message?: string | null;
  onDismiss?: () => void;
}) {
  // If a legacy caller specifically passed a message and onDismiss without the global provider,
  // we render nothing to avoid double rendering with ToastContainer.
  void message;
  void onDismiss;
  return null;
}
