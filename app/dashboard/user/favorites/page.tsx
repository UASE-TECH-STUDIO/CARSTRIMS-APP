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

  const load = () => {
    setLoading(true);

    api.get("/api/v1/users/favorites")
      .then((r) => setFavs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (carId: string, name: string) => {
    setRemoving(carId);

    try {
      await api.delete(`/api/v1/users/favorites/${carId}`);

      setMsg(`${name} removed from saved cars`);

      setTimeout(() => {
        setMsg("");
      }, 3000);

      load();
    } catch {}

    setRemoving(null);
  };

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

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
        <div
          style={{
            background: "#FFF7ED",
            border: "1px solid rgba(244,123,32,0.4)",
            color: "#C4621A",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
          }}
        >
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
            Tap the heart icon on any car while browsing to save it here
          </p>

          <a href="/feed" className="browse-btn">
            Browse Cars →
          </a>
        </div>
      ) : (
        <div className="favs-grid">
          {favs.map((car) => (
            <div key={car._id} className="fav-card">
              <div
                className="fav-img"
                onClick={() => router.push(`/cars/${car.carId}`)}
              >
                {car.images?.[0] ? (
                  <img src={car.images[0]} alt="" />
                ) : (
                  <div className="fav-ph">🚗</div>
                )}

                <div
                  className="fav-badge"
                  style={{
                    background: STATUS_COLOR[car.status] || "#888",
                  }}
                >
                  {car.status}
                </div>
              </div>

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

              <div
                className="fav-body"
                onClick={() => router.push(`/cars/${car.carId}`)}
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

              <div className="fav-actions">
                <button
                  className="fav-btn view"
                  onClick={() => router.push(`/cars/${car.carId}`)}
                >
                  View Car →
                </button>

                {car.status === "available" &&
                  car.dealerWhatsapp && (
                    <a
                      href={`https://wa.me/${car.dealerWhatsapp}?text=Hi, I am interested in the ${car.brand} ${car.model} ${car.year} (${car.carId})`}
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
                    ? "..."
                    : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .favs-page{display:flex;flex-direction:column;gap:1.25rem;padding-bottom:1rem}
      `}</style>
    </div>
  );
}