"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

const STATUS_COLORS: Record<string,string> = {
  available:"#16A34A", sold:"#888", reserved:"#D97706",
};

function LightboxModal({ src, onClose }: { src:string; onClose:()=>void }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <button onClick={onClose} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>✕</button>
      <img src={src} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
    </div>
  );
}

export default function DealerProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const dealerId = params?.dealerId as string;
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string|null>(null);

  useEffect(() => {
    if (!dealerId) return;
    api.get(`/api/v1/public/dealers/${dealerId}`)
      .then(r => setDealer(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealerId]);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!dealer) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Dealer not found</h2>
      <Link href="/feed" style={{color:"#F47B20",textDecoration:"none"}}>← Back to feed</Link>
    </div>
  );

  const fmtPrice = (n:number) => `₦${(n||0).toLocaleString()}`;

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)",color:"#1A1A1A"}}>
      {lightbox && <LightboxModal src={lightbox} onClose={()=>setLightbox(null)}/>}

      {/* Topbar — fixed height, brand centered */}
      <header style={{
        background:"#fff",borderBottom:"1.5px solid #E5E5E5",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 1.25rem",height:"56px",
        position:"sticky",top:0,zIndex:50,
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#737373",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)",padding:"0.5rem 0",flexShrink:0}}>
          ← Back
        </button>
        <Link href="/feed" style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.18em",color:"#F47B20",textDecoration:"none",position:"absolute",left:"50%",transform:"translateX(-50%)"}}>
          CARSTRIMS
        </Link>
        <div style={{flexShrink:0,width:"48px"}}/>{/* spacer to balance back btn */}
      </header>

      {/* Hero banner */}
      {dealer.banner && (
        <div style={{height:"160px",overflow:"hidden",position:"relative"}}>
          <img src={dealer.banner} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.6}}/>
        </div>
      )}

      {/* Dealer header card */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5",padding:"1.5rem",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"1.25rem",flexWrap:"wrap"}}>
          {/* Logo — clickable to full size */}
          <div
            style={{width:"80px",height:"80px",borderRadius:"12px",overflow:"hidden",background:"#FFF7ED",border:"2.5px solid rgba(244,123,32,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:dealer.logo?"zoom-in":"default",flexShrink:0}}
            onClick={()=>dealer.logo&&setLightbox(dealer.logo)}
          >
            {dealer.logo
              ? <img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : <span style={{fontFamily:"var(--font-display)",fontSize:"2rem",color:"#F47B20"}}>{dealer.companyName?.charAt(0)}</span>
            }
          </div>

          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.3rem,3vw,2rem)",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1,margin:0}}>{dealer.companyName}</h1>
            <div style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{dealer.ownerName}</div>
            <div style={{display:"flex",gap:"1rem",flexWrap:"wrap",marginTop:"0.75rem",fontSize:"0.8rem",color:"#737373"}}>
              <span>📍 {dealer.city||"N/A"}, {dealer.state||"N/A"}</span>
              <span>🚗 {dealer.totalCarsListed||0} vehicles listed</span>
              <span>✔ {dealer.totalCarsSold||0} sold</span>
            </div>
            {dealer.qrCode && (
              <div style={{marginTop:"0.75rem",display:"inline-flex",flexDirection:"column",alignItems:"center",gap:"0.25rem",cursor:"zoom-in"}} onClick={()=>setLightbox(dealer.qrCode)}>
                <img src={dealer.qrCode} alt="QR Code" style={{width:"60px",height:"60px",border:"1.5px solid #E5E5E5",borderRadius:"6px"}}/>
                <span style={{fontSize:"0.6rem",color:"#A3A3A3"}}>Tap to enlarge QR</span>
              </div>
            )}
          </div>

          {/* Contact buttons */}
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",flexShrink:0,alignItems:"flex-start"}}>
            {dealer.phone && <a href={`tel:${dealer.phone}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:"8px",padding:"0.55rem 0.875rem",fontSize:"0.78rem",textDecoration:"none",whiteSpace:"nowrap"}}>📞 Call</a>}
            {dealer.whatsapp && (
              <a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noreferrer"
                style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",borderRadius:"8px",padding:"0.55rem 0.875rem",fontSize:"0.78rem",textDecoration:"none",whiteSpace:"nowrap"}}>
                💬 WhatsApp
              </a>
            )}
            {dealer.email && <a href={`mailto:${dealer.email}`} style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",color:"#C4621A",borderRadius:"8px",padding:"0.55rem 0.875rem",fontSize:"0.78rem",textDecoration:"none",whiteSpace:"nowrap"}}>✉ Email</a>}
          </div>
        </div>

        {dealer.description && (
          <p style={{fontSize:"0.875rem",color:"#525252",lineHeight:1.6,marginTop:"1rem",marginBottom:0}}>{dealer.description}</p>
        )}

        {/* Socials */}
        {(dealer.instagram||dealer.facebook||dealer.twitter||dealer.website) && (
          <div style={{display:"flex",gap:"0.5rem",marginTop:"0.875rem",flexWrap:"wrap"}}>
            {dealer.instagram && <a href={dealer.instagram} target="_blank" rel="noreferrer" style={{fontSize:"0.75rem",color:"#737373",textDecoration:"none",background:"#F5F5F5",padding:"0.3rem 0.6rem",borderRadius:"6px"}}>📸 Instagram</a>}
            {dealer.facebook  && <a href={dealer.facebook}  target="_blank" rel="noreferrer" style={{fontSize:"0.75rem",color:"#737373",textDecoration:"none",background:"#F5F5F5",padding:"0.3rem 0.6rem",borderRadius:"6px"}}>👤 Facebook</a>}
            {dealer.twitter   && <a href={dealer.twitter}   target="_blank" rel="noreferrer" style={{fontSize:"0.75rem",color:"#737373",textDecoration:"none",background:"#F5F5F5",padding:"0.3rem 0.6rem",borderRadius:"6px"}}>🐦 Twitter / X</a>}
            {dealer.website   && <a href={dealer.website}   target="_blank" rel="noreferrer" style={{fontSize:"0.75rem",color:"#737373",textDecoration:"none",background:"#F5F5F5",padding:"0.3rem 0.6rem",borderRadius:"6px"}}>🌐 Website</a>}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{maxWidth:"1100px",margin:"1.25rem auto 0",padding:"0 1.25rem",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem"}}>
        {[
          {label:"Vehicles Listed", value:dealer.totalCarsListed||0},
          {label:"Vehicles Sold",   value:dealer.totalCarsSold||0},
          {label:"Total Revenue",   value:fmtPrice(dealer.totalRevenue||0)},
        ].map(s=>(
          <div key={s.label} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1rem",textAlign:"center"}}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",color:"#F47B20"}}>{s.value}</div>
            <div style={{fontSize:"0.7rem",color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:"0.25rem"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vehicle listings */}
      <div style={{maxWidth:"1100px",margin:"1.25rem auto",padding:"0 1.25rem 3rem"}}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"0.85rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"1rem"}}>
          AVAILABLE VEHICLES ({dealer.availableCars?.length||0})
        </h2>
        {(dealer.availableCars?.length||0)===0 ? (
          <div style={{border:"1.5px dashed #E5E5E5",borderRadius:"12px",padding:"3rem",textAlign:"center",background:"#fff",color:"#737373",fontSize:"0.875rem"}}>
            No available vehicles right now
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"1rem"}}>
            {dealer.availableCars?.map((c:any)=>(
              <Link key={c._id} href={`/cars/${c.carId}`} style={{textDecoration:"none",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column",transition:"all 0.2s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5";(e.currentTarget as HTMLElement).style.transform=""}}>
                <div style={{height:"150px",background:"#F5F5F5",position:"relative",overflow:"hidden"}}>
                  {c.images?.[0]
                    ? <img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2rem",opacity:0.3}}>🚗</div>
                  }
                  <div style={{position:"absolute",top:"0.5rem",left:"0.5rem",background:STATUS_COLORS[c.status]||"#888",color:"#fff",padding:"0.18rem 0.5rem",borderRadius:"20px",fontSize:"0.62rem",fontWeight:700,textTransform:"capitalize"}}>
                    {c.status}
                  </div>
                </div>
                <div style={{padding:"0.875rem"}}>
                  <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                  <div style={{fontSize:"0.72rem",color:"#737373",marginTop:"0.2rem"}}>{[c.color,c.transmission].filter(Boolean).join(" · ")}</div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",color:"#F47B20",marginTop:"0.375rem"}}>₦{(c.sellingPrice||0).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`@media(max-width:640px){div[style*="grid-template-columns:repeat(3"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
