"use client";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/ui/NotificationBell";
import MessagesWidget from "@/components/shared/MessagesWidget";
import Link from "next/link";
import api from "@/lib/api";

const PAGE_TITLES: Record<string,string> = {
  "/dashboard/staff":          "Overview",
  "/dashboard/staff/inventory":"Cars & Inventory",
  "/dashboard/staff/sales":    "Sales",
  "/dashboard/staff/staff":    "Staff",
  "/dashboard/staff/partners": "Partners",
  "/dashboard/staff/movements":"Vehicle Movements",
  "/dashboard/staff/cctv":     "CCTV Monitoring",
  "/dashboard/staff/reports":  "Reports",
  "/dashboard/staff/notifications":"Notifications",
  "/dashboard/staff/settings": "Settings",
};

const ALL_NAV = [
  { href:"/dashboard/staff",           label:"Overview",       icon:"▦", exact:true, perm:null },
  { href:"/dashboard/staff/inventory", label:"Cars & Inventory",icon:"▣", perm:"view_inventory" },
  { href:"/dashboard/staff/sales",     label:"Sales",           icon:"◈", perm:"view_sales" },
  { href:"/dashboard/staff/staff",     label:"Staff",           icon:"◉", perm:"view_staff" },
  { href:"/dashboard/staff/partners",  label:"Partners",        icon:"◎", perm:"view_partners" },
  { href:"/dashboard/staff/movements", label:"Movements",       icon:"↺", perm:"view_movements" },
  { href:"/dashboard/staff/cctv",      label:"CCTV",            icon:"◑", perm:"view_cctv" },
  { href:"/dashboard/staff/reports",   label:"Reports",         icon:"▤", perm:"view_reports" },
  { href:"/dashboard/staff/notifications",label:"Notifications",icon:"◓", perm:null },
  { href:"/dashboard/staff/settings",  label:"Settings",        icon:"⚙", perm:null },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h>=5&&h<12) return "Good morning";
  if (h>=12&&h<17) return "Good afternoon";
  if (h>=17&&h<21) return "Good evening";
  return "Good night";
}

export default function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  const [staff,    setStaff]    = useState<any>(null);
  const [dealer,   setDealer]   = useState<any>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [ready,    setReady]    = useState(false);

  const title = PAGE_TITLES[pathname] || "Staff Dashboard";
  const perms: string[] = staff?.permissions || [];
  const hasAccess = (perm: string|null) => !perm || perms.includes(perm);
  const isActive  = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Close sidebar on route change
  useEffect(() => { setSideOpen(false); }, [pathname]);

  // Load staff profile and dealer info
  useEffect(() => {
    const load = async () => {
      try {
        const staffRes = await api.get("/api/v1/staff/me");
        setStaff(staffRes.data);
        // Load the dealer this staff belongs to
        const dealerRes = await api.get("/api/v1/staff/me/dealer");
        setDealer(dealerRes.data);
      } catch {
        // If staff profile not found, stay on overview
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  if (!ready) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="staff-shell">
      {/* Mobile overlay */}
      {sideOpen && <div className="staff-overlay" onClick={() => setSideOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`staff-sidebar${sideOpen ? " open" : ""}`}>
        <div className="sb-brand">
          <span className="sb-bi">◈</span>
          <span className="sb-bn">CARSTRIMS</span>
          <button className="sb-x" onClick={() => setSideOpen(false)}>✕</button>
        </div>

        {/* Staff profile */}
        <div className="sb-profile">
          <div className="sb-av" style={{background:"#1D9E75",border:"2px solid rgba(29,158,117,0.4)"}}>
            {staff?.profilePicture
              ? <img src={staff.profilePicture} alt=""/>
              : <span>{user?.fullName?.charAt(0).toUpperCase() || "S"}</span>
            }
          </div>
          <div className="sb-info">
            <div className="sb-name">{user?.fullName || "Staff Member"}</div>
            <div className="sb-pos">{staff?.position || "Staff"}</div>
            {staff?.staffId && <div className="sb-id">{staff.staffId}</div>}
          </div>
        </div>

        {/* Dealer name */}
        {dealer?.companyName && (
          <div className="sb-dealer">
            {dealer.logo && <img src={dealer.logo} alt="" className="sb-dealer-logo"/>}
            <span>{dealer.companyName}</span>
          </div>
        )}

        {/* Permissions pills */}
        {perms.length > 0 && (
          <div className="sb-perms">
            {perms.map(p => (
              <span key={p} className="perm-pill">{p.replace(/_/g," ")}</span>
            ))}
          </div>
        )}

        <nav className="sb-nav">
          {ALL_NAV.map(item => hasAccess(item.perm) && (
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
          <div className="sb-dev">Powered by <strong>UASE TECH STUDIO</strong></div>
          <button className="sb-out" onClick={() => { logout(); router.push("/login"); }}>↩ Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="staff-main">
        {/* Topbar */}
        <header className="staff-topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSideOpen(true)} aria-label="Open menu">
              <span className="hb-line"/><span className="hb-line"/><span className="hb-line"/>
            </button>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-date">{new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="greeting-text">
              {getGreeting()}, <strong className="greeting-name">{user?.fullName?.split(" ")[0] || "Staff"}</strong>
            </span>
            <NotificationBell/>
            <div className="avatar-circle" style={{background:"#1D9E75"}}>
              {user?.fullName?.charAt(0).toUpperCase() || "S"}
            </div>
          </div>
        </header>

        <main className="staff-content">{children}</main>
      </div>

      <MessagesWidget accentColor="#1D9E75"/>

      <style>{`
        .staff-shell{display:flex;min-height:100vh;background:#F5F5F5;position:relative}
        .staff-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:55;cursor:pointer;display:none}

        /* Sidebar */
        .staff-sidebar{
          width:240px;height:100vh;background:#fff;border-right:1.5px solid #E5E5E5;
          display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:60;
          overflow-y:auto;transition:transform 0.25s ease;
        }
        .sb-brand{display:flex;align-items:center;gap:0.6rem;padding:0 1rem;background:#1A1A1A;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;height:64px}
        .sb-bi{font-size:1.1rem;color:#1D9E75}
        .sb-bn{font-family:var(--font-display);font-size:1rem;letter-spacing:0.2em;color:#fff;flex:1}
        .sb-x{display:none;background:none;border:none;color:#aaa;font-size:1rem;cursor:pointer;padding:0.25rem;flex-shrink:0}
        .sb-x:hover{color:#fff}
        .sb-profile{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#F0FDF9;flex-shrink:0}
        .sb-av{width:36px;height:36px;border-radius:50%;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
        .sb-av img{width:100%;height:100%;object-fit:cover}
        .sb-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:0.06rem}
        .sb-name{font-size:0.8rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sb-pos{font-size:0.65rem;color:#737373}
        .sb-id{font-family:monospace;font-size:0.58rem;color:#A3A3A3}
        .sb-dealer{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-bottom:1px solid #E5E5E5;background:#F5F5F5;font-size:0.75rem;color:#525252;flex-shrink:0}
        .sb-dealer-logo{width:18px;height:18px;border-radius:3px;object-fit:cover}
        .sb-perms{display:flex;flex-wrap:wrap;gap:0.2rem;padding:0.5rem 1rem;border-bottom:1px solid #E5E5E5;background:#FAFAFA;flex-shrink:0}
        .perm-pill{background:#F0FDF9;border:1px solid rgba(29,158,117,0.3);color:#1D9E75;font-size:0.56rem;padding:0.1rem 0.4rem;border-radius:10px;text-transform:capitalize;white-space:nowrap}
        .sb-nav{display:flex;flex-direction:column;flex:1;padding:0.5rem 0;overflow-y:auto}
        .sb-item{display:flex;align-items:center;gap:0.75rem;padding:0.625rem 1rem;text-decoration:none;color:#525252;font-size:0.82rem;transition:all 0.15s;border-left:3px solid transparent;white-space:nowrap}
        .sb-item:hover{color:#1D9E75;background:#F0FDF9}
        .sb-item.active{color:#1D9E75;background:rgba(29,158,117,0.06);border-left-color:#1D9E75;font-weight:600}
        .sb-item.feed{color:#A3A3A3}
        .sb-item.feed:hover{color:#1D9E75}
        .sb-icon{font-size:0.9rem;width:16px;text-align:center;flex-shrink:0}
        .sb-div{height:1px;background:#E5E5E5;margin:0.4rem 1rem}
        .sb-bot{padding:0.875rem 1rem;border-top:1px solid #E5E5E5;flex-shrink:0}
        .sb-dev{font-size:0.6rem;color:#C0C0C0;text-align:center;margin-bottom:0.5rem}
        .sb-dev strong{color:#1D9E75}
        .sb-out{display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0;background:none;border:none;color:#A3A3A3;font-size:0.82rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .sb-out:hover{color:#DC2626}

        /* Main */
        .staff-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .staff-topbar{height:64px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.75rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.06);flex-shrink:0;gap:1rem}
        .topbar-left{display:flex;align-items:center;gap:0.875rem;min-width:0}
        .hamburger-btn{display:none;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:0.4rem;border-radius:6px;flex-shrink:0}
        .hamburger-btn:hover{background:#F5F5F5}
        .hb-line{display:block;width:20px;height:2px;background:#525252;border-radius:2px}
        .page-title{font-family:var(--font-display);font-size:1.15rem;letter-spacing:0.06em;color:#1A1A1A;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .page-date{font-size:0.65rem;color:#AAA;letter-spacing:0.04em}
        .topbar-right{display:flex;align-items:center;gap:0.875rem;flex-shrink:0}
        .greeting-text{font-size:0.8rem;color:#888;white-space:nowrap}
        .greeting-name{color:#1D9E75;font-weight:600}
        .avatar-circle{width:34px;height:34px;border-radius:50%;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .staff-content{flex:1;padding:1.75rem;width:100%;box-sizing:border-box}

        /* Mobile */
        @media(max-width:768px){
          .hamburger-btn{display:flex!important}
          .staff-overlay{display:block!important}
          .staff-sidebar{transform:translateX(-100%)}
          .staff-sidebar.open{transform:translateX(0);box-shadow:8px 0 32px rgba(0,0,0,0.2)}
          .sb-x{display:block}
          .staff-main{margin-left:0}
          .staff-content{padding:1rem}
          .greeting-text{display:none}
          .page-date{display:none}
          .staff-topbar{padding:0 1rem}
        }
        @media(min-width:769px){
          .hamburger-btn{display:none!important}
          .staff-sidebar{transform:translateX(0)!important}
          .staff-overlay{display:none!important}
        }
      `}</style>
    </div>
  );
}
