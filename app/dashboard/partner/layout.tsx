"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
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

const NAV = [
  { href:"/dashboard/partner", label:"Overview", icon:"⊞", exact:true },
  { href:"/dashboard/partner/cars", label:"My Cars", icon:"🚗" },
  { href:"/dashboard/partner/dealers", label:"My Dealers", icon:"🏢" },
  { href:"/dashboard/partner/find-dealer", label:"Find Dealer", icon:"🔍" },
  { href:"/dashboard/partner/movements", label:"Movements", icon:"🔄" },
  { href:"/dashboard/partner/earnings", label:"Earnings", icon:"💰" },
  { href:"/dashboard/partner/notifications", label:"Notifications", icon:"🔔" },
  { href:"/dashboard/partner/settings", label:"Settings", icon:"⚙️" },
];

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/auth/me").then((r) => setMe(r.data)).catch(() => {});
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <AuthGuard allowedRoles={["PARTNER_USER"]}>
      <div className="partner-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <span className="brand-icon">◈</span>
              <span className="brand-name">CARSTRIMS</span>
            </div>

            <Link href="/dashboard/partner/settings" className="partner-badge">
              <div className="partner-avatar">
                {me?.profilePicture
                  ? <img src={me.profilePicture} alt="" />
                  : user?.fullName?.charAt(0).toUpperCase() || "P"
                }
              </div>
              <div className="partner-info">
                <span className="partner-name">{me?.fullName || user?.fullName || "Partner"}</span>
                <span className="partner-role">Partner Account</span>
              </div>
              <span className="edit-icon">✏️</span>
            </Link>

            <nav className="sidebar-nav">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}
                  className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
              <div className="nav-divider" />
              <Link href="/feed" className="nav-item feed-nav">
                <span className="nav-icon">🏠</span>
                <span className="nav-label">View Feed</span>
              </Link>
            </nav>
          </div>

          <div className="sidebar-bottom">
            <div className="dev-note">Powered by UASE TECH STUDIO</div>
            <button className="logout-btn" onClick={() => { logout(); router.push("/auth/login"); }}>
              ↩ Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="partner-main">
          <header className="partner-topbar">
            <div className="topbar-left">
              <div className="page-date">{today}</div>
            </div>
            <div className="topbar-right">
              <span className="greeting">
                {getGreeting()}, <strong>{me?.fullName?.split(" ")[0] || "Partner"}</strong>
              </span>
              <NotificationBell />
              <button className="avatar-btn" onClick={() => router.push("/dashboard/partner/settings")}>
                {me?.profilePicture
                  ? <img src={me.profilePicture} alt="" className="avatar-img" />
                  : <span>{user?.fullName?.charAt(0).toUpperCase() || "P"}</span>
                }
              </button>
            </div>
          </header>
          <main className="partner-content">{children}</main>
          <footer className="partner-footer">
            Powered by <strong>UASE TECH STUDIO</strong> for CARSTRIMS 2026
          </footer>
        </div>
      </div>

      <style>{`
        .partner-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .sidebar{width:240px;min-height:100vh;background:#fff;border-right:1.5px solid #E5E5E5;display:flex;flex-direction:column;justify-content:space-between;position:fixed;left:0;top:0;bottom:0;z-index:100;overflow-y:auto}
        .sidebar-top{display:flex;flex-direction:column}
        .sidebar-brand{display:flex;align-items:center;gap:0.6rem;padding:1.25rem;border-bottom:1px solid #E5E5E5;background:#1A1A1A}
        .brand-icon{font-size:1.2rem;color:#F47B20}
        .brand-name{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.2em;color:#fff}
        .partner-badge{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#EFF6FF;text-decoration:none;transition:background 0.2s}
        .partner-badge:hover{background:#DBEAFE}
        .partner-avatar{width:36px;height:36px;border-radius:50%;background:#3B8BD4;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid #3B8BD4}
        .partner-avatar img{width:100%;height:100%;object-fit:cover}
        .partner-info{flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0.1rem}
        .partner-name{font-size:0.82rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .partner-role{font-size:0.68rem;color:#3B8BD4}
        .edit-icon{font-size:0.75rem;color:#AAA;flex-shrink:0}
        .sidebar-nav{display:flex;flex-direction:column;padding:0.5rem 0;gap:1px}
        .nav-item{display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1.25rem;text-decoration:none;color:#666;font-size:0.85rem;transition:all 0.15s;border-left:3px solid transparent}
        .nav-item:hover{color:#3B8BD4;background:#EFF6FF}
        .nav-item.active{color:#3B8BD4;background:rgba(59,139,212,0.06);border-left-color:#3B8BD4;font-weight:600}
        .feed-nav{color:#AAA!important}
        .feed-nav:hover{color:#3B8BD4!important}
        .nav-icon{font-size:0.95rem;width:18px;text-align:center;flex-shrink:0}
        .nav-label{flex:1}
        .nav-divider{height:1px;background:#E5E5E5;margin:0.4rem 1.25rem}
        .sidebar-bottom{padding:1rem 1.25rem;border-top:1px solid #E5E5E5}
        .dev-note{font-size:0.62rem;color:#CCC;letter-spacing:0.04em;text-align:center;margin-bottom:0.5rem}
        .logout-btn{display:flex;align-items:center;gap:0.75rem;width:100%;padding:0.65rem 0;background:none;border:none;color:#999;font-size:0.85rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .logout-btn:hover{color:#DC2626}
        .partner-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .partner-topbar{height:60px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.75rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        .topbar-left{display:flex;flex-direction:column}
        .page-date{font-size:0.72rem;color:#AAA}
        .topbar-right{display:flex;align-items:center;gap:0.875rem}
        .greeting{font-size:0.82rem;color:#888}
        .greeting strong{color:#3B8BD4}
        .avatar-btn{width:34px;height:34px;border-radius:50%;border:2px solid #3B8BD4;background:#EFF6FF;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.9rem;color:#3B8BD4;transition:all 0.2s}
        .avatar-btn:hover{transform:scale(1.05)}
        .avatar-img{width:100%;height:100%;object-fit:cover}
        .partner-content{flex:1;padding:1.75rem;max-width:1400px;width:100%}
        .partner-footer{padding:1rem 1.75rem;border-top:1px solid #E5E5E5;font-size:0.7rem;color:#CCC;background:#fff;text-align:center}
        .partner-footer strong{color:#3B8BD4}
        @media(max-width:768px){.partner-main{margin-left:200px}.partner-content{padding:1.25rem}}
        @media(max-width:640px){.partner-shell{flex-direction:column}.partner-main{margin-left:0}.partner-content{padding:1rem}}
      `}</style>
            <MessagesWidget accentColor="#F47B20" />
      </AuthGuard>
  );
}

