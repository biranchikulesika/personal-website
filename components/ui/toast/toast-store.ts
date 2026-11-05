import type { ToastItem, ToastOptions, ToastType } from "./toast-types";

type Listener = (toasts: ToastItem[]) => void;

class ToastStore {
  private toasts: ToastItem[] = [];
  private listeners: Set<Listener> = new Set();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = [...this.toasts];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  add(type: ToastType, message: string, options?: ToastOptions): string {
    const trimmed = (message || "").trim();
    if (!trimmed) return "";

    // Deduplication: prevent stacking identical messages of the same type
    const existing = this.toasts.find(
      (t) => t.message === trimmed && t.type === type
    );
    if (existing) {
      const duration = options?.duration ?? this.getDefaultDuration(type);
      this.restartTimer(existing.id, duration);
      return existing.id;
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = options?.duration ?? this.getDefaultDuration(type);

    const toast: ToastItem = {
      id,
      type,
      message: trimmed,
      description: options?.description,
      duration,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
      icon: options?.icon,
      createdAt: Date.now(),
    };

    // Keep active toasts capped at 4 to prevent screen obstruction
    if (this.toasts.length >= 4) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    this.toasts.push(toast);
    this.notify();

    if (duration !== Infinity) {
      this.restartTimer(id, duration);
    }

    return id;
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    const next = this.toasts.filter((t) => t.id !== id);
    if (next.length !== this.toasts.length) {
      this.toasts = next;
      this.notify();
    }
  }

  dismissAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.toasts = [];
    this.notify();
  }

  getToasts(): ToastItem[] {
    return [...this.toasts];
  }

  private restartTimer(id: string, duration: number): void {
    const existingTimer = this.timers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(id);
    }

    if (duration !== Infinity && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }
  }

  private getDefaultDuration(type: ToastType): number {
    switch (type) {
      case "success":
        return 3500;
      case "info":
        return 3500;
      case "warning":
        return 5000;
      case "error":
        return 6000;
      case "loading":
        return Infinity;
    }
  }
}

export const toastStore = new ToastStore();
