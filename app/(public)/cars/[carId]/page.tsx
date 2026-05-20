"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params?.carId as string;
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [replyTo, setReplyTo] = useState<string|null>(null);
  const [replyText, setReplyText] = useState("");
  const [startingMsg, setStartingMsg] = useState(false);
  const [lightbox, setLightbox] = useState<string|null>(null);

  useEffect(() => {
    if (!carId) return;
    const load = async () => {
      try {
        const ep = isAdmin ? `/api/v1/cars/${carId}` : `/api/v1/public/cars/${carId}`;
        const [carRes, commentRes] = await Promise.all([
          api.get(ep),
          api.get(`/api/v1/public/cars/${carId}/comments`).catch(()=>({ data:{ comments:[] } })),
        ]);
        setCar(carRes.data);
        setLikeCount(carRes.data.likeCount || 0);
        setComments(commentRes.data.comments || []);
        if (isAuthenticated) {
          try {
            const lr = await api.get(`/api/v1/public/cars/${carId}/likes/me`);
            setLiked(lr.data.liked); setFavorited(lr.data.favorited);
          } catch {}
        }
      } catch { } finally { setLoading(false); }
    };
    load();
  }, [carId, isAuthenticated, isAdmin]);

  const handleLike = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    try {
      const r = await api.post(`/api/v1/public/cars/${carId}/like`);
      setLiked(r.data.liked);
      setLikeCount(c => r.data.liked ? c+1 : Math.max(0,c-1));
    } catch {}
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    try {
      if (favorited) { await api.delete(`/api/v1/public/cars/${carId}/favorite`); setFavorited(false); }
      else { await api.post(`/api/v1/public/cars/${carId}/favorite`); setFavorited(true); }
    } catch {}
  };

  // Message dealer — opens conversation with car context card shown
  // Does NOT auto-send — user drafts their own message (like WhatsApp status reply)
  const handleMessageDealer = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!car?.dealer) { alert("Dealer contact not available."); return; }
    setStartingMsg(true);
    try {
      let dealerUserId = car.dealer?.userId || car.dealer?.ownerUserId || null;
      if (!dealerUserId && car.dealer?.dealerId) {
        try {
          const dr = await api.get(`/api/v1/public/dealers/${car.dealer.dealerId}`);
          dealerUserId = dr.data?.userId || dr.data?.ownerUserId || null;
        } catch {}
      }
      if (!dealerUserId) { alert("Could not find dealer. Try WhatsApp or Call instead."); return; }

      // Start conversation with clean payload context card attributes
      const r = await api.post("/api/v1/messages/start", {
        receiverId: dealerUserId,
        carId: car.carId,
        carBrand: car.brand,
        carModel: car.model,
        carYear: car.year,
        carImage: car.images?.[0] || null,
        carPrice: car.sellingPrice,
      });

      const convId = r.data?.conversationId;
      const msgPaths: Record<string,string> = {
        DEALER_ADMIN: "/dashboard/dealer/messages",
        DEALER_STAFF: "/dashboard/staff/messages",
        PARTNER_USER: "/dashboard/partner/messages",
        SYSTEM_ADMIN: "/dashboard/super-admin/messages",
      };
      const path = msgPaths[user?.role||""] || "/dashboard/user/messages";
      
      // Pass safe context variables dynamically down to targeted path
      router.push(convId ? `${path}?conv=${convId}&carId=${car.carId}&carImg=${encodeURIComponent(car.images?.[0]||"")}` : path);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Could not start chat. Please use WhatsApp or Call.");
    } finally { setStartingMsg(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const r = await api.post(`/api/v1/public/cars/${carId}/comments`, { text: commentText });
      setComments(p => [r.data, ...p]); setCommentText("");
    } catch {} finally { setSubmittingComment(false); }
  };

  const handleReply = async (commentId: string) => {
    if (!isAuthenticated || !replyText.trim()) return;
    try {
      await api.post(`/api/v1/public/cars/${carId}/comments/${commentId}/reply`, { text: replyText });
      const r = await api.get(`/api/v1/public/cars/${carId}/comments`);
      setComments(r.data.comments || []);
      setReplyTo(null); setReplyText("");
    } catch {}
  };

  const handleAdminDeleteCar = async () => {
    if (!confirm("Remove this car from the platform?")) return;
    try { await api.delete(`/api/v1/cars/${carId}`); router.push("/feed"); }
    catch(e:any) { alert(e.response?.data?.detail || "Delete failed"); }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) { navigator.share({ title:`${car?.brand} ${car?.model}`, url }); }
    else { navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;
  const fmtTime = (iso: string) => {
    const d = Date.now() - new Date(iso).getTime(); const m = Math.floor(d/60000);
    return m<1?"just now":m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:new Date(iso).toLocaleDateString();
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"32px",height:"32px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!car) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"5rem 1rem",textAlign:"center",minHeight:"100vh",background:"#F5F5F5",justifyContent:"center"}}>
      <div style={{fontSize:"3rem"}}>🚗</div>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Car not found</h2>
      <Link href="/feed" style={{color:"#F47B20",fontWeight:600}}>← Back to feed</Link>
    </div>
  );

  return (
    <div className="cd-page">
      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>✕</button>
          <img src={lightbox} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"92vw",maxHeight:"90vh",objectFit:"contain",borderRadius:"8px"}}/>
        </div>
      )}

      {/* Topbar */}
      <header className="cd-topbar">
        <button className="cd-back" onClick={()=>router.back()}>← Back</button>
        <div className="cd-topbar-right">
          <button className={`cd-action ${liked?"liked":""}`} onClick={handleLike}>{liked?"♥":"♡"} {likeCount}</button>
          <button className={`cd-action ${favorited?"faved":""}`} onClick={handleFavorite}>{favorited?"★ Saved":"☆ Save"}</button>
          <button className="cd-action" onClick={handleShare}>Share</button>
          {isAdmin && <button className="cd-action cd-del" onClick={handleAdminDeleteCar}>🗑</button>}
        </div>
      </header>

      <div className="cd-body">
        {/* Gallery */}
        <div className="cd-gallery">
          <div className="cd-main-img" onClick={()=>car.images?.[activeImage]&&setLightbox(car.images[activeImage])}>
            {car.images?.[0]
              ? <img src={car.images[activeImage]} alt={`${car.brand} ${car.model}`} />
              : <div className="cd-no-img">🚗</div>
            }
            {car.status !== "available" && (
              <div className={`cd-status-overlay ${car.status}`}>{car.status.replace(/_/g," ").toUpperCase()}</div>
            )}
            {car.images?.length > 1 && (
              <div className="cd-img-count">{activeImage+1}/{car.images.length} · tap to zoom</div>
            )}
          </div>
          {car.images?.length > 1 && (
            <div className="cd-thumbs">
              {car.images.map((img: string, i: number) => (
                <div key={i} className={`cd-thumb ${activeImage===i?"active":""}`} onClick={()=>setActiveImage(i)}>
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          )}
          {car.video && (
            <div className="cd-video-wrap">
              <video src={car.video} controls className="cd-video" />
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="cd-right">
          {/* Car info */}
          <div className="cd-info-card">
            <div className="cd-badges">
              <span className={`cd-status-badge ${car.status}`}>{car.status?.replace(/_/g," ")}</span>
              <span className="cd-carid">{car.carId}</span>
            </div>
            <h1 className="cd-car-title">{car.brand} {car.model}</h1>
            <div className="cd-car-meta">{car.year} · {car.color} · {car.condition}</div>
            <div className="cd-price-row">
              <div className="cd-price">{fmt(car.sellingPrice)}</div>
              {car.promoPrice && car.promoPrice < car.sellingPrice && (
                <div className="cd-promo">Promo: {fmt(car.promoPrice)}</div>
              )}
            </div>
            <div className="cd-specs">
              {[
                ["Mileage", car.mileage ? `${(car.mileage||0).toLocaleString()} km` : "N/A"],
                ["Transmission", car.transmission||"N/A"],
                ["Fuel Type", car.fuelType||"N/A"],
                ["Engine", car.engineType||"N/A"],
                ["Location", car.city ? `${car.city}, ${car.state}` : (car.state||"N/A")],
                ["VIN", car.vin||"N/A"],
              ].map(([l,v])=>(
                <div key={l} className="cd-spec">
                  <span className="cd-spec-label">{l}</span>
                  <span className="cd-spec-val">{v}</span>
                </div>
              ))}
            </div>
            {car.description && (
              <div className="cd-desc">
                <div className="cd-desc-label">Description</div>
                <p className="cd-desc-text">{car.description}</p>
              </div>
            )}
          </div>

          {/* Dealer card */}
          {car.dealer && (
            <div className="cd-dealer-card">
              <Link href={`/dealers/${car.dealer.dealerId}`} className="cd-dealer-top">
                <div className="cd-dealer-logo">
                  {car.dealer.logo
                    ? <img src={car.dealer.logo} alt="" />
                    : <span>{car.dealer.companyName?.charAt(0)||"D"}</span>
                  }
                </div>
                <div className="cd-dealer-info">
                  <div className="cd-dealer-name">{car.dealer.companyName}</div>
                  <div className="cd-dealer-loc">{car.dealer.city||"N/A"}, {car.dealer.state||"N/A"}</div>
                  <span className="cd-dealer-cta">View all vehicles from this dealer →</span>
                </div>
              </Link>

              {car.status === "available" && (
                <div className="cd-contact-wrap">
                  {isAuthenticated ? (
                    <button className="cd-msg-btn" onClick={handleMessageDealer} disabled={startingMsg}>
                      {startingMsg ? "Opening chat..." : "💬 Message Dealer"}
                    </button>
                  ) : (
                    <Link href={`/login?redirect=/cars/${carId}`} className="cd-msg-btn" style={{textAlign:"center",display:"block",textDecoration:"none"}}>
                      💬 Sign in to Message Dealer
                    </Link>
                  )}
                  <button className="cd-toggle-btn" onClick={()=>setShowContact(!showContact)}>
                    {showContact ? "Hide Contact Info" : "📞 Show Phone & WhatsApp"}
                  </button>
                  {showContact && (
                    <div className="cd-contact-btns">
                      {car.dealer.phone && <a href={`tel:${car.dealer.phone}`} className="cd-cta phone">📞 Call</a>}
                      {car.dealer.whatsapp && (
                        <a href={`https://wa.me/${car.dealer.whatsapp}?text=Hi, I am interested in your ${car.brand} ${car.model} ${car.year} (${car.carId}). Is it still available?`}
                          target="_blank" rel="noreferrer" className="cd-cta wa">💬 WhatsApp</a>
                      )}
                      {car.dealer.email && <a href={`mailto:${car.dealer.email}`} className="cd-cta email">✉ Email</a>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="cd-comments">
        <h2 className="cd-comments-title">COMMENTS ({comments.length})</h2>
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="cd-comment-form">
            <div className="cd-comment-avatar">{user?.fullName?.charAt(0).toUpperCase()||"U"}</div>
            <div className="cd-comment-input-row">
              <textarea className="cd-comment-input" placeholder="Write a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} rows={2} />
              <button type="submit" className="cd-comment-send" disabled={submittingComment||!commentText.trim()}>
                {submittingComment?"...":"Post"}
              </button>
            </div>
          </form>
        ) : (
          <div className="cd-login-prompt">
            <Link href="/login" className="cd-login-link">Sign in to comment, like and save cars</Link>
          </div>
        )}
        <div className="cd-comments-list">
          {comments.length === 0
            ? <div className="cd-no-comments">Be the first to comment</div>
            : comments.map((c)=>(
              <div key={c._id} className="cd-comment">
                <Link href={`/users/${c.userId}`} className="cd-comment-av">{c.userName?.charAt(0)||"?"}</Link>
                <div className="cd-comment-body">
                  <div className="cd-comment-hdr">
                    <Link href={`/users/${c.userId}`} className="cd-comment-author">{c.userName}</Link>
                    <span className="cd-comment-time">{fmtTime(c.createdAt)}</span>
                    {(isAdmin||(user&&c.userId===user.userId)) && (
                      <button className="cd-del-comment" onClick={async()=>{
                        try { await api.delete(`/api/v1/public/cars/${carId}/comments/${c.commentId}`); setComments(p=>p.filter(x=>x.commentId!==c.commentId)); } catch {}
                      }}>✕</button>
                    )}
                  </div>
                  <div className="cd-comment-text">{c.text}</div>
                  {c.replies?.length > 0 && (
                    <div className="cd-replies">
                      {c.replies.map((r: any)=>(
                        <div key={r.replyId} className="cd-reply">
                          <Link href={`/users/${r.userId}`} className="cd-reply-av">{r.userName?.charAt(0)||"?"}</Link>
                          <div><Link href={`/users/${r.userId}`} className="cd-reply-author">{r.userName}</Link><div className="cd-reply-text">{r.text}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isAuthenticated && (
                    <button className="cd-reply-btn" onClick={()=>setReplyTo(replyTo===c.commentId?null:c.commentId)}>Reply</button>
                  )}
                  {replyTo===c.commentId && (
                    <div className="cd-reply-form">
                      <input className="cd-reply-input" placeholder="Write a reply..." value={replyText} onChange={e=>setReplyText(e.target.value)} />
                      <button className="cd-reply-send" onClick={()=>handleReply(c.commentId)} disabled={!replyText.trim()}>Post</button>
                      <button className="cd-reply-cancel" onClick={()=>setReplyTo(null)}>✕</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <style>{`
        .cd-page{min-height:100vh;background:#F5F5F5;color:#1A1A1A;font-family:var(--font-body);overflow-x:hidden;max-width:100vw}
        .cd-topbar{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.25rem;background:#fff;border-bottom:1.5px solid #E5E5E5;position:sticky;top:0;z-index:40;gap:0.5rem}
        .cd-back{background:none;border:none;color:#525252;font-size:0.95rem;cursor:pointer;font-family:var(--font-body);font-weight:600;padding:0.25rem 0}
        .cd-back:hover{color:#F47B20}
        .cd-topbar-right{display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap}
        .cd-action{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.4rem 0.875rem;font-size:0.82rem;cursor:pointer;color:#404040;transition:all 0.2s;font-family:var(--font-body);white-space:nowrap;font-weight:500}
        .cd-action:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .cd-action.liked{color:#DC2626;border-color:rgba(220,38,38,0.4);background:rgba(220,38,38,0.06);font-weight:700}
        .cd-action.faved{color:#F47B20;border-color:rgba(244,123,32,0.4);background:#FFF7ED;font-weight:700}
        .cd-del{color:#DC2626!important;border-color:rgba(220,38,38,0.3)!important}
        .cd-body{display:grid;grid-template-columns:1fr 380px;gap:1.5rem;padding:1.5rem;max-width:1280px;margin:0 auto;align-items:start;box-sizing:border-box;width:100%}
        .cd-gallery{display:flex;flex-direction:column;gap:0.75rem;min-width:0;overflow:hidden}
        .cd-main-img{aspect-ratio:16/10;border-radius:14px;overflow:hidden;position:relative;background:#E5E5E5;display:flex;align-items:center;justify-content:center;cursor:zoom-in;width:100%;max-width:100%;box-sizing:border-box}
        .cd-main-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
        .cd-main-img:hover img{transform:scale(1.02)}
        .cd-no-img{font-size:3rem;opacity:0.2}
        .cd-status-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.75rem;letter-spacing:0.2em;background:rgba(0,0,0,0.45);color:#fff}
        .cd-img-count{position:absolute;bottom:0.625rem;right:0.75rem;background:rgba(0,0,0,0.6);color:#fff;font-size:0.7rem;padding:0.2rem 0.5rem;border-radius:4px}
        .cd-thumbs{display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin;-webkit-overflow-scrolling:touch;max-width:100%;}
        .cd-thumb{width:76px;height:58px;border-radius:8px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;flex-shrink:0;transition:border-color 0.2s}
        .cd-thumb.active{border-color:#F47B20}
        .cd-thumb img{width:100%;height:100%;object-fit:cover;display:block}
        .cd-video-wrap{border-radius:12px;overflow:hidden;background:#1A1A1A}
        .cd-video{width:100%;max-height:300px;display:block}
        .cd-right{display:flex;flex-direction:column;gap:1rem;position:sticky;top:76px}
        .cd-info-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:14px;padding:1.5rem;display:flex;flex-direction:column;gap:0.875rem}
        .cd-badges{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
        .cd-status-badge{padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:700;text-transform:capitalize;background:#F0FDF4;color:#16A34A;border:1px solid rgba(22,163,74,0.3)}
        .cd-status-badge.sold{background:#F5F5F5;color:#737373;border-color:#E5E5E5}
        .cd-status-badge.reserved{background:#FFF7ED;color:#D97706;border-color:rgba(217,119,6,0.3)}
        .cd-carid{font-size:0.7rem;color:#A3A3A3;font-family:monospace;background:#F5F5F5;padding:0.2rem 0.5rem;border-radius:4px}
        .cd-car-title{font-family:var(--font-display);font-size:clamp(1.6rem,2.5vw,2.1rem);letter-spacing:0.04em;color:#1A1A1A;line-height:1.05}
        .cd-car-meta{font-size:0.9rem;color:#737373;text-transform:capitalize;font-weight:500}
        .cd-price-row{display:flex;align-items:baseline;gap:0.875rem;flex-wrap:wrap}
        .cd-price{font-family:var(--font-display);font-size:clamp(1.6rem,3vw,2rem);color:#F47B20;letter-spacing:0.03em}
        .cd-promo{font-size:0.875rem;color:#16A34A;font-weight:700}
        .cd-specs{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .cd-spec{display:flex;flex-direction:column;gap:0.18rem;padding:0.6rem 0.75rem;background:#F5F5F5;border-radius:8px}
        .cd-spec-label{font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#A3A3A3}
        .cd-spec-val{font-size:0.9rem;color:#1A1A1A;font-weight:600;text-transform:capitalize}
        .cd-desc{display:flex;flex-direction:column;gap:0.35rem;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        .cd-desc-label{font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A3A3A3}
        .cd-desc-text{font-size:0.9rem;color:#404040;line-height:1.7}
        .cd-dealer-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:14px;overflow:hidden}
        .cd-dealer-top{display:flex;align-items:center;gap:1rem;padding:1.25rem;text-decoration:none;transition:background 0.15s;border-bottom:1px solid #F0F0F0}
        .cd-dealer-top:hover{background:#FFF7ED}
        .cd-dealer-logo{width:52px;height:52px;border-radius:10px;overflow:hidden;background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.3);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.3rem;color:#F47B20;flex-shrink:0}
        .cd-dealer-logo img{width:100%;height:100%;object-fit:cover}
        .cd-dealer-name{font-size:1rem;font-weight:700;color:#1A1A1A}
        .cd-dealer-loc{font-size:0.8rem;color:#737373;margin-top:0.1rem}
        .cd-dealer-cta{font-size:0.75rem;color:#F47B20;margin-top:0.25rem;font-weight:600}
        .cd-contact-wrap{display:flex;flex-direction:column;gap:0.625rem;padding:1.25rem}
        .cd-msg-btn{background:#1A1A1A;color:#fff;border:none;border-radius:10px;padding:0.875rem;font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.1em;cursor:pointer;width:100%;transition:background 0.2s;font-weight:700}
        .cd-msg-btn:hover{background:#F47B20}
        .cd-msg-btn:disabled{opacity:0.6;cursor:not-allowed}
        .cd-toggle-btn{background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.3);color:#C4621A;border-radius:10px;padding:0.75rem;width:100%;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;font-weight:600;transition:all 0.2s}
        .cd-toggle-btn:hover{background:#F47B20;color:#fff;border-color:#F47B20}
        .cd-contact-btns{display:flex;gap:0.5rem;flex-wrap:wrap}
        .cd-cta{flex:1;min-width:80px;padding:0.7rem 0.5rem;border-radius:8px;font-size:0.82rem;font-weight:600;text-align:center;text-decoration:none;border:none;display:block;transition:all 0.2s}
        .cd-cta.phone{background:rgba(59,139,212,0.1);color:#3B8BD4;border:1.5px solid rgba(59,139,212,0.3)}
        .cd-cta.phone:hover{background:#3B8BD4;color:#fff}
        .cd-cta.wa{background:rgba(22,163,74,0.1);color:#16A34A;border:1.5px solid rgba(22,163,74,0.3)}
        .cd-cta.wa:hover{background:#16A34A;color:#fff}
        .cd-cta.email{background:rgba(244,123,32,0.08);color:#F47B20;border:1.5px solid rgba(244,123,32,0.3)}
        .cd-cta.email:hover{background:#F47B20;color:#fff}
        .cd-comments{max-width:1280px;margin:0 auto;padding:0 1.5rem 3rem}
        .cd-comments-title{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.12em;color:#737373;margin-bottom:1.25rem}
        .cd-login-prompt{padding:1.25rem;background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;text-align:center;margin-bottom:1.25rem}
        .cd-login-link{color:#F47B20;text-decoration:none;font-size:0.9rem;font-weight:600}
        .cd-comment-form{display:flex;gap:0.75rem;margin-bottom:1.5rem;align-items:flex-start}
        .cd-comment-avatar{width:40px;height:40px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
        .cd-comment-input-row{flex:1;display:flex;gap:0.5rem;align-items:flex-end}
        .cd-comment-input{flex:1;background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:0.75rem 1rem;color:#1A1A1A;font-size:0.9rem;font-family:var(--font-body);outline:none;resize:none;transition:border-color 0.2s;line-height:1.5}
        .cd-comment-input:focus{border-color:#F47B20}
        .cd-comment-send{background:#F47B20;color:#fff;border:none;border-radius:8px;padding:0.65rem 1rem;font-family:var(--font-display);font-size:0.875rem;cursor:pointer;white-space:nowrap}
        .cd-comment-send:disabled{opacity:0.5;cursor:not-allowed}
        .cd-no-comments{text-align:center;padding:2rem;color:#A3A3A3;font-size:0.9rem}
        .cd-comments-list{display:flex;flex-direction:column;gap:1.25rem}
        .cd-comment{display:flex;gap:0.75rem}
        .cd-comment-av{width:36px;height:36px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.9rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-decoration:none;transition:background 0.15s}
        .cd-comment-av:hover{background:#F47B20;color:#fff}
        .cd-comment-body{flex:1;display:flex;flex-direction:column;gap:0.4rem}
        .cd-comment-hdr{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
        .cd-comment-author{font-size:0.9rem;font-weight:700;color:#1A1A1A;text-decoration:none}
        .cd-comment-author:hover{color:#F47B20}
        .cd-comment-time{font-size:0.72rem;color:#A3A3A3}
        .cd-del-comment{background:none;border:none;color:#A3A3A3;cursor:pointer;font-size:0.82rem;margin-left:auto}
        .cd-del-comment:hover{color:#DC2626}
        .cd-comment-text{font-size:0.9rem;color:#404040;line-height:1.6}
        .cd-replies{margin-top:0.5rem;padding-left:1rem;border-left:2.5px solid #E5E5E5;display:flex;flex-direction:column;gap:0.625rem}
        .cd-reply{display:flex;gap:0.5rem;align-items:flex-start}
        .cd-reply-av{width:26px;height:26px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-decoration:none}
        .cd-reply-av:hover{background:#F47B20;color:#fff}
        .cd-reply-author{font-size:0.8rem;font-weight:700;color:#1A1A1A;text-decoration:none;display:block}
        .cd-reply-author:hover{color:#F47B20}
        .cd-reply-text{font-size:0.825rem;color:#525252;line-height:1.55}
        .cd-reply-btn{background:none;border:none;color:#A3A3A3;cursor:pointer;font-size:0.78rem;font-family:var(--font-body);font-weight:600;padding:0}
        .cd-reply-btn:hover{color:#F47B20}
        .cd-reply-form{display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap}
        .cd-reply-input{flex:1;min-width:120px;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.55rem 0.875rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none}
        .cd-reply-input:focus{border-color:#F47B20}
        .cd-reply-send{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.45rem 0.875rem;font-size:0.8rem;cursor:pointer;font-family:var(--font-display)}
        .cd-reply-send:disabled{opacity:0.5;cursor:not-allowed}
        .cd-reply-cancel{background:transparent;border:1.5px solid #E5E5E5;color:#737373;border-radius:6px;padding:0.45rem 0.75rem;font-size:0.8rem;cursor:pointer}
        @media(max-width:960px){.cd-body{grid-template-columns:1fr}.cd-right{position:static;min-width:0}.cd-contact-btns{grid-template-columns:1fr 1fr}.cd-gallery{max-width:100%;overflow:hidden}}
        @media(max-width:640px){.cd-topbar{padding:0.75rem 1rem}.cd-body{padding:0.75rem;gap:1rem}.cd-comments{padding:0 0.75rem 3rem}.cd-specs{grid-template-columns:1fr}.cd-main-img{aspect-ratio:4/3}.cd-right{min-width:0}.cd-info-card{padding:1rem}.cd-car-title{font-size:1.4rem}}
        @media(max-width:480px){.cd-body{padding:0.5rem}.cd-topbar-right{gap:0.25rem}.cd-action{padding:0.35rem 0.6rem;font-size:0.75rem}}
      `}</style>
    </div>
  );
}
