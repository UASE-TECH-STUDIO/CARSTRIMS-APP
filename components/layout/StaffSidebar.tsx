"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSidebar } from "@/hooks/useSidebar";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const ALL_NAV = [
  { href:"/dashboard/staff", label:"Overview", icon:"▦", exact:true, perm:null },
  { href:"/dashboard/staff/inventory", label:"Cars & Inventory", icon:"▣", perm:"view_inventory" },
  { href:"/dashboard/staff/sales", label:"Sales", icon:"◈", perm:"view_sales" },
  { href:"/dashboard/staff/staff", label:"Staff", icon:"◉", perm:"view_staff" },
  { href:"/dashboard/staff/partners", label:"Partners", icon:"◎", perm:"view_partners" },
  { href:"/dashboard/staff/movements", label:"Movements", icon:"↺", perm:"view_movements" },
  { href:"/dashboard/staff/cctv", label:"CCTV", icon:"◫", perm:"view_cctv" },
  { href:"/dashboard/staff/reports", label:"Reports", icon:"▨", perm:"view_reports" },
  { href:"/dashboard/staff/notifications", label:"Notifications", icon:"◔", perm:null },
  { href:"/dashboard/staff/settings", label:"Settings", icon:"⚙", perm:null },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { close } = useSidebar();
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => setStaff(r.data)).catch(() => {});
  }, []);

  const perms: string[] = staff?.permissions || [];
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const hasAccess = (perm: string | null) => !perm || perms.includes(perm);
  const handleNav = () => { if (window.innerWidth <= 768) close(); };

  return (
    <aside className="staff-sidebar">
      <div className="sb-brand">
        <span className="sb-bi">◈</span>
        <span className="sb-bn">CARSTRIMS</span>
        <button className="sb-x" onClick={close}>✕</button>
      </div>

      <div className="sb-profile">
        <div className="sb-av">
          {staff?.profilePicture ? <img src={staff.profilePicture} alt="" /> : user?.fullName?.charAt(0).toUpperCase() || "S"}
        </div>
        <div className="sb-info">
          <div className="sb-name">{user?.fullName || "Staff"}</div>
          <div className="sb-pos">{staff?.position || "Staff Member"}</div>
          {staff?.staffId && <div className="sb-id">{staff.staffId}</div>}
        </div>
      </div>

      {perms.length > 0 && (
        <div className="sb-perms">
          {perms.map((p) => <span key={p} className="perm-pill">{p.replace(/_/g," ")}</span>)}
        </div>
      )}

      <nav className="sb-nav">
        {ALL_NAV.map((item) => hasAccess(item.perm) && (
          <Link key={item.href} href={item.href}
            className={`sb-item ${isActive(item.href, item.exact) ? "active" : ""}`}
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
        <div className="sb-dev">Powered by <strong>UASE TECH STUDIO</strong></div>
        <button className="sb-out" onClick={() => { logout(); router.push("/auth/login"); }}>↩ Sign Out</button>
      </div>

      <style>{`
        .staff-sidebar{width:240px;height:100vh;background:#fff;border-right:1.5px solid #E5E5E5;display:flex;flex-direction:column;overflow-y:auto}
        .sb-brand{display:flex;align-items:center;gap:0.6rem;padding:1.1rem 1rem;background:#1A1A1A;border-bottom:1px solid #E5E5E5;flex-shrink:0;min-height:56px}
        .sb-bi{font-size:1.1rem;color:#F47B20}
        .sb-bn{font-family:var(--font-display);font-size:1rem;letter-spacing:0.2em;color:#fff;flex:1}
        .sb-x{display:none;background:none;border:none;color:#888;font-size:1rem;cursor:pointer;padding:0.25rem}
        .sb-profile{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#F5F5F5;flex-shrink:0}
        .sb-av{width:34px;height:34px;border-radius:50%;background:#737373;color:#fff;font-family:var(--font-display);font-size:0.95rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid #737373}
        .sb-av img{width:100%;height:100%;object-fit:cover}
        .sb-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:0.08rem}
        .sb-name{font-size:0.8rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sb-pos{font-size:0.65rem;color:#737373}
        .sb-id{font-family:var(--font-mono);font-size:0.58rem;color:#A3A3A3}
        .sb-perms{display:flex;flex-wrap:wrap;gap:0.2rem;padding:0.5rem 1rem;border-bottom:1px solid #E5E5E5;background:#FAFAFA;flex-shrink:0}
        .perm-pill{background:#F5F5F5;border:1px solid #E5E5E5;color:#737373;font-size:0.56rem;padding:0.1rem 0.4rem;border-radius:10px;text-transform:capitalize;white-space:nowrap}
        .sb-nav{display:flex;flex-direction:column;flex:1;padding:0.4rem 0;overflow-y:auto}
        .sb-item{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 1rem;text-decoration:none;color:#525252;font-size:0.82rem;transition:all 0.15s;border-left:3px solid transparent;white-space:nowrap}
        .sb-item:hover{color:#F47B20;background:#FFF7ED}
        .sb-item.active{color:#F47B20;background:rgba(244,123,32,0.06);border-left-color:#F47B20;font-weight:600}
        .sb-item.feed{color:#A3A3A3}
        .sb-item.feed:hover{color:#F47B20}
        .sb-icon{font-size:0.9rem;width:16px;text-align:center;flex-shrink:0}
        .sb-div{height:1px;background:#E5E5E5;margin:0.4rem 1rem}
        .sb-bot{padding:0.875rem 1rem;border-top:1px solid #E5E5E5;flex-shrink:0}
        .sb-dev{font-size:0.6rem;color:#C0C0C0;text-align:center;margin-bottom:0.5rem}
        .sb-dev strong{color:#F47B20}
        .sb-out{display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0;background:none;border:none;color:#A3A3A3;font-size:0.82rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .sb-out:hover{color:#DC2626}
        @media(max-width:768px){.sb-x{display:block}}
      `}</style>
    </aside>
  );
}
