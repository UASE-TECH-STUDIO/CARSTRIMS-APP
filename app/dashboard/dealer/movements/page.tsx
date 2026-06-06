"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

const PURPOSES  = ["test_drive","inspection","repair","delivery","personal_use","showroom","other"];
const ID_TYPES  = ["NIN","BVN","Driver's License","International Passport","Voter's Card","Other"];
const CONDITIONS = ["good","fair","damaged","needs_service"];

const emptyForm = {
  carId:"", takenByName:"", takenByPhone:"", takenByAddress:"",
  takenByIdType:"NIN", takenByIdNumber:"", takenByIdImageUrl:"",
  purpose:"test_drive", expectedReturnTime:"", permittedBy:"",
  approvalType:"self", approverUserIds:[] as string[],
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
  const [returnForm,   setReturnForm]   = useState({returnedToName:"",condition:"good",notes:""});
  const [submitting,   setSubmitting]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState("");
  const [teamMembers,  setTeamMembers]  = useState<any[]>([]);

  // Car search
  const [movCarSearch,  setMovCarSearch]  = useState("");
  const [movCarResults, setMovCarResults] = useState<any[]>([]);
  const [movCarDrop,    setMovCarDrop]    = useState(false);
  const idImgRef     = useRef<HTMLInputElement>(null);
  const editIdImgRef = useRef<HTMLInputElement>(null);

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

  const fetch = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50, skip: 0 };
      if (statusFilter !== "all") params.status = statusFilter;
      const r = await api.get("/api/v1/movements/", { params });
      setMovements(r.data?.movements || r.data || []);
      setTotal(r.data?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

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
    e.preventDefault(); setSubmitting(true); setError("");
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
      setShowLog(false); setForm(emptyForm);
      setMovCarSearch(""); fetch();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to log movement");
    } finally { setSubmitting(false); }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const id = showEdit._id || showEdit.movementId;
      await api.patch(`/api/v1/movements/${id}`, editForm);
      setShowEdit(null); fetch();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to update movement");
    } finally { setSubmitting(false); }
  };

  const approveMovement = async (id: string) => {
    try {
      await api.patch(`/api/v1/movements/${id}`, { approvalStatus: "approved" });
      fetch();
    } catch (e: any) { setError(e.response?.data?.detail || "Failed to approve"); }
  };

  const fmtDate = (iso: any) => iso
    ? new Date(iso).toLocaleString("en-NG", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
    : "";

  // Styles
  const fi: React.CSSProperties = {
    width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5",
    borderRadius:"8px", padding:"10px 14px", fontSize:"14px",
    outline:"none", boxSizing:"border-box", fontFamily:"var(--font-body)",
  };
  const la: React.CSSProperties = {
    fontSize:"11px", fontWeight:700, letterSpacing:"0.08em",
    textTransform:"uppercase" as const, color:"#525252",
    display:"block", marginBottom:"4px",
  };
  const fw: React.CSSProperties = {
    display:"flex", flexDirection:"column" as const, marginBottom:"14px",
  };

  const toggleApprover = (uid: string) => {
    setForm(f => ({
      ...f,
      approverUserIds: f.approverUserIds.includes(uid)
        ? f.approverUserIds.filter(x => x !== uid)
        : [...f.approverUserIds, uid],
    }));
  };

  const pendingApprovals = movements.filter(m => m.approvalStatus === "pending");

  //  STATUS BADGE 
  const statusBadge = (m: any) => {
    const approval = m.approvalStatus || "approved";
    const status = m.status || "out";
    return (
      <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" as const }}>
        <span style={{
          padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:700,
          background: approval==="approved"?"#F0FDF4":approval==="pending"?"#FFF7ED":"#FEF2F2",
          color: approval==="approved"?"#16A34A":approval==="pending"?"#D97706":"#DC2626",
        }}>{approval}</span>
        <span style={{
          padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:600,
          background:"#F5F5F5", color:"#525252", textTransform:"capitalize" as const,
        }}>{status}</span>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", letterSpacing:"0.05em", color:"#1A1A1A", margin:"0 0 4px" }}>
            Vehicle Movements
          </h2>
          <p style={{ fontSize:"13px", color:"#888", margin:0 }}>{total} total movements</p>
        </div>
        <button onClick={() => { setShowLog(true); setError(""); }}
          style={{ background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px",
            padding:"11px 20px", fontFamily:"var(--font-display)", fontSize:"14px",
            letterSpacing:"0.08em", cursor:"pointer", fontWeight:700 }}>
          + Log Movement
        </button>
      </div>

      {/* Pending approvals banner */}
      {pendingApprovals.length > 0 && (
        <div style={{ background:"#FFF7ED", border:"1.5px solid rgba(244,123,32,0.3)", borderRadius:"10px", padding:"14px 18px" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"11px", letterSpacing:"0.1em", color:"#F47B20", marginBottom:"10px" }}>
            PENDING MOVEMENT APPROVALS ({pendingApprovals.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {pendingApprovals.map((m: any) => (
              <div key={m._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                gap:"12px", flexWrap:"wrap" as const, background:"#fff", borderRadius:"8px", padding:"10px 14px" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:"14px", color:"#1A1A1A" }}>
                    {m.carBrand} {m.carModel}  {m.carId}
                  </div>
                  <div style={{ fontSize:"12px", color:"#737373" }}>
                    {m.takenByName}  {m.purpose?.replace(/_/g," ")}  {fmtDate(m.timeOut || m.createdAt)}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => approveMovement(m._id || m.movementId)}
                    style={{ background:"#16A34A", color:"#fff", border:"none", borderRadius:"7px",
                      padding:"7px 16px", fontSize:"13px", cursor:"pointer", fontWeight:700 }}>
                    Approve
                  </button>
                  <button onClick={async () => {
                    try { await api.patch(`/api/v1/movements/${m._id||m.movementId}`, { approvalStatus:"declined" }); fetch(); }
                    catch {}
                  }} style={{ background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626",
                    borderRadius:"7px", padding:"7px 16px", fontSize:"13px", cursor:"pointer", fontWeight:600 }}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status filter */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
        {["all","out","returned","completed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ background:statusFilter===s?"#1A1A1A":"#F5F5F5",
              color:statusFilter===s?"#fff":"#525252",
              border:`1.5px solid ${statusFilter===s?"#1A1A1A":"#E5E5E5"}`,
              borderRadius:"7px", padding:"6px 14px", fontSize:"12px",
              cursor:"pointer", fontWeight:statusFilter===s?700:400,
              textTransform:"capitalize" as const }}>
            {s}
          </button>
        ))}
      </div>

      {/* Movements list */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}>
          <div style={{ width:"28px", height:"28px", border:"2.5px solid #E5E5E5",
            borderTopColor:"#F47B20", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
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
            <div key={m._id || m.movementId}
              style={{ background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"10px",
                padding:"14px 18px", display:"flex", alignItems:"flex-start",
                gap:"14px", flexWrap:"wrap" as const }}>
              <div style={{ flex:1, minWidth:"200px" }}>
                <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"4px", flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, fontSize:"15px", color:"#1A1A1A" }}>
                    {m.carBrand||""} {m.carModel||""} {m.carYear||""}
                  </span>
                  <span style={{ fontSize:"11px", color:"#A3A3A3" }}>{m.carId}</span>
                  {statusBadge(m)}
                </div>
                <div style={{ fontSize:"13px", color:"#737373" }}>
                  Taken by: <strong>{m.takenByName}</strong>  {m.purpose?.replace(/_/g," ")}
                </div>
                <div style={{ fontSize:"12px", color:"#A3A3A3", marginTop:"2px" }}>
                  Out: {fmtDate(m.timeOut || m.createdAt)}
                  {m.expectedReturnTime && `  Expected back: ${fmtDate(m.expectedReturnTime)}`}
                </div>
                {m.approvedByName && (
                  <div style={{ fontSize:"12px", color:"#16A34A", marginTop:"2px" }}>
                     Approved by {m.approvedByName}
                  </div>
                )}
                {m.permittedBy && (
                  <div style={{ fontSize:"12px", color:"#737373", marginTop:"2px" }}>
                    Permitted by: {m.permittedBy}
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:"6px", flexShrink:0, flexWrap:"wrap" }}>
                <button onClick={() => setShowDetail(m)}
                  style={{ background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#525252",
                    borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>
                  View
                </button>
                <button onClick={() => { setShowEdit(m); setEditForm({
                  takenByName:m.takenByName||"", takenByPhone:m.takenByPhone||"",
                  takenByAddress:m.takenByAddress||"", takenByIdType:m.takenByIdType||"NIN",
                  takenByIdNumber:m.takenByIdNumber||"", purpose:m.purpose||"test_drive",
                  expectedReturnTime:m.expectedReturnTime||"", permittedBy:m.permittedBy||"",
                  notes:m.notes||"",
                }); setError(""); }}
                  style={{ background:"#FFF7ED", border:"1.5px solid rgba(244,123,32,.3)", color:"#C4621A",
                    borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>
                  Edit
                </button>
                {m.approvalStatus==="pending" && (
                  <button onClick={() => approveMovement(m._id||m.movementId)}
                    style={{ background:"#16A34A", color:"#fff", border:"none",
                      borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:700 }}>
                    Approve
                  </button>
                )}
                {m.status==="out" && m.approvalStatus!=="pending" && (
                  <button onClick={() => { setShowReturn(m); setReturnForm({returnedToName:"",condition:"good",notes:""}); }}
                    style={{ background:"#EFF6FF", border:"1.5px solid #BFDBFE", color:"#1D4ED8",
                      borderRadius:"7px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>
                    Return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/*  LOG MOVEMENT MODAL  */}
      {showLog && (
        <div onClick={() => setShowLog(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
            display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", width:"100%", maxWidth:"720px", maxHeight:"93vh",
              borderRadius:"16px 16px 0 0", overflow:"hidden", display:"flex", flexDirection:"column" }}>

            <div style={{ padding:"14px 20px", background:"#1A1A1A", flexShrink:0 }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"14px", letterSpacing:"0.08em", color:"#F47B20" }}>
                LOG VEHICLE MOVEMENT
              </div>
            </div>

            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626",
                padding:"10px 20px", fontSize:"13px", fontWeight:600 }}>{error}</div>
            )}

            <form onSubmit={submitLog} style={{ overflowY:"auto", flex:1, padding:"20px",
              display:"flex", flexDirection:"column", gap:"0" }}>

              {/* Car search */}
              <div style={fw}>
                <label style={la}>Vehicle *</label>
                <div style={{ position:"relative" }}>
                  <input style={fi} placeholder="Search by car ID, brand or model..."
                    value={movCarSearch}
                    onChange={e => { setMovCarSearch(e.target.value); if (!e.target.value) setForm({ ...form, carId:"" }); }}/>
                  {form.carId && (
                    <div style={{ fontSize:"11px", color:"#16A34A", marginTop:"3px" }}>
                       Selected: {form.carId}
                    </div>
                  )}
                  {movCarDrop && movCarResults.length > 0 && (
                    <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff",
                      border:"1.5px solid #E5E5E5", borderRadius:"8px", zIndex:100,
                      maxHeight:"180px", overflowY:"auto", boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
                      {movCarResults.map((c: any) => (
                        <div key={c.carId} onClick={() => {
                          setForm({ ...form, carId:c.carId });
                          setMovCarSearch(`${c.brand} ${c.model} (${c.carId})`);
                          setMovCarDrop(false);
                        }} style={{ padding:"10px 14px", cursor:"pointer", fontSize:"13px",
                          borderBottom:"1px solid #F5F5F5" }}
                          onMouseOver={e => (e.currentTarget as HTMLElement).style.background = "#FFF7ED"}
                          onMouseOut={e => (e.currentTarget as HTMLElement).style.background = "#fff"}>
                          <strong>{c.brand} {c.model} {c.year}</strong>
                          <span style={{ color:"#A3A3A3", fontSize:"11px", marginLeft:"6px" }}>{c.carId}</span>
                          <span style={{ float:"right", fontSize:"11px", color:"#16A34A" }}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Person taking car */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                <div style={fw}>
                  <label style={la}>Taken By (Name) *</label>
                  <input style={fi} required value={form.takenByName}
                    onChange={e => setForm({ ...form, takenByName:e.target.value })}
                    placeholder="Full name of person"/>
                </div>
                <div style={fw}>
                  <label style={la}>Phone Number</label>
                  <input style={fi} value={form.takenByPhone}
                    onChange={e => setForm({ ...form, takenByPhone:e.target.value })}
                    placeholder="Contact phone"/>
                </div>
                <div style={fw}>
                  <label style={la}>Purpose *</label>
                  <select style={fi} required value={form.purpose}
                    onChange={e => setForm({ ...form, purpose:e.target.value })}>
                    {PURPOSES.map(p => (
                      <option key={p} value={p}>
                        {p.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={fw}>
                  <label style={la}>Expected Return Date & Time</label>
                  <input type="datetime-local" style={fi} value={form.expectedReturnTime}
                    onChange={e => setForm({ ...form, expectedReturnTime:e.target.value })}/>
                </div>
                <div style={{ ...fw, gridColumn:"1/-1" }}>
                  <label style={la}>Address</label>
                  <input style={fi} value={form.takenByAddress}
                    onChange={e => setForm({ ...form, takenByAddress:e.target.value })}
                    placeholder="Address of person taking car"/>
                </div>
              </div>

              {/* ID Verification */}
              <div style={{ background:"#F9F9F9", border:"1px solid #E5E5E5", borderRadius:"10px",
                padding:"14px 16px", marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.1em",
                  color:"#525252", marginBottom:"12px" }}>ID VERIFICATION</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <div style={fw}>
                    <label style={la}>ID Type</label>
                    <select style={fi} value={form.takenByIdType}
                      onChange={e => setForm({ ...form, takenByIdType:e.target.value })}>
                      {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={fw}>
                    <label style={la}>ID Number</label>
                    <input style={fi} value={form.takenByIdNumber}
                      onChange={e => setForm({ ...form, takenByIdNumber:e.target.value })}
                      placeholder="ID card number"/>
                  </div>
                  <div style={{ ...fw, gridColumn:"1/-1" }}>
                    <label style={la}>ID Card Photo</label>
                    <input ref={idImgRef} type="file" accept="image/*" style={{ display:"none" }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadIdCard(file);
                          if (url) setForm({ ...form, takenByIdImageUrl:url });
                        }
                      }}/>
                    <button type="button" onClick={() => idImgRef.current?.click()}
                      style={{ ...fi, cursor:"pointer", textAlign:"left" as const,
                        color:form.takenByIdImageUrl?"#16A34A":"#A3A3A3" }}>
                      {uploading ? "Uploading..." : form.takenByIdImageUrl ? " ID photo uploaded" : "+ Upload ID card photo"}
                    </button>
                    {form.takenByIdImageUrl && (
                      <img src={form.takenByIdImageUrl} alt="ID"
                        style={{ width:"80px", height:"50px", objectFit:"cover",
                          borderRadius:"5px", marginTop:"6px", border:"1px solid #E5E5E5" }}/>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={fw}>
                <label style={la}>Notes</label>
                <textarea style={{ ...fi, resize:"vertical" as const, minHeight:"60px" }}
                  value={form.notes} onChange={e => setForm({ ...form, notes:e.target.value })}
                  placeholder="Additional notes about this movement..."/>
              </div>

              {/* APPROVAL SECTION */}
              <div style={{ background:"#F0FDF4", border:"1.5px solid #86EFAC", borderRadius:"10px",
                padding:"14px 16px", marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.1em",
                  color:"#15803D", marginBottom:"12px" }}>MOVEMENT APPROVAL</div>

                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>

                  {/* Self */}
                  <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer",
                    padding:"10px 12px", borderRadius:"8px",
                    background:form.approvalType==="self"?"#DCFCE7":"#fff",
                    border:`1.5px solid ${form.approvalType==="self"?"#86EFAC":"#E5E5E5"}` }}>
                    <input type="radio" name="approvalType" value="self"
                      checked={form.approvalType==="self"}
                      onChange={() => setForm({ ...form, approvalType:"self", approverUserIds:[] })}
                      style={{ accentColor:"#16A34A" }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:"14px", color:"#15803D" }}>Self Approval</div>
                      <div style={{ fontSize:"11px", color:"#737373" }}>Movement logs immediately as approved  no waiting needed</div>
                    </div>
                    {form.approvalType==="self" && (
                      <span style={{ fontSize:"11px", fontWeight:700, color:"#16A34A" }}> AUTO-APPROVED</span>
                    )}
                  </label>

                  {/* Dealer only */}
                  <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer",
                    padding:"10px 12px", borderRadius:"8px",
                    background:form.approvalType==="dealer"?"#FFF7ED":"#fff",
                    border:`1.5px solid ${form.approvalType==="dealer"?"#F47B20":"#E5E5E5"}` }}>
                    <input type="radio" name="approvalType" value="dealer"
                      checked={form.approvalType==="dealer"}
                      onChange={() => setForm({ ...form, approvalType:"dealer", approverUserIds:[] })}
                      style={{ accentColor:"#F47B20" }}/>
                    <div>
                      <div style={{ fontWeight:700, fontSize:"14px", color:"#1A1A1A" }}>Dealer / Owner Only</div>
                      <div style={{ fontSize:"11px", color:"#737373" }}>Request sent to dealer owner. Movement waits for their approval.</div>
                    </div>
                  </label>

                  {/* Everyone */}
                  {teamMembers.length > 0 && (
                    <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer",
                      padding:"10px 12px", borderRadius:"8px",
                      background:form.approvalType==="everyone"?"#EFF6FF":"#fff",
                      border:`1.5px solid ${form.approvalType==="everyone"?"#3B82F6":"#E5E5E5"}` }}>
                      <input type="radio" name="approvalType" value="everyone"
                        checked={form.approvalType==="everyone"}
                        onChange={() => setForm({ ...form, approvalType:"everyone", approverUserIds:[] })}
                        style={{ accentColor:"#3B82F6" }}/>
                      <div>
                        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A1A1A" }}>Notify Everyone</div>
                        <div style={{ fontSize:"11px", color:"#737373" }}>Dealer + all staff notified. First person to approve unlocks movement.</div>
                      </div>
                    </label>
                  )}

                  {/* Select specific */}
                  {teamMembers.length > 0 && (
                    <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer",
                      padding:"10px 12px", borderRadius:"8px",
                      background:form.approvalType==="selected"?"#FAF5FF":"#fff",
                      border:`1.5px solid ${form.approvalType==="selected"?"#8B5CF6":"#E5E5E5"}` }}>
                      <input type="radio" name="approvalType" value="selected"
                        checked={form.approvalType==="selected"}
                        onChange={() => setForm({ ...form, approvalType:"selected" })}
                        style={{ accentColor:"#8B5CF6" }}/>
                      <div>
                        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A1A1A" }}>Select Specific People</div>
                        <div style={{ fontSize:"11px", color:"#737373" }}>Pick one or more people below. First to approve unlocks the movement.</div>
                      </div>
                    </label>
                  )}
                </div>

                {/* Multi-select approvers */}
                {form.approvalType==="selected" && teamMembers.length > 0 && (
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:700, color:"#8B5CF6", marginBottom:"8px" }}>
                      Select approvers (pick one or multiple  first to respond wins):
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                      {teamMembers.map((m: any) => {
                        const checked = form.approverUserIds.includes(m.userId);
                        return (
                          <label key={m.userId} onClick={() => toggleApprover(m.userId)}
                            style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer",
                              padding:"8px 10px", borderRadius:"7px",
                              background:checked?"#FAF5FF":"#F9F9F9",
                              border:`1px solid ${checked?"#8B5CF6":"#E5E5E5"}` }}>
                            <div style={{ width:"18px", height:"18px", borderRadius:"4px",
                              border:`2px solid ${checked?"#8B5CF6":"#CCC"}`,
                              background:checked?"#8B5CF6":"#fff",
                              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                              </svg>}
                            </div>
                            <div style={{ width:"32px", height:"32px", borderRadius:"50%",
                              background:"#EDE9FE", color:"#8B5CF6",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:"13px", fontWeight:700, flexShrink:0 }}>
                              {m.fullName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div style={{ fontSize:"13px", fontWeight:checked?700:400, color:"#1A1A1A" }}>
                                {m.fullName}
                              </div>
                              <div style={{ fontSize:"11px", color:"#A3A3A3" }}>
                                {m.position || (m.role==="DEALER_ADMIN"?"Owner":"Staff")}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {form.approverUserIds.length > 0 && (
                      <div style={{ marginTop:"8px", fontSize:"12px", color:"#8B5CF6", fontWeight:600 }}>
                        {form.approverUserIds.length} person{form.approverUserIds.length!==1?"s":""} selected
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div style={{ display:"flex", gap:"12px", position:"sticky", bottom:0, background:"#fff", paddingTop:"10px" }}>
                <button type="button" onClick={() => { setShowLog(false); setForm(emptyForm); setMovCarSearch(""); }}
                  style={{ flex:1, background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#525252",
                    borderRadius:"10px", padding:"13px", fontSize:"14px", cursor:"pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !form.carId}
                  style={{ flex:2,
                    background:submitting||!form.carId?"#D4D4D4":"#F47B20",
                    color:"#fff", border:"none", borderRadius:"10px", padding:"13px",
                    fontFamily:"var(--font-display)", fontSize:"14px", letterSpacing:"0.08em",
                    cursor:submitting||!form.carId?"not-allowed":"pointer", fontWeight:700 }}>
                  {submitting ? "Saving..." : form.approvalType==="self" ? "LOG MOVEMENT (AUTO-APPROVED)" : "LOG & SEND FOR APPROVAL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  DETAIL VIEW MODAL  */}
      {showDetail && (
        <div onClick={() => setShowDetail(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"1rem" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:"14px", width:"100%", maxWidth:"560px",
              maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column",
              boxShadow:"0 20px 60px rgba(0,0,0,0.18)" }}>

            <div style={{ padding:"14px 20px", background:"#1A1A1A", display:"flex",
              alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"14px", letterSpacing:"0.08em", color:"#F47B20" }}>
                MOVEMENT DETAILS
              </div>
              <button onClick={() => setShowDetail(null)}
                style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff",
                  borderRadius:"50%", width:"28px", height:"28px", cursor:"pointer", fontSize:"14px" }}>
                
              </button>
            </div>

            <div style={{ overflowY:"auto", flex:1, padding:"20px", display:"flex", flexDirection:"column", gap:"14px" }}>

              {/* Status */}
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                {statusBadge(showDetail)}
              </div>

              {/* Car info */}
              <div style={{ background:"#FFF7ED", border:"1px solid rgba(244,123,32,0.2)", borderRadius:"8px", padding:"12px" }}>
                <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", color:"#F47B20", marginBottom:"5px" }}>VEHICLE</div>
                <div style={{ fontSize:"16px", fontWeight:700, color:"#1A1A1A" }}>
                  {showDetail.carBrand} {showDetail.carModel} {showDetail.carYear}
                </div>
                <div style={{ fontSize:"12px", color:"#737373", fontFamily:"monospace" }}>{showDetail.carId}</div>
              </div>

              {/* Details grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                {[
                  ["Taken By", showDetail.takenByName],
                  ["Phone",    showDetail.takenByPhone],
                  ["Purpose",  showDetail.purpose?.replace(/_/g," ")],
                  ["Time Out", fmtDate(showDetail.timeOut || showDetail.createdAt)],
                  ["Expected Return", fmtDate(showDetail.expectedReturnTime)],
                  ["Address",  showDetail.takenByAddress],
                  ["ID Type",  showDetail.takenByIdType],
                  ["ID Number",showDetail.takenByIdNumber],
                  ["Permitted By", showDetail.permittedBy],
                  ["Approved By",  showDetail.approvedByName],
                ].filter(([,v]) => v).map(([l, v]) => (
                  <div key={l as string} style={{ background:"#F9F9F9", borderRadius:"7px", padding:"10px" }}>
                    <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#A3A3A3", marginBottom:"3px" }}>{l}</div>
                    <div style={{ fontSize:"13px", color:"#1A1A1A", fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* ID Image */}
              {showDetail.takenByIdImageUrl && (
                <div>
                  <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", color:"#A3A3A3", marginBottom:"6px" }}>ID CARD PHOTO</div>
                  <img src={showDetail.takenByIdImageUrl} alt="ID"
                    style={{ width:"100%", maxHeight:"180px", objectFit:"contain",
                      borderRadius:"8px", border:"1px solid #E5E5E5" }}/>
                </div>
              )}

              {/* Notes */}
              {showDetail.notes && (
                <div style={{ background:"#F9F9F9", borderRadius:"8px", padding:"12px" }}>
                  <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", color:"#A3A3A3", marginBottom:"5px" }}>NOTES</div>
                  <div style={{ fontSize:"13px", color:"#525252", lineHeight:1.5 }}>{showDetail.notes}</div>
                </div>
              )}

              {/* Return info */}
              {showDetail.returnedToName && (
                <div style={{ background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:"8px", padding:"12px" }}>
                  <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", color:"#15803D", marginBottom:"5px" }}>RETURN INFO</div>
                  <div style={{ fontSize:"13px", color:"#1A1A1A" }}>Returned to: <strong>{showDetail.returnedToName}</strong></div>
                  {showDetail.returnCondition && <div style={{ fontSize:"12px", color:"#737373" }}>Condition: {showDetail.returnCondition}</div>}
                  {showDetail.timeReturned && <div style={{ fontSize:"12px", color:"#737373" }}>Returned: {fmtDate(showDetail.timeReturned)}</div>}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={() => { setShowDetail(null); setShowEdit(showDetail); setEditForm({
                  takenByName:showDetail.takenByName||"", takenByPhone:showDetail.takenByPhone||"",
                  takenByAddress:showDetail.takenByAddress||"", takenByIdType:showDetail.takenByIdType||"NIN",
                  takenByIdNumber:showDetail.takenByIdNumber||"", purpose:showDetail.purpose||"test_drive",
                  expectedReturnTime:showDetail.expectedReturnTime||"", permittedBy:showDetail.permittedBy||"",
                  notes:showDetail.notes||"",
                }); setError(""); }}
                  style={{ flex:1, background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px",
                    padding:"11px", fontFamily:"var(--font-display)", fontSize:"13px", cursor:"pointer", fontWeight:700 }}>
                  Edit Movement
                </button>
                {showDetail.status==="out" && showDetail.approvalStatus!=="pending" && (
                  <button onClick={() => { setShowDetail(null); setShowReturn(showDetail); setReturnForm({returnedToName:"",condition:"good",notes:""}); }}
                    style={{ flex:1, background:"#EFF6FF", border:"1.5px solid #BFDBFE", color:"#1D4ED8",
                      borderRadius:"8px", padding:"11px", fontSize:"13px", cursor:"pointer", fontWeight:600 }}>
                    Log Return
                  </button>
                )}
                {showDetail.approvalStatus==="pending" && (
                  <button onClick={() => { approveMovement(showDetail._id||showDetail.movementId); setShowDetail(null); }}
                    style={{ flex:1, background:"#16A34A", color:"#fff", border:"none", borderRadius:"8px",
                      padding:"11px", fontSize:"13px", cursor:"pointer", fontWeight:700 }}>
                    Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  EDIT MOVEMENT MODAL  */}
      {showEdit && (
        <div onClick={() => setShowEdit(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
            display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", width:"100%", maxWidth:"680px", maxHeight:"90vh",
              borderRadius:"16px 16px 0 0", overflow:"hidden", display:"flex", flexDirection:"column" }}>

            <div style={{ padding:"14px 20px", background:"#1A1A1A", flexShrink:0 }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"14px", letterSpacing:"0.08em", color:"#F47B20" }}>
                EDIT MOVEMENT  {showEdit.carId}
              </div>
            </div>

            {error && <div style={{ background:"#FEF2F2", color:"#DC2626", padding:"10px 20px", fontSize:"13px", fontWeight:600 }}>{error}</div>}

            <form onSubmit={submitEdit} style={{ overflowY:"auto", flex:1, padding:"20px", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                <div style={fw}>
                  <label style={la}>Taken By (Name)</label>
                  <input style={fi} value={editForm.takenByName||""}
                    onChange={e => setEditForm({ ...editForm, takenByName:e.target.value })} placeholder="Full name"/>
                </div>
                <div style={fw}>
                  <label style={la}>Phone Number</label>
                  <input style={fi} value={editForm.takenByPhone||""}
                    onChange={e => setEditForm({ ...editForm, takenByPhone:e.target.value })} placeholder="Phone"/>
                </div>
                <div style={fw}>
                  <label style={la}>Purpose</label>
                  <select style={fi} value={editForm.purpose||"test_drive"}
                    onChange={e => setEditForm({ ...editForm, purpose:e.target.value })}>
                    {PURPOSES.map(p => <option key={p} value={p}>{p.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div style={fw}>
                  <label style={la}>Expected Return</label>
                  <input type="datetime-local" style={fi} value={editForm.expectedReturnTime||""}
                    onChange={e => setEditForm({ ...editForm, expectedReturnTime:e.target.value })}/>
                </div>
                <div style={fw}>
                  <label style={la}>ID Type</label>
                  <select style={fi} value={editForm.takenByIdType||"NIN"}
                    onChange={e => setEditForm({ ...editForm, takenByIdType:e.target.value })}>
                    {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={fw}>
                  <label style={la}>ID Number</label>
                  <input style={fi} value={editForm.takenByIdNumber||""}
                    onChange={e => setEditForm({ ...editForm, takenByIdNumber:e.target.value })} placeholder="ID number"/>
                </div>
                <div style={{ ...fw, gridColumn:"1/-1" }}>
                  <label style={la}>Address</label>
                  <input style={fi} value={editForm.takenByAddress||""}
                    onChange={e => setEditForm({ ...editForm, takenByAddress:e.target.value })} placeholder="Address"/>
                </div>
                <div style={{ ...fw, gridColumn:"1/-1" }}>
                  <label style={la}>Notes</label>
                  <textarea style={{ ...fi, resize:"vertical" as const, minHeight:"60px" }}
                    value={editForm.notes||""}
                    onChange={e => setEditForm({ ...editForm, notes:e.target.value })}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:"12px" }}>
                <button type="button" onClick={() => setShowEdit(null)}
                  style={{ flex:1, background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#525252",
                    borderRadius:"10px", padding:"12px", fontSize:"14px", cursor:"pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex:2, background:submitting?"#D4D4D4":"#F47B20", color:"#fff", border:"none",
                    borderRadius:"10px", padding:"12px", fontFamily:"var(--font-display)",
                    fontSize:"14px", cursor:submitting?"not-allowed":"pointer", fontWeight:700 }}>
                  {submitting ? "Saving..." : "SAVE CHANGES"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  RETURN MODAL  */}
      {showReturn && (
        <div onClick={() => setShowReturn(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"1rem" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:"14px", width:"100%", maxWidth:"440px", padding:"24px" }}>
            <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem", color:"#1A1A1A", margin:"0 0 16px" }}>
              LOG VEHICLE RETURN
            </h3>
            <div style={{ fontSize:"13px", color:"#737373", marginBottom:"16px" }}>
              {showReturn.carBrand} {showReturn.carModel}  {showReturn.carId}
            </div>
            <div style={fw}>
              <label style={la}>Returned To (Name) *</label>
              <input style={fi} required value={returnForm.returnedToName}
                onChange={e => setReturnForm({ ...returnForm, returnedToName:e.target.value })}
                placeholder="Who received the car back"/>
            </div>
            <div style={fw}>
              <label style={la}>Vehicle Condition</label>
              <select style={fi} value={returnForm.condition}
                onChange={e => setReturnForm({ ...returnForm, condition:e.target.value })}>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>
                    {c.replace(/_/g," ").replace(/\b\w/g, x => x.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div style={fw}>
              <label style={la}>Notes</label>
              <textarea style={{ ...fi, resize:"vertical" as const, minHeight:"60px" }}
                value={returnForm.notes}
                onChange={e => setReturnForm({ ...returnForm, notes:e.target.value })}
                placeholder="Any notes about the return condition..."/>
            </div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setShowReturn(null)}
                style={{ flex:1, background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#525252",
                  borderRadius:"9px", padding:"12px", fontSize:"14px", cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={async () => {
                try {
                  const id = showReturn._id || showReturn.movementId;
                  await api.patch(`/api/v1/movements/${id}/return`, returnForm);
                  setShowReturn(null); fetch();
                } catch (e: any) { setError(e.response?.data?.detail || "Failed to log return"); }
              }} style={{ flex:2, background:"#F47B20", color:"#fff", border:"none",
                borderRadius:"9px", padding:"12px", fontFamily:"var(--font-display)",
                fontSize:"14px", cursor:"pointer", fontWeight:700 }}>
                CONFIRM RETURN
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
