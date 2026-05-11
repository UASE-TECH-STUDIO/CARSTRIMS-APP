"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSidebar } from "@/hooks/useSidebar";

const NAV = [
  { href:"/dashboard/super-admin", label:"Overview", icon:"▦", exact:true },
  { href:"/dashboard/super-admin/dealers", label:"Dealers", icon:"▣" },
  { href:"/dashboard/super-admin/users", label:"Users", icon:"◉" },
  { href:"/dashboard/super-admin/approvals", label:"Approvals", icon:"◎" },
  { href:"/dashboard/super-admin/analytics", label:"Analytics", icon:"▨" },
  { href:"/dashboard/super-admin/activity", label:"Activity Log", icon:"▤" },
  { href:"/dashboard/super-admin/broadcast", label:"Broadcast", icon:"◔" },
  { href:"/dashboard/super-admin/create-dealer", label:"Create Dealer", icon:"▥" },
  { href:"/dashboard/super-admin/settings", label:"Settings", icon:"⚙" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { close } = useSidebar();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const handleNav = () => { if (window.innerWidth <= 768) close(); };

  return (
    <aside className="admin-sidebar">
      <div className="sb-brand">
        <span className="sb-bi">◈</span>
        <span className="sb-bn">CARSTRIMS</span>
        <button className="sb-x" onClick={close}>✕</button>
      </div>

      <div className="sb-profile">
        <div className="sb-av">{user?.fullName?.charAt(0).toUpperCase() || "A"}</div>
        <div className="sb-info">
          <div className="sb-name">{user?.fullName || "Admin"}</div>
          <div className="sb-role">Super Admin</div>
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={`sb-item ${isActive(item.href, (item as any).exact) ? "active" : ""}`}
            onClick={handleNav}>
            <span className="sb-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="sb-div" />
        <Link href="/feed" className="sb-item feed" onClick={handleNav}>
          <span className="sb-icon">⌂</span><span>View Feed</span>
        </Link>
      </nav>

      <div className="sb-bot">
        <div className="sb-dev">UASE TECH STUDIO · CARSTRIMS 2026</div>
        <button className="sb-out" onClick={() => { logout(); router.push("/login"); }}>↩ Sign Out</button>
      </div>

      <style>{`
        .admin-sidebar{width:240px;height:100vh;background:#fff;border-right:1.5px solid #E5E5E5;display:flex;flex-direction:column;overflow-y:auto}
        .sb-brand{display:flex;align-items:center;gap:0.6rem;padding:1.1rem 1rem;background:#1A1A1A;border-bottom:1px solid #E5E5E5;flex-shrink:0;min-height:56px}
        .sb-bi{font-size:1.1rem;color:#DC2626}
        .sb-bn{font-family:var(--font-display);font-size:1rem;letter-spacing:0.2em;color:#fff;flex:1}
        .sb-x{display:none;background:none;border:none;color:#888;font-size:1rem;cursor:pointer;padding:0.25rem}
        .sb-profile{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#FEF2F2;flex-shrink:0}
        .sb-av{width:34px;height:34px;border-radius:50%;background:#DC2626;color:#fff;font-family:var(--font-display);font-size:0.95rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sb-info{flex:1;min-width:0}
        .sb-name{font-size:0.8rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sb-role{font-size:0.65rem;color:#DC2626}
        .sb-nav{display:flex;flex-direction:column;flex:1;padding:0.4rem 0;overflow-y:auto}
        .sb-item{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 1rem;text-decoration:none;color:#525252;font-size:0.82rem;transition:all 0.15s;border-left:3px solid transparent;white-space:nowrap}
        .sb-item:hover{color:#DC2626;background:#FEF2F2}
        .sb-item.active{color:#DC2626;background:rgba(220,38,38,0.06);border-left-color:#DC2626;font-weight:600}
        .sb-item.feed{color:#A3A3A3}
        .sb-item.feed:hover{color:#DC2626}
        .sb-icon{font-size:0.9rem;width:16px;text-align:center;flex-shrink:0}
        .sb-div{height:1px;background:#E5E5E5;margin:0.4rem 1rem}
        .sb-bot{padding:0.875rem 1rem;border-top:1px solid #E5E5E5;flex-shrink:0}
        .sb-dev{font-size:0.6rem;color:#C0C0C0;text-align:center;margin-bottom:0.5rem}
        .sb-out{display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0;background:none;border:none;color:#A3A3A3;font-size:0.82rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .sb-out:hover{color:#DC2626}
        @media(max-width:768px){.sb-x{display:block}}
      `}</style>
    </aside>
  );
}
