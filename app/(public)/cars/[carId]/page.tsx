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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!carId) return;
    const fetchAll = async () => {
      try {
        const [carRes, commentRes] = await Promise.all([
          api.get(`/api/v1/public/cars/${carId}`),
          api.get(`/api/v1/public/cars/${carId}/comments`),
        ]);
        setCar(carRes.data);
        setLikeCount(carRes.data.likeCount || 0);
        setComments(commentRes.data.comments || []);
        if (isAuthenticated) {
          const likeRes = await api.get(`/api/v1/public/cars/${carId}/likes/me`);
          setLiked(likeRes.data.liked);
          setFavorited(likeRes.data.favorited);
        }
      } catch { } finally { setLoading(false); }
    };
    fetchAll();
  }, [carId, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    try {
      const res = await api.post(`/api/v1/public/cars/${carId}/like`);
      setLiked(res.data.liked);
      setLikeCount((c) => res.data.liked ? c + 1 : c - 1);
    } catch { }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    try {
      if (favorited) {
        await api.delete(`/api/v1/public/cars/${carId}/favorite`);
        setFavorited(false);
      } else {
        await api.post(`/api/v1/public/cars/${carId}/favorite`);
        setFavorited(true);
      }
    } catch { }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/v1/public/cars/${carId}/comments`, { text: commentText });
      setComments((prev) => [res.data, ...prev]);
      setCommentText("");
    } catch { } finally { setSubmittingComment(false); }
  };

  const handleReply = async (commentId: string) => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (!replyText.trim()) return;
    try {
      await api.post(`/api/v1/public/cars/${carId}/comments/${commentId}/reply`, { text: replyText });
      const res = await api.get(`/api/v1/public/cars/${carId}/comments`);
      setComments(res.data.comments || []);
      setReplyTo(null);
      setReplyText("");
    } catch { }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/api/v1/public/cars/${carId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    } catch { }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${car?.brand} ${car?.model}`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const fmt = (n: number) => `${(n || 0).toLocaleString()}`;
  const fmtTime = (iso: string) => { const d = Date.now()-new Date(iso).getTime(); const m=Math.floor(d/60000); return m<1?"just now":m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:new Date(iso).toLocaleDateString(); };

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"var(--black)"}}><div style={{width:"32px",height:"32px",border:"2px solid var(--border)",borderTopColor:"var(--gold)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  if (!car) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"4rem",textAlign:"center",color:"var(--text)",minHeight:"100vh",background:"var(--black)",justifyContent:"center"}}><h2>Car not found</h2><Link href="/" style={{color:"var(--gold)",textDecoration:"none"}}>Back to feed</Link></div>;

  return (
    <div className="car-detail">
      <header className="detail-topbar">
        <button className="back-btn" onClick={() => router.back()}>Back</button>
        <div className="topbar-actions">
          <button className={`action-btn ${liked ? "liked" : ""}`} onClick={handleLike}>{liked ? "heart" : "heart"} {likeCount}</button>
          <button className={`action-btn ${favorited ? "faved" : ""}`} onClick={handleFavorite}>{favorited ? "star" : "star"} Save</button>
          <button className="action-btn" onClick={handleShare}>Share</button>
        </div>
      </header>
      <div className="detail-body">
        <div className="gallery">
          <div className="main-img">
            {car.images?.length > 0 ? <img src={car.images[activeImage]} alt="" /> : <div className="no-img">Car</div>}
            {car.status !== "available" && <div className={`sold-overlay ${car.status}`}>{car.status.replace(/_/g," ").toUpperCase()}</div>}
          </div>
          {car.images?.length > 1 && (
            <div className="thumb-row">
              {car.images.map((img: string, i: number) => (
                <div key={i} className={`thumb ${activeImage === i ? "active" : ""}`} onClick={() => setActiveImage(i)}><img src={img} alt="" /></div>
              ))}
            </div>
          )}
          {car.video && <div className="video-section"><video src={car.video} controls className="car-video" /></div>}
        </div>
        <div className="detail-right">
          <div className="car-info-card">
            <div className="car-badge">
              <span className={`status-pill ${car.status}`}>{car.status?.replace(/_/g," ")}</span>
              <span className="car-id-badge">{car.carId}</span>
            </div>
            <h1 className="car-title">{car.brand} {car.model}</h1>
            <div className="car-year-color">{car.year} {car.color} {car.condition}</div>
            <div className="price-section">
              <div className="price-main">NGN {fmt(car.sellingPrice)}</div>
              {car.promoPrice && car.promoPrice < car.sellingPrice && <div className="price-promo">Promo: NGN {fmt(car.promoPrice)}</div>}
            </div>
            <div className="specs-grid">
              {[
                {label:"Mileage",value:car.mileage?`${car.mileage?.toLocaleString()} km`:"N/A"},
                {label:"Transmission",value:car.transmission||"N/A"},
                {label:"Fuel",value:car.fuelType||"N/A"},
                {label:"Engine",value:car.engineType||"N/A"},
                {label:"Location",value:car.city?`${car.city}, ${car.state}`:"N/A"},
                {label:"VIN",value:car.vin||"N/A"},
              ].map((s) => (
                <div key={s.label} className="spec-item">
                  <span className="spec-label">{s.label}</span>
                  <span className="spec-val">{s.value}</span>
                </div>
              ))}
            </div>
            {car.description && <div className="car-desc"><div className="desc-label">Description</div><p className="desc-text">{car.description}</p></div>}
          </div>
          {car.dealer && (
            <div className="dealer-card">
              <div className="dealer-top">
                <div className="dealer-logo">{car.dealer.logo ? <img src={car.dealer.logo} alt="" /> : <span>{car.dealer.companyName?.charAt(0)}</span>}</div>
                <div className="dealer-info">
                  <div className="dealer-name">{car.dealer.companyName}</div>
                  <div className="dealer-loc">{car.dealer.city || "N/A"}, {car.dealer.state || "N/A"}</div>
                  <Link href={`/dealers/${car.dealer.dealerId}`} className="view-dealer">View all cars</Link>
                </div>
                {car.dealer.qrCode && <img src={car.dealer.qrCode} alt="QR" className="dealer-qr-mini" />}
              </div>
              {car.status === "available" && (
                <div className="contact-section">
                  <button className="contact-toggle" onClick={() => setShowContact(!showContact)}>
                    {showContact ? "Hide Contact" : "Contact Dealer"}
                  </button>
                  {showContact && (
                    <div className="contact-buttons">
                      {car.dealer.phone && <a href={`tel:${car.dealer.phone}`} className="cta-btn phone">Call</a>}
                      {car.dealer.whatsapp && <a href={`https://wa.me/${car.dealer.whatsapp}`} target="_blank" rel="noreferrer" className="cta-btn whatsapp">WhatsApp</a>}
                      {car.dealer.email && <a href={`mailto:${car.dealer.email}`} className="cta-btn email">Email</a>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {car.status === "available" && isAuthenticated && (
            <Link href={`/dashboard/user/requests`} className="special-req-btn">Place Special Request for Similar Car</Link>
          )}
        </div>
      </div>
      <div className="comments-section">
        <h2 className="comments-title">COMMENTS {comments.length}</h2>
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="comment-form">
            <div className="comment-avatar">{user?.fullName?.charAt(0).toUpperCase() || "U"}</div>
            <div className="comment-input-wrap">
              <textarea className="comment-input" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={2} />
              <button type="submit" className="comment-submit" disabled={submittingComment || !commentText.trim()}>{submittingComment ? "..." : "Post"}</button>
            </div>
          </form>
        ) : (
          <div className="login-prompt"><Link href="/auth/login" className="login-link">Login to comment, like, and save favorites</Link></div>
        )}
        <div className="comments-list">
          {comments.length === 0 ? <div className="no-comments">Be the first to comment</div> : comments.map((c) => (
            <div key={c._id} className="comment-item">
              <div className="comment-avatar-sm">{c.userName?.charAt(0).toUpperCase() || "?"}</div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{c.userName}</span>
                  <span className="comment-time">{fmtTime(c.createdAt)}</span>
                  {user && c.userId === user.userId && <button className="delete-comment" onClick={() => handleDeleteComment(c.commentId)}>x</button>}
                </div>
                <div className="comment-text">{c.text}</div>
                {c.replies?.length > 0 && (
                  <div className="replies">
                    {c.replies.map((r: any) => (
                      <div key={r.replyId} className="reply">
                        <div className="reply-avatar">{r.userName?.charAt(0) || "?"}</div>
                        <div><div className="reply-author">{r.userName}</div><div className="reply-text">{r.text}</div></div>
                      </div>
                    ))}
                  </div>
                )}
                {isAuthenticated && <div className="comment-actions"><button className="reply-btn" onClick={() => setReplyTo(replyTo === c.commentId ? null : c.commentId)}>Reply</button></div>}
                {replyTo === c.commentId && (
                  <div className="reply-form">
                    <input className="reply-input" placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                    <button className="reply-submit" onClick={() => handleReply(c.commentId)} disabled={!replyText.trim()}>Post</button>
                    <button className="reply-cancel" onClick={() => setReplyTo(null)}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .car-detail{min-height:100vh;background:var(--black);color:var(--text);font-family:var(--font-body)}
        .detail-topbar{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.5rem;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50}
        .back-btn{background:none;border:none;color:var(--text-muted);font-size:0.875rem;cursor:pointer;font-family:var(--font-body)}
        .back-btn:hover{color:var(--text)}
        .topbar-actions{display:flex;align-items:center;gap:0.5rem}
        .action-btn{background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.875rem;font-size:0.8rem;cursor:pointer;color:var(--text-muted);transition:all 0.2s;font-family:var(--font-body);white-space:nowrap}
        .action-btn:hover{border-color:var(--gold-dim);color:var(--text)}
        .action-btn.liked{color:var(--error);border-color:rgba(224,82,82,0.4);background:rgba(224,82,82,0.08)}
        .action-btn.faved{color:var(--gold);border-color:var(--gold-dim);background:rgba(201,168,76,0.08)}
        .detail-body{display:grid;grid-template-columns:1fr 380px;gap:1.5rem;padding:1.5rem;max-width:1200px;margin:0 auto}
        .gallery{display:flex;flex-direction:column;gap:0.75rem}
        .main-img{aspect-ratio:16/10;border-radius:12px;overflow:hidden;position:relative;background:var(--surface);display:flex;align-items:center;justify-content:center}
        .main-img img{width:100%;height:100%;object-fit:cover}
        .no-img{font-size:4rem;opacity:0.3}
        .sold-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:2rem;letter-spacing:0.2em}
        .sold-overlay.sold{background:rgba(0,0,0,0.5);color:#888}
        .sold-overlay.reserved{background:rgba(201,168,76,0.3);color:var(--gold)}
        .thumb-row{display:flex;gap:0.5rem;overflow-x:auto}
        .thumb{width:72px;height:52px;border-radius:6px;overflow:hidden;cursor:pointer;border:2px solid transparent;flex-shrink:0;transition:border-color 0.2s}
        .thumb.active{border-color:var(--gold)}
        .thumb img{width:100%;height:100%;object-fit:cover}
        .video-section{border-radius:10px;overflow:hidden}
        .car-video{width:100%;max-height:250px;display:block}
        .detail-right{display:flex;flex-direction:column;gap:1rem}
        .car-info-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
        .car-badge{display:flex;align-items:center;gap:0.5rem}
        .status-pill{padding:0.2rem 0.6rem;border-radius:20px;font-size:0.68rem;font-weight:600;text-transform:capitalize}
        .status-pill.available{background:rgba(76,175,130,0.1);color:var(--success);border:1px solid rgba(76,175,130,0.3)}
        .status-pill.sold{background:rgba(136,136,136,0.1);color:#888;border:1px solid #88888844}
        .car-id-badge{font-family:var(--font-mono);font-size:0.68rem;color:var(--text-dim);background:var(--surface-2);padding:0.2rem 0.5rem;border-radius:4px}
        .car-title{font-family:var(--font-display);font-size:1.8rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .car-year-color{font-size:0.875rem;color:var(--text-muted);text-transform:capitalize}
        .price-section{display:flex;align-items:baseline;gap:1rem}
        .price-main{font-family:var(--font-display);font-size:2rem;color:var(--gold);letter-spacing:0.03em}
        .price-promo{font-size:0.875rem;color:var(--success)}
        .specs-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .spec-item{display:flex;flex-direction:column;gap:0.2rem;padding:0.5rem;background:var(--surface-2);border-radius:6px}
        .spec-label{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim)}
        .spec-val{font-size:0.825rem;color:var(--text);text-transform:capitalize}
        .car-desc{display:flex;flex-direction:column;gap:0.4rem}
        .desc-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-dim)}
        .desc-text{font-size:0.875rem;color:var(--text-muted);line-height:1.6}
        .dealer-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .dealer-top{display:flex;align-items:flex-start;gap:0.875rem}
        .dealer-logo{width:48px;height:48px;border-radius:8px;background:var(--gold-dim);color:var(--black);font-family:var(--font-display);font-size:1.2rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .dealer-logo img{width:100%;height:100%;object-fit:cover}
        .dealer-info{flex:1;display:flex;flex-direction:column;gap:0.25rem}
        .dealer-name{font-weight:700;font-size:0.9rem;color:var(--text)}
        .dealer-loc{font-size:0.78rem;color:var(--text-muted)}
        .view-dealer{font-size:0.75rem;color:var(--gold);text-decoration:none}
        .dealer-qr-mini{width:52px;height:52px;border-radius:6px;border:2px solid var(--border)}
        .contact-section{display:flex;flex-direction:column;gap:0.75rem}
        .contact-toggle{background:var(--gold);color:var(--black);border:none;border-radius:6px;padding:0.75rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer}
        .contact-buttons{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem}
        .cta-btn{padding:0.65rem;border-radius:6px;font-size:0.78rem;font-weight:500;text-align:center;text-decoration:none;cursor:pointer;border:none;display:block}
        .cta-btn.phone{background:rgba(59,139,212,0.15);color:#3B8BD4;border:1px solid rgba(59,139,212,0.3)}
        .cta-btn.whatsapp{background:rgba(76,175,130,0.15);color:var(--success);border:1px solid rgba(76,175,130,0.3)}
        .cta-btn.email{background:rgba(201,168,76,0.1);color:var(--gold);border:1px solid var(--gold-dim)}
        .special-req-btn{display:block;background:rgba(201,168,76,0.08);border:1px solid var(--gold-dim);color:var(--gold);border-radius:8px;padding:0.875rem;text-align:center;text-decoration:none;font-size:0.875rem}
        .comments-section{max-width:1200px;margin:0 auto;padding:0 1.5rem 3rem}
        .comments-title{font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.15em;color:var(--text-muted);margin-bottom:1.25rem}
        .login-prompt{padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;text-align:center;margin-bottom:1.25rem}
        .login-link{color:var(--gold);text-decoration:none;font-size:0.875rem}
        .comment-form{display:flex;gap:0.75rem;margin-bottom:1.5rem}
        .comment-avatar{width:36px;height:36px;border-radius:50%;background:var(--gold-dim);color:var(--black);font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .comment-input-wrap{flex:1;display:flex;gap:0.5rem;align-items:flex-end}
        .comment-input{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none;resize:none}
        .comment-input:focus{border-color:var(--gold)}
        .comment-submit{background:var(--gold);color:var(--black);border:none;border-radius:6px;padding:0.6rem 1rem;font-family:var(--font-display);font-size:0.85rem;cursor:pointer;white-space:nowrap}
        .comment-submit:disabled{opacity:0.5;cursor:not-allowed}
        .no-comments{text-align:center;padding:1.5rem;color:var(--text-dim);font-size:0.875rem}
        .comments-list{display:flex;flex-direction:column;gap:1rem}
        .comment-item{display:flex;gap:0.75rem}
        .comment-avatar-sm{width:32px;height:32px;border-radius:50%;background:var(--surface-3);border:1px solid var(--border);color:var(--text);font-size:0.875rem;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .comment-content{flex:1;display:flex;flex-direction:column;gap:0.4rem}
        .comment-header{display:flex;align-items:center;gap:0.5rem}
        .comment-author{font-size:0.825rem;font-weight:600;color:var(--text)}
        .comment-time{font-size:0.68rem;color:var(--text-dim);font-family:var(--font-mono)}
        .delete-comment{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:0.8rem;margin-left:auto}
        .delete-comment:hover{color:var(--error)}
        .comment-text{font-size:0.875rem;color:var(--text-muted);line-height:1.5}
        .replies{margin-top:0.5rem;padding-left:1rem;border-left:2px solid var(--border);display:flex;flex-direction:column;gap:0.5rem}
        .reply{display:flex;gap:0.5rem}
        .reply-avatar{width:24px;height:24px;border-radius:50%;background:var(--surface-3);color:var(--text);font-size:0.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .reply-author{font-size:0.78rem;font-weight:600;color:var(--text)}
        .reply-text{font-size:0.8rem;color:var(--text-muted)}
        .comment-actions{display:flex;gap:0.75rem}
        .reply-btn{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:0.75rem;font-family:var(--font-body)}
        .reply-btn:hover{color:var(--gold)}
        .reply-form{display:flex;gap:0.5rem;margin-top:0.5rem}
        .reply-input{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:0.5rem 0.75rem;color:var(--text);font-size:0.825rem;font-family:var(--font-body);outline:none}
        .reply-input:focus{border-color:var(--gold)}
        .reply-submit{background:var(--gold);color:var(--black);border:none;border-radius:5px;padding:0.4rem 0.75rem;font-size:0.78rem;cursor:pointer}
        .reply-submit:disabled{opacity:0.5;cursor:not-allowed}
        .reply-cancel{background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:5px;padding:0.4rem 0.75rem;font-size:0.78rem;cursor:pointer;font-family:var(--font-body)}
        @media(max-width:900px){.detail-body{grid-template-columns:1fr}.contact-buttons{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
}
