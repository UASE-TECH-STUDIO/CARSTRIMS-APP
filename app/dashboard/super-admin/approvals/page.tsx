"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ApprovalsPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error">("success");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const showMsg = (text: string, type: "success"|"error") => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 8000);
  };

  const load = async () => {
    setLoading(true);
    const results: any[] = [];
    const log: string[] = [];

    const tryGet = async (url: string, params: any) => {
      try {
        const r = await api.get(url, { params });
        const raw = r.data;
        const list: any[] = raw?.dealers || raw?.items || raw?.data || (Array.isArray(raw) ? raw : []);
        log.push(`GET ${url} params=${JSON.stringify(params)} => ${list.length} items`);
        return list;
      } catch (e: any) {
        log.push(`GET ${url} params=${JSON.stringify(params)} => ERROR ${e.response?.status}: ${e.response?.data?.detail || e.message}`);
        return [];
      }
    };

    const all1 = await tryGet("/api/v1/admin/dealers", { status: "awaiting_approval", limit: 100 });
    all1.forEach((d: any) => { if (!results.find(x => x._id === d._id)) results.push(d); });

    const all2 = await tryGet("/api/v1/admin/dealers", { status: "pending", limit: 100 });
    all2.forEach((d: any) => { if (!results.find(x => x._id === d._id)) results.push(d); });

    const allDealers = await tryGet("/api/v1/admin/dealers", { limit: 200 });
    allDealers
      .filter((d: any) => d.status === "awaiting_approval" || d.status === "pending")
      .forEach((d: any) => { if (!results.find(x => x._id === d._id)) results.push(d); });

    try {
      const ru = await api.get("/api/v1/admin/users", { params: { role: "DEALER_ADMIN", limit: 200 } });
      const users = ru.data?.users || ru.data?.items || (Array.isArray(ru.data) ? ru.data : []);
      log.push(`GET /api/v1/admin/users role=DEALER_ADMIN => ${users.length} users`);
      users
        .filter((u: any) => u.status === "pending" || u.status === "awaiting_approval")
        .forEach((u: any) => {
          if (!results.find(x => x.email === u.email || x.userId === u._id)) {
            results.push({
              _id: u._id, userId: u._id,
              companyName: (u.fullName || u.username || "Unknown") + " - profile not submitted",
              ownerName: u.fullName || u.username || "Unknown",
              email: u.email, phone: u.phone || "",
              createdAt: u.createdAt, status: "awaiting_approval",
              _userOnly: true, _noProfile: true,
            });
          }
        });
    } catch (e: any) {
      log.push(`GET /api/v1/admin/users => ERROR ${e.response?.status}`);
    }

    setDealers(results);
    setDebugLog(log);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (dealer: any) => {
    setActionLoading(dealer._id);
    const id = dealer._id;
    const log: string[] = [];
    try {
      let done = false;
      if (dealer._userOnly) {
        const tries = [
          () => api.patch(`/api/v1/admin/users/${id}`, { status: "active" }),
          () => api.post(`/api/v1/admin/users/${id}/activate`),
        ];
        for (const fn of tries) {
          try { await fn(); done = true; log.push("user activate: OK"); break; }
          catch (e: any) { log.push(`user activate try: FAIL ${e.response?.status}`); }
        }
        if (done) showMsg(`${dealer.ownerName} activated. They need to complete dealership setup.`, "success");
      } else {
        const tries = [
          () => api.post(`/api/v1/admin/dealers/${id}/approve`),
          () => api.patch(`/api/v1/admin/dealers/${id}`, { status: "approved" }),
          () => api.put(`/api/v1/admin/dealers/${id}`, { status: "approved" }),
        ];
        for (const fn of tries) {
          try { await fn(); done = true; log.push("dealer approve: OK"); break; }
          catch (e: any) { log.push(`dealer approve try: FAIL ${e.response?.status} - ${e.response?.data?.detail}`); }
        }
        if (done) showMsg(`${dealer.companyName} approved! They now have full access.`, "success");
      }
      if (!done) {
        const detail = log.join(" | ");
        showMsg(`Approval failed. Debug: ${detail}`, "error");
        console.error("Approve attempts:", log);
      } else {
        setExpanded(null); load();
      }
    } catch (e: any) {
      showMsg(`Approval error: ${e.message}`, "error");
    } finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id);
    const id = rejectModal._id;
    const reason = rejectReason || "Application does not meet our requirements";
    try {
      let done = false;
      const tries = [
        () => api.post(`/api/v1/admin/dealers/${id}/reject`, { reason }),
        () => api.patch(`/api/v1/admin/dealers/${id}`, { status: "rejected", rejectionReason: reason }),
      ];
      for (const fn of tries) {
        try { await fn(); done = true; break; } catch {}
      }
      if (done) {
        showMsg(`${rejectModal.companyName} rejected.`, "success");
        setRejectModal(null); setRejectReason(""); setExpanded(null); load();
      } else {
        showMsg("Reject failed — all endpoints returned errors.", "error");
      }
    } catch (e: any) {
      showMsg(`Reject error: ${e.message}`, "error");
    } finally { setActionLoading(null); }
  };

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-NG", {day:"numeric",month:"short",year:"numeric"}); }
    catch { return iso || "-"; }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>Pending Approvals</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{loading?"Loading...":`${dealers.length} application${dealers.length!==1?"s":""} awaiting review`}</p>
        </div>
        <button onClick={load} style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.6rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Refresh</button>
      </div>

      {msg && (
        <div style={{background:msgType==="success"?"#F0FDF4":"#FEF2F2",border:`1px solid ${msgType==="success"?"#86EFAC":"#FCA5A5"}`,color:msgType==="success"?"#15803D":"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1rem",lineHeight:1.5}}>
          <span>{msg}</span>
          <button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",flexShrink:0}}>X</button>
        </div>
      )}

      <details style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem"}}>
        <summary style={{cursor:"pointer",color:"#737373",fontWeight:600,fontSize:"0.8rem"}}>API Debug Log (click to expand — share this if things are not working)</summary>
        <pre style={{marginTop:"0.75rem",color:"#525252",whiteSpace:"pre-wrap",fontSize:"0.72rem",lineHeight:1.6}}>{debugLog.join("\n") || "No requests made yet"}</pre>
      </details>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : dealers.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.875rem"}}>
          <div style={{fontSize:"2rem"}}>Done</div>
          <div style={{fontSize:"0.9rem",fontWeight:600,color:"#1A1A1A"}}>No pending applications found</div>
          <p style={{fontSize:"0.825rem",color:"#737373",maxWidth:"420px",lineHeight:1.6}}>
            No dealers with status awaiting_approval or pending were returned. Expand the API Debug Log above to see exactly what the server returned. If dealers registered, they may still need to complete their setup profile.
          </p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {dealers.map((d) => (
            <div key={d._id} style={{background:"#fff",border:`1.5px solid ${expanded===d._id?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",overflow:"hidden"}}>
              <div style={{padding:"1.25rem 1.5rem",display:"flex",alignItems:"flex-start",gap:"1rem",cursor:"pointer"}} onClick={()=>setExpanded(expanded===d._id?null:d._id)}>
                <div style={{width:"48px",height:"48px",borderRadius:"8px",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1.3rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                  {d.logo?<img src={d.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(d.companyName?.charAt(0)||"?")}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:"0.975rem",color:"#1A1A1A"}}>{d.companyName}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>{d.ownerName} &middot; {d.email}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373"}}>{d.phone}{d.city?` &middot; ${d.city}, ${d.state}`:""}</div>
                  <div style={{display:"flex",gap:"0.5rem",marginTop:"0.4rem",flexWrap:"wrap"}}>
                    <span style={{fontSize:"0.68rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>Applied {fmtDate(d.createdAt)}</span>
                    {d._noProfile&&<span style={{fontSize:"0.68rem",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FCA5A5",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>Setup not completed</span>}
                    {d.dealerId&&<span style={{fontSize:"0.68rem",background:"#F5F5F5",color:"#737373",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.15rem 0.5rem",fontFamily:"monospace"}}>{d.dealerId}</span>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                    style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.5rem 1rem",fontFamily:"var(--font-display)",fontSize:"0.8rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1,whiteSpace:"nowrap"}}>
                    {actionLoading===d._id?"Working...":"Approve"}
                  </button>
                  <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                    style={{background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>
                    Reject
                  </button>
                </div>
              </div>
              {expanded===d._id&&(
                <div style={{borderTop:"1px solid #F5F5F5",padding:"1.25rem 1.5rem",background:"#FAFAFA",display:"flex",flexDirection:"column",gap:"1rem"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.75rem"}}>
                    {[["Name",d.ownerName||"-"],["Email",d.email||"-"],["Phone",d.phone||"-"],["WhatsApp",d.whatsapp||d.phone||"-"],["Address",d.address||"-"],["City/State",d.city&&d.state?`${d.city}, ${d.state}`:(d.city||d.state||"-")],["Status",d.status||"-"],["Dealer ID",d.dealerId||"Not assigned"],["DB ID",d._id]].map(([label,val])=>(
                      <div key={label} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 0.875rem"}}>
                        <div style={{fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.2rem"}}>{label}</div>
                        <div style={{fontSize:"0.825rem",color:"#1A1A1A",fontWeight:500,wordBreak:"break-all"}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {(d.idCardUrl||d.cacUrl)&&(
                    <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                      {d.idCardUrl&&<a href={d.idCardUrl} target="_blank" rel="noreferrer" style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 1rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>View ID Card</a>}
                      {d.cacUrl&&<a href={d.cacUrl} target="_blank" rel="noreferrer" style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 1rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>View CAC</a>}
                    </div>
                  )}
                  {!d.idCardUrl&&!d.cacUrl&&(
                    <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem",fontSize:"0.825rem",color:"#C4621A",lineHeight:1.5}}>
                      No documents uploaded yet. You can still approve, or contact the dealer to upload their ID and business registration from their Settings page before approving.
                    </div>
                  )}
                  {d._noProfile&&(
                    <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"0.875rem",fontSize:"0.825rem",color:"#DC2626",lineHeight:1.5}}>
                      This dealer registered but has not completed their dealership profile yet. Contact them to complete setup, or approve their user account which will allow them to proceed.
                    </div>
                  )}
                  <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                    {d.phone&&<a href={`tel:${d.phone}`} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>Call {d.phone}</a>}
                    {(d.whatsapp||d.phone)&&<a href={`https://wa.me/${(d.whatsapp||d.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#15803D",textDecoration:"none"}}>WhatsApp</a>}
                    {d.email&&<a href={`mailto:${d.email}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1D4ED8",textDecoration:"none"}}>Email</a>}
                  </div>
                  <div style={{display:"flex",gap:"0.75rem",borderTop:"1px solid #E5E5E5",paddingTop:"1rem"}}>
                    <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                      style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1}}>
                      {actionLoading===d._id?"Processing...":"APPROVE DEALER"}
                    </button>
                    <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                      style={{flex:1,background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>
                      Reject Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"440px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>REJECT DEALER APPLICATION</h3>
            <p style={{fontSize:"0.875rem",color:"#737373"}}>Rejecting <strong>{rejectModal.companyName}</strong>. Provide a reason to send to the dealer.</p>
            <div>
              <label style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.4rem"}}>Reason</label>
              <textarea style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",minHeight:"100px",resize:"vertical" as const,boxSizing:"border-box" as const}}
                placeholder="e.g. Documents not provided, incomplete business information..."
                value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
            </div>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setRejectModal(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Cancel</button>
              <button onClick={reject} disabled={actionLoading===rejectModal._id}
                style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===rejectModal._id?0.6:1}}>
                {actionLoading===rejectModal._id?"Rejecting...":"Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
