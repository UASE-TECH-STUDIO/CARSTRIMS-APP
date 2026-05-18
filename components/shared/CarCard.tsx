"use client";
import Link from "next/link";
import Image from "next/image";

interface CarCardProps {
  car: {
    carId: string;
    brand: string;
    model: string;
    year: number;
    color?: string;
    condition?: string;
    transmission?: string;
    fuelType?: string;
    mileage?: number;
    sellingPrice: number;
    promoPrice?: number;
    status?: string;
    images?: string[];
    dealerName?: string;
    dealerLogo?: string;
    dealerId?: string;
    state?: string;
    city?: string;
    likeCount?: number;
  };
  onLike?: (carId: string) => void;
  onSave?: (carId: string) => void;
  liked?: boolean;
  saved?: boolean;
  compact?: boolean;
}

export default function CarCard({ car, onLike, onSave, liked, saved, compact }: CarCardProps) {
  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    available: { bg: "rgba(22,163,74,0.15)", color: "#16A34A" },
    sold:      { bg: "rgba(115,115,115,0.15)", color: "#737373" },
    reserved:  { bg: "rgba(217,119,6,0.15)", color: "#D97706" },
    on_promotion: { bg: "rgba(124,58,237,0.15)", color: "#7C3AED" },
  };
  const sc = STATUS_COLORS[car.status || "available"] || STATUS_COLORS.available;

  return (
    <div className="cc-wrap">
      <Link href={`/cars/${car.carId}`} className="cc-link">
        {/* Image */}
        <div className="cc-img-wrap">
          {car.images?.[0] ? (
            <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="cc-img" loading="lazy" />
          ) : (
            <div className="cc-no-img">🚗</div>
          )}
          {/* Status badge */}
          {car.status && car.status !== "available" && (
            <div className="cc-status" style={{ background: sc.bg, color: sc.color }}>
              {car.status.replace(/_/g, " ")}
            </div>
          )}
          {/* Promo badge */}
          {car.promoPrice && car.promoPrice < car.sellingPrice && (
            <div className="cc-promo-badge">PROMO</div>
          )}
        </div>

        {/* Info */}
        <div className="cc-info">
          <div className="cc-title">{car.brand} {car.model}</div>
          <div className="cc-meta">
            {car.year}
            {car.color && ` · ${car.color}`}
            {car.condition && ` · ${car.condition}`}
          </div>
          {(car.city || car.state) && (
            <div className="cc-loc">📍 {[car.city, car.state].filter(Boolean).join(", ")}</div>
          )}
          <div className="cc-price-row">
            <div className="cc-price">{fmt(car.sellingPrice)}</div>
            {car.promoPrice && car.promoPrice < car.sellingPrice && (
              <div className="cc-promo-price">{fmt(car.promoPrice)}</div>
            )}
          </div>
          {car.dealerName && (
            <div className="cc-dealer">
              {car.dealerLogo && <img src={car.dealerLogo} alt="" className="cc-dealer-logo" />}
              <span>{car.dealerName}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      {(onLike || onSave) && (
        <div className="cc-actions">
          {onLike && (
            <button className={`cc-act-btn ${liked ? "liked" : ""}`} onClick={e => { e.preventDefault(); onLike(car.carId); }}>
              {liked ? "♥" : "♡"} {car.likeCount || ""}
            </button>
          )}
          {onSave && (
            <button className={`cc-act-btn ${saved ? "saved" : ""}`} onClick={e => { e.preventDefault(); onSave(car.carId); }}>
              {saved ? "★" : "☆"}
            </button>
          )}
        </div>
      )}

      <style>{`
        .cc-wrap{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;overflow:hidden;transition:all 0.2s;display:flex;flex-direction:column;height:100%}
        .cc-wrap:hover{border-color:#F47B20;transform:translateY(-2px);box-shadow:0 8px 24px rgba(244,123,32,0.12)}
        .cc-link{text-decoration:none;color:inherit;display:flex;flex-direction:column;flex:1}
        .cc-img-wrap{position:relative;width:100%;aspect-ratio:4/3;background:#F5F5F5;overflow:hidden;flex-shrink:0}
        .cc-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s}
        .cc-wrap:hover .cc-img{transform:scale(1.04)}
        .cc-no-img{display:flex;align-items:center;justify-content:center;height:100%;font-size:2.5rem;opacity:0.2}
        .cc-status{position:absolute;top:0.5rem;left:0.5rem;padding:0.2rem 0.55rem;border-radius:20px;font-size:0.62rem;font-weight:700;text-transform:capitalize;backdrop-filter:blur(4px)}
        .cc-promo-badge{position:absolute;top:0.5rem;right:0.5rem;background:#7C3AED;color:#fff;padding:0.2rem 0.55rem;border-radius:20px;font-size:0.6rem;font-weight:700;letter-spacing:0.08em}
        .cc-info{padding:0.875rem;display:flex;flex-direction:column;gap:0.3rem;flex:1}
        .cc-title{font-weight:700;font-size:0.95rem;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--font-display);letter-spacing:0.02em}
        .cc-meta{font-size:0.72rem;color:#737373;text-transform:capitalize;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cc-loc{font-size:0.68rem;color:#A3A3A3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cc-price-row{display:flex;align-items:baseline;gap:0.5rem;margin-top:0.25rem;flex-wrap:wrap}
        .cc-price{font-family:var(--font-display);font-size:clamp(1rem,2vw,1.2rem);color:#F47B20;letter-spacing:0.02em;font-weight:700}
        .cc-promo-price{font-size:0.75rem;color:#16A34A;font-weight:700}
        .cc-dealer{display:flex;align-items:center;gap:0.35rem;margin-top:0.2rem;font-size:0.68rem;color:#A3A3A3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cc-dealer-logo{width:14px;height:14px;border-radius:3px;object-fit:cover;flex-shrink:0}
        .cc-actions{display:flex;gap:0.375rem;padding:0 0.875rem 0.875rem;border-top:1px solid #F5F5F5;padding-top:0.625rem}
        .cc-act-btn{flex:1;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.4rem;font-size:0.85rem;cursor:pointer;transition:all 0.2s;color:#737373;font-family:var(--font-body)}
        .cc-act-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .cc-act-btn.liked{color:#DC2626;border-color:rgba(220,38,38,0.4);background:rgba(220,38,38,0.06)}
        .cc-act-btn.saved{color:#F47B20;border-color:rgba(244,123,32,0.4);background:#FFF7ED}
      `}</style>
    </div>
  );
}
