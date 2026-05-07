"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [topDealers, setTopDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, gRes, tRes] = await Promise.all([
          api.get("/api/v1/admin/stats"),
          api.get("/api/v1/admin/growth"),
          api.get("/api/v1/admin/top-dealers?limit=10"),
        ]);
        setStats(sRes.data);
        setGrowth(gRes.data);
        setTopDealers(tRes.data);
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;
  const maxRev = Math.max(...growth.map((g) => g.revenue), 1);
  const maxDealers = Math.max(...growth.map((g) => g.newDealers), 1);

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h2 className="page-heading">Platform Analytics</h2>
        <p className="page-sub">Full platform performance overview</p>
      </div>

      <div className="analytics-grid">
        <div className="an-card wide">
          <h3 className="card-title">MONTHLY REVENUE (6 MONTHS)</h3>
          <div className="bar-chart">
            {growth.map((g, i) => (
              <div key={i} className="bar-col">
                <div className="bar-tooltip">{fmt(g.revenue)}<br />{g.sales} sales</div>
                <div className="bar rev-bar" style={{ height:`${Math.max(6,(g.revenue/maxRev)*160)}px` }} />
                <div className="bar-label">{g.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="an-card wide">
          <h3 className="card-title">NEW DEALER REGISTRATIONS (6 MONTHS)</h3>
          <div className="bar-chart">
            {growth.map((g, i) => (
              <div key={i} className="bar-col">
                <div className="bar-tooltip">{g.newDealers} new dealers</div>
                <div className="bar dealer-bar" style={{ height:`${Math.max(6,(g.newDealers/maxDealers)*120)}px` }} />
                <div className="bar-label">{g.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="an-card">
          <h3 className="card-title">DEALER BREAKDOWN</h3>
          <div className="breakdown">
            {[
              { label:"Active", val: stats?.dealers?.active || 0, color:"var(--success)" },
              { label:"Pending", val: stats?.dealers?.pending || 0, color:"var(--gold)" },
              { label:"Suspended", val: stats?.dealers?.suspended || 0, color:"var(--error)" },
              { label:"Total", val: stats?.dealers?.total || 0, color:"var(--text)" },
            ].map((b) => (
              <div key={b.label} className="breakdown-row">
                <span className="bd-label">{b.label}</span>
                <span className="bd-val" style={{ color: b.color }}>{b.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="an-card">
          <h3 className="card-title">REVENUE SUMMARY</h3>
          <div className="breakdown">
            {[
              { label:"All-time Revenue", val: fmt(stats?.revenue?.allTime || 0) },
              { label:"This Month", val: fmt(stats?.revenue?.thisMonth || 0) },
              { label:"Total Transactions", val: stats?.revenue?.totalTransactions || 0 },
              { label:"Cars Sold", val: stats?.inventory?.totalSold || 0 },
            ].map((b) => (
              <div key={b.label} className="breakdown-row">
                <span className="bd-label">{b.label}</span>
                <span className="bd-val" style={{ color:"var(--gold)" }}>{b.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="an-card wide">
          <h3 className="card-title">TOP 10 DEALERS BY SALES</h3>
          <div className="top-table-wrap">
            <table className="top-table">
              <thead>
                <tr><th>#</th><th>Company</th><th>Location</th><th>Cars Sold</th><th>Revenue</th><th>Status</th></tr>
              </thead>
              <tbody>
                {topDealers.map((d) => (
                  <tr key={d._id}>
                    <td className="rank-cell">#{d.rank}</td>
                    <td>
                      <div style={{ fontWeight:500 }}>{d.companyName}</div>
                      <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>{d.dealerId}</div>
                    </td>
                    <td style={{ color:"var(--text-muted)", fontSize:"0.8rem" }}>{d.city || "—"}, {d.state || "—"}</td>
                    <td style={{ textAlign:"center", fontFamily:"var(--font-mono)" }}>{d.totalCarsSold}</td>
                    <td style={{ color:"var(--success)", fontWeight:500 }}>{fmt(d.totalRevenue)}</td>
                    <td><span className={`st-pill ${d.status}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;flex-direction:column;gap:0.3rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted)}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:300px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--error);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
        .an-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .an-card.wide{grid-column:1/-1}
        .card-title{font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.15em;color:var(--text-muted)}
        .bar-chart{display:flex;align-items:flex-end;gap:8px;height:180px;overflow-x:auto;padding-bottom:1.5rem}
        .bar-col{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:48px;position:relative}
        .bar-col:hover .bar-tooltip{display:block}
        .bar-tooltip{display:none;position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--surface-3);border:1px solid var(--border);padding:0.35rem 0.5rem;border-radius:4px;font-size:0.65rem;color:var(--text);white-space:nowrap;z-index:10;text-align:center;line-height:1.5}
        .bar{border-radius:3px 3px 0 0;min-width:32px;min-height:6px;cursor:pointer;transition:opacity 0.2s}
        .rev-bar{background:rgba(224,82,82,0.5)}
        .dealer-bar{background:rgba(201,168,76,0.5)}
        .bar-col:hover .bar{opacity:0.8}
        .bar-label{font-size:0.7rem;color:var(--text-dim)}
        .breakdown{display:flex;flex-direction:column;gap:0.5rem}
        .breakdown-row{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid var(--border)}
        .breakdown-row:last-child{border-bottom:none}
        .bd-label{font-size:0.825rem;color:var(--text-muted)}
        .bd-val{font-family:var(--font-display);font-size:1.2rem;letter-spacing:0.03em}
        .top-table-wrap{overflow-x:auto}
        .top-table{width:100%;border-collapse:collapse}
        .top-table th{padding:0.65rem 0.875rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--border)}
        .top-table td{padding:0.75rem 0.875rem;border-bottom:1px solid var(--border);font-size:0.825rem;color:var(--text)}
        .top-table tr:last-child td{border-bottom:none}
        .top-table tr:hover td{background:var(--surface-2)}
        .rank-cell{font-family:var(--font-mono);font-size:0.75rem;color:var(--error)}
        .st-pill{padding:0.2rem 0.5rem;border-radius:20px;font-size:0.68rem;text-transform:capitalize;border:1px solid var(--border);color:var(--text-muted)}
        @media(max-width:900px){.analytics-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
