"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const ALL_NAV = [
  { href:"/dashboard/staff",               label:"Overview",      perm:null },
  { href:"/dashboard/staff/inventory",      label:"Inventory",     perm:"view_inventory" },
  { href:"/dashboard/staff/sales",          label:"Sales",         perm:"view_sales" },
  { href:"/dashboard/staff/movements",      label:"Movements",     perm:"view_movements" },
  { href:"/dashboard/staff/cctv",           label:"CCTV",          perm:"view_cctv" },
  { href:"/dashboard/staff/reports",        label:"Reports",       perm:"view_reports" },
  { href:"/dashboard/staff/partners",       label:"Partners",      perm:"view_partners" },
  { href:"/dashboard/staff/notifications",  label:"Notifications", perm:null },
  { href:"/dashboard/staff/settings",       label:"Settings",      perm:null },
];

export default function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => {
      setStaffInfo(r.data);
      setPermissions(r.data.permissions || []);
    }).catch(() => {});
  }, []);

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const hasAccess = (perm: string | null) => !perm || permissions.includes(perm);
  const isActive  = (href: string) => href === "/dashboard/staff" ? pathname === href : pathname.startsWith(href);
  const doLogout  = () => { logout(); router.push("/login"); };

  const currentPage = ALL_NAV.find((n) => isActive(n.href))?.label || "Staff Dashboard";

  return (
    <div className="ss-root">

      {/* Overlay */}
      {open && <div className="ss-overlay" onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`ss-sidebar ${open ? "ss-open" : ""}`}>
        <div className="ss-top">
          {/* Brand row */}
          <div className="ss-brand-row">
            <div className="ss-brand">CARSTRIMS</div>
            <button className="ss-close" onClick={() => setOpen(false)}>X</button>
          </div>

          {/* Staff badge */}
          <div className="ss-badge">
            <div className="ss-avatar">{user?.fullName?.charAt(0)?.toUpperCase() || "S"}</div>
            <div className="ss-badge-info">
              <div className="ss-name">{user?.fullName || "Staff"}</div>
              <div className="ss-pos">{staffInfo?.position || "Staff Member"}</div>
              {staffInfo?.dealerName && <div className="ss-dealer">{staffInfo.dealerName}</div>}
            </div>
          </div>

          {/* Permissions */}
          {permissions.length > 0 && (
            <div className="ss-perms">
              <div className="ss-perms-label">ACCESS</div>
              <div className="ss-perms-list">
                {permissions.slice(0,5).map((p) => (
                  <span key={p} className="ss-perm">{p.replace(/_/g," ")}</span>
                ))}
                {permissions.length > 5 && <span className="ss-perm ss-perm-more">+{permissions.length-5}</span>}
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="ss-nav">
            {ALL_NAV.map((item) => {
              if (!hasAccess(item.perm)) return null;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className={`ss-nav-item ${active ? "active" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="ss-bottom">
          <Link href="/feed" className="ss-feed-link">View Public Feed</Link>
          <button className="ss-logout" onClick={doLogout}>Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="ss-main">
        {/* Topbar */}
        <header className="ss-topbar">
          <button className="ss-hamburger" onClick={() => setOpen(true)}>
            <span /><span /><span />
          </button>
          <div className="ss-topbar-title">{currentPage}</div>
          <div className="ss-topbar-right">
            <div className="ss-topbar-avatar">{user?.fullName?.charAt(0)?.toUpperCase() || "S"}</div>
          </div>
        </header>

        {/* Content */}
        <main className="ss-content">{children}</main>
      </div>

      <style>{`
        .ss-root { display:flex; min-height:100vh; background:#F5F5F5; font-family:var(--font-body); }

        /* Overlay */
        .ss-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:150; }

        /* SIDEBAR */
        .ss-sidebar {
          width:260px; background:#fff; border-right:1.5px solid #E5E5E5;
          display:flex; flex-direction:column; justify-content:space-between;
          position:fixed; left:0; top:0; bottom:0; z-index:200;
          overflow-y:auto; transition:transform 0.25s ease;
          flex-shrink:0;
        }
        .ss-top { display:flex; flex-direction:column; }

        /* Brand row */
        .ss-brand-row { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.25rem 1rem; border-bottom:1.5px solid #F5F5F5; }
        .ss-brand { font-family:var(--font-display); font-size:1.2rem; letter-spacing:0.2em; color:#F47B20; }
        .ss-close { background:none; border:none; font-size:1rem; color:#A3A3A3; cursor:pointer; padding:0.25rem; display:none; }

        /* Staff badge */
        .ss-badge { display:flex; align-items:flex-start; gap:0.75rem; padding:1rem 1.25rem; background:#FFF7ED; border-bottom:1.5px solid #F5F5F5; }
        .ss-avatar { width:40px; height:40px; border-radius:50%; background:#F47B20; color:#fff; font-family:var(--font-display); font-size:1.1rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ss-badge-info { flex:1; min-width:0; }
        .ss-name { font-size:0.875rem; font-weight:600; color:#1A1A1A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ss-pos { font-size:0.72rem; color:#F47B20; margin-top:0.15rem; }
        .ss-dealer { font-size:0.68rem; color:#737373; margin-top:0.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* Permissions */
        .ss-perms { padding:0.75rem 1.25rem; border-bottom:1.5px solid #F5F5F5; }
        .ss-perms-label { font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:#A3A3A3; margin-bottom:0.4rem; }
        .ss-perms-list { display:flex; flex-wrap:wrap; gap:0.25rem; }
        .ss-perm { background:#FFF7ED; border:1px solid rgba(244,123,32,0.25); color:#F47B20; font-size:0.62rem; padding:0.15rem 0.5rem; border-radius:20px; text-transform:capitalize; }
        .ss-perm-more { background:#F5F5F5; border-color:#E5E5E5; color:#A3A3A3; }

        /* Nav */
        .ss-nav { display:flex; flex-direction:column; padding:0.5rem 0; }
        .ss-nav-item { display:block; padding:0.75rem 1.25rem; text-decoration:none; color:#737373; font-size:0.875rem; border-left:3px solid transparent; transition:all 0.15s; }
        .ss-nav-item:hover { color:#F47B20; background:#FFF7ED; }
        .ss-nav-item.active { color:#F47B20; background:#FFF7ED; border-left-color:#F47B20; font-weight:600; }

        /* Bottom */
        .ss-bottom { padding:1rem 1.25rem; border-top:1.5px solid #F5F5F5; display:flex; flex-direction:column; gap:0.5rem; }
        .ss-feed-link { font-size:0.8rem; color:#F47B20; text-decoration:none; padding:0.5rem; text-align:center; border:1px solid rgba(244,123,32,0.3); border-radius:6px; }
        .ss-logout { background:none; border:1.5px solid #E5E5E5; color:#737373; border-radius:8px; padding:0.75rem; font-family:var(--font-body); font-size:0.875rem; cursor:pointer; transition:all 0.2s; text-align:center; }
        .ss-logout:hover { border-color:#DC2626; color:#DC2626; }

        /* MAIN */
        .ss-main { margin-left:260px; flex:1; display:flex; flex-direction:column; min-width:0; }

        /* Topbar */
        .ss-topbar { height:58px; background:#fff; border-bottom:1.5px solid #E5E5E5; display:flex; align-items:center; gap:1rem; padding:0 1.25rem; position:sticky; top:0; z-index:100; }
        .ss-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:0.25rem; flex-shrink:0; }
        .ss-hamburger span { display:block; width:22px; height:2px; background:#525252; border-radius:2px; transition:all 0.2s; }
        .ss-topbar-title { font-family:var(--font-display); font-size:1.1rem; letter-spacing:0.06em; color:#1A1A1A; flex:1; }
        .ss-topbar-right { display:flex; align-items:center; gap:0.75rem; }
        .ss-topbar-avatar { width:34px; height:34px; border-radius:50%; background:#F47B20; color:#fff; font-family:var(--font-display); font-size:0.95rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Content */
        .ss-content { flex:1; padding:1.5rem; }

        /* MOBILE */
        @media(max-width:768px) {
          .ss-sidebar { transform:translateX(-100%); }
          .ss-sidebar.ss-open { transform:translateX(0); }
          .ss-close { display:block; }
          .ss-main { margin-left:0; }
          .ss-hamburger { display:flex; }
          .ss-content { padding:1rem; }
          .ss-topbar { padding:0 1rem; }
        }

        @media(max-width:400px) {
          .ss-content { padding:0.75rem; }
        }
      `}</style>
    </div>
  );
}