"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function SuperAdminUserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile"|"documents"|"dealer"|"activity">("profile");
  const [preview, setPreview] = useState<{src:string,isPdf:boolean}|null>(null);
  const [actioning, setActioning] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    api.get(`/api/v1/admin/users/${userId}/profile`)
      .then(r => setProfile(r.data))
      .catch(() => setMsg("Failed to load user profile"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const fmt = (v:any) => (!v && v !== 0) ? "N/A" : String(v);
  const fmtDate = (d:any) => !d ? "N/A" : new Date(d).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const fmtMoney = (n:number) => `NGN ${(n||0).toLocaleString()}`;

  const suspend = async () => {
    if (!confirm("Suspend this user?")) return;
    setActioning(true);
    try { await api.post(`/api/v1/admin/users/${userId}/suspend`,{reason:"Suspended by admin"}); setProfile((p:any)=>({...p,status:"suspended"})); setMsg("User suspended."); }
    catch { setMsg("Failed."); } finally { setActioning(false); }
  };
  const unsuspend = async () => {
    setActioning(true);
    try { await api.post(`/api/v1/admin/users/${userId}/unsuspend`); setProfile((p:any)=>({...p,status:"active"})); setMsg("User reactivated."); }
    catch { setMsg("Failed."); } finally { setActioning(false); }
  };

  const exportCSV = () => {
    const d = profile;
    const dealer = d?.dealer || {};
    const rows = [
      ["Field","Value"],
      ["Full Name", d?.fullName||""],["Email",d?.email||""],["Phone",d?.phone||""],
      ["WhatsApp",d?.whatsapp||""],["Role",d?.role||""],["Status",d?.status||""],
      ["City",d?.city||""],["State",d?.state||""],["Joined",fmtDate(d?.createdAt)],
      ["Last Login",fmtDate(d?.lastLogin)],["Bio",d?.bio||""],
      ["Instagram",d?.instagram||""],["Twitter",d?.twitter||""],
      ["Facebook",d?.facebook||""],["TikTok",d?.tiktok||""],["Website",d?.website||""],
      ["",""],["--- DEALER INFO ---",""],
      ["Company Name",dealer.companyName||""],["Dealer Status",dealer.status||""],
      ["CAC Registered",dealer.isRegisteredBusiness===true?"YES":dealer.isRegisteredBusiness===false?"NO":"Not specified"],
      ["Address",dealer.address||""],["Dealer City",dealer.city||""],
      ["Dealer State",dealer.state||""],["Dealer Phone",dealer.phone||""],
      ["Dealer Email",dealer.email||""],["Setup Date",fmtDate(dealer.createdAt)],
      ["Approved At",fmtDate(dealer.approvedAt)],
      ["Vehicles Listed",d?.recentCars?.length||0],
    ];
    const csv = "\uFEFF" + rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `${d?.fullName?.replace(/\s+/g,"_")||userId}_CARSTRIMS.csv`;
    a.click();
  };

  const exportJSON = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:"application/json"}));
    a.download = `${profile?.fullName?.replace(/\s+/g,"_")||userId}_CARSTRIMS.json`;
    a.click();
  };

  const exportPDF = () => {
    if (!profile) return;
    const d = profile;
    const dealer = d?.dealer || {};
    const win = window.open("","_blank");
    if (!win) return;
    const imgOrEmpty = (url:string|null|undefined, label:string) =>
      url ? `<div class="doc-item"><div class="doc-label">${label}</div><img src="${url}" style="max-width:100%;max-height:200px;object-fit:contain;border:1px solid #E5E5E5;border-radius:6px;margin-top:4px;"/><a href="${url}" target="_blank" style="display:block;margin-top:4px;font-size:0.75rem;color:#1D4ED8;">Download</a></div>`
           : `<div class="doc-item"><div class="doc-label">${label}</div><div class="doc-empty">Not uploaded</div></div>`;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>CARSTRIMS - ${d?.fullName}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Arial,sans-serif;padding:24px;color:#1A1A1A;max-width:800px;margin:0 auto;}
      h1{font-size:1.5rem;margin-bottom:4px;color:#F47B20;} .subtitle{color:#737373;font-size:0.85rem;margin-bottom:16px;}
      h2{font-size:1rem;margin:20px 0 10px;padding:6px 10px;background:#F5F5F5;border-left:4px solid #F47B20;border-radius:2px;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
      .field{padding:8px;background:#FAFAFA;border:1px solid #E5E5E5;border-radius:4px;}
      .field-label{font-size:0.68rem;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;}
      .field-val{font-size:0.875rem;font-weight:600;word-break:break-all;}
      .doc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin:8px 0;}
      .doc-item{padding:10px;border:1px solid #E5E5E5;border-radius:6px;}
      .doc-label{font-size:0.72rem;font-weight:700;color:#525252;margin-bottom:4px;}
      .doc-empty{font-size:0.75rem;color:#A3A3A3;font-style:italic;}
      .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;}
      .badge-orange{background:#FFF7ED;color:#C4621A;border:1px solid rgba(244,123,32,0.3);}
      .badge-red{background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;}
      .badge-green{background:#F0FDF4;color:#15803D;border:1px solid #86EFAC;}
      .notice{padding:10px 14px;border-radius:6px;font-size:0.8rem;margin-top:8px;}
      .notice-warn{background:#FFF7ED;border:1px solid rgba(244,123,32,0.4);color:#C4621A;}
      .notice-danger{background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;}
      .footer{margin-top:24px;padding-top:12px;border-top:1px solid #E5E5E5;font-size:0.72rem;color:#A3A3A3;text-align:center;}
      @media print{body{padding:12px;}}
    </style></head><body>
    <h1>CARSTRIMS</h1>
    <div class="subtitle">User Record - Exported ${new Date().toLocaleString("en-NG")}</div>
    <h2>Personal Information</h2>
    <div class="grid">
      <div class="field"><div class="field-label">Full Name</div><div class="field-val">${d?.fullName||"N/A"}</div></div>
      <div class="field"><div class="field-label">Role</div><div class="field-val"><span class="badge badge-orange">${d?.role?.replace(/_/g," ")||"N/A"}</span></div></div>
      <div class="field"><div class="field-label">Status</div><div class="field-val"><span class="badge ${d?.status==="active"||d?.status==="approved"?"badge-green":"badge-red"}">${d?.status||"N/A"}</span></div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-val">${d?.email||"N/A"}</div></div>
      <div class="field"><div class="field-label">Phone</div><div class="field-val">${d?.phone||"N/A"}</div></div>
      <div class="field"><div class="field-label">WhatsApp</div><div class="field-val">${d?.whatsapp||"N/A"}</div></div>
      <div class="field"><div class="field-label">City</div><div class="field-val">${d?.city||"N/A"}</div></div>
      <div class="field"><div class="field-label">State</div><div class="field-val">${d?.state||"N/A"}</div></div>
      <div class="field"><div class="field-label">Joined</div><div class="field-val">${fmtDate(d?.createdAt)}</div></div>
      <div class="field"><div class="field-label">Last Login</div><div class="field-val">${fmtDate(d?.lastLogin)}</div></div>
    </div>
    <h2>Documents</h2>
    <div class="doc-grid">
      ${imgOrEmpty(dealer.passportPhoto||d?.passportPhoto,"Passport Photo")}
      ${imgOrEmpty(dealer.logo||d?.logo,"Business Logo")}
      ${imgOrEmpty(dealer.idCardUrl||d?.idCardUrl,"ID Card")}
      ${dealer.isRegisteredBusiness===false
        ? `<div class="doc-item"><div class="doc-label">CAC Document</div><div class="notice notice-warn">Not a registered business - no CAC expected</div></div>`
        : imgOrEmpty(dealer.cacUrl||d?.cacUrl,"CAC Document")}
    </div>
    ${dealer.isRegisteredBusiness===false?`<div class="notice notice-warn">This dealer indicated their business is NOT registered with CAC during setup.</div>`:""}
    ${dealer.isRegisteredBusiness===true&&!dealer.cacUrl?`<div class="notice notice-danger">Dealer claims CAC registration but no document was uploaded.</div>`:""}
    ${dealer.companyName?`
    <h2>Dealership Information</h2>
    <div class="grid">
      <div class="field"><div class="field-label">Company Name</div><div class="field-val">${dealer.companyName||"N/A"}</div></div>
      <div class="field"><div class="field-label">Dealer Status</div><div class="field-val"><span class="badge ${dealer.status==="approved"?"badge-green":"badge-orange"}">${dealer.status||"N/A"}</span></div></div>
      <div class="field"><div class="field-label">CAC Registered</div><div class="field-val">${dealer.isRegisteredBusiness===true?"YES":dealer.isRegisteredBusiness===false?"NO":"Not specified"}</div></div>
      <div class="field"><div class="field-label">Address</div><div class="field-val">${dealer.address||"N/A"}</div></div>
      <div class="field"><div class="field-label">City</div><div class="field-val">${dealer.city||"N/A"}</div></div>
      <div class="field"><div class="field-label">State</div><div class="field-val">${dealer.state||"N/A"}</div></div>
      <div class="field"><div class="field-label">Setup Date</div><div class="field-val">${fmtDate(dealer.createdAt)}</div></div>
      <div class="field"><div class="field-label">Approved At</div><div class="field-val">${fmtDate(dealer.approvedAt)}</div></div>
    </div>`:""}
    <div class="footer">CARSTRIMS Platform - UASE TECH STUDIO - Confidential</div>
    </body></html>`);
    win.document.close();
    setTimeout(()=>win.print(), 500);
  };

  const ROLE_C: Record<string,string> = {DEALER_ADMIN:"#F47B20",DEALER_STAFF:"#D97706",PARTNER_USER:"#7B68EE",SYSTEM_ADMIN:"#DC2626",PUBLIC_USER:"#16A34A"};
  const STATUS_C: Record<string,string> = {active:"#16A34A",approved:"#16A34A",suspended:"#DC2626",awaiting_approval:"#D97706",pending:"#D97706",rejected:"#DC2626"};

  const Row = ({label,val}:{label:string,val:any}) => (
    <div style={{display:"flex",gap:"0.5rem",padding:"0.6rem 0",borderBottom:"1px solid #F5F5F5",flexWrap:"wrap"}}>
      <div style={{minWidth:"160px",fontSize:"0.72rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{label}</div>
      <div style={{flex:1,fontSize:"0.875rem",color:"#1A1A1A",wordBreak:"break-all" as const}}>{fmt(val)}</div>
    </div>
  );

  const DocCard = ({url,label}:{url?:string|null,label:string}) => {
    const isPdf = url?.toLowerCase().includes(".pdf");
    return (
      <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",background:"#fff"}}>
        <div style={{padding:"0.5rem 0.75rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:"0.72rem",fontWeight:700,color:"#525252"}}>{label}</span>
          {url && (
            <div style={{display:"flex",gap:"0.375rem"}}>
              <button onClick={()=>setPreview({src:url,isPdf:isPdf||false})}
                style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"4px",padding:"0.2rem 0.5rem",fontSize:"0.65rem",cursor:"pointer",fontWeight:700}}>View</button>
              <a href={url} download target="_blank" rel="noreferrer"
                style={{background:"#1A1A1A",color:"#fff",borderRadius:"4px",padding:"0.2rem 0.5rem",fontSize:"0.65rem",textDecoration:"none",fontWeight:700}}>DL</a>
            </div>
          )}
        </div>
        {url ? (
          !isPdf ? (
            <div style={{height:"130px",overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setPreview({src:url,isPdf:false})}>
              <img src={url} alt={label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            </div>
          ) : (
            <div style={{padding:"1rem",textAlign:"center",fontSize:"0.75rem",color:"#737373"}}>PDF - click View or Download</div>
          )
        ) : (
          <div style={{padding:"1.25rem",textAlign:"center",fontSize:"0.75rem",color:"#A3A3A3",fontStyle:"italic"}}>Not uploaded</div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"400px",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",color:"#F47B20",letterSpacing:"0.15em"}}>LOADING</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!profile) return (
    <div style={{padding:"2rem",textAlign:"center",color:"#737373"}}>
      {msg||"User not found"}
      <br/><button onClick={()=>router.back()} style={{marginTop:"1rem",background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.625rem 1.25rem",cursor:"pointer"}}>Go Back</button>
    </div>
  );

  const dealer = profile.dealer || {};
  const isDealer = profile.role==="DEALER_ADMIN"||profile.role==="DEALER_STAFF";

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"1.25rem",fontFamily:"var(--font-body)"}}>

      {/* Lightbox */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setPreview(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>X</button>
          {preview.isPdf
            ? <iframe src={preview.src} onClick={(e:any)=>e.stopPropagation()} style={{width:"88vw",height:"88vh",border:"none",borderRadius:"8px"}}/>
            : <img src={preview.src} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
          }
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem",flexWrap:"wrap",gap:"0.625rem"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#525252",cursor:"pointer",fontWeight:600,fontSize:"0.875rem",fontFamily:"var(--font-body)"}}>Back</button>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <button onClick={exportCSV} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>Export CSV</button>
          <button onClick={exportJSON} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>Export JSON</button>
          <button onClick={exportPDF} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:700}}>Export PDF</button>
          {profile.status==="suspended"
            ? <button onClick={unsuspend} disabled={actioning} style={{background:"#16A34A",color:"#fff",border:"none",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:700}}>Reactivate</button>
            : <button onClick={suspend} disabled={actioning} style={{background:"#DC2626",color:"#fff",border:"none",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:700}}>Suspend</button>
          }
        </div>
      </div>

      {msg && <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"1rem",fontSize:"0.85rem",color:"#15803D"}}>{msg}</div>}

      {/* User card */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem",marginBottom:"1.25rem",display:"flex",gap:"1rem",flexWrap:"wrap",alignItems:"flex-start"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",overflow:"hidden",background:"#FFF7ED",border:"2.5px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem",color:"#F47B20",flexShrink:0}}>
          {(profile.avatar||profile.profilePicture)
            ? <img src={profile.avatar||profile.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span>{profile.fullName?.charAt(0)||"?"}</span>
          }
        </div>
        <div style={{flex:1,minWidth:"160px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.625rem",flexWrap:"wrap",marginBottom:"0.35rem"}}>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"1.35rem",color:"#1A1A1A",margin:0,letterSpacing:"0.03em"}}>{profile.fullName}</h1>
            <span style={{background:`${ROLE_C[profile.role]||"#737373"}18`,color:ROLE_C[profile.role]||"#737373",border:`1.5px solid ${ROLE_C[profile.role]||"#737373"}40`,borderRadius:"20px",padding:"0.18rem 0.625rem",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.06em"}}>
              {profile.role?.replace(/_/g," ")}
            </span>
            <span style={{background:`${STATUS_C[profile.status]||"#737373"}18`,color:STATUS_C[profile.status]||"#737373",border:`1.5px solid ${STATUS_C[profile.status]||"#737373"}40`,borderRadius:"20px",padding:"0.18rem 0.625rem",fontSize:"0.68rem",fontWeight:700}}>
              {profile.status||"unknown"}
            </span>
          </div>
          <div style={{fontSize:"0.82rem",color:"#737373"}}>{profile.email}</div>
          <div style={{fontSize:"0.75rem",color:"#A3A3A3",marginTop:"0.15rem"}}>Joined {fmtDate(profile.createdAt)} &nbsp;|&nbsp; Last login {fmtDate(profile.lastLogin)}</div>
          <div style={{display:"flex",gap:"0.5rem",marginTop:"0.75rem",flexWrap:"wrap"}}>
            <Link href={`/users/${userId}`} target="_blank" style={{fontSize:"0.72rem",color:"#F47B20",textDecoration:"none",fontWeight:600,background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"5px",padding:"0.2rem 0.5rem"}}>Public Profile</Link>
            {isDealer && dealer.dealerId && (
              <Link href={`/dealers/${dealer.dealerId}`} target="_blank" style={{fontSize:"0.72rem",color:"#525252",textDecoration:"none",fontWeight:600,background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.2rem 0.5rem"}}>Dealer Profile</Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"0.25rem",marginBottom:"1.25rem",background:"#F5F5F5",padding:"0.25rem",borderRadius:"10px"}}>
        {(["profile","documents","dealer","activity"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:1,padding:"0.55rem",borderRadius:"8px",border:"none",background:tab===t?"#fff":"transparent",color:tab===t?"#F47B20":"#737373",fontFamily:"var(--font-display)",fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase" as const,cursor:"pointer",fontWeight:tab===t?700:400,boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
            {t}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab==="profile" && (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
          <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>Personal Information</div>
          <Row label="Full Name" val={profile.fullName}/>
          <Row label="Email" val={profile.email}/>
          <Row label="Phone" val={profile.phone}/>
          <Row label="WhatsApp" val={profile.whatsapp}/>
          <Row label="Role" val={profile.role?.replace(/_/g," ")}/>
          <Row label="Status" val={profile.status}/>
          <Row label="City" val={profile.city}/>
          <Row label="State" val={profile.state}/>
          <Row label="Bio" val={profile.bio}/>
          <Row label="Instagram" val={profile.instagram}/>
          <Row label="Twitter" val={profile.twitter}/>
          <Row label="Facebook" val={profile.facebook}/>
          <Row label="TikTok" val={profile.tiktok}/>
          <Row label="YouTube" val={profile.youtube}/>
          <Row label="Website" val={profile.website}/>
          <Row label="Joined" val={fmtDate(profile.createdAt)}/>
          <Row label="Last Login" val={fmtDate(profile.lastLogin)}/>
          <Row label="Last Updated" val={fmtDate(profile.updatedAt)}/>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {tab==="documents" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"1rem"}}>Identity & Business Documents</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0.875rem"}}>
              <DocCard url={profile.avatar||profile.profilePicture} label="Profile Photo"/>
              <DocCard url={dealer.passportPhoto||profile.passportPhoto} label="Passport Photo"/>
              <DocCard url={dealer.logo||profile.logo} label="Business Logo"/>
              <DocCard url={dealer.idCardUrl||profile.idCardUrl} label="ID Card"/>
              <DocCard
                url={dealer.isRegisteredBusiness===false ? null : (dealer.cacUrl||profile.cacUrl)}
                label="CAC Document"
              />
            </div>

            {/* CAC status notices */}
            {dealer.isRegisteredBusiness===false && (
              <div style={{marginTop:"1rem",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.4)",borderRadius:"10px",padding:"0.875rem 1rem"}}>
                <div style={{fontWeight:700,fontSize:"0.82rem",color:"#C4621A"}}>Not a Registered Business</div>
                <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.2rem"}}>This dealer indicated their business is NOT registered with CAC during setup. No CAC document is expected.</div>
              </div>
            )}
            {dealer.isRegisteredBusiness===true && !dealer.cacUrl && !profile.cacUrl && (
              <div style={{marginTop:"1rem",background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:"10px",padding:"0.875rem 1rem"}}>
                <div style={{fontWeight:700,fontSize:"0.82rem",color:"#DC2626"}}>CAC Document Missing</div>
                <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.2rem"}}>Dealer claimed CAC registration but did not upload a document.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEALER TAB */}
      {tab==="dealer" && (
        !isDealer || !dealer.companyName ? (
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"3rem",textAlign:"center",color:"#A3A3A3",fontSize:"0.875rem"}}>No dealer profile</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
              <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>Dealership Info</div>
              <Row label="Company Name" val={dealer.companyName}/>
              <Row label="Status" val={dealer.status}/>
              <Row label="CAC Registered" val={dealer.isRegisteredBusiness===true?"YES - Registered":dealer.isRegisteredBusiness===false?"NO - Not Registered":"Not specified"}/>
              <Row label="Address" val={dealer.address}/>
              <Row label="City" val={dealer.city}/>
              <Row label="State" val={dealer.state}/>
              <Row label="Phone" val={dealer.phone}/>
              <Row label="WhatsApp" val={dealer.whatsapp}/>
              <Row label="Email" val={dealer.email}/>
              <Row label="Description" val={dealer.description}/>
              <Row label="Setup Date" val={fmtDate(dealer.createdAt)}/>
              <Row label="Approved At" val={fmtDate(dealer.approvedAt)}/>
            </div>

            {/* Vehicles */}
            {profile.recentCars?.length > 0 && (
              <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
                <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.875rem"}}>
                  Listed Vehicles ({profile.recentCars.length})
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.75rem"}}>
                  {profile.recentCars.map((c:any)=>(
                    <Link key={c._id} href={`/cars/${c.carId}`} target="_blank"
                      style={{textDecoration:"none",border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",background:"#FAFAFA",display:"flex",flexDirection:"column"}}>
                      <div style={{height:"90px",background:"#F5F5F5",overflow:"hidden"}}>
                        {c.images?.[0]&&<img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                      </div>
                      <div style={{padding:"0.5rem 0.625rem"}}>
                        <div style={{fontWeight:700,fontSize:"0.78rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                        <div style={{fontSize:"0.68rem",color:"#737373"}}>{fmtMoney(c.sellingPrice)}</div>
                        <span style={{fontSize:"0.62rem",padding:"0.1rem 0.35rem",borderRadius:"4px",background:c.status==="available"?"#F0FDF4":"#F5F5F5",color:c.status==="available"?"#15803D":"#737373",fontWeight:600}}>{c.status}</span>
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
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>Appointments ({profile.appointments?.length||0})</div>
            {!profile.appointments?.length
              ? <div style={{color:"#A3A3A3",fontSize:"0.85rem"}}>No appointments</div>
              : profile.appointments.map((a:any)=>(
                <div key={a._id} style={{padding:"0.75rem 0",borderBottom:"1px solid #F5F5F5",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:"0.85rem",color:"#1A1A1A"}}>{a.type||"Appointment"}</div>
                    <div style={{fontSize:"0.75rem",color:"#737373"}}>{fmtDate(a.scheduledAt||a.createdAt)}</div>
                  </div>
                  <span style={{fontSize:"0.7rem",padding:"0.2rem 0.5rem",borderRadius:"20px",background:"#F5F5F5",color:"#525252",fontWeight:600}}>{a.status||"pending"}</span>
                </div>
              ))}
          </div>
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>Vehicle Requests ({profile.vehicleRequests?.length||0})</div>
            {!profile.vehicleRequests?.length
              ? <div style={{color:"#A3A3A3",fontSize:"0.85rem"}}>No vehicle requests</div>
              : profile.vehicleRequests.map((r:any)=>(
                <div key={r._id} style={{padding:"0.75rem 0",borderBottom:"1px solid #F5F5F5",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:"0.85rem",color:"#1A1A1A"}}>{r.brand} {r.model} {r.year}</div>
                    <div style={{fontSize:"0.75rem",color:"#737373"}}>{fmtDate(r.createdAt)}</div>
                  </div>
                  <span style={{fontSize:"0.7rem",padding:"0.2rem 0.5rem",borderRadius:"20px",background:"#F5F5F5",color:"#525252",fontWeight:600}}>{r.status||"pending"}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}