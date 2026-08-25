"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/store/toastStore";
import ShareMenu from "@/components/shared/ShareMenu";

export interface CarCardData {
  _id?: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  transmission?: string;
  sellingPrice: number;
  promoPrice?: number;
  status: string;
  images?: string[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  city?: string;
  state?: string;
  dealerName?: string;
  dealerLogo?: string;
}

interface Props {
  car: CarCardData;
  isAuthenticated: boolean;
  liked: boolean;
  favorited: boolean;
  onToggleLike: (carId: string) => void;
  onToggleFav: (carId: string) => void;
  isAdmin?: boolean;
  onAdminDelete?: (car: CarCardData) => void;
  statusColors?: Record<string, string>;
}

const fmt = (n: number) => `NGN ${(n || 0).toLocaleString()}`;
const DEFAULT_STATUS_COLORS: Record<string, string> = {
  available: "#16A34A", reserved: "#F59E0B", sold: "#737373", pending: "#3B82F6",
};

/**
 * Shared car card - like/comment/share/save icons, an inline
 * comment box, always-visible touch-friendly icons. Built to be
 * reused wherever a car listing grid appears (dealer profile, Super
 * Admin car list, anywhere else) instead of duplicating this
 * markup and behavior per page, as had happened before with the
 * dealer profile's own hand-rolled card.
 *
 * Deliberately NOT used on the main feed (app/feed/page.tsx) in this
 * pass - that page already has its own freshly-fixed, working
 * implementation (icon alignment, inline comment box, etc.), and
 * refactoring it to share this component risks regressing code that
 * was just stabilized. A future pass could unify them once this
 * component has proven itself on a second page.
 */
export default function CarCard({ car, isAuthenticated, liked, favorited, onToggleLike, onToggleFav, isAdmin, onAdminDelete, statusColors }: Props) {
  const router = useRouter();
  const showToast = useToast();
  const colors = statusColors || DEFAULT_STATUS_COLORS;

  const [commentBoxOpen, setCommentBoxOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(car.commentCount || 0);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { router.push("/login"); return; }
    onToggleLike(car.carId);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { router.push("/login"); return; }
    onToggleFav(car.carId);
  };

  const handleToggleCommentBox = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCommentBoxOpen(v => !v);
    setCommentDraft("");
  };

  const handlePostComment = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!commentDraft.trim()) return;
    setPostingComment(true);
    try {
      await api.post(`/api/v1/public/cars/${car.carId}/comments`, { text: commentDraft });
      setLocalCommentCount(c => c + 1);
      setCommentDraft("");
      setCommentBoxOpen(false);
      showToast("Comment posted", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Couldn't post comment", "error");
    } finally {
      setPostingComment(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowShareMenu(true);
  };

  const handleAdminDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onAdminDelete?.(car);
  };

  return (
    <div className="cc-card">
      <Link href={`/cars/${car.carId}`} className="cc-link">
        <div className="cc-img-wrap">
          {car.images?.[0]
            ? <img src={car.images[0]} alt="" loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const ph = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (ph) ph.style.display = "flex";
                }} />
            : null
          }
          <div className="cc-ph" style={{ display: car.images?.[0] ? "none" : "flex" }}>No Image</div>
          <div className="cc-status-tag" style={{ background: colors[car.status] || "#737373" }}>
            {car.status?.replace(/_/g, " ")}
          </div>
          {car.promoPrice != null && car.promoPrice > 0 && car.promoPrice < car.sellingPrice && (
            <div className="cc-promo-tag">PROMO</div>
          )}
          {isAdmin && (
            <button className="cc-admin-del" onClick={handleAdminDeleteClick}>DELETE</button>
          )}
        </div>

        {car.dealerName && (
          <div className="cc-dealer-strip">
            <div className="cc-dealer-logo">{car.dealerLogo ? <img src={car.dealerLogo} alt="" /> : car.dealerName.charAt(0) || "D"}</div>
            <span className="cc-dealer-name">{car.dealerName}</span>
            {car.state && <span className="cc-dealer-loc">{car.state}</span>}
          </div>
        )}

        <div className="cc-info">
          <div className="cc-info-top">
            <div className="cc-info-main">
              <div className="cc-name">{car.brand} {car.model}</div>
              <div className="cc-sub">{car.year}{car.color ? ` - ${car.color}` : ""}{car.transmission ? ` - ${car.transmission}` : ""}</div>
              {car.city && <div className="cc-loc">{car.city}{car.state ? `, ${car.state}` : ""}</div>}
              <div className="cc-price-row">
                <span className="cc-price">{fmt(car.sellingPrice)}</span>
                {car.promoPrice != null && car.promoPrice > 0 && car.promoPrice < car.sellingPrice && (
                  <span className="cc-promo">{fmt(car.promoPrice)}</span>
                )}
              </div>
            </div>
            <div className="cc-vactions">
              <button className={`cc-va-btn ${liked ? "liked" : ""}`} onClick={handleLike}>
                <span className="cc-va-icon">{liked ? "♥" : "♡"}</span>
                <span className="cc-va-count">{car.likeCount || 0}</span>
              </button>
              <button className="cc-va-btn" onClick={handleToggleCommentBox}>
                <span className="cc-va-icon">💬</span>
                <span className="cc-va-count">{localCommentCount || 0}</span>
              </button>
              <button className="cc-va-btn" onClick={handleShareClick}>
                <span className="cc-va-icon">⤴</span>
              </button>
              <button className={`cc-va-btn ${favorited ? "faved" : ""}`} onClick={handleFav}>
                <span className="cc-va-icon">{favorited ? "🔖" : "☆"}</span>
              </button>
            </div>
          </div>
          <div className="cc-footer">
            <span className="cc-view-ct">Views: {car.viewCount || 0}</span>
            <span className="cc-view-deal">View Deal</span>
          </div>
        </div>
      </Link>

      {commentBoxOpen && (
        <div className="cc-comment-box" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="cc-cb-input"
            placeholder={isAuthenticated ? "Write a comment..." : "Log in to comment"}
            value={commentDraft}
            disabled={!isAuthenticated || postingComment}
            onChange={(e) => setCommentDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !postingComment) handlePostComment(e as any); }}
          />
          {isAuthenticated ? (
            <button className="cc-cb-send" disabled={!commentDraft.trim() || postingComment} onClick={handlePostComment}>
              {postingComment ? "..." : "Post"}
            </button>
          ) : (
            <button className="cc-cb-send" onClick={() => router.push("/login")}>Log In</button>
          )}
          <Link href={`/cars/${car.carId}?scrollTo=comments`} className="cc-cb-view">
            View {localCommentCount ? `${localCommentCount} ` : ""}comments
          </Link>
        </div>
      )}

      {showShareMenu && (
        <ShareMenu
          url={`${typeof window !== "undefined" ? window.location.origin : ""}/cars/${car.carId}`}
          title={`${car.brand} ${car.model}`}
          onClose={() => setShowShareMenu(false)}
        />
      )}

      <style>{`
        .cc-card { background:#fff; border:1.5px solid #E5E5E5; border-radius:12px; overflow:hidden; transition:all 0.2s; position:relative; }
        .cc-card:hover { border-color:#F47B20; transform:translateY(-3px); box-shadow:0 8px 28px rgba(244,123,32,0.1); }
        .cc-link { display:flex; flex-direction:column; text-decoration:none; color:inherit; }
        .cc-img-wrap { position:relative; height:185px; background:#E5E5E5; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .cc-img-wrap img { width:100%; height:100%; object-fit:cover; transition:transform 0.3s; }
        .cc-card:hover .cc-img-wrap img { transform:scale(1.04); }
        .cc-ph { font-size:0.8rem; font-weight:600; color:#A3A3A3; letter-spacing:0.1em; align-items:center; justify-content:center; height:100%; }
        .cc-status-tag { position:absolute; top:0.5rem; left:0.5rem; color:#fff; padding:0.18rem 0.6rem; border-radius:20px; font-size:0.62rem; font-weight:700; text-transform:capitalize; }
        .cc-promo-tag { position:absolute; top:0.5rem; right:0.5rem; background:#DC2626; color:#fff; padding:0.18rem 0.6rem; border-radius:20px; font-size:0.62rem; font-weight:700; }
        .cc-admin-del { position:absolute; bottom:0.5rem; right:0.5rem; background:rgba(220,38,38,0.9); color:#fff; border:none; border-radius:6px; padding:0.35rem 0.6rem; font-size:0.68rem; font-weight:700; cursor:pointer; }
        .cc-dealer-strip { display:flex; align-items:center; gap:0.4rem; padding:0.4rem 0.875rem; background:#F5F5F5; border-bottom:1px solid #E5E5E5; }
        .cc-dealer-logo { width:22px; height:22px; border-radius:50%; overflow:hidden; background:#FFF7ED; color:#F47B20; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; flex-shrink:0; }
        .cc-dealer-logo img { width:100%; height:100%; object-fit:cover; }
        .cc-dealer-name { font-size:0.72rem; font-weight:600; color:#404040; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .cc-dealer-loc { font-size:0.65rem; color:#A3A3A3; flex-shrink:0; }
        .cc-info { padding:0.875rem; display:flex; flex-direction:column; gap:0.28rem; flex:1; }
        .cc-info-top { display:flex; align-items:flex-start; justify-content:space-between; gap:0.5rem; }
        .cc-info-main { display:flex; flex-direction:column; gap:0.28rem; min-width:0; flex:1; }
        .cc-name { font-weight:700; font-size:0.9rem; color:#171717; }
        .cc-sub { font-size:0.7rem; color:#737373; text-transform:capitalize; }
        .cc-loc { font-size:0.68rem; color:#A3A3A3; }
        .cc-price-row { display:flex; align-items:baseline; gap:0.5rem; margin-top:0.2rem; }
        .cc-price { font-family:var(--font-display); font-size:1.2rem; color:#F47B20; letter-spacing:0.02em; }
        .cc-promo { font-size:0.78rem; color:#16A34A; font-weight:600; }
        .cc-vactions { display:flex; flex-direction:column; align-items:center; gap:0.5rem; flex-shrink:0; }
        .cc-va-btn { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.1rem; background:none; border:none; cursor:pointer; padding:0.2rem; color:#A3A3A3; font-family:var(--font-body); line-height:1; min-width:32px; min-height:32px; }
        .cc-va-icon { font-size:1.35rem; }
        .cc-va-btn.liked .cc-va-icon { color:#DC2626; }
        .cc-va-btn.faved .cc-va-icon { color:#F47B20; }
        .cc-va-count { font-size:0.68rem; font-weight:700; color:#737373; }
        .cc-footer { display:flex; align-items:center; justify-content:space-between; margin-top:0.4rem; padding-top:0.4rem; border-top:1px solid #F0F0F0; }
        .cc-view-ct { font-size:0.65rem; color:#A3A3A3; }
        .cc-view-deal { font-size:0.72rem; color:#F47B20; font-weight:600; }
        .cc-comment-box { display:flex; align-items:center; gap:0.4rem; padding:0.6rem 0.75rem; border-top:1px solid #F0F0F0; background:#FAFAFA; }
        .cc-cb-input { flex:1; min-width:0; border:1.5px solid #E5E5E5; border-radius:8px; padding:0.4rem 0.6rem; font-size:0.78rem; font-family:var(--font-body); outline:none; background:#fff; }
        .cc-cb-input:focus { border-color:#F47B20; }
        .cc-cb-send { background:#F47B20; color:#fff; border:none; border-radius:8px; padding:0.4rem 0.7rem; font-size:0.75rem; font-weight:700; cursor:pointer; font-family:var(--font-body); white-space:nowrap; flex-shrink:0; }
        .cc-cb-send:disabled { opacity:0.5; cursor:not-allowed; }
        .cc-cb-view { font-size:0.68rem; color:#F47B20; font-weight:600; white-space:nowrap; flex-shrink:0; text-decoration:none; }
      `}</style>
    </div>
  );
}
