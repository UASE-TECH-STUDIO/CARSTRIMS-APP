"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ApprovalsPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error">("success");

  const load = async () => {
    setLoading(true);
    try {
      const results: any[] = [];
      try {
        const r = await api.get("/api/v1/admin/dealers?status=awaiting_approval&limit=100");
        (r.data.dealers || r.data || []).forEach((d: any) => results.push(d));
      } catch {}
      try {
        const r = await api.get("/api/v1/admin/dealers?status=pending&limit=100");
        (r.data.dealers || r.data || []).forEach((d: any) => {
          if (!results.find((x) => x._id === d._id)) results.push(d);
        });
      } catch {}
      try {
        const r = await api.get("/api/v1/admin/users?role=DEALER_ADMIN&status=pending&limit=100");
        (r.data.users || []).forEach((u: any) => {
          if (!results.find((x) => x.email === u.email)) {
            results.push({ _id:u._id, userId:u._id, companyName:u.fullName+" (Profile not submitted)", ownerName:u.fullName, email:u.email, phone:u.phone, createdAt:u.createdAt, status:"awaiting_approval", _isUserOnly:true });
          }
        });
      } catch {}
      try {
        const r = await api.get("/api/v1/admin/dealers?limit=200");
        (r.data.dealers || r.data || []).filter((d: any) => d.status==="awaiting_approval"||d.status==="pending").forEach((d: any) => {
          if (!results.find((x) => x._id === d._id)) results.push(d);
        });
      } catch {}
      setDealers(results);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text: string, type: "success"|"error") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 5000); };

  const approve = async (dealer: any) => {
    setActionLoading(dealer._id);
    try {
      if (dealer._isUserOnly) {
        try { await api.post(`/api/v1/admin/users/${dealer._id}/activate`); } catch { await api.patch(`/api/v1/admin/users/${dealer._id}`, { status:"active" }); }
      } else {
        try { await api.post(`/api/v1/admin/dealers/${dealer._id}/approve`); } catch { await api.patch(`/api/v1/admin/dealers/${dealer._id}`, { status:"approved" }); }
      }
      showMsg("Dealer approved successfully!", "success"); load();
    } catch (err: any) { showMsg(err.userMessage||err.response?.data?.detail||"Approval failed","error"); }
    finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id);
    try {
      try { await api.post(`/api/v1/admin/dealers/${rejectModal._id}/reject`, { reason:rejectReason||"Application does not meet requirements" }); }
      catch { await api.patch(`/api/v1/admin/dealers/${rejectModal._id}`, { status:"rejected", rejectReason }); }
      showMsg("Dealer rejected.","success"); setRejectModal(null); setRejectReason(""); load();
    } catch (err: any) { showMsg(err.userMessage||"Failed to reject","error"); }
    finally { setActionLoading(null); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "-";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>Pending Approvals</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{loading?"Loading...":`${dealers.length} dealer${dealers.length!==1?"s":""} awaiting review`}</p>
        </div>
        <button onClick={load} style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.6rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Refresh</button>
      </div>

      {msg && (
        <div style={{background:msgType==="success"?"#F0FDF4":"#FEF2F2",border:`1px solid ${msgType==="success"?"#86EFAC":"#FCA5A5"}`,color:msgType==="success"?"#15803D":"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between"}}>
          {msg}<button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>X</button>
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : dealers.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.75rem"}}>
          <div style={{fontSize:"2rem"}}>&#10003;</div>
          <div style={{fontSize:"0.875rem",fontWeight:600,color:"#1A1A1A"}}>No pending approvals</div>
          <p style={{fontSize:"0.825rem",color:"#737373"}}>All dealer applications have been reviewed.</p>
          <p style={{fontSize:"0.75rem",color:"#A3A3A3"}}>If you expected registrations here, the dealer may not have completed their profile setup yet.</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {dealers.map((d) => (
            <div key={d._id} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem 1.5rem",display:"flex",alignItems:"flex-start",gap:"1.25rem",flexWrap:"wrap"}}>
              <div style={{width:"52px",height:"52px",borderRadius:"8px",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1.3rem",color:"#F47B20",overflow:"hidden",flexShrink:0}}>
                {d.logo?<img src={d.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:(d.companyName?.charAt(0)||"?")}
              </div>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                <div style={{fontWeight:700,fontSize:"1rem",color:"#1A1A1A"}}>{d.companyName}</div>
                <div style={{fontSize:"0.78rem",color:"#737373"}}>{d.ownerName} &middot; {d.email}</div>
                <div style={{fontSize:"0.78rem",color:"#737373"}}>{d.phone}{d.city?` · ${d.city}, ${d.state}`:""}</div>
                {d._isUserOnly&&<div style={{fontSize:"0.72rem",color:"#F47B20",background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"4px",padding:"0.2rem 0.5rem",display:"inline-block"}}>Registered - dealer profile not yet submitted</div>}
                <div style={{fontFamily:"var(--font-mono)",fontSize:"0.68rem",color:"#A3A3A3"}}>{d.dealerId&&`${d.dealerId} · `}Applied {fmtDate(d.createdAt)}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",flexShrink:0}}>
                <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                  style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.65rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1,whiteSpace:"nowrap"}}>
                  {actionLoading===d._id?"Processing...":"Approve"}
                </button>
                <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                  style={{background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"8px",padding:"0.65rem 1.5rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"440px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.15)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>REJECT DEALER</h3>
            <p style={{fontSize:"0.875rem",color:"#737373"}}>Rejecting <strong>{rejectModal.companyName}</strong>. Please provide a reason.</p>
            <div>
              <label style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.4rem"}}>Reason (shown to dealer)</label>
              <textarea style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",color:"#1A1A1A",fontSize:"0.9rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",minHeight:"80px",resize:"vertical" as const}}
                placeholder="e.g. Incomplete information..." value={rejectReason} onChange={(e)=>setRejectReason(e.target.value)} />
            </div>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setRejectModal(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Cancel</button>
              <button onClick={reject} disabled={actionLoading===rejectModal._id} style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===rejectModal._id?0.6:1}}>
                {actionLoading===rejectModal._id?"Rejecting...":"Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}