"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const MOVEMENT_TYPES = ["test_drive","inspection","service","delivery","relocation","other"];
const STAGE_COLORS: Record<string,string> = {
  pending_approval:"#D97706", approved:"#16A34A", rejected:"#DC2626",
  in_progress:"#3B8BD4", returned:"#888", completed:"#888",
};

export default function StaffMovementsPage() {
  const [perms, setPerms]         = useState<string[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [approvers, setApprovers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  const [form, setForm] = useState({
    carId:"", purpose:"test_drive", takenByName:"", takenByPhone:"",
    expectedReturnTime:"", notes:"", approverId:"",
  });

  useEffect(() => {
    api.get("/api/v1/staff/me").then(r => {
      setPerms(r.data.permissions || []);
    });
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movRes, appRes, pendRes] = await Promise.all([
        api.get("/api/v1/movements/"),
        api.get("/api/v1/movements/approvers"),
        api.get("/api/v1/movements/pending-approvals"),
      ]);
      setMovements(movRes.data || []);
      setApprovers(appRes.data?.approvers || []);
      setPendingApprovals(pendRes.data || []);
    } catch {} finally { setLoading(false); }
  };

  const canView   = perms.includes("view_movements")   || perms.includes("manage_movements");
  const canManage = perms.includes("manage_movements");

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      // Find the selected approver's userId to notify them
      const approver = approvers.find(a => a.id === form.approverId);
      await api.post("/api/v1/movements/pending-approval", {
        carId:              form.carId,
        purpose:            form.purpose,
        takenByName:        form.takenByName,
        takenByPhone:       form.takenByPhone,
        expectedReturnTime: form.expectedReturnTime,
        notes:              form.notes,
        dealerId:           approver?.role === "DEALER_ADMIN" ? form.approverId : undefined,
        specificApproverId: form.approverId,
        approverUserId:     approver?.userId,
        approverName:       approver?.name,
      });
      setMsg("Approval request sent! Waiting for approval.");
      setShowNew(false);
      setForm({carId:"",purpose:"test_drive",takenByName:"",takenByPhone:"",expectedReturnTime:"",notes:"",approverId:""});
      loadData();
    } catch(e:any) { setMsg("Error: "+(e.response?.data?.detail||"Failed")); }
    finally { setSaving(false); }
  };

  const approveMovement = async (reqId: string) => {
    try {
      await api.post(`/api/v1/movements/pending-approval/${reqId}/approve`);
      setMsg("Movement approved!");
      loadData();
    } catch(e:any) { setMsg(e.response?.data?.detail||"Failed"); }
  };

  const fmtDate = (iso: any) => iso ? new Date(iso).toLocaleString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
  const fi: React.CSSProperties = {width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.6rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box"};
  const lbl: React.CSSProperties = {fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.3rem"};

  if (!canView) return (
    <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
      <div style={{fontSize:"2rem",marginBottom:"0.75rem"}}>&#x1F512;</div>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#DC2626"}}>Access Restricted</div>
      <p style={{color:"#737373",marginTop:"0.5rem",fontSize:"0.875rem"}}>You do not have permission to view vehicle movements.</p>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Vehicle Movements</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{movements.length} movements</p>
        </div>
        {canManage && (
          <button onClick={()=>setShowNew(true)}
            style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",cursor:"pointer"}}>
            + Request Movement
          </button>
        )}
      </div>

      {msg && (
        <div style={{background:msg.startsWith("Error")?"#FEF2F2":"#F0FDF4",border:"1px solid",borderColor:msg.startsWith("Error")?"#FECACA":"#86EFAC",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.85rem",color:msg.startsWith("Error")?"#DC2626":"#15803D",fontWeight:600}}>
          {msg}
        </div>
      )}

      {/* Pending approvals (if this staff/dealer can approve) */}
      {pendingApprovals.length > 0 && (
        <div style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.3)",borderRadius:"12px",padding:"1rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#F47B20",marginBottom:"0.75rem"}}>
            PENDING MOVEMENT APPROVALS ({pendingApprovals.length})
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {pendingApprovals.map((r:any)=>(
              <div key={r.requestId||r._id} style={{background:"#fff",borderRadius:"8px",padding:"0.75rem 1rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>Car: {r.carId}</div>
                  <div style={{fontSize:"0.75rem",color:"#737373"}}>By: {r.requestedByName} &bull; {r.purpose?.replace(/_/g," ")}</div>
                  <div style={{fontSize:"0.7rem",color:"#AAA"}}>{fmtDate(r.createdAt)}</div>
                </div>
                <button onClick={()=>approveMovement(r.requestId||r._id)}
                  style={{background:"#16A34A",color:"#fff",border:"none",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:700}}>
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements list */}
      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : movements.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"0.75rem"}}>&#x1F697;</div>
          <p style={{color:"#737373",fontSize:"0.875rem"}}>No movements logged yet.</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {movements.map((m:any)=>(
            <div key={m._id} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1rem 1.25rem"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{m.carId}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem",textTransform:"capitalize" as const}}>{m.purpose?.replace(/_/g," ")} &bull; {m.takenByName}</div>
                  <div style={{fontSize:"0.7rem",color:"#AAA",marginTop:"0.15rem"}}>{fmtDate(m.createdAt)}</div>
                  {m.permittedBy && <div style={{fontSize:"0.7rem",color:"#16A34A",marginTop:"0.15rem"}}>Approved by: {m.permittedBy}</div>}
                </div>
                <span style={{padding:"0.2rem 0.625rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:700,color:STAGE_COLORS[m.status]||"#888",border:`1px solid ${STAGE_COLORS[m.status]||"#888"}44`,background:`${STAGE_COLORS[m.status]||"#888"}11`,flexShrink:0}}>
                  {m.status?.replace(/_/g," ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Movement Request Modal */}
      {showNew && (
        <div onClick={()=>setShowNew(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",maxWidth:"600px",maxHeight:"90vh",borderRadius:"16px 16px 0 0",overflow:"hidden",display:"flex",flexDirection:"column"}}>

            <div style={{padding:"0.75rem 1.25rem",background:"#1A1A1A",borderRadius:"16px 16px 0 0",flexShrink:0}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",color:"#F47B20"}}>REQUEST VEHICLE MOVEMENT</div>
              <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",marginTop:"0.15rem"}}>A request will be sent to your selected approver</div>
            </div>

            <form onSubmit={submitRequest} style={{overflowY:"auto",flex:1,padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
              {msg && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",borderRadius:"7px",padding:"0.625rem",fontSize:"0.82rem"}}>{msg}</div>}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                <div><label style={lbl}>Car ID *</label>
                  <input style={fi} value={form.carId} onChange={e=>setForm({...form,carId:e.target.value})} placeholder="e.g. CAR-001" required/>
                </div>
                <div><label style={lbl}>Movement Type *</label>
                  <select style={fi} value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}>
                    {MOVEMENT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Taken By (Name) *</label>
                  <input style={fi} value={form.takenByName} onChange={e=>setForm({...form,takenByName:e.target.value})} placeholder="Person taking car" required/>
                </div>
                <div><label style={lbl}>Taken By (Phone)</label>
                  <input style={fi} value={form.takenByPhone} onChange={e=>setForm({...form,takenByPhone:e.target.value})} placeholder="Phone number"/>
                </div>
                <div><label style={lbl}>Expected Return</label>
                  <input type="datetime-local" style={fi} value={form.expectedReturnTime} onChange={e=>setForm({...form,expectedReturnTime:e.target.value})}/>
                </div>
                <div><label style={lbl}>Send Approval To *</label>
                  <select style={fi} value={form.approverId} onChange={e=>setForm({...form,approverId:e.target.value})} required>
                    <option value="">Select approver...</option>
                    {approvers.map(a=>(
                      <option key={a.id} value={a.id}>
                        {a.name}  {a.position}{a.role==="DEALER_ADMIN"?" (Owner)":""}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label style={lbl}>Notes</label>
                  <textarea style={{...fi,resize:"vertical" as const,minHeight:"60px"}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Purpose details..."/>
                </div>
              </div>

              <div style={{display:"flex",gap:"0.75rem",position:"sticky",bottom:0,background:"#fff",paddingTop:"0.5rem"}}>
                <button type="button" onClick={()=>setShowNew(false)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"10px",padding:"0.875rem",fontSize:"0.9rem",cursor:"pointer"}}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{flex:2,background:saving?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:saving?"not-allowed":"pointer",fontWeight:700}}>
                  {saving?"Sending...":"SEND FOR APPROVAL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
