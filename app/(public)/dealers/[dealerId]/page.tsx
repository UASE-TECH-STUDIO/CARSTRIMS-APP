"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const STATUS_C: Record<string,string> = { available:"#16A34A", sold:"#888", reserved:"#D97706", on_promotion:"#7C3AED" };

function FollowBtn({ dealerId, onChange }: { dealerId:string; onChange:(n:number)=>void }) {
  const { isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [count, setCount]         = useState(0);

  useEffect(() => {
    if (!dealerId) return;
    api.get(`/api/v1/follows/status/${dealerId}`)
      .then(r => { setFollowing(r.data.following); setCount(r.data.followerCount||0); })
      .catch(() => {});
  }, [dealerId]);

  const toggle = async () => {
    if (!isAuthenticated) { window.location.href="/login"; return; }
    setLoading(true);
    try {
      if (following) {
        await api.delete(`/api/v1/follows/${dealerId}`);
        setFollowing(false); setCount(c => { const n=Math.max(0,c-1); onChange(n); return n; });
      } else {
        await api.post(`/api/v1/follows/${dealerId}`);
        setFollowing(true); setCount(c => { const n=c+1; onChange(n); return n; });
      }
    } catch {} finally { setLoading(false); }
  };

  return (
    <button onClick={toggle} disabled={loading}
      style={{background:following?"#F5F5F5":"#F47B20",color:following?"#525252":"#fff",border:following?"1.5px solid #E5E5E5":"none",borderRadius:"8px",padding:"0.625rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",letterSpacing:"0.08em",cursor:"pointer",opacity:loading?0.6:1,transition:"all 0.2s",whiteSpace:"nowrap",fontWeight:600}}>
      {loading?"...":(following?"Following":"+ Follow")}
      {count>0&&<span style={{background:"rgba(0,0,0,0.12)",borderRadius:"20px",padding:"0.1rem 0.4rem",fontSize:"0.65rem",marginLeft:"0.375rem"}}>{count}</span>}
    </button>
  );
}

export default function DealerProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const dealerId = params?.dealerId as string;
  const { user, isAuthenticated } = useAuthStore();
  const [dealer, setDealer]         = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followers, setFollowers]   = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [lightbox, setLightbox]     = useState<string|null>(null);
  const [startMsg, setStartMsg]     = useState(false);

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
    const next = !showFollowers; setShowFollowers(next);
    if (next && followers.length===0) loadFollowers();
  };

  const handleMessage = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    const rid = dealer?.userId || dealer?.ownerUserId;
    if (!rid) { alert("Cannot start chat with this dealer."); return; }
    setStartMsg(true);
    try {
      const r = await api.post("/api/v1/messages/start", { receiverId: rid, message:`Hi, I found your dealership on CARSTRIMS and would like to know more about your available vehicles.` });
      const convId = r.data?.conversationId;
      const paths: Record<string,string> = { DEALER_ADMIN:"/dashboard/dealer/messages", DEALER_STAFF:"/dashboard/staff/messages", PARTNER_USER:"/dashboard/partner/messages", SYSTEM_ADMIN:"/dashboard/super-admin/messages" };
      const base = paths[user?.role||""] || "/dashboard/user/messages";
      router.push(convId ? `${base}?conv=${convId}` : base);
    } catch (e:any) { alert(e.response?.data?.detail || "Could not start chat."); }
    finally { setStartMsg(false); }
  };

  const isOwn = user?.dealerId===dealerId || user?.dealerId===dealer?._id || user?.dealerId===dealer?.dealerId;

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!dealer) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"2rem",textAlign:"center"}}>
      <div style={{fontSize:"3rem"}}>🏪</div>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Dealership not found</h2>
      <Link href="/feed" style={{color:"#F47B20",fontWeight:600}}>Back to feed</Link>
    </div>
  );

  // Build socials from all possible fields
  const socials = [
    dealer.instagram && { label:"Instagram", href: dealer.instagram.startsWith("http") ? dealer.instagram : `https://instagram.com/${dealer.instagram.replace("@","")}`, color:"#E1306C" },
    dealer.twitter   && { label:"Twitter / X", href: dealer.twitter.startsWith("http") ? dealer.twitter : `https://twitter.com/${dealer.twitter.replace("@","")}`, color:"#1DA1F2" },
    dealer.facebook  && { label:"Facebook", href: dealer.facebook.startsWith("http") ? dealer.facebook : `https://facebook.com/${dealer.facebook}`, color:"#1877F2" },
    dealer.tiktok    && { label:"TikTok", href: dealer.tiktok.startsWith("http") ? dealer.tiktok : `https://tiktok.com/@${dealer.tiktok.replace("@","")}`, color:"#000" },
    dealer.youtube   && { label:"YouTube", href: dealer.youtube.startsWith("http") ? dealer.youtube : `https://youtube.com/${dealer.youtube}`, color:"#FF0000" },
    dealer.website   && { label:"Website", href: dealer.website.startsWith("http") ? dealer.website : `https://${dealer.website}`, color:"#F47B20" },
  ].filter(Boolean) as { label:string; href:string; color:string }[];

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>

      {/* Lightbox */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>X</button>
          <img src={lightbox} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
        </div>
      )}

      {/* Followers modal */}
      {showFollowers&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"400px",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",background:"#F47B20",color:"#fff"}}>
              <span style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em"}}>FOLLOWERS ({followerCount})</span>
              <button onClick={()=>setShowFollowers(false)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:"1.1rem",fontWeight:700}}>X</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"0.75rem"}}>
              {followers.length===0
                ? <div style={{textAlign:"center",padding:"2rem",color:"#A3A3A3",fontSize:"0.875rem"}}>No followers yet</div>
                : followers.map((f:any,i:number) => (
                  <Link key={f.userId||i} href={`/users/${f.userId}`}
                    style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderRadius:"8px",textDecoration:"none"}}
                    onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
                    onMouseOut={e=>e.currentTarget.style.background=""}>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                      {f.avatar?<img src={f.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(f.fullName?.charAt(0)||"?")}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{f.fullName||f.userName}</div>
                      <div style={{fontSize:"0.72rem",color:"#A3A3A3",textTransform:"capitalize"}}>{f.role?.replace(/_/g," ")}</div>
                    </div>
                  </Link>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Sticky topbar */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1rem",background:"#fff",borderBottom:"1.5px solid #E5E5E5",position:"sticky",top:0,zIndex:40}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#525252",fontSize:"0.875rem",cursor:"pointer",fontWeight:600,fontFamily:"var(--font-body)",padding:"0.25rem 0"}}>← Back</button>
        <Link href="/feed" style={{fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.2em",color:"#F47B20",textDecoration:"none"}}>CARSTRIMS</Link>
        <div style={{width:"50px"}}/>
      </header>

      {/* ═══════ HERO SECTION ═══════ */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5"}}>

        {/* Banner — purely decorative, limited height */}
        <div style={{height:"140px",background:"linear-gradient(135deg,#1A1A1A 0%,#2D1A0A 50%,#F47B20 100%)",position:"relative",overflow:"hidden"}}>
          {dealer.banner&&<img src={dealer.banner} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.45,mixBlendMode:"multiply"}}/>}
          {/* Dark gradient at bottom so logo overlaps cleanly */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:"60px",background:"linear-gradient(to top,rgba(255,255,255,0.15),transparent)"}}/>
        </div>

        {/* Content row: logo + info + actions */}
        <div style={{maxWidth:"1100px",margin:"0 auto",padding:"0 1rem"}}>
          <div style={{display:"flex",gap:"1rem",marginTop:"-44px",paddingBottom:"1.25rem",flexWrap:"wrap",alignItems:"flex-end"}}>

            {/* Logo — overlaps banner, white border */}
            <div onClick={()=>dealer.logo&&setLightbox(dealer.logo)}
              style={{
                width:"88px",height:"88px",borderRadius:"14px",flexShrink:0,
                border:"4px solid #fff",overflow:"hidden",background:"#FFF7ED",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"var(--font-display)",fontSize:"2rem",color:"#F47B20",
                cursor:dealer.logo?"zoom-in":"default",
                boxShadow:"0 4px 20px rgba(0,0,0,0.18)",
                transition:"transform 0.2s",
              }}
              onMouseOver={e=>{if(dealer.logo)(e.currentTarget as HTMLElement).style.transform="scale(1.04)";}}
              onMouseOut={e=>(e.currentTarget as HTMLElement).style.transform=""}>
              {dealer.logo?<img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{dealer.companyName?.charAt(0)||"D"}</span>}
            </div>

            {/* Company name + location + description */}
            <div style={{flex:1,minWidth:"200px",paddingTop:"0.5rem"}}>
              <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.25rem,3vw,1.9rem)",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1.05,margin:"0 0 0.3rem"}}>
                {dealer.companyName}
              </h1>
              {(dealer.city||dealer.state)&&(
                <div style={{fontSize:"0.85rem",color:"#737373",display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.25rem"}}>
                  📍 {[dealer.city,dealer.state].filter(Boolean).join(", ")}
                </div>
              )}
              {dealer.description&&(
                <p style={{fontSize:"0.85rem",color:"#525252",lineHeight:1.55,maxWidth:"500px",margin:"0.25rem 0 0"}}>{dealer.description}</p>
              )}
              <button onClick={toggleFollowers}
                style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:"none",border:"none",cursor:"pointer",color:"#525252",fontSize:"0.82rem",fontFamily:"var(--font-body)",fontWeight:600,padding:"0.35rem 0 0",marginTop:"0.1rem"}}>
                👥 <span style={{color:"#F47B20",fontFamily:"var(--font-display)",fontSize:"0.95rem"}}>{followerCount}</span>
                {" "}follower{followerCount!==1?"s":""}
                <span style={{fontSize:"0.68rem",color:"#A3A3A3"}}>{showFollowers?"▲":"▼"}</span>
              </button>
            </div>

            {/* CTA buttons */}
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center",flexShrink:0,paddingTop:"0.5rem"}}>
              {!isOwn ? (
                <>
                  <FollowBtn dealerId={dealerId} onChange={setFollowerCount}/>
                  {isAuthenticated ? (
                    <button onClick={handleMessage} disabled={startMsg}
                      style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.625rem 1rem",fontFamily:"var(--font-display)",fontSize:"0.8rem",letterSpacing:"0.06em",cursor:"pointer",opacity:startMsg?0.6:1,transition:"background 0.2s",whiteSpace:"nowrap",fontWeight:600}}
                      onMouseOver={e=>(e.currentTarget.style.background="#F47B20")}
                      onMouseOut={e=>(e.currentTarget.style.background="#1A1A1A")}>
                      {startMsg?"Opening...":"💬 Message"}
                    </button>
                  ) : (
                    <Link href="/login" style={{background:"#1A1A1A",color:"#fff",borderRadius:"8px",padding:"0.625rem 1rem",fontFamily:"var(--font-display)",fontSize:"0.8rem",letterSpacing:"0.06em",textDecoration:"none",whiteSpace:"nowrap",fontWeight:600}}>
                      Sign in to Message
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/dashboard/dealer/settings" style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.625rem 1rem",textDecoration:"none",fontSize:"0.82rem",fontWeight:600}}>
                  ✏ Edit Profile
                </Link>
              )}
            </div>
          </div>

          {/* ─── Contact + Social links row ─── */}
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",paddingBottom:"1.25rem",alignItems:"center"}}>
            {dealer.phone&&(
              <a href={`tel:${dealer.phone}`} style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:"8px",padding:"0.45rem 0.875rem",fontSize:"0.8rem",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s"}}
                onMouseOver={e=>{e.currentTarget.style.background="#1D4ED8";e.currentTarget.style.color="#fff";}}
                onMouseOut={e=>{e.currentTarget.style.background="#EFF6FF";e.currentTarget.style.color="#1D4ED8";}}>
                📞 Call
              </a>
            )}
            {dealer.whatsapp&&(
              <a href={`https://wa.me/${dealer.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",borderRadius:"8px",padding:"0.45rem 0.875rem",fontSize:"0.8rem",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s"}}
                onMouseOver={e=>{e.currentTarget.style.background="#15803D";e.currentTarget.style.color="#fff";}}
                onMouseOut={e=>{e.currentTarget.style.background="#F0FDF4";e.currentTarget.style.color="#15803D";}}>
                💬 WhatsApp
              </a>
            )}
            {dealer.email&&(
              <a href={`mailto:${dealer.email}`}
                style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",color:"#C4621A",borderRadius:"8px",padding:"0.45rem 0.875rem",fontSize:"0.8rem",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap"}}>
                ✉ Email
              </a>
            )}
            {socials.map(s=>(
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",background:"#F5F5F5",border:"1px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.45rem 0.875rem",fontSize:"0.78rem",textDecoration:"none",fontWeight:500,whiteSpace:"nowrap",transition:"all 0.15s"}}
                onMouseOver={e=>{e.currentTarget.style.borderColor=s.color;e.currentTarget.style.color=s.color;e.currentTarget.style.background=s.color+"11";}}
                onMouseOut={e=>{e.currentTarget.style.borderColor="#E5E5E5";e.currentTarget.style.color="#525252";e.currentTarget.style.background="#F5F5F5";}}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{maxWidth:"1100px",margin:"1rem auto 0",padding:"0 1rem",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"0.75rem"}}>
        {[
          {label:"Listed",    value:dealer.totalCarsListed||dealer.availableCars?.length||0},
          {label:"Sold",      value:dealer.totalCarsSold||0},
          {label:"Followers", value:followerCount, onClick:toggleFollowers},
        ].map(s=>(
          <div key={s.label} onClick={s.onClick}
            style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"0.875rem",textAlign:"center",cursor:s.onClick?"pointer":"default",transition:"all 0.15s"}}
            onMouseOver={e=>{if(s.onClick)(e.currentTarget as HTMLElement).style.borderColor="#F47B20";}}
            onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5"}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",color:"#F47B20"}}>{s.value}</div>
            <div style={{fontSize:"0.72rem",color:"#737373",textTransform:"uppercase" as const,letterSpacing:"0.06em",marginTop:"0.15rem"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vehicles grid */}
      <div style={{maxWidth:"1100px",margin:"1rem auto",padding:"0 1rem 3rem"}}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"0.82rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"1rem",textTransform:"uppercase" as const}}>
          Available Vehicles ({dealer.availableCars?.length||0})
        </h2>
        {(dealer.availableCars?.length||0)===0?(
          <div style={{border:"1.5px dashed #E5E5E5",borderRadius:"12px",padding:"3rem",textAlign:"center",background:"#fff",color:"#737373"}}>
            No available vehicles right now
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))",gap:"1rem"}}>
            {dealer.availableCars?.map((c:any)=>(
              <Link key={c._id||c.carId} href={`/cars/${c.carId}`}
                style={{textDecoration:"none",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column",transition:"all 0.2s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5";(e.currentTarget as HTMLElement).style.transform="";}} >
                <div style={{aspectRatio:"4/3",background:"#F5F5F5",position:"relative",overflow:"hidden"}}>
                  {c.images?.[0]
                    ?<img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    :<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2rem",opacity:0.2}}>🚗</div>
                  }
                  <div style={{position:"absolute",top:"0.5rem",left:"0.5rem",background:STATUS_C[c.status]||"#888",color:"#fff",padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.62rem",fontWeight:700,textTransform:"capitalize" as const}}>{c.status}</div>
                </div>
                <div style={{padding:"0.875rem"}}>
                  <div style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                  <div style={{fontSize:"0.72rem",color:"#737373",marginTop:"0.15rem"}}>{[c.color,c.transmission].filter(Boolean).join(" · ")}</div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#F47B20",marginTop:"0.375rem"}}>NGN {(c.sellingPrice||0).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
