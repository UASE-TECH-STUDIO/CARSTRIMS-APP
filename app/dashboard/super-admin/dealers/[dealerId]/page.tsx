"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

function PreviewModal({ src, type, onClose }: { src:string; type:"image"|"pdf"; onClose:()=>void }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <button onClick={onClose} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>✕</button>
      <div onClick={e=>e.stopPropagation()}>
        {type==="image" ? <img src={src} alt="" style={{maxWidth:"88vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/> : <iframe src={src} style={{width:"80vw",height:"86vh",border:"none",borderRadius:"8px"}}/>}
      </div>
    </div>
  );
}

export default function AdminDealerDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const dealerId = params?.dealerId as string;
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{src:string;type:"image"|"pdf"}|null>(null);
  const [uploading, setUploading] = useState<string|null>(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error">("success");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const r = await api.get(`/api/v1/admin/dealers/${dealerId}/setup`);
      setDealer(r.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [dealerId]);

  const showMsg = (text: string, type: "success"|"error" = "success") => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 8000);
  };

  const handleDocUpload = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      const fd = new FormData(); fd.append("file", file);
      await api.post(`/api/v1/admin/dealers/${dealerId}/upload-doc?doc_type=${docType}`, fd, { headers:{"Content-Type":"multipart/form-data"} });
      showMsg(`${docType} uploaded ✅`); load();
    } catch (e: any) { showMsg(`Upload failed: ${e.response?.data?.detail||"Error"}`, "error"); }
    finally { setUploading(null); }
  };

  const handleAction = async (action: string, note?: string) => {
    setActionLoading(true);
    try {
      if (action === "approve")  await api.post(`/api/v1/admin/dealers/${dealerId}/approve`);
      if (action === "suspend")  await api.post(`/api/v1/admin/dealers/${dealerId}/suspend`, { note: note||"Suspended." });
      if (action === "warn")     await api.post(`/api/v1/admin/dealers/${dealerId}/warn`, { note: note||"Warning." });
      showMsg(`Action '${action}' completed ✅`); load();
    } catch (e: any) { showMsg(`Failed: ${e.response?.data?.detail||"Error"}`, "error"); }
    finally { setActionLoading(false); }
  };

  const fi: React.CSSProperties = {background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.65rem 0.875rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",boxSizing:"border-box" as const};

  const DocSlot = ({ url, label, docType }: { url?:string; label:string; docType:string }) => {
    const isPdf = (url||"").toLowerCase().endsWith(".pdf");
    const isUpl = uploading === docType;
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"}}>
        {isUpl ? <div style={{width:"90px",height:"72px",border:"1.5px dashed #F47B20",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",background:"#FFF7ED"}}><div style={{width:"20px",height:"20px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>
        : url ? (
          <div style={{position:"relative"}}>
            {isPdf ? (
              <div onClick={()=>setPreview({src:url,type:"pdf"})} style={{width:"90px",height:"72px",border:"2px solid #86EFAC",borderRadius:"8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#F0FDF4",fontSize:"1.75rem"}}>📄</div>
            ) : (
              <img src={url} alt="" onClick={()=>setPreview({src:url,type:"image"})} style={{width:"90px",height:"72px",objectFit:"cover",borderRadius:"8px",border:"2px solid #86EFAC",cursor:"zoom-in"}}/>
            )}
            <div style={{position:"absolute",top:"-6px",right:"-6px",background:"#16A34A",borderRadius:"50%",width:"18px",height:"18px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",color:"#fff"}}>✓</div>
          </div>
        ) : (
          <label style={{width:"90px",height:"72px",border:"2px dashed #E5E5E5",borderRadius:"8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAFAFA",gap:"0.25rem"}}
            onMouseOver={e=>e.currentTarget.style.borderColor="#F47B20"}
            onMouseOut={e=>e.currentTarget.style.borderColor="#E5E5E5"}>
            <span style={{fontSize:"1.25rem",opacity:0.3}}>📤</span>
            <span style={{fontSize:"0.6rem",color:"#A3A3A3",fontWeight:600}}>Upload</span>
            <input type="file" accept="image/jpeg,image/png,application/pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleDocUpload(docType,f);e.target.value="";}}/>
          </label>
        )}
        <span style={{fontSize:"0.65rem",color:url?"#15803D":"#A3A3A3",fontWeight:600}}>{label}</span>
        {!url && <span style={{fontSize:"0.58rem",color:"#DC2626"}}>Not uploaded</span>}
      </div>
    );
  };

  const PassportSlot = ({ url }: { url?:string }) => {
    const isUpl = uploading === "passport";
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"}}>
        {isUpl ? <div style={{width:"80px",height:"80px",borderRadius:"50%",border:"2.5px dashed #F47B20",display:"flex",alignItems:"center",justifyContent:"center",background:"#FFF7ED"}}><div style={{width:"18px",height:"18px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>
        : url ? (
          <div onClick={()=>setPreview({src:url,type:"image"})} style={{width:"80px",height:"80px",borderRadius:"50%",overflow:"hidden",border:"2.5px solid #F47B20",cursor:"zoom-in"}}>
            <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          </div>
        ) : (
          <label style={{width:"80px",height:"80px",borderRadius:"50%",border:"2.5px dashed #E5E5E5",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#FAFAFA",gap:"0.2rem"}}
            onMouseOver={e=>e.currentTarget.style.borderColor="#F47B20"}
            onMouseOut={e=>e.currentTarget.style.borderColor="#E5E5E5"}>
            <span style={{fontSize:"1.5rem",opacity:0.3}}>👤</span>
            <span style={{fontSize:"0.55rem",color:"#A3A3A3",textAlign:"center"}}>Upload</span>
            <input type="file" accept="image/jpeg,image/png" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleDocUpload("passport",f);e.target.value="";}}/>
          </label>
        )}
        <span style={{fontSize:"0.65rem",color:url?"#F47B20":"#A3A3A3",fontWeight:600}}>Passport</span>
        {!url && <span style={{fontSize:"0.58rem",color:"#DC2626"}}>Not uploaded</span>}
      </div>
    );
  };

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"300px"}}><div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!dealer) return <div style={{padding:"2rem",color:"#737373"}}>Dealer not found. <button onClick={()=>router.back()} style={{color:"#F47B20",background:"none",border:"none",cursor:"pointer"}}>← Go back</button></div>;

  const STATUS_COLORS: Record<string,string> = { approved:"#16A34A", awaiting_approval:"#F47B20", suspended:"#DC2626", rejected:"#737373" };
  const sc = STATUS_COLORS[dealer.status] || "#737373";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      {preview && <PreviewModal src={preview.src} type={preview.type} onClose={()=>setPreview(null)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Topbar */}
      <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#737373",cursor:"pointer",fontSize:"0.875rem",fontWeight:600}}>← Back</button>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1,flex:1}}>{dealer.companyName}</h2>
        <span style={{background:`${sc}15`,color:sc,border:`1.5px solid ${sc}40`,borderRadius:"20px",padding:"0.3rem 0.875rem",fontSize:"0.72rem",fontWeight:700,textTransform:"capitalize" as const}}>{dealer.status?.replace("_"," ")}</span>
      </div>

      {msg && <div style={{background:msgType==="success"?"#F0FDF4":"#FEF2F2",border:`1px solid ${msgType==="success"?"#86EFAC":"#FCA5A5"}`,color:msgType==="success"?"#15803D":"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between"}}><span>{msg}</span><button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button></div>}

      {/* Actions */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem",display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
        {dealer.status !== "approved" && <button onClick={()=>handleAction("approve")} disabled={actionLoading} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.65rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",letterSpacing:"0.08em",cursor:"pointer",opacity:actionLoading?0.6:1}}>✓ Approve</button>}
        {dealer.status === "approved"  && <button onClick={()=>{const n=prompt("Suspension reason:");if(n)handleAction("suspend",n);}} disabled={actionLoading} style={{background:"#FEF2F2",border:"1.5px solid #FCA5A5",color:"#DC2626",borderRadius:"8px",padding:"0.65rem 1.25rem",fontSize:"0.82rem",cursor:"pointer"}}>⛔ Suspend</button>}
        <button onClick={()=>{const n=prompt("Warning message:");if(n)handleAction("warn",n);}} disabled={actionLoading} style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.3)",color:"#C4621A",borderRadius:"8px",padding:"0.65rem 1.25rem",fontSize:"0.82rem",cursor:"pointer"}}>⚠️ Warn</button>
        <Link href={`/dealers/${dealer.dealerId}`} target="_blank" style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.65rem 1.25rem",fontSize:"0.82rem",textDecoration:"none",fontWeight:600}}>View Public Profile ↗</Link>
        {dealer.ownerUser && <Link href={`/dashboard/super-admin/users/${dealer.userId}`} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.65rem 1.25rem",fontSize:"0.82rem",textDecoration:"none",fontWeight:600}}>View Owner Account →</Link>}
      </div>

      {/* Documents */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
        <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#737373"}}>Setup Documents · click to preview · click empty to upload</div>
        <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap",alignItems:"flex-start"}}>
          <PassportSlot url={dealer.passportPhoto}/>
          <DocSlot url={dealer.logo}      label="Business Logo" docType="logo"/>
          <DocSlot url={dealer.idCardUrl} label="ID Card"       docType="id"  />
          <DocSlot url={dealer.cacUrl}    label="CAC Document"  docType="cac" />
        </div>
        {(!dealer.passportPhoto || !dealer.idCardUrl) && (
          <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem",fontSize:"0.8rem",color:"#C4621A",lineHeight:1.6}}>
            ⚠️ Some documents are missing. You can upload them above for record purposes before or after approval.
          </div>
        )}
      </div>

      {/* Business info */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
        <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#737373"}}>Business Information</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.875rem"}}>
          {[["Company",dealer.companyName],["Owner",dealer.ownerName],["Email",dealer.email],["Phone",dealer.phone],["WhatsApp",dealer.whatsapp],["City",dealer.city],["State",dealer.state],["Dealer ID",dealer.dealerId],["Description",dealer.description]].map(([l,v])=>(
            <div key={l} style={{background:"#F5F5F5",borderRadius:"8px",padding:"0.75rem 0.875rem"}}>
              <div style={{fontSize:"0.62rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.2rem"}}>{l}</div>
              <div style={{fontSize:"0.85rem",color:"#1A1A1A",wordBreak:"break-all"}}>{v||"—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Owner user */}
      {dealer.ownerUser && (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#737373"}}>Owner Account</div>
          <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:"0.25rem"}}>
              <div style={{fontWeight:600,color:"#1A1A1A"}}>{dealer.ownerUser.fullName}</div>
              <div style={{fontSize:"0.8rem",color:"#737373"}}>{dealer.ownerUser.email}</div>
              <div style={{fontSize:"0.78rem",color:"#737373"}}>{dealer.ownerUser.phone}</div>
            </div>
            <Link href={`/dashboard/super-admin/users/${dealer.userId}`}
              style={{background:"#F47B20",color:"#fff",textDecoration:"none",borderRadius:"8px",padding:"0.625rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.8rem",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>
              View Full Account →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
