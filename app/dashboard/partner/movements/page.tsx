"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function PartnerMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/partners/my-dashboard")
      .then((r) => setMovements(r.data.recentMovements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString("en-NG") : "—";
  const STATUS_COLORS: Record<string,string> = { out:"#C9A84C", returned:"#4CAF82", overdue:"#E05252" };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-heading">Vehicle Movements</h2>
        <p className="page-sub">Track when your cars leave or return to the dealership</p>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : movements.length === 0 ? (
        <div className="empty"><div className="empty-icon">🔄</div><h3>No movements logged</h3><p>Movement logs for your cars will appear here</p></div>
      ) : (
        <div className="mov-list">
          {movements.map((m) => (
            <div key={m._id} className="mov-card">
              <div className="mov-left">
                <div className="mov-car">{m.carBrand} {m.carModel} {m.carYear}</div>
                <div className="mov-id">{m.movementId} · {m.carId}</div>
              </div>
              <div className="mov-center">
                <div className="mov-person">{m.takenByName}</div>
                <div className="mov-phone">{m.takenByPhone}</div>
                <div className="mov-purpose">{m.purpose?.replace(/_/g," ")}</div>
              </div>
              <div className="mov-times">
                <div className="time-row"><span className="tl">Out</span><span className="tv">{fmt(m.timeOut)}</span></div>
                {m.expectedReturnTime && <div className="time-row"><span className="tl">Expected</span><span className="tv">{fmt(m.expectedReturnTime)}</span></div>}
                {m.timeReturned && <div className="time-row"><span className="tl">Returned</span><span className="tv">{fmt(m.timeReturned)}</span></div>}
              </div>
              <div className="mov-status" style={{color: STATUS_COLORS[m.status] || "#888"}}>● {m.status}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;flex-direction:column;gap:0.3rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.875rem;color:var(--text-muted)}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:#3B8BD4;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:var(--text)}
        .empty p{color:var(--text-muted);font-size:0.875rem}
        .mov-list{display:flex;flex-direction:column;gap:0.75rem}
        .mov-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap}
        .mov-left{display:flex;flex-direction:column;gap:0.2rem;min-width:150px}
        .mov-car{font-weight:600;font-size:0.9rem;color:var(--text)}
        .mov-id{font-family:var(--font-mono);font-size:0.68rem;color:var(--text-dim)}
        .mov-center{display:flex;flex-direction:column;gap:0.2rem;flex:1;min-width:120px}
        .mov-person{font-weight:500;font-size:0.875rem;color:var(--text)}
        .mov-phone{font-size:0.78rem;color:var(--text-muted)}
        .mov-purpose{font-size:0.75rem;color:#3B8BD4;text-transform:capitalize}
        .mov-times{display:flex;flex-direction:column;gap:0.3rem;min-width:180px}
        .time-row{display:flex;gap:0.5rem}
        .tl{font-size:0.68rem;color:var(--text-dim);text-transform:uppercase;width:60px}
        .tv{font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono)}
        .mov-status{font-size:0.75rem;letter-spacing:0.05em;text-transform:capitalize;flex-shrink:0}
      `}</style>
    </div>
  );
}
