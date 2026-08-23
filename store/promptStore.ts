import { create } from "zustand";

interface PromptRequest {
  id: number;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  resolve: (value: string | null) => void;
}

interface PromptState {
  request: PromptRequest | null;
  ask: (opts: { message: string; placeholder?: string; defaultValue?: string; confirmLabel?: string }) => Promise<string | null>;
  respond: (value: string | null) => void;
}

let counter = 0;

/**
 * Global text-input dialog — replaces window.prompt(), same
 * reliability issue and fix pattern as the alert()/confirm() sweeps:
 * window.prompt() is known to be unreliable or hang inside
 * Capacitor's Android WebView with no native dialog handler
 * configured.
 *
 * Usage: const reason = await askPrompt({ message: "Suspension reason:" });
 * if (!reason) return; // null if cancelled or left empty
 */
export const usePromptStore = create<PromptState>((set, get) => ({
  request: null,
  ask: (opts) => {
    return new Promise<string | null>((resolve) => {
      const id = ++counter;
      set({ request: { id, resolve, ...opts } });
    });
  },
  respond: (value) => {
    const req = get().request;
    if (req) req.resolve(value);
    set({ request: null });
  },
}));

/** Convenience hook: const askPrompt = usePrompt(); const reason = await askPrompt({ message: "..." }); */
export function usePrompt() {
  return usePromptStore((s) => s.ask);
}
