"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";

const PERM_TO_ROUTE: Record<string,{href:string;label:string;icon:string}> = {
  view_inventory:{ href:"/dashboard/staff/inventory", label:"Cars & Inventory", icon:"🚗" },
  add_cars:{ href:"/dashboard/staff/inventory", label:"Add Car", icon:"➕" },
  edit_cars:{ href:"/dashboard/staff/inventory", label:"Edit Cars", icon:"✏️" },
  delete_cars:{ href:"/dashboard/staff/inventory", label:"Manage Cars", icon:"🗑" },
  view_sales:{ href:"/dashboard/staff/sales", label:"View Sales", icon:"💰" },
  record_sales:{ href:"/dashboard/staff/sales", label:"Record Sale", icon:"🏷️" },
  view_staff:{ href:"/dashboard/staff/staff", label:"View Staff", icon:"👥" },
  create_staff:{ href:"/dashboard/staff/staff", label:"Create Staff", icon:"👤" },
  view_partners:{ href:"/dashboard/staff/partners", label:"Partners", icon:"🤝" },
  manage_partners:{ href:"/dashboard/staff/partners", label:"Manage Partners", icon:"⚙️" },
  view_cctv:{ href:"/dashboard/staff/cctv", label:"CCTV", icon:"📹" },
  view_movements:{ href:"/dashboard/staff/movements", label:"Movements", icon:"🔄" },
  manage_movements:{ href:"/dashboard/staff/movements", label:"Log Movement", icon:"🔄" },
  view_reports:{ href:"/dashboard/staff/reports", label:"Reports", icon:"📊" },
};

export default function StaffOverviewPage() {
  const { user } = useAuthStore();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const staffRes = await api.get("/api/v1/staff/me");
        setStaffInfo(staffRes.data);

        const dealerRes = await api.get("/api/v1/staff/me/dealer");
        setDealer(dealerRes.data);

        if (staffRes.data.permissions?.includes("view_inventory") || staffRes.data.permissions?.includes("view_sales")) {
          const statsRes = await api.get("/api/v1/dealers/me/stats").catch(() => ({ data: null }));
          setStats(statsRes.data);
        }
      } catch { } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      <style>{`.loading-state{display:flex;align-items:center;justify-content:center;min-height:50vh}.spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const perms: string[] = staffInfo?.permissions || [];
  const uniqueRoutes = [...new Map(
    perms.filter((p) => PERM_TO_ROUTE[p]).map((p) => [PERM_TO_ROUTE[p].href, PERM_TO_ROUTE[p]])
  ).values()];

  return (
    <div className="overview">
      {/* Welcome */}
      <div className="welcome-card">
        <div className="welcome-avatar">{user?.fullName?.charAt(0).toUpperCase() || "S"}</div>
        <div className="welcome-info">
          <h2 className="welcome-name">{user?.fullName}</h2>
          <div className="welcome-pos">{staffInfo?.position || "Staff Member"}</div>
          <div className="welcome-meta">
            <span>{staffInfo?.staffId}</span>
            {dealer?.companyName && <span>· {dealer.companyName}</span>}
          </div>
        </div>
        <div className="welcome-status">
          <div className={`status-dot ${staffInfo?.status === "active" ? "active" : "suspended"}`} />
          <span>{staffInfo?.status || "active"}</span>
        </div>
      </div>

      {perms.length === 0 ? (
        <div className="no-perms-card">
          <div className="np-icon">🔒</div>
          <h3>No permissions assigned yet</h3>
          <p>Your dealer admin has not assigned any permissions to your account. Please contact them to set up your access.</p>
        </div>
      ) : (
        <>
          {/* Stats if has access */}
          {stats && (perms.includes("view_inventory") || perms.includes("view_sales")) && (
            <div className="stats-row">
              {perms.includes("view_inventory") && [
                { label:"Total Cars", val:stats.totalCars||0, icon:"🚗" },
                { label:"Available", val:stats.availableCars||0, icon:"✅" },
                { label:"Sold", val:stats.soldCars||0, icon:"🏷️" },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="sc-icon">{s.icon}</div>
                  <div className="sc-val">{s.val}</div>
                  <div className="sc-label">{s.label}</div>
                </div>
              ))}
              {perms.includes("view_sales") && (
                <div className="stat-card accent">
                  <div className="sc-icon">💰</div>
                  <div className="sc-val">₦{(stats.totalRevenue||0).toLocaleString()}</div>
                  <div className="sc-label">Revenue</div>
                </div>
              )}
            </div>
          )}

          {/* Quick Access */}
          <div className="section">
            <div className="section-title">YOUR QUICK ACCESS</div>
            <div className="qa-grid">
              {uniqueRoutes.map((r) => (
                <Link key={r.href} href={r.href} className="qa-card">
                  <span className="qa-icon">{r.icon}</span>
                  <span className="qa-label">{r.label}</span>
                </Link>
              ))}
              <Link href="/dashboard/staff/notifications" className="qa-card">
                <span className="qa-icon">🔔</span>
                <span className="qa-label">Notifications</span>
              </Link>
              <Link href="/dashboard/staff/settings" className="qa-card">
                <span className="qa-icon">⚙️</span>
                <span className="qa-label">My Settings</span>
              </Link>
              <Link href="/feed" className="qa-card">
                <span className="qa-icon">🏠</span>
                <span className="qa-label">View Feed</span>
              </Link>
            </div>
          </div>

          {/* Dealer Info */}
          {dealer && (
            <div className="dealer-info-card">
              <div className="di-title">YOUR DEALERSHIP</div>
              <div className="di-body">
                <div className="di-logo">
                  {dealer.logo ? <img src={dealer.logo} alt="" /> : dealer.companyName?.charAt(0)}
                </div>
                <div>
                  <div className="di-name">{dealer.companyName}</div>
                  <div className="di-loc">{dealer.city && `${dealer.city}, ${dealer.state}`}</div>
                  <div className="di-id">{dealer.dealerId}</div>
                  {dealer.phone && <a href={`tel:${dealer.phone}`} className="di-phone">📞 {dealer.phone}</a>}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .overview{display:flex;flex-direction:column;gap:1.5rem}
        .welcome-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.5rem;display:flex;align-items:center;gap:1.25rem}
        .welcome-avatar{width:52px;height:52px;border-radius:50%;background:#1D9E75;color:#fff;font-family:var(--font-display);font-size:1.5rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .welcome-info{flex:1}
        .welcome-name{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1;margin-bottom:0.25rem}
        .welcome-pos{font-size:0.825rem;color:#1D9E75;margin-bottom:0.2rem}
        .welcome-meta{display:flex;gap:0.5rem;font-size:0.72rem;color:#AAA;font-family:var(--font-mono)}
        .welcome-status{display:flex;align-items:center;gap:0.4rem;flex-shrink:0}
        .status-dot{width:8px;height:8px;border-radius:50%}
        .status-dot.active{background:#1D9E75}
        .status-dot.suspended{background:#DC2626}
        .welcome-status span{font-size:0.78rem;color:#888;text-transform:capitalize}
        .no-perms-card{background:#fff;border:1.5px dashed #E5E5E5;border-radius:12px;padding:3rem;display:flex;flex-direction:column;align-items:center;gap:0.875rem;text-align:center}
        .np-icon{font-size:3rem}
        .no-perms-card h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .no-perms-card p{color:#888;font-size:0.875rem;max-width:380px;line-height:1.6}
        .stats-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem}
        .stat-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:0.3rem}
        .stat-card.accent{border-color:#1D9E75;background:#F0FDF4}
        .sc-icon{font-size:1.1rem}
        .sc-val{font-family:var(--font-display);font-size:1.6rem;color:#1D9E75;line-height:1}
        .sc-label{font-size:0.68rem;color:#888;text-transform:uppercase;letter-spacing:0.06em}
        .section{display:flex;flex-direction:column;gap:0.875rem}
        .section-title{font-size:0.7rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#888}
        .qa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.75rem}
        .qa-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s}
        .qa-card:hover{border-color:#1D9E75;background:#F0FDF4;transform:translateY(-1px)}
        .qa-icon{font-size:1.4rem}
        .qa-label{font-size:0.75rem;color:#666;text-align:center;font-weight:500}
        .qa-card:hover .qa-label{color:#1D9E75}
        .dealer-info-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem}
        .di-title{font-size:0.7rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#888}
        .di-body{display:flex;align-items:center;gap:1rem}
        .di-logo{width:44px;height:44px;border-radius:8px;background:#1D9E75;color:#fff;font-family:var(--font-display);font-size:1.2rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .di-logo img{width:100%;height:100%;object-fit:cover}
        .di-name{font-weight:600;font-size:0.9rem;color:#1A1A1A}
        .di-loc{font-size:0.78rem;color:#888}
        .di-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .di-phone{font-size:0.78rem;color:#1D9E75;text-decoration:none;display:block;margin-top:0.25rem}
        @media(max-width:640px){.welcome-card{flex-wrap:wrap}.stats-row{grid-template-columns:1fr 1fr}.qa-grid{grid-template-columns:repeat(3,1fr)}}
      `}</style>
    </div>
  );
}
