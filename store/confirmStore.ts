import { create } from "zustand";

interface ConfirmRequest {
  id: number;
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // styles the confirm button red for destructive actions (delete, suspend, etc.)
  resolve: (confirmed: boolean) => void;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  ask: (opts: { message: string; title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>;
  respond: (confirmed: boolean) => void;
}

let counter = 0;

/**
 * Global confirmation dialog — replaces window.confirm(), which is
 * known to be unreliable or hang entirely inside Capacitor's Android
 * WebView (no native JS dialog handler configured by default). Same
 * root cause and fix pattern as the alert()->showToast sweep, but
 * confirm() needed its own solution since it's synchronous/blocking
 * and returns true/false - a React modal can't replicate that, so
 * this returns a Promise instead.
 *
 * Usage: const confirmed = await askConfirm({ message: "Delete this car?", danger: true });
 * if (!confirmed) return;
 */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  ask: (opts) => {
    return new Promise<boolean>((resolve) => {
      const id = ++counter;
      set({ request: { id, resolve, ...opts } });
    });
  },
  respond: (confirmed) => {
    const req = get().request;
    if (req) req.resolve(confirmed);
    set({ request: null });
  },
}));

/** Convenience hook: const askConfirm = useConfirm(); if (!(await askConfirm({ message: "..." }))) return; */
export function useConfirm() {
  return useConfirmStore((s) => s.ask);
}
