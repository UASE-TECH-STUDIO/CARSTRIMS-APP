"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function FindDealerPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myLinks, setMyLinks] = useState<any[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [dealerCars, setDealerCars] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    // Load all dealers + my links on mount
    Promise.all([
      api.get("/api/v1/public/dealers", { params: { limit: 20 } }),
      api.get("/api/v1/partners/my-links"),
    ]).then(([dealerRes, linksRes]) => {
      setResults(dealerRes.data.dealers || []);
      setMyLinks(linksRes.data || []);
    }).catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await api.get("/api/v1/public/dealers", { params: { search, limit: 20 } });
      setResults(res.data.dealers || []);
    } catch { } finally { setLoading(false); }
  };

  const getLinkStatus = (dealerMongoId: string): string | null => {
    const link = myLinks.find((l) =>
      l.dealerId === dealerMongoId ||
      l.dealerDealerId === dealerMongoId
    );
    return link ? link.status : null;
  };

  const handleRequest = async (dealer: any) => {
    const status = getLinkStatus(dealer._id);
    if (status) return; // Already linked

    setRequesting(dealer._id); setError("");
    try {
      await api.post("/api/v1/partners/request", { dealerId: dealer._id });
      setSuccess((prev) => ({ ...prev, [dealer._id]: true }));
      // Refresh links
      const linksRes = await api.get("/api/v1/partners/my-links");
      setMyLinks(linksRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Request failed");
    } finally { setRequesting(null); }
  };

  const openDealerProfile = async (dealer: any) => {
    setSelectedDealer(dealer);
    setLoadingProfile(true);
    try {
      const res = await api.get(`/api/v1/public/dealers/${dealer.dealerId || dealer._id}`);
      setDealerCars(res.data.availableCars || []);
    } catch { setDealerCars([]); }
    finally { setLoadingProfile(false); }
  };

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;
  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    approved: { label: "✅ Linked Partner", color: "#16A34A" },
    pending: { label: "⏳ Request Pending", color: "#D97706" },
    rejected: { label: "✕ Request Declined", color: "#DC2626" },
  };

  return (
    <div className="find-page">
      <div className="page-header">
        <h2 className="page-heading">Find a Dealer</h2>
        <p className="page-sub">Browse approved dealers and send partnership requests</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input className="search-input" placeholder="Search by dealer name, city or state..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="error-msg">❌ {error}<button onClick={() => setError("")} style={{background:"none",border:"none",cursor:"pointer",marginLeft:"0.5rem"}}>✕</button></div>}

      {results.length === 0 && !loading ? (
        <div className="empty"><div className="ei">🔍</div><h3>No dealers found</h3><p>Try a different search term</p></div>
      ) : (
        <div className="results-list">
          {results.map((d) => {
            const linkStatus = getLinkStatus(d._id);
            const statusInfo = linkStatus ? STATUS_LABELS[linkStatus] : null;

            return (
              <div key={d._id} className="dealer-card">
                <div className="dealer-left" onClick={() => openDealerProfile(d)} style={{cursor:"pointer",flex:1}}>
                  <div className="dealer-logo">
                    {d.logo ? <img src={d.logo} alt="" /> : d.companyName?.charAt(0)}
                  </div>
                  <div className="dealer-info">
                    <div className="dealer-name">{d.companyName}</div>
                    <div className="dealer-owner">{d.ownerName}</div>
                    <div className="dealer-meta">
                      {d.city && <span>📍 {d.city}, {d.state}</span>}
                      <span>🚗 {d.totalCarsListed || 0} listed</span>
                      <span>✅ {d.totalCarsSold || 0} sold</span>
                    </div>
                    {d.description && <div className="dealer-desc">{d.description}</div>}
                  </div>
                </div>

                <div className="dealer-right">
                  <div className="dealer-id">{d.dealerId}</div>
                  <div className="dealer-contacts">
                    {d.phone && <a href={`tel:${d.phone}`} className="cpi" onClick={(e) => e.stopPropagation()}>📞</a>}
                    {d.whatsapp && <a href={`https://wa.me/${d.whatsapp}`} target="_blank" rel="noreferrer" className="cpi" onClick={(e) => e.stopPropagation()}>💬</a>}
                    {d.email && <a href={`mailto:${d.email}`} className="cpi" onClick={(e) => e.stopPropagation()}>✉️</a>}
                  </div>
                  <button className="profile-btn" onClick={() => openDealerProfile(d)}>View Profile</button>
                  {statusInfo ? (
                    <div className="link-status" style={{color:statusInfo.color}}>{statusInfo.label}</div>
                  ) : success[d._id] ? (
                    <div className="link-status" style={{color:"#D97706"}}>⏳ Request Sent!</div>
                  ) : (
                    <button className="request-btn" onClick={() => handleRequest(d)} disabled={requesting === d._id}>
                      {requesting === d._id ? "Sending..." : "Send Partnership Request"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEALER PROFILE MODAL */}
      {selectedDealer && (
        <div className="modal-overlay" onClick={() => setSelectedDealer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand">
                <div className="modal-logo">
                  {selectedDealer.logo
                    ? <img src={selectedDealer.logo} alt="" />
                    : selectedDealer.companyName?.charAt(0)
                  }
                </div>
                <div>
                  <h3 className="modal-title">{selectedDealer.companyName}</h3>
                  <div className="modal-id">{selectedDealer.dealerId}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedDealer(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="profile-stats">
                <div className="ps-item"><span className="ps-val">{selectedDealer.totalCarsListed || 0}</span><span className="ps-label">Listed</span></div>
                <div className="ps-item"><span className="ps-val">{selectedDealer.totalCarsSold || 0}</span><span className="ps-label">Sold</span></div>
                <div className="ps-item accent"><span className="ps-val">{fmt(selectedDealer.totalRevenue || 0)}</span><span className="ps-label">Revenue</span></div>
              </div>

              {selectedDealer.description && (
                <div className="profile-desc">{selectedDealer.description}</div>
              )}

              <div className="profile-contacts">
                {selectedDealer.phone && <a href={`tel:${selectedDealer.phone}`} className="contact-btn">📞 {selectedDealer.phone}</a>}
                {selectedDealer.whatsapp && <a href={`https://wa.me/${selectedDealer.whatsapp}`} target="_blank" rel="noreferrer" className="contact-btn">💬 WhatsApp</a>}
                {selectedDealer.email && <a href={`mailto:${selectedDealer.email}`} className="contact-btn">✉️ {selectedDealer.email}</a>}
                {selectedDealer.city && <div className="contact-btn">📍 {selectedDealer.city}, {selectedDealer.state}</div>}
              </div>

              {/* Available Cars */}
              {loadingProfile ? (
                <div className="prof-loading"><div className="mini-spin" /></div>
              ) : dealerCars.length > 0 && (
                <div className="dealer-cars-section">
                  <div className="dc-title">AVAILABLE CARS ({dealerCars.length})</div>
                  <div className="cars-mini">
                    {dealerCars.slice(0, 6).map((c: any) => (
                      <a key={c._id} href={`/cars/${c.carId}`} target="_blank" rel="noreferrer" className="car-mini-card">
                        <div className="cm-img">
                          {c.images?.[0] ? <img src={c.images[0]} alt="" /> : "🚗"}
                        </div>
                        <div className="cm-info">
                          <div className="cm-name">{c.brand} {c.model}</div>
                          <div className="cm-price">{fmt(c.sellingPrice)}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* QR */}
              {selectedDealer.qrCode && (
                <div className="qr-mini">
                  <img src={selectedDealer.qrCode} alt="QR" className="qr-img-mini" />
                  <div className="qr-mini-label">Scan to view all cars</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {(() => {
                const linkStatus = getLinkStatus(selectedDealer._id);
                const statusInfo = linkStatus ? STATUS_LABELS[linkStatus] : null;
                if (statusInfo) return <div className="link-status-large" style={{color:statusInfo.color}}>{statusInfo.label}</div>;
                if (success[selectedDealer._id]) return <div className="link-status-large" style={{color:"#D97706"}}>⏳ Partnership request sent</div>;
                return (
                  <button className="request-btn-lg" onClick={() => handleRequest(selectedDealer)} disabled={requesting === selectedDealer._id}>
                    {requesting === selectedDealer._id ? "Sending..." : "Send Partnership Request"}
                  </button>
                );
              })()}
              <button className="btn-outline" onClick={() => setSelectedDealer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .find-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;flex-direction:column;gap:0.3rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.875rem;color:#888}
        .search-form{display:flex;gap:0.75rem}
        .search-input{flex:1;background:#fff;border:1.5px solid #DDD;border-radius:8px;padding:0.875rem 1rem;color:#1A1A1A;font-size:0.9rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s}
        .search-input:focus{border-color:#3B8BD4}
        .search-input::placeholder{color:#CCC}
        .search-btn{background:#3B8BD4;color:#fff;border:none;border-radius:8px;padding:0.875rem 1.5rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:opacity 0.2s}
        .search-btn:hover{opacity:0.85}
        .search-btn:disabled{opacity:0.6;cursor:not-allowed}
        .error-msg{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:6px;font-size:0.875rem;display:flex;align-items:center}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .results-list{display:flex;flex-direction:column;gap:0.875rem}
        .dealer-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;transition:border-color 0.2s}
        .dealer-card:hover{border-color:#3B8BD4}
        .dealer-left{display:flex;align-items:flex-start;gap:1rem}
        .dealer-logo{width:52px;height:52px;border-radius:10px;background:#3B8BD4;color:#fff;font-family:var(--font-display);font-size:1.3rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid #EFF6FF}
        .dealer-logo img{width:100%;height:100%;object-fit:cover}
        .dealer-info{display:flex;flex-direction:column;gap:0.25rem}
        .dealer-name{font-weight:700;font-size:0.95rem;color:#1A1A1A}
        .dealer-owner{font-size:0.78rem;color:#888}
        .dealer-meta{display:flex;gap:1rem;flex-wrap:wrap}
        .dealer-meta span{font-size:0.72rem;color:#888}
        .dealer-desc{font-size:0.78rem;color:#AAA;max-width:400px}
        .dealer-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem;flex-shrink:0}
        .dealer-id{font-family:var(--font-mono);font-size:0.7rem;color:#AAA}
        .dealer-contacts{display:flex;gap:0.35rem}
        .cpi{background:#F5F5F5;border:1px solid #E5E5E5;border-radius:20px;padding:0.25rem 0.55rem;font-size:0.9rem;text-decoration:none;transition:all 0.2s}
        .cpi:hover{border-color:#3B8BD4;background:#EFF6FF}
        .profile-btn{background:#F5F5F5;border:1.5px solid #DDD;color:#666;border-radius:5px;padding:0.3rem 0.75rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
        .profile-btn:hover{border-color:#3B8BD4;color:#3B8BD4;background:#EFF6FF}
        .link-status{font-size:0.8rem;font-weight:600;white-space:nowrap}
        .request-btn{background:rgba(59,139,212,0.1);border:1.5px solid rgba(59,139,212,0.4);color:#3B8BD4;border-radius:6px;padding:0.55rem 1rem;font-size:0.8rem;cursor:pointer;transition:all 0.2s;font-family:var(--font-body);white-space:nowrap}
        .request-btn:hover{background:rgba(59,139,212,0.2)}
        .request-btn:disabled{opacity:0.6;cursor:not-allowed}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-brand{display:flex;align-items:center;gap:0.875rem}
        .modal-logo{width:44px;height:44px;border-radius:8px;background:#3B8BD4;color:#fff;font-family:var(--font-display);font-size:1.2rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .modal-logo img{width:100%;height:100%;object-fit:cover}
        .modal-title{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.05em;color:#1A1A1A}
        .modal-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer;flex-shrink:0}
        .modal-body{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1.25rem}
        .profile-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem}
        .ps-item{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:8px;padding:0.875rem;text-align:center;display:flex;flex-direction:column;gap:0.2rem}
        .ps-item.accent{background:#EFF6FF;border-color:#3B8BD4}
        .ps-val{font-family:var(--font-display);font-size:1.3rem;color:#3B8BD4}
        .ps-label{font-size:0.65rem;color:#888;text-transform:uppercase;letter-spacing:0.06em}
        .profile-desc{font-size:0.875rem;color:#666;line-height:1.6;background:#FAFAFA;border-radius:6px;padding:0.875rem}
        .profile-contacts{display:flex;flex-direction:column;gap:0.5rem}
        .contact-btn{display:block;background:#F5F5F5;border:1px solid #E5E5E5;border-radius:6px;padding:0.6rem 0.875rem;font-size:0.825rem;color:#555;text-decoration:none;transition:all 0.2s}
        .contact-btn:hover{border-color:#3B8BD4;color:#3B8BD4;background:#EFF6FF}
        .prof-loading{display:flex;justify-content:center;padding:1rem}
        .mini-spin{width:24px;height:24px;border:2px solid #E5E5E5;border-top-color:#3B8BD4;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dealer-cars-section{display:flex;flex-direction:column;gap:0.75rem}
        .dc-title{font-size:0.68rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#888}
        .cars-mini{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .car-mini-card{display:flex;align-items:center;gap:0.625rem;background:#FAFAFA;border:1px solid #E5E5E5;border-radius:6px;padding:0.5rem 0.75rem;text-decoration:none;transition:all 0.2s}
        .car-mini-card:hover{border-color:#3B8BD4;background:#EFF6FF}
        .cm-img{width:36px;height:28px;border-radius:4px;overflow:hidden;background:#E5E5E5;display:flex;align-items:center;justify-content:center;font-size:0.875rem;flex-shrink:0}
        .cm-img img{width:100%;height:100%;object-fit:cover}
        .cm-name{font-size:0.78rem;font-weight:500;color:#1A1A1A}
        .cm-price{font-size:0.72rem;color:#3B8BD4;font-weight:600}
        .qr-mini{display:flex;align-items:center;gap:1rem;padding:0.875rem;background:#FAFAFA;border-radius:8px;border:1px solid #E5E5E5}
        .qr-img-mini{width:60px;height:60px;border-radius:4px;border:2px solid #E5E5E5}
        .qr-mini-label{font-size:0.78rem;color:#888}
        .modal-footer{display:flex;align-items:center;gap:0.75rem;padding:1.25rem 1.5rem;border-top:1px solid #E5E5E5;justify-content:flex-end}
        .link-status-large{font-size:0.875rem;font-weight:600;flex:1}
        .request-btn-lg{background:#3B8BD4;color:#fff;border:none;border-radius:6px;padding:0.75rem 1.5rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;flex:1;transition:opacity 0.2s}
        .request-btn-lg:hover{opacity:0.85}
        .request-btn-lg:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.75rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .btn-outline:hover{border-color:#3B8BD4;color:#3B8BD4}
        @media(max-width:640px){.profile-stats{grid-template-columns:1fr 1fr}.cars-mini{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
