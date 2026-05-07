"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  available: "#4CAF82",
  sold: "#888",
  reserved: "#C9A84C",
};

export default function DealerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const dealerId = params?.dealerId as string;

  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealerId) return;

    api
      .get(`/api/v1/public/dealers/${dealerId}`)
      .then((r) => setDealer(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealerId]);

  if (loading) {
    return (
      <div className="loading-pg">
        <div className="spinner" />
        <style>{`
          .loading-pg{
            display:flex;
            align-items:center;
            justify-content:center;
            min-height:100vh;
            background:var(--black);
          }
          .spinner{
            width:32px;
            height:32px;
            border:2px solid var(--border);
            border-top-color:var(--gold);
            border-radius:50%;
            animation:spin .8s linear infinite;
          }
          @keyframes spin{
            to{transform:rotate(360deg)}
          }
        `}</style>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--black)",
          color: "var(--text)",
        }}
      >
        Dealer not found
        <Link href="/" style={{ color: "var(--gold)", marginLeft: "1rem" }}>
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="dealer-profile">
      <header className="dp-topbar">
        <button className="back-btn" onClick={() => router.back()}>
          ← Back
        </button>

        <Link href="/" className="brand">
          CARTRACK
        </Link>
      </header>

      <div className="dp-hero">
        {dealer.banner && (
          <img src={dealer.banner} alt="" className="dp-banner" />
        )}

        <div className="dp-hero-content">
          <div className="dp-logo">
            {dealer.logo ? (
              <img src={dealer.logo} alt="" />
            ) : (
              <span>{dealer.companyName?.charAt(0)}</span>
            )}
          </div>

          <div className="dp-hero-info">
            <h1 className="dp-name">{dealer.companyName}</h1>
            <div className="dp-owner">{dealer.ownerName}</div>

            <div className="dp-meta">
              <span>
                📍 {dealer.city || "N/A"}, {dealer.state || "N/A"}
              </span>
              <span>
                🚗 {dealer.totalCarsListed || 0} listed
              </span>
              <span>
                ✔ {dealer.totalCarsSold || 0} sold
              </span>
            </div>
          </div>

          {dealer.qrCode && (
            <div className="dp-qr">
              <img src={dealer.qrCode} alt="QR Code" className="qr-img" />
              <div className="qr-label">Scan to visit</div>
            </div>
          )}
        </div>
      </div>

      <div className="dp-body">
        <div className="dp-sidebar">
          {dealer.description && (
            <div className="dp-card">
              <div className="dp-card-title">ABOUT</div>
              <p className="dp-desc">{dealer.description}</p>
            </div>
          )}

          <div className="dp-card">
            <div className="dp-card-title">CONTACT</div>

            <div className="dp-contacts">
              {dealer.phone && (
                <a href={`tel:${dealer.phone}`} className="dp-contact-btn">
                  📞 {dealer.phone}
                </a>
              )}

              {dealer.whatsapp && (
                <a
                  href={`https://wa.me/${dealer.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="dp-contact-btn"
                >
                  💬 WhatsApp
                </a>
              )}

              {dealer.email && (
                <a href={`mailto:${dealer.email}`} className="dp-contact-btn">
                  ✉ {dealer.email}
                </a>
              )}
            </div>
          </div>

          <div className="dp-card">
            <div className="dp-card-title">STATS</div>

            <div className="dp-stats">
              <div className="dp-stat">
                <span className="ds-val">
                  {dealer.totalCarsListed || 0}
                </span>
                <span className="ds-label">Cars Listed</span>
              </div>

              <div className="dp-stat">
                <span className="ds-val">
                  {dealer.totalCarsSold || 0}
                </span>
                <span className="ds-label">Cars Sold</span>
              </div>

              <div className="dp-stat">
                <span className="ds-val">
                  ₦{(dealer.totalRevenue || 0).toLocaleString()}
                </span>
                <span className="ds-label">Revenue</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dp-cars">
          <h2 className="dp-cars-title">
            AVAILABLE CARS ({dealer.availableCars?.length || 0})
          </h2>

          {dealer.availableCars?.length === 0 ? (
            <div className="no-cars">No available cars right now</div>
          ) : (
            <div className="cars-grid">
              {dealer.availableCars?.map((c: any) => (
                <Link
                  key={c._id}
                  href={`/cars/${c.carId}`}
                  className="car-card"
                >
                  <div className="car-img">
                    {c.images?.[0] ? (
                      <img src={c.images[0]} alt="" />
                    ) : (
                      <span className="car-ph">No Image</span>
                    )}

                    <div
                      className="car-st"
                      style={{
                        background: STATUS_COLORS[c.status] || "#555",
                      }}
                    >
                      {c.status}
                    </div>
                  </div>

                  <div className="car-body">
                    <div className="car-name">
                      {c.brand} {c.model} {c.year}
                    </div>

                    <div className="car-meta">
                      {c.color} • {c.transmission}
                    </div>

                    <div className="car-price">
                      ₦{c.sellingPrice?.toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dealer-profile{
          min-height:100vh;
          background:var(--black);
          color:var(--text);
          font-family:var(--font-body);
        }

        .dp-topbar{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:.875rem 1.5rem;
          background:var(--surface);
          border-bottom:1px solid var(--border);
          position:sticky;
          top:0;
          z-index:50;
        }

        .back-btn{
          background:none;
          border:none;
          color:var(--text-muted);
          cursor:pointer;
        }

        .brand{
          color:var(--gold);
          text-decoration:none;
        }

        .dp-hero{
          background:var(--surface);
          border-bottom:1px solid var(--border);
        }

        .dp-banner{
          width:100%;
          height:180px;
          object-fit:cover;
          opacity:.5;
        }

        .dp-hero-content{
          display:flex;
          gap:1rem;
          flex-wrap:wrap;
          padding:1.5rem;
          margin-top:-40px;
        }

        .dp-logo{
          width:80px;
          height:80px;
          border-radius:12px;
          overflow:hidden;
          background:var(--gold-dim);
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .dp-logo img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .dp-hero-info{
          flex:1;
        }

        .dp-name{
          font-size:2rem;
          margin:0;
        }

        .dp-meta{
          display:flex;
          gap:1rem;
          flex-wrap:wrap;
          font-size:.8rem;
        }

        .dp-body{
          display:grid;
          grid-template-columns:280px 1fr;
          gap:1.5rem;
          max-width:1200px;
          margin:auto;
          padding:1.5rem;
        }

        .dp-sidebar{
          display:flex;
          flex-direction:column;
          gap:1rem;
        }

        .dp-card{
          background:var(--surface);
          border:1px solid var(--border);
          border-radius:10px;
          padding:1rem;
        }

        .dp-contacts{
          display:flex;
          flex-direction:column;
          gap:.5rem;
        }

        .dp-contact-btn{
          text-decoration:none;
          color:var(--text);
          background:var(--surface-2);
          padding:.65rem;
          border-radius:6px;
        }

        .dp-stats{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:.5rem;
        }

        .dp-stat{
          background:var(--surface-2);
          border-radius:6px;
          padding:.5rem;
        }

        .dp-cars{
          display:flex;
          flex-direction:column;
          gap:1rem;
        }

        .cars-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
          gap:.875rem;
        }

        .car-card{
          text-decoration:none;
          background:var(--surface);
          border:1px solid var(--border);
          border-radius:10px;
          overflow:hidden;
        }

        .car-img{
          height:130px;
          position:relative;
          background:var(--surface-2);
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .car-img img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .car-st{
          position:absolute;
          top:.4rem;
          right:.4rem;
          padding:.2rem .5rem;
          border-radius:20px;
          color:#fff;
          font-size:.65rem;
        }

        .car-body{
          padding:.875rem;
        }

        .car-price{
          color:var(--gold);
          margin-top:.35rem;
        }

        .no-cars{
          border:1px dashed var(--border);
          padding:2rem;
          border-radius:10px;
          text-align:center;
        }

        @media(max-width:900px){
          .dp-body{
            grid-template-columns:1fr;
          }
        }
      `}</style>
    </div>
  );
}