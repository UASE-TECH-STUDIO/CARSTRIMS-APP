"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import OrganizationSidebar from "@/components/layout/OrganizationSidebar";
import MessagesWidget from "@/components/shared/MessagesWidget";
import GlobalSearchModal from "@/components/shared/GlobalSearchModal";
import SearchHint from "@/components/shared/SearchHint";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/hooks/useSidebar";
import NotificationBell from "@/components/ui/NotificationBell";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const IconSignout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>;

// Adapted from the Dealer layout's PAGE_TITLES - no Requests,
// Appointments, or Partners entries, since those pages don't exist
// for an Organization account at all.
const PAGE_TITLES: Record<string,string> = {
  "/dashboard/organization":"Overview",
  "/dashboard/organization/cars":"Vehicles & Fleet",
  "/dashboard/organization/expenses":"Expenses",
  "/dashboard/organization/staff":"Staff Management",
  "/dashboard/organization/movements":"Vehicle Movement",
  "/dashboard/organization/cctv":"CCTV Monitoring",
  "/dashboard/organization/reports":"Reports & Analytics",
  "/dashboard/organization/notifications":"Notifications",
  "/dashboard/organization/settings":"Settings",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h>=5&&h<12) return "Good morning";
  if (h>=12&&h<17) return "Good afternoon";
  if (h>=17&&h<21) return "Good evening";
  return "Good night";
}

function OrganizationShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebar();
  const { user, logout } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [org, setOrg] = useState<any>(null);
  const title = PAGE_TITLES[pathname] || "Dashboard";

  useEffect(() => { close(); }, [pathname]);

  useEffect(() => {
    if (pathname.includes("/setup")) { setReady(true); return; }
    // Real backend dependency: /api/v1/organizations/me needs to
    // exist, mirroring /api/v1/dealers/me but scoped to the
    // organization's own private account only.
    api.get("/api/v1/organizations/me")
      .then((r) => {
        setOrg(r.data);
        if (!r.data?.companyName) router.replace("/dashboard/organization/setup");
        else setReady(true);
      })
      .catch(() => router.replace("/dashboard/organization/setup"));
  }, [pathname, router]);

  if (!ready && !pathname.includes("/setup")) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (pathname.includes("/setup")) return <>{children}</>;

  return (
    <div className="dealer-shell">
      {isOpen && <div className="mobile-overlay" onClick={close}/>}
      <OrganizationSidebar isOpen={isOpen} onClose={close}/>
      <div className="shell-main">
        <header className="shell-topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={toggle} aria-label="Toggle menu">
              <span className="hb-line"/>
              <span className="hb-line"/>
              <span className="hb-line"/>
            </button>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-date">{new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="greeting-text">
              {getGreeting()}, <strong className="greeting-name">{user?.fullName?.split(" ")[0]||"there"}</strong>
            </span>
            {/* Deliberately no FeedHomeButton here - an Organization
                account is not a marketplace participant, so linking
                back to the public feed doesn't fit its workflow the
                way it does for a Dealer. */}
            <div style={{position:"relative"}}>
              <button className="search-topbar-btn" onClick={()=>setShowSearch(true)} title="Search" aria-label="Search">🔍</button>
              <SearchHint onUseSearch={() => setShowSearch(true)} />
            </div>
            <NotificationBell role="dealer"/>
            <button className="avatar-btn" onClick={()=>router.push("/dashboard/organization/settings")}>
              {org?.logo
                ? <img src={org.logo} alt="" className="avatar-img"/>
                : <span className="avatar-letter">{user?.fullName?.charAt(0).toUpperCase()||"O"}</span>
              }
            </button>
            <button className="logout-topbar-btn" onClick={() => { logout(); router.push("/login"); }} title="Sign Out">
              <IconSignout/>
            </button>
          </div>
        </header>
        {showSearch && <GlobalSearchModal onClose={() => setShowSearch(false)} role="dealer" />}

        <main className="shell-content">{children}</main>
      </div>

      {!pathname?.endsWith("/messages") && <MessagesWidget accentColor="#F47B20"/>}

      <style>{`
        .dealer-shell{display:flex;min-height:100vh;background:#F5F5F5;position:relative}
        .mobile-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:55;cursor:pointer}
        .shell-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .shell-topbar{height:calc(64px + var(--sat, 0px));background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.75rem;padding-top:var(--sat, 0px);position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.06);flex-shrink:0;gap:1rem}
        .topbar-left{display:flex;align-items:center;gap:0.875rem;min-width:0}
        .hamburger-btn{display:none;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:0.4rem;border-radius:6px;flex-shrink:0}
        .hamburger-btn:hover{background:#F5F5F5}
        .hb-line{display:block;width:20px;height:2px;background:#525252;border-radius:2px}
        .page-title{font-family:var(--font-display);font-size:1.15rem;letter-spacing:0.06em;color:#1A1A1A;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .page-date{font-size:0.65rem;color:#AAA;letter-spacing:0.04em}
        .topbar-right{display:flex;align-items:center;gap:0.875rem;flex-shrink:0}
        .search-topbar-btn{background:none;border:none;font-size:1.05rem;cursor:pointer;padding:0.25rem;line-height:1;color:#737373}
        .greeting-text{font-size:0.8rem;color:#888;white-space:nowrap}
        .greeting-name{color:#F47B20;font-weight:600}
        .avatar-btn{width:36px;height:36px;border-radius:50%;border:2px solid #F47B20;background:#FFF0E6;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;padding:0}
        .avatar-btn:hover{border-color:#FF9340;transform:scale(1.05)}
        .avatar-img{width:100%;height:100%;object-fit:cover}
        .avatar-letter{font-family:var(--font-display);font-size:1rem;color:#F47B20;font-weight:600}
        .logout-topbar-btn{background:none;border:1px solid #E5E5E5;border-radius:6px;color:#AAA;cursor:pointer;padding:0.3rem 0.5rem;transition:all 0.2s;display:flex;align-items:center;justify-content:center}
        .logout-topbar-btn:hover{color:#DC2626;border-color:#FCA5A5;background:#FEF2F2}
        .shell-content{flex:1;padding:1.75rem;width:100%;box-sizing:border-box}
        @media(max-width:768px){
          .hamburger-btn{display:flex!important}
          .shell-main{margin-left:0}
          .shell-content{padding:1rem}
          .greeting-text{display:none}
          .page-date{display:none}
          .shell-topbar{padding:0 1rem}
        }
        @media(min-width:769px){
          .hamburger-btn{display:none!important}
        }
      `}</style>
    </div>
  );
}

export default function OrganizationLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["ORGANIZATION_ADMIN"]}>
      <OrganizationShell>{children}</OrganizationShell>
    </AuthGuard>
  );
}
