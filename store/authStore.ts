import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole =
  | "SYSTEM_ADMIN"
  | "DEALER_ADMIN"
  | "DEALER_STAFF"
  | "PARTNER_USER"
  | "PUBLIC_USER";

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  dealerId?: string | null;
  accessToken: string;
  refreshToken?: string;
  profilePicture?: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  setHasHydrated: (val: boolean) => void;
}

export function getRoleRedirect(role: string, dealerId?: string | null): string {
  switch (role) {
    case "SYSTEM_ADMIN":  return "/dashboard/super-admin";
    case "DEALER_ADMIN":  return "/dashboard/dealer";
    case "DEALER_STAFF":  return "/dashboard/staff";
    case "PARTNER_USER":  return "/dashboard/partner";
    default:              return "/dashboard/user";
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (data) =>
        set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);