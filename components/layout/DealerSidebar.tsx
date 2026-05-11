"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSidebar } from "@/hooks/useSidebar";
import api from "@/lib/api";
import { useEffect, useState } from "react";

const NAV = [
  { href:"/dashboard/dealer", label:"Overview", icon:"grid", exact:true },
  { href:"/dashboard/dealer/cars", label:"Cars & Inventory", icon:"car" },
  { href:"/dashboard/dealer/sales", label:"Sales", icon:"tag" },
  { href:"/dashboard/dealer/expenses", label:"Expenses", icon:"receipt" },
  { href:"/dashboard/dealer/staff", label:"Staff", icon:"users" },
  { href:"/dashboard/dealer/partners", label:"Partners", icon:"handshake" },
  { href:"/dashboard/dealer/requests", label:"Requests", icon:"inbox" },
  { href:"/dashboard/dealer/appointments", label:"Appointments", icon:"calendar" },
  { href:"/dashboard/dealer/movements", label:"Movements", icon:"refresh" },
  { href:"/dashboard/dealer/cctv", label:"CCTV", icon:"camera" },
  { href:"/dashboard/dealer/reports", label:"Reports", icon:"chart" },
  { href:"/dashboard/dealer/notifications", label:"Notifications", icon:"bell" },
  { href:"/dashboard/dealer/settings", label:"Settings", icon:"settings" },
];

const ICONS: Record<string,string> = {
  grid:"▦", car:"▣", tag:"◈", receipt:"▤", users:"◉", handshake:"◎",
  inbox:"▥", calendar:"▧", refresh:"↺", camera:"◫", chart:"▨",
  bell:"◔", settings:"⚙",
};

export default function DealerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isOpen, close } = useSidebar();
  const [dealer, setDealer] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/dealers/me").then((r) => setDealer(r.data)).catch(() => {});
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleNav = () => {
    // Close sidebar on mobile after navigating
    if (window.innerWidth <= 768) close();
  };

  return (
    <aside className="dealer-sidebar">
      <div className="sb-brand">
        <span className="sb-brand-icon">◈</span>
        <span className="sb-brand-name">CARSTRIMS</span>
        <button className="sb-close-btn" onClick={close} title="Close menu">✕</button>
      </div>

      <div className="sb-profile" onClick={() => { router.push("/dashboard/dealer/settings"); handleNav(); }}>
        <div className="sb-avatar">
          {dealer?.logo ? <img src={dealer.logo} alt="" /> : user?.fullName?.charAt(0).toUpperCase() || "D"}
        </div>
        <div className="sb-info">
          <div className="sb-name">{dealer?.companyName || user?.fullName || "Dealer"}</div>
          <div className="sb-role">Dealer Admin</div>
          {dealer?.dealerId && <div className="sb-id">{dealer.dealerId}</div>}
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={`sb-item ${isActive(item.href, item.exact) ? "active" : ""}`}
            onClick={handleNav}>
            <span className="sb-icon">{ICONS[item.icon]}</span>
            <span className="sb-label">{item.label}</span>
          </Link>
        ))}
        <div className="sb-divider" />
        <Link href="/feed" className="sb-item feed" onClick={handleNav}>
          <span className="sb-icon">⌂</span>
          <span className="sb-label">View Feed</span>
        </Link>
      </nav>

      <div className="sb-bottom">
        <div className="sb-dev">Powered by <strong>UASE TECH STUDIO</strong></div>
        <button className="sb-logout" onClick={() => { logout(); router.push("/login"); }}>
          ↩ Sign Out
        </button>
      </div>

      <style>{`
        .dealer-sidebar {
          width:240px; height:100vh; background:#fff;
          border-right:1.5px solid #E5E5E5; display:flex; flex-direction:column;
          overflow-y:auto; overflow-x:hidden;
        }
        .sb-brand {
          display:flex; align-items:center; gap:0.6rem;
          padding:1.1rem 1rem; border-bottom:1px solid #E5E5E5;
          background:#1A1A1A; flex-shrink:0; min-height:56px;
        }
        .sb-brand-icon { font-size:1.1rem; color:#F47B20; }
        .sb-brand-name { font-family:var(--font-display); font-size:1rem; letter-spacing:0.2em; color:#fff; flex:1; }
        .sb-close-btn {
          display:none; background:none; border:none; color:#888;
          font-size:1rem; cursor:pointer; padding:0.25rem; line-height:1;
        }
        .sb-profile {
          display:flex; align-items:center; gap:0.75rem;
          padding:0.875rem 1rem; border-bottom:1px solid #E5E5E5;
          cursor:pointer; transition:background 0.15s; background:#FFF7ED;
        }
        .sb-profile:hover { background:#FFEDD5; }
        .sb-avatar {
          width:34px; height:34px; border-radius:50%; background:#F47B20;
          color:#fff; font-family:var(--font-display); font-size:0.95rem;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; overflow:hidden; border:2px solid #F47B20;
        }
        .sb-avatar img { width:100%; height:100%; object-fit:cover; }
        .sb-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:0.08rem; }
        .sb-name { font-size:0.8rem; font-weight:600; color:#1A1A1A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-role { font-size:0.65rem; color:#F47B20; }
        .sb-id { font-family:var(--font-mono); font-size:0.58rem; color:#A3A3A3; }
        .sb-nav { display:flex; flex-direction:column; flex:1; padding:0.4rem 0; overflow-y:auto; }
        .sb-item {
          display:flex; align-items:center; gap:0.75rem;
          padding:0.6rem 1rem; text-decoration:none; color:#525252;
          font-size:0.82rem; transition:all 0.15s;
          border-left:3px solid transparent; white-space:nowrap;
        }
        .sb-item:hover { color:#F47B20; background:#FFF7ED; }
        .sb-item.active { color:#F47B20; background:rgba(244,123,32,0.06); border-left-color:#F47B20; font-weight:600; }
        .sb-item.feed { color:#A3A3A3; }
        .sb-item.feed:hover { color:#F47B20; }
        .sb-icon { font-size:0.9rem; width:16px; text-align:center; flex-shrink:0; }
        .sb-label { flex:1; }
        .sb-divider { height:1px; background:#E5E5E5; margin:0.4rem 1rem; }
        .sb-bottom { padding:0.875rem 1rem; border-top:1px solid #E5E5E5; flex-shrink:0; }
        .sb-dev { font-size:0.6rem; color:#C0C0C0; text-align:center; margin-bottom:0.5rem; }
        .sb-dev strong { color:#F47B20; }
        .sb-logout {
          display:flex; align-items:center; gap:0.5rem; width:100%;
          padding:0.55rem 0; background:none; border:none; color:#A3A3A3;
          font-size:0.82rem; font-family:var(--font-body); cursor:pointer;
          transition:color 0.2s;
        }
        .sb-logout:hover { color:#DC2626; }
        @media (max-width:768px) { .sb-close-btn { display:block; } }
      `}</style>
    </aside>
  );
}
