"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const STATUS_COLORS: Record<string,string> = {
  available:"#16A34A", sold:"#888", reserved:"#D97706",
  out_for_inspection:"#3B8BD4", in_repair:"#DC2626",
};

export default function PartnerCarsPage() {
  const router = useRouter();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/api/v1/partners/my-dashboard")
      .then((r) => setCars(r.data.cars || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? cars : cars.filter((c) => c.status === filter);
  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;

  return (
    <div className="cars-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">My Cars</h2>
          <p className="page-sub">{cars.length} vehicle{cars.length!==1?"s":""} assigned</p>
        </div>
      </div>

      <div className="filter-tabs">
        {["all","available","sold","out_for_inspection","in_repair"].map((s) => (
          <button key={s} className={`ftab ${filter===s?"active":""}`} onClick={() => setFilter(s)}>
            {s==="all"?"All":s.replace(/_/g," ")}
          </button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : filtered.length === 0 ? (
        <div className="empty"><div className="ei">🚗</div><h3>No cars found</h3><p>Cars assigned by dealers will appear here</p></div>
      ) : (
        <div className="cars-grid">
          {filtered.map((c) => (
            <div key={c._id} className="car-card" onClick={() => router.push(`/cars/${c.carId}`)}>
              <div className="car-img-wrap">
                {c.images?.[0]
                  ? <img src={c.images[0]} alt="" />
                  : <div className="car-ph">🚗</div>
                }
                <div className="car-badge" style={{background:STATUS_COLORS[c.status]||"#888"}}>{c.status.replace(/_/g," ")}</div>
                <div className="view-overlay">View Details →</div>
              </div>
              <div className="car-dealer-strip">
                <div className="dl-logo">{c.dealerLogo?<img src={c.dealerLogo} alt=""/>:c.dealerName?.charAt(0)||"D"}</div>
                <span className="dl-name">{c.dealerName||"Dealer"}</span>
              </div>
              <div className="car-body">
                <div className="car-id">{c.carId}</div>
                <div className="car-title">{c.brand} {c.model} {c.year}</div>
                <div className="car-meta">{c.color} · {c.transmission}</div>
                <div className="car-price">{fmt(c.sellingPrice)}</div>
                {c.status === "sold" && (
                  <div className="profit-row">
                    <span className="profit-label">Profit:</span>
                    <span className="profit-val">+{fmt(c.actualProfit||c.estimatedProfit||0)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .cars-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .filter-tabs{display:flex;gap:0.3rem;flex-wrap:wrap}
        .ftab{background:transparent;border:1.5px solid #DDD;border-radius:20px;padding:0.3rem 0.875rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);color:#888;transition:all 0.2s;text-transform:capitalize}
        .ftab:hover{border-color:#3B8BD4;color:#3B8BD4}
        .ftab.active{background:#3B8BD4;color:#fff;border-color:#3B8BD4}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#3B8BD4;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .cars-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem}
        .car-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.2s;cursor:pointer}
        .car-card:hover{border-color:#3B8BD4;transform:translateY(-2px);box-shadow:0 4px 16px rgba(59,139,212,0.1)}
        .car-img-wrap{height:160px;background:#F5F5F5;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
        .car-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
        .car-card:hover .car-img-wrap img{transform:scale(1.04)}
        .car-ph{font-size:2.5rem;opacity:0.2}
        .car-badge{position:absolute;top:0.5rem;left:0.5rem;padding:0.18rem 0.55rem;border-radius:20px;font-size:0.6rem;font-weight:600;text-transform:capitalize;color:#fff}
        .view-overlay{position:absolute;inset:0;background:rgba(59,139,212,0.75);color:#fff;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s}
        .car-card:hover .view-overlay{opacity:1}
        .car-dealer-strip{display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0.875rem;background:#F5F5F5;border-bottom:1px solid #E5E5E5}
        .dl-logo{width:18px;height:18px;border-radius:3px;background:#3B8BD4;color:#fff;font-size:0.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .dl-logo img{width:100%;height:100%;object-fit:cover}
        .dl-name{font-size:0.7rem;color:#888;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .car-body{padding:0.875rem;display:flex;flex-direction:column;gap:0.25rem;flex:1}
        .car-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .car-title{font-weight:700;font-size:0.9rem;color:#1A1A1A}
        .car-meta{font-size:0.7rem;color:#888;text-transform:capitalize}
        .car-price{font-family:var(--font-display);font-size:1.1rem;color:#3B8BD4;margin-top:0.25rem}
        .profit-row{display:flex;align-items:center;gap:0.4rem;margin-top:0.2rem}
        .profit-label{font-size:0.72rem;color:#888}
        .profit-val{font-size:0.78rem;color:#16A34A;font-weight:600}
      `}</style>
    </div>
  );
}
