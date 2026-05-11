"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      const roleMap: Record<string, string> = {
        SYSTEM_ADMIN: "/dashboard/super-admin",
        DEALER_ADMIN: "/dashboard/dealer",
        DEALER_STAFF: "/dashboard/staff",
        PARTNER_USER: "/dashboard/partner",
        PUBLIC_USER: "/dashboard/user",
      };
      router.replace(roleMap[user.role] || "/login");
      return;
    }

    setChecked(true);
  }, [hydrated, isAuthenticated, user, allowedRoles, router]);

  if (!hydrated || !checked) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--black)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"1rem" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", letterSpacing:"0.2em", color:"var(--gold)" }}>CARSTRIMS</div>
          <div style={{ width:"32px", height:"32px", border:"2px solid var(--border)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}