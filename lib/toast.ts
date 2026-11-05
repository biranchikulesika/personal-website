import { toastStore } from "@/components/ui/toast/toast-store";
import type { ToastOptions } from "@/components/ui/toast/toast-types";

export * from "@/components/ui/toast/toast-types";

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    toastStore.add("success", message, options),

  error: (message: string, options?: ToastOptions) =>
    toastStore.add("error", message, options),

  warning: (message: string, options?: ToastOptions) =>
    toastStore.add("warning", message, options),

  info: (message: string, options?: ToastOptions) =>
    toastStore.add("info", message, options),

  loading: (message: string, options?: ToastOptions) =>
    toastStore.add("loading", message, options),

  dismiss: (id: string) => toastStore.dismiss(id),

  dismissAll: () => toastStore.dismissAll(),

  /**
   * Helper that wraps an async promise with loading, success, and error toasts.
   */
  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((val: T) => string);
      error: string | ((err: unknown) => string);
    }
  ): Promise<T> => {
    const id = toast.loading(messages.loading);
    try {
      const result = await promise;
      toast.dismiss(id);
      const successMsg =
        typeof messages.success === "function"
          ? messages.success(result)
          : messages.success;
      toast.success(successMsg);
      return result;
    } catch (err) {
      toast.dismiss(id);
      const errorMsg =
        typeof messages.error === "function"
          ? messages.error(err)
          : messages.error;
      toast.error(errorMsg);
      throw err;
    }
  },
};
