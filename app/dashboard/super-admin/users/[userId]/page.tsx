"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [lightbox, setLightbox] = useState<string|null>(null);
  const [restrictField, setRestrictField] = useState("");
  const [restrictReason, setRestrictReason] = useState("");

  const load = async () => {
    try {
      const r = await api.get(`/api/v1/admin/users/${userId}/profile`);
      setProfile(r.data);
      setForm(r.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/v1/admin/users/${userId}/profile`, form);
      setMsg("Profile updated ✅"); setEditing(false); load();
    } catch(e:any) { setMsg("Update failed: " + (e.response?.data?.detail||"Error")); }
    finally { setSaving(false); }
  };

  const restrictProfileField = async () => {
    if (!restrictField) return;
    try {
      await api.post(`/api/v1/admin/users/${userId}/restrict-profile-field`, { field:restrictField, reason:restrictReason });
      setMsg(`Field '${restrictField}' restricted and user notified ✅`);
      setRestrictField(""); setRestrictReason("");
    } catch(e:any) { setMsg("Failed: " + (e.response?.data?.detail||"Error")); }
  };

  const fi: React.CSSProperties = {background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.65rem 0.875rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",boxSizing:"border-box" as const,transition:"border-color 0.2s"};
  const lbl: React.CSSProperties = {fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.3rem"};

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"300px"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!profile) return <div style={{padding:"2rem",color:"#737373"}}>User not found. <button onClick={()=>router.back()} style={{color:"#F47B20",background:"none",border:"none",cursor:"pointer"}}>← Go back</button></div>;

  const ROLE_COLORS: Record<string,string> = {SYSTEM_ADMIN:"#DC2626",DEALER_ADMIN:"#F47B20",DEALER_STAFF:"#D97706",PARTNER_USER:"#7B68EE",PUBLIC_USER:"#16A34A"};
  const rc = ROLE_COLORS[profile.role]||"#737373";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <img src={lightbox} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"88vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"12px"}}/>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>✕</button>
        </div>
      )}

      {/* Topbar */}
      <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#737373",cursor:"pointer",fontSize:"0.875rem",fontWeight:600}}>← Back</button>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1,flex:1}}>User Profile — Admin View</h2>
        <div style={{display:"flex",gap:"0.5rem"}}>
          {editing ? (
            <>
              <button onClick={()=>{setEditing(false);setForm(profile);}} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.825rem",cursor:"pointer"}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 1.25rem",fontSize:"0.825rem",cursor:"pointer",fontFamily:"var(--font-display)",letterSpacing:"0.08em",opacity:saving?0.6:1}}>
                {saving?"Saving...":"Save Changes"}
              </button>
            </>
          ) : (
            <button onClick={()=>setEditing(true)} style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 1.25rem",fontSize:"0.825rem",cursor:"pointer",fontFamily:"var(--font-display)",letterSpacing:"0.08em"}}>
              ✏️ Edit Profile
            </button>
          )}
          <Link href={`/users/${userId}`} target="_blank"
            style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.825rem",textDecoration:"none",fontWeight:600}}>
            View Public Profile ↗
          </Link>
        </div>
      </div>

      {msg && <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between"}}><span>{msg}</span><button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button></div>}

      {/* Profile header */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",gap:"1.25rem",alignItems:"flex-start",flexWrap:"wrap"}}>
        <div onClick={()=>(profile.avatar||profile.profilePicture)&&setLightbox(profile.avatar||profile.profilePicture)}
          style={{width:"80px",height:"80px",borderRadius:"50%",overflow:"hidden",border:`3px solid ${rc}`,background:"#FFF7ED",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"2rem",color:rc,flexShrink:0,cursor:(profile.avatar||profile.profilePicture)?"zoom-in":"default"}}>
          {(profile.avatar||profile.profilePicture)
            ? <img src={profile.avatar||profile.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span>{profile.fullName?.charAt(0)||"?"}</span>
          }
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",color:"#1A1A1A",lineHeight:1}}>{profile.fullName}</div>
          <div style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{profile.email}</div>
          <div style={{display:"flex",gap:"0.5rem",marginTop:"0.625rem",flexWrap:"wrap"}}>
            <span style={{background:`${rc}15`,color:rc,border:`1.5px solid ${rc}40`,borderRadius:"20px",padding:"0.2rem 0.75rem",fontSize:"0.72rem",fontWeight:700}}>{profile.role?.replace(/_/g," ")}</span>
            <span style={{background:profile.status==="active"?"#F0FDF4":"#FEF2F2",color:profile.status==="active"?"#16A34A":"#DC2626",border:"1px solid",borderColor:profile.status==="active"?"#86EFAC":"#FCA5A5",borderRadius:"20px",padding:"0.2rem 0.75rem",fontSize:"0.72rem",fontWeight:600,textTransform:"capitalize" as const}}>
              {profile.status||"active"}
            </span>
            {profile.city&&<span style={{fontSize:"0.72rem",color:"#737373",background:"#F5F5F5",padding:"0.2rem 0.5rem",borderRadius:"4px"}}>📍 {profile.city}, {profile.state}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:"0.5rem",flexShrink:0,flexWrap:"wrap"}}>
          {profile.phone&&<a href={`tel:${profile.phone}`} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",color:"#1A1A1A",textDecoration:"none"}}>📞</a>}
          {profile.email&&<a href={`mailto:${profile.email}`} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",color:"#1A1A1A",textDecoration:"none"}}>✉</a>}
          {(profile.whatsapp||profile.phone)&&<a href={`https://wa.me/${(profile.whatsapp||profile.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",color:"#15803D",textDecoration:"none"}}>💬</a>}
        </div>
      </div>

      {/* Editable fields */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
        <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#737373"}}>Profile Details {editing&&<span style={{color:"#F47B20"}}>(Editing)</span>}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0.875rem"}}>
          {[
            {key:"fullName",label:"Full Name"},{key:"username",label:"Username"},{key:"phone",label:"Phone"},
            {key:"whatsapp",label:"WhatsApp"},{key:"city",label:"City"},{key:"state",label:"State"},
            {key:"bio",label:"Bio"},{key:"instagram",label:"Instagram"},{key:"twitter",label:"Twitter"},
            {key:"facebook",label:"Facebook"},{key:"tiktok",label:"TikTok"},{key:"website",label:"Website"},
          ].map(f=>(
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              {editing
                ? <input style={fi} value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
                : <div style={{fontSize:"0.875rem",color:profile[f.key]?"#1A1A1A":"#A3A3A3",padding:"0.625rem 0"}}>{profile[f.key]||"—"}</div>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Dealer profile if dealer */}
      {profile.dealer && (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#737373"}}>Dealer Profile</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"0.75rem"}}>
            {[
              ["Company",profile.dealer.companyName],["Dealer ID",profile.dealer.dealerId],
              ["Status",profile.dealer.status],["City",profile.dealer.city],
              ["State",profile.dealer.state],["Description",profile.dealer.description],
            ].map(([l,v])=>(
              <div key={l} style={{background:"#F5F5F5",borderRadius:"6px",padding:"0.625rem 0.875rem"}}>
                <div style={{fontSize:"0.62rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.2rem"}}>{l}</div>
                <div style={{fontSize:"0.8rem",color:"#1A1A1A"}}>{v||"—"}</div>
              </div>
            ))}
          </div>
          <Link href={`/dashboard/super-admin/dealers`} style={{fontSize:"0.78rem",color:"#F47B20",textDecoration:"none",fontWeight:600}}>
            View Full Dealer Profile & Setup Docs →
          </Link>
        </div>
      )}

      {/* Admin tools */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
        <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#737373"}}>Admin Tools — Restrict Public Profile Fields</div>
        <p style={{fontSize:"0.8rem",color:"#525252",lineHeight:1.5}}>Restrict a field on this user's public profile. They will be notified and asked to update it before it shows again.</p>
        <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",flex:1,minWidth:"140px"}}>
            <label style={lbl}>Field to Restrict</label>
            <select style={{...fi,cursor:"pointer"}} value={restrictField} onChange={e=>setRestrictField(e.target.value)}>
              <option value="">Select a field...</option>
              {["bio","phone","whatsapp","instagram","twitter","tiktok","facebook","website"].map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",flex:2,minWidth:"200px"}}>
            <label style={lbl}>Reason / Warning Message</label>
            <input style={fi} placeholder="e.g. Inappropriate content" value={restrictReason} onChange={e=>setRestrictReason(e.target.value)} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
          </div>
          <button onClick={restrictProfileField} disabled={!restrictField}
            style={{background:restrictField?"#DC2626":"#D4D4D4",color:"#fff",border:"none",borderRadius:"8px",padding:"0.65rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.8rem",cursor:restrictField?"pointer":"not-allowed",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>
            ⛔ Restrict Field
          </button>
        </div>
      </div>
    </div>
  );
}
