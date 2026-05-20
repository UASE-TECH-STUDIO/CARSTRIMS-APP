"use client";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import DealerQRCode from "@/components/ui/DealerQRCode";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [dealer, setDealer]             = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [pwSaving, setPwSaving]         = useState(false);
  const [logoUploading, setLogoUploading]   = useState(false);
  const [picUploading, setPicUploading]     = useState(false);
  const [sigUploading, setSigUploading]     = useState(false);
  const [locLoading, setLocLoading]         = useState(false);
  const [success, setSuccess]           = useState("");
  const [error, setError]               = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const picRef  = useRef<HTMLInputElement>(null);
  const sigRef  = useRef<HTMLInputElement>(null);

  const [dealerForm, setDealerForm] = useState({
    description:"", phone:"", whatsapp:"", email:"",
    city:"", state:"", address:"",
    locationLat:"", locationLng:"", locationLabel:"", locationSource:"manual",
    instagram:"", twitter:"", facebook:"", tiktok:"", youtube:"", website:"",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword:"", newPassword:"", confirmPassword:"",
  });

  const loadDealer = async () => {
    try {
      const res = await api.get("/api/v1/dealers/me");
      const d = res.data;
      setDealer(d);
      setDealerForm({
        description: d.description||"",
        phone:       d.phone||"",
        whatsapp:    d.whatsapp||"",
        email:       d.email||"",
        city:        d.city||"",
        state:       d.state||"",
        address:     d.address||"",
        locationLat:    d.locationLat ? String(d.locationLat)   : "",
        locationLng:    d.locationLng ? String(d.locationLng)   : "",
        locationLabel:  d.locationLabel||"",
        locationSource: d.locationSource||"manual",
        instagram:   d.instagram||"",
        twitter:     d.twitter||"",
        facebook:    d.facebook||"",
        tiktok:      d.tiktok||"",
        youtube:     d.youtube||"",
        website:     d.website||"",
      });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadDealer(); }, []);

  const flash = (msg: string, type: "ok"|"err" = "ok") => {
    if (type === "ok") { setSuccess(msg); setError(""); }
    else               { setError(msg);   setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 6000);
  };

  /* ── Logo ── */
  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      await api.post("/api/v1/upload/dealer/logo", fd, { headers:{"Content-Type":"multipart/form-data"} });
      flash("Company logo updated!");
      loadDealer();
    } catch (e:any) { flash(e.response?.data?.detail || "Logo upload failed", "err"); }
    finally { setLogoUploading(false); }
  };

  /* ── Profile picture ── */
  const handlePicUpload = async (file: File) => {
    setPicUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      await api.post("/api/v1/upload/dealer/profile-picture", fd, { headers:{"Content-Type":"multipart/form-data"} });
      flash("Profile picture updated!");
      loadDealer();
    } catch (e:any) { flash(e.response?.data?.detail || "Upload failed", "err"); }
    finally { setPicUploading(false); }
  };

  /* ── Signature ── */
  const handleSigUpload = async (file: File) => {
    setSigUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await api.post("/api/v1/upload/dealer/signature", fd, { headers:{"Content-Type":"multipart/form-data"} });
      await api.patch("/api/v1/dealers/me", { signature: r.data.signature || r.data.url });
      flash("Signature saved — it will appear on all your documents automatically!");
      loadDealer();
    } catch (e:any) { flash(e.response?.data?.detail || "Signature upload failed", "err"); }
    finally { setSigUploading(false); }
  };

  /* ── GPS location ── */
  const handleGPS = () => {
    if (!navigator.geolocation) { flash("Geolocation not supported by your browser", "err"); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const j = await r.json();
          label = j.display_name || label;
        } catch {}
        setDealerForm(f => ({ ...f, locationLat: String(lat), locationLng: String(lng), locationLabel: label, locationSource:"gps" }));
        setLocLoading(false);
        flash("Location captured — save changes to publish it");
      },
      () => { flash("Could not get location. Please allow location access.", "err"); setLocLoading(false); }
    );
  };

  /* ── Save dealer info ── */
  const handleSaveDealer = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      await api.patch("/api/v1/dealers/me", {
        ...dealerForm,
        locationLat:  dealerForm.locationLat  ? parseFloat(dealerForm.locationLat)  : null,
        locationLng:  dealerForm.locationLng  ? parseFloat(dealerForm.locationLng)  : null,
      });
      flash("Dealership info updated successfully!");
      loadDealer();
    } catch (e:any) { flash(e.response?.data?.detail || "Save failed", "err"); }
    finally { setSaving(false); }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { flash("Passwords don't match", "err"); return; }
    if (pwForm.newPassword.length < 8) { flash("Min 8 characters", "err"); return; }
    setPwSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/api/v1/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      flash("Password changed successfully!");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (e:any) { flash(e.response?.data?.detail || "Failed", "err"); }
    finally { setPwSaving(false); }
  };

  const isApproved = dealer?.status === "approved";

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"300px"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─────────────── helpers ─────────────── */
  const fi: React.CSSProperties = { background:"#F5F5F5", border:"1.5px solid #DDD", borderRadius:"6px", padding:"0.7rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", transition:"border-color 0.2s", width:"100%", boxSizing:"border-box" as const };
  const fl = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#888", display:"block", marginBottom:"0.4rem" };

  /* ─────────────── Upload slot component ─────────────── */
  // type: "logo" | "profile" | "signature"
  const UploadSlot = ({ label, sub, url, isRound, uploading: upl, onClick, onRemove, preview }: {
    label:string; sub:string; url?:string|null; isRound?:boolean; uploading:boolean;
    onClick:()=>void; onRemove?:()=>void; preview?: "sig";
  }) => {
    const isSig = preview==="sig";
    const w = isSig ? "240px" : isRound ? "100px" : "100px";
    const h = isSig ? "100px" : "100px";
    const radius = isRound ? "50%" : isSig ? "8px" : "12px";
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.75rem",width:"100%",maxWidth:isSig?"280px":"120px"}}>
        {/* Preview area */}
        <div style={{width:"100%",position:"relative"}}>
          <div onClick={onClick} style={{
            width:"100%",height:h,borderRadius:radius,overflow:"hidden",
            border: url ? `2.5px solid #F47B20` : "2.5px dashed #D4D4D4",
            background: isSig ? "#FAFAFA" : "#FFF7ED",
            cursor:"pointer",position:"relative",display:"flex",alignItems:"center",
            justifyContent:"center",transition:"all 0.2s",
            boxShadow: url ? "0 4px 16px rgba(244,123,32,0.15)" : "none",
          }}
            onMouseOver={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.boxShadow="0 6px 20px rgba(244,123,32,0.2)";}}
            onMouseOut={e=>{(e.currentTarget as HTMLElement).style.borderColor=url?"#F47B20":"#D4D4D4";(e.currentTarget as HTMLElement).style.boxShadow=url?"0 4px 16px rgba(244,123,32,0.15)":"none";}}>
            {upl ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.4rem"}}>
                <div style={{width:"22px",height:"22px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                <span style={{fontSize:"0.62rem",color:"#F47B20",fontWeight:600}}>Uploading...</span>
              </div>
            ) : url ? (
              <>
                {isSig ? (
                  /* Signature: white background, contain fit, clean doc look */
                  <div style={{width:"100%",height:"100%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:"8px"}}>
                    <img src={url} alt="Signature" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",display:"block",filter:"contrast(1.1)"}}/>
                  </div>
                ) : (
                  /* Logo / Profile: cover fit */
                  <img src={url} alt={label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                )}
                <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",color:"#fff",fontSize:"0.65rem",fontWeight:600,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s",gap:"0.25rem"}}
                  onMouseOver={e=>e.currentTarget.style.opacity="1"} onMouseOut={e=>e.currentTarget.style.opacity="0"}>
                  <span style={{fontSize:"1.1rem"}}>✏</span>
                  <span>Click to replace</span>
                </div>
              </>
            ) : (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.4rem",color:"#A3A3A3",padding:"0.5rem"}}>
                <span style={{fontSize:"1.75rem"}}>{isSig?"✍":isRound?"👤":"🖼"}</span>
                <span style={{fontSize:"0.65rem",fontWeight:600,textAlign:"center",color:"#A3A3A3",lineHeight:1.3}}>Click to upload</span>
              </div>
            )}
          </div>
          {/* Appears-in badge */}
          {url && (
            <div style={{position:"absolute",top:"-8px",right:"-8px",background:"#16A34A",color:"#fff",borderRadius:"50%",width:"20px",height:"20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",fontWeight:700,border:"2px solid #fff",boxShadow:"0 2px 6px rgba(0,0,0,0.15)"}}>✓</div>
          )}
        </div>

        {/* Labels */}
        <div style={{textAlign:"center",width:"100%"}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#1A1A1A",marginBottom:"0.15rem"}}>{label}</div>
          <div style={{fontSize:"0.65rem",color:"#A3A3A3",lineHeight:1.4}}>{sub}</div>
        </div>

        {/* Where it appears */}
        {url && (
          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.4rem 0.625rem",fontSize:"0.62rem",color:"#15803D",fontWeight:600,textAlign:"center",width:"100%"}}>
            {isSig?"Appears on all documents":"Active — click to replace"}
          </div>
        )}

        {url && onRemove && (
          <button onClick={e=>{e.stopPropagation();onRemove();}} style={{background:"none",border:"1px solid #FECACA",color:"#DC2626",borderRadius:"5px",padding:"0.3rem 0.75rem",fontSize:"0.68rem",cursor:"pointer",transition:"all 0.2s"}}
            onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background="#FEF2F2";}}
            onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background="none";}}>
            Remove
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="sp">
      <h2 className="sh">Settings</h2>

      {success && <div className="sb ok">✅ {success}<button onClick={()=>setSuccess("")} className="dm">✕</button></div>}
      {error   && <div className="sb er">❌ {error  }<button onClick={()=>setError("")}   className="dm">✕</button></div>}

      {/* hidden file inputs */}
      <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleLogoUpload(f);e.target.value="";}}/>
      <input ref={picRef}  type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handlePicUpload(f);e.target.value="";}}/>
      <input ref={sigRef}  type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleSigUpload(f);e.target.value="";}}/>

      <div className="sg">

        {/* ── Branding card ── */}
        <div className="sc wide">
          <h3 className="ct">BRANDING & IDENTITY</h3>
          <div style={{display:"flex",gap:"2rem",flexWrap:"wrap",alignItems:"flex-start",justifyContent:"center"}}>
            <UploadSlot label="Company Logo" sub="Official docs, invoices & receipts" url={dealer?.logo} isRound={false} uploading={logoUploading} onClick={()=>logoRef.current?.click()} onRemove={()=>{api.patch("/api/v1/dealers/me",{logo:null}).then(()=>{flash("Logo removed");loadDealer();});}}/>
            <UploadSlot label="Profile Picture" sub="Shows next to your name in chats & comments" url={dealer?.profilePicture} isRound={true} uploading={picUploading} onClick={()=>picRef.current?.click()} onRemove={()=>{api.patch("/api/v1/dealers/me",{profilePicture:null}).then(()=>{flash("Profile picture removed");loadDealer();});}}/>
            <UploadSlot label="Signature" sub="Auto-added to invoices, receipts & proformas" url={dealer?.signature} isRound={false} uploading={sigUploading} onClick={()=>sigRef.current?.click()} onRemove={()=>{api.patch("/api/v1/dealers/me",{signature:null}).then(()=>{flash("Signature removed");loadDealer();});}} preview="sig"/>
          </div>
          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.78rem",color:"#15803D",lineHeight:1.6}}>
            <strong>Logo</strong> = used on official documents (invoices, receipts, reports). &nbsp;
            <strong>Profile Picture</strong> = shown next to your name in messages, comments and search results — think of it like a personal/dealer face photo. &nbsp;
            <strong>Signature</strong> = automatically placed at the bottom of every receipt, invoice and proforma invoice you generate.
          </div>
        </div>

        {/* ── QR Code ── */}
        <div className="sc"><DealerQRCode /></div>

        {/* ── Dealership info ── */}
        <div className="sc wide">
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
            <h3 className="ct">DEALERSHIP INFORMATION</h3>
            {isApproved && <div className="ln">🔒 Company name locked after approval</div>}
          </div>

          {/* Locked fields */}
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"0.5rem"}}>
            {[{label:"Company Name",val:dealer?.companyName},{label:"Owner",val:dealer?.ownerName},{label:"Dealer ID",val:dealer?.dealerId,mono:true},{label:"Status",val:dealer?.status?.replace("_"," ")}].map(f=>(
              <div key={f.label} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.55rem 0.875rem",background:"#FAFAFA",borderRadius:"6px",border:"1px solid #F0F0F0"}}>
                <span style={{fontSize:"0.68rem",color:"#AAA",textTransform:"uppercase" as const,letterSpacing:"0.05em",minWidth:"100px"}}>{f.label}</span>
                <span style={{fontSize:"0.875rem",color:"#1A1A1A",flex:1,textTransform:"capitalize" as const,fontFamily:f.mono?"var(--font-mono)":undefined,overflowWrap:"anywhere" as const}}>{f.val}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSaveDealer} style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
            <div className="fr">
              <div className="fd"><label style={fl}>Phone</label><input className="fi" style={fi} value={dealerForm.phone} onChange={e=>setDealerForm({...dealerForm,phone:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
              <div className="fd"><label style={fl}>WhatsApp</label><input className="fi" style={fi} value={dealerForm.whatsapp} onChange={e=>setDealerForm({...dealerForm,whatsapp:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            </div>
            <div className="fr">
              <div className="fd"><label style={fl}>City</label><input style={fi} value={dealerForm.city} onChange={e=>setDealerForm({...dealerForm,city:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
              <div className="fd"><label style={fl}>State</label><input style={fi} value={dealerForm.state} onChange={e=>setDealerForm({...dealerForm,state:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            </div>
            <div className="fd"><label style={fl}>Street Address</label><input style={fi} placeholder="e.g. 12 Adeola Odeku Street, Victoria Island" value={dealerForm.address} onChange={e=>setDealerForm({...dealerForm,address:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            <div className="fd"><label style={fl}>Description</label><textarea style={{...fi,minHeight:"80px",resize:"vertical" as const}} rows={3} value={dealerForm.description} onChange={e=>setDealerForm({...dealerForm,description:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>

            {/* Location section */}
            <div style={{background:"#F0F9FF",border:"1.5px solid #BAE6FD",borderRadius:"10px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#0369A1"}}>📍 Dealership Location</div>
                  <div style={{fontSize:"0.7rem",color:"#64748B",marginTop:"0.2rem"}}>Pin your exact location so customers can find you on the map. Shown on your public profile.</div>
                </div>
                <button type="button" onClick={handleGPS} disabled={locLoading}
                  style={{background:locLoading?"#E2E8F0":"#0EA5E9",color:locLoading?"#94A3B8":"#fff",border:"none",borderRadius:"8px",padding:"0.625rem 1.1rem",fontSize:"0.82rem",cursor:locLoading?"not-allowed":"pointer",fontFamily:"var(--font-display)",letterSpacing:"0.06em",whiteSpace:"nowrap",transition:"background 0.2s"}}>
                  {locLoading ? "Getting location…" : "📍 Use My GPS Location"}
                </button>
              </div>
              {dealerForm.locationLat && dealerForm.locationLng && (
                <div style={{background:"#fff",border:"1px solid #BAE6FD",borderRadius:"8px",padding:"0.75rem 1rem",display:"flex",alignItems:"flex-start",gap:"0.625rem"}}>
                  <span style={{fontSize:"1rem",flexShrink:0}}>{dealerForm.locationSource==="gps"?"🛰":"✏️"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"0.72rem",fontWeight:600,color:"#0369A1",textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{dealerForm.locationSource==="gps"?"GPS Pinned Location":"Manual Coordinates"}</div>
                    <div style={{fontSize:"0.78rem",color:"#1A1A1A",marginTop:"0.2rem",wordBreak:"break-all" as const}}>{dealerForm.locationLabel || `${dealerForm.locationLat}, ${dealerForm.locationLng}`}</div>
                    <div style={{fontSize:"0.68rem",color:"#64748B",fontFamily:"monospace",marginTop:"0.1rem"}}>Lat: {parseFloat(dealerForm.locationLat).toFixed(5)} · Lng: {parseFloat(dealerForm.locationLng).toFixed(5)}</div>
                  </div>
                  <button type="button" onClick={()=>setDealerForm(f=>({...f,locationLat:"",locationLng:"",locationLabel:"",locationSource:"manual"}))}
                    style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",fontSize:"0.8rem",flexShrink:0}}>✕ Clear</button>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
                <div className="fd"><label style={{...fl,color:"#0369A1"}}>Latitude (optional, manual)</label><input style={fi} type="number" step="any" placeholder="e.g. 6.52438" value={dealerForm.locationLat} onChange={e=>setDealerForm({...dealerForm,locationLat:e.target.value,locationSource:"manual"})} onFocus={e=>e.target.style.borderColor="#0EA5E9"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
                <div className="fd"><label style={{...fl,color:"#0369A1"}}>Longitude (optional, manual)</label><input style={fi} type="number" step="any" placeholder="e.g. 3.37921" value={dealerForm.locationLng} onChange={e=>setDealerForm({...dealerForm,locationLng:e.target.value,locationSource:"manual"})} onFocus={e=>e.target.style.borderColor="#0EA5E9"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
              </div>
              <div className="fd"><label style={{...fl,color:"#0369A1"}}>Location Label (shown on profile)</label><input style={fi} placeholder="e.g. 12 Adeola Odeku Street, Victoria Island, Lagos" value={dealerForm.locationLabel} onChange={e=>setDealerForm({...dealerForm,locationLabel:e.target.value})} onFocus={e=>e.target.style.borderColor="#0EA5E9"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            </div>

            {/* Socials */}
            <div style={{fontSize:"0.68rem",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#AAA",padding:"0.5rem 0",borderTop:"1px solid #E5E5E5",borderBottom:"1px solid #E5E5E5",textAlign:"center" as const,margin:"0.25rem 0"}}>SOCIAL MEDIA & LINKS — shown on your public profile</div>
            <div className="fr">
              <div className="fd"><label style={fl}>Instagram</label><input style={fi} placeholder="https://instagram.com/yourpage" value={dealerForm.instagram} onChange={e=>setDealerForm({...dealerForm,instagram:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
              <div className="fd"><label style={fl}>Twitter / X</label><input style={fi} placeholder="https://twitter.com/yourpage" value={dealerForm.twitter} onChange={e=>setDealerForm({...dealerForm,twitter:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            </div>
            <div className="fr">
              <div className="fd"><label style={fl}>Facebook</label><input style={fi} placeholder="https://facebook.com/yourpage" value={dealerForm.facebook} onChange={e=>setDealerForm({...dealerForm,facebook:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
              <div className="fd"><label style={fl}>TikTok</label><input style={fi} placeholder="https://tiktok.com/@yourpage" value={dealerForm.tiktok} onChange={e=>setDealerForm({...dealerForm,tiktok:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            </div>
            <div className="fr">
              <div className="fd"><label style={fl}>YouTube</label><input style={fi} placeholder="https://youtube.com/yourchannel" value={dealerForm.youtube} onChange={e=>setDealerForm({...dealerForm,youtube:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
              <div className="fd"><label style={fl}>Website</label><input style={fi} placeholder="https://yourwebsite.com" value={dealerForm.website} onChange={e=>setDealerForm({...dealerForm,website:e.target.value})} onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            </div>

            <button type="submit" className="save-btn" disabled={saving}>{saving?"Saving…":"Save All Changes"}</button>
          </form>
        </div>

        {/* ── Password ── */}
        <div className="sc">
          <h3 className="ct">CHANGE PASSWORD</h3>
          <form onSubmit={handleChangePassword} style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
            <div className="fd"><label style={fl}>Current Password</label><input type="password" style={fi} value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} required onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            <div className="fd"><label style={fl}>New Password</label><input type="password" style={fi} value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} required onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            <div className="fd"><label style={fl}>Confirm New Password</label><input type="password" style={fi} value={pwForm.confirmPassword} onChange={e=>setPwForm({...pwForm,confirmPassword:e.target.value})} required onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#DDD"}/></div>
            <button type="submit" className="save-btn" disabled={pwSaving}>{pwSaving?"Changing…":"Change Password"}</button>
          </form>
        </div>

        {/* ── Account info ── */}
        <div className="sc">
          <h3 className="ct">ACCOUNT INFORMATION</h3>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {[["Email",user?.email],["Role","Dealer Admin"],["User ID",user?.userId]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 0",borderBottom:"1px solid #F0F0F0"}}>
                <span style={{fontSize:"0.78rem",color:"#888"}}>{l}</span>
                <span style={{fontSize:"0.78rem",color:"#1A1A1A",fontFamily:l==="User ID"?"var(--font-mono)":undefined,overflow:"hidden",textOverflow:"ellipsis",maxWidth:"60%",textAlign:"right" as const}}>{v}</span>
              </div>
            ))}
          </div>
          <div className="ln" style={{marginTop:"0.75rem"}}>To change email or company name, contact <strong>support@carstrims.com</strong></div>
        </div>

      </div>

      <style>{`
        .sp{display:flex;flex-direction:column;gap:1.5rem;font-family:var(--font-body)}
        .sh{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A}
        .sb{padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
        .sb.ok{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A}
        .sb.er{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626}
        .dm{background:none;border:none;color:inherit;cursor:pointer;font-size:1rem;flex-shrink:0}
        .sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem}
        .sc{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;padding:1.5rem;display:flex;flex-direction:column;gap:1.1rem}
        .sc.wide{grid-column:1/-1}
        .ct{font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.15em;color:#888;margin:0}
        .ln{font-size:0.75rem;color:#F47B20;background:#FFF7ED;border:1px solid rgba(244,123,32,0.4);border-radius:5px;padding:0.35rem 0.75rem;line-height:1.5}
        .fr{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .fd{display:flex;flex-direction:column;gap:0.4rem}
        .save-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.8rem 1.5rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;align-self:flex-start;transition:background 0.2s;margin-top:0.25rem}
        .save-btn:hover{background:#FF9340}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed}
        @media(max-width:640px){.fr{grid-template-columns:1fr}.sg{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}

