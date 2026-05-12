"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function UserFavoritesPage() {
  const router = useRouter();

  const [favs, setFavs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);

    try {
      const res = await api.get("/api/v1/users/favorites");

      console.log("favorites response", res.data);

      const normalized = (res.data || []).map((item: any) => {
        // if backend returns populated car
        const car = item.car || item;

        return {
          _id: car._id,
          carId: car.carId,
          brand: car.brand,
          model: car.model,
          year: car.year,
          images: car.images || [],
          sellingPrice: car.sellingPrice,
          promoPrice: car.promoPrice,
          transmission: car.transmission,
          condition: car.condition,
          color: car.color,
          status: car.status,
          dealerName: car.dealerName,
          dealerLogo: car.dealerLogo,
          dealerWhatsapp: car.dealerWhatsapp,
        };
      });

      setFavs(normalized);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (carId: string, name: string) => {
    setRemoving(carId);

    try {
      await api.delete(`/api/v1/users/favorites/${carId}`);

      setFavs((prev) => prev.filter((c) => c.carId !== carId));

      setMsg(`${name} removed from saved cars`);

      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.log(err);
    } finally {
      setRemoving(null);
    }
  };

  const fmt = (n: number) =>
    `₦${(n || 0).toLocaleString()}`;

  const STATUS_COLOR: Record<string, string> = {
    available: "#16A34A",
    sold: "#888",
    reserved: "#D97706",
  };

  return (
    <div className="favs-page">
      <h2 className="page-heading">Saved Cars</h2>

      <p className="page-sub">
        {loading
          ? "Loading..."
          : `${favs.length} saved vehicle${favs.length !== 1 ? "s" : ""}`}
      </p>

      {msg && (
        <div className="msg">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : favs.length === 0 ? (
        <div className="empty">
          <div className="ei">❤️</div>

          <h3>No saved cars yet</h3>

          <p>
            Tap the save button on any car to add it here
          </p>

          <button
            className="browse-btn"
            onClick={() => router.push("/feed")}
          >
            Browse Cars →
          </button>
        </div>
      ) : (
        <div className="favs-grid">
          {favs.map((car) => (
            <div key={car.carId} className="fav-card">

              {/* IMAGE */}
              <div
                className="fav-img"
                onClick={() =>
                  router.push(`/cars/${car.carId}`)
                }
              >
                {car.images?.[0] ? (
                  <img src={car.images[0]} alt="" />
                ) : (
                  <div className="fav-ph">🚗</div>
                )}

                <div
                  className="fav-badge"
                  style={{
                    background:
                      STATUS_COLOR[car.status] || "#888",
                  }}
                >
                  {car.status}
                </div>
              </div>

              {/* DEALER */}
              {car.dealerName && (
                <div className="fav-dealer">
                  {car.dealerLogo && (
                    <img
                      src={car.dealerLogo}
                      alt=""
                      className="dl-logo"
                    />
                  )}

                  <span>{car.dealerName}</span>
                </div>
              )}

              {/* BODY */}
              <div
                className="fav-body"
                onClick={() =>
                  router.push(`/cars/${car.carId}`)
                }
              >
                <div className="fav-title">
                  {car.brand} {car.model} {car.year}
                </div>

                <div className="fav-meta">
                  {[car.color, car.transmission, car.condition]
                    .filter(Boolean)
                    .join(" · ")}
                </div>

                <div className="fav-price">
                  {fmt(car.sellingPrice)}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="fav-actions">

                <button
                  className="fav-btn view"
                  onClick={() =>
                    router.push(`/cars/${car.carId}`)
                  }
                >
                  View Car
                </button>

                {car.dealerWhatsapp && (
                  <a
                    href={`https://wa.me/${car.dealerWhatsapp}?text=Hi, I am interested in the ${car.brand} ${car.model} ${car.year}`}
                    target="_blank"
                    rel="noreferrer"
                    className="fav-btn wa"
                  >
                    WhatsApp
                  </a>
                )}

                <button
                  className="fav-btn remove"
                  onClick={() =>
                    remove(
                      car.carId,
                      `${car.brand} ${car.model}`
                    )
                  }
                  disabled={removing === car.carId}
                >
                  {removing === car.carId
                    ? "Removing..."
                    : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .favs-page{
          display:flex;
          flex-direction:column;
          gap:1rem;
        }

        .page-heading{
          font-size:1.5rem;
          font-weight:700;
        }

        .page-sub{
          color:#737373;
          font-size:0.9rem;
        }

        .msg{
          background:#FFF7ED;
          border:1px solid rgba(244,123,32,0.4);
          color:#C4621A;
          padding:0.75rem 1rem;
          border-radius:8px;
        }

        .loading{
          display:flex;
          justify-content:center;
          align-items:center;
          min-height:220px;
        }

        .spinner{
          width:28px;
          height:28px;
          border:3px solid #E5E5E5;
          border-top-color:#F47B20;
          border-radius:50%;
          animation:spin .8s linear infinite;
        }

        @keyframes spin{
          to{transform:rotate(360deg)}
        }

        .empty{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:1rem;
          padding:4rem 1rem;
          text-align:center;
        }

        .ei{
          font-size:3rem;
        }

        .browse-btn{
          background:#F47B20;
          color:#fff;
          border:none;
          padding:0.8rem 1.3rem;
          border-radius:8px;
          cursor:pointer;
        }

        .favs-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
          gap:1rem;
        }

        .fav-card{
          background:#fff;
          border:1px solid #E5E5E5;
          border-radius:12px;
          overflow:hidden;
          display:flex;
          flex-direction:column;
        }

        .fav-img{
          height:180px;
          background:#F5F5F5;
          position:relative;
          cursor:pointer;
        }

        .fav-img img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .fav-ph{
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:3rem;
        }

        .fav-badge{
          position:absolute;
          top:10px;
          left:10px;
          color:#fff;
          padding:0.2rem 0.6rem;
          border-radius:999px;
          font-size:0.7rem;
        }

        .fav-dealer{
          padding:0.6rem 1rem;
          border-bottom:1px solid #F0F0F0;
          display:flex;
          align-items:center;
          gap:0.5rem;
          font-size:0.8rem;
          color:#666;
        }

        .dl-logo{
          width:20px;
          height:20px;
          border-radius:4px;
          object-fit:cover;
        }

        .fav-body{
          padding:1rem;
          display:flex;
          flex-direction:column;
          gap:0.4rem;
          cursor:pointer;
          flex:1;
        }

        .fav-title{
          font-weight:700;
        }

        .fav-meta{
          color:#888;
          font-size:0.8rem;
        }

        .fav-price{
          color:#F47B20;
          font-weight:700;
          font-size:1.1rem;
        }

        .fav-actions{
          display:flex;
          gap:0.5rem;
          padding:1rem;
          border-top:1px solid #F0F0F0;
        }

        .fav-btn{
          flex:1;
          padding:0.6rem;
          border-radius:6px;
          border:none;
          cursor:pointer;
          text-align:center;
          text-decoration:none;
          font-size:0.8rem;
        }

        .fav-btn.view{
          background:#FFF7ED;
          color:#C4621A;
        }

        .fav-btn.wa{
          background:#DCFCE7;
          color:#166534;
        }

        .fav-btn.remove{
          background:#FEF2F2;
          color:#DC2626;
        }
      `}</style>
    </div>
  );
}