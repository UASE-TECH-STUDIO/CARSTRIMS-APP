"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

const ROLE_C: Record<string,string> = {DEALER_ADMIN:"#F47B20",DEALER_STAFF:"#D97706",PARTNER_USER:"#7B68EE",SYSTEM_ADMIN:"#DC2626",PUBLIC_USER:"#16A34A"};
const STATUS_C: Record<string,string> = {active:"#16A34A",approved:"#16A34A",suspended:"#DC2626",awaiting_approval:"#D97706",pending:"#D97706",rejected:"#DC2626"};

export default function SuperAdminUserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"profile"|"documents"|"dealer"|"activity">("profile");
  const [preview, setPreview]   = useState<{src:string,isPdf:boolean}|null>(null);
  const [actioning, setActioning] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwResetting, setPwResetting] = useState(false);
  const [banner, setBanner]     = useState("");

  // Edit state
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving]     = useState(false);

  // Document upload
  const [uploading, setUploading] = useState<string|null>(null);
  const fileRefs: Record<string,React.RefObject<HTMLInputElement>> = {
    avatar: useRef<HTMLInputElement>(null),
    passportPhoto: useRef<HTMLInputElement>(null),
    logo: useRef<HTMLInputElement>(null),
    idCardUrl: useRef<HTMLInputElement>(null),
    cacUrl: useRef<HTMLInputElement>(null),
  };

  const load = () => {
    setLoading(true);
    api.get(`/api/v1/admin/users/${userId}/profile`)
      .then(r => { setProfile(r.data); setEditForm(r.data); })
      .catch(() => setBanner("Failed to load user profile"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const fmt = (v:any) => (!v && v!==0) ? "N/A" : String(v);
  const fmtDate = (d:any) => !d ? "N/A" : new Date(d).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const fmtMoney = (n:number) => `NGN ${(n||0).toLocaleString()}`;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      const editable = ["fullName","phone","whatsapp","city","state","bio","instagram","twitter","facebook","tiktok","youtube","website"];
      editable.forEach(k => { if (editForm[k] !== profile[k]) payload[k] = editForm[k]; });
      if (Object.keys(payload).length === 0) { setEditing(false); setSaving(false); return; }
      await api.patch(`/api/v1/admin/users/${userId}/profile`, payload);
      setBanner("Profile updated successfully.");
      setEditing(false);
      load();
    } catch(e:any) { setBanner("Failed to save: " + (e.response?.data?.detail||"error")); }
    finally { setSaving(false); }
  };

  const uploadDoc = async (field: string, file: File) => {
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Upload to Cloudinary via admin upload-doc endpoint
      const folder = field === "logo" ? "dealer-logos" : field === "avatar" ? "profile-pictures" : "documents";
      const res = await api.post(`/api/v1/admin/users/${userId}/upload-doc?field=${field}&folder=${folder}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setBanner(`${field} updated successfully.`);
      load();
    } catch(e:any) {
      setBanner("Upload failed: " + (e.response?.data?.detail||"error"));
    } finally { setUploading(null); }
  };

  const removeDoc = async (field: string) => {
    if (!confirm(`Remove ${field}?`)) return;
    try {
      await api.patch(`/api/v1/admin/users/${userId}/profile`, { [field]: null });
      setBanner(`${field} removed.`);
      load();
    } catch { setBanner("Failed to remove."); }
  };

  const suspend = async () => {
    if (!confirm("Suspend this user?")) return;
    setActioning(true);
    try { await api.post(`/api/v1/admin/users/${userId}/suspend`,{reason:"Suspended by admin"}); setBanner("User suspended."); load(); }
    catch { setBanner("Failed to suspend."); } finally { setActioning(false); }
  };
  const unsuspend = async () => {
    setActioning(true);
    try { await api.post(`/api/v1/admin/users/${userId}/unsuspend`); setBanner("User reactivated."); load(); }
    catch { setBanner("Failed to reactivate."); } finally { setActioning(false); }
  };

  const resetPassword = async () => {
    setPwResetting(true);
    try {
      const res = await api.post(`/api/v1/admin/users/${userId}/reset-password`, newPw ? { newPassword: newPw } : {});
      const generated = res.data?.newPassword;
      setBanner(`Password reset to: ${generated}  User has been notified by email and in-app.`);
      setShowResetPw(false); setNewPw("");
    } catch(e:any) { setBanner("Failed to reset password: " + (e.response?.data?.detail||"error")); }
    finally { setPwResetting(false); }
  };

  const exportCSV = () => {
    const d = profile; const dealer = d?.dealer||{};
    const rows = [
      ["Field","Value"],
      ["Full Name",d?.fullName||""],["Email",d?.email||""],["Phone",d?.phone||""],["WhatsApp",d?.whatsapp||""],
      ["Role",d?.role||""],["Status",d?.status||""],["City",d?.city||""],["State",d?.state||""],
      ["Bio",d?.bio||""],["Instagram",d?.instagram||""],["Twitter",d?.twitter||""],
      ["Facebook",d?.facebook||""],["TikTok",d?.tiktok||""],["Website",d?.website||""],
      ["Joined",fmtDate(d?.createdAt)],["Last Login",fmtDate(d?.lastLogin)],
      ["",""],["Company Name",dealer.companyName||""],["Dealer Status",dealer.status||""],
      ["CAC Registered",dealer.isRegisteredBusiness===true?"YES":dealer.isRegisteredBusiness===false?"NO":"Not specified"],
      ["Address",dealer.address||""],["Setup Date",fmtDate(dealer.createdAt)],["Approved",fmtDate(dealer.approvedAt)],
    ];
    const csv = "\uFEFF" + rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `${d?.fullName?.replace(/\s+/g,"_")||userId}_CARSTRIMS.csv`; a.click();
  };

  const exportPDF = () => {
    if (!profile) return;
    const d = profile; const dealer = d?.dealer||{};
    const doc = (url:string|null|undefined, label:string) => url
      ? `<div class="dblock"><b>${label}</b><br/><img src="${url}" style="max-width:200px;max-height:150px;border:1px solid #eee;border-radius:4px;margin:4px 0;"/><br/><a href="${url}">Download</a></div>`
      : `<div class="dblock"><b>${label}</b><br/><i style="color:#aaa">Not uploaded</i></div>`;
    const win = window.open("","_blank"); if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${d?.fullName} - CARSTRIMS</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#1A1A1A;max-width:750px;margin:0 auto}
    h1{color:#F47B20;font-size:1.4rem}h2{font-size:0.95rem;margin:18px 0 8px;padding:5px 10px;background:#f5f5f5;border-left:4px solid #F47B20}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
    .f{padding:8px;background:#fafafa;border:1px solid #eee;border-radius:4px;font-size:0.83rem}
    .fl{font-size:0.65rem;color:#999;text-transform:uppercase;margin-bottom:2px}
    .docs{display:flex;flex-wrap:wrap;gap:12px}.dblock{font-size:0.8rem;padding:8px;border:1px solid #eee;border-radius:5px}
    .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:700}
    .g{background:#F0FDF4;color:#15803D}.r{background:#FEF2F2;color:#DC2626}.o{background:#FFF7ED;color:#C4621A}
    @media print{body{padding:10px}}</style></head><body>
    <h1>CARSTRIMS User Record</h1>
    <p style="color:#888;font-size:0.8rem">Exported ${new Date().toLocaleString("en-NG")} &bull; Confidential</p>
    <h2>Personal Information</h2>
    <div class="grid">
    <div class="f"><div class="fl">Full Name</div>${d?.fullName||"N/A"}</div>
    <div class="f"><div class="fl">Role</div><span class="badge o">${d?.role?.replace(/_/g," ")||"N/A"}</span></div>
    <div class="f"><div class="fl">Status</div><span class="badge ${d?.status==="active"||d?.status==="approved"?"g":"r"}">${d?.status||"N/A"}</span></div>
    <div class="f"><div class="fl">Email</div>${d?.email||"N/A"}</div>
    <div class="f"><div class="fl">Phone</div>${d?.phone||"N/A"}</div>
    <div class="f"><div class="fl">WhatsApp</div>${d?.whatsapp||"N/A"}</div>
    <div class="f"><div class="fl">City</div>${d?.city||"N/A"}</div>
    <div class="f"><div class="fl">State</div>${d?.state||"N/A"}</div>
    <div class="f"><div class="fl">Joined</div>${fmtDate(d?.createdAt)}</div>
    <div class="f"><div class="fl">Last Login</div>${fmtDate(d?.lastLogin)}</div>
    </div>
    <h2>Documents</h2>
    <div class="docs">
    ${doc(d?.avatar||d?.profilePicture,"Profile Photo")}
    ${doc(dealer.passportPhoto||d?.passportPhoto,"Passport Photo")}
    ${doc(dealer.logo||d?.logo,"Business Logo")}
    ${doc(dealer.idCardUrl||d?.idCardUrl,"ID Card")}
    ${dealer.isRegisteredBusiness===false?`<div class="dblock"><b>CAC Document</b><br/><span class="badge o">Not a Registered Business</span></div>`:doc(dealer.cacUrl||d?.cacUrl,"CAC Document")}
    </div>
    ${dealer.companyName?`<h2>Dealership</h2><div class="grid">
    <div class="f"><div class="fl">Company</div>${dealer.companyName}</div>
    <div class="f"><div class="fl">Dealer Status</div><span class="badge ${dealer.status==="approved"?"g":"o"}">${dealer.status||"N/A"}</span></div>
    <div class="f"><div class="fl">CAC Registered</div>${dealer.isRegisteredBusiness===true?"YES":dealer.isRegisteredBusiness===false?"NO":"Not specified"}</div>
    <div class="f"><div class="fl">Address</div>${dealer.address||"N/A"}</div>
    <div class="f"><div class="fl">Setup Date</div>${fmtDate(dealer.createdAt)}</div>
    <div class="f"><div class="fl">Approved</div>${fmtDate(dealer.approvedAt)}</div>
    </div>`:""}
    <div style="margin-top:20px;padding-top:10px;border-top:1px solid #eee;font-size:0.7rem;color:#aaa;text-align:center">CARSTRIMS Platform - UASE TECH STUDIO - Confidential</div>
    </body></html>`);
    win.document.close(); setTimeout(()=>win.print(),500);
  };

  // Editable field component
  const EditField = ({label,field,type="text",options}:{label:string,field:string,type?:string,options?:string[]}) => (
    <div style={{display:"flex",gap:"0.5rem",padding:"0.6rem 0",borderBottom:"1px solid #F5F5F5",flexWrap:"wrap",alignItems:"center"}}>
      <div style={{minWidth:"160px",fontSize:"0.72rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{label}</div>
      {editing ? (
        options ? (
          <select value={editForm[field]||""} onChange={e=>setEditForm((f:any)=>({...f,[field]:e.target.value}))}
            style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"6px",padding:"0.4rem 0.625rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none"}}>
            {options.map(o=><option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
          </select>
        ) : (
          <input type={type} value={editForm[field]||""} onChange={e=>setEditForm((f:any)=>({...f,[field]:e.target.value}))}
            style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"6px",padding:"0.4rem 0.625rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#E5E5E5"}/>
        )
      ) : (
        <div style={{flex:1,fontSize:"0.875rem",color:"#1A1A1A",wordBreak:"break-all" as const}}>{fmt(profile?.[field])}</div>
      )}
    </div>
  );

  // Document card with upload/remove
  // Force download even for cross-origin Cloudinary URLs
  const downloadFile = async (url: string, label: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = url.split("?")[0].split(".").pop() || "jpg";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${profile?.fullName?.replace(/\s+/g,"_")||"document"}_${label.replace(/\s+/g,"_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const DocCard = ({url,label,field,isPdf}:{url?:string|null,label:string,field:string,isPdf?:boolean}) => (
    <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",background:"#fff"}}>
      <div style={{padding:"0.5rem 0.75rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:"0.72rem",fontWeight:700,color:"#525252"}}>{label}</span>
        <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
          {url && (
            <>
              <button onClick={()=>setPreview({src:url,isPdf:isPdf||false})}
                style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"4px",padding:"0.18rem 0.5rem",fontSize:"0.62rem",cursor:"pointer",fontWeight:700}}>View</button>
              <button onClick={()=>downloadFile(url, label)}
                style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"4px",padding:"0.18rem 0.5rem",fontSize:"0.62rem",cursor:"pointer",fontWeight:700}}>Download</button>
              <button onClick={()=>removeDoc(field)}
                style={{background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",borderRadius:"4px",padding:"0.18rem 0.5rem",fontSize:"0.62rem",cursor:"pointer",fontWeight:700}}>Remove</button>
            </>
          )}
          <button onClick={()=>fileRefs[field]?.current?.click()}
            disabled={uploading===field}
            style={{background:"#EFF6FF",color:"#1D4ED8",border:"1px solid #BFDBFE",borderRadius:"4px",padding:"0.18rem 0.5rem",fontSize:"0.62rem",cursor:"pointer",fontWeight:700,opacity:uploading===field?0.6:1}}>
            {uploading===field?"...":(url?"Replace":"Upload")}
          </button>
          <input ref={fileRefs[field]} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0]) uploadDoc(field,e.target.files[0]);}}/>
        </div>
      </div>
      {url ? (
        !isPdf ? (
          <div style={{height:"120px",overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setPreview({src:url,isPdf:false})}>
            <img src={url} alt={label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          </div>
        ) : (
          <div style={{padding:"1rem",textAlign:"center",fontSize:"0.75rem",color:"#737373"}}>PDF - click View or Download</div>
        )
      ) : (
        <div onClick={()=>fileRefs[field]?.current?.click()}
          style={{padding:"1.5rem",textAlign:"center",fontSize:"0.75rem",color:"#A3A3A3",fontStyle:"italic",cursor:"pointer",transition:"background 0.15s"}}
          onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
          onMouseOut={e=>(e.currentTarget as HTMLElement).style.background=""}>
          Not uploaded &mdash; click to upload
        </div>
      )}
    </div>
  );

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"400px",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",color:"#F47B20",letterSpacing:"0.15em"}}>LOADING</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!profile) return (
    <div style={{padding:"2rem",textAlign:"center",color:"#737373"}}>
      {banner||"User not found"}
      <br/><button onClick={()=>router.back()} style={{marginTop:"1rem",background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.625rem 1.25rem",cursor:"pointer"}}>Go Back</button>
    </div>
  );

  const dealer = profile.dealer||{};
  const isDealer = profile.role==="DEALER_ADMIN"||profile.role==="DEALER_STAFF";

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"1.25rem",fontFamily:"var(--font-body)"}}>

      {/* Lightbox */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setPreview(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.2rem",width:"38px",height:"38px",borderRadius:"50%",cursor:"pointer"}}>X</button>
          {preview.isPdf
            ? <iframe src={preview.src} onClick={(e:any)=>e.stopPropagation()} style={{width:"88vw",height:"88vh",border:"none",borderRadius:"8px"}}/>
            : <img src={preview.src} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>}
        </div>
      )}

      {/* Topbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#525252",cursor:"pointer",fontWeight:600,fontSize:"0.875rem",fontFamily:"var(--font-body)"}}>Back</button>
        <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
          <button onClick={exportCSV} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"0.375rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600}}>CSV</button>
          <button onClick={exportPDF} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"7px",padding:"0.375rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:700}}>PDF / Print</button>
          <button onClick={()=>setShowResetPw(!showResetPw)} style={{background:"#EFF6FF",color:"#1D4ED8",border:"1.5px solid #BFDBFE",borderRadius:"7px",padding:"0.375rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600}}>Reset Password</button>
          {profile.status==="suspended"
            ? <button onClick={unsuspend} disabled={actioning} style={{background:"#16A34A",color:"#fff",border:"none",borderRadius:"7px",padding:"0.375rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:700}}>Reactivate</button>
            : <button onClick={suspend} disabled={actioning} style={{background:"#DC2626",color:"#fff",border:"none",borderRadius:"7px",padding:"0.375rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:700}}>Suspend</button>
          }
        </div>
      </div>

      {showResetPw && (
        <div style={{background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:"10px",padding:"1rem 1.25rem",marginBottom:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#1D4ED8"}}>RESET USER PASSWORD</div>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}>
            <input value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Leave blank to auto-generate"
              style={{flex:1,minWidth:"200px",background:"#fff",border:"1.5px solid #BFDBFE",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none"}}/>
            <button onClick={resetPassword} disabled={pwResetting}
              style={{background:"#1D4ED8",color:"#fff",border:"none",borderRadius:"7px",padding:"0.5rem 1rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:700,opacity:pwResetting?0.6:1}}>
              {pwResetting?"Resetting...":"Reset & Notify User"}
            </button>
            <button onClick={()=>setShowResetPw(false)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.78rem",cursor:"pointer"}}>Cancel</button>
          </div>
          <div style={{fontSize:"0.72rem",color:"#1D4ED8"}}>User will be notified by email and in-app notification with the new password.</div>
        </div>
      )}

      {banner && (
        <div style={{background:banner.includes("success")||banner.includes("updated")||banner.includes("removed")||banner.includes("reactivated")?"#F0FDF4":"#FEF2F2",border:"1px solid",borderColor:banner.includes("success")||banner.includes("updated")||banner.includes("removed")||banner.includes("reactivated")?"#86EFAC":"#FECACA",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"1rem",fontSize:"0.85rem",color:banner.includes("success")||banner.includes("updated")||banner.includes("removed")||banner.includes("reactivated")?"#15803D":"#DC2626",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {banner}
          <button onClick={()=>setBanner("")} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:"0.9rem"}}>X</button>
        </div>
      )}

      {/* User card */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem",marginBottom:"1.25rem",display:"flex",gap:"1rem",flexWrap:"wrap",alignItems:"flex-start"}}>
        <div style={{width:"68px",height:"68px",borderRadius:"50%",overflow:"hidden",background:"#FFF7ED",border:"2.5px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem",color:"#F47B20",flexShrink:0}}>
          {(profile.avatar||profile.profilePicture)
            ? <img src={profile.avatar||profile.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span>{profile.fullName?.charAt(0)||"?"}</span>}
        </div>
        <div style={{flex:1,minWidth:"160px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.3rem"}}>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"1.3rem",color:"#1A1A1A",margin:0,letterSpacing:"0.03em"}}>{profile.fullName}</h1>
            <span style={{background:`${ROLE_C[profile.role]||"#737373"}18`,color:ROLE_C[profile.role]||"#737373",border:`1.5px solid ${ROLE_C[profile.role]||"#737373"}40`,borderRadius:"20px",padding:"0.15rem 0.6rem",fontSize:"0.67rem",fontWeight:700}}>{profile.role?.replace(/_/g," ")}</span>
            <span style={{background:`${STATUS_C[profile.status]||"#737373"}18`,color:STATUS_C[profile.status]||"#737373",border:`1.5px solid ${STATUS_C[profile.status]||"#737373"}40`,borderRadius:"20px",padding:"0.15rem 0.6rem",fontSize:"0.67rem",fontWeight:700}}>{profile.status}</span>
          </div>
          <div style={{fontSize:"0.8rem",color:"#737373"}}>{profile.email}</div>
          <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.1rem"}}>Joined {fmtDate(profile.createdAt)} &nbsp;|&nbsp; Last login {fmtDate(profile.lastLogin)}</div>
          <div style={{display:"flex",gap:"0.375rem",marginTop:"0.625rem",flexWrap:"wrap"}}>
            <Link href={`/users/${userId}`} target="_blank" style={{fontSize:"0.7rem",color:"#F47B20",textDecoration:"none",fontWeight:600,background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"5px",padding:"0.18rem 0.5rem"}}>Public Profile</Link>
            {isDealer && dealer.dealerId && <Link href={`/dealers/${dealer.dealerId}`} target="_blank" style={{fontSize:"0.7rem",color:"#525252",textDecoration:"none",fontWeight:600,background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.18rem 0.5rem"}}>Dealer Profile</Link>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"0.25rem",marginBottom:"1.25rem",background:"#F5F5F5",padding:"0.25rem",borderRadius:"10px"}}>
        {(["profile","documents","dealer","activity"] as const).map(t=>(
          <button key={t} onClick={()=>{setTab(t);setEditing(false);}}
            style={{flex:1,padding:"0.5rem",borderRadius:"8px",border:"none",background:tab===t?"#fff":"transparent",color:tab===t?"#F47B20":"#737373",fontFamily:"var(--font-display)",fontSize:"0.65rem",letterSpacing:"0.08em",textTransform:"uppercase" as const,cursor:"pointer",fontWeight:tab===t?700:400,boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
            {t}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab==="profile" && (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.875rem"}}>
            <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const}}>Personal Information</div>
            {editing ? (
              <div style={{display:"flex",gap:"0.375rem"}}>
                <button onClick={()=>{setEditing(false);setEditForm(profile);}} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"6px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600}}>Cancel</button>
                <button onClick={saveProfile} disabled={saving} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:700,opacity:saving?0.6:1}}>{saving?"Saving...":"Save Changes"}</button>
              </div>
            ) : (
              <button onClick={()=>setEditing(true)} style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"6px",padding:"0.3rem 0.875rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:700,letterSpacing:"0.06em",fontFamily:"var(--font-display)"}}>Edit</button>
            )}
          </div>
          <EditField label="Full Name" field="fullName"/>
          <div style={{display:"flex",gap:"0.5rem",padding:"0.6rem 0",borderBottom:"1px solid #F5F5F5",flexWrap:"wrap"}}>
            <div style={{minWidth:"160px",fontSize:"0.72rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Email</div>
            <div style={{flex:1,fontSize:"0.875rem",color:"#1A1A1A"}}>{fmt(profile.email)} <span style={{fontSize:"0.68rem",color:"#A3A3A3"}}>(contact support to change)</span></div>
          </div>
          <EditField label="Phone" field="phone"/>
          <EditField label="WhatsApp" field="whatsapp"/>
          <EditField label="City" field="city"/>
          <EditField label="State" field="state"/>
          <EditField label="Bio" field="bio"/>
          <EditField label="Instagram" field="instagram"/>
          <EditField label="Twitter" field="twitter"/>
          <EditField label="Facebook" field="facebook"/>
          <EditField label="TikTok" field="tiktok"/>
          <EditField label="YouTube" field="youtube"/>
          <EditField label="Website" field="website"/>
          {/* Read-only fields */}
          {[["Role",profile.role?.replace(/_/g," ")],["Status",profile.status],["Joined",fmtDate(profile.createdAt)],["Last Login",fmtDate(profile.lastLogin)]].map(([l,v])=>(
            <div key={String(l)} style={{display:"flex",gap:"0.5rem",padding:"0.6rem 0",borderBottom:"1px solid #F5F5F5",flexWrap:"wrap"}}>
              <div style={{minWidth:"160px",fontSize:"0.72rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{l}</div>
              <div style={{flex:1,fontSize:"0.875rem",color:"#1A1A1A"}}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {tab==="documents" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"9px",padding:"0.75rem 1rem",fontSize:"0.8rem",color:"#15803D",fontWeight:500}}>
            You can upload, replace, or remove any document on behalf of this user. Changes apply immediately.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0.875rem"}}>
            <DocCard url={profile.avatar||profile.profilePicture} label="Profile Photo" field="avatar"/>
            <DocCard url={dealer.passportPhoto||profile.passportPhoto} label="Passport Photo" field="passportPhoto"/>
            <DocCard url={dealer.logo||profile.logo} label="Business Logo" field="logo"/>
            <DocCard url={dealer.idCardUrl||profile.idCardUrl} label="ID Card" field="idCardUrl" isPdf={(dealer.idCardUrl||profile.idCardUrl)?.includes(".pdf")}/>
            <DocCard url={dealer.isRegisteredBusiness===false?null:(dealer.cacUrl||profile.cacUrl)} label="CAC Document" field="cacUrl" isPdf={(dealer.cacUrl||profile.cacUrl)?.includes(".pdf")}/>
          </div>
          {dealer.isRegisteredBusiness===false && (
            <div style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.4)",borderRadius:"10px",padding:"0.875rem 1rem"}}>
              <div style={{fontWeight:700,fontSize:"0.82rem",color:"#C4621A"}}>Not a Registered Business</div>
              <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.2rem"}}>Dealer indicated business is NOT CAC-registered. No CAC document expected.</div>
            </div>
          )}
        </div>
      )}

      {/* DEALER TAB */}
      {tab==="dealer" && (
        !isDealer||!dealer.companyName ? (
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"3rem",textAlign:"center",color:"#A3A3A3",fontSize:"0.875rem"}}>No dealer profile associated</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
              <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>Dealership Info</div>
              {[["Company Name",dealer.companyName],["Status",dealer.status],["CAC Registered",dealer.isRegisteredBusiness===true?"YES - Registered":dealer.isRegisteredBusiness===false?"NO - Not Registered":"Not specified"],["Address",dealer.address],["City",dealer.city],["State",dealer.state],["Phone",dealer.phone],["Email",dealer.email],["Description",dealer.description],["Setup Date",fmtDate(dealer.createdAt)],["Approved At",fmtDate(dealer.approvedAt)]].map(([l,v])=>(
                <div key={String(l)} style={{display:"flex",gap:"0.5rem",padding:"0.6rem 0",borderBottom:"1px solid #F5F5F5",flexWrap:"wrap"}}>
                  <div style={{minWidth:"160px",fontSize:"0.72rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{l}</div>
                  <div style={{flex:1,fontSize:"0.875rem",color:"#1A1A1A"}}>{fmt(v)}</div>
                </div>
              ))}
            </div>
            {profile.recentCars?.length>0 && (
              <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
                <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.875rem"}}>Listed Vehicles ({profile.recentCars.length})</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"0.75rem"}}>
                  {profile.recentCars.map((c:any)=>(
                    <Link key={c._id} href={`/cars/${c.carId}`} target="_blank"
                      style={{textDecoration:"none",border:"1.5px solid #E5E5E5",borderRadius:"9px",overflow:"hidden",background:"#FAFAFA",display:"flex",flexDirection:"column"}}>
                      <div style={{height:"88px",background:"#F5F5F5",overflow:"hidden"}}>
                        {c.images?.[0]&&<img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                      </div>
                      <div style={{padding:"0.5rem 0.625rem"}}>
                        <div style={{fontWeight:700,fontSize:"0.78rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                        <div style={{fontSize:"0.68rem",color:"#737373"}}>{fmtMoney(c.sellingPrice)}</div>
                        <span style={{fontSize:"0.62rem",padding:"0.1rem 0.3rem",borderRadius:"4px",background:c.status==="available"?"#F0FDF4":"#F5F5F5",color:c.status==="available"?"#15803D":"#737373",fontWeight:600}}>{c.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ACTIVITY TAB */}
      {tab==="activity" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {[{title:"Appointments",data:profile.appointments},{title:"Vehicle Requests",data:profile.vehicleRequests}].map(({title,data})=>(
            <div key={title} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
              <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>{title} ({data?.length||0})</div>
              {!data?.length ? <div style={{color:"#A3A3A3",fontSize:"0.85rem"}}>None found</div>
                : data.map((a:any)=>(
                  <div key={a._id} style={{padding:"0.625rem 0",borderBottom:"1px solid #F5F5F5",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:"0.83rem",color:"#1A1A1A"}}>{a.type||a.brand||"Item"} {a.model||""} {a.year||""}</div>
                      <div style={{fontSize:"0.72rem",color:"#737373"}}>{fmtDate(a.scheduledAt||a.createdAt)}</div>
                    </div>
                    <span style={{fontSize:"0.7rem",padding:"0.18rem 0.5rem",borderRadius:"20px",background:"#F5F5F5",color:"#525252",fontWeight:600}}>{a.status||"pending"}</span>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}