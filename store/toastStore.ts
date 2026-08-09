import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
}

let counter = 0;

/**
 * Global toast notifications — shows a floating alert at the top of the
 * screen regardless of scroll position, so errors are never missed just
 * because the user was scrolled down inside a long form.
 *
 * This is additive on purpose: existing inline error banners (setErr,
 * setError, etc.) are left exactly as they are everywhere in the app —
 * this just ALSO surfaces the same message as a floating toast on top,
 * so nothing that already worked changes.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = "error") => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    const duration = type === "error" ? 6000 : 4000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience hook: const showToast = useToast(); showToast("Something broke", "error"); */
export function useToast() {
  return useToastStore((s) => s.showToast);
}
