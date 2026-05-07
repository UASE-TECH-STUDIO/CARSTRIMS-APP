import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole =
  | "SYSTEM_ADMIN"
  | "DEALER_ADMIN"
  | "DEALER_STAFF"
  | "PARTNER_USER"
  | "PUBLIC_USER";

interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  dealerId: string | null;
  accessToken: string;
  refreshToken: string;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      setUser: (user: AuthUser) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", user.accessToken);
          localStorage.setItem("refreshToken", user.refreshToken);
        }
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "car-dealer-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const getRoleRedirect = (
  role: UserRole,
  dealerId?: string | null
): string => {
  switch (role) {
    case "SYSTEM_ADMIN":
      return "/dashboard/super-admin";
    case "DEALER_ADMIN":
      return dealerId ? "/dashboard/dealer" : "/dashboard/dealer/setup";
    case "DEALER_STAFF":
      return "/dashboard/staff";
    case "PARTNER_USER":
      return "/dashboard/partner";
    default:
      return "/dashboard/user";
  }
};
