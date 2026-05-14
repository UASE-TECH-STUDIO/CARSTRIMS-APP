"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function UserFavoritesPage() {
  const router = useRouter();
  const [favs, setFavs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string|null>(null);
  const [msg, setMsg]         = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res  = await api.get("/api/v1/users/favorites");
      const data = res.data || [];

      // Normalize — handles both flat car objects and {car: ...} wrapped objects
      const normalized = data.map((item: any) => {
        const car = item.car || item;
        return {
          carId:          car.carId,
          brand:          car.brand,
          model:          car.model,
          year:           car.year,
          images:         car.images || [],
          sellingPrice:   car.sellingPrice,
          promoPrice:     car.promoPrice,
          transmission:   car.transmission,
          condition:      car.condition,
          color:          car.color,
          status:         car.status,
          city:           car.city,
          state:          car.state,
          dealerName:     car.dealerName     || car.dealer?.companyName,
          dealerLogo:     car.dealerLogo     || car.dealer?.logo,
          dealerWhatsapp: car.dealerWhatsapp || car.dealer?.whatsapp,
          dealerId:       car.dealerId       || car.dealer?.dealerId,
        };
      }).filter((c: any) => c.carId);

      setFavs(normalized);
    } catch (e) {
      console.error("Favorites load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (carId: string, name: string) => {
    setRemoving(carId);
    try {
      // Try same endpoint used when saving from feed first
      try { await api.delete(`/api/v1/public/cars/${carId}/favorite`); }
      catch { await api.delete(`/api/v1/users/favorites/${carId}`); }

      setFavs(prev => prev.filter(c => c.carId !== carId));
      setMsg(`${name} removed from saved cars`);
      setTimeout(() => setMsg(""), 3000);
    } catch {
      // silent
    } finally {
      setRemoving(null);
    }
  };

  const fmt = (n: number) => `${(n||0).toLocaleString()}`;
  const SC: Record<string,string> = { available:"#16A34A", sold:"#888", reserved:"#D97706" };

  return (
    <div className="favs-page">
      <div className="favs-header">
        <div>
          <h2 className="page-heading">Saved Cars</h2>
          <p className="page-sub">
            {loading ? "Loading..." : `${favs.length} saved vehicle${favs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!loading && (
          <button className="refresh-btn" onClick={load}>↻ Refresh</button>
        )}
      </div>

      {msg && <div className="msg-banner">{msg}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner"/></div>
      ) : favs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No saved cars yet</h3>
          <p>Tap the ☆ Save button on any car in the feed to add it here</p>
          <button className="browse-btn" onClick={() => router.push("/feed")}>Browse Cars →</button>
        </div>
      ) : (
        <div className="favs-grid">
          {favs.map((car) => (
            <div key={car.carId} className="fav-card">
              {/* Image */}
              <div className="fav-img" onClick={() => router.push(`/cars/${car.carId}`)}>
                {car.images?.[0]
                  ? <img src={car.images[0]} alt="" loading="lazy"/>
                  : <div className="fav-ph">🚗</div>
                }
                <div className="fav-badge" style={{background: SC[car.status]||"#888"}}>
                  {car.status}
                </div>
              </div>

              {/* Dealer strip — clickable */}
              {car.dealerName && (
                <div
                  className="fav-dealer"
                  style={{cursor: car.dealerId ? "pointer" : "default"}}
                  onClick={() => car.dealerId && router.push(`/dealers/${car.dealerId}`)}
                >
                  {car.dealerLogo
                    ? <img src={car.dealerLogo} alt="" className="dl-logo"/>
                    : <div className="dl-ph">{car.dealerName?.charAt(0)}</div>
                  }
                  <span>{car.dealerName}</span>
                  {car.state && <span className="fav-loc">{car.state}</span>}
                </div>
              )}

              {/* Body */}
              <div className="fav-body" onClick={() => router.push(`/cars/${car.carId}`)}>
                <div className="fav-title">{car.brand} {car.model} {car.year}</div>
                <div className="fav-meta">
                  {[car.color, car.transmission, car.condition].filter(Boolean).join(" · ")}
                </div>
                <div className="fav-price">₦{fmt(car.sellingPrice)}</div>
              </div>

              {/* Actions */}
              <div className="fav-actions">
                <button className="fav-btn view" onClick={() => router.push(`/cars/${car.carId}`)}>
                  View Car
                </button>
                {car.dealerWhatsapp && (
                  <a
                    href={`https://wa.me/${car.dealerWhatsapp}?text=Hi, interested in ${car.brand} ${car.model} ${car.year}`}
                    target="_blank" rel="noreferrer" className="fav-btn wa"
                  >
                    WhatsApp
                  </a>
                )}
                <button
                  className="fav-btn remove"
                  disabled={removing === car.carId}
                  onClick={() => remove(car.carId, `${car.brand} ${car.model}`)}
                >
                  {removing === car.carId ? "..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .favs-page{display:flex;flex-direction:column;gap:1.25rem}
        .favs-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.04em;color:#1A1A1A}
        .page-sub{color:#737373;font-size:0.85rem;margin-top:0.3rem}
        .refresh-btn{background:#fff;border:1.5px solid #E5E5E5;color:#737373;border-radius:8px;padding:0.5rem 0.875rem;font-size:0.8rem;cursor:pointer;white-space:nowrap;transition:all 0.2s}
        .refresh-btn:hover{border-color:#F47B20;color:#F47B20}
        .msg-banner{background:#FFF7ED;border:1px solid rgba(244,123,32,0.4);color:#C4621A;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem}
        .loading-wrap{display:flex;align-items:center;justify-content:center;min-height:260px}
        .spinner{width:28px;height:28px;border:3px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;gap:1rem;padding:4rem 1rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#fff}
        .empty-icon{font-size:3rem}
        .empty-state h3{font-family:var(--font-display);font-size:1.3rem;color:#1A1A1A}
        .empty-state p{color:#737373;font-size:0.875rem;max-width:280px;line-height:1.5}
        .browse-btn{background:#F47B20;color:#fff;border:none;padding:0.8rem 1.5rem;border-radius:8px;cursor:pointer;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.06em}
        .browse-btn:hover{background:#FF9340}
        .favs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}
        .fav-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.2s}
        .fav-card:hover{border-color:#F47B20;box-shadow:0 4px 16px rgba(244,123,32,0.08);transform:translateY(-2px)}
        .fav-img{height:175px;background:#F5F5F5;position:relative;cursor:pointer;overflow:hidden}
        .fav-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s}
        .fav-card:hover .fav-img img{transform:scale(1.04)}
        .fav-ph{height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem}
        .fav-badge{position:absolute;top:0.5rem;left:0.5rem;color:#fff;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.65rem;font-weight:700;text-transform:capitalize}
        .fav-dealer{padding:0.5rem 0.875rem;border-bottom:1px solid #F0F0F0;display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:#666;transition:background 0.15s}
        .fav-dealer:hover{background:#FFF7ED}
        .dl-logo{width:18px;height:18px;border-radius:4px;object-fit:cover}
        .dl-ph{width:18px;height:18px;border-radius:4px;background:#F47B20;color:#fff;font-size:0.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .fav-loc{margin-left:auto;font-size:0.68rem;color:#A3A3A3;white-space:nowrap}
        .fav-body{padding:0.875rem;display:flex;flex-direction:column;gap:0.3rem;cursor:pointer;flex:1}
        .fav-title{font-weight:700;font-size:0.9rem;color:#1A1A1A}
        .fav-meta{color:#888;font-size:0.75rem;text-transform:capitalize}
        .fav-price{color:#F47B20;font-weight:700;font-size:1.1rem;font-family:var(--font-display);margin-top:0.2rem}
        .fav-actions{display:flex;gap:0.4rem;padding:0.875rem;border-top:1px solid #F0F0F0;flex-wrap:wrap}
        .fav-btn{flex:1;min-width:60px;padding:0.55rem 0.4rem;border-radius:6px;border:none;cursor:pointer;text-align:center;text-decoration:none;font-size:0.75rem;font-weight:500;transition:all 0.15s;white-space:nowrap}
        .fav-btn.view{background:#FFF7ED;color:#C4621A;border:1px solid rgba(244,123,32,0.3)}
        .fav-btn.view:hover{background:#F47B20;color:#fff}
        .fav-btn.wa{background:#DCFCE7;color:#166534;border:1px solid rgba(22,163,74,0.3)}
        .fav-btn.wa:hover{background:#16A34A;color:#fff}
        .fav-btn.remove{background:#FEF2F2;color:#DC2626;border:1px solid rgba(220,38,38,0.3)}
        .fav-btn.remove:hover{background:#DC2626;color:#fff}
        .fav-btn:disabled{opacity:0.5;cursor:not-allowed}
        @media(max-width:640px){
          .favs-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.75rem}
          .fav-img{height:130px}
        }
      `}</style>
    </div>
  );
}
