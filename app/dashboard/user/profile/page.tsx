import NotificationSettings from "@/components/ui/NotificationSettings";
"use client";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

export default function UserProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");
  const [activeTab, setActiveTab] = useState<"personal"|"social"|"security"|"account">("personal");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName:"", phone:"", whatsapp:"", city:"", state:"", address:"", bio:"",
    instagram:"", facebook:"", twitter:"", tiktok:"", website:"",
  });
  const [pw, setPw] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });

  const load = async () => {
    try {
      const res = await api.get("/api/v1/users/me");
      setProfile(res.data);
      setForm({
        fullName: res.data.fullName||"",
        phone: res.data.phone||"",
        whatsapp: res.data.whatsapp||"",
        city: res.data.city||"",
        state: res.data.state||"",
        address: res.data.address||"",
        bio: res.data.bio||"",
        instagram: res.data.instagram||"",
        facebook: res.data.facebook||"",
        twitter: res.data.twitter||"",
        tiktok: res.data.tiktok||"",
        website: res.data.website||"",
      });
    } catch(e) {
      // fallback to /api/v1/auth/me
      try {
        const res2 = await api.get("/api/v1/auth/me");
        setProfile(res2.data);
        setForm(f => ({...f, fullName:res2.data.fullName||"", phone:res2.data.phone||""}));
      } catch {}
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string, type:"ok"|"err") => {
    if(type==="ok") { setSuccess(msg); setTimeout(()=>setSuccess(""),4000); }
    else { setError(msg); setTimeout(()=>setError(""),5000); }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.patch("/api/v1/users/me", form);
      flash("Profile updated successfully!","ok"); load();
    } catch(err:any) { flash(err.response?.data?.detail||"Failed to save","err"); }
    finally { setSaving(false); }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if(pw.newPassword!==pw.confirmPassword) { flash("Passwords do not match","err"); return; }
    if(pw.newPassword.length<8) { flash("Minimum 8 characters","err"); return; }
    setPwSaving(true);
    try {
      await api.post("/api/v1/auth/change-password",{ currentPassword:pw.currentPassword, newPassword:pw.newPassword });
      flash("Password changed successfully!","ok");
      setPw({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch(err:any) { flash(err.response?.data?.detail||"Failed","err"); }
    finally { setPwSaving(false); }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append("file",file);
    try {
      await api.post("/api/v1/upload/avatar", fd, { headers:{"Content-Type":"multipart/form-data"} });
      flash("Profile photo updated!","ok"); load();
    } catch(err:any) { flash(err.response?.data?.detail||"Upload failed","err"); }
    finally { setUploading(false); }
  };

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"260px"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      {activeTab===("notifications" as any) && (
  <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.5rem"}}>NOTIFICATIONS & LOCATION</div>
    <NotificationSettings/>
  </div>
)}
<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const fi: React.CSSProperties = { background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.75rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", width:"100%", boxSizing:"border-box" as const, transition:"border-color 0.2s" };
  const fl: React.CSSProperties = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#737373", display:"block", marginBottom:"0.35rem" };

  const TABS: {key: "personal"|"social"|"security"|"account"; label:string; icon:string}[] = [
    {key:"personal",  label:"Personal",  icon:"👤"},
    {key:"social",    label:"Social",    icon:"🔗"},
    {key:"security",  label:"Security",  icon:"🔒"},
    {key:"account", label:"Account", icon:"ℹ️"},{key:"notifications" as any, label:"Notifications", icon:"🔔"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>

      {/* Profile header card */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",alignItems:"center",gap:"1.25rem",flexWrap:"wrap"}}>
        <div style={{position:"relative",cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
          <div style={{width:"84px",height:"84px",borderRadius:"50%",overflow:"hidden",border:"3px solid #F47B20",background:"#FFF7ED",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {uploading ? (
              <div style={{width:"28px",height:"28px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            ) : profile?.profilePicture||profile?.avatar ? (
              <img src={profile.profilePicture||profile.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            ) : (
              <span style={{fontFamily:"var(--font-display)",fontSize:"2rem",color:"#F47B20"}}>{(profile?.fullName||user?.fullName||"U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s",color:"#fff",fontSize:"0.6rem",fontWeight:600}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity="1"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="0"}>
            CHANGE
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)uploadAvatar(f);e.target.value="";}}/>
        <div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",color:"#1A1A1A",lineHeight:1}}>{profile?.fullName||"Your Name"}</div>
          <div style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{user?.email}</div>
          <div style={{display:"flex",gap:"0.5rem",marginTop:"0.625rem",flexWrap:"wrap"}}>
            <span style={{background:"#DCFCE7",color:"#166534",borderRadius:"20px",padding:"0.2rem 0.75rem",fontSize:"0.72rem",fontWeight:600}}>✓ Verified Buyer</span>
            {profile?.city&&profile?.state&&<span style={{background:"#F5F5F5",color:"#737373",borderRadius:"20px",padding:"0.2rem 0.75rem",fontSize:"0.72rem"}}>📍 {profile.city}, {profile.state}</span>}
            <span style={{background:"#F5F5F5",color:"#A3A3A3",borderRadius:"20px",padding:"0.2rem 0.75rem",fontSize:"0.65rem",fontFamily:"monospace"}}>{user?.userId?.slice(-10)}</span>
          </div>
        </div>
        <button onClick={()=>fileRef.current?.click()} style={{marginLeft:"auto",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.55rem 1rem",fontSize:"0.8rem",cursor:"pointer",color:"#525252",fontFamily:"var(--font-body)"}}>
          📷 Change Photo
        </button>
      </div>

      {/* Banners */}
      {success&&<div style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>✅ {success}<button onClick={()=>setSuccess("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button></div>}
      {error&&<div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>❌ {error}<button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button></div>}

      {/* Tab bar */}
      <div style={{display:"flex",gap:"0.25rem",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"0.375rem",flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            style={{flex:1,minWidth:"80px",padding:"0.625rem 0.5rem",background:activeTab===t.key?"#F47B20":"transparent",color:activeTab===t.key?"#fff":"#737373",border:"none",borderRadius:"7px",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:"0.78rem",fontWeight:activeTab===t.key?600:400,transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.375rem"}}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem"}}>

        {activeTab==="personal" && (
          <form onSubmit={saveProfile} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>PERSONAL INFORMATION</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div><label style={fl}>Full Name</label><input style={fi} value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></div>
              <div><label style={fl}>Phone Number</label><input style={fi} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+234..."/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div><label style={fl}>WhatsApp</label><input style={fi} value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="+234..."/></div>
              <div><label style={fl}>Address</label><input style={fi} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div><label style={fl}>City</label><input style={fi} value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
              <div>
                <label style={fl}>State</label>
                <select style={{...fi,cursor:"pointer"}} value={form.state} onChange={e=>setForm({...form,state:e.target.value})}>
                  <option value="">Select state...</option>
                  {NIGERIAN_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label style={fl}>Bio / About Me</label><textarea style={{...fi,minHeight:"90px",resize:"vertical" as const}} rows={3} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Tell us a bit about yourself..."/></div>
            <button type="submit" disabled={saving} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem 2rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",alignSelf:"flex-start",opacity:saving?0.6:1}}>
              {saving?"Saving...":"Save Changes"}
            </button>
          </form>
        )}

        {activeTab==="social" && (
          <form onSubmit={saveProfile} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>SOCIAL MEDIA LINKS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div><label style={fl}>Instagram</label><input style={fi} value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} placeholder="https://instagram.com/..."/></div>
              <div><label style={fl}>Facebook</label><input style={fi} value={form.facebook} onChange={e=>setForm({...form,facebook:e.target.value})} placeholder="https://facebook.com/..."/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div><label style={fl}>Twitter / X</label><input style={fi} value={form.twitter} onChange={e=>setForm({...form,twitter:e.target.value})} placeholder="https://twitter.com/..."/></div>
              <div><label style={fl}>TikTok</label><input style={fi} value={form.tiktok} onChange={e=>setForm({...form,tiktok:e.target.value})} placeholder="https://tiktok.com/@..."/></div>
            </div>
            <div><label style={fl}>Website</label><input style={fi} value={form.website} onChange={e=>setForm({...form,website:e.target.value})} placeholder="https://yourwebsite.com"/></div>
            <button type="submit" disabled={saving} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem 2rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",alignSelf:"flex-start",opacity:saving?0.6:1}}>
              {saving?"Saving...":"Save Social Links"}
            </button>
          </form>
        )}

        {activeTab==="security" && (
          <form onSubmit={changePw} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>CHANGE PASSWORD</div>
            <div><label style={fl}>Current Password</label><input type="password" style={fi} value={pw.currentPassword} onChange={e=>setPw({...pw,currentPassword:e.target.value})} required/></div>
            <div><label style={fl}>New Password</label><input type="password" style={fi} value={pw.newPassword} onChange={e=>setPw({...pw,newPassword:e.target.value})} required/></div>
            <div><label style={fl}>Confirm New Password</label><input type="password" style={fi} value={pw.confirmPassword} onChange={e=>setPw({...pw,confirmPassword:e.target.value})} required/></div>
            <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.8rem",color:"#1D4ED8",lineHeight:1.5}}>
              🔐 Use at least 8 characters with a mix of letters, numbers and symbols.
            </div>
            <button type="submit" disabled={pwSaving} style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem 2rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",alignSelf:"flex-start",opacity:pwSaving?0.6:1}}>
              {pwSaving?"Changing...":"Change Password"}
            </button>
          </form>
        )}

        {activeTab==="notifications" && (
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>ACCOUNT INFORMATION</div>
            {[
              {label:"Email Address",   value:user?.email||profile?.email||"—"},
              {label:"Account Role",    value:"Buyer / Customer"},
              {label:"User ID",         value:user?.userId||profile?._id||"—", mono:true},
              {label:"Member Since",    value:profile?.createdAt?new Date(profile.createdAt).toLocaleDateString("en-NG",{year:"numeric",month:"long",day:"numeric"}):"—"},
              {label:"Account Status",  value:profile?.status||"active"},
            ].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem 0",borderBottom:"1px solid #F0F0F0"}}>
                <span style={{fontSize:"0.8rem",color:"#737373"}}>{row.label}</span>
                <span style={{fontSize:"0.825rem",color:"#1A1A1A",fontFamily:row.mono?"monospace":"var(--font-body)",textTransform:"capitalize" as const}}>{row.value}</span>
              </div>
            ))}
            <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.8rem",color:"#C4621A",lineHeight:1.6,marginTop:"0.5rem"}}>
              To change your email address, contact <strong>support@carstrims.com</strong>
            </div>
          </div>
        )}
      </div>

      {activeTab===("notifications" as any) && (
  <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.5rem"}}>NOTIFICATIONS & LOCATION</div>
    <NotificationSettings/>
  </div>
)}
<style>{`
        input:focus,select:focus,textarea:focus{border-color:#F47B20!important;background:#fff!important}
        @media(max-width:640px){
          div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}

