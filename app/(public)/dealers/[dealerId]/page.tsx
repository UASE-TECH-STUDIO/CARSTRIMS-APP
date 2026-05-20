"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import FollowButton from "@/components/ui/FollowButton";

const STATUS_COLORS: Record<string,string> = {
  available:"#16A34A", sold:"#888", reserved:"#D97706", on_promotion:"#7C3AED",
};

export default function DealerProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const dealerId = params?.dealerId as string;
  const [dealer, setDealer]         = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [lightbox, setLightbox]     = useState<string|null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followers, setFollowers]   = useState<any[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [startingMsg, setStartingMsg] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (!dealerId) return;
    api.get(`/api/v1/public/dealers/${dealerId}`)
      .then(r => { setDealer(r.data); setFollowerCount(r.data.followerCount||0); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [dealerId]);

  useEffect(() => {
    if (!isAuthenticated||!dealerId) return;
    api.get(`/api/v1/follows/status/${dealerId}`)
      .then(r => setFollowerCount(r.data.followerCount||0))
      .catch(()=>{});
  }, [dealerId, isAuthenticated]);

  const loadFollowers = async () => {
    setLoadingFollowers(true);
    try { const res = await api.get(`/api/v1/follows/${dealerId}/followers`); setFollowers(res.data||[]); }
    catch {} finally { setLoadingFollowers(false); }
  };

  const toggleFollowers = () => { if (!showFollowers) loadFollowers(); setShowFollowers(!showFollowers); };

  const handleMessage = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!dealer?.userId&&!dealer?.ownerUserId) { alert("Cannot start chat."); return; }
    setStartingMsg(true);
    try {
      const receiverId = dealer.userId||dealer.ownerUserId;
      const r = await api.post("/api/v1/messages/start", {receiverId, message:`Hi, I'd like to know more about ${dealer.companyName}.`});
      const convId = r.data?.conversationId;
      const paths: Record<string,string> = {DEALER_ADMIN:"/dashboard/dealer/messages",DEALER_STAFF:"/dashboard/staff/messages",PARTNER_USER:"/dashboard/partner/messages",SYSTEM_ADMIN:"/dashboard/super-admin/messages"};
      router.push(convId?`${paths[user?.role||""]||"/dashboard/user/messages"}?conv=${convId}`:paths[user?.role||""]||"/dashboard/user/messages");
    } catch(e:any){ alert(e.response?.data?.detail||"Could not start chat"); }
    finally { setStartingMsg(false); }
  };

  const fmtPrice = (n:number) => `NGN ${(n||0).toLocaleString()}`;

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!dealer) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"5rem 1rem",minHeight:"100vh",background:"#F5F5F5",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:"3rem"}}></div>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Dealership not found</h2>
      <Link href="/feed" style={{color:"#F47B20",fontWeight:600}}><- Back to feed</Link>
    </div>
  );

  const isOwnProfile = user?.dealerId===dealerId||user?.dealerId===dealer._id||user?.dealerId===dealer.dealerId;

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>
      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>x</button>
          <img src={lightbox} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
        </div>
      )}

      {/* Followers modal */}
      {showFollowers && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"400px",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",background:"#F47B20",color:"#fff"}}>
              <span style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em"}}>FOLLOWERS ({followerCount})</span>
              <button onClick={()=>setShowFollowers(false)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:"1.1rem",fontWeight:700}}>x</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"0.75rem"}}>
              {loadingFollowers ? (
                <div style={{display:"flex",justifyContent:"center",padding:"2rem"}}>
                  <div style={{width:"24px",height:"24px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                </div>
              ) : followers.length===0 ? (
                <div style={{textAlign:"center",padding:"2rem",color:"#A3A3A3",fontSize:"0.875rem"}}>No followers yet -- share your profile to grow!</div>
              ) : followers.map((f:any)=>(
                <Link key={f._id||f.userId} href={`/users/${f.userId}`}
                  style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderRadius:"8px",textDecoration:"none",transition:"background 0.15s"}}
                  onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
                  onMouseOut={e=>e.currentTarget.style.background=""}>
                  <div style={{width:"40px",height:"40px",borderRadius:"50%",overflow:"hidden",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1rem",color:"#F47B20",flexShrink:0}}>
                    {f.avatar?<img src={f.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(f.fullName?.charAt(0)||"?")}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{f.fullName}</div>
                    <div style={{fontSize:"0.75rem",color:"#A3A3A3",textTransform:"capitalize" as const}}>{f.role?.replace(/_/g," ")}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1.5rem",background:"#fff",borderBottom:"1.5px solid #E5E5E5",position:"sticky",top:0,zIndex:40}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#525252",fontSize:"0.95rem",cursor:"pointer",fontFamily:"var(--font-body)",fontWeight:600}}><- Back</button>
        <Link href="/feed" style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.2em",color:"#F47B20",textDecoration:"none"}}>CARSTRIMS</Link>
        <div style={{width:"60px"}}/>
      </header>

      {/* Hero */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5"}}>
        <div style={{height:"180px",background:"linear-gradient(135deg,#1A1A1A 0%,#2D1A0A 60%,#F47B20 100%)",position:"relative",overflow:"hidden"}}>
          {dealer.banner&&<img src={dealer.banner} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.6}}/>}
        </div>
        <div style={{maxWidth:"1100px",margin:"0 auto",padding:"0 1.5rem"}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:"1.25rem",marginTop:"-52px",paddingBottom:"1.25rem",flexWrap:"wrap"}}>
            <div onClick={()=>dealer.logo&&setLightbox(dealer.logo)}
              style={{width:"100px",height:"100px",borderRadius:"16px",overflow:"hidden",border:"4px solid #fff",background:"#FFF7ED",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"2.5rem",color:"#F47B20",flexShrink:0,cursor:dealer.logo?"zoom-in":"default",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",transition:"transform 0.2s"}}
              onMouseOver={e=>{if(dealer.logo)(e.currentTarget as HTMLElement).style.transform="scale(1.03)"}}
              onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform=""}>
              {dealer.logo?<img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{dealer.companyName?.charAt(0)||"D"}</span>}
            </div>
            <div style={{flex:1,minWidth:0,paddingTop:"0.625rem",display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.5rem,3vw,2.2rem)",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>{dealer.companyName}</h1>
              {(dealer.city||dealer.state)&&<div style={{fontSize:"0.875rem",color:"#737373"}}> {[dealer.city,dealer.state].filter(Boolean).join(", ")}</div>}
              {dealer.description&&<p style={{fontSize:"0.875rem",color:"#525252",lineHeight:1.6,maxWidth:"600px",margin:0}}>{dealer.description}</p>}
              <button onClick={toggleFollowers}
                style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",background:"none",border:"none",cursor:"pointer",color:"#525252",fontSize:"0.875rem",fontFamily:"var(--font-body)",fontWeight:600,padding:0,width:"fit-content"}}>
                 <span style={{color:"#F47B20",fontFamily:"var(--font-display)",fontSize:"1rem"}}>{followerCount}</span> follower{followerCount!==1?"s":""}
                <span style={{fontSize:"0.72rem",color:"#A3A3A3"}}>{showFollowers?"^":"v"}</span>
              </button>
            </div>
            <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",alignItems:"center",flexShrink:0}}>
              {!isOwnProfile ? (
                <>
                  <FollowButton dealerId={dealerId} size="md"/>
                  <button onClick={handleMessage} disabled={startingMsg}
                    style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.625rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",letterSpacing:"0.08em",cursor:"pointer",opacity:startingMsg?0.6:1,transition:"background 0.2s"}}
                    onMouseOver={e=>(e.currentTarget.style.background="#F47B20")}
                    onMouseOut={e=>(e.currentTarget.style.background="#1A1A1A")}>
                    {startingMsg?"...":" Message"}
                  </button>
                </>
              ) : (
                <Link href="/dashboard/dealer/settings"
                  style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.625rem 1.25rem",textDecoration:"none",fontSize:"0.82rem",fontWeight:600}}>
                   Edit Profile
                </Link>
              )}
            </div>
          </div>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",paddingBottom:"1.25rem"}}>
            {dealer.phone&&<a href={`tel:${dealer.phone}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:"8px",padding:"0.55rem 0.875rem",fontSize:"0.82rem",textDecoration:"none",fontWeight:600}}> Call</a>}
            {dealer.whatsapp&&<a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",borderRadius:"8px",padding:"0.55rem 0.875rem",fontSize:"0.82rem",textDecoration:"none",fontWeight:600}}> WhatsApp</a>}
            {dealer.email&&<a href={`mailto:${dealer.email}`} style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",color:"#C4621A",borderRadius:"8px",padding:"0.55rem 0.875rem",fontSize:"0.82rem",textDecoration:"none",fontWeight:600}}> Email</a>}
            {dealer.instagram&&<a href={dealer.instagram.startsWith("http")?dealer.instagram:`https://instagram.com/${dealer.instagram.replace("@","")}`} target="_blank" rel="noreferrer" style={{fontSize:"0.78rem",color:"#737373",background:"#F5F5F5",border:"1px solid #E5E5E5",padding:"0.5rem 0.75rem",borderRadius:"6px",textDecoration:"none",fontWeight:500}}> Instagram</a>}
            {dealer.twitter&&<a href={dealer.twitter.startsWith("http")?dealer.twitter:`https://twitter.com/${dealer.twitter.replace("@","")}`} target="_blank" rel="noreferrer" style={{fontSize:"0.78rem",color:"#737373",background:"#F5F5F5",border:"1px solid #E5E5E5",padding:"0.5rem 0.75rem",borderRadius:"6px",textDecoration:"none",fontWeight:500}}> X</a>}
            {dealer.tiktok&&<a href={dealer.tiktok.startsWith("http")?dealer.tiktok:`https://tiktok.com/@${dealer.tiktok.replace("@","")}`} target="_blank" rel="noreferrer" style={{fontSize:"0.78rem",color:"#737373",background:"#F5F5F5",border:"1px solid #E5E5E5",padding:"0.5rem 0.75rem",borderRadius:"6px",textDecoration:"none",fontWeight:500}}> TikTok</a>}
            {dealer.website&&<a href={dealer.website} target="_blank" rel="noreferrer" style={{fontSize:"0.78rem",color:"#737373",background:"#F5F5F5",border:"1px solid #E5E5E5",padding:"0.5rem 0.75rem",borderRadius:"6px",textDecoration:"none",fontWeight:500}}> Website</a>}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{maxWidth:"1100px",margin:"1.25rem auto 0",padding:"0 1.25rem",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"0.875rem"}}>
        {[
          {label:"Vehicles Listed",value:dealer.totalCarsListed||0,onClick:undefined},
          {label:"Vehicles Sold",value:dealer.totalCarsSold||0,onClick:undefined},
          {label:"Followers",value:followerCount,onClick:toggleFollowers},
        ].map(s=>(
          <div key={s.label} onClick={s.onClick}
            style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1rem",textAlign:"center",cursor:s.onClick?"pointer":"default",transition:"all 0.15s"}}
            onMouseOver={e=>{if(s.onClick)(e.currentTarget as HTMLElement).style.borderColor="#F47B20"}}
            onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5"}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",color:"#F47B20"}}>{s.value}</div>
            <div style={{fontSize:"0.72rem",color:"#737373",textTransform:"uppercase" as const,letterSpacing:"0.06em",marginTop:"0.2rem"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vehicles */}
      <div style={{maxWidth:"1100px",margin:"1.25rem auto",padding:"0 1.25rem 3rem"}}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"0.85rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"1rem"}}>
          AVAILABLE VEHICLES ({dealer.availableCars?.length||0})
        </h2>
        {(dealer.availableCars?.length||0)===0 ? (
          <div style={{border:"1.5px dashed #E5E5E5",borderRadius:"12px",padding:"3rem",textAlign:"center",background:"#fff",color:"#737373",fontSize:"0.875rem"}}>No available vehicles right now</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"1rem"}}>
            {dealer.availableCars?.map((c:any)=>(
              <Link key={c._id} href={`/cars/${c.carId}`}
                style={{textDecoration:"none",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column",transition:"all 0.2s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5";(e.currentTarget as HTMLElement).style.transform=""}}>
                <div style={{height:"155px",background:"#F5F5F5",position:"relative",overflow:"hidden"}}>
                  {c.images?.[0]?<img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2rem",opacity:0.2}}></div>}
                  <div style={{position:"absolute",top:"0.5rem",left:"0.5rem",background:STATUS_COLORS[c.status]||"#888",color:"#fff",padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.62rem",fontWeight:700,textTransform:"capitalize" as const}}>{c.status}</div>
                </div>
                <div style={{padding:"0.875rem"}}>
                  <div style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                  <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.2rem"}}>{[c.color,c.transmission].filter(Boolean).join("  ")}</div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#F47B20",marginTop:"0.375rem"}}>{fmtPrice(c.sellingPrice)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}