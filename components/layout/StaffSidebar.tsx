"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const ALL_NAV = [
  { href:"/dashboard/staff", label:"Overview", icon:"⊞", exact:true, perm:null },
  { href:"/dashboard/staff/inventory", label:"Cars & Inventory", icon:"🚗", perm:"view_inventory" },
  { href:"/dashboard/staff/sales", label:"Sales", icon:"💰", perm:"view_sales" },
  { href:"/dashboard/staff/staff", label:"Staff", icon:"👥", perm:"view_staff" },
  { href:"/dashboard/staff/partners", label:"Partners", icon:"🤝", perm:"view_partners" },
  { href:"/dashboard/staff/movements", label:"Movements", icon:"🔄", perm:"view_movements" },
  { href:"/dashboard/staff/cctv", label:"CCTV", icon:"📹", perm:"view_cctv" },
  { href:"/dashboard/staff/reports", label:"Reports", icon:"📊", perm:"view_reports" },
  { href:"/dashboard/staff/notifications", label:"Notifications", icon:"🔔", perm:null },
  { href:"/dashboard/staff/settings", label:"Settings", icon:"⚙️", perm:null },
];

interface Props { staffInfo?: any; }

export default function StaffSidebar({ staffInfo }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const permissions: string[] = staffInfo?.permissions || [];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const hasAccess = (perm: string | null) => !perm || permissions.includes(perm);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">CARSTRIMS</span>
        </div>

        <div className="staff-badge">
          <div className="staff-avatar">
            {staffInfo?.profilePicture
              ? <img src={staffInfo.profilePicture} alt="" />
              : user?.fullName?.charAt(0).toUpperCase() || "S"
            }
          </div>
          <div className="staff-info">
            <span className="staff-name">{user?.fullName || "Staff"}</span>
            <span className="staff-pos">{staffInfo?.position || "Staff Member"}</span>
            <span className="staff-id-badge">{staffInfo?.staffId || ""}</span>
          </div>
        </div>

        {permissions.length > 0 && (
          <div className="perms-mini">
            <div className="pm-label">PERMISSIONS ({permissions.length})</div>
            <div className="pm-pills">
              {permissions.map((p) => (
                <span key={p} className="pm-pill">{p.replace(/_/g," ")}</span>
              ))}
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {ALL_NAV.map((item) => hasAccess(item.perm) && (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
            >
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

      <style>{`
        .sidebar{width:240px;min-height:100vh;background:#fff;border-right:1.5px solid #E5E5E5;display:flex;flex-direction:column;justify-content:space-between;position:fixed;left:0;top:0;bottom:0;z-index:100;overflow-y:auto}
        .sidebar-top{display:flex;flex-direction:column}
        .sidebar-brand{display:flex;align-items:center;gap:0.6rem;padding:1.25rem;border-bottom:1px solid #E5E5E5;background:#1A1A1A}
        .brand-icon{font-size:1.2rem;color:#F47B20}
        .brand-name{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.2em;color:#fff}
        .staff-badge{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#F5F5F5}
        .staff-avatar{width:36px;height:36px;border-radius:50%;background:#737373;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid #737373}
        .staff-avatar img{width:100%;height:100%;object-fit:cover}
        .staff-info{display:flex;flex-direction:column;gap:0.1rem;overflow:hidden}
        .staff-name{font-size:0.82rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .staff-pos{font-size:0.68rem;color:#737373}
        .staff-id-badge{font-family:var(--font-mono);font-size:0.6rem;color:#AAA}
        .perms-mini{padding:0.625rem 1rem;border-bottom:1px solid #E5E5E5;background:#FAFFFE}
        .pm-label{font-size:0.58rem;letter-spacing:0.12em;text-transform:uppercase;color:#AAA;margin-bottom:0.35rem}
        .pm-pills{display:flex;flex-wrap:wrap;gap:0.2rem}
        .pm-pill{background:rgba(115,115,115,0.1);border:1px solid rgba(115,115,115,0.25);color:#737373;font-size:0.58rem;padding:0.1rem 0.4rem;border-radius:20px;text-transform:capitalize;white-space:nowrap}
        .sidebar-nav{display:flex;flex-direction:column;padding:0.5rem 0;gap:1px}
        .nav-item{display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1.25rem;text-decoration:none;color:#666;font-size:0.85rem;transition:all 0.15s;border-left:3px solid transparent}
        .nav-item:hover{color:#737373;background:#F5F5F5}
        .nav-item.active{color:#737373;background:rgba(115,115,115,0.06);border-left-color:#737373;font-weight:600}
        .feed-nav{color:#AAA!important}
        .feed-nav:hover{color:#737373!important}
        .nav-icon{font-size:0.95rem;width:18px;text-align:center;flex-shrink:0}
        .nav-label{flex:1}
        .nav-divider{height:1px;background:#E5E5E5;margin:0.4rem 1.25rem}
        .sidebar-bottom{padding:1rem 1.25rem;border-top:1px solid #E5E5E5}
        .dev-note{font-size:0.62rem;color:#CCC;letter-spacing:0.04em;text-align:center;margin-bottom:0.5rem}
        .logout-btn{display:flex;align-items:center;gap:0.75rem;width:100%;padding:0.65rem 0;background:none;border:none;color:#999;font-size:0.85rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .logout-btn:hover{color:#DC2626}
        @media(max-width:768px){.sidebar{width:200px}}
      `}</style>
    </aside>
  );
}

