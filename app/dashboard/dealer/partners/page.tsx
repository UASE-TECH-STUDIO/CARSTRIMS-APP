"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== "all") params.status = filter;
      const res = await api.get("/api/v1/partners/", { params });
      setPartners(res.data.partners || res.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchPartners(); }, [filter]);

  const openDetail = async (partner: any) => {
    setShowDetail(partner);
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/v1/partners/${partner._id || partner.linkId}/detail`);
      setDetailData(res.data);
    } catch { setDetailData(null); }
    finally { setDetailLoading(false); }
  };

  const handleAction = async (linkId: string, action: string, data?: any) => {
    try {
      if (action === "approve") await api.post(`/api/v1/partners/${linkId}/approve`);
      else if (action === "reject") await api.post(`/api/v1/partners/${linkId}/reject`, data);
      else if (action === "remove") { if (!confirm("Remove this partner?")) return; await api.delete(`/api/v1/partners/${linkId}`); }
      setShowDetail(null); fetchPartners();
    } catch (e: any) { alert(e.response?.data?.detail || "Action failed"); }
  };

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;
  const STATUS_COLORS: Record<string,string> = {
    approved:"#16A34A", pending:"#D97706", rejected:"#DC2626", removed:"#888"
  };

  return (
    <div className="partners-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Partners</h2>
          <p className="page-sub">{partners.length} partner{partners.length!==1?"s":""}</p>
        </div>
      </div>

      <div className="filter-tabs">
        {["all","pending","approved","rejected"].map((s) => (
          <button key={s} className={`ftab ${filter===s?"active":""}`} onClick={() => setFilter(s)}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : partners.length === 0 ? (
        <div className="empty"><div className="ei">🤝</div><h3>No partners yet</h3><p>Partners who request to link with your dealership will appear here</p></div>
      ) : (
        <div className="partner-list">
          {partners.map((p) => (
            <div key={p._id} className="partner-card" onClick={() => openDetail(p)}>
              <div className="partner-left">
                <div className="partner-avatar">{p.partnerName?.charAt(0) || p.userId?.charAt(0) || "P"}</div>
                <div className="partner-info">
                  <div className="partner-name">{p.partnerName || p.partnerEmail || "Partner"}</div>
                  <div className="partner-email">{p.partnerEmail || "—"}</div>
                  <div className="partner-phone">{p.partnerPhone || "—"}</div>
                </div>
              </div>
              <div className="partner-right">
                <span className="partner-status" style={{color:STATUS_COLORS[p.status]||"#888",borderColor:(STATUS_COLORS[p.status]||"#888")+"44",background:(STATUS_COLORS[p.status]||"#888")+"11"}}>
                  {p.status}
                </span>
                <div className="partner-cars">{p.carIds?.length||0} cars assigned</div>
                <div className="view-detail-btn">View Details →</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PARTNER DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => { setShowDetail(null); setDetailData(null); }}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">PARTNER DETAILS</h3>
              <button className="modal-close" onClick={() => { setShowDetail(null); setDetailData(null); }}>✕</button>
            </div>
            <div className="modal-form">
              {detailLoading ? (
                <div className="loading"><div className="spinner" /></div>
              ) : detailData ? (
                <>
                  {/* Partner Info */}
                  <div className="detail-section">
                    <div className="ds-title">PARTNER INFORMATION</div>
                    <div className="detail-grid-2">
                      <div className="dg-item"><div className="dg-label">Name</div><div className="dg-val">{detailData.partner?.fullName||"—"}</div></div>
                      <div className="dg-item"><div className="dg-label">Email</div><div className="dg-val">{detailData.partner?.email||"—"}</div></div>
                      <div className="dg-item"><div className="dg-label">Phone</div><div className="dg-val">{detailData.partner?.phone||"—"}</div></div>
                      <div className="dg-item"><div className="dg-label">Status</div><div className="dg-val" style={{color:STATUS_COLORS[showDetail.status]||"#888"}}>{showDetail.status}</div></div>
                    </div>
                  </div>

                  {/* Audit Summary */}
                  <div className="audit-row">
                    <div className="audit-card"><div className="ac-val">{detailData.totalCars}</div><div className="ac-label">Total Cars</div></div>
                    <div className="audit-card"><div className="ac-val">{detailData.carsSold}</div><div className="ac-label">Cars Sold</div></div>
                    <div className="audit-card"><div className="ac-val">{detailData.carsAvailable}</div><div className="ac-label">Available</div></div>
                    <div className="audit-card accent"><div className="ac-val">{fmt(detailData.totalRevenue)}</div><div className="ac-label">Total Revenue</div></div>
                    <div className="audit-card accent"><div className="ac-val">{fmt(detailData.totalProfit)}</div><div className="ac-label">Total Profit</div></div>
                  </div>

                  {/* Assigned Cars */}
                  {detailData.cars?.length > 0 && (
                    <div className="detail-section">
                      <div className="ds-title">ASSIGNED CARS ({detailData.cars.length})</div>
                      <div className="cars-mini-list">
                        {detailData.cars.map((c: any) => (
                          <div key={c._id} className="car-mini">
                            <div className="cm-img">{c.images?.[0]?<img src={c.images[0]} alt=""/>:"🚗"}</div>
                            <div className="cm-info">
                              <div className="cm-name">{c.brand} {c.model} {c.year}</div>
                              <div className="cm-id">{c.carId}</div>
                            </div>
                            <div className="cm-price">{fmt(c.sellingPrice)}</div>
                            <div className="cm-status" style={{color:c.status==="sold"?"#16A34A":"#F47B20"}}>{c.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Movements */}
                  {detailData.recentMovements?.length > 0 && (
                    <div className="detail-section">
                      <div className="ds-title">RECENT MOVEMENTS</div>
                      {detailData.recentMovements.slice(0,5).map((m: any) => (
                        <div key={m._id} className="mov-mini">
                          <span>{m.carId}</span>
                          <span>{m.takenByName}</span>
                          <span style={{color:m.status==="returned"?"#16A34A":"#F47B20"}}>{m.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="modal-footer">
                    {showDetail.status === "pending" && (
                      <>
                        <button className="btn-approve" onClick={() => handleAction(showDetail._id||showDetail.linkId,"approve")}>✅ Approve Partner</button>
                        <button className="btn-reject" onClick={() => handleAction(showDetail._id||showDetail.linkId,"reject",{reason:"Rejected by dealer"})}>✕ Reject</button>
                      </>
                    )}
                    {showDetail.status === "approved" && (
                      <button className="btn-reject" onClick={() => handleAction(showDetail._id||showDetail.linkId,"remove")}>Remove Partner</button>
                    )}
                    <button className="btn-outline" onClick={() => { setShowDetail(null); setDetailData(null); }}>Close</button>
                  </div>
                </>
              ) : (
                <div className="empty" style={{padding:"2rem"}}>
                  <p>Could not load partner details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .partners-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .filter-tabs{display:flex;gap:0.3rem}
        .ftab{background:transparent;border:1.5px solid #DDD;border-radius:20px;padding:0.3rem 0.875rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);color:#888;transition:all 0.2s;text-transform:capitalize}
        .ftab:hover{border-color:#F47B20;color:#F47B20}
        .ftab.active{background:#F47B20;color:#fff;border-color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .partner-list{display:flex;flex-direction:column;gap:0.75rem}
        .partner-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;cursor:pointer;transition:all 0.2s}
        .partner-card:hover{border-color:#F47B20;background:#FFFAF7}
        .partner-left{display:flex;align-items:center;gap:1rem}
        .partner-avatar{width:44px;height:44px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1.2rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .partner-info{display:flex;flex-direction:column;gap:0.2rem}
        .partner-name{font-weight:600;font-size:0.9rem;color:#1A1A1A}
        .partner-email{font-size:0.78rem;color:#888}
        .partner-phone{font-size:0.78rem;color:#AAA}
        .partner-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;flex-shrink:0}
        .partner-status{padding:0.2rem 0.65rem;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize;border:1px solid}
        .partner-cars{font-size:0.75rem;color:#888}
        .view-detail-btn{font-size:0.75rem;color:#F47B20;font-weight:500}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-xl{max-width:720px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1.25rem}
        .detail-section{display:flex;flex-direction:column;gap:0.75rem}
        .ds-title{font-size:0.68rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#AAA;padding-bottom:0.5rem;border-bottom:1px solid #F0F0F0}
        .detail-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .dg-item{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.6rem}
        .dg-label{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.2rem}
        .dg-val{font-size:0.825rem;color:#1A1A1A}
        .audit-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0.75rem}
        .audit-card{background:#FAFAFA;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.875rem;text-align:center}
        .audit-card.accent{border-color:#F47B20;background:#FFF7ED}
        .ac-val{font-family:var(--font-display);font-size:1.3rem;color:#F47B20;line-height:1}
        .ac-label{font-size:0.65rem;color:#888;margin-top:0.2rem;text-transform:uppercase;letter-spacing:0.06em}
        .cars-mini-list{display:flex;flex-direction:column;gap:0.5rem}
        .car-mini{display:flex;align-items:center;gap:0.75rem;padding:0.5rem;background:#FAFAFA;border-radius:6px}
        .cm-img{width:40px;height:30px;border-radius:4px;overflow:hidden;background:#E5E5E5;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
        .cm-img img{width:100%;height:100%;object-fit:cover}
        .cm-info{flex:1}
        .cm-name{font-size:0.825rem;font-weight:500;color:#1A1A1A}
        .cm-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .cm-price{font-size:0.825rem;color:#F47B20;font-weight:500}
        .cm-status{font-size:0.7rem;font-weight:500;text-transform:capitalize}
        .mov-mini{display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;background:#FAFAFA;border-radius:5px;font-size:0.8rem;color:#666;border:1px solid #F0F0F0}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s}
        .btn-outline:hover{border-color:#F47B20;color:#F47B20}
        .btn-approve{background:#16A34A;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;cursor:pointer;letter-spacing:0.06em}
        .btn-reject{background:#DC2626;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;cursor:pointer;letter-spacing:0.06em}
      `}</style>
    </div>
  );
}
