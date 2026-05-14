"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function SuperAdminOverview() {
  const [stats,  setStats]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topDealers, setTopDealers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/admin/stats").catch(() => ({ data: null })),
      api.get("/api/v1/admin/top-dealers").catch(() => ({ data: [] })),
      api.get("/api/v1/admin/activity?limit=5").catch(() => ({ data: { activities: [] } })),
    ]).then(([s, t, a]) => {
      if (s.data) setStats(s.data);
      setTopDealers(Array.isArray(t.data) ? t.data : []);
      setRecentActivity(a.data?.activities || []);
    }).finally(() => setLoading(false));
  }, []);

  const safe = (n: any) => Number(n) || 0;
  const totalDealers    = safe(stats?.dealers?.total ?? stats?.totalDealers);
  const activeDealers   = safe(stats?.dealers?.active ?? stats?.activeDealers);
  const pendingDealers  = safe(stats?.dealers?.pending ?? stats?.pendingDealers);
  // Correct: separate role counts
  const totalUsers      = safe(stats?.users?.total ?? stats?.totalUsers);
  const buyersOnly      = safe(stats?.users?.buyers);
  const partnersOnly    = safe(stats?.users?.partners ?? stats?.totalPartners);
  const staffOnly       = safe(stats?.users?.staff ?? stats?.totalStaff);
  const totalCars       = safe(stats?.inventory?.totalCars ?? stats?.totalCars);
  const totalSales      = safe(stats?.inventory?.totalSold ?? stats?.totalSales);
  const revenueAll      = safe(stats?.revenue?.allTime);
  const revenueMonth    = safe(stats?.revenue?.thisMonth);

  const fmt      = (n: number) => n.toLocaleString();
  const fmtNaira = (n: number) => `₦${n.toLocaleString()}`;
  const fmtTime  = (iso: string) => {
    if (!iso) return "";
    const d = Date.now() - new Date(iso).getTime();
    const m = Math.floor(d / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : new Date(iso).toLocaleDateString();
  };

  const STAT_CARDS = [
    { label:"Total Dealers",  value:totalDealers,  sub:`${activeDealers} active · ${pendingDealers} pending`, href:"/dashboard/super-admin/dealers",  color:"#F47B20" },
    { label:"Total Users",    value:totalUsers,     sub:"All registered accounts",                             href:"/dashboard/super-admin/users",     color:"#3B8BD4" },
    { label:"Buyers",         value:buyersOnly,     sub:"PUBLIC_USER role only",                               href:"/dashboard/super-admin/users?role=PUBLIC_USER",  color:"#F47B20" },
    { label:"Partners",       value:partnersOnly,   sub:"PARTNER_USER role only",                              href:"/dashboard/super-admin/users?role=PARTNER_USER", color:"#7B68EE" },
    { label:"Staff Members",  value:staffOnly,      sub:"DEALER_STAFF across all dealers",                     href:"/dashboard/super-admin/users?role=DEALER_STAFF", color:"#1D9E75" },
    { label:"Cars Listed",    value:totalCars,      sub:"Total inventory platform-wide",                       href:"/dashboard/super-admin/dealers",   color:"#F47B20" },
    { label:"Cars Sold",      value:totalSales,     sub:"Completed transactions",                              href:"/dashboard/super-admin/analytics", color:"#16A34A" },
  ];

  const QUICK_LINKS = [
    { label:"Pending Approvals", href:"/dashboard/super-admin/approvals",     icon:"⏳", desc:"Review dealer applications" },
    { label:"Broadcast Message", href:"/dashboard/super-admin/broadcast",     icon:"📢", desc:"Message all users" },
    { label:"Create Dealer",     href:"/dashboard/super-admin/create-dealer", icon:"➕", desc:"Add new dealer account" },
    { label:"Analytics",         href:"/dashboard/super-admin/analytics",     icon:"📊", desc:"Platform performance" },
    { label:"Activity Log",      href:"/dashboard/super-admin/activity",      icon:"📡", desc:"Recent platform events" },
    { label:"Settings",          href:"/dashboard/super-admin/settings",      icon:"⚙️", desc:"Platform configuration" },
  ];

  return (
    <div className="overview">
      <div className="ov-header">
        <div>
          <h1 className="ov-title">PLATFORM OVERVIEW</h1>
          <p className="ov-sub">CARSTRIMS Super Admin Dashboard · {new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <Link href="/feed" className="feed-link">View Public Feed →</Link>
      </div>

      {loading ? (
        <div className="stats-grid">{[...Array(7)].map((_,i)=><div key={i} className="stat-skel"/>)}</div>
      ) : (
        <div className="stats-grid">
          {STAT_CARDS.map(s => (
            <Link key={s.label} href={s.href} className="stat-card">
              <div className="sc-label">{s.label}</div>
              <div className="sc-value" style={{color:s.color}}>{fmt(s.value)}</div>
              <div className="sc-sub">{s.sub}</div>
            </Link>
          ))}
        </div>
      )}

      {!loading && (revenueAll > 0 || revenueMonth > 0) && (
        <div className="rev-row">
          <div className="rev-card"><div className="sc-label">ALL-TIME REVENUE</div><div className="sc-value" style={{color:"#16A34A"}}>{fmtNaira(revenueAll)}</div></div>
          <div className="rev-card"><div className="sc-label">THIS MONTH REVENUE</div><div className="sc-value" style={{color:"#F47B20"}}>{fmtNaira(revenueMonth)}</div></div>
        </div>
      )}

      {!loading && pendingDealers > 0 && (
        <Link href="/dashboard/super-admin/approvals" className="pending-alert">
          <span className="pa-dot"/><span><strong>{pendingDealers} dealer application{pendingDealers>1?"s":""}</strong> waiting for your approval</span><span className="pa-arrow">→</span>
        </Link>
      )}

      <div className="section-title">QUICK ACTIONS</div>
      <div className="quick-grid">
        {QUICK_LINKS.map(q=>(
          <Link key={q.label} href={q.href} className="quick-card">
            <span className="qc-icon">{q.icon}</span>
            <div className="qc-label">{q.label}</div>
            <div className="qc-desc">{q.desc}</div>
          </Link>
        ))}
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-title">TOP DEALERS</div>
          {loading?<div className="panel-empty">Loading...</div>:topDealers.length===0?<div className="panel-empty">No sales data yet</div>:(
            <div className="dealer-list">
              {topDealers.slice(0,5).map((d:any,i:number)=>(
                <div key={i} className="dealer-row">
                  <div className="dr-rank">{i+1}</div>
                  <div className="dr-info"><div className="dr-name">{d.dealerName||d.companyName||"—"}</div><div className="dr-id">{d.dealerId}</div></div>
                  <div className="dr-stats"><div className="dr-sales">{d.totalSales||0} sales</div><div className="dr-rev">₦{fmt(d.totalRevenue||0)}</div></div>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/super-admin/dealers" className="panel-link">View all dealers →</Link>
        </div>
        <div className="panel">
          <div className="panel-title">RECENT ACTIVITY</div>
          {loading?<div className="panel-empty">Loading...</div>:recentActivity.length===0?<div className="panel-empty">No recent activity</div>:(
            <div className="act-list">
              {recentActivity.slice(0,6).map((a:any,i:number)=>(
                <div key={i} className="act-row">
                  <div className="act-icon">{a.type==="dealer_approved"?"✅":a.type==="announcement"?"📢":"🔔"}</div>
                  <div className="act-body"><div className="act-title">{a.title}</div><div className="act-msg">{a.message?.slice(0,60)}{a.message?.length>60?"...":""}</div></div>
                  <div className="act-time">{fmtTime(a.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/super-admin/activity" className="panel-link">View all activity →</Link>
        </div>
      </div>

      <style>{`
        .overview{display:flex;flex-direction:column;gap:1.5rem}
        .ov-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .ov-title{font-family:var(--font-display);font-size:1.8rem;letter-spacing:0.06em;color:var(--text);line-height:1}
        .ov-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem}
        .feed-link{font-size:0.825rem;color:var(--orange);border:1px solid var(--orange-border);border-radius:6px;padding:0.5rem 1rem;white-space:nowrap;transition:all 0.2s;text-decoration:none}
        .feed-link:hover{background:var(--orange-pale)}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:1rem}
        .stat-card{background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:0.35rem;text-decoration:none;transition:all 0.2s}
        .stat-card:hover{border-color:var(--orange);transform:translateY(-2px);box-shadow:0 4px 16px rgba(244,123,32,0.1)}
        .stat-skel{background:var(--grey-100);border-radius:12px;height:110px;animation:pulse 1.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .sc-label{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
        .sc-value{font-family:var(--font-display);font-size:2.2rem;line-height:1;margin-top:0.25rem}
        .sc-sub{font-size:0.68rem;color:var(--text-dim)}
        .rev-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .rev-card{background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:0.35rem}
        .pending-alert{display:flex;align-items:center;gap:0.875rem;background:var(--orange-pale);border:1.5px solid var(--orange-border);border-radius:10px;padding:1rem 1.25rem;color:var(--orange-dim);text-decoration:none;font-size:0.875rem;transition:all 0.2s}
        .pending-alert:hover{background:#FFE8D0}
        .pa-dot{width:10px;height:10px;border-radius:50%;background:var(--orange);flex-shrink:0;animation:blink 1.5s infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .pa-arrow{margin-left:auto;font-weight:700;color:var(--orange)}
        .section-title{font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.15em;color:var(--text-muted)}
        .quick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.875rem}
        .quick-card{background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:1.25rem 1rem;display:flex;flex-direction:column;gap:0.4rem;text-decoration:none;transition:all 0.2s}
        .quick-card:hover{border-color:var(--orange);background:var(--orange-pale)}
        .qc-icon{font-size:1.5rem}
        .qc-label{font-family:var(--font-display);font-size:0.85rem;letter-spacing:0.06em;color:var(--text)}
        .qc-desc{font-size:0.72rem;color:var(--text-muted);line-height:1.4}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
        .panel{background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .panel-title{font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.15em;color:var(--text-muted)}
        .panel-empty{font-size:0.825rem;color:var(--text-dim);padding:1rem;text-align:center}
        .panel-link{font-size:0.8rem;color:var(--orange);text-align:right;text-decoration:none}
        .dealer-list{display:flex;flex-direction:column;gap:0.5rem}
        .dealer-row{display:flex;align-items:center;gap:0.75rem;padding:0.625rem 0;border-bottom:1px solid var(--border)}
        .dealer-row:last-child{border-bottom:none}
        .dr-rank{width:24px;height:24px;border-radius:50%;background:var(--orange-pale);color:var(--orange);font-size:0.78rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .dr-info{flex:1}
        .dr-name{font-size:0.825rem;font-weight:500;color:var(--text)}
        .dr-id{font-family:var(--font-mono);font-size:0.68rem;color:var(--text-dim)}
        .dr-stats{text-align:right}
        .dr-sales{font-size:0.72rem;color:var(--text-muted)}
        .dr-rev{font-size:0.825rem;font-weight:600;color:var(--orange)}
        .act-list{display:flex;flex-direction:column;gap:0.5rem}
        .act-row{display:flex;align-items:flex-start;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid var(--border)}
        .act-row:last-child{border-bottom:none}
        .act-icon{font-size:1rem;flex-shrink:0;margin-top:2px}
        .act-body{flex:1}
        .act-title{font-size:0.8rem;font-weight:500;color:var(--text)}
        .act-msg{font-size:0.72rem;color:var(--text-muted);margin-top:0.1rem}
        .act-time{font-size:0.65rem;color:var(--text-dim);font-family:var(--font-mono);flex-shrink:0;white-space:nowrap}
        @media(max-width:768px){.two-col{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,1fr)}.rev-row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
