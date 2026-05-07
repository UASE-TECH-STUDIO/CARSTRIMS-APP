"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

export default function ActivityPage() {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchActivity = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/admin/activity?limit=50");
      setActivity(res.data);
      setLastRefreshed(new Date());
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchActivity();
    if (!autoRefresh) return;
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, [fetchActivity, autoRefresh]);

  const fmtTime = (iso: string) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString("en-NG");
  };

  const TYPE_COLORS: Record<string, string> = {
    sale: "var(--success)",
    registration: "var(--gold)",
    car: "#3B8BD4",
    movement: "#7B68EE",
    general: "var(--text-dim)",
  };

  return (
    <div className="activity-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Live Activity Feed</h2>
          <p className="page-sub">
            Real-time platform activity · Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <div className="controls">
          <label className="auto-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (15s)</span>
          </label>
          <button className="refresh-btn" onClick={fetchActivity}>
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : activity.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <h3>No activity yet</h3>
          <p>Platform activity will appear here as dealers and users interact with the system</p>
        </div>
      ) : (
        <div className="activity-feed">
          {activity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-left">
                <div
                  className="activity-dot"
                  style={{ background: TYPE_COLORS[a.type] || "var(--text-dim)" }}
                />
                {i < activity.length - 1 && <div className="activity-line" />}
              </div>
              <div className="activity-content">
                <div className="activity-icon-lg">{a.icon || "📋"}</div>
                <div className="activity-body">
                  <div className="activity-message">{a.message}</div>
                  {a.amount && (
                    <div className="activity-amount">
                      ₦{Number(a.amount).toLocaleString()}
                    </div>
                  )}
                  <div className="activity-meta">
                    <span
                      className="activity-type"
                      style={{ color: TYPE_COLORS[a.type] || "var(--text-dim)" }}
                    >
                      {a.type}
                    </span>
                    <span className="activity-time">{fmtTime(a.time)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .activity-page { display:flex; flex-direction:column; gap:1.5rem; max-width:800px; }
        .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .page-heading { font-family:var(--font-display); font-size:1.6rem; letter-spacing:0.05em; color:var(--text); line-height:1; }
        .page-sub { font-size:0.8rem; color:var(--text-muted); margin-top:0.3rem; }
        .controls { display:flex; align-items:center; gap:0.75rem; flex-shrink:0; }
        .auto-toggle { display:flex; align-items:center; gap:0.5rem; font-size:0.825rem; color:var(--text-muted); cursor:pointer; }
        .auto-toggle input { accent-color:var(--error); }
        .refresh-btn { background:var(--surface); border:1px solid var(--border); color:var(--text-muted); padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-size:0.825rem; font-family:var(--font-body); transition:all 0.2s; }
        .refresh-btn:hover { border-color:var(--error); color:var(--text); }
        .loading-state { display:flex; align-items:center; justify-content:center; min-height:200px; }
        .spinner { width:28px; height:28px; border:2px solid var(--border); border-top-color:var(--error); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .empty-state { display:flex; flex-direction:column; align-items:center; gap:0.75rem; padding:3rem; text-align:center; border:1px dashed var(--border); border-radius:12px; }
        .empty-icon { font-size:2.5rem; }
        .empty-state h3 { font-family:var(--font-display); font-size:1.2rem; color:var(--text); }
        .empty-state p { color:var(--text-muted); font-size:0.875rem; max-width:360px; }
        .activity-feed { display:flex; flex-direction:column; }
        .activity-item { display:flex; gap:0; align-items:stretch; }
        .activity-left { display:flex; flex-direction:column; align-items:center; width:28px; flex-shrink:0; padding-top:6px; }
        .activity-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .activity-line { flex:1; width:2px; background:var(--border); margin:4px 0; }
        .activity-content { display:flex; align-items:flex-start; gap:0.875rem; padding:0 0 1.5rem 1rem; flex:1; }
        .activity-icon-lg { font-size:1.1rem; flex-shrink:0; margin-top:1px; }
        .activity-body { flex:1; display:flex; flex-direction:column; gap:0.2rem; }
        .activity-message { font-size:0.875rem; color:var(--text); line-height:1.5; }
        .activity-amount { font-size:0.825rem; color:var(--success); font-weight:500; }
        .activity-meta { display:flex; gap:0.75rem; margin-top:0.15rem; }
        .activity-type { font-size:0.7rem; text-transform:capitalize; font-weight:500; }
        .activity-time { font-size:0.7rem; color:var(--text-dim); font-family:var(--font-mono); }
      `}</style>
    </div>
  );
}
