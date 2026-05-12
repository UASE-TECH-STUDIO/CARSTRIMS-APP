"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function UserFavoritesPage() {
  const router = useRouter();
  const [favs, setFavs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string|null>(null);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/api/v1/users/favorites")
      .then((r) => setFavs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (carId: string, name: string) => {
    setRemoving(carId);
    try {
      await api.delete(`/api/v1/users/favorites/${carId}`);
      setMsg(`${name} removed from saved cars`);
      setTimeout(() => setMsg(""), 3000);
      load();
    } catch { }
    finally { setRemoving(null); }
  };

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;
  const STATUS_COLOR: Record<string,string> = { available:"#16A34A", sold:"#888", reserved:"#D97706" };

  return (
    <div className="favs-page">
      <h2 className="page-heading">Saved Cars</h2>
      <p className="page-sub">{loading ? "Loading..." : `${favs.length} saved vehicle${favs.length !== 1 ? "s" : ""}`}</p>

      {msg && (
        <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.4)",color:"#C4621A",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem"}}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : favs.length === 0 ? (
        <div className="empty">
          <div className="ei">❤️</div>
          <h3>No saved cars yet</h3>
          <p>Tap the heart icon on any car while browsing to save it here</p>
          <a href="/feed" className="browse-btn">Browse Cars →</a>
        </div>
      ) : (
        <div className="favs-grid">
          {favs.map((car) => (
            <div key={car._id} className="fav-card">
              {/* Image */}
              <div className="fav-img" onClick={() => router.push(`/cars/${car.carId}`)}>
                {car.images?.[0]
                  ? <img src={car.images[0]} alt="" />
                  : <div className="fav-ph">🚗</div>
                }
                <div className="fav-badge" style={{background:STATUS_COLOR[car.status]||"#888"}}>{car.status}</div>
              </div>

              {/* Dealer */}
              {car.dealerName && (
                <div className="fav-dealer">
                  {car.dealerLogo && <img src={car.dealerLogo} alt="" className="dl-logo" />}
                  <span>{car.dealerName}</span>
                </div>
              )}

              {/* Info */}
              <div className="fav-body" onClick={() => router.push(`/cars/${car.carId}`)}>
                <div className="fav-title">{car.brand} {car.model} {car.year}</div>
                <div className="fav-meta">{[car.color, car.transmission, car.condition].filter(Boolean).join(" · ")}</div>
                <div className="fav-price">{fmt(car.sellingPrice)}</div>
              </div>

              {/* Actions */}
              <div className="fav-actions">
                <button className="fav-btn view" onClick={() => router.push(`/cars/${car.carId}`)}>
                  View Car →
                </button>
                {car.status === "available" && car.dealerWhatsapp && (
                  
                    href={`https://wa.me/${car.dealerWhatsapp}?text=Hi, I am interested in the ${car.brand} ${car.model} ${car.year} (${car.carId})`}
                    target="_blank" rel="noreferrer"
                    className="fav-btn wa">
                    WhatsApp
                  </a>
                )}
                <button
                  className="fav-btn remove"
                  onClick={() => remove(car.carId, `${car.brand} ${car.model}`)}
                  disabled={removing === car.carId}>
                  {removing === car.carId ? "..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .favs-page{display:flex;flex-direction:column;gap:1.25rem;padding-bottom:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A}
        .page-sub{font-size:0.8rem;color:#888}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#fff}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem;max-width:280px;line-height:1.6}
        .browse-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;text-decoration:none;margin-top:0.25rem}
        .favs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem}
        .fav-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color 0.2s}
        .fav-card:hover{border-color:#F47B20;box-shadow:0 4px 16px rgba(244,123,32,0.1)}
        .fav-img{height:150px;background:#F5F5F5;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .fav-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
        .fav-card:hover .fav-img img{transform:scale(1.04)}
        .fav-ph{font-size:2.5rem;opacity:0.2}
        .fav-badge{position:absolute;top:0.5rem;left:0.5rem;padding:0.18rem 0.55rem;border-radius:20px;font-size:0.6rem;font-weight:600;text-transform:capitalize;color:#fff}
        .fav-dealer{display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0.875rem;background:#FAFAFA;border-bottom:1px solid #E5E5E5;font-size:0.72rem;color:#888}
        .dl-logo{width:16px;height:16px;border-radius:3px;object-fit:cover;flex-shrink:0}
        .fav-body{padding:0.875rem;display:flex;flex-direction:column;gap:0.25rem;flex:1;cursor:pointer}
        .fav-title{font-weight:700;font-size:0.9rem;color:#1A1A1A}
        .fav-meta{font-size:0.7rem;color:#888;text-transform:capitalize}
        .fav-price{font-family:var(--font-display);font-size:1.1rem;color:#F47B20;margin-top:0.25rem}
        .fav-actions{display:flex;gap:0.35rem;padding:0.75rem;border-top:1px solid #F0F0F0;flex-wrap:wrap}
        .fav-btn{flex:1;border-radius:5px;padding:0.4rem 0.5rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);border:1px solid #DDD;background:#F5F5F5;color:#555;text-align:center;text-decoration:none;transition:all 0.2s;white-space:nowrap;min-width:60px}
        .fav-btn.view{background:#FFF7ED;border-color:rgba(244,123,32,0.4);color:#C4621A;font-weight:600}
        .fav-btn.view:hover{background:#F47B20;color:#fff;border-color:#F47B20}
        .fav-btn.wa{background:#F0FDF4;border-color:rgba(22,163,74,0.3);color:#16A34A}
        .fav-btn.wa:hover{background:#DCFCE7}
        .fav-btn.remove{background:#FEF2F2;border-color:rgba(220,38,38,0.3);color:#DC2626}
        .fav-btn.remove:hover{background:#DC2626;color:#fff;border-color:#DC2626}
        .fav-btn:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>
    </div>
  );
}