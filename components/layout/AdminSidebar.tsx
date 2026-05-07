"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href:"/dashboard/super-admin", label:"Overview", icon:"⊞", exact:true },
  { href:"/dashboard/super-admin/dealers", label:"All Dealers", icon:"🏢" },
  { href:"/dashboard/super-admin/users", label:"All Users", icon:"👥" },
  { href:"/dashboard/super-admin/approvals", label:"Approvals", icon:"✅" },
  { href:"/dashboard/super-admin/analytics", label:"Analytics", icon:"📊" },
  { href:"/dashboard/super-admin/activity", label:"Activity Feed", icon:"📡" },
  { href:"/dashboard/super-admin/broadcast", label:"Broadcast", icon:"📢" },
  { href:"/dashboard/super-admin/create-dealer", label:"Create Dealer", icon:"➕" },
  { href:"/dashboard/super-admin/settings", label:"Settings", icon:"⚙️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span style={{color:"var(--gold)"}}>◈</span>
          <span className="brand-name">CARSTRIMS</span>
        </div>
        <div className="admin-badge">
          <div className="admin-avatar">A</div>
          <div>
            <div className="admin-name">{user?.fullName || "Admin"}</div>
            <div className="admin-role">Super Admin</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="nav-divider" />
          <Link href="/feed" className="nav-item feed-link">
            <span className="nav-icon">🏠</span>
            <span>View Feed</span>
          </Link>
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="dev-credit">Built by UASE TECH STUDIO</div>
        <button className="logout-btn" onClick={() => { logout(); router.push("/auth/login"); }}>
          ↩ Sign Out
        </button>
      </div>
      <style>{`
        .sidebar{width:240px;min-height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between;position:fixed;left:0;top:0;bottom:0;z-index:100;overflow-y:auto}
        .sidebar-top{display:flex;flex-direction:column}
        .sidebar-brand{display:flex;align-items:center;gap:0.6rem;padding:1.5rem 1.25rem 1.25rem;border-bottom:1px solid var(--border)}
        .brand-name{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.2em;color:var(--text)}
        .admin-badge{display:flex;align-items:center;gap:0.75rem;padding:1rem 1.25rem;border-bottom:1px solid var(--border);background:var(--surface-2)}
        .admin-avatar{width:34px;height:34px;border-radius:50%;background:var(--error);color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .admin-name{font-size:0.82rem;font-weight:500;color:var(--text)}
        .admin-role{font-size:0.68rem;color:var(--error)}
        .sidebar-nav{display:flex;flex-direction:column;padding:0.75rem 0;gap:1px}
        .nav-item{display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1.25rem;text-decoration:none;color:var(--text-muted);font-size:0.85rem;transition:all 0.15s;border-left:2px solid transparent}
        .nav-item:hover{color:var(--text);background:var(--surface-2)}
        .nav-item.active{color:var(--error);background:rgba(224,82,82,0.06);border-left-color:var(--error);font-weight:500}
        .nav-divider{height:1px;background:var(--border);margin:0.5rem 1.25rem}
        .feed-link{color:var(--text-dim)!important}
        .feed-link:hover{color:var(--gold)!important}
        .nav-icon{font-size:0.95rem;width:18px;text-align:center;flex-shrink:0}
        .sidebar-bottom{padding:1rem 1.25rem;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:0.5rem}
        .dev-credit{font-size:0.65rem;color:var(--text-dim);letter-spacing:0.04em;text-align:center}
        .logout-btn{display:flex;align-items:center;gap:0.75rem;width:100%;padding:0.6rem 0;background:none;border:none;color:var(--text-dim);font-size:0.85rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .logout-btn:hover{color:var(--error)}
      `}</style>
    </aside>
  );
}

