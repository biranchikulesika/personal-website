import type { ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number; // duration in ms, or Infinity for persistent/loading toasts
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  createdAt: number;
}

export type ToastOptions = Partial<
  Omit<ToastItem, "id" | "type" | "message" | "createdAt">
>;
