"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function AuthGuard({ children, allowedRoles }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Small delay to let Zustand rehydrate from localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace("/login");
        return;
      }
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard
        const dashMap: Record<string,string> = {
          SYSTEM_ADMIN: "/dashboard/super-admin",
          DEALER_ADMIN: "/dashboard/dealer",
          DEALER_STAFF: "/dashboard/staff",
          PARTNER_USER: "/dashboard/partner",
          USER:         "/dashboard/user",
        };
        router.replace(dashMap[user.role] || "/feed");
        return;
      }
      setReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!ready) return (
    <div style={{
      minHeight:"100vh", background:"#F5F5F5",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", gap:"1rem",
    }}>
      <div style={{
        fontFamily:"var(--font-display)", fontSize:"1.5rem",
        letterSpacing:"0.2em", color:"#F47B20",
      }}>CARSTRIMS</div>
      <div style={{
        width:"28px", height:"28px",
        border:"2px solid #E5E5E5", borderTopColor:"#F47B20",
        borderRadius:"50%", animation:"spin 0.8s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return <>{children}</>;
}
