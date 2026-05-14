"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function PublicUserProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const userId   = params?.userId as string;
  const [profile,  setProfile]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    api.get(`/api/v1/public/users/${userId}`)
      .then(r  => setProfile(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5"}}>
      <div style={{width:"32px",height:"32px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notFound || !profile) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"5rem 1rem",textAlign:"center",minHeight:"100vh",background:"#F5F5F5",justifyContent:"center"}}>
      <div style={{fontSize:"3rem"}}>👤</div>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>User not found</h2>
      <p style={{color:"#737373",fontSize:"0.875rem"}}>This profile may not exist or has been removed.</p>
      <button onClick={() => router.back()} style={{background:"#F47B20",color:"#fff",border:"none",padding:"0.75rem 1.5rem",borderRadius:"8px",cursor:"pointer",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em"}}>
        ← Go Back
      </button>
    </div>
  );

  const role = profile.role || "USER";

  const ROLE_LABEL: Record<string,string> = {
    DEALER_ADMIN: "Dealer",
    DEALER_STAFF: "Dealer Staff",
    PARTNER_USER: "Partner / Asset Owner",
    SYSTEM_ADMIN: "Platform Admin",
    USER:         "Buyer",
  };
  const ROLE_COLOR: Record<string,string> = {
    DEALER_ADMIN: "#F47B20",
    DEALER_STAFF: "#D97706",
    PARTNER_USER: "#7B68EE",
    SYSTEM_ADMIN: "#DC2626",
    USER:         "#16A34A",
  };
  const rc = ROLE_COLOR[role] || "#737373";
  const isDealer  = role === "DEALER_ADMIN" || role === "DEALER_STAFF";
  const isPartner = role === "PARTNER_USER";

  return (
    <div className="up-page">
      <header className="up-topbar">
        <button className="up-back" onClick={() => router.back()}>← Back</button>
        <Link href="/feed" className="up-brand">CARSTRIMS</Link>
      </header>

      {/* Hero */}
      <div className="up-hero">
        <div className="up-hero-bg"/>
        <div className="up-hero-body">
          <div className="up-avatar">
            {profile.avatar
              ? <img src={profile.avatar} alt=""/>
              : <span>{profile.fullName?.charAt(0) || "?"}</span>
            }
          </div>
          <div className="up-hero-info">
            <h1 className="up-name">{profile.fullName}</h1>
            <div className="up-role" style={{background:`${rc}18`, color:rc, border:`1.5px solid ${rc}40`}}>
              {ROLE_LABEL[role] || role}
            </div>
            {(profile.city || profile.state) && (
              <div className="up-loc">
                📍 {[profile.city, profile.state].filter(Boolean).join(", ")}
              </div>
            )}
            {profile.bio && <p className="up-bio">{profile.bio}</p>}
          </div>
        </div>
      </div>

      <div className="up-body">
        {/* Contact */}
        {(profile.phone || profile.whatsapp || profile.email) && (
          <div className="up-card">
            <div className="up-card-title">CONTACT</div>
            <div className="up-contacts">
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="up-cbtn phone">📞 {profile.phone}</a>
              )}
              {profile.whatsapp && (
                <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noreferrer" className="up-cbtn wa">
                  💬 WhatsApp
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="up-cbtn email">✉ {profile.email}</a>
              )}
            </div>
          </div>
        )}

        {/* Social links */}
        {(profile.instagram || profile.facebook || profile.twitter || profile.tiktok || profile.website) && (
          <div className="up-card">
            <div className="up-card-title">SOCIAL</div>
            <div className="up-socials">
              {profile.instagram && (
                <a href={profile.instagram.startsWith("http") ? profile.instagram : `https://instagram.com/${profile.instagram.replace("@","")}`}
                  target="_blank" rel="noreferrer" className="up-slink">Instagram</a>
              )}
              {profile.facebook && (
                <a href={profile.facebook.startsWith("http") ? profile.facebook : `https://facebook.com/${profile.facebook}`}
                  target="_blank" rel="noreferrer" className="up-slink">Facebook</a>
              )}
              {profile.twitter && (
                <a href={profile.twitter.startsWith("http") ? profile.twitter : `https://twitter.com/${profile.twitter.replace("@","")}`}
                  target="_blank" rel="noreferrer" className="up-slink">Twitter / X</a>
              )}
              {profile.tiktok && (
                <a href={profile.tiktok.startsWith("http") ? profile.tiktok : `https://tiktok.com/@${profile.tiktok.replace("@","")}`}
                  target="_blank" rel="noreferrer" className="up-slink">TikTok</a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="up-slink">Website</a>
              )}
            </div>
          </div>
        )}

        {/* Dealer info — shows for DEALER_ADMIN and DEALER_STAFF */}
        {isDealer && profile.dealer && (
          <div className="up-card">
            <div className="up-card-title">DEALERSHIP</div>
            <Link href={`/dealers/${profile.dealer.dealerId}`} className="up-dealer-link">
              <div className="up-dealer-logo">
                {profile.dealer.logo
                  ? <img src={profile.dealer.logo} alt=""/>
                  : <span>{profile.dealer.companyName?.charAt(0)}</span>
                }
              </div>
              <div>
                <div className="up-dealer-name">{profile.dealer.companyName}</div>
                <div className="up-dealer-loc">
                  {[profile.dealer.city, profile.dealer.state].filter(Boolean).join(", ")}
                </div>
                <div className="up-dealer-cta">View dealer profile & all cars →</div>
              </div>
            </Link>
          </div>
        )}

        {/* Partner stats */}
        {isPartner && profile.stats && (
          <div className="up-card">
            <div className="up-card-title">PARTNER STATS</div>
            <div className="up-stats">
              <div className="up-stat">
                <div className="up-stat-val">{profile.stats.totalCars || 0}</div>
                <div className="up-stat-label">Cars Assigned</div>
              </div>
              <div className="up-stat">
                <div className="up-stat-val">{profile.stats.totalDealers || 0}</div>
                <div className="up-stat-label">Dealers</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .up-page{min-height:100vh;background:#F5F5F5;font-family:var(--font-body)}
        .up-topbar{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.5rem;background:#fff;border-bottom:1.5px solid #E5E5E5;position:sticky;top:0;z-index:50}
        .up-back{background:none;border:none;color:#737373;font-size:0.875rem;cursor:pointer;font-family:var(--font-body)}
        .up-back:hover{color:#1A1A1A}
        .up-brand{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.2em;color:#F47B20;text-decoration:none}
        .up-hero{background:#fff;border-bottom:1.5px solid #E5E5E5}
        .up-hero-bg{height:120px;background:linear-gradient(135deg,#1A1A1A,#2D1A0A 60%,#F47B20)}
        .up-hero-body{display:flex;align-items:flex-end;gap:1.25rem;padding:0 1.5rem 1.5rem;margin-top:-50px;flex-wrap:wrap}
        .up-avatar{width:100px;height:100px;border-radius:50%;overflow:hidden;border:4px solid #fff;background:#FFF7ED;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:2.5rem;color:#F47B20;box-shadow:0 4px 16px rgba(0,0,0,0.15)}
        .up-avatar img{width:100%;height:100%;object-fit:cover;display:block}
        .up-hero-info{padding-top:0.75rem;display:flex;flex-direction:column;gap:0.4rem;flex:1;min-width:0}
        .up-name{font-family:var(--font-display);font-size:1.75rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1}
        .up-role{display:inline-flex;align-items:center;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:700;letter-spacing:0.08em;width:fit-content}
        .up-loc{font-size:0.8rem;color:#737373}
        .up-bio{font-size:0.875rem;color:#525252;line-height:1.6;max-width:480px}
        .up-body{max-width:800px;margin:0 auto;padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
        .up-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;overflow:hidden}
        .up-card-title{font-size:0.65rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373;padding:1rem 1.25rem;border-bottom:1px solid #E5E5E5;background:#FAFAFA}
        .up-contacts{display:flex;flex-direction:column;gap:0.5rem;padding:1.25rem}
        .up-cbtn{text-decoration:none;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;gap:0.5rem;transition:all 0.2s}
        .up-cbtn.phone{background:#EFF6FF;color:#3B8BD4;border:1.5px solid rgba(59,139,212,0.25)}
        .up-cbtn.phone:hover{background:#3B8BD4;color:#fff}
        .up-cbtn.wa{background:#F0FDF4;color:#16A34A;border:1.5px solid rgba(22,163,74,0.25)}
        .up-cbtn.wa:hover{background:#16A34A;color:#fff}
        .up-cbtn.email{background:#FFF7ED;color:#F47B20;border:1.5px solid rgba(244,123,32,0.25)}
        .up-cbtn.email:hover{background:#F47B20;color:#fff}
        .up-socials{display:flex;flex-wrap:wrap;gap:0.5rem;padding:1.25rem}
        .up-slink{background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;border-radius:6px;padding:0.5rem 0.875rem;font-size:0.8rem;text-decoration:none;transition:all 0.2s}
        .up-slink:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .up-dealer-link{display:flex;align-items:center;gap:1rem;padding:1.25rem;text-decoration:none;transition:background 0.15s}
        .up-dealer-link:hover{background:#FFF7ED}
        .up-dealer-logo{width:56px;height:56px;border-radius:10px;overflow:hidden;background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.3);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.4rem;color:#F47B20;flex-shrink:0}
        .up-dealer-logo img{width:100%;height:100%;object-fit:cover}
        .up-dealer-name{font-weight:700;font-size:1rem;color:#1A1A1A}
        .up-dealer-loc{font-size:0.78rem;color:#737373}
        .up-dealer-cta{font-size:0.75rem;color:#F47B20;margin-top:0.2rem}
        .up-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:1rem;padding:1.25rem}
        .up-stat{background:#F5F5F5;border-radius:8px;padding:1rem;text-align:center}
        .up-stat-val{font-family:var(--font-display);font-size:1.75rem;color:#F47B20}
        .up-stat-label{font-size:0.7rem;color:#737373;margin-top:0.25rem}
        @media(max-width:640px){
          .up-hero-bg{height:80px}
          .up-avatar{width:75px;height:75px;font-size:1.75rem}
          .up-hero-body{padding:0 1rem 1rem;gap:0.875rem;margin-top:-35px}
          .up-name{font-size:1.35rem}
          .up-body{padding:1rem}
        }
      `}</style>
    </div>
  );
}
