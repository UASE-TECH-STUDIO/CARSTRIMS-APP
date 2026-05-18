"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function PublicUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: me, isAuthenticated } = useAuthStore();
  const userId = params?.userId as string;
  const [profile, setProfile]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [lightbox, setLightbox]   = useState(false);
  const [startMsg, setStartMsg]   = useState(false);

  useEffect(() => {
    if (!userId) return;
    api.get(`/api/v1/public/users/${userId}`)
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleMessage = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (me?.userId === userId) return;
    setStartMsg(true);
    try {
      const r = await api.post("/api/v1/messages/start", { receiverId: userId, message: "Hi!" });
      const convId = r.data?.conversationId;
      const paths: Record<string, string> = {
        DEALER_ADMIN: "/dashboard/dealer/messages",
        DEALER_STAFF: "/dashboard/staff/messages",
        PARTNER_USER: "/dashboard/partner/messages",
        SYSTEM_ADMIN: "/dashboard/super-admin/messages",
      };
      const base = paths[me?.role || ""] || "/dashboard/user/messages";
      router.push(convId ? `${base}?conv=${convId}` : base);
    } catch (e: any) { alert(e.response?.data?.detail || "Could not start chat"); }
    finally { setStartMsg(false); }
  };

  const ROLE_LABEL: Record<string,string> = {
    DEALER_ADMIN:"Dealer", DEALER_STAFF:"Dealer Staff",
    PARTNER_USER:"Partner", SYSTEM_ADMIN:"Admin", PUBLIC_USER:"Buyer",
  };
  const ROLE_COLOR: Record<string,string> = {
    DEALER_ADMIN:"#F47B20", DEALER_STAFF:"#D97706",
    PARTNER_USER:"#7B68EE", SYSTEM_ADMIN:"#DC2626", PUBLIC_USER:"#16A34A",
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5",flexDirection:"column",gap:"1rem"}}>
      <img src="/logo.png" alt="CARSTRIMS" style={{height:"28px",objectFit:"contain"}}/>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!profile) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"2rem",textAlign:"center"}}>
      <div style={{fontSize:"3rem"}}>👤</div>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Profile not found</h2>
      <button onClick={()=>router.back()} style={{background:"#F47B20",color:"#fff",border:"none",padding:"0.75rem 1.5rem",borderRadius:"8px",cursor:"pointer",fontFamily:"var(--font-display)"}}>← Go Back</button>
    </div>
  );

  const role = profile.role || "PUBLIC_USER";
  const rc   = ROLE_COLOR[role] || "#737373";
  const isSelf = me?.userId === userId || me?.userId === profile.userId;

  const socials = [
    profile.instagram && { label:"Instagram", url: profile.instagram.startsWith("http") ? profile.instagram : `https://instagram.com/${profile.instagram.replace("@","")}` },
    profile.facebook  && { label:"Facebook",  url: profile.facebook.startsWith("http")  ? profile.facebook  : `https://facebook.com/${profile.facebook}` },
    profile.twitter   && { label:"Twitter/X", url: profile.twitter.startsWith("http")   ? profile.twitter   : `https://twitter.com/${profile.twitter.replace("@","")}` },
    profile.tiktok    && { label:"TikTok",    url: profile.tiktok.startsWith("http")    ? profile.tiktok    : `https://tiktok.com/@${profile.tiktok.replace("@","")}` },
    profile.website   && { label:"Website",   url: profile.website },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>
      {/* Avatar lightbox */}
      {lightbox && (profile.avatar || profile.profilePicture) && (
        <div onClick={()=>setLightbox(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setLightbox(false)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>✕</button>
          <img src={profile.avatar||profile.profilePicture} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"88vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"12px"}}/>
        </div>
      )}

      {/* Topbar */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1.5rem",background:"#fff",borderBottom:"1.5px solid #E5E5E5",position:"sticky",top:0,zIndex:50}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#525252",fontSize:"0.95rem",cursor:"pointer",fontWeight:600,fontFamily:"var(--font-body)"}}>← Back</button>
        <Link href="/feed"><img src="/logo.png" alt="CARSTRIMS" style={{height:"26px",objectFit:"contain"}}/></Link>
        {!isSelf && isAuthenticated ? (
          <button onClick={handleMessage} disabled={startMsg}
            style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 1rem",fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.08em",cursor:"pointer",opacity:startMsg?0.6:1,transition:"background 0.2s"}}
            onMouseOver={e=>(e.currentTarget.style.background="#F47B20")}
            onMouseOut={e=>(e.currentTarget.style.background="#1A1A1A")}>
            {startMsg?"...":"💬 Message"}
          </button>
        ) : <div style={{width:"80px"}}/>}
      </header>

      {/* Hero */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5"}}>
        <div style={{height:"120px",background:`linear-gradient(135deg,#1A1A1A 0%,#2D1A0A 60%,${rc} 100%)`}}/>
        <div style={{display:"flex",alignItems:"flex-end",gap:"1.25rem",padding:"0 1.5rem 1.5rem",marginTop:"-56px",flexWrap:"wrap",maxWidth:"820px",margin:"-56px auto 0"}}>
          <div style={{position:"relative",flex:"none"}}>
            <div
              onClick={()=>(profile.avatar||profile.profilePicture)&&setLightbox(true)}
              style={{width:"110px",height:"110px",borderRadius:"50%",overflow:"hidden",border:"5px solid #fff",background:"#FFF7ED",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"2.5rem",color:rc,cursor:(profile.avatar||profile.profilePicture)?"zoom-in":"default",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",flexShrink:0}}>
              {(profile.avatar||profile.profilePicture)
                ? <img src={profile.avatar||profile.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span>{profile.fullName?.charAt(0)||"?"}</span>
              }
            </div>
            {(profile.avatar||profile.profilePicture) && (
              <div style={{position:"absolute",bottom:"4px",right:"4px",background:"rgba(0,0,0,0.5)",color:"#fff",borderRadius:"50%",width:"22px",height:"22px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",cursor:"pointer"}} onClick={()=>setLightbox(true)}>🔍</div>
            )}
          </div>
          <div style={{paddingTop:"1rem",display:"flex",flexDirection:"column",gap:"0.35rem",flex:1,minWidth:0}}>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.4rem,4vw,2rem)",letterSpacing:"0.03em",color:"#1A1A1A",lineHeight:1,margin:0}}>{profile.fullName}</h1>
            <div style={{display:"inline-flex",alignItems:"center",padding:"0.25rem 0.75rem",borderRadius:"20px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.08em",background:`${rc}18`,color:rc,border:`1.5px solid ${rc}40`,width:"fit-content"}}>
              {ROLE_LABEL[role]||role}
            </div>
            {(profile.city||profile.state) && <div style={{fontSize:"0.875rem",color:"#737373"}}>📍 {[profile.city,profile.state].filter(Boolean).join(", ")}</div>}
            {profile.bio && <p style={{fontSize:"0.875rem",color:"#525252",lineHeight:1.65,maxWidth:"480px",margin:0}}>{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{maxWidth:"820px",margin:"0 auto",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
        {/* Message button (mobile) */}
        {!isSelf && isAuthenticated && (
          <button onClick={handleMessage} disabled={startMsg}
            style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"12px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.1em",cursor:"pointer",opacity:startMsg?0.6:1,width:"100%",transition:"background 0.2s"}}
            onMouseOver={e=>(e.currentTarget.style.background="#F47B20")}
            onMouseOut={e=>(e.currentTarget.style.background="#1A1A1A")}>
            {startMsg?"Opening chat...":"💬 Message " + (profile.fullName?.split(" ")[0]||"User")}
          </button>
        )}
        {!isSelf && !isAuthenticated && (
          <Link href="/login" style={{background:"#F47B20",color:"#fff",borderRadius:"12px",padding:"1rem",display:"block",textAlign:"center",textDecoration:"none",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.1em"}}>
            Sign in to Message
          </Link>
        )}

        {/* Contact */}
        {(profile.phone||profile.whatsapp||profile.email) && (
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",overflow:"hidden"}}>
            <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#A3A3A3",padding:"0.875rem 1.25rem",borderBottom:"1px solid #E5E5E5",background:"#FAFAFA"}}>Contact</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",padding:"1.25rem"}}>
              {profile.phone    && <a href={`tel:${profile.phone}`} style={{textDecoration:"none",padding:"0.875rem 1rem",borderRadius:"10px",fontSize:"0.95rem",display:"flex",alignItems:"center",gap:"0.625rem",background:"#EFF6FF",color:"#3B8BD4",border:"1.5px solid rgba(59,139,212,0.25)",fontWeight:600}}>📞 {profile.phone}</a>}
              {profile.whatsapp && <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{textDecoration:"none",padding:"0.875rem 1rem",borderRadius:"10px",fontSize:"0.95rem",display:"flex",alignItems:"center",gap:"0.625rem",background:"#F0FDF4",color:"#16A34A",border:"1.5px solid rgba(22,163,74,0.25)",fontWeight:600}}>💬 WhatsApp</a>}
              {profile.email    && <a href={`mailto:${profile.email}`} style={{textDecoration:"none",padding:"0.875rem 1rem",borderRadius:"10px",fontSize:"0.95rem",display:"flex",alignItems:"center",gap:"0.625rem",background:"#FFF7ED",color:"#F47B20",border:"1.5px solid rgba(244,123,32,0.25)",fontWeight:600}}>✉ {profile.email}</a>}
            </div>
          </div>
        )}

        {/* Socials */}
        {socials.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",overflow:"hidden"}}>
            <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#A3A3A3",padding:"0.875rem 1.25rem",borderBottom:"1px solid #E5E5E5",background:"#FAFAFA"}}>Social & Web</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.625rem",padding:"1.25rem"}}>
              {socials.map(s=>(
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
                  style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#404040",borderRadius:"8px",padding:"0.6rem 1rem",fontSize:"0.875rem",textDecoration:"none",fontWeight:600,transition:"all 0.15s"}}
                  onMouseOver={e=>{e.currentTarget.style.borderColor="#F47B20";e.currentTarget.style.color="#F47B20";e.currentTarget.style.background="#FFF7ED"}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor="#E5E5E5";e.currentTarget.style.color="#404040";e.currentTarget.style.background="#F5F5F5"}}>
                  {s.label} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Dealer card for DEALER_ADMIN / DEALER_STAFF */}
        {profile.dealer && (
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",overflow:"hidden"}}>
            <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#A3A3A3",padding:"0.875rem 1.25rem",borderBottom:"1px solid #E5E5E5",background:"#FAFAFA"}}>
              {role==="DEALER_STAFF"?"Works at":"Dealership"}
            </div>
            <Link href={`/dealers/${profile.dealer.dealerId}`}
              style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1.25rem",textDecoration:"none",transition:"background 0.15s"}}
              onMouseOver={e=>(e.currentTarget.style.background="#FFF7ED")}
              onMouseOut={e=>(e.currentTarget.style.background="")}>
              <div style={{width:"60px",height:"60px",borderRadius:"12px",overflow:"hidden",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1.4rem",color:"#F47B20",flexShrink:0}}>
                {profile.dealer.logo?<img src={profile.dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{profile.dealer.companyName?.charAt(0)}</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"1.05rem",fontWeight:700,color:"#1A1A1A"}}>{profile.dealer.companyName}</div>
                <div style={{fontSize:"0.82rem",color:"#737373",marginTop:"0.1rem"}}>{[profile.dealer.city,profile.dealer.state].filter(Boolean).join(", ")}</div>
                <div style={{fontSize:"0.78rem",color:"#F47B20",marginTop:"0.25rem",fontWeight:600}}>View dealer profile & all cars →</div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
