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
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/auth/login");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace("/auth/login");
      return;
    }

    setChecked(true);
  }, [_hasHydrated, isAuthenticated, user, allowedRoles, router]);

  if (!_hasHydrated || !checked) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--black)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:"32px", height:"32px", border:"2px solid var(--border)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
