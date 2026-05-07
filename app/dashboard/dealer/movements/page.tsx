"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

const PURPOSES = ["test_drive","inspection","repair","delivery","personal_use","showroom","other"];
const ID_TYPES = ["NIN","BVN","Driver's License","International Passport","Voter's Card","Other"];

const emptyForm = {
  carId:"", takenByName:"", takenByPhone:"", takenByAddress:"",
  takenByIdType:"NIN", takenByIdNumber:"", takenByIdImageUrl:"",
  purpose:"test_drive", expectedReturnTime:"", permittedBy:"", notes:"",
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showLog, setShowLog] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showReturn, setShowReturn] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<any>({});
  const [returnForm, setReturnForm] = useState({ returnedToName:"", condition:"good", notes:"" });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const idImgRef = useRef<HTMLInputElement>(null);
  const editIdImgRef = useRef<HTMLInputElement>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const params: any = { skip:0, limit:50 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/api/v1/movements/", { params });
      setMovements(res.data.movements);
      setTotal(res.data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const uploadIdCard = async (file: File): Promise<string> => {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await api.post("/api/v1/upload/document", fd, {
        headers: {"Content-Type":"multipart/form-data"},
      });
      return res.data.url || "";
    } catch { return ""; }
    finally { setUploading(false); }
  };

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/movements/", form);
      setShowLog(false); setForm(emptyForm); fetch();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.patch(`/api/v1/movements/${showReturn.movementId}/return`, returnForm);
      setShowReturn(null); setReturnForm({ returnedToName:"", condition:"good", notes:"" }); fetch();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.patch(`/api/v1/movements/${showEdit.movementId}/edit`, editForm);
      setShowEdit(null); fetch();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const exportCSV = () => {
    const rows = [
      ["Movement ID","Car ID","Taken By","Phone","Purpose","Status","Time Out","Time Returned"],
      ...movements.map((m) => [
        m.movementId, m.carId, m.takenByName, m.takenByPhone,
        m.purpose, m.status,
        m.timeOut ? new Date(m.timeOut).toLocaleString() : "",
        m.timeReturned ? new Date(m.timeReturned).toLocaleString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url;
    a.download=`movements-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString("en-NG", {
    day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"
  }) : "—";

  const STATUS_COLORS: Record<string,string> = { out:"#D97706", returned:"#16A34A", overdue:"#DC2626" };

  return (
    <div className="mov-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Vehicle Movements</h2>
          <p className="page-sub">{total} log{total!==1?"s":""}</p>
        </div>
        <div className="hbtns">
          <button className="btn-outline" onClick={exportCSV}>⬇ Export</button>
          <button className="btn-primary" onClick={() => { setShowLog(true); setForm(emptyForm); setError(""); }}>+ Log Movement</button>
        </div>
      </div>

      <div className="filter-tabs">
        {["all","out","returned","overdue"].map((s) => (
          <button key={s} className={`ftab ${statusFilter===s?"active":""}`} onClick={() => setStatusFilter(s)}>
            {s==="all"?"All":s}
          </button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : movements.length === 0 ? (
        <div className="empty"><div className="ei">🔄</div><h3>No movements logged</h3><p>Log when a vehicle leaves your premises</p></div>
      ) : (
        <div className="mov-list">
          {movements.map((m) => (
            <div key={m._id} className="mov-card">
              <div className="mov-left">
                <div className="mov-id">{m.movementId}</div>
                <div className="mov-car">{m.carBrand} {m.carModel} {m.carYear} · {m.carId}</div>
                <div className="mov-purpose">{m.purpose?.replace(/_/g," ")}</div>
              </div>
              <div className="mov-center">
                <div className="mov-person">{m.takenByName}</div>
                <div className="mov-phone">{m.takenByPhone}</div>
                {m.takenByIdType && <div className="mov-id-type">{m.takenByIdType}{m.takenByIdNumber ? `: ${m.takenByIdNumber}` : ""}</div>}
                {m.takenByIdImageUrl && <a href={m.takenByIdImageUrl} target="_blank" rel="noreferrer" className="id-img-link">📎 View ID</a>}
              </div>
              <div className="mov-times">
                <div className="time-row"><span className="tl">Out</span><span className="tv">{fmt(m.timeOut)}</span></div>
                {m.expectedReturnTime && <div className="time-row"><span className="tl">Expected</span><span className="tv">{fmt(m.expectedReturnTime)}</span></div>}
                {m.timeReturned && <div className="time-row"><span className="tl">Returned</span><span className="tv">{fmt(m.timeReturned)}</span></div>}
              </div>
              <div className="mov-right">
                <span className="mov-status" style={{color:STATUS_COLORS[m.status]||"#888"}}>{m.status}</span>
                <div className="mov-actions">
                  {m.status === "out" && (
                    <button className="act-sm" onClick={() => { setShowReturn(m); setReturnForm({returnedToName:"",condition:"good",notes:""}); }}>Return</button>
                  )}
                  <button className="act-sm" onClick={() => { setShowEdit(m); setEditForm({...m,editReason:""}); }}>Edit</button>
                </div>
                {m.editHistory?.length > 0 && <div className="edited-note">edited {m.editHistory.length}×</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LOG MOVEMENT */}
      {showLog && (
        <div className="modal-overlay" onClick={() => setShowLog(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">LOG VEHICLE MOVEMENT</h3>
              <button className="modal-close" onClick={() => setShowLog(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleLog} className="modal-form">
              <div className="form-section">VEHICLE</div>
              <div className="field"><label className="fl">Car ID *</label><input className="fi" placeholder="CAR-XXXXXXXX" value={form.carId} onChange={(e) => setForm({...form,carId:e.target.value})} required /></div>
              <div className="form-row"><label className="fl">Purpose</label>
                <div style={{gridColumn:"1/-1"}}>
                  <select className="fi" value={form.purpose} onChange={(e) => setForm({...form,purpose:e.target.value})}>
                    {PURPOSES.map((p) => <option key={p} value={p}>{p.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-section">PERSON TAKING CAR</div>
              <div className="form-row">
                <div className="field"><label className="fl">Full Name *</label><input className="fi" value={form.takenByName} onChange={(e) => setForm({...form,takenByName:e.target.value})} required /></div>
                <div className="field"><label className="fl">Phone *</label><input className="fi" value={form.takenByPhone} onChange={(e) => setForm({...form,takenByPhone:e.target.value})} required /></div>
              </div>
              <div className="field"><label className="fl">Address</label><input className="fi" value={form.takenByAddress} onChange={(e) => setForm({...form,takenByAddress:e.target.value})} /></div>
              <div className="form-section">VALID ID</div>
              <div className="form-row">
                <div className="field"><label className="fl">ID Type</label>
                  <select className="fi" value={form.takenByIdType} onChange={(e) => setForm({...form,takenByIdType:e.target.value})}>
                    {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label className="fl">ID Number</label><input className="fi" value={form.takenByIdNumber} onChange={(e) => setForm({...form,takenByIdNumber:e.target.value})} /></div>
              </div>
              <div className="field">
                <label className="fl">ID Card Photo / Scan</label>
                <div className="id-upload">
                  <button type="button" className="upload-id-btn" onClick={() => idImgRef.current?.click()}>
                    {uploading ? "Uploading..." : form.takenByIdImageUrl ? "✅ ID Uploaded — Change" : "📷 Upload / Snap ID Card"}
                  </button>
                  <input ref={idImgRef} type="file" accept="image/*" style={{display:"none"}}
                    onChange={async (e) => { const f=e.target.files?.[0]; if(f){ const url=await uploadIdCard(f); setForm(prev=>({...prev,takenByIdImageUrl:url})); }}} />
                  {form.takenByIdImageUrl && <a href={form.takenByIdImageUrl} target="_blank" rel="noreferrer" className="id-preview-link">Preview ID ↗</a>}
                </div>
              </div>
              <div className="form-section">DETAILS</div>
              <div className="form-row">
                <div className="field"><label className="fl">Expected Return</label><input type="datetime-local" className="fi" value={form.expectedReturnTime} onChange={(e) => setForm({...form,expectedReturnTime:e.target.value})} /></div>
                <div className="field"><label className="fl">Permitted By</label><input className="fi" placeholder="Staff name" value={form.permittedBy} onChange={(e) => setForm({...form,permittedBy:e.target.value})} /></div>
              </div>
              <div className="field"><label className="fl">Notes</label><textarea className="fi fi-ta" rows={2} value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} /></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowLog(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting||uploading}>{submitting?"Logging...":"Log Movement"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN VEHICLE */}
      {showReturn && (
        <div className="modal-overlay" onClick={() => setShowReturn(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">RETURN VEHICLE — {showReturn.carId}</h3>
              <button className="modal-close" onClick={() => setShowReturn(null)}>✕</button>
            </div>
            <form onSubmit={handleReturn} className="modal-form">
              <div className="field"><label className="fl">Received By</label><input className="fi" placeholder="Who received the car?" value={returnForm.returnedToName} onChange={(e) => setReturnForm({...returnForm,returnedToName:e.target.value})} /></div>
              <div className="field"><label className="fl">Return Condition</label>
                <select className="fi" value={returnForm.condition} onChange={(e) => setReturnForm({...returnForm,condition:e.target.value})}>
                  {["excellent","good","fair","damaged"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field"><label className="fl">Notes</label><textarea className="fi fi-ta" rows={2} value={returnForm.notes} onChange={(e) => setReturnForm({...returnForm,notes:e.target.value})} /></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowReturn(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Processing...":"Confirm Return"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MOVEMENT */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">EDIT MOVEMENT — {showEdit.movementId}</h3>
              <button className="modal-close" onClick={() => setShowEdit(null)}>✕</button>
            </div>
            {showEdit.editHistory?.length > 0 && (
              <div className="edit-info">
                Previously edited {showEdit.editHistory.length}× — last: {showEdit.editHistory[showEdit.editHistory.length-1]?.editedAt ? new Date(showEdit.editHistory[showEdit.editHistory.length-1].editedAt).toLocaleString() : "—"}
              </div>
            )}
            <form onSubmit={handleEdit} className="modal-form">
              <div className="form-row">
                <div className="field"><label className="fl">Taken By Name</label><input className="fi" value={editForm.takenByName||""} onChange={(e) => setEditForm({...editForm,takenByName:e.target.value})} /></div>
                <div className="field"><label className="fl">Phone</label><input className="fi" value={editForm.takenByPhone||""} onChange={(e) => setEditForm({...editForm,takenByPhone:e.target.value})} /></div>
              </div>
              <div className="field"><label className="fl">Purpose</label>
                <select className="fi" value={editForm.purpose||"test_drive"} onChange={(e) => setEditForm({...editForm,purpose:e.target.value})}>
                  {PURPOSES.map((p) => <option key={p} value={p}>{p.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="field"><label className="fl">Upload New ID Card</label>
                <div className="id-upload">
                  <button type="button" className="upload-id-btn" onClick={() => editIdImgRef.current?.click()}>
                    {uploading ? "Uploading..." : editForm.takenByIdImageUrl ? "✅ Change ID Photo" : "📷 Upload ID"}
                  </button>
                  <input ref={editIdImgRef} type="file" accept="image/*" style={{display:"none"}}
                    onChange={async (e) => { const f=e.target.files?.[0]; if(f){ const url=await uploadIdCard(f); setEditForm((p: any)=>({...p,takenByIdImageUrl:url})); }}} />
                  {editForm.takenByIdImageUrl && <a href={editForm.takenByIdImageUrl} target="_blank" rel="noreferrer" className="id-preview-link">Preview ↗</a>}
                </div>
              </div>
              <div className="field"><label className="fl">Notes</label><textarea className="fi fi-ta" rows={2} value={editForm.notes||""} onChange={(e) => setEditForm({...editForm,notes:e.target.value})} /></div>
              <div className="field"><label className="fl">Reason for Edit *</label><input className="fi" placeholder="Why are you editing this?" value={editForm.editReason||""} onChange={(e) => setEditForm({...editForm,editReason:e.target.value})} required /></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowEdit(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting||uploading}>{submitting?"Saving...":"Save Edit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .mov-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .hbtns{display:flex;gap:0.5rem}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .btn-outline:hover{border-color:#F47B20;color:#F47B20}
        .filter-tabs{display:flex;gap:0.3rem}
        .ftab{background:transparent;border:1.5px solid #DDD;border-radius:20px;padding:0.3rem 0.875rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);color:#888;transition:all 0.2s;text-transform:capitalize}
        .ftab:hover{border-color:#F47B20;color:#F47B20}
        .ftab.active{background:#F47B20;color:#fff;border-color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .mov-list{display:flex;flex-direction:column;gap:0.875rem}
        .mov-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;transition:border-color 0.2s}
        .mov-card:hover{border-color:#F47B20}
        .mov-left{display:flex;flex-direction:column;gap:0.2rem;min-width:140px}
        .mov-id{font-family:var(--font-mono);font-size:0.68rem;color:#AAA}
        .mov-car{font-weight:600;font-size:0.875rem;color:#1A1A1A}
        .mov-purpose{font-size:0.75rem;color:#F47B20;text-transform:capitalize}
        .mov-center{display:flex;flex-direction:column;gap:0.2rem;flex:1;min-width:120px}
        .mov-person{font-weight:500;font-size:0.875rem;color:#1A1A1A}
        .mov-phone{font-size:0.78rem;color:#888}
        .mov-id-type{font-size:0.72rem;color:#AAA}
        .id-img-link{font-size:0.72rem;color:#3B8BD4;text-decoration:none}
        .mov-times{display:flex;flex-direction:column;gap:0.3rem;min-width:160px}
        .time-row{display:flex;gap:0.5rem;align-items:center}
        .tl{font-size:0.65rem;color:#AAA;text-transform:uppercase;letter-spacing:0.06em;width:55px;flex-shrink:0}
        .tv{font-family:var(--font-mono);font-size:0.7rem;color:#555}
        .mov-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem;flex-shrink:0}
        .mov-status{font-size:0.75rem;font-weight:600;text-transform:capitalize}
        .mov-actions{display:flex;gap:0.3rem}
        .act-sm{background:#F5F5F5;border:1px solid #DDD;border-radius:4px;padding:0.25rem 0.65rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s}
        .act-sm:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .edited-note{font-size:0.65rem;color:#AAA;font-style:italic}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-sm{max-width:440px}
        .modal-xl{max-width:700px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .edit-info{padding:0.5rem 1.5rem;font-size:0.75rem;color:#888;background:#FAFAFA;border-bottom:1px solid #F0F0F0}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.875rem}
        .form-section{font-size:0.65rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#AAA;padding:0.4rem 0;border-bottom:1px solid #F0F0F0}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:70px}
        .id-upload{display:flex;align-items:center;gap:0.75rem}
        .upload-id-btn{background:#F5F5F5;border:1.5px dashed #DDD;border-radius:6px;padding:0.65rem 1rem;font-size:0.825rem;color:#888;cursor:pointer;font-family:var(--font-body);transition:all 0.2s;flex:1}
        .upload-id-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .id-preview-link{font-size:0.75rem;color:#3B8BD4;text-decoration:none;white-space:nowrap}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}.mov-card{flex-direction:column}}
      `}</style>
    </div>
  );
}
