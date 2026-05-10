"use client";
import { ReactNode } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import AdminSidebar from "@/components/layout/AdminSidebar";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import MenuToggle from "@/components/layout/MenuToggle";
import NotificationBell from "@/components/ui/NotificationBell";
import MessagesWidget from "@/components/shared/MessagesWidget";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <AuthGuard allowedRoles={["SYSTEM_ADMIN"]}>
      <div className="admin-shell">
        <SidebarWrapper isOpen={isOpen} onClose={close}>
          <AdminSidebar />
        </SidebarWrapper>
        <div className="admin-main">
          <header className="admin-topbar">
            <div className="tb-left">
              <MenuToggle isOpen={isOpen} onClick={toggle} />
              <div className="tb-title">Super Admin</div>
            </div>
            <div className="tb-right">
              <span className="greeting">Good {getGreeting()}, <strong>{user?.fullName?.split(" ")[0]}</strong></span>
              <NotificationBell />
              <button className="av-btn" onClick={() => router.push("/dashboard/super-admin/settings")}>
                A
              </button>
            </div>
          </header>
          <main className="admin-content">{children}</main>
        </div>
        <MessagesWidget accentColor="#F47B20" />
      </div>
      <style>{`
        .admin-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .admin-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .admin-topbar{height:60px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.05);gap:0.75rem}
        .tb-left{display:flex;align-items:center;gap:0.75rem}
        .tb-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.06em;color:#1A1A1A}
        .tb-right{display:flex;align-items:center;gap:0.75rem;flex-shrink:0}
        .greeting{font-size:0.78rem;color:#888;white-space:nowrap}
        .greeting strong{color:#DC2626}
        .av-btn{width:34px;height:34px;border-radius:50%;border:2px solid #DC2626;background:#FEF2F2;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.9rem;color:#DC2626;font-weight:700}
        .admin-content{flex:1;padding:1.75rem;max-width:1400px;width:100%}
        @media(max-width:767px){.admin-main{margin-left:0}.admin-content{padding:1rem}}
        @media(max-width:640px){.greeting{display:none}}
      `}</style>
    </AuthGuard>
  );
}
