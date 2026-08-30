"use client";
import { ReactNode, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import AdminSidebar from "@/components/layout/AdminSidebar";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import MenuToggle from "@/components/layout/MenuToggle";
import NotificationBell from "@/components/ui/NotificationBell";
import MessagesWidget from "@/components/shared/MessagesWidget";
import GlobalSearchModal from "@/components/shared/GlobalSearchModal";
import SearchHint from "@/components/shared/SearchHint";
import FeedHomeButton from "@/components/shared/FeedHomeButton";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";

const IconSignout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>;

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);

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
              <FeedHomeButton />
              <div style={{position:"relative"}}>
                <button className="search-topbar-btn" onClick={() => setShowSearch(true)} title="Search" aria-label="Search">🔍</button>
                <SearchHint onUseSearch={() => setShowSearch(true)} />
              </div>
              <NotificationBell />
              <button className="av-btn" onClick={() => router.push("/dashboard/super-admin/settings")}>
                A
              </button>
              <button className="logout-topbar-btn" onClick={() => { logout(); router.push("/login"); }} title="Sign Out">
                <IconSignout/>
              </button>
            </div>
          </header>
          {showSearch && <GlobalSearchModal onClose={() => setShowSearch(false)} role="super-admin" />}
          <main className="admin-content">{children}</main>
        </div>
        {!pathname?.endsWith("/messages") && <MessagesWidget accentColor="#F47B20" />}
      </div>
      <style>{`
        .admin-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .admin-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .admin-topbar{height:calc(60px + var(--sat, 0px));background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;padding-top:var(--sat, 0px);position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.05);gap:0.75rem}
        .tb-left{display:flex;align-items:center;gap:0.75rem}
        .tb-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.06em;color:#1A1A1A}
        .tb-right{display:flex;align-items:center;gap:0.75rem;flex-shrink:0}
        .search-topbar-btn{background:none;border:none;font-size:1.05rem;cursor:pointer;padding:0.25rem;line-height:1;color:#737373}
        .greeting{font-size:0.78rem;color:#888;white-space:nowrap}
        .greeting strong{color:#DC2626}
        .av-btn{width:34px;height:34px;border-radius:50%;border:2px solid #DC2626;background:#FEF2F2;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.9rem;color:#DC2626;font-weight:700}
        .logout-topbar-btn{background:none;border:1px solid #E5E5E5;border-radius:6px;color:#AAA;cursor:pointer;padding:0.3rem 0.5rem;transition:all 0.2s;display:flex;align-items:center;justify-content:center}
        .logout-topbar-btn:hover{color:#DC2626;border-color:#FCA5A5;background:#FEF2F2}
        .admin-content{flex:1;padding:1.75rem;max-width:1400px;width:100%}
        @media(max-width:767px){.admin-main{margin-left:0}.admin-content{padding:1rem}}
        @media(max-width:640px){.greeting{display:none}}
      `}</style>
    </AuthGuard>
  );
}
