"use client";

import { useCallback } from "react";
import { toast } from "@/lib/toast";

export interface UseToastReturn {
  message: string | null;
  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
  dismissToast: () => void;
  toast: typeof toast;
}

/**
 * Universal toast hook.
 *
 * Bridges seamlessly into the centralised toast notification system.
 */
export function useToast(defaultDuration?: number): UseToastReturn {
  void defaultDuration;
  const showToast = useCallback(
    (
      msg: string,
      type?: "success" | "error" | "warning" | "info"
    ) => {
      if (!msg) return;

      if (type) {
        toast[type](msg);
        return;
      }

      const lower = msg.toLowerCase();
      if (
        lower.includes("success") ||
        lower.includes("saved") ||
        lower.includes("created") ||
        lower.includes("uploaded") ||
        lower.includes("added") ||
        lower.includes("updated")
      ) {
        toast.success(msg);
      } else if (
        lower.includes("failed") ||
        lower.includes("error") ||
        lower.includes("unable") ||
        lower.includes("cannot")
      ) {
        toast.error(msg);
      } else if (lower.includes("warn") || lower.includes("discard")) {
        toast.warning(msg);
      } else {
        toast.info(msg);
      }
    },
    []
  );

  const dismissToast = useCallback(() => {
    toast.dismissAll();
  }, []);

  return {
    message: null,
    showToast,
    dismissToast,
    toast,
  };
}
