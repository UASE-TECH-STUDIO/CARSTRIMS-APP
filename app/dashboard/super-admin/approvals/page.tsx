"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ApprovalsPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [noProfile, setNoProfile] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error">("success");

  const showMsg = (text: string, type: "success"|"error") => {
    setMsg(text); setMsgType(type); setTimeout(()=>setMsg(""), 8000);
  };

  const load = async () => {
    setLoading(true);
    const results: any[] = [];
    try {
      const r = await api.get("/api/v1/admin/dealers", { params:{ status:"awaiting_approval", limit:100 } });
      (r.data?.dealers||[]).forEach((d:any) => { if(!results.find(x=>x._id===d._id)) results.push(d); });
    } catch (e:any) { console.error("approvals load:", e.response?.data); }
    setDealers(results);
    try {
      const r = await api.get("/api/v1/admin/users", { params:{ role:"DEALER_ADMIN", limit:200 } });
      const users = r.data?.users||[];
      const emails = new Set(results.map((d:any)=>d.email));
      setNoProfile(users.filter((u:any)=>
        (u.status==="pending_setup"||u.status==="pending")&&!emails.has(u.email)
      ));
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const approve = async (dealer: any) => {
    setActionLoading(dealer._id);
    try {
      await api.post(`/api/v1/admin/dealers/${dealer._id}/approve`);
      showMsg(`${dealer.companyName} approved! They now have full access.`, "success");
      setExpanded(null); load();
    } catch (err:any) {
      showMsg(`Approval failed: ${err.response?.data?.detail||"Unknown error"}`, "error");
    } finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id);
    try {
      await api.post(`/api/v1/admin/dealers/${rejectModal._id}/reject`, {
        reason: rejectReason||"Your application does not meet our requirements at this time.",
      });
      showMsg(`${rejectModal.companyName} rejected.`, "success");
      setRejectModal(null); setRejectReason(""); setExpanded(null); load();
    } catch (err:any) {
      showMsg(`Reject failed: ${err.response?.data?.detail||"Unknown error"}`, "error");
    } finally { setActionLoading(null); }
  };

  const cancelUser = async (user: any) => {
    setActionLoading(user._id);
    try {
      await api.delete(`/api/v1/admin/users/${user._id}`);
      showMsg(`${user.fullName||user.username}'s account removed.`, "success");
      setCancelModal(null); load();
    } catch (err:any) {
      // Try patch if delete not available
      try {
        await api.patch(`/api/v1/admin/users/${user._id}`, { status:"cancelled" });
        showMsg(`${user.fullName||user.username}'s registration cancelled.`, "success");
        setCancelModal(null); load();
      } catch {
        showMsg("Could not cancel registration. Please try again.", "error");
      }
    } finally { setActionLoading(null); }
  };

  const fmtDate = (iso:string) => {
    try { return new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}); }
    catch { return "-"; }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>Pending Approvals</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>
            {loading?"Loading...":`${dealers.length} dealer${dealers.length!==1?"s":""} ready to approve${noProfile.length>0?` · ${noProfile.length} registered (setup pending)`:""}`}
          </p>
        </div>
        <button onClick={load} style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.6rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>↻ Refresh</button>
      </div>

      {msg&&(
        <div style={{background:msgType==="success"?"#F0FDF4":"#FEF2F2",border:`1px solid ${msgType==="success"?"#86EFAC":"#FCA5A5"}`,color:msgType==="success"?"#15803D":"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1rem",lineHeight:1.5}}>
          <span>{msg}</span>
          <button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
        </div>
      )}

      {loading?(
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ):(
        <>
          {dealers.length===0&&noProfile.length===0&&(
            <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.875rem"}}>
              <div style={{fontSize:"2rem"}}>✅</div>
              <div style={{fontSize:"0.9rem",fontWeight:600,color:"#1A1A1A"}}>No pending approvals</div>
              <p style={{fontSize:"0.825rem",color:"#737373",maxWidth:"420px",lineHeight:1.6}}>All applications reviewed. New dealers appear here after they register and complete their dealership setup.</p>
            </div>
          )}

          {/* READY TO APPROVE */}
          {dealers.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373"}}>
                Ready to Approve — Setup Completed ({dealers.length})
              </div>
              {dealers.map((d)=>(
                <div key={d._id} style={{background:"#fff",border:`1.5px solid ${expanded===d._id?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",overflow:"hidden",transition:"border-color 0.2s"}}>
                  <div style={{padding:"1.25rem 1.5rem",display:"flex",alignItems:"flex-start",gap:"1rem",cursor:"pointer"}} onClick={()=>setExpanded(expanded===d._id?null:d._id)}>
                    <div style={{width:"52px",height:"52px",borderRadius:"8px",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1.4rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                      {d.logo?<img src={d.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(d.companyName?.charAt(0)||"?")}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:"0.975rem",color:"#1A1A1A"}}>{d.companyName}</div>
                      <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>{d.ownerName} · {d.email}</div>
                      <div style={{fontSize:"0.78rem",color:"#737373"}}>{d.phone}{d.city?` · ${d.city}, ${d.state}`:""}</div>
                      <div style={{display:"flex",gap:"0.5rem",marginTop:"0.4rem",flexWrap:"wrap"}}>
                        <span style={{fontSize:"0.68rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>Applied {fmtDate(d.createdAt)}</span>
                        {d.idCardUrl&&<span style={{fontSize:"0.68rem",background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✓ ID Uploaded</span>}
                        {d.cacUrl&&<span style={{fontSize:"0.68rem",background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✓ CAC Uploaded</span>}
                        {d.dealerId&&<span style={{fontSize:"0.65rem",background:"#F5F5F5",color:"#737373",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.15rem 0.5rem",fontFamily:"monospace"}}>{d.dealerId}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                        style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.5rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.8rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1,whiteSpace:"nowrap"}}>
                        {actionLoading===d._id?"Working...":"✓ Approve"}
                      </button>
                      <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                        style={{background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.5rem 1.25rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  {expanded===d._id&&(
                    <div style={{borderTop:"1px solid #F5F5F5",padding:"1.25rem 1.5rem",background:"#FAFAFA",display:"flex",flexDirection:"column",gap:"1rem"}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"0.75rem"}}>
                        {[["Name",d.ownerName||"-"],["Email",d.email||"-"],["Phone",d.phone||"-"],["WhatsApp",d.whatsapp||d.phone||"-"],["Address",d.address||"-"],["City/State",d.city&&d.state?`${d.city}, ${d.state}`:(d.city||d.state||"-")],["Dealer ID",d.dealerId||"Not assigned"],["DB _id",d._id]].map(([label,val])=>(
                          <div key={label} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 0.875rem"}}>
                            <div style={{fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.2rem"}}>{label}</div>
                            <div style={{fontSize:"0.825rem",color:"#1A1A1A",fontWeight:500,wordBreak:"break-all"}}>{val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Document previews */}
                      {(d.idCardUrl||d.cacUrl||d.passportPhoto||d.businessIdUrl)&&(
                        <div>
                          <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#737373",marginBottom:"0.5rem"}}>Uploaded Documents</div>
                          <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                            {d.passportPhoto&&<div style={{textAlign:"center"}}><img src={d.passportPhoto} alt="Passport" style={{width:"72px",height:"72px",borderRadius:"50%",objectFit:"cover",border:"2px solid #E5E5E5"}}/><div style={{fontSize:"0.62rem",color:"#737373",marginTop:"0.25rem"}}>Passport</div></div>}
                            {d.idCardUrl&&<a href={d.idCardUrl} target="_blank" rel="noreferrer" style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none",display:"flex",alignItems:"center",gap:"0.4rem"}}>📎 ID Card</a>}
                            {d.cacUrl&&<a href={d.cacUrl} target="_blank" rel="noreferrer" style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none",display:"flex",alignItems:"center",gap:"0.4rem"}}>🏢 CAC Doc</a>}
                            {d.businessIdUrl&&<a href={d.businessIdUrl} target="_blank" rel="noreferrer" style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none",display:"flex",alignItems:"center",gap:"0.4rem"}}>🪪 Business ID</a>}
                          </div>
                        </div>
                      )}
                      {!d.idCardUrl&&!d.cacUrl&&(
                        <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem",fontSize:"0.825rem",color:"#C4621A",lineHeight:1.5}}>
                          No verification documents uploaded. You can still approve or contact the dealer to upload from their settings.
                        </div>
                      )}

                      <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                        {d.phone&&<a href={`tel:${d.phone}`} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>📞 Call</a>}
                        {(d.whatsapp||d.phone)&&<a href={`https://wa.me/${(d.whatsapp||d.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#15803D",textDecoration:"none"}}>💬 WhatsApp</a>}
                        {d.email&&<a href={`mailto:${d.email}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1D4ED8",textDecoration:"none"}}>✉️ Email</a>}
                      </div>

                      <div style={{display:"flex",gap:"0.75rem",borderTop:"1px solid #E5E5E5",paddingTop:"1rem"}}>
                        <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                          style={{flex:2,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1}}>
                          {actionLoading===d._id?"Processing...":"APPROVE DEALER"}
                        </button>
                        <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                          style={{flex:1,background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* REGISTERED BUT SETUP NOT DONE */}
          {noProfile.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373"}}>
                Registered — Setup Not Completed ({noProfile.length})
              </div>
              <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"10px",padding:"0.875rem 1rem",fontSize:"0.825rem",color:"#1D4ED8",lineHeight:1.6}}>
                These dealers registered but have not completed their dealership setup. Contact them to sign in and complete it — they will move to the "Ready to Approve" section above. You can cancel their registration if they are inactive or unresponsive.
              </div>
              {noProfile.map((u)=>(
                <div key={u._id} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1rem 1.25rem",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"#E5E5E5",color:"#737373",fontFamily:"var(--font-display)",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {(u.fullName||u.username||"?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:"0.9rem",color:"#1A1A1A"}}>{u.fullName||u.username}</div>
                    <div style={{fontSize:"0.78rem",color:"#737373"}}>{u.email}</div>
                    <div style={{fontSize:"0.72rem",color:"#A3A3A3"}}>Registered {fmtDate(u.createdAt)}</div>
                  </div>
                  <div style={{display:"flex",gap:"0.5rem",flexShrink:0,flexWrap:"wrap"}}>
                    {(u.whatsapp||u.phone)&&<a href={`https://wa.me/${(u.whatsapp||u.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",color:"#15803D",textDecoration:"none",whiteSpace:"nowrap"}}>WhatsApp</a>}
                    {u.email&&<a href={`mailto:${u.email}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",color:"#1D4ED8",textDecoration:"none",whiteSpace:"nowrap"}}>Email</a>}
                    <button onClick={()=>setCancelModal(u)}
                      style={{background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>
                      Cancel Registration
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* REJECT MODAL */}
      {rejectModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"440px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>REJECT APPLICATION</h3>
            <p style={{fontSize:"0.875rem",color:"#737373"}}>Rejecting <strong>{rejectModal.companyName}</strong>. Provide a reason to send to the dealer.</p>
            <textarea style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",minHeight:"100px",resize:"vertical" as const,boxSizing:"border-box" as const}}
              placeholder="Reason for rejection..." value={rejectReason} onChange={e=>setRejectReason(e.target.value)}/>
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

      {/* CANCEL REGISTRATION MODAL */}
      {cancelModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"400px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>CANCEL REGISTRATION</h3>
            <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:1.6}}>
              Are you sure you want to cancel <strong>{cancelModal.fullName||cancelModal.username}</strong>'s registration?<br/>
              This will remove their account and they will need to register again.
            </p>
            <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"0.75rem",fontSize:"0.8rem",color:"#DC2626",lineHeight:1.5}}>
              This action cannot be undone. The user will need to register a new account if they want to apply again.
            </div>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setCancelModal(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Keep Account</button>
              <button onClick={()=>cancelUser(cancelModal)} disabled={actionLoading===cancelModal._id}
                style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===cancelModal._id?0.6:1}}>
                {actionLoading===cancelModal._id?"Cancelling...":"Yes, Cancel It"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
