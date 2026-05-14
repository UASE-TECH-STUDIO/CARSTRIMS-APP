"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

interface DealerStats {
  totalCars:number; availableCars:number; soldCars:number;
  totalStaff:number; totalPartners:number; pendingRequests:number;
  totalRevenue:number; totalProfit:number;
}

export default function DealerOverviewPage() {
  const [stats, setStats] = useState<DealerStats|null>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/dealers/me"),
      api.get("/api/v1/dealers/me/stats"),
    ])
      .then(([d,s]) => { setDealer(d.data); setStats(s.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
      <div style={{width:"32px",height:"32px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const fmt = (n:number) => `${(n||0).toLocaleString()}`;
  const isPending = dealer?.status==="awaiting_approval" || dealer?.status==="pending";

  const STATS = [
    { label:"Total Cars",   value:stats?.totalCars??0,      icon:"🚗", sub:"All listed vehicles",    href:"/dashboard/dealer/cars",               color:"#F47B20" },
    { label:"Available",    value:stats?.availableCars??0,   icon:"✅", sub:"Ready for sale",         href:"/dashboard/dealer/cars?status=available",color:"#16A34A" },
    { label:"Sold",         value:stats?.soldCars??0,        icon:"🏷️",sub:"Completed sales",        href:"/dashboard/dealer/sales",              color:"#3B8BD4" },
    { label:"Total Staff",  value:stats?.totalStaff??0,      icon:"👥", sub:"Team members",           href:"/dashboard/dealer/staff",              color:"#7B68EE" },
    { label:"Partners",     value:stats?.totalPartners??0,   icon:"🤝", sub:"Active partners",        href:"/dashboard/dealer/partners",           color:"#D97706" },
    { label:"Requests",     value:stats?.pendingRequests??0, icon:"📩", sub:"Pending requests",       href:"/dashboard/dealer/requests",           color:"#DC2626" },
  ];

  const ACTIONS = [
    { label:"Add New Car",   icon:"➕", href:"/dashboard/dealer/cars" },
    { label:"Record Sale",   icon:"💳", href:"/dashboard/dealer/sales" },
    { label:"Log Expense",   icon:"📋", href:"/dashboard/dealer/expenses" },
    { label:"Add Staff",     icon:"👤", href:"/dashboard/dealer/staff" },
    { label:"Log Movement",  icon:"🔄", href:"/dashboard/dealer/movements" },
    { label:"View Reports",  icon:"📊", href:"/dashboard/dealer/reports" },
    { label:"View Requests", icon:"📩", href:"/dashboard/dealer/requests" },
    { label:"View Feed",     icon:"🏠", href:"/feed" },
  ];

  return (
    <div className="overview">

      {/* Single pending banner — only shown when actually pending */}
      {isPending && (
        <div className="pending-banner">
          <span className="pb-icon">⏳</span>
          <div className="pb-text">
            <strong>Account Pending Approval</strong>
            <span>Your dealership is under review. Listings are hidden from the public feed until approved by a CARSTRIMS admin. You can still add cars, staff and set up your dashboard.</span>
          </div>
        </div>
      )}

      {/* Dealer header */}
      <div className="ov-header">
        <div className="ov-header-left">
          <div className="ov-logo">
            {dealer?.logo
              ? <img src={dealer.logo} alt=""/>
              : <span>{dealer?.companyName?.charAt(0)||"D"}</span>
            }
          </div>
          <div>
            <h2 className="ov-company">{dealer?.companyName||"Your Dealership"}</h2>
            <p className="ov-meta">
              {dealer?.city&&dealer?.state ? `${dealer.city}, ${dealer.state}` : "Set location in settings"}
              {dealer?.dealerId && <span className="ov-id"> · {dealer.dealerId}</span>}
            </p>
          </div>
        </div>
        <div className={`status-badge ${dealer?.status}`}>
          {dealer?.status?.replace(/_/g," ").toUpperCase()||"PENDING"}
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="section-label">OVERVIEW</p>
        <div className="stats-grid">
          {STATS.map((s) => (
            <Link key={s.label} href={s.href} className="stat-card">
              <div className="stat-top">
                <span className="stat-icon">{s.icon}</span>
                <span className="stat-label">{s.label}</span>
              </div>
              <div className="stat-value" style={{color:s.color}}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
              <span className="stat-arrow">→</span>
            </Link>
          ))}
        </div>
        <div className="wide-grid">
          <Link href="/dashboard/dealer/sales" className="wide-card">
            <div className="stat-top"><span className="stat-icon">💰</span><span className="stat-label">Revenue</span></div>
            <div className="stat-value" style={{color:"#F47B20"}}>₦{fmt(stats?.totalRevenue??0)}</div>
            <div className="stat-sub">All time sales value</div>
            <span className="stat-arrow">→</span>
          </Link>
          <Link href="/dashboard/dealer/reports" className="wide-card">
            <div className="stat-top"><span className="stat-icon">📈</span><span className="stat-label">Net Profit</span></div>
            <div className="stat-value" style={{color:"#16A34A"}}>₦{fmt(stats?.totalProfit??0)}</div>
            <div className="stat-sub">After all expenses</div>
            <span className="stat-arrow">→</span>
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="section-label">QUICK ACTIONS</p>
        <div className="actions-grid">
          {ACTIONS.map((a) => (
            <Link key={a.label} href={a.href} className="action-card">
              <span className="action-icon">{a.icon}</span>
              <span className="action-label">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .overview{display:flex;flex-direction:column;gap:1.75rem}
        .pending-banner{display:flex;align-items:flex-start;gap:0.875rem;background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.35);border-left:4px solid #F47B20;padding:1rem 1.25rem;border-radius:10px}
        .pb-icon{font-size:1.25rem;flex-shrink:0;margin-top:0.1rem}
        .pb-text{display:flex;flex-direction:column;gap:0.2rem}
        .pb-text strong{font-size:0.875rem;color:#C4621A;display:block}
        .pb-text span{color:#92400E;font-size:0.8rem;line-height:1.5}
        .ov-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .ov-header-left{display:flex;align-items:center;gap:0.875rem}
        .ov-logo{width:52px;height:52px;border-radius:10px;overflow:hidden;background:#FFF7ED;border:2px solid rgba(244,123,32,0.3);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.3rem;color:#F47B20;flex-shrink:0}
        .ov-logo img{width:100%;height:100%;object-fit:cover}
        .ov-company{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1}
        .ov-meta{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .ov-id{font-family:var(--font-mono);font-size:0.72rem;color:#AAA}
        .status-badge{padding:0.35rem 0.875rem;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border:1.5px solid;white-space:nowrap;flex-shrink:0}
        .status-badge.approved{color:#16A34A;border-color:#16A34A;background:#F0FDF4}
        .status-badge.awaiting_approval,.status-badge.pending{color:#F47B20;border-color:#F47B20;background:#FFF7ED}
        .status-badge.suspended{color:#DC2626;border-color:#DC2626;background:#FEF2F2}
        .section-label{font-family:var(--font-display);font-size:0.72rem;letter-spacing:0.18em;color:#A3A3A3;margin-bottom:0.875rem;text-transform:uppercase}
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
        .stat-card,.wide-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:0.35rem;text-decoration:none;transition:all 0.2s;position:relative;overflow:hidden}
        .stat-card::before,.wide-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:#F47B20;opacity:0;transition:opacity 0.2s}
        .stat-card:hover,.wide-card:hover{border-color:#F47B20;transform:translateY(-2px);box-shadow:0 6px 20px rgba(244,123,32,0.1)}
        .stat-card:hover::before,.wide-card:hover::before{opacity:1}
        .stat-top{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.2rem}
        .stat-icon{font-size:1.1rem}
        .stat-label{font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A3A3A3}
        .stat-value{font-family:var(--font-display);font-size:2.2rem;letter-spacing:0.02em;line-height:1}
        .stat-sub{font-size:0.7rem;color:#A3A3A3}
        .stat-arrow{position:absolute;bottom:0.875rem;right:1rem;font-size:0.8rem;color:#DDD;transition:color 0.2s}
        .stat-card:hover .stat-arrow,.wide-card:hover .stat-arrow{color:#F47B20}
        .wide-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem}
        .actions-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0.875rem}
        .action-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.1rem 0.875rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s}
        .action-card:hover{border-color:#F47B20;background:#FFF7ED;transform:translateY(-2px);box-shadow:0 4px 12px rgba(244,123,32,0.08)}
        .action-icon{font-size:1.5rem}
        .action-label{font-size:0.72rem;font-weight:500;color:#666;text-align:center;line-height:1.3}
        .action-card:hover .action-label{color:#F47B20}
        @media(max-width:900px){
          .stats-grid{grid-template-columns:repeat(2,1fr)}
          .actions-grid{grid-template-columns:repeat(4,1fr)}
        }
        @media(max-width:640px){
          .stats-grid{grid-template-columns:repeat(2,1fr);gap:0.65rem}
          .wide-grid{grid-template-columns:1fr}
          .actions-grid{grid-template-columns:repeat(2,1fr)}
          .ov-company{font-size:1.2rem}
          .stat-value{font-size:1.7rem}
        }
      `}</style>
    </div>
  );
}
