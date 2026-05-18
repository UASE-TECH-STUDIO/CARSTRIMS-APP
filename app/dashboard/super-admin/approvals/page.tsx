"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

function PreviewModal({ src, type, onClose }: { src:string; type:"image"|"pdf"; onClose:()=>void }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",maxWidth:"90vw",maxHeight:"92vh"}}>
        <button onClick={onClose} style={{position:"absolute",top:"-2.5rem",right:0,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:"36px",height:"36px",color:"#fff",fontSize:"1.1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        {type==="image"
          ? <img src={src} alt="" style={{maxWidth:"88vw",maxHeight:"86vh",objectFit:"contain",borderRadius:"8px",display:"block"}}/>
          : <iframe src={src} style={{width:"80vw",height:"86vh",border:"none",borderRadius:"8px"}}/>
        }
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [noProfile, setNoProfile] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg]           = useState("");
  const [msgType, setMsgType]   = useState<"success"|"error">("success");
  const [preview, setPreview]   = useState<{src:string;type:"image"|"pdf"}|null>(null);
  const [uploading, setUploading] = useState<string|null>(null);
  const uploadRefs = {
    logo: useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
    id: useRef<HTMLInputElement>(null),
    cac: useRef<HTMLInputElement>(null),
  };

  const showMsg = (text:string, type:"success"|"error"="success") => {
    setMsg(text); setMsgType(type); setTimeout(()=>setMsg(""),8000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/v1/admin/dealers", { params:{ status:"awaiting_approval", limit:100 } });
      setDealers(r.data?.dealers||[]);
    } catch(e:any) { console.error("Approvals load error:", e.response?.data); }
    try {
      const r = await api.get("/api/v1/admin/users", { params:{ role:"DEALER_ADMIN", limit:200 } });
      const users = r.data?.users||[];
      setNoProfile(users.filter((u:any)=>u.status==="pending_setup"||u.status==="pending"));
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const approve = async (dealer:any) => {
    setActionLoading(dealer._id);
    try {
      await api.post(`/api/v1/admin/dealers/${dealer._id}/approve`);
      showMsg(`${dealer.companyName} approved ✅`);
      setExpanded(null); load();
    } catch(err:any) { showMsg(`Approval failed: ${err.response?.data?.detail||"Error"}`,"error"); }
    finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id);
    try {
      await api.post(`/api/v1/admin/dealers/${rejectModal._id}/reject`, { reason:rejectReason||"Your application does not meet our requirements." });
      showMsg(`${rejectModal.companyName} rejected.`);
      setRejectModal(null); setRejectReason(""); setExpanded(null); load();
    } catch(err:any) { showMsg(`Reject failed: ${err.response?.data?.detail||"Error"}`,"error"); }
    finally { setActionLoading(null); }
  };

  const cancelUser = async (user:any) => {
    setActionLoading(user._id);
    try {
      await api.post(`/api/v1/admin/users/${user._id}/suspend`,{ reason:"Registration cancelled" });
      showMsg(`${user.fullName||user.username}'s registration cancelled.`);
      setCancelModal(null); load();
    } catch { showMsg("Could not cancel registration.","error"); }
    finally { setActionLoading(null); }
  };

  const handleDocUpload = async (dealerId: string, docType: string, file: File) => {
    setUploading(`${dealerId}-${docType}`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("doc_type", docType);
      await api.post(`/api/v1/admin/dealers/${dealerId}/upload-doc?doc_type=${docType}`, fd, {
        headers: {"Content-Type":"multipart/form-data"},
      });
      showMsg(`${docType} uploaded and attached ✅`);
      load();
    } catch(err:any) { showMsg(`Upload failed: ${err.response?.data?.detail||"Error"}`,"error"); }
    finally { setUploading(null); }
  };

  const fmtDate = (iso:string) => { try { return new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}); } catch { return "-"; } };

  // Document display with upload-if-missing
  const DocSlot = ({ url, label, docType, dealerId, isPdf=false }: { url?:string; label:string; docType:string; dealerId:string; isPdf?:boolean }) => {
    const type = isPdf||(url||"").toLowerCase().includes(".pdf") ? "pdf" : "image";
    const isUploading = uploading === `${dealerId}-${docType}`;
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",minWidth:"90px"}}>
        {isUploading ? (
          <div style={{width:"90px",height:"72px",border:"1.5px dashed #F47B20",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",background:"#FFF7ED"}}>
            <div style={{width:"20px",height:"20px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : url ? (
          <div style={{position:"relative"}}>
            {type==="image" ? (
              <img src={url} alt={label} onClick={()=>setPreview({src:url,type:"image"})}
                style={{width:"90px",height:"72px",objectFit:"cover",borderRadius:"8px",border:"2px solid #86EFAC",cursor:"zoom-in"}}/>
            ) : (
              <div onClick={()=>setPreview({src:url,type:"pdf"})}
                style={{width:"90px",height:"72px",border:"2px solid #86EFAC",borderRadius:"8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"zoom-in",background:"#F0FDF4",fontSize:"1.75rem",gap:"0.25rem"}}>
                📄<span style={{fontSize:"0.6rem",color:"#15803D",fontWeight:600}}>PDF</span>
              </div>
            )}
            <div style={{position:"absolute",top:"-6px",right:"-6px",background:"#16A34A",borderRadius:"50%",width:"18px",height:"18px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",color:"#fff",fontWeight:700}}>✓</div>
          </div>
        ) : (
          <label style={{width:"90px",height:"72px",border:"2px dashed #E5E5E5",borderRadius:"8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAFAFA",gap:"0.25rem",transition:"border-color 0.2s"}}
            onMouseOver={e=>(e.currentTarget.style.borderColor="#F47B20")}
            onMouseOut={e=>(e.currentTarget.style.borderColor="#E5E5E5")}>
            <span style={{fontSize:"1.25rem",opacity:0.3}}>📤</span>
            <span style={{fontSize:"0.6rem",color:"#A3A3A3",textAlign:"center",fontWeight:600}}>Upload</span>
            <input type="file" accept="image/jpeg,image/png,application/pdf" style={{display:"none"}}
              onChange={e=>{const f=e.target.files?.[0];if(f)handleDocUpload(dealerId,docType,f);e.target.value="";}}/>
          </label>
        )}
        <span style={{fontSize:"0.65rem",color:url?"#15803D":"#A3A3A3",fontWeight:600,textAlign:"center"}}>{label}</span>
        {!url && <span style={{fontSize:"0.58rem",color:"#DC2626",textAlign:"center"}}>Not uploaded</span>}
      </div>
    );
  };

  // Passport — circular
  const PassportSlot = ({ url, dealerId }: { url?:string; dealerId:string }) => (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"}}>
      {url ? (
        <div onClick={()=>setPreview({src:url,type:"image"})}
          style={{width:"80px",height:"80px",borderRadius:"50%",overflow:"hidden",border:"2.5px solid #F47B20",cursor:"zoom-in"}}>
          <img src={url} alt="Passport" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
      ) : (
        <label style={{width:"80px",height:"80px",borderRadius:"50%",border:"2.5px dashed #E5E5E5",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAFAFA",gap:"0.2rem"}}
          onMouseOver={e=>(e.currentTarget.style.borderColor="#F47B20")}
          onMouseOut={e=>(e.currentTarget.style.borderColor="#E5E5E5")}>
          <span style={{fontSize:"1.5rem",opacity:0.3}}>👤</span>
          <span style={{fontSize:"0.55rem",color:"#A3A3A3",textAlign:"center"}}>Upload</span>
          <input type="file" accept="image/jpeg,image/png" style={{display:"none"}}
            onChange={e=>{const f=e.target.files?.[0];if(f)handleDocUpload(dealerId,"passport",f);e.target.value="";}}/>
        </label>
      )}
      <span style={{fontSize:"0.65rem",color:url?"#F47B20":"#A3A3A3",fontWeight:600}}>Passport Photo</span>
      {!url && <span style={{fontSize:"0.58rem",color:"#DC2626"}}>Not uploaded</span>}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      {preview&&<PreviewModal src={preview.src} type={preview.type} onClose={()=>setPreview(null)}/>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>Pending Approvals</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>
            {loading?"Loading...":`${dealers.length} ready to approve${noProfile.length>0?` · ${noProfile.length} setup pending`:""}`}
          </p>
        </div>
        <button onClick={load} style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.6rem 1.25rem",fontSize:"0.875rem",cursor:"pointer"}}>↻ Refresh</button>
      </div>

      {msg&&(
        <div style={{background:msgType==="success"?"#F0FDF4":"#FEF2F2",border:`1px solid ${msgType==="success"?"#86EFAC":"#FCA5A5"}`,color:msgType==="success"?"#15803D":"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",gap:"1rem"}}>
          <span>{msg}</span><button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {dealers.length===0&&noProfile.length===0 && (
            <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.875rem"}}>
              <div style={{fontSize:"2rem"}}>✅</div>
              <div style={{fontSize:"0.9rem",fontWeight:600,color:"#1A1A1A"}}>No pending approvals</div>
            </div>
          )}

          {dealers.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373"}}>
                Ready to Approve ({dealers.length})
              </div>
              {dealers.map(d=>(
                <div key={d._id} style={{background:"#fff",border:`1.5px solid ${expanded===d._id?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",overflow:"hidden",transition:"border-color 0.2s"}}>
                  {/* Card header */}
                  <div style={{padding:"1.25rem 1.5rem",display:"flex",alignItems:"flex-start",gap:"1rem",cursor:"pointer"}} onClick={()=>setExpanded(expanded===d._id?null:d._id)}>
                    {/* Logo preview */}
                    <div
                      style={{width:"52px",height:"52px",borderRadius:"8px",overflow:"hidden",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:d.logo?"zoom-in":"default"}}
                      onClick={e=>{if(d.logo){e.stopPropagation();setPreview({src:d.logo,type:"image"})}}}>
                      {d.logo
                        ? <img src={d.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        : <span style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",color:"#F47B20"}}>{d.companyName?.charAt(0)||"?"}</span>
                      }
                    </div>

                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:"0.975rem",color:"#1A1A1A"}}>{d.companyName}</div>
                      <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>{d.ownerName} · {d.email}</div>
                      <div style={{fontSize:"0.78rem",color:"#737373"}}>{d.phone}{d.city?` · ${d.city}, ${d.state}`:""}</div>
                      <div style={{display:"flex",gap:"0.35rem",marginTop:"0.5rem",flexWrap:"wrap"}}>
                        <span style={{fontSize:"0.65rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>Applied {fmtDate(d.createdAt)}</span>
                        {d.passportPhoto
                          ? <span style={{fontSize:"0.65rem",background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✓ Passport</span>
                          : <span style={{fontSize:"0.65rem",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FCA5A5",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✗ No Passport</span>
                        }
                        {d.logo
                          ? <span style={{fontSize:"0.65rem",background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✓ Logo</span>
                          : <span style={{fontSize:"0.65rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>No Logo</span>
                        }
                        {d.idCardUrl
                          ? <span style={{fontSize:"0.65rem",background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✓ ID Card</span>
                          : <span style={{fontSize:"0.65rem",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FCA5A5",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✗ No ID</span>
                        }
                        {d.cacUrl && <span style={{fontSize:"0.65rem",background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>✓ CAC</span>}
                        {d.dealerId&&<span style={{fontSize:"0.62rem",background:"#F5F5F5",color:"#737373",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.15rem 0.5rem",fontFamily:"monospace"}}>{d.dealerId}</span>}
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

                  {/* Expanded */}
                  {expanded===d._id&&(
                    <div style={{borderTop:"1px solid #F5F5F5",padding:"1.5rem",background:"#FAFAFA",display:"flex",flexDirection:"column",gap:"1.5rem"}}>

                      {/* Docs section — always visible with upload option for missing */}
                      <div>
                        <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#737373",marginBottom:"0.75rem"}}>
                          Photos & Documents
                          <span style={{fontSize:"0.65rem",fontWeight:400,color:"#A3A3A3",marginLeft:"0.5rem",textTransform:"none" as const}}>· click uploaded docs to preview · click empty slots to upload missing ones</span>
                        </div>
                        <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap",alignItems:"flex-start"}}>
                          <PassportSlot url={d.passportPhoto} dealerId={d._id}/>
                          <DocSlot url={d.logo} label="Business Logo" docType="logo" dealerId={d._id}/>
                          <DocSlot url={d.idCardUrl} label="ID Card" docType="id" dealerId={d._id} isPdf={d.idCardUrl?.toLowerCase().includes(".pdf")}/>
                          <DocSlot url={d.cacUrl} label="CAC Document" docType="cac" dealerId={d._id} isPdf={d.cacUrl?.toLowerCase().includes(".pdf")}/>
                        </div>
                        {(!d.passportPhoto || !d.idCardUrl) && (
                          <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem",fontSize:"0.8rem",color:"#C4621A",marginTop:"0.75rem",lineHeight:1.6}}>
                            ⚠️ Some required documents are missing. You can upload them above before approving, or contact the dealer to send them manually. You can still approve if satisfied.
                          </div>
                        )}
                      </div>

                      {/* Business info */}
                      <div>
                        <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#737373",marginBottom:"0.75rem"}}>Business Information</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"0.75rem"}}>
                          {[["Company",d.companyName||"-"],["Owner",d.ownerName||"-"],["Email",d.email||"-"],["Phone",d.phone||"-"],["WhatsApp",d.whatsapp||"-"],["City",d.city||"-"],["State",d.state||"-"],["Description",d.description||"Not provided"],["Dealer ID",d.dealerId||"Pending"]].map(([label,val])=>(
                            <div key={label} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 0.875rem"}}>
                              <div style={{fontSize:"0.62rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.2rem"}}>{label}</div>
                              <div style={{fontSize:"0.8rem",color:"#1A1A1A",wordBreak:"break-all"}}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Contact */}
                      <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                        {d.phone&&<a href={`tel:${d.phone}`} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>📞 Call</a>}
                        {(d.whatsapp||d.phone)&&<a href={`https://wa.me/${(d.whatsapp||d.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#15803D",textDecoration:"none"}}>💬 WhatsApp</a>}
                        {d.email&&<a href={`mailto:${d.email}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1D4ED8",textDecoration:"none"}}>✉ Email</a>}
                      </div>

                      {/* Approve/Reject */}
                      <div style={{display:"flex",gap:"0.75rem",borderTop:"1px solid #E5E5E5",paddingTop:"1rem"}}>
                        <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                          style={{flex:2,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1}}>
                          {actionLoading===d._id?"Processing...":"APPROVE DEALER"}
                        </button>
                        <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                          style={{flex:1,background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer"}}>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {noProfile.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373"}}>Registered — Setup Not Completed ({noProfile.length})</div>
              <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"10px",padding:"0.875rem 1rem",fontSize:"0.825rem",color:"#1D4ED8",lineHeight:1.6}}>
                These dealers registered but have not completed their dealership setup. Contact them to sign in and complete it.
              </div>
              {noProfile.map(u=>(
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
                    {(u.whatsapp||u.phone)&&<a href={`https://wa.me/${(u.whatsapp||u.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",color:"#15803D",textDecoration:"none"}}>WhatsApp</a>}
                    {u.email&&<a href={`mailto:${u.email}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",color:"#1D4ED8",textDecoration:"none"}}>Email</a>}
                    <button onClick={()=>setCancelModal(u)} style={{background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Cancel Registration</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"440px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>REJECT APPLICATION</h3>
            <p style={{fontSize:"0.875rem",color:"#737373"}}>Rejecting <strong>{rejectModal.companyName}</strong>. Provide a reason.</p>
            <textarea style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",minHeight:"100px",resize:"vertical" as const,boxSizing:"border-box" as const}} placeholder="Reason for rejection..." value={rejectReason} onChange={e=>setRejectReason(e.target.value)}/>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setRejectModal(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer"}}>Cancel</button>
              <button onClick={reject} disabled={actionLoading===rejectModal._id}
                style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer",opacity:actionLoading===rejectModal._id?0.6:1}}>
                {actionLoading===rejectModal._id?"Rejecting...":"Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"400px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>CANCEL REGISTRATION</h3>
            <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:1.6}}>Cancel <strong>{cancelModal.fullName||cancelModal.username}</strong>'s registration?</p>
            <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"0.75rem",fontSize:"0.8rem",color:"#DC2626"}}>This cannot be undone.</div>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setCancelModal(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer"}}>Keep Account</button>
              <button onClick={()=>cancelUser(cancelModal)} disabled={actionLoading===cancelModal._id}
                style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer",opacity:actionLoading===cancelModal._id?0.6:1}}>
                {actionLoading===cancelModal._id?"Cancelling...":"Yes, Cancel It"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
