"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import StaffSidebar from "@/components/layout/StaffSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import MessagesWidget from "@/components/shared/MessagesWidget";
import NotificationBell from "@/components/ui/NotificationBell";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/staff/me")
      .then((r) => setStaff(r.data))
      .catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <AuthGuard allowedRoles={["DEALER_STAFF"]}>
      <div className="staff-shell">
        <StaffSidebar staffInfo={staff} />
        <div className="staff-main">
          <header className="staff-topbar">
            <div className="topbar-left">
              <div className="page-title">{today}</div>
            </div>
            <div className="topbar-right">
              <span className="greeting">
                {getGreeting()}, <strong>{user?.fullName?.split(" ")[0]}</strong>
              </span>
              <NotificationBell />
              <button className="avatar-btn" onClick={() => router.push("/dashboard/staff/settings")}
                title="My Settings">
                {user?.fullName?.charAt(0).toUpperCase() || "S"}
              </button>
            </div>
          </header>
          <main className="staff-content">{children}</main>
          <footer className="staff-footer">
            Powered by <strong>UASE TECH STUDIO</strong> for CARSTRIMS 2026
          </footer>
        </div>
      </div>
      <style>{`
        .staff-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .staff-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .staff-topbar{height:60px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.75rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        .topbar-left{display:flex;flex-direction:column;gap:0.1rem}
        .page-title{font-size:0.75rem;color:#AAA;letter-spacing:0.04em}
        .topbar-right{display:flex;align-items:center;gap:0.875rem}
        .greeting{font-size:0.82rem;color:#888}
        .greeting strong{color:#1D9E75}
        .avatar-btn{width:34px;height:34px;border-radius:50%;border:2px solid #1D9E75;background:#F0FDF4;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.9rem;color:#1D9E75;transition:all 0.2s}
        .avatar-btn:hover{background:#DCFCE7}
        .staff-content{flex:1;padding:1.75rem;max-width:1400px;width:100%}
        .staff-footer{padding:1rem 1.75rem;border-top:1px solid #E5E5E5;font-size:0.7rem;color:#CCC;background:#fff;text-align:center}
        .staff-footer strong{color:#1D9E75}
        @media(max-width:768px){.staff-main{margin-left:200px}.staff-content{padding:1.25rem}}
        @media(max-width:640px){.staff-shell{flex-direction:column}.staff-main{margin-left:0}.staff-content{padding:1rem}}
      `}</style>
            <MessagesWidget accentColor="#F47B20" />
      </AuthGuard>
  );
}

