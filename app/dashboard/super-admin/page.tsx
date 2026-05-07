"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [growth, setGrowth] = useState<any[]>([]);
  const [topDealers, setTopDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, aRes, gRes, tRes] = await Promise.all([
          api.get("/api/v1/admin/stats"),
          api.get("/api/v1/admin/activity?limit=10"),
          api.get("/api/v1/admin/growth"),
          api.get("/api/v1/admin/top-dealers?limit=5"),
        ]);
        setStats(sRes.data);
        setActivity(aRes.data);
        setGrowth(gRes.data);
        setTopDealers(tRes.data);
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;
  const fmtTime = (iso: string) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const maxRev = Math.max(...growth.map((g) => g.revenue), 1);

  if (loading) {
    return <div className="loading-state"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-overview">
      {/* Stats Grid */}
      <div className="stats-grid">
        {[
          { label:"Total Dealers", value: stats?.dealers?.total || 0, sub:`${stats?.dealers?.active || 0} active`, icon:"🏢", link:"/dashboard/super-admin/dealers" },
          { label:"Pending Approval", value: stats?.dealers?.pending || 0, sub:"Awaiting review", icon:"⏳", accent:true, link:"/dashboard/super-admin/approvals" },
          { label:"Suspended", value: stats?.dealers?.suspended || 0, sub:"Accounts suspended", icon:"⛔", link:"/dashboard/super-admin/dealers?status=suspended" },
          { label:"Total Users", value: stats?.users?.total || 0, sub:`${stats?.users?.staff || 0} staff · ${stats?.users?.partners || 0} partners`, icon:"👥", link:"#" },
          { label:"Cars Listed", value: stats?.inventory?.totalCars || 0, sub:`${stats?.inventory?.totalSold || 0} sold`, icon:"🚗", link:"#" },
          { label:"Platform Revenue", value: fmt(stats?.revenue?.allTime || 0), sub:`${fmt(stats?.revenue?.thisMonth || 0)} this month`, icon:"💰", accent:true, link:"#" },
          { label:"Total Transactions", value: stats?.revenue?.totalTransactions || 0, sub:`${stats?.revenue?.monthTransactions || 0} this month`, icon:"💳", link:"#" },
          { label:"New Dealers (Month)", value: stats?.dealers?.thisMonth || 0, sub:"Registered this month", icon:"📈", link:"#" },
        ].map((s) => (
          <Link key={s.label} href={s.link} className={`stat-card ${s.accent ? "accent" : ""}`}>
            <div className="stat-top"><span>{s.icon}</span><span className="stat-label">{s.label}</span></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="two-col">
        {/* Revenue Chart */}
        <div className="section-card wide">
          <div className="section-header">
            <h3 className="section-title">REVENUE TREND (6 MONTHS)</h3>
          </div>
          {growth.length === 0 ? (
            <div className="no-data">No data yet</div>
          ) : (
            <div className="bar-chart">
              {growth.map((g, i) => (
                <div key={i} className="bar-col">
                  <div className="bar-tooltip">
                    {fmt(g.revenue)}<br />{g.sales} sales<br />{g.newDealers} new dealers
                  </div>
                  <div className="bar" style={{ height:`${Math.max(6, (g.revenue / maxRev) * 160)}px` }} />
                  <div className="bar-label">{g.month}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Dealers */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">TOP DEALERS</h3>
            <Link href="/dashboard/super-admin/dealers" className="see-all">See all</Link>
          </div>
          {topDealers.length === 0 ? (
            <div className="no-data">No dealers yet</div>
          ) : (
            <div className="top-list">
              {topDealers.map((d) => (
                <div key={d._id} className="top-row">
                  <div className="top-rank">#{d.rank}</div>
                  <div className="top-info">
                    <div className="top-name">{d.companyName}</div>
                    <div className="top-meta">{d.city || "—"} · {d.totalCarsSold} sold</div>
                  </div>
                  <div className="top-rev">{fmt(d.totalRevenue)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">LIVE ACTIVITY</h3>
            <Link href="/dashboard/super-admin/activity" className="see-all">See all</Link>
          </div>
          {activity.length === 0 ? (
            <div className="no-data">No activity yet</div>
          ) : (
            <div className="activity-list">
              {activity.map((a, i) => (
                <div key={i} className="activity-row">
                  <div className="activity-icon">{a.icon}</div>
                  <div className="activity-info">
                    <div className="activity-msg">{a.message}</div>
                    {a.amount && <div className="activity-amount">{fmt(a.amount)}</div>}
                  </div>
                  <div className="activity-time">{fmtTime(a.time)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="section-card">
          <h3 className="section-title">QUICK ACTIONS</h3>
          <div className="quick-actions">
            {[
              { label:"Approve Dealers", icon:"✅", href:"/dashboard/super-admin/approvals" },
              { label:"Create Dealer", icon:"➕", href:"/dashboard/super-admin/create-dealer" },
              { label:"View Analytics", icon:"📊", href:"/dashboard/super-admin/analytics" },
              { label:"All Dealers", icon:"🏢", href:"/dashboard/super-admin/dealers" },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="quick-action">
                <span className="qa-icon">{a.icon}</span>
                <span className="qa-label">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .admin-overview{display:flex;flex-direction:column;gap:1.5rem}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
        .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:0.4rem;text-decoration:none;transition:border-color 0.2s}
        .stat-card:hover{border-color:var(--border-light)}
        .stat-card.accent{border-color:rgba(224,82,82,0.3);background:rgba(224,82,82,0.03)}
        .stat-top{display:flex;align-items:center;gap:0.5rem}
        .stat-label{font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
        .stat-value{font-family:var(--font-display);font-size:1.8rem;color:var(--text);letter-spacing:0.03em;line-height:1}
        .stat-card.accent .stat-value{color:var(--error)}
        .stat-sub{font-size:0.72rem;color:var(--text-dim)}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
        .section-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .section-card.wide{grid-column:1/-1}
        .section-header{display:flex;align-items:center;justify-content:space-between}
        .section-title{font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.15em;color:var(--text-muted)}
        .see-all{font-size:0.75rem;color:var(--error);text-decoration:none;transition:opacity 0.2s}
        .see-all:hover{opacity:0.7}
        .no-data{font-size:0.825rem;color:var(--text-dim);text-align:center;padding:1rem}
        .bar-chart{display:flex;align-items:flex-end;gap:8px;height:180px;overflow-x:auto;padding-bottom:1.5rem;position:relative}
        .bar-col{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:40px;position:relative}
        .bar-col:hover .bar-tooltip{display:block}
        .bar-tooltip{display:none;position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--surface-3);border:1px solid var(--border);padding:0.4rem 0.6rem;border-radius:4px;font-size:0.65rem;color:var(--text);white-space:nowrap;z-index:10;text-align:center;line-height:1.6}
        .bar{background:rgba(224,82,82,0.5);border-radius:3px 3px 0 0;width:28px;min-height:6px;transition:background 0.2s;cursor:pointer}
        .bar-col:hover .bar{background:var(--error)}
        .bar-label{font-size:0.7rem;color:var(--text-dim)}
        .top-list{display:flex;flex-direction:column;gap:0.5rem}
        .top-row{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--border)}
        .top-row:last-child{border-bottom:none}
        .top-rank{font-family:var(--font-mono);font-size:0.75rem;color:var(--error);width:24px;flex-shrink:0}
        .top-info{flex:1}
        .top-name{font-size:0.875rem;font-weight:500;color:var(--text)}
        .top-meta{font-size:0.72rem;color:var(--text-muted)}
        .top-rev{font-size:0.825rem;color:var(--success);font-weight:500}
        .activity-list{display:flex;flex-direction:column;gap:0}
        .activity-row{display:flex;align-items:flex-start;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--border)}
        .activity-row:last-child{border-bottom:none}
        .activity-icon{font-size:1rem;flex-shrink:0;margin-top:1px}
        .activity-info{flex:1}
        .activity-msg{font-size:0.8rem;color:var(--text);line-height:1.4}
        .activity-amount{font-size:0.75rem;color:var(--success);margin-top:0.15rem}
        .activity-time{font-size:0.68rem;color:var(--text-dim);font-family:var(--font-mono);white-space:nowrap;flex-shrink:0}
        .quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem}
        .quick-action{background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s;cursor:pointer}
        .quick-action:hover{border-color:rgba(224,82,82,0.4);background:rgba(224,82,82,0.04)}
        .qa-icon{font-size:1.3rem}
        .qa-label{font-size:0.75rem;color:var(--text-muted);text-align:center;font-weight:500}
        .quick-action:hover .qa-label{color:var(--text)}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:400px}
        .spinner{width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--error);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:900px){.two-col{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}

