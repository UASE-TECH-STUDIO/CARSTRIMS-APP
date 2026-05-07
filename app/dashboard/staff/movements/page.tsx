"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function StaffMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => setPerms(r.data.permissions||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (perms.includes("view_movements") || perms.includes("manage_movements")) {
      api.get("/api/v1/movements/", { params:{ skip:0, limit:50 } })
        .then((r) => setMovements(r.data.movements||[]))
        .catch(()=>{})
        .finally(()=>setLoading(false));
    } else { setLoading(false); }
  }, [perms]);

  const canView = perms.includes("view_movements") || perms.includes("manage_movements");

  if (!canView) return (
    <div style={{padding:"3rem",textAlign:"center",color:"#888"}}>
      <div style={{fontSize:"3rem"}}>🔒</div>
      <h3 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Access Restricted</h3>
      <p>You need <strong style={{color:"#1D9E75"}}>view_movements</strong> permission.</p>
    </div>
  );

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "—";
  const STATUS_COLORS: Record<string,string> = { out:"#D97706", returned:"#1D9E75", overdue:"#DC2626" };

  return (
    <div className="mov-page">
      <div className="page-header">
        <h2 className="page-heading">Vehicle Movements</h2>
        <p className="page-sub">{movements.length} log{movements.length!==1?"s":""}</p>
      </div>

      {loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"200px"}}><div className="spinner" /></div>
      : movements.length === 0 ? (
        <div className="empty"><div>🔄</div><h3>No movements logged</h3></div>
      ) : (
        <div className="mov-list">
          {movements.map((m) => (
            <div key={m._id} className="mov-card">
              <div className="mov-left">
                <div className="mov-car">{m.carBrand} {m.carModel} · {m.carId}</div>
                <div className="mov-id">{m.movementId}</div>
                <div className="mov-purpose">{m.purpose?.replace(/_/g," ")}</div>
              </div>
              <div className="mov-center">
                <div className="mov-person">{m.takenByName}</div>
                <div className="mov-phone">{m.takenByPhone}</div>
              </div>
              <div className="mov-times">
                <div><span className="tl">Out:</span> {fmt(m.timeOut)}</div>
                {m.timeReturned && <div><span className="tl">Returned:</span> {fmt(m.timeReturned)}</div>}
              </div>
              <span className="mov-status" style={{color:STATUS_COLORS[m.status]||"#888"}}>{m.status}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`.mov-page{display:flex;flex-direction:column;gap:1.5rem}.page-header{display:flex;flex-direction:column;gap:0.3rem}.page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}.page-sub{font-size:0.8rem;color:#888}.spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}.empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}.mov-list{display:flex;flex-direction:column;gap:0.75rem}.mov-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:flex-start;gap:1.25rem;flex-wrap:wrap;transition:border-color 0.2s}.mov-card:hover{border-color:#1D9E75}.mov-left{display:flex;flex-direction:column;gap:0.2rem;min-width:140px}.mov-car{font-weight:600;font-size:0.9rem;color:#1A1A1A}.mov-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}.mov-purpose{font-size:0.72rem;color:#1D9E75;text-transform:capitalize}.mov-center{flex:1;display:flex;flex-direction:column;gap:0.2rem}.mov-person{font-weight:500;font-size:0.875rem;color:#1A1A1A}.mov-phone{font-size:0.75rem;color:#888}.mov-times{display:flex;flex-direction:column;gap:0.3rem;font-size:0.72rem;color:#888}.tl{font-size:0.65rem;color:#AAA;text-transform:uppercase;letter-spacing:0.05em;margin-right:0.3rem}.mov-status{font-size:0.75rem;font-weight:600;text-transform:capitalize;flex-shrink:0}`}</style>
    </div>
  );
}
