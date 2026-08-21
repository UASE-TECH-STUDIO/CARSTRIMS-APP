"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import { renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, rowsToExcelBlob, downloadBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

const PURPOSES   = ["test_drive","inspection","repair","delivery","personal_use","showroom","other"];
const ID_TYPES   = ["NIN","BVN","Driver's License","International Passport","Voter's Card","Other"];
const CONDITIONS = ["good","fair","damaged","needs_service"];

const emptyForm = {
  carId:"", takenByName:"", takenByPhone:"", takenByAddress:"",
  takenByIdType:"NIN", takenByIdNumber:"", takenByIdImageUrl:"",
  purpose:"test_drive", expectedReturnTime:"", permittedBy:"",
  approvalType:"self",
  approverUserIds:[] as string[],  // for multi-select
  notes:"",
};

export default function MovementsPage() {
  const [movements,    setMovements]    = useState<any[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showLog,      setShowLog]      = useState(false);
  const [showDetail,   setShowDetail]   = useState<any>(null);
  const [showEdit,     setShowEdit]     = useState<any>(null);
  const [showReturn,   setShowReturn]   = useState<any>(null);
  const [form,         setForm]         = useState(emptyForm);
  const [editForm,     setEditForm]     = useState<any>({});
  const [returnForm,   setReturnForm]   = useState({
    returnerType:"same",  // "same" or "different"
    returnedToName:"", returnedToPhone:"", returnedToAddress:"",
    condition:"good", notes:"",
  });
  const [submitting,   setSubmitting]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState("");
  const [teamMembers,  setTeamMembers]  = useState<any[]>([]);
  const [imgPreview,   setImgPreview]   = useState<string|null>(null);

  // Car search state
  const [movCarSearch,  setMovCarSearch]  = useState("");
  const [movCarResults, setMovCarResults] = useState<any[]>([]);
  const [movCarDrop,    setMovCarDrop]    = useState(false);
  const idImgRef = useRef<HTMLInputElement>(null);

  // Car search autocomplete
  useEffect(() => {
    if (movCarSearch.length < 1) { setMovCarResults([]); setMovCarDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/api/v1/cars/", { params: { search: movCarSearch, limit: 20 } });
        setMovCarResults(r.data?.cars || []); setMovCarDrop(true);
      } catch { setMovCarResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [movCarSearch]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50, skip: 0 };
      if (statusFilter !== "all") params.status = statusFilter;
      const r = await api.get("/api/v1/movements/", { params });
      setMovements(r.data?.movements || r.data || []);
      setTotal(r.data?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  useEffect(() => {
    api.get("/api/v1/messages/my-team")
      .then(r => setTeamMembers(r.data || []))
      .catch(() => {});
  }, []);

  const uploadIdCard = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("folder", "id_cards");
      const r = await api.post("/api/v1/upload/temp/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return r.data?.url || "";
    } catch { return ""; } finally { setUploading(false); }
  };

  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.carId) { setError("Please select a vehicle first"); return; }
    setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/movements/", {
        carId: form.carId,
        takenByName: form.takenByName,
        takenByPhone: form.takenByPhone,
        takenByAddress: form.takenByAddress,
        takenByIdType: form.takenByIdType,
        takenByIdNumber: form.takenByIdNumber,
        takenByIdImageUrl: form.takenByIdImageUrl,
        purpose: form.purpose,
        expectedReturnTime: form.expectedReturnTime,
        permittedBy: form.permittedBy,
        approvalType: form.approvalType,
        approverUserIds: form.approverUserIds,
        notes: form.notes,
      });
      setShowLog(false);
      setForm(emptyForm);
      setMovCarSearch("");
      fetchMovements();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to log movement. Please try again.");
    } finally { setSubmitting(false); }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const id = showEdit.movementId || showEdit._id;
      await api.patch(`/api/v1/movements/${id}/edit`, editForm);
      setShowEdit(null); fetchMovements();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to update");
    } finally { setSubmitting(false); }
  };

  const approveMovement = async (m: any) => {
    const id = m.movementId || m._id;
    try {
      await api.patch(`/api/v1/movements/${id}/approve`, {});
      fetchMovements();
      if (showDetail?._id === m._id) setShowDetail(null);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to approve");
    }
  };

  const submitReturn = async () => {
    if (!showReturn) return;
    setSubmitting(true); setError("");
    try {
      const id = showReturn.movementId || showReturn._id;
      const payload: any = {
        returnedToName: returnForm.returnerType === "same"
          ? showReturn.takenByName
          : returnForm.returnedToName,
        returnedToPhone: returnForm.returnerType === "same"
          ? showReturn.takenByPhone
          : returnForm.returnedToPhone,
        condition: returnForm.condition,
        notes: returnForm.notes,
        returnerType: returnForm.returnerType,
      };
      await api.patch(`/api/v1/movements/${id}/return`, payload);
      setShowReturn(null);
      fetchMovements();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to log return");
    } finally { setSubmitting(false); }
  };

  const fmtDate = (iso: any) => iso
    ? new Date(iso).toLocaleString("en-NG", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
    : "";

  const showToast = useToast();
  const [exportBusy, setExportBusy] = useState<"" | "pdf" | "jpg" | "excel">("");
  const [showExportPicker, setShowExportPicker] = useState(false);

  const buildMovementsHtml = () => {
    const now = new Date().toLocaleString("en-NG");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;font-size:12px}
      h1{font-size:18px;margin:0 0 4px} .sub{color:#737373;font-size:11px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{background:#1A1A1A;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase}
      td{padding:7px 10px;border-bottom:1px solid #E5E5E5;font-size:11px}
      tr:nth-child(even) td{background:#FAFAFA}
      .footer{margin-top:16px;font-size:9px;color:#A3A3A3;text-align:center}
      </style></head><body>
      <h1>Vehicle Movements</h1>
      <div class="sub">${movements.length} record${movements.length!==1?"s":""} &bull; Generated ${now}</div>
      <table><thead><tr><th>Vehicle</th><th>Taken By</th><th>Purpose</th><th>Status</th><th>Out</th><th>Returned</th></tr></thead>
      <tbody>${movements.map((m:any)=>`<tr><td>${m.carBrand||""} ${m.carModel||""}<br/><span style="color:#A3A3A3;font-size:9px">${m.carId}</span></td><td>${m.takenByName||""}</td><td>${(m.purpose||"").replace(/_/g," ")}</td><td>${m.status}</td><td>${fmtDate(m.timeOut||m.createdAt)}</td><td>${m.timeIn?fmtDate(m.timeIn):"—"}</td></tr>`).join("")}</tbody>
      </table>
      <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
      </body></html>`;
  };

  const handleMovementsExport = async (format: "pdf" | "jpg" | "excel") => {
    setShowExportPicker(false);
    setExportBusy(format);
    try {
      const filename = `carstrims-movements-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob(movements.map((m:any) => ({
          Vehicle: `${m.carBrand||""} ${m.carModel||""}`, "Vehicle ID": m.carId,
          "Taken By": m.takenByName || "", Purpose: (m.purpose||"").replace(/_/g," "),
          Status: m.status, "Time Out": fmtDate(m.timeOut||m.createdAt),
          "Time In": m.timeIn ? fmtDate(m.timeIn) : "",
        })), "Movements");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const html = buildMovementsHtml();
        const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "Vehicle Movements");
        await downloadBlob(blob, `${filename}.${format}`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Export failed", "error");
    } finally {
      setExportBusy("");
    }
  };

  // Toggle an approver in the multi-select list
  const toggleApprover = (uid: string) => {
    setForm(f => ({
      ...f,
      approverUserIds: f.approverUserIds.includes(uid)
        ? f.approverUserIds.filter(x => x !== uid)
        : [...f.approverUserIds, uid],
    }));
  };

  // Styles
  const fi: React.CSSProperties = { width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"10px 14px", fontSize:"14px", outline:"none", boxSizing:"border-box", fontFamily:"var(--font-body)" };
  const la: React.CSSProperties = { fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"4px" };
  const fw: React.CSSProperties = { display:"flex", flexDirection:"column" as const, marginBottom:"14px" };

  const ApprovalBadge = ({ m }: { m: any }) => {
    const a = m.approvalStatus || "approved";
    const colors: Record<string,{bg:string;color:string}> = {
      approved: {bg:"#F0FDF4", color:"#16A34A"},
      pending:  {bg:"#FFF7ED", color:"#D97706"},
      declined: {bg:"#FEF2F2", color:"#DC2626"},
    };
    const c = colors[a] || colors.pending;
    return <span style={{padding:"2px 8px",borderRadius:"20px",fontSize:"11px",fontWeight:700,background:c.bg,color:c.color}}>{a}</span>;
  };

  const pendingApprovals = movements.filter(m => m.approvalStatus === "pending");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", letterSpacing:"0.05em", color:"#1A1A1A", margin:"0 0 4px" }}>Vehicle Movements</h2>
          <p style={{ fontSize:"13px", color:"#888", margin:0 }}>{total} total movements</p>
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap" as const,alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowExportPicker(v=>!v)} disabled={exportBusy!==""}
              style={{ background:"#F5F5F5", color:"#525252", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"11px 18px", fontSize:"13px", cursor:"pointer", fontWeight:600 }}>
              {exportBusy ? "Exporting…" : "Export"}
            </button>
            {showExportPicker && (
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"130px"}}>
                <button onClick={()=>handleMovementsExport("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
                <button onClick={()=>handleMovementsExport("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
                <button onClick={()=>handleMovementsExport("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as Excel</button>
              </div>
            )}
          </div>
          <button onClick={() => { setShowLog(true); setError(""); setForm(emptyForm); setMovCarSearch(""); }}
            style={{ background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"11px 20px", fontFamily:"var(--font-display)", fontSize:"14px", letterSpacing:"0.08em", cursor:"pointer", fontWeight:700 }}>
            + Log Movement
          </button>
        </div>
      </div>

      {/* Pending approvals banner */}
      {pendingApprovals.length > 0 && (
        <div style={{ background:"#FFF7ED", border:"1.5px solid rgba(244,123,32,0.3)", borderRadius:"10px", padding:"14px 18px" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"11px", letterSpacing:"0.1em", color:"#F47B20", marginBottom:"10px" }}>
            PENDING MOVEMENT APPROVALS ({pendingApprovals.length})
          </div>
          {pendingApprovals.map((m: any) => (
            <div key={m._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap", background:"#fff", borderRadius:"8px", padding:"10px 14px", marginBottom:"6px" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:"14px" }}>{m.carBrand} {m.carModel}  {m.carId}</div>
                <div style={{ fontSize:"12px", color:"#737373" }}>{m.takenByName}  {m.purpose?.replace(/_/g," ")}  {fmtDate(m.createdAt)}</div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={() => approveMovement(m)} style={{ background:"#16A34A", color:"#fff", border:"none", borderRadius:"7px", padding:"7px 16px", fontSize:"13px", cursor:"pointer", fontWeight:700 }}> Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status filters */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
        {["all","out","returned","completed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ background:statusFilter===s?"#1A1A1A":"#F5F5F5", color:statusFilter===s?"#fff":"#525252", border:`1.5px solid ${statusFilter===s?"#1A1A1A":"#E5E5E5"}`, borderRadius:"7px", padding:"6px 14px", fontSize:"12px", cursor:"pointer", fontWeight:statusFilter===s?700:400, textTransform:"capitalize" as const }}>
            {s}
          </button>
        ))}
      </div>

      {/* Movements list */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}>
          <div style={{ width:"28px", height:"28px", border:"2.5px solid #E5E5E5", borderTopColor:"#F47B20", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : movements.length === 0 ? (
        <div style={{ padding:"3rem", textAlign:"center", border:"1.5px dashed #E5E5E5", borderRadius:"12px", background:"#fff" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"10px" }}></div>
          <p style={{ color:"#888", fontSize:"14px", margin:0 }}>No vehicle movements logged yet</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {movements.map((m: any) => (
            <div key={m._id || m.movementId} style={{ background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"10px", padding:"14px 18px", display:"flex", alignItems:"flex-start", gap:"14px", flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:"200px" }}>
                <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"4px", flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, fontSize:"15px", color:"#1A1A1A" }}>{m.carBrand} {m.carModel} {m.carYear}</span>
                  <span style={{ fontSize:"11px", color:"#A3A3A3", fontFamily:"monospace" }}>{m.carId}</span>
                  <ApprovalBadge m={m}/>
                  <span style={{ padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:600, background:"#F5F5F5", color:"#525252", textTransform:"capitalize" as const }}>{m.status}</span>
                </div>
                <div style={{ fontSize:"13px", color:"#737373" }}>
                  Taken by: <strong>{m.takenByName}</strong>  {m.purpose?.replace(/_/g," ")}  {fmtDate(m.timeOut || m.createdAt)}
                </div>
                {m.expectedReturnTime && <div style={{ fontSize:"12px", color:"#A3A3A3" }}>Expected return: {fmtDate(m.expectedReturnTime)}</div>}
                {m.approvedByName && <div style={{ fontSize:"12px", color:"#16A34A", marginTop:"2px" }}> Approved by {m.approvedByName}</div>}
              </div>
              <div style={{ display:"flex", gap:"6px", flexShrink:0, flexWrap:"wrap" }}>
                <button onClick={() => setShowDetail(m)} style={{ background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#525252", borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>View</button>
                <button onClick={() => { setShowEdit(m); setEditForm({ takenByName:m.takenByName||"", takenByPhone:m.takenByPhone||"", takenByAddress:m.takenByAddress||"", takenByIdType:m.takenByIdType||"NIN", takenByIdNumber:m.takenByIdNumber||"", purpose:m.purpose||"test_drive", expectedReturnTime:m.expectedReturnTime||"", permittedBy:m.permittedBy||"", notes:m.notes||"" }); setError(""); }}
                  style={{ background:"#FFF7ED", border:"1.5px solid rgba(244,123,32,.3)", color:"#C4621A", borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>Edit</button>
                {m.approvalStatus === "pending" && (
                  <button onClick={() => approveMovement(m)} style={{ background:"#16A34A", color:"#fff", border:"none", borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:700 }}> Approve</button>
                )}
                {m.status === "out" && m.approvalStatus !== "pending" && (
                  <button onClick={() => { setShowReturn(m); setReturnForm({ returnerType:"same", returnedToName:"", returnedToPhone:"", returnedToAddress:"", condition:"good", notes:"" }); setError(""); }}
                    style={{ background:"#EFF6FF", border:"1.5px solid #BFDBFE", color:"#1D4ED8", borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>Return</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/*  LOG MOVEMENT MODAL  */}
      {showLog && (
        <div onClick={() => setShowLog(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", width:"100%", maxWidth:"720px", maxHeight:"94vh", borderRadius:"16px 16px 0 0", overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"14px 20px", background:"#1A1A1A", flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"14px", letterSpacing:"0.08em", color:"#F47B20" }}>LOG VEHICLE MOVEMENT</div>
              <button onClick={() => setShowLog(false)} style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:"50%", width:"28px", height:"28px", cursor:"pointer", fontSize:"16px" }}>×</button>
            </div>
            {error && <div style={{ background:"#FEF2F2", color:"#DC2626", padding:"10px 20px", fontSize:"13px", fontWeight:600, flexShrink:0 }}>{error}</div>}
            <form onSubmit={submitLog} style={{ overflowY:"auto", flex:1, minHeight:0, padding:"20px", display:"flex", flexDirection:"column" }}>

              {/* Vehicle */}
              <div style={fw}>
                <label style={la}>Vehicle *</label>
                <div style={{ position:"relative" }}>
                  <input style={fi} placeholder="Search by car ID, brand or model..." value={movCarSearch}
                    onChange={e => { setMovCarSearch(e.target.value); if (!e.target.value) setForm({...form, carId:""}); }}/>
                  {form.carId && <div style={{ fontSize:"11px", color:"#16A34A", marginTop:"3px" }}> Selected: {form.carId}</div>}
                  {movCarDrop && movCarResults.length > 0 && (
                    <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"8px", zIndex:100, maxHeight:"200px", overflowY:"auto", boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
                      {movCarResults.map((c:any) => (
                        <div key={c.carId} onClick={() => { setForm({...form, carId:c.carId}); setMovCarSearch(`${c.brand} ${c.model} (${c.carId})`); setMovCarDrop(false); }}
                          style={{ padding:"10px 14px", cursor:"pointer", fontSize:"13px", borderBottom:"1px solid #F5F5F5", display:"flex", justifyContent:"space-between" }}
                          onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
                          onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                          <span><strong>{c.brand} {c.model} {c.year}</strong> <span style={{color:"#A3A3A3",fontSize:"11px"}}>{c.carId}</span></span>
                          <span style={{ fontSize:"11px", color:"#16A34A" }}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Person taking car */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                <div style={fw}><label style={la}>Taken By (Name) *</label><input style={fi} required value={form.takenByName} onChange={e=>setForm({...form,takenByName:e.target.value})} placeholder="Full name"/></div>
                <div style={fw}><label style={la}>Phone Number</label><input style={fi} value={form.takenByPhone} onChange={e=>setForm({...form,takenByPhone:e.target.value})} placeholder="Contact phone"/></div>
                <div style={fw}><label style={la}>Purpose *</label>
                  <select style={fi} required value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}>
                    {PURPOSES.map(p=><option key={p} value={p}>{p.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div style={fw}><label style={la}>Expected Return Date & Time</label><input type="datetime-local" style={fi} value={form.expectedReturnTime} onChange={e=>setForm({...form,expectedReturnTime:e.target.value})}/></div>
                <div style={{...fw, gridColumn:"1/-1"}}><label style={la}>Address</label><input style={fi} value={form.takenByAddress} onChange={e=>setForm({...form,takenByAddress:e.target.value})} placeholder="Address of person taking car"/></div>
              </div>

              {/* ID Verification */}
              <div style={{ background:"#F9F9F9", border:"1px solid #E5E5E5", borderRadius:"10px", padding:"14px 16px", marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", color:"#525252", marginBottom:"12px" }}>ID VERIFICATION</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <div style={fw}><label style={la}>ID Type</label>
                    <select style={fi} value={form.takenByIdType} onChange={e=>setForm({...form,takenByIdType:e.target.value})}>
                      {ID_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={fw}><label style={la}>ID Number</label><input style={fi} value={form.takenByIdNumber} onChange={e=>setForm({...form,takenByIdNumber:e.target.value})} placeholder="ID card number"/></div>
                  <div style={{...fw, gridColumn:"1/-1"}}>
                    <label style={la}>ID Card Photo</label>
                    <input ref={idImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const file=e.target.files?.[0]; if(file){const url=await uploadIdCard(file);if(url)setForm({...form,takenByIdImageUrl:url});}}}/>
                    <button type="button" onClick={()=>idImgRef.current?.click()} style={{...fi,cursor:"pointer",textAlign:"left" as const,color:form.takenByIdImageUrl?"#16A34A":"#A3A3A3"}}>
                      {uploading?"Uploading...":form.takenByIdImageUrl?" ID photo uploaded":"+ Upload ID card photo"}
                    </button>
                    {form.takenByIdImageUrl && <img src={form.takenByIdImageUrl} alt="ID" style={{width:"100px",height:"65px",objectFit:"cover",borderRadius:"6px",marginTop:"6px",border:"1px solid #E5E5E5",cursor:"pointer"}} onClick={()=>setImgPreview(form.takenByIdImageUrl||null)}/>}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={fw}><label style={la}>Notes</label><textarea style={{...fi,resize:"vertical" as const,minHeight:"60px"}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Additional notes..."/></div>

              {/* APPROVAL SECTION */}
              <div style={{ background:"#F0FDF4", border:"1.5px solid #86EFAC", borderRadius:"10px", padding:"14px 16px", marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", color:"#15803D", marginBottom:"12px" }}>MOVEMENT APPROVAL</div>

                {/* Radio options */}
                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>
                  {[
                    {val:"self",    label:"Self Approval",       sub:"Movement logs immediately as approved", color:"#16A34A", bg:"#DCFCE7", bd:"#86EFAC"},
                    {val:"dealer",  label:"Dealer / Owner Only",  sub:"Sends approval request to dealer owner only", color:"#D97706", bg:"#FFF7ED", bd:"#F47B20"},
                    {val:"everyone",label:"Notify Everyone",      sub:"Dealer + all staff notified. First to approve unlocks movement.", color:"#3B82F6", bg:"#EFF6FF", bd:"#3B82F6"},
                    {val:"selected",label:"Select Specific People",sub:"Pick dealer and/or staff below. First to approve wins.", color:"#8B5CF6", bg:"#FAF5FF", bd:"#8B5CF6"},
                  ].map(opt => (
                    <label key={opt.val} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", padding:"10px 12px", borderRadius:"8px", background:form.approvalType===opt.val?opt.bg:"#fff", border:`1.5px solid ${form.approvalType===opt.val?opt.bd:"#E5E5E5"}` }}>
                      <input type="radio" name="approvalType" value={opt.val} checked={form.approvalType===opt.val}
                        onChange={()=>setForm({...form,approvalType:opt.val,approverUserIds:[]})} style={{accentColor:opt.color}}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:"14px",color:form.approvalType===opt.val?opt.color:"#1A1A1A"}}>{opt.label}</div>
                        <div style={{fontSize:"11px",color:"#737373"}}>{opt.sub}</div>
                      </div>
                      {opt.val==="self" && form.approvalType==="self" && <span style={{fontSize:"11px",fontWeight:700,color:"#16A34A"}}> AUTO-APPROVED</span>}
                    </label>
                  ))}
                </div>

                {/* Multi-select people picker for "selected" - BOTH dealer AND staff can be picked */}
                {form.approvalType==="selected" && (
                  <div>
                    <div style={{fontSize:"11px",fontWeight:700,color:"#8B5CF6",marginBottom:"8px"}}>
                      Select approvers  pick dealer and/or any staff (first to respond approves):
                    </div>
                    {teamMembers.length === 0 ? (
                      <div style={{fontSize:"12px",color:"#A3A3A3",padding:"8px"}}>No team members found. Try refreshing.</div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                        {teamMembers.map((tm:any) => {
                          const checked = form.approverUserIds.includes(tm.userId);
                          const isOwner = tm.role === "DEALER_ADMIN";
                          return (
                            <label key={tm.userId} onClick={()=>toggleApprover(tm.userId)}
                              style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",padding:"8px 10px",borderRadius:"7px",background:checked?"#FAF5FF":"#F9F9F9",border:`1.5px solid ${checked?"#8B5CF6":"#E5E5E5"}`}}>
                              <div style={{width:"18px",height:"18px",borderRadius:"4px",border:`2px solid ${checked?"#8B5CF6":"#CCC"}`,background:checked?"#8B5CF6":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                {checked&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                              </div>
                              <div style={{width:"34px",height:"34px",borderRadius:"50%",background:isOwner?"#FFF7ED":"#EDE9FE",color:isOwner?"#F47B20":"#8B5CF6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:700,flexShrink:0}}>
                                {tm.fullName?.charAt(0)||"?"}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:"13px",fontWeight:checked?700:400,color:"#1A1A1A"}}>{tm.fullName} {isOwner&&<span style={{fontSize:"10px",color:"#F47B20",fontWeight:700}}>OWNER</span>}</div>
                                <div style={{fontSize:"11px",color:"#A3A3A3"}}>{tm.position || (isOwner?"Dealer Owner":"Staff")}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {form.approverUserIds.length > 0 && (
                      <div style={{marginTop:"8px",fontSize:"12px",color:"#8B5CF6",fontWeight:600}}>
                        {form.approverUserIds.length} person{form.approverUserIds.length!==1?"s":""} selected  first to approve unlocks movement
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div style={{display:"flex",gap:"12px",position:"sticky",bottom:0,background:"#fff",paddingTop:"10px",paddingBottom:"4px"}}>
                <button type="button" onClick={()=>{setShowLog(false);setForm(emptyForm);setMovCarSearch("");}} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"10px",padding:"13px",fontSize:"14px",cursor:"pointer"}}>Cancel</button>
                <button type="submit" disabled={submitting||!form.carId}
                  style={{flex:2,background:submitting||!form.carId?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"13px",fontFamily:"var(--font-display)",fontSize:"14px",letterSpacing:"0.08em",cursor:submitting||!form.carId?"not-allowed":"pointer",fontWeight:700}}>
                  {submitting?"Saving...":form.approvalType==="self"?"LOG MOVEMENT (AUTO-APPROVED)":"LOG & SEND FOR APPROVAL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  DETAIL VIEW MODAL  */}
      {showDetail && (
        <div onClick={()=>setShowDetail(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"580px",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
            <div style={{padding:"14px 20px",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"14px",letterSpacing:"0.08em",color:"#F47B20"}}>MOVEMENT DETAILS</div>
              <button onClick={()=>setShowDetail(null)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:"28px",height:"28px",cursor:"pointer",fontSize:"16px"}}>×</button>
            </div>
            <div style={{overflowY:"auto",flex:1,minHeight:0,padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}><ApprovalBadge m={showDetail}/><span style={{padding:"2px 8px",borderRadius:"20px",fontSize:"11px",fontWeight:600,background:"#F5F5F5",color:"#525252",textTransform:"capitalize" as const}}>{showDetail.status}</span></div>
              <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.2)",borderRadius:"8px",padding:"12px"}}>
                <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:"#F47B20",marginBottom:"4px"}}>VEHICLE</div>
                <div style={{fontSize:"16px",fontWeight:700,color:"#1A1A1A"}}>{showDetail.carBrand} {showDetail.carModel} {showDetail.carYear}</div>
                <div style={{fontSize:"12px",color:"#737373",fontFamily:"monospace"}}>{showDetail.carId}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                {([["Taken By",showDetail.takenByName],["Phone",showDetail.takenByPhone],["Purpose",showDetail.purpose?.replace(/_/g," ")],["Time Out",fmtDate(showDetail.timeOut||showDetail.createdAt)],["Expected Return",fmtDate(showDetail.expectedReturnTime)],["Address",showDetail.takenByAddress],["ID Type",showDetail.takenByIdType],["ID Number",showDetail.takenByIdNumber],["Permitted By",showDetail.permittedBy],["Approved By",showDetail.approvedByName],["Approval Time",fmtDate(showDetail.approvedAt)],["Logged By",showDetail.loggedByName]] as [string,any][]).filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{background:"#F9F9F9",borderRadius:"7px",padding:"10px"}}>
                    <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"3px"}}>{l}</div>
                    <div style={{fontSize:"13px",color:"#1A1A1A",fontWeight:500,wordBreak:"break-word" as const}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* ID Card Photo - clickable + downloadable */}
              {showDetail.takenByIdImageUrl && (
                <div>
                  <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:"#A3A3A3",marginBottom:"8px"}}>ID CARD PHOTO</div>
                  <div style={{position:"relative",display:"inline-block"}}>
                    <img src={showDetail.takenByIdImageUrl} alt="ID Card"
                      onClick={()=>setImgPreview(showDetail.takenByIdImageUrl)}
                      style={{width:"100%",maxWidth:"320px",maxHeight:"200px",objectFit:"contain",borderRadius:"8px",border:"1.5px solid #E5E5E5",cursor:"pointer",display:"block"}}/>
                    <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
                      <button onClick={()=>setImgPreview(showDetail.takenByIdImageUrl)}
                        style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>
                         View Full Size
                      </button>
                      <a href={showDetail.takenByIdImageUrl} download="id-card.jpg" target="_blank" rel="noreferrer"
                        style={{background:"#EFF6FF",border:"1.5px solid #BFDBFE",color:"#1D4ED8",borderRadius:"7px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
                         Download JPG
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {showDetail.notes && (
                <div style={{background:"#F9F9F9",borderRadius:"8px",padding:"12px"}}>
                  <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:"#A3A3A3",marginBottom:"5px"}}>NOTES</div>
                  <div style={{fontSize:"13px",color:"#525252",lineHeight:1.5}}>{showDetail.notes}</div>
                </div>
              )}

              {showDetail.returnedToName && (
                <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"12px"}}>
                  <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:"#15803D",marginBottom:"5px"}}>RETURN INFO</div>
                  <div style={{fontSize:"13px",color:"#1A1A1A"}}>Returned to: <strong>{showDetail.returnedToName}</strong></div>
                  {showDetail.returnCondition && <div style={{fontSize:"12px",color:"#737373"}}>Condition: {showDetail.returnCondition}</div>}
                  {showDetail.timeReturned && <div style={{fontSize:"12px",color:"#737373"}}>Returned: {fmtDate(showDetail.timeReturned)}</div>}
                </div>
              )}

              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{setShowDetail(null);setShowEdit(showDetail);setEditForm({takenByName:showDetail.takenByName||"",takenByPhone:showDetail.takenByPhone||"",takenByAddress:showDetail.takenByAddress||"",takenByIdType:showDetail.takenByIdType||"NIN",takenByIdNumber:showDetail.takenByIdNumber||"",purpose:showDetail.purpose||"test_drive",expectedReturnTime:showDetail.expectedReturnTime||"",permittedBy:showDetail.permittedBy||"",notes:showDetail.notes||""});setError("");}}
                  style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"11px",fontFamily:"var(--font-display)",fontSize:"13px",cursor:"pointer",fontWeight:700}}>Edit</button>
                {showDetail.status==="out" && showDetail.approvalStatus!=="pending" && (
                  <button onClick={()=>{setShowDetail(null);setShowReturn(showDetail);setReturnForm({returnerType:"same",returnedToName:"",returnedToPhone:"",returnedToAddress:"",condition:"good",notes:""});}}
                    style={{flex:1,background:"#EFF6FF",border:"1.5px solid #BFDBFE",color:"#1D4ED8",borderRadius:"8px",padding:"11px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>Log Return</button>
                )}
                {showDetail.approvalStatus==="pending" && (
                  <button onClick={()=>{approveMovement(showDetail);setShowDetail(null);}}
                    style={{flex:1,background:"#16A34A",color:"#fff",border:"none",borderRadius:"8px",padding:"11px",fontSize:"13px",cursor:"pointer",fontWeight:700}}> Approve</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  EDIT MODAL  */}
      {showEdit && (
        <div onClick={()=>setShowEdit(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",maxWidth:"680px",maxHeight:"90vh",borderRadius:"16px 16px 0 0",overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 20px",background:"#1A1A1A",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"14px",letterSpacing:"0.08em",color:"#F47B20"}}>EDIT MOVEMENT  {showEdit.carId}</div>
              <button onClick={()=>setShowEdit(null)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:"28px",height:"28px",cursor:"pointer",fontSize:"16px"}}>×</button>
            </div>
            {error&&<div style={{background:"#FEF2F2",color:"#DC2626",padding:"10px 20px",fontSize:"13px",fontWeight:600}}>{error}</div>}
            <form onSubmit={submitEdit} style={{overflowY:"auto",flex:1,minHeight:0,padding:"20px",display:"flex",flexDirection:"column"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                <div style={fw}><label style={la}>Taken By (Name)</label><input style={fi} value={editForm.takenByName||""} onChange={e=>setEditForm({...editForm,takenByName:e.target.value})} placeholder="Full name"/></div>
                <div style={fw}><label style={la}>Phone Number</label><input style={fi} value={editForm.takenByPhone||""} onChange={e=>setEditForm({...editForm,takenByPhone:e.target.value})} placeholder="Phone"/></div>
                <div style={fw}><label style={la}>Purpose</label>
                  <select style={fi} value={editForm.purpose||"test_drive"} onChange={e=>setEditForm({...editForm,purpose:e.target.value})}>
                    {PURPOSES.map(p=><option key={p} value={p}>{p.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div style={fw}><label style={la}>Expected Return</label><input type="datetime-local" style={fi} value={editForm.expectedReturnTime||""} onChange={e=>setEditForm({...editForm,expectedReturnTime:e.target.value})}/></div>
                <div style={fw}><label style={la}>ID Type</label>
                  <select style={fi} value={editForm.takenByIdType||"NIN"} onChange={e=>setEditForm({...editForm,takenByIdType:e.target.value})}>
                    {ID_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={fw}><label style={la}>ID Number</label><input style={fi} value={editForm.takenByIdNumber||""} onChange={e=>setEditForm({...editForm,takenByIdNumber:e.target.value})} placeholder="ID number"/></div>
                <div style={{...fw,gridColumn:"1/-1"}}><label style={la}>Address</label><input style={fi} value={editForm.takenByAddress||""} onChange={e=>setEditForm({...editForm,takenByAddress:e.target.value})} placeholder="Address"/></div>
                <div style={{...fw,gridColumn:"1/-1"}}><label style={la}>Notes</label><textarea style={{...fi,resize:"vertical" as const,minHeight:"60px"}} value={editForm.notes||""} onChange={e=>setEditForm({...editForm,notes:e.target.value})}/></div>
              </div>
              <div style={{display:"flex",gap:"12px"}}>
                <button type="button" onClick={()=>setShowEdit(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"10px",padding:"12px",fontSize:"14px",cursor:"pointer"}}>Cancel</button>
                <button type="submit" disabled={submitting} style={{flex:2,background:submitting?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"12px",fontFamily:"var(--font-display)",fontSize:"14px",cursor:submitting?"not-allowed":"pointer",fontWeight:700}}>{submitting?"Saving...":"SAVE CHANGES"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  RETURN MODAL  */}
      {showReturn && (
        <div onClick={()=>setShowReturn(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",maxWidth:"600px",maxHeight:"90vh",borderRadius:"16px 16px 0 0",overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 20px",background:"#1A1A1A",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"14px",letterSpacing:"0.08em",color:"#F47B20"}}>LOG VEHICLE RETURN</div>
              <button onClick={()=>setShowReturn(null)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:"28px",height:"28px",cursor:"pointer",fontSize:"16px"}}>×</button>
            </div>
            {error&&<div style={{background:"#FEF2F2",color:"#DC2626",padding:"10px 20px",fontSize:"13px",fontWeight:600,flexShrink:0}}>{error}</div>}
            <div style={{overflowY:"auto",flex:1,minHeight:0,padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>

              <div style={{background:"#FFF7ED",borderRadius:"8px",padding:"12px",fontSize:"13px",color:"#737373"}}>
                Logging return of: <strong style={{color:"#1A1A1A"}}>{showReturn.carBrand} {showReturn.carModel}</strong>  {showReturn.carId}
                <br/>Originally taken by: <strong>{showReturn.takenByName}</strong>
              </div>

              {/* Same person or different? */}
              <div>
                <label style={la}>Who is returning the vehicle?</label>
                <div style={{display:"flex",gap:"10px",marginTop:"6px"}}>
                  <label onClick={()=>setReturnForm({...returnForm,returnerType:"same"})}
                    style={{flex:1,display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",padding:"12px",borderRadius:"9px",background:returnForm.returnerType==="same"?"#F0FDF4":"#F9F9F9",border:`1.5px solid ${returnForm.returnerType==="same"?"#86EFAC":"#E5E5E5"}`}}>
                    <input type="radio" checked={returnForm.returnerType==="same"} onChange={()=>setReturnForm({...returnForm,returnerType:"same"})} style={{accentColor:"#16A34A"}}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:"13px",color:returnForm.returnerType==="same"?"#15803D":"#1A1A1A"}}>Same Person</div>
                      <div style={{fontSize:"11px",color:"#737373"}}>{showReturn.takenByName}</div>
                    </div>
                  </label>
                  <label onClick={()=>setReturnForm({...returnForm,returnerType:"different"})}
                    style={{flex:1,display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",padding:"12px",borderRadius:"9px",background:returnForm.returnerType==="different"?"#EFF6FF":"#F9F9F9",border:`1.5px solid ${returnForm.returnerType==="different"?"#BFDBFE":"#E5E5E5"}`}}>
                    <input type="radio" checked={returnForm.returnerType==="different"} onChange={()=>setReturnForm({...returnForm,returnerType:"different"})} style={{accentColor:"#3B82F6"}}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:"13px",color:returnForm.returnerType==="different"?"#1D4ED8":"#1A1A1A"}}>Different Person</div>
                      <div style={{fontSize:"11px",color:"#737373"}}>Enter returner details</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Different person details */}
              {returnForm.returnerType==="different" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  <div style={fw}><label style={la}>Returner Name *</label><input style={fi} required value={returnForm.returnedToName} onChange={e=>setReturnForm({...returnForm,returnedToName:e.target.value})} placeholder="Full name of returner"/></div>
                  <div style={fw}><label style={la}>Returner Phone</label><input style={fi} value={returnForm.returnedToPhone} onChange={e=>setReturnForm({...returnForm,returnedToPhone:e.target.value})} placeholder="Phone number"/></div>
                  <div style={{...fw,gridColumn:"1/-1"}}><label style={la}>Returner Address</label><input style={fi} value={returnForm.returnedToAddress} onChange={e=>setReturnForm({...returnForm,returnedToAddress:e.target.value})} placeholder="Address of returner"/></div>
                </div>
              )}

              {/* Condition */}
              <div style={fw}>
                <label style={la}>Vehicle Condition on Return</label>
                <select style={fi} value={returnForm.condition} onChange={e=>setReturnForm({...returnForm,condition:e.target.value})}>
                  {CONDITIONS.map(c=><option key={c} value={c}>{c.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase())}</option>)}
                </select>
              </div>
              <div style={fw}>
                <label style={la}>Return Notes</label>
                <textarea style={{...fi,resize:"vertical" as const,minHeight:"70px"}} value={returnForm.notes} onChange={e=>setReturnForm({...returnForm,notes:e.target.value})} placeholder="Any notes about the condition, damages, or return circumstances..."/>
              </div>

              <div style={{display:"flex",gap:"10px"}}>
                <button onClick={()=>setShowReturn(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"9px",padding:"12px",fontSize:"14px",cursor:"pointer"}}>Cancel</button>
                <button onClick={submitReturn} disabled={submitting||(returnForm.returnerType==="different"&&!returnForm.returnedToName)}
                  style={{flex:2,background:submitting||(returnForm.returnerType==="different"&&!returnForm.returnedToName)?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"9px",padding:"12px",fontFamily:"var(--font-display)",fontSize:"14px",cursor:"pointer",fontWeight:700}}>
                  {submitting?"Saving...":"CONFIRM RETURN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  IMAGE PREVIEW LIGHTBOX  */}
      {imgPreview && (
        <div onClick={()=>setImgPreview(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:2000,padding:"1rem"}}>
          <div style={{display:"flex",gap:"12px",marginBottom:"12px"}}>
            <a href={imgPreview} download="id-card.jpg" target="_blank" rel="noreferrer"
              style={{background:"#F47B20",color:"#fff",borderRadius:"8px",padding:"8px 18px",fontSize:"13px",fontWeight:700,textDecoration:"none",cursor:"pointer"}}>
               Download JPG
            </a>
            <button onClick={()=>setImgPreview(null)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"8px",padding:"8px 18px",fontSize:"13px",cursor:"pointer",fontWeight:600}}> Close</button>
          </div>
          <img src={imgPreview} alt="ID Card Preview"
            style={{maxWidth:"95vw",maxHeight:"80vh",objectFit:"contain",borderRadius:"10px",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}/>
        </div>
      )}
    </div>
  );
}
