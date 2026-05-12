"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard/dealer", label: "Overview", icon: "⊞", exact: true },
  { href: "/dashboard/dealer/cars", label: "Cars & Inventory", icon: "🚗" },
  { href: "/dashboard/dealer/sales", label: "Sales", icon: "💰" },
  { href: "/dashboard/dealer/expenses", label: "Expenses", icon: "📋" },
  { href: "/dashboard/dealer/staff", label: "Staff", icon: "👥" },
  { href: "/dashboard/dealer/partners", label: "Partners", icon: "🤝" },
  { href: "/dashboard/dealer/requests", label: "Requests", icon: "📩" },
  { href: "/dashboard/dealer/appointments", label: "Appointments", icon: "📅" },
  { href: "/dashboard/dealer/movements", label: "Movements", icon: "🔄" },
  { href: "/dashboard/dealer/cctv", label: "CCTV", icon: "📹" },
  { href: "/dashboard/dealer/reports", label: "Reports", icon: "📊" },
  { href: "/dashboard/dealer/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/dealer/settings", label: "Settings", icon: "⚙️" },
];

export default function DealerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dealer, setDealer] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/dealers/me").then((r) => setDealer(r.data)).catch(() => {});
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">CARSTRIMS</span>
        </div>
        <Link href="/dashboard/dealer/settings" className="dealer-badge">
          <div className="dealer-avatar">
            {dealer?.logo
              ? <img src={dealer.logo} alt="" />
              : <span>{user?.fullName?.charAt(0).toUpperCase() || "D"}</span>
            }
          </div>
          <div className="dealer-info">
            <div className="dealer-name">{dealer?.companyName || user?.fullName || "Dealer"}</div>
            {dealer?.dealerId && <div className="dealer-id">{dealer.dealerId}</div>}
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link href="/feed" className="feed-link">← Back to Feed</Link>
        <button className="logout-btn" onClick={() => { logout(); router.push("/login"); }}>
          Sign Out
        </button>
      </div>

      <style>{`
        .sidebar{width:240px;min-height:100vh;background:#1A1A1A;display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:60;overflow-y:auto;flex-shrink:0}
        .sidebar-top{padding:1.25rem 1rem;border-bottom:1px solid rgba(255,255,255,0.08)}
        .sidebar-brand{display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem}
        .brand-icon{color:#F47B20;font-size:1.1rem}
        .brand-name{font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.2em;color:#fff}
        .dealer-badge{display:flex;align-items:center;gap:0.75rem;padding:0.625rem;background:rgba(255,255,255,0.06);border-radius:8px;text-decoration:none;transition:background 0.2s;border:1px solid rgba(255,255,255,0.08)}
        .dealer-badge:hover{background:rgba(244,123,32,0.15);border-color:rgba(244,123,32,0.3)}
        .dealer-avatar{width:36px;height:36px;border-radius:8px;background:#F47B20;color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1rem;overflow:hidden;flex-shrink:0}
        .dealer-avatar img{width:100%;height:100%;object-fit:cover}
        .dealer-info{flex:1;min-width:0}
        .dealer-name{font-size:0.75rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dealer-id{font-size:0.6rem;color:#888;font-family:var(--font-mono);margin-top:0.1rem}
        .sidebar-nav{flex:1;padding:0.75rem 0.5rem;display:flex;flex-direction:column;gap:0.15rem}
        .nav-item{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.875rem;border-radius:6px;text-decoration:none;color:#A3A3A3;font-size:0.825rem;transition:all 0.15s;font-family:var(--font-body)}
        .nav-item:hover{background:rgba(255,255,255,0.07);color:#fff}
        .nav-item.active{background:rgba(244,123,32,0.15);color:#F47B20;border-left:2.5px solid #F47B20}
        .nav-icon{font-size:1rem;width:20px;text-align:center;flex-shrink:0}
        .nav-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sidebar-footer{padding:1rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:0.5rem}
        .feed-link{font-size:0.75rem;color:#888;text-decoration:none;text-align:center;padding:0.4rem;transition:color 0.2s}
        .feed-link:hover{color:#F47B20}
        .logout-btn{background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.25);color:#F87171;border-radius:6px;padding:0.6rem;font-size:0.8rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
        .logout-btn:hover{background:rgba(220,38,38,0.2);border-color:rgba(220,38,38,0.4)}
        @media(max-width:768px){.sidebar{width:200px}}
        @media(max-width:640px){.sidebar{position:fixed;transform:translateX(-100%);transition:transform 0.25s}.sidebar.mobile-open{transform:translateX(0)}}
      `}</style>
    </aside>
  );
}
