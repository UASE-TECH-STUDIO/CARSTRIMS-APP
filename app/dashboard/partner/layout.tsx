"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import NotificationBell from "@/components/ui/NotificationBell";
import MenuToggle from "@/components/layout/MenuToggle";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import MessagesWidget from "@/components/shared/MessagesWidget";
import { useSidebar } from "@/hooks/useSidebar";

const NAV = [
  { href:"/dashboard/partner", label:"Overview", icon:"home", exact:true },
  { href:"/dashboard/partner/cars", label:"My Cars", icon:"car" },
  { href:"/dashboard/partner/dealers", label:"My Dealers", icon:"store" },
  { href:"/dashboard/partner/find-dealer", label:"Find Dealer", icon:"search" },
  { href:"/dashboard/partner/movements", label:"Movements", icon:"move" },
  { href:"/dashboard/partner/earnings", label:"Earnings", icon:"money" },
  { href:"/dashboard/partner/notifications", label:"Notifications", icon:"bell" },
  { href:"/dashboard/partner/settings", label:"Settings", icon:"gear" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/auth/me").then((r) => setMe(r.data)).catch(() => {});
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <AuthGuard allowedRoles={["PARTNER_USER"]}>
      <div className="partner-shell">
        {/* Sidebar */}
        <SidebarWrapper isOpen={isOpen} onClose={close}>
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="sb-brand">
                <span style={{color:"#F47B20"}}>◈</span>
                <span className="brand-name">CARSTRIMS</span>
              </div>
              <Link href="/dashboard/partner/settings" className="partner-badge">
                <div className="pb-avatar">
                  {me?.profilePicture ? <img src={me.profilePicture} alt="" /> : user?.fullName?.charAt(0).toUpperCase() || "P"}
                </div>
                <div className="pb-info">
                  <span className="pb-name">{me?.fullName || user?.fullName || "Partner"}</span>
                  <span className="pb-role">Partner Account</span>
                </div>
              </Link>
              <nav className="sb-nav">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href}
                    className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}>
                    <span className="ni-label">{item.label}</span>
                  </Link>
                ))}
                <div className="nav-div" />
                <Link href="/feed" className="nav-item feed-link">View Feed</Link>
              </nav>
            </div>
            <div className="sb-bottom">
              <div className="dev-note">Powered by UASE TECH STUDIO</div>
              <button className="logout-btn" onClick={() => { logout(); router.push("/login"); }}>Sign Out</button>
            </div>
          </aside>
        </SidebarWrapper>

        {/* Main */}
        <div className="partner-main">
          <header className="partner-topbar">
            <div className="tb-left">
              <MenuToggle isOpen={isOpen} onClick={toggle} />
              <div className="tb-title">Partner Dashboard</div>
            </div>
            <div className="tb-right">
              <span className="greeting">Good {getGreeting()}, <strong>{me?.fullName?.split(" ")[0] || "Partner"}</strong></span>
              <NotificationBell />
              <button className="av-btn" onClick={() => router.push("/dashboard/partner/settings")}>
                {me?.profilePicture ? <img src={me.profilePicture} alt="" className="av-img" /> : <span>{user?.fullName?.charAt(0).toUpperCase() || "P"}</span>}
              </button>
            </div>
          </header>
          <main className="partner-content">{children}</main>
          <footer className="partner-footer">Powered by <strong>UASE TECH STUDIO</strong> for CARSTRIMS 2026</footer>
        </div>
        <MessagesWidget accentColor="#F47B20" />
      </div>

      <style>{`
        .partner-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .sidebar{width:240px;min-height:100vh;background:#fff;border-right:1.5px solid #E5E5E5;display:flex;flex-direction:column;justify-content:space-between;height:100%;overflow-y:auto}
        .sidebar-top{display:flex;flex-direction:column}
        .sb-brand{display:flex;align-items:center;gap:0.6rem;padding:1.25rem;border-bottom:1px solid #E5E5E5;background:#1A1A1A}
        .brand-name{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.2em;color:#fff}
        .partner-badge{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#FFF7ED;text-decoration:none;transition:background 0.2s}
        .partner-badge:hover{background:#FFEDD5}
        .pb-avatar{width:36px;height:36px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid #F47B20}
        .pb-avatar img{width:100%;height:100%;object-fit:cover}
        .pb-info{display:flex;flex-direction:column;gap:0.1rem;overflow:hidden}
        .pb-name{font-size:0.82rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .pb-role{font-size:0.68rem;color:#F47B20}
        .sb-nav{display:flex;flex-direction:column;padding:0.5rem 0;gap:1px}
        .nav-item{display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1.25rem;text-decoration:none;color:#666;font-size:0.85rem;transition:all 0.15s;border-left:3px solid transparent}
        .nav-item:hover{color:#F47B20;background:#FFF7ED}
        .nav-item.active{color:#F47B20;background:#FFF0E6;border-left-color:#F47B20;font-weight:600}
        .feed-link{color:#AAA!important}
        .feed-link:hover{color:#F47B20!important}
        .ni-label{flex:1}
        .nav-div{height:1px;background:#E5E5E5;margin:0.4rem 1.25rem}
        .sb-bottom{padding:1rem 1.25rem;border-top:1px solid #E5E5E5}
        .dev-note{font-size:0.62rem;color:#CCC;letter-spacing:0.04em;text-align:center;margin-bottom:0.5rem}
        .logout-btn{display:flex;align-items:center;gap:0.75rem;width:100%;padding:0.65rem 0;background:none;border:none;color:#999;font-size:0.85rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .logout-btn:hover{color:#DC2626}
        .partner-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .partner-topbar{height:60px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.05);gap:0.75rem}
        .tb-left{display:flex;align-items:center;gap:0.75rem}
        .tb-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.06em;color:#1A1A1A}
        .tb-right{display:flex;align-items:center;gap:0.75rem;flex-shrink:0}
        .greeting{font-size:0.78rem;color:#888;white-space:nowrap}
        .greeting strong{color:#F47B20}
        .av-btn{width:34px;height:34px;border-radius:50%;border:2px solid #F47B20;background:#FFF7ED;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.9rem;color:#F47B20;transition:all 0.2s;padding:0}
        .av-btn:hover{transform:scale(1.06)}
        .av-img{width:100%;height:100%;object-fit:cover}
        .partner-content{flex:1;padding:1.75rem;max-width:1400px;width:100%}
        .partner-footer{padding:0.875rem 1.75rem;border-top:1px solid #E5E5E5;font-size:0.7rem;color:#CCC;background:#fff;text-align:center}
        .partner-footer strong{color:#F47B20}
        @media(max-width:767px){.partner-main{margin-left:0}.partner-content{padding:1rem}}
        @media(max-width:640px){.greeting{display:none}}
      `}</style>
    </AuthGuard>
  );
}
