"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function StaffPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => {
      setPerms(r.data.permissions||[]);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (perms.includes("view_partners")) {
      api.get("/api/v1/partners/", { params:{ limit:50 } })
        .then((r) => setPartners(r.data.partners||r.data||[]))
        .catch(()=>{})
        .finally(()=>setLoading(false));
    } else { setLoading(false); }
  }, [perms]);

  const canView = perms.includes("view_partners");

  if (!canView) return (
    <div className="denied">
      <div className="di">🔒</div>
      <h3>Access Restricted</h3>
      <p>You need the <strong>view_partners</strong> permission to see this section.</p>
      <style>{`.denied{display:flex;flex-direction:column;align-items:center;gap:1rem;padding:4rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}.di{font-size:3rem}.denied h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}.denied p{color:#888;font-size:0.875rem;max-width:320px;line-height:1.6}.denied strong{color:#1D9E75}`}</style>
    </div>
  );

  const STATUS_COLORS: Record<string,string> = { approved:"#1D9E75", pending:"#D97706", rejected:"#DC2626" };

  return (
    <div className="partners-page">
      <div className="page-header">
        <h2 className="page-heading">Partners</h2>
        <p className="page-sub">{partners.length} partner{partners.length!==1?"s":""}</p>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : partners.length === 0 ? (
        <div className="empty"><div className="ei">🤝</div><h3>No partners yet</h3></div>
      ) : (
        <div className="partner-list">
          {partners.map((p) => (
            <div key={p._id} className="partner-card">
              <div className="partner-avatar">{p.partnerName?.charAt(0)||"P"}</div>
              <div className="partner-info">
                <div className="partner-name">{p.partnerName||p.partnerEmail||"Partner"}</div>
                <div className="partner-email">{p.partnerEmail||"—"}</div>
                <div className="partner-phones">{p.partnerPhone||""}</div>
              </div>
              <div className="partner-right">
                <span className="partner-status" style={{color:STATUS_COLORS[p.status]||"#888"}}>{p.status}</span>
                <div className="partner-cars">{p.carIds?.length||0} cars assigned</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .partners-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;flex-direction:column;gap:0.3rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .partner-list{display:flex;flex-direction:column;gap:0.75rem}
        .partner-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;transition:border-color 0.2s}
        .partner-card:hover{border-color:#1D9E75}
        .partner-avatar{width:40px;height:40px;border-radius:50%;background:#1D9E75;color:#fff;font-family:var(--font-display);font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .partner-info{flex:1}
        .partner-name{font-weight:600;font-size:0.9rem;color:#1A1A1A}
        .partner-email{font-size:0.78rem;color:#888}
        .partner-phones{font-size:0.75rem;color:#AAA}
        .partner-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem}
        .partner-status{font-size:0.75rem;font-weight:600;text-transform:capitalize}
        .partner-cars{font-size:0.72rem;color:#888}
      `}</style>
    </div>
  );
}
