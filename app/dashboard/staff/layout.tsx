"use client";
import { ReactNode } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import StaffSidebar from "@/components/layout/StaffSidebar";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import MenuToggle from "@/components/layout/MenuToggle";
import NotificationBell from "@/components/ui/NotificationBell";
import MessagesWidget from "@/components/shared/MessagesWidget";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => setStaff(r.data)).catch(() => {});
  }, []);

  return (
    <AuthGuard allowedRoles={["DEALER_STAFF"]}>
      <div className="staff-shell">
        <SidebarWrapper isOpen={isOpen} onClose={close}>
          <StaffSidebar staffInfo={staff} />
        </SidebarWrapper>
        <div className="staff-main">
          <header className="staff-topbar">
            <div className="tb-left">
              <MenuToggle isOpen={isOpen} onClick={toggle} />
              <div className="tb-brand">CARSTRIMS</div>
            </div>
            <div className="tb-right">
              <span className="greeting">Good {getGreeting()}, <strong>{user?.fullName?.split(" ")[0]}</strong></span>
              <NotificationBell />
              <button className="av-btn" onClick={() => router.push("/dashboard/staff/settings")}>
                {user?.fullName?.charAt(0).toUpperCase() || "S"}
              </button>
            </div>
          </header>
          <main className="staff-content">{children}</main>
          <footer className="staff-footer">Powered by <strong>UASE TECH STUDIO</strong> for CARSTRIMS 2026</footer>
        </div>
        <MessagesWidget accentColor="#F47B20" />
      </div>
      <style>{`
        .staff-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .staff-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .staff-topbar{height:60px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.05);gap:0.75rem}
        .tb-left{display:flex;align-items:center;gap:0.75rem}
        .tb-brand{font-family:var(--font-display);font-size:1rem;letter-spacing:0.15em;color:#F47B20}
        .tb-right{display:flex;align-items:center;gap:0.75rem;flex-shrink:0}
        .greeting{font-size:0.78rem;color:#888;white-space:nowrap}
        .greeting strong{color:#F47B20}
        .av-btn{width:34px;height:34px;border-radius:50%;border:2px solid #F47B20;background:#FFF7ED;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.9rem;color:#F47B20;transition:all 0.2s}
        .av-btn:hover{transform:scale(1.06)}
        .staff-content{flex:1;padding:1.75rem;max-width:1400px;width:100%}
        .staff-footer{padding:0.875rem 1.75rem;border-top:1px solid #E5E5E5;font-size:0.7rem;color:#CCC;background:#fff;text-align:center}
        .staff-footer strong{color:#F47B20}
        @media(max-width:767px){.staff-main{margin-left:0}.staff-content{padding:1rem}}
        @media(max-width:640px){.greeting{display:none}}
      `}</style>
    </AuthGuard>
  );
}
