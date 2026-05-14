"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId  = params?.carId as string;
  const { user, isAuthenticated } = useAuthStore();

  const [car, setCar]                   = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [activeImage, setActiveImage]   = useState(0);
  const [liked, setLiked]               = useState(false);
  const [favorited, setFavorited]       = useState(false);
  const [likeCount, setLikeCount]       = useState(0);
  const [comments, setComments]         = useState<any[]>([]);
  const [commentText, setCommentText]   = useState("");
  const [submittingComment, setSubmitting] = useState(false);
  const [showContact, setShowContact]   = useState(false);
  const [replyTo, setReplyTo]           = useState<string|null>(null);
  const [replyText, setReplyText]       = useState("");
  const [startingMsg, setStartingMsg]   = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isAdmin = user?.role === "SYSTEM_ADMIN";

  useEffect(() => {
    if (!carId) return;
    (async () => {
      try {
        const [carRes, commentRes] = await Promise.all([
          api.get(`/api/v1/public/cars/${carId}`),
          api.get(`/api/v1/public/cars/${carId}/comments`),
        ]);
        setCar(carRes.data);
        setLikeCount(carRes.data.likeCount || 0);
        setComments(commentRes.data.comments || []);
        if (isAuthenticated) {
          try {
            const lr = await api.get(`/api/v1/public/cars/${carId}/likes/me`);
            setLiked(lr.data.liked);
            setFavorited(lr.data.favorited);
          } catch {}
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [carId, isAuthenticated]);

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
      else           { await api.post(`/api/v1/public/cars/${carId}/favorite`);   setFavorited(true);  }
    } catch {}
  };

  const handleMessageDealer = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setStartingMsg(true);
    try {
      // The public car endpoint may not include dealer.userId directly.
      // Strategy: get dealer profile to find the userId.
      let dealerUserId: string | null = null;

      // Option 1: userId directly in car.dealer
      if (car.dealer?.userId) {
        dealerUserId = car.dealer.userId;
      }

      // Option 2: fetch dealer by dealerId to get userId
      if (!dealerUserId && car.dealer?.dealerId) {
        try {
          const dealerRes = await api.get(`/api/v1/public/dealers/${car.dealer.dealerId}`);
          dealerUserId = dealerRes.data?.userId || dealerRes.data?.ownerUserId || null;
        } catch {}
      }

      // Option 3: dealer _id is stored as MongoDB ObjectId string → use as receiverId
      if (!dealerUserId && car.dealer?._id) {
        dealerUserId = car.dealer._id;
      }

      if (!dealerUserId) {
        alert("Could not find dealer contact. Please use the phone or WhatsApp button instead.");
        return;
      }

      await api.post("/api/v1/messages/start", {
        receiverId: dealerUserId,
        message: `Hi, I am interested in your ${car.brand} ${car.model} ${car.year} (${car.carId}). Is it still available?`,
      });

      // Redirect to messages — works for all roles
      if (user?.role === "DEALER_ADMIN") router.push("/dashboard/dealer/messages");
      else if (user?.role === "DEALER_STAFF") router.push("/dashboard/staff/messages");
      else if (user?.role === "PARTNER_USER") router.push("/dashboard/partner/messages");
      else router.push("/dashboard/user/messages");
    } catch (e: any) {
      alert(e.response?.data?.detail || "Could not start conversation. Try again.");
    } finally { setStartingMsg(false); }
  };

  const handleAdminDeleteCar = async () => {
    if (!window.confirm("Delete this vehicle listing? This cannot be undone.")) return;
    try { await api.delete(`/api/v1/admin/cars/${carId}`); router.push("/feed"); }
    catch (e: any) { alert(e.response?.data?.detail || "Delete failed"); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/api/v1/public/cars/${carId}/comments`, { text: commentText });
      setComments(p => [r.data, ...p]); setCommentText("");
    } catch {} finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const ep = isAdmin
        ? `/api/v1/admin/cars/${carId}/comments/${commentId}`
        : `/api/v1/public/cars/${carId}/comments/${commentId}`;
      await api.delete(ep);
      setComments(p => p.filter(c => c.commentId !== commentId));
    } catch {}
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

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title:`${car?.brand} ${car?.model}`, url });
    else { navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  const prev = () => setActiveImage(i => i===0 ? car.images.length-1 : i-1);
  const next = () => setActiveImage(i => i===car.images.length-1 ? 0 : i+1);
  const fmt      = (n: number) => `₦${(n||0).toLocaleString()}`;
  const fmtTime  = (iso: string) => {
    const d = Date.now()-new Date(iso).getTime(); const m = Math.floor(d/60000);
    return m<1?"just now":m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:new Date(iso).toLocaleDateString();
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5"}}>
      <div style={{width:"32px",height:"32px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!car) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"4rem",textAlign:"center",minHeight:"100vh",background:"#F5F5F5",justifyContent:"center"}}>
      <h2 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Vehicle not found</h2>
      <Link href="/feed" style={{color:"#F47B20",textDecoration:"none"}}>← Back to feed</Link>
    </div>
  );

  return (
    <div className="car-detail">
      <header className="detail-topbar">
        <button className="back-btn" onClick={()=>router.back()}>← Back</button>
        <div className="topbar-actions">
          <button className={`action-btn ${liked?"liked":""}`} onClick={handleLike}>{liked?"♥":"♡"} {likeCount}</button>
          <button className={`action-btn ${favorited?"faved":""}`} onClick={handleFavorite}>{favorited?"★ Saved":"☆ Save"}</button>
          <button className="action-btn" onClick={handleShare}>Share</button>
          {isAdmin && <button className="action-btn admin-del" onClick={handleAdminDeleteCar}>🗑 Remove</button>}
        </div>
      </header>

      <div className="detail-body">
        <div className="gallery">
          <div className="main-img-wrap">
            {car.images?.length > 0 ? (
              <>
                <img src={car.images[activeImage]} alt="" className="main-img" onClick={()=>setLightboxOpen(true)}/>
                {car.images.length > 1 && (
                  <>
                    <button className="img-arrow left" onClick={prev}>‹</button>
                    <button className="img-arrow right" onClick={next}>›</button>
                    <div className="img-counter">{activeImage+1} / {car.images.length}</div>
                  </>
                )}
              </>
            ) : <div className="no-img">No Image</div>}
            {car.status !== "available" && (
              <div className={`sold-overlay ${car.status}`}>{car.status.replace(/_/g," ").toUpperCase()}</div>
            )}
          </div>

          {car.images?.length > 1 && (
            <div className="thumb-row">
              {car.images.map((img:string,i:number)=>(
                <button key={i} className={`thumb ${activeImage===i?"active":""}`} onClick={()=>setActiveImage(i)}>
                  <img src={img} alt=""/>
                </button>
              ))}
            </div>
          )}
          {car.video && <div className="video-section"><video src={car.video} controls className="car-video"/></div>}
        </div>

        <div className="detail-right">
          <div className="car-info-card">
            <div className="car-badge">
              <span className={`status-pill ${car.status}`}>{car.status?.replace(/_/g," ")}</span>
              <span className="car-id-badge">{car.carId}</span>
            </div>
            <h1 className="car-title">{car.brand} {car.model}</h1>
            <div className="car-sub">{car.year} · {car.color} · {car.condition}</div>
            <div className="price-section">
              <div className="price-main">{fmt(car.sellingPrice)}</div>
              {car.promoPrice && car.promoPrice < car.sellingPrice && (
                <div className="price-promo">Promo: {fmt(car.promoPrice)}</div>
              )}
            </div>
            <div className="specs-grid">
              {[
                {label:"Mileage",    value:car.mileage?`${car.mileage?.toLocaleString()} km`:"N/A"},
                {label:"Transmission",value:car.transmission||"N/A"},
                {label:"Fuel Type",  value:car.fuelType||"N/A"},
                {label:"Engine",     value:car.engineType||"N/A"},
                {label:"Location",   value:car.city?`${car.city}, ${car.state}`:(car.state||"N/A")},
                {label:"VIN",        value:car.vin||"N/A"},
              ].map(s=>(
                <div key={s.label} className="spec-item">
                  <span className="spec-label">{s.label}</span>
                  <span className="spec-val">{s.value}</span>
                </div>
              ))}
            </div>
            {car.description && (
              <div className="car-desc">
                <div className="desc-label">Description</div>
                <p className="desc-text">{car.description}</p>
              </div>
            )}
          </div>

          {car.dealer && (
            <div className="dealer-card">
              <Link href={`/dealers/${car.dealer.dealerId}`} className="dealer-top">
                <div className="dealer-logo">
                  {car.dealer.logo
                    ? <img src={car.dealer.logo} alt=""/>
                    : <span>{car.dealer.companyName?.charAt(0)}</span>}
                </div>
                <div className="dealer-info">
                  <div className="dealer-name">{car.dealer.companyName}</div>
                  <div className="dealer-loc">{car.dealer.city||"N/A"}, {car.dealer.state||"N/A"}</div>
                  <span className="view-dealer">View all vehicles from this dealer →</span>
                </div>
                {car.dealer.qrCode && <img src={car.dealer.qrCode} alt="QR" className="dealer-qr-mini"/>}
              </Link>

              {car.status==="available" && (
                <div className="contact-section">
                  {isAuthenticated && user?.role !== "DEALER_ADMIN" && user?.role !== "DEALER_STAFF" && (
                    <button className="msg-dealer-btn" onClick={handleMessageDealer} disabled={startingMsg}>
                      {startingMsg?"Opening chat...":"💬 Message Dealer"}
                    </button>
                  )}
                  <button className="contact-toggle" onClick={()=>setShowContact(!showContact)}>
                    {showContact?"Hide Contact":"Show Phone / WhatsApp"}
                  </button>
                  {showContact && (
                    <div className="contact-buttons">
                      {car.dealer.phone && <a href={`tel:${car.dealer.phone}`} className="cta-btn phone">📞 Call</a>}
                      {car.dealer.whatsapp && (
                        <a href={`https://wa.me/${car.dealer.whatsapp}?text=Hi, I am interested in your ${car.brand} ${car.model} ${car.year} (${car.carId}). Is it still available?`}
                          target="_blank" rel="noreferrer" className="cta-btn whatsapp">💬 WhatsApp</a>
                      )}
                      {car.dealer.email && <a href={`mailto:${car.dealer.email}`} className="cta-btn email">✉ Email</a>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="comments-section">
        <h2 className="comments-title">COMMENTS ({comments.length})</h2>
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="comment-form">
            <div className="comment-avatar">{user?.fullName?.charAt(0).toUpperCase()||"U"}</div>
            <div className="comment-input-wrap">
              <textarea className="comment-input" placeholder="Write a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} rows={2}/>
              <button type="submit" className="comment-submit" disabled={submittingComment||!commentText.trim()}>{submittingComment?"...":"Post"}</button>
            </div>
          </form>
        ) : (
          <div className="login-prompt"><Link href="/login" className="login-link">Sign in to comment, like, and save vehicles</Link></div>
        )}
        <div className="comments-list">
          {comments.length===0
            ? <div className="no-comments">Be the first to comment</div>
            : comments.map(c=>(
                <div key={c._id} className="comment-item">
                  <div className="comment-avatar-sm">{c.userName?.charAt(0).toUpperCase()||"?"}</div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <Link href={`/users/${c.userId}`} className="comment-author">{c.userName}</Link>
                      <span className="comment-time">{fmtTime(c.createdAt)}</span>
                      {(isAdmin||(user&&c.userId===user.userId)) && (
                        <button className="delete-comment" onClick={()=>handleDeleteComment(c.commentId)}>✕</button>
                      )}
                    </div>
                    <div className="comment-text">{c.text}</div>
                    {c.replies?.length>0&&(
                      <div className="replies">
                        {c.replies.map((r:any)=>(
                          <div key={r.replyId} className="reply">
                            <div className="reply-avatar">{r.userName?.charAt(0)||"?"}</div>
                            <div>
                              <Link href={`/users/${r.userId}`} className="reply-author">{r.userName}</Link>
                              <div className="reply-text">{r.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isAuthenticated&&(
                      <button className="reply-btn" onClick={()=>setReplyTo(replyTo===c.commentId?null:c.commentId)}>Reply</button>
                    )}
                    {replyTo===c.commentId&&(
                      <div className="reply-form">
                        <input className="reply-input" placeholder="Write a reply..." value={replyText} onChange={e=>setReplyText(e.target.value)}/>
                        <button className="reply-submit" onClick={()=>handleReply(c.commentId)} disabled={!replyText.trim()}>Post</button>
                        <button className="reply-cancel" onClick={()=>setReplyTo(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {lightboxOpen && car.images?.length>0 && (
        <div className="lightbox" onClick={()=>setLightboxOpen(false)}>
          <button className="lb-close">✕</button>
          <button className="lb-arrow left" onClick={e=>{e.stopPropagation();prev()}}>‹</button>
          <img src={car.images[activeImage]} alt="" className="lb-img" onClick={e=>e.stopPropagation()}/>
          <button className="lb-arrow right" onClick={e=>{e.stopPropagation();next()}}>›</button>
          <div className="lb-counter">{activeImage+1} / {car.images.length}</div>
        </div>
      )}

      <style>{`
        .car-detail{min-height:100vh;background:#F5F5F5;color:#1A1A1A;font-family:var(--font-body)}
        .detail-topbar{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.25rem;background:#fff;border-bottom:1.5px solid #E5E5E5;position:sticky;top:0;z-index:50;gap:0.5rem;flex-wrap:wrap}
        .back-btn{background:none;border:none;color:#737373;font-size:0.875rem;cursor:pointer;font-family:var(--font-body)}
        .back-btn:hover{color:#1A1A1A}
        .topbar-actions{display:flex;align-items:center;gap:0.375rem;flex-wrap:wrap}
        .action-btn{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.35rem 0.75rem;font-size:0.78rem;cursor:pointer;color:#525252;transition:all 0.2s;font-family:var(--font-body);white-space:nowrap}
        .action-btn:hover{border-color:#F47B20;color:#F47B20}
        .action-btn.liked{color:#DC2626;border-color:rgba(220,38,38,0.4);background:rgba(220,38,38,0.05)}
        .action-btn.faved{color:#F47B20;border-color:rgba(244,123,32,0.4);background:#FFF7ED}
        .action-btn.admin-del{color:#DC2626;border-color:rgba(220,38,38,0.3)}.action-btn.admin-del:hover{background:#FEF2F2}
        .detail-body{display:grid;grid-template-columns:1fr 360px;gap:1.25rem;padding:1.25rem;max-width:1200px;margin:0 auto;align-items:start}
        .gallery{display:flex;flex-direction:column;gap:0.75rem;min-width:0}
        .main-img-wrap{position:relative;width:100%;aspect-ratio:16/10;border-radius:12px;overflow:hidden;background:#E5E5E5;display:flex;align-items:center;justify-content:center}
        .main-img{width:100%;height:100%;object-fit:cover;cursor:pointer;display:block}
        .no-img{font-size:1rem;font-weight:600;color:#A3A3A3;letter-spacing:0.1em}
        .sold-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:2rem;letter-spacing:0.2em;background:rgba(0,0,0,0.45);color:#fff;pointer-events:none}
        .img-arrow{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2}
        .img-arrow.left{left:0.5rem}.img-arrow.right{right:0.5rem}
        .img-counter{position:absolute;bottom:0.625rem;right:0.75rem;background:rgba(0,0,0,0.5);color:#fff;font-size:0.7rem;padding:0.2rem 0.5rem;border-radius:20px}
        .thumb-row{display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
        .thumb-row::-webkit-scrollbar{height:0}
        .thumb{width:64px;height:48px;flex-shrink:0;border-radius:6px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;transition:border-color 0.2s;background:#E5E5E5;padding:0}
        .thumb.active{border-color:#F47B20}
        .thumb img{width:100%;height:100%;object-fit:cover;display:block}
        .video-section{border-radius:10px;overflow:hidden;background:#1A1A1A}
        .car-video{width:100%;max-height:280px;display:block}
        .detail-right{display:flex;flex-direction:column;gap:1rem;min-width:0}
        .car-info-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:0.875rem}
        .car-badge{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
        .status-pill{padding:0.2rem 0.6rem;border-radius:20px;font-size:0.68rem;font-weight:600;text-transform:capitalize}
        .status-pill.available{background:rgba(22,163,74,0.1);color:#16A34A;border:1px solid rgba(22,163,74,0.3)}
        .status-pill.sold{background:rgba(115,115,115,0.1);color:#737373;border:1px solid rgba(115,115,115,0.3)}
        .status-pill.reserved{background:rgba(217,119,6,0.1);color:#D97706;border:1px solid rgba(217,119,6,0.3)}
        .car-id-badge{font-family:var(--font-mono);font-size:0.68rem;color:#A3A3A3;background:#F5F5F5;padding:0.2rem 0.5rem;border-radius:4px}
        .car-title{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1.1}
        .car-sub{font-size:0.8rem;color:#737373;text-transform:capitalize}
        .price-section{display:flex;align-items:baseline;gap:1rem;flex-wrap:wrap}
        .price-main{font-family:var(--font-display);font-size:1.6rem;color:#F47B20;letter-spacing:0.03em}
        .price-promo{font-size:0.875rem;color:#16A34A;font-weight:600}
        .specs-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .spec-item{display:flex;flex-direction:column;gap:0.2rem;padding:0.5rem;background:#F5F5F5;border-radius:6px}
        .spec-label{font-size:0.63rem;text-transform:uppercase;letter-spacing:0.08em;color:#A3A3A3}
        .spec-val{font-size:0.8rem;color:#1A1A1A;text-transform:capitalize}
        .car-desc{display:flex;flex-direction:column;gap:0.4rem}
        .desc-label{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#A3A3A3}
        .desc-text{font-size:0.875rem;color:#525252;line-height:1.6}
        .dealer-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .dealer-top{display:flex;align-items:flex-start;gap:0.875rem;text-decoration:none;border-radius:8px;padding:0.5rem;margin:-0.5rem;transition:background 0.15s}
        .dealer-top:hover{background:#FFF7ED}
        .dealer-logo{width:44px;height:44px;border-radius:8px;background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.25);color:#F47B20;font-family:var(--font-display);font-size:1.1rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .dealer-logo img{width:100%;height:100%;object-fit:cover}
        .dealer-info{flex:1;display:flex;flex-direction:column;gap:0.2rem;min-width:0}
        .dealer-name{font-weight:700;font-size:0.9rem;color:#1A1A1A}
        .dealer-loc{font-size:0.75rem;color:#737373}
        .view-dealer{font-size:0.72rem;color:#F47B20}
        .dealer-qr-mini{width:44px;height:44px;border-radius:6px;border:1.5px solid #E5E5E5;flex-shrink:0}
        .contact-section{display:flex;flex-direction:column;gap:0.625rem}
        .msg-dealer-btn{background:#1A1A1A;color:#fff;border:none;border-radius:8px;padding:0.75rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;width:100%;transition:background 0.2s}
        .msg-dealer-btn:hover{background:#333}.msg-dealer-btn:disabled{opacity:0.6;cursor:not-allowed}
        .contact-toggle{background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.3);color:#C4621A;border-radius:8px;padding:0.7rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;width:100%}
        .contact-toggle:hover{background:#F47B20;color:#fff}
        .contact-buttons{display:flex;gap:0.5rem;flex-wrap:wrap}
        .cta-btn{flex:1;min-width:80px;padding:0.6rem 0.5rem;border-radius:6px;font-size:0.78rem;font-weight:500;text-align:center;text-decoration:none;cursor:pointer;border:none;display:block;transition:all 0.2s;white-space:nowrap}
        .cta-btn.phone{background:rgba(59,139,212,0.1);color:#3B8BD4;border:1.5px solid rgba(59,139,212,0.3)}.cta-btn.phone:hover{background:#3B8BD4;color:#fff}
        .cta-btn.whatsapp{background:rgba(22,163,74,0.1);color:#16A34A;border:1.5px solid rgba(22,163,74,0.3)}.cta-btn.whatsapp:hover{background:#16A34A;color:#fff}
        .cta-btn.email{background:rgba(244,123,32,0.08);color:#F47B20;border:1.5px solid rgba(244,123,32,0.3)}.cta-btn.email:hover{background:#F47B20;color:#fff}
        .comments-section{max-width:1200px;margin:0 auto;padding:0 1.25rem 3rem}
        .comments-title{font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.15em;color:#737373;margin-bottom:1.25rem}
        .login-prompt{padding:1rem;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;text-align:center;margin-bottom:1.25rem}
        .login-link{color:#F47B20;text-decoration:none;font-size:0.875rem}
        .comment-form{display:flex;gap:0.75rem;margin-bottom:1.5rem}
        .comment-avatar{width:34px;height:34px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:0.95rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .comment-input-wrap{flex:1;display:flex;gap:0.5rem;align-items:flex-end}
        .comment-input{flex:1;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.75rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;resize:none;transition:border-color 0.2s}
        .comment-input:focus{border-color:#F47B20}
        .comment-submit{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.6rem 1rem;font-family:var(--font-display);font-size:0.85rem;cursor:pointer;white-space:nowrap}
        .comment-submit:disabled{opacity:0.5;cursor:not-allowed}
        .no-comments{text-align:center;padding:1.5rem;color:#A3A3A3;font-size:0.875rem}
        .comments-list{display:flex;flex-direction:column;gap:1rem}
        .comment-item{display:flex;gap:0.75rem}
        .comment-avatar-sm{width:30px;height:30px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.8rem;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .comment-content{flex:1;display:flex;flex-direction:column;gap:0.35rem}
        .comment-header{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
        .comment-author{font-size:0.8rem;font-weight:600;color:#1A1A1A;text-decoration:none}.comment-author:hover{color:#F47B20}
        .comment-time{font-size:0.65rem;color:#A3A3A3}
        .delete-comment{background:none;border:none;color:#A3A3A3;cursor:pointer;font-size:0.78rem;margin-left:auto}.delete-comment:hover{color:#DC2626}
        .comment-text{font-size:0.85rem;color:#525252;line-height:1.5}
        .replies{margin-top:0.5rem;padding-left:1rem;border-left:2px solid #E5E5E5;display:flex;flex-direction:column;gap:0.5rem}
        .reply{display:flex;gap:0.5rem}
        .reply-avatar{width:22px;height:22px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.7rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .reply-author{font-size:0.75rem;font-weight:600;color:#1A1A1A;text-decoration:none}.reply-author:hover{color:#F47B20}
        .reply-text{font-size:0.78rem;color:#525252}
        .reply-btn{background:none;border:none;color:#A3A3A3;cursor:pointer;font-size:0.72rem;font-family:var(--font-body);padding:0;margin-top:0.25rem}.reply-btn:hover{color:#F47B20}
        .reply-form{display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap}
        .reply-input{flex:1;min-width:100px;background:#fff;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.4rem 0.625rem;color:#1A1A1A;font-size:0.8rem;font-family:var(--font-body);outline:none}
        .reply-input:focus{border-color:#F47B20}
        .reply-submit{background:#F47B20;color:#fff;border:none;border-radius:5px;padding:0.35rem 0.625rem;font-size:0.75rem;cursor:pointer}
        .reply-submit:disabled{opacity:0.5;cursor:not-allowed}
        .reply-cancel{background:transparent;border:1.5px solid #E5E5E5;color:#737373;border-radius:5px;padding:0.35rem 0.625rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body)}
        .lightbox{position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:999;display:flex;align-items:center;justify-content:center}
        .lb-img{max-width:90vw;max-height:85vh;object-fit:contain;border-radius:8px}
        .lb-close{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:1.5rem;width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .lb-arrow{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:2rem;width:48px;height:48px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .lb-arrow.left{left:1rem}.lb-arrow.right{right:1rem}
        .lb-counter{position:absolute;bottom:1.5rem;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.5);color:#fff;font-size:0.8rem;padding:0.3rem 0.75rem;border-radius:20px}
        @media(max-width:900px){.detail-body{grid-template-columns:1fr}}
        @media(max-width:640px){
          .detail-topbar{padding:0.625rem 0.875rem}
          .action-btn{padding:0.3rem 0.5rem;font-size:0.7rem}
          .detail-body{padding:0.75rem;gap:0.875rem}
          .main-img-wrap{aspect-ratio:unset;height:220px}
          .thumb{width:52px;height:40px}
          .car-title{font-size:1.3rem}
          .price-main{font-size:1.3rem}
          .comments-section{padding:0 0.75rem 2rem}
        }
      `}</style>
    </div>
  );
}
