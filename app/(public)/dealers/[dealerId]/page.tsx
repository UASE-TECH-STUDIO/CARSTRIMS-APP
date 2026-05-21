"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import FollowButton from "@/components/ui/FollowButton";
import { useMessagesStore } from "@/store/messagesStore";

const STATUS_C: Record<string,string> = {
  available:"#16A34A", sold:"#888", reserved:"#D97706", on_promotion:"#7C3AED"
};

function getMsgPath(role?: string) {
  const paths: Record<string,string> = {
    DEALER_ADMIN:"/dashboard/dealer/messages",
    DEALER_STAFF:"/dashboard/staff/messages",
    PARTNER_USER:"/dashboard/partner/messages",
    SYSTEM_ADMIN:"/dashboard/super-admin/messages",
  };
  return paths[role||""] || "/dashboard/user/messages";
}

export default function DealerProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const dealerId = params?.dealerId as string;
  const { user, isAuthenticated } = useAuthStore();
  const { openConversation } = useMessagesStore();

  const [dealer, setDealer]               = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followers, setFollowers]         = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [lightbox, setLightbox]           = useState<string|null>(null);
  const [startMsg, setStartMsg]           = useState(false);

  useEffect(() => {
    if (!dealerId) return;
    api.get(`/api/v1/public/dealers/${dealerId}`)
      .then(r => { setDealer(r.data); setFollowerCount(r.data.followerCount||0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealerId]);

  const loadFollowers = async () => {
    try {
      const r = await api.get(`/api/v1/follows/${dealerId}/followers`);
      setFollowers(r.data?.followers || r.data || []);
    } catch {}
  };

  const toggleFollowers = () => {
    const next = !showFollowers;
    setShowFollowers(next);
    if (next && followers.length === 0) loadFollowers();
  };

  const handleMessage = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    const rid = dealer?.userId || dealer?.ownerUserId;
    if (!rid) { alert("Cannot start chat with this dealer."); return; }
    setStartMsg(true);
    try {
      const r = await api.post("/api/v1/messages/start", { receiverId: rid });
      const convId = r.data?.conversationId;
      if (convId) {
        openConversation(convId);
        // Navigate to dashboard so the widget is visible
        const msgPath = getMsgPath(user?.role);
        router.push(`${msgPath}?conv=${convId}`);
      }
    } catch(e:any) { alert(e.response?.data?.detail || "Could not start chat."); }
    finally { setStartMsg(false); }
  };

  const isOwn = user?.dealerId === dealerId || user?.dealerId === dealer?._id || user?.dealerId === dealer?.dealerId;

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!dealer) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5",gap:"1rem",textAlign:"center",padding:"2rem"}}>
      <div style={{fontSize:"3rem"}}>&#x1F3EA;</div>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Dealership not found</h2>
      <Link href="/feed" style={{color:"#F47B20",fontWeight:600}}>Back to feed</Link>
    </div>
  );

  const socials = [
    dealer.instagram && {label:"Instagram",href:dealer.instagram.startsWith("http")?dealer.instagram:`https://instagram.com/${dealer.instagram.replace("@","")}`},
    dealer.twitter   && {label:"Twitter/X", href:dealer.twitter.startsWith("http")?dealer.twitter:`https://twitter.com/${dealer.twitter.replace("@","")}`},
    dealer.facebook  && {label:"Facebook",  href:dealer.facebook.startsWith("http")?dealer.facebook:`https://facebook.com/${dealer.facebook}`},
    dealer.tiktok    && {label:"TikTok",    href:dealer.tiktok.startsWith("http")?dealer.tiktok:`https://tiktok.com/@${dealer.tiktok.replace("@","")}`},
    dealer.youtube   && {label:"YouTube",   href:dealer.youtube.startsWith("http")?dealer.youtube:`https://youtube.com/${dealer.youtube}`},
    dealer.website   && {label:"Website",   href:dealer.website.startsWith("http")?dealer.website:`https://${dealer.website}`},
  ].filter(Boolean) as {label:string;href:string}[];

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>X</button>
          <img src={lightbox} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
        </div>
      )}

      {/* Followers modal */}
      {showFollowers && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"380px",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",background:"#F47B20",color:"#fff"}}>
              <span style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em"}}>FOLLOWERS ({followerCount})</span>
              <button onClick={()=>setShowFollowers(false)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:"1.1rem",fontWeight:700}}>X</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"0.5rem"}}>
              {followers.length===0
                ? <div style={{textAlign:"center",padding:"2rem",color:"#A3A3A3",fontSize:"0.875rem"}}>No followers yet</div>
                : followers.map((f:any,i:number)=>(
                  <Link key={f.userId||i} href={`/users/${f.userId}`}
                    style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderRadius:"8px",textDecoration:"none"}}
                    onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
                    onMouseOut={e=>e.currentTarget.style.background=""}>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                      {f.avatar?<img src={f.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(f.fullName?.charAt(0)||"?")}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{f.fullName||"User"}</div>
                      <div style={{fontSize:"0.72rem",color:"#A3A3A3",textTransform:"capitalize"}}>{f.role?.replace(/_/g," ")}</div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky topbar */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",background:"#fff",borderBottom:"1.5px solid #E5E5E5",position:"sticky",top:0,zIndex:40}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#525252",fontSize:"0.875rem",cursor:"pointer",fontWeight:600,fontFamily:"var(--font-body)"}}>Back</button>
        <Link href="/feed" style={{fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.2em",color:"#F47B20",textDecoration:"none"}}>CARSTRIMS</Link>
        <div style={{width:"50px"}}/>
      </header>

      {/* Hero - NO banner, flat clean card */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto",padding:"1.25rem 1rem"}}>

          {/* Top row: logo + name + actions */}
          <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",flexWrap:"wrap"}}>

            {/* Logo */}
            <div onClick={()=>dealer.logo&&setLightbox(dealer.logo)}
              style={{width:"80px",height:"80px",minWidth:"80px",borderRadius:"12px",overflow:"hidden",border:"2.5px solid #F47B20",background:"#FFF7ED",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"2rem",color:"#F47B20",cursor:dealer.logo?"zoom-in":"default",boxShadow:"0 2px 12px rgba(0,0,0,0.1)"}}>
              {dealer.logo?<img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{dealer.companyName?.charAt(0)||"D"}</span>}
            </div>

            {/* Name + location + desc */}
            <div style={{flex:1,minWidth:"180px"}}>
              <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.25rem,4vw,1.8rem)",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1.1,margin:"0 0 0.3rem"}}>
                {dealer.companyName}
              </h1>
              {(dealer.city||dealer.state) && (
                <div style={{fontSize:"0.82rem",color:"#737373",marginBottom:"0.25rem"}}>
                  {[dealer.city,dealer.state].filter(Boolean).join(", ")}
                </div>
              )}
              {dealer.description && (
                <p style={{fontSize:"0.82rem",color:"#525252",lineHeight:1.55,margin:"0.25rem 0 0",maxWidth:"520px"}}>{dealer.description}</p>
              )}
              {/* Followers count */}
              <button onClick={toggleFollowers}
                style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:"none",border:"none",cursor:"pointer",color:"#737373",fontSize:"0.8rem",fontFamily:"var(--font-body)",fontWeight:600,padding:"0.35rem 0 0",marginTop:"0.25rem"}}>
                <span style={{color:"#F47B20",fontFamily:"var(--font-display)",fontSize:"0.95rem",fontWeight:700}}>{followerCount}</span>
                {" "}follower{followerCount!==1?"s":""}
                <span style={{fontSize:"0.65rem",color:"#A3A3A3"}}>{showFollowers?"v":">"}</span>
              </button>
            </div>

            {/* Actions - on their own row on mobile */}
            {!isOwn && (
              <div style={{display:"flex",gap:"0.5rem",flexShrink:0,flexWrap:"wrap",width:"100%",marginTop:"0.25rem"}}>
                <FollowButton dealerId={dealerId} dealerName={dealer.companyName} size="md" onCountChange={setFollowerCount}/>
                {isAuthenticated ? (
                  <button onClick={handleMessage} disabled={startMsg}
                    style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.625rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",letterSpacing:"0.08em",cursor:"pointer",opacity:startMsg?0.6:1,transition:"background 0.2s",fontWeight:700,whiteSpace:"nowrap"}}
                    onMouseOver={e=>(e.currentTarget.style.background="#F47B20")}
                    onMouseOut={e=>(e.currentTarget.style.background="#1A1A1A")}>
                    {startMsg?"Opening...":"Message"}
                  </button>
                ) : (
                  <Link href="/login" style={{background:"#1A1A1A",color:"#fff",borderRadius:"8px",padding:"0.625rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",letterSpacing:"0.08em",textDecoration:"none",fontWeight:700,whiteSpace:"nowrap"}}>
                    Sign in to Message
                  </Link>
                )}
              </div>
            )}
            {isOwn && (
              <Link href="/dashboard/dealer/settings" style={{flexShrink:0,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 1rem",textDecoration:"none",fontSize:"0.8rem",fontWeight:600,whiteSpace:"nowrap"}}>
                Edit Profile
              </Link>
            )}
          </div>

          {/* Contact + Social links */}
          {(dealer.phone||dealer.whatsapp||dealer.email||socials.length>0) && (
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginTop:"1rem"}}>
              {dealer.phone && (
                <a href={`tel:${dealer.phone}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:"8px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap"}}>
                  Call
                </a>
              )}
              {dealer.whatsapp && (
                <a href={`https://wa.me/${dealer.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                  style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",borderRadius:"8px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap"}}>
                  WhatsApp
                </a>
              )}
              {dealer.email && (
                <a href={`mailto:${dealer.email}`} style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",color:"#C4621A",borderRadius:"8px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap"}}>
                  Email
                </a>
              )}
              {socials.map(s=>(
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                  style={{background:"#F5F5F5",border:"1px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.4rem 0.75rem",fontSize:"0.75rem",textDecoration:"none",fontWeight:500,whiteSpace:"nowrap",transition:"all 0.15s"}}
                  onMouseOver={e=>{e.currentTarget.style.borderColor="#F47B20";e.currentTarget.style.color="#F47B20";}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor="#E5E5E5";e.currentTarget.style.color="#525252";}}>
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{maxWidth:"1100px",margin:"1rem auto 0",padding:"0 1rem",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.625rem"}}>
        {[
          {label:"Vehicles",value:dealer.totalCarsListed||dealer.availableCars?.length||0},
          {label:"Sold",value:dealer.totalCarsSold||0},
          {label:"Followers",value:followerCount,onClick:toggleFollowers},
        ].map(s=>(
          <div key={s.label} onClick={s.onClick}
            style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"0.875rem 0.5rem",textAlign:"center",cursor:s.onClick?"pointer":"default"}}
            onMouseOver={e=>{if(s.onClick)(e.currentTarget as HTMLElement).style.borderColor="#F47B20";}}
            onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5"}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",color:"#F47B20"}}>{s.value}</div>
            <div style={{fontSize:"0.68rem",color:"#737373",textTransform:"uppercase" as const,letterSpacing:"0.05em",marginTop:"0.15rem"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vehicles grid */}
      <div style={{maxWidth:"1100px",margin:"1rem auto",padding:"0 1rem 3rem"}}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"0.875rem",textTransform:"uppercase" as const}}>
          Available Vehicles ({dealer.availableCars?.length||0})
        </h2>
        {(dealer.availableCars?.length||0)===0 ? (
          <div style={{border:"1.5px dashed #E5E5E5",borderRadius:"12px",padding:"3rem",textAlign:"center",background:"#fff",color:"#737373",fontSize:"0.875rem"}}>
            No available vehicles right now
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))",gap:"0.875rem"}}>
            {dealer.availableCars?.map((c:any)=>(
              <Link key={c._id||c.carId} href={`/cars/${c.carId}`}
                style={{textDecoration:"none",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column",transition:"all 0.2s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5";(e.currentTarget as HTMLElement).style.transform="";}}>
                <div style={{aspectRatio:"4/3",background:"#F5F5F5",position:"relative",overflow:"hidden"}}>
                  {c.images?.[0]
                    ?<img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    :<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2rem",opacity:0.2}}>vehicle</div>
                  }
                  <div style={{position:"absolute",top:"0.5rem",left:"0.5rem",background:STATUS_C[c.status]||"#888",color:"#fff",padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.62rem",fontWeight:700,textTransform:"capitalize" as const}}>{c.status}</div>
                </div>
                <div style={{padding:"0.75rem"}}>
                  <div style={{fontWeight:700,fontSize:"0.85rem",color:"#1A1A1A",lineHeight:1.3}}>{c.brand} {c.model} {c.year}</div>
                  <div style={{fontSize:"0.7rem",color:"#737373",marginTop:"0.15rem"}}>{[c.color,c.transmission].filter(Boolean).join(" . ")}</div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#F47B20",marginTop:"0.3rem"}}>NGN {(c.sellingPrice||0).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}