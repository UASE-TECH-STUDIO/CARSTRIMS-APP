"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const STATUS_COLORS: Record<string,string> = {
  pending:"#D97706", confirmed:"#16A34A", cancelled:"#DC2626", completed:"#888"
};
const APT_TYPES = ["showroom_visit","test_drive","inspection","payment_meeting"];

export default function DealerAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/dealers/me/appointments");
      setAppointments(res.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (aptId: string, status: string) => {
    try {
      await api.patch(`/api/v1/dealers/appointments/${aptId}`, { status });
      load();
    } catch (e: any) { alert(e.response?.data?.detail || "Failed"); }
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString("en-NG", {
    weekday:"short", year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"
  }) : "—";

  return (
    <div className="apts-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Appointments</h2>
          <p className="page-sub">{appointments.length} scheduled</p>
        </div>
        <button className="refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : appointments.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📅</div>
          <h3>No appointments yet</h3>
          <p>Customers can schedule showroom visits, test drives, and meetings through the app</p>
        </div>
      ) : (
        <div className="apt-list">
          {appointments.map((a) => (
            <div key={a._id} className="apt-card">
              <div className="apt-left">
                <div className="apt-type-icon">{a.type==="test_drive"?"🚗":a.type==="payment_meeting"?"💳":a.type==="inspection"?"🔍":"🏢"}</div>
                <div className="apt-info">
                  <div className="apt-type">{a.type?.replace(/_/g," ")}</div>
                  <div className="apt-customer">
                    {a.userName || "Customer"}{a.userPhone ? ` · ${a.userPhone}` : ""}
                  </div>
                  <div className="apt-time">📅 {fmt(a.scheduledAt)}</div>
                  {a.notes && <div className="apt-notes">{a.notes}</div>}
                </div>
              </div>
              <div className="apt-right">
                <span className="apt-status" style={{color:STATUS_COLORS[a.status]||"#888",borderColor:(STATUS_COLORS[a.status]||"#888")+"44",background:(STATUS_COLORS[a.status]||"#888")+"11"}}>
                  {a.status}
                </span>
                {a.status === "pending" && (
                  <div className="apt-actions">
                    <button className="act-btn confirm" onClick={() => updateStatus(a.appointmentId || a._id, "confirmed")}>
                      ✅ Confirm
                    </button>
                    <button className="act-btn cancel" onClick={() => updateStatus(a.appointmentId || a._id, "cancelled")}>
                      ✕ Decline
                    </button>
                  </div>
                )}
                {a.status === "confirmed" && (
                  <button className="act-btn complete" onClick={() => updateStatus(a.appointmentId || a._id, "completed")}>
                    ✓ Mark Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .apts-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .refresh-btn{background:#fff;border:1.5px solid #E5E5E5;color:#666;border-radius:6px;padding:0.6rem 1rem;font-size:0.825rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
        .refresh-btn:hover{border-color:#F47B20;color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .empty-icon{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem;max-width:320px}
        .apt-list{display:flex;flex-direction:column;gap:0.875rem}
        .apt-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:flex-start;justify-content:space-between;gap:1.25rem;flex-wrap:wrap;transition:border-color 0.2s}
        .apt-card:hover{border-color:#F47B20}
        .apt-left{display:flex;align-items:flex-start;gap:0.875rem;flex:1}
        .apt-type-icon{font-size:1.5rem;flex-shrink:0;margin-top:2px}
        .apt-info{display:flex;flex-direction:column;gap:0.25rem}
        .apt-type{font-weight:600;font-size:0.9rem;color:#1A1A1A;text-transform:capitalize}
        .apt-customer{font-size:0.78rem;color:#666}
        .apt-time{font-size:0.78rem;color:#888}
        .apt-notes{font-size:0.75rem;color:#AAA;font-style:italic}
        .apt-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.625rem;flex-shrink:0}
        .apt-status{padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize;border:1px solid}
        .apt-actions{display:flex;gap:0.4rem}
        .act-btn{border:none;border-radius:5px;padding:0.35rem 0.75rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);transition:opacity 0.2s}
        .act-btn.confirm{background:#F0FDF4;color:#16A34A;border:1px solid rgba(22,163,74,0.3)}
        .act-btn.confirm:hover{background:#DCFCE7}
        .act-btn.cancel{background:#FEF2F2;color:#DC2626;border:1px solid rgba(220,38,38,0.3)}
        .act-btn.cancel:hover{background:#FEE2E2}
        .act-btn.complete{background:#FFF7ED;color:#F47B20;border:1px solid rgba(244,123,32,0.3)}
        .act-btn.complete:hover{background:#FFEDD5}
      `}</style>
    </div>
  );
}
