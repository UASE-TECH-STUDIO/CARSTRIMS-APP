"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const TYPE_ICONS: Record<string, string> = {
  dealer_approved:"✅", dealer_suspended:"⛔", general:"📢",
  broadcast:"📣", password_recovery:"🔑", appointment:"📅",
  car_request:"🚗", partner_request:"🤝",
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  const load = async (s = 0, append = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/admin/activity?limit=${LIMIT}&skip=${s}`);
      const items = res.data?.activities || [];
      if (append) setActivities((p) => [...p, ...items]);
      else setActivities(items);
      setHasMore(items.length === LIMIT);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(0); }, []);

  const loadMore = () => { const ns = skip + LIMIT; setSkip(ns); load(ns, true); };

  const fmtTime = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-NG", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  };

  const TYPE_LABELS: Record<string, string> = {
    dealer_approved:"Dealer Approved", dealer_suspended:"Account Suspended",
    general:"General", broadcast:"Broadcast", password_recovery:"Password Reset",
    appointment:"Appointment", car_request:"Car Request", partner_request:"Partnership",
  };

  return (
    <div className="act-page">
      <div className="page-hdr">
        <div>
          <h2 className="page-title">Activity Log</h2>
          <p className="page-sub">All platform events and notifications in real-time</p>
        </div>
        <button className="refresh-btn" onClick={() => { setSkip(0); load(0); }}>↺ Refresh</button>
      </div>

      {loading && activities.length === 0 ? (
        <div className="loading"><div className="spinner" /></div>
      ) : activities.length === 0 ? (
        <div className="empty"><span style={{fontSize:"2.5rem"}}>📡</span><p>No activity recorded yet</p></div>
      ) : (
        <>
          <div className="act-list">
            {activities.map((a, i) => (
              <div key={a._id || i} className="act-item">
                <div className="ai-icon">{TYPE_ICONS[a.type] || "🔔"}</div>
                <div className="ai-body">
                  <div className="ai-top">
                    <span className="ai-title">{a.title}</span>
                    <span className={`ai-badge type-${a.type}`}>{TYPE_LABELS[a.type] || a.type}</span>
                  </div>
                  <div className="ai-msg">{a.message}</div>
                  <div className="ai-meta">
                    {a.receiverId && <span className="ai-receiver">→ {a.receiverId}</span>}
                    <span className="ai-time">{fmtTime(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button className="load-more" onClick={loadMore} disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </>
      )}

      <style>{`
        .act-page { display:flex; flex-direction:column; gap:1.5rem; }
        .page-hdr { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .page-title { font-family:var(--font-display); font-size:1.6rem; letter-spacing:0.06em; color:var(--text); line-height:1; }
        .page-sub { font-size:0.8rem; color:var(--text-muted); margin-top:0.3rem; }
        .refresh-btn { background:var(--surface); border:1.5px solid var(--border); color:var(--text-muted); border-radius:8px; padding:0.6rem 1.25rem; font-family:var(--font-body); font-size:0.875rem; cursor:pointer; transition:all 0.2s; }
        .refresh-btn:hover { border-color:var(--orange); color:var(--orange); }
        .loading { display:flex; align-items:center; justify-content:center; padding:3rem; }
        .spinner { width:28px; height:28px; border:2.5px solid var(--border); border-top-color:var(--orange); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .empty { display:flex; flex-direction:column; align-items:center; gap:0.75rem; padding:3rem; text-align:center; border:1.5px dashed var(--border); border-radius:12px; }
        .empty p { color:var(--text-muted); font-size:0.875rem; }
        .act-list { display:flex; flex-direction:column; border:1.5px solid var(--border); border-radius:12px; overflow:hidden; background:var(--surface); }
        .act-item { display:flex; align-items:flex-start; gap:1rem; padding:1rem 1.25rem; border-bottom:1px solid var(--border); transition:background 0.15s; }
        .act-item:last-child { border-bottom:none; }
        .act-item:hover { background:var(--grey-50); }
        .ai-icon { font-size:1.1rem; flex-shrink:0; margin-top:2px; width:24px; text-align:center; }
        .ai-body { flex:1; display:flex; flex-direction:column; gap:0.3rem; }
        .ai-top { display:flex; align-items:center; gap:0.625rem; flex-wrap:wrap; }
        .ai-title { font-size:0.875rem; font-weight:500; color:var(--text); }
        .ai-badge { font-size:0.65rem; padding:0.15rem 0.5rem; border-radius:20px; background:var(--orange-pale); color:var(--orange-dim); border:1px solid var(--orange-border); font-weight:500; white-space:nowrap; }
        .ai-msg { font-size:0.78rem; color:var(--text-muted); line-height:1.4; }
        .ai-meta { display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; }
        .ai-receiver { font-size:0.68rem; color:var(--text-dim); font-family:var(--font-mono); }
        .ai-time { font-size:0.68rem; color:var(--text-dim); font-family:var(--font-mono); margin-left:auto; }
        .load-more { background:var(--surface); border:1.5px solid var(--border); color:var(--text-muted); border-radius:8px; padding:0.875rem; width:100%; font-family:var(--font-body); font-size:0.875rem; cursor:pointer; transition:all 0.2s; }
        .load-more:hover { border-color:var(--orange); color:var(--orange); }
        .load-more:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>
    </div>
  );
}