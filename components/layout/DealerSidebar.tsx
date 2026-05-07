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
  { href: "/dashboard/dealer/movements", label: "Vehicle Movement", icon: "🔄" },
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
            <span className="dealer-name">{dealer?.companyName || user?.fullName || "Dealer"}</span>
            <span className="dealer-role">{dealer?.dealerId || "Dealer Account"}</span>
          </div>
          <span className="edit-icon">✏️</span>
        </Link>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}>
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
        .dealer-badge{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1.25rem;border-bottom:1px solid #E5E5E5;background:#FFF8F3;text-decoration:none;transition:background 0.2s;cursor:pointer}
        .dealer-badge:hover{background:#FFF0E6}
        .dealer-avatar{width:36px;height:36px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid #F47B20}
        .dealer-avatar img{width:100%;height:100%;object-fit:cover}
        .dealer-info{flex:1;overflow:hidden}
        .dealer-name{display:block;font-size:0.82rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dealer-role{display:block;font-size:0.68rem;color:#F47B20;font-family:var(--font-mono)}
        .edit-icon{font-size:0.75rem;color:#AAA;flex-shrink:0}
        .sidebar-nav{display:flex;flex-direction:column;padding:0.5rem 0;gap:1px}
        .nav-item{display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1.25rem;text-decoration:none;color:#666;font-size:0.85rem;font-weight:400;transition:all 0.15s;border-left:3px solid transparent}
        .nav-item:hover{color:#F47B20;background:#FFF8F3}
        .nav-item.active{color:#F47B20;background:#FFF0E6;border-left-color:#F47B20;font-weight:600}
        .feed-nav{color:#AAA!important}
        .feed-nav:hover{color:#F47B20!important}
        .nav-icon{font-size:0.95rem;width:18px;text-align:center;flex-shrink:0}
        .nav-label{flex:1}
        .nav-divider{height:1px;background:#E5E5E5;margin:0.4rem 1.25rem}
        .sidebar-bottom{padding:1rem 1.25rem;border-top:1px solid #E5E5E5}
        .dev-note{font-size:0.62rem;color:#CCC;letter-spacing:0.05em;text-align:center;margin-bottom:0.5rem}
        .logout-btn{display:flex;align-items:center;gap:0.75rem;width:100%;padding:0.65rem 0;background:none;border:none;color:#999;font-size:0.85rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .logout-btn:hover{color:#DC2626}
        @media(max-width:768px){.sidebar{width:200px}}
      `}</style>
    </aside>
  );
}

