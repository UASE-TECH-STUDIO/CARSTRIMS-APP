"use client";
import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/ui/NotificationBell";
import MessagesWidget from "@/components/shared/MessagesWidget";
import Link from "next/link";

const NAV = [
  { href:"/dashboard/super-admin",           label:"Overview",    icon:"▦", exact:true },
  { href:"/dashboard/super-admin/dealers",   label:"Dealers",     icon:"🏢" },
  { href:"/dashboard/super-admin/approvals", label:"Approvals",   icon:"⏳" },
  { href:"/dashboard/super-admin/users",     label:"All Users",   icon:"👥" },
  { href:"/dashboard/super-admin/analytics", label:"Analytics",   icon:"📊" },
  { href:"/dashboard/super-admin/broadcast", label:"Broadcast",   icon:"📢" },
  { href:"/dashboard/super-admin/activity",  label:"Activity Log",icon:"📋" },
  { href:"/dashboard/super-admin/settings",  label:"Settings",    icon:"⚙" },
];

const PAGE_TITLES: Record<string,string> = {
  "/dashboard/super-admin":           "Overview",
  "/dashboard/super-admin/dealers":   "All Dealers",
  "/dashboard/super-admin/approvals": "Pending Approvals",
  "/dashboard/super-admin/users":     "All Users",
  "/dashboard/super-admin/analytics": "Analytics",
  "/dashboard/super-admin/broadcast": "Broadcast",
  "/dashboard/super-admin/activity":  "Activity Log",
  "/dashboard/super-admin/settings":  "Settings",
};

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const [ready,    setReady]    = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  // Wait for auth store to hydrate, then check role
  useEffect(() => {
    // Give Zustand time to rehydrate from localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }
      if (user?.role !== "SYSTEM_ADMIN") {
        router.replace("/feed");
        return;
      }
      setReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  // Close sidebar on nav
  useEffect(() => { setSideOpen(false); }, [pathname]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const title = PAGE_TITLES[pathname] || "Admin";

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

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      {sideOpen && <div className="admin-overlay" onClick={() => setSideOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sideOpen ? " open" : ""}`}>
        <div className="sb-brand">
          <span style={{fontSize:"1.1rem",color:"#F47B20"}}>◈</span>
          <span className="sb-bn">CARSTRIMS</span>
          <button className="sb-x" onClick={() => setSideOpen(false)}>✕</button>
        </div>

        <div className="sb-admin-badge">
          <div className="sb-admin-dot"/>
          <span>SYSTEM ADMIN</span>
        </div>

        <nav className="sb-nav">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sb-item${isActive(item.href, item.exact) ? " active" : ""}`}
            >
              <span className="sb-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="sb-div"/>
          <Link href="/feed" className="sb-item feed">
            <span className="sb-icon">⌂</span>
            <span>View Feed</span>
          </Link>
        </nav>

        <div className="sb-bot">
          <div style={{fontSize:"0.6rem",color:"#C0C0C0",textAlign:"center",marginBottom:"0.5rem"}}>
            Powered by <strong style={{color:"#F47B20"}}>UASE TECH STUDIO</strong>
          </div>
          <Link href="/login" className="sb-out">↩ Sign Out</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSideOpen(true)}>
              <span className="hb"/><span className="hb"/><span className="hb"/>
            </button>
            <div>
              <h1 className="topbar-title">{title}</h1>
              <p className="topbar-date">
                {new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
              </p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-greeting">
              Admin, <strong style={{color:"#F47B20"}}>{user?.fullName?.split(" ")[0] || "Admin"}</strong>
            </span>
            <NotificationBell/>
            <div className="admin-avatar">
              {user?.fullName?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>

      <MessagesWidget accentColor="#F47B20"/>

      <style>{`
        .admin-shell{display:flex;min-height:100vh;background:#F5F5F5;position:relative}
        .admin-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:55;cursor:pointer;display:none}

        /* Sidebar */
        .admin-sidebar{
          width:240px;height:100vh;background:#1A1A1A;
          display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:60;
          overflow-y:auto;transition:transform 0.25s ease;
        }
        .sb-brand{display:flex;align-items:center;gap:0.6rem;padding:0 1rem;background:#111;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;height:64px}
        .sb-bn{font-family:var(--font-display);font-size:1rem;letter-spacing:0.2em;color:#fff;flex:1}
        .sb-x{display:none;background:none;border:none;color:#888;font-size:1rem;cursor:pointer;padding:0.25rem;flex-shrink:0}
        .sb-x:hover{color:#fff}
        .sb-admin-badge{
          display:flex;align-items:center;gap:0.5rem;
          padding:0.625rem 1rem;background:rgba(244,123,32,0.12);
          border-bottom:1px solid rgba(244,123,32,0.2);flex-shrink:0;
          font-size:0.65rem;font-weight:700;letter-spacing:0.12em;color:#F47B20;
        }
        .sb-admin-dot{width:6px;height:6px;border-radius:50%;background:#F47B20;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .sb-nav{display:flex;flex-direction:column;flex:1;padding:0.5rem 0;overflow-y:auto}
        .sb-item{
          display:flex;align-items:center;gap:0.75rem;padding:0.625rem 1rem;
          text-decoration:none;color:#A3A3A3;font-size:0.82rem;
          transition:all 0.15s;border-left:3px solid transparent;white-space:nowrap;
        }
        .sb-item:hover{color:#fff;background:rgba(255,255,255,0.06)}
        .sb-item.active{color:#F47B20;background:rgba(244,123,32,0.1);border-left-color:#F47B20;font-weight:600}
        .sb-item.feed{color:#525252}
        .sb-item.feed:hover{color:#A3A3A3}
        .sb-icon{font-size:0.9rem;width:16px;text-align:center;flex-shrink:0}
        .sb-div{height:1px;background:rgba(255,255,255,0.08);margin:0.4rem 1rem}
        .sb-bot{padding:0.875rem 1rem;border-top:1px solid rgba(255,255,255,0.08);flex-shrink:0}
        .sb-out{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0;color:#A3A3A3;font-size:0.82rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s;text-decoration:none}
        .sb-out:hover{color:#DC2626}

        /* Main */
        .admin-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .admin-topbar{
          height:64px;background:#fff;border-bottom:1.5px solid #E5E5E5;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 1.75rem;position:sticky;top:0;z-index:50;
          box-shadow:0 1px 4px rgba(0,0,0,0.06);flex-shrink:0;gap:1rem;
        }
        .topbar-left{display:flex;align-items:center;gap:0.875rem;min-width:0}
        .hamburger-btn{display:none;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:0.4rem;border-radius:6px;flex-shrink:0}
        .hamburger-btn:hover{background:#F5F5F5}
        .hb{display:block;width:20px;height:2px;background:#525252;border-radius:2px}
        .topbar-title{font-family:var(--font-display);font-size:1.15rem;letter-spacing:0.06em;color:#1A1A1A;line-height:1}
        .topbar-date{font-size:0.65rem;color:#AAA;letter-spacing:0.04em}
        .topbar-right{display:flex;align-items:center;gap:0.875rem;flex-shrink:0}
        .topbar-greeting{font-size:0.8rem;color:#888;white-space:nowrap}
        .admin-avatar{
          width:34px;height:34px;border-radius:50%;
          background:#F47B20;color:#fff;
          font-family:var(--font-display);font-size:1rem;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          border:2px solid rgba(244,123,32,0.3);
        }
        .admin-content{flex:1;padding:1.75rem;width:100%;box-sizing:border-box}

        /* Responsive */
        @media(max-width:768px){
          .hamburger-btn{display:flex!important}
          .admin-overlay{display:block!important}
          .admin-sidebar{transform:translateX(-100%)}
          .admin-sidebar.open{transform:translateX(0);box-shadow:8px 0 32px rgba(0,0,0,0.4)}
          .sb-x{display:block}
          .admin-main{margin-left:0}
          .admin-content{padding:1rem}
          .topbar-greeting{display:none}
          .topbar-date{display:none}
          .admin-topbar{padding:0 1rem}
        }
        @media(min-width:769px){
          .hamburger-btn{display:none!important}
          .admin-sidebar{transform:translateX(0)!important}
          .admin-overlay{display:none!important}
        }
      `}</style>
    </div>
  );
}
