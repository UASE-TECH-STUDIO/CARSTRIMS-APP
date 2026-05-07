"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href:"/dashboard/partner", label:"Overview", icon:"⊞", exact:true },
  { href:"/dashboard/partner/cars", label:"My Cars", icon:"🚗" },
  { href:"/dashboard/partner/dealers", label:"My Dealers", icon:"🏢" },
  { href:"/dashboard/partner/movements", label:"Movements", icon:"🔄" },
  { href:"/dashboard/partner/earnings", label:"Earnings", icon:"💰" },
  { href:"/dashboard/partner/find-dealer", label:"Find Dealer", icon:"🔍" },
  { href:"/dashboard/partner/notifications", label:"Notifications", icon:"🔔" },
  { href:"/dashboard/partner/settings", label:"Settings", icon:"⚙️" },
];

export default function PartnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand"><span style={{color:"var(--gold)"}}>◈</span><span className="brand-name">CARSTRIMS</span></div>
        <div className="partner-badge">
          <div className="partner-avatar">{user?.fullName?.charAt(0).toUpperCase() || "P"}</div>
          <div><div className="partner-name">{user?.fullName || "Partner"}</div><div className="partner-role">Partner Account</div></div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <button className="logout-btn" onClick={() => { logout(); router.push("/auth/login"); }}>↩ Sign Out</button>
      </div>
      <style>{`
        .sidebar{width:240px;min-height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between;position:fixed;left:0;top:0;bottom:0;z-index:100;overflow-y:auto}
        .sidebar-top{display:flex;flex-direction:column}
        .sidebar-brand{display:flex;align-items:center;gap:0.6rem;padding:1.5rem 1.25rem 1.25rem;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.2em;color:var(--text)}
        .brand-name{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.2em}
        .partner-badge{display:flex;align-items:center;gap:0.75rem;padding:1rem 1.25rem;border-bottom:1px solid var(--border);background:var(--surface-2)}
        .partner-avatar{width:34px;height:34px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .partner-name{font-size:0.82rem;font-weight:500;color:var(--text)}
        .partner-role{font-size:0.68rem;color:#F47B20}
        .sidebar-nav{display:flex;flex-direction:column;padding:0.75rem 0;gap:1px}
        .nav-item{display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1.25rem;text-decoration:none;color:var(--text-muted);font-size:0.85rem;transition:all 0.15s;border-left:2px solid transparent}
        .nav-item:hover{color:var(--text);background:var(--surface-2)}
        .nav-item.active{color:#F47B20;background:rgba(244,123,32,0.06);border-left-color:#F47B20;font-weight:500}
        .nav-icon{font-size:0.95rem;width:18px;text-align:center;flex-shrink:0}
        .sidebar-bottom{padding:1rem 1.25rem;border-top:1px solid var(--border)}
        .logout-btn{display:flex;align-items:center;gap:0.75rem;width:100%;padding:0.7rem 0;background:none;border:none;color:var(--text-dim);font-size:0.85rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .logout-btn:hover{color:var(--error)}
      `}</style>
    </aside>
  );
}



