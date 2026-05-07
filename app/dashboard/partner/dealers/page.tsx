"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function PartnerDealersPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/api/v1/partners/my-links")
      .then((r) => setLinks(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const STATUS_STYLES: Record<string,{color:string;bg:string;border:string}> = {
    approved:{ color:"#16A34A", bg:"#F0FDF4", border:"rgba(22,163,74,0.3)" },
    pending:{ color:"#D97706", bg:"#FFFBEB", border:"rgba(217,119,6,0.3)" },
    rejected:{ color:"#DC2626", bg:"#FEF2F2", border:"rgba(220,38,38,0.3)" },
  };

  return (
    <div className="dealers-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">My Dealers</h2>
          <p className="page-sub">{links.length} dealer connection{links.length!==1?"s":""}</p>
        </div>
        <Link href="/dashboard/partner/find-dealer" className="btn-blue">+ Find Dealer</Link>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : links.length === 0 ? (
        <div className="empty">
          <div className="ei">🏢</div>
          <h3>No dealer connections yet</h3>
          <p>Search for dealers and send a partnership request to get started</p>
          <Link href="/dashboard/partner/find-dealer" className="btn-blue">Find a Dealer</Link>
        </div>
      ) : (
        <div className="dealer-list">
          {links.map((link) => {
            const st = STATUS_STYLES[link.status] || STATUS_STYLES.pending;
            return (
              <div key={link._id} className="dealer-card">
                <div className="dealer-logo">
                  {link.dealerLogo
                    ? <img src={link.dealerLogo} alt="" />
                    : link.dealerName?.charAt(0)
                  }
                </div>
                <div className="dealer-info">
                  <div className="dealer-name">{link.dealerName || "Dealer"}</div>
                  <div className="dealer-id">{link.dealerDealerId}</div>
                  <div className="dealer-meta">
                    {link.dealerCity && <span>📍 {link.dealerCity}, {link.dealerState}</span>}
                    <span>🚗 {link.carsAssigned || 0} cars assigned</span>
                  </div>
                  <div className="dealer-contacts">
                    {link.dealerPhone && <a href={`tel:${link.dealerPhone}`} className="cta-pill">📞 Call</a>}
                    {link.dealerWhatsapp && <a href={`https://wa.me/${link.dealerWhatsapp}`} target="_blank" rel="noreferrer" className="cta-pill">💬 WhatsApp</a>}
                    {link.dealerEmail && <a href={`mailto:${link.dealerEmail}`} className="cta-pill">✉️ Email</a>}
                  </div>
                </div>
                <div className="dealer-right">
                  <div className="status-pill" style={{color:st.color,background:st.bg,border:`1px solid ${st.border}`}}>
                    {link.status === "approved" ? "✅ Active Partner"
                      : link.status === "pending" ? "⏳ Pending Approval"
                      : "✕ Declined"}
                  </div>
                  {link.requestedAt && (
                    <div className="req-date">
                      Requested {new Date(link.requestedAt).toLocaleDateString("en-NG")}
                    </div>
                  )}
                  {link.approvedAt && (
                    <div className="req-date" style={{color:"#16A34A"}}>
                      Approved {new Date(link.approvedAt).toLocaleDateString("en-NG")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .dealers-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-blue{background:#3B8BD4;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;text-decoration:none;white-space:nowrap;transition:opacity 0.2s}
        .btn-blue:hover{opacity:0.85}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#3B8BD4;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:1rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem;max-width:320px}
        .dealer-list{display:flex;flex-direction:column;gap:0.875rem}
        .dealer-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:flex-start;gap:1.25rem;flex-wrap:wrap;transition:border-color 0.2s}
        .dealer-card:hover{border-color:#3B8BD4}
        .dealer-logo{width:52px;height:52px;border-radius:10px;background:#3B8BD4;color:#fff;font-family:var(--font-display);font-size:1.3rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
        .dealer-logo img{width:100%;height:100%;object-fit:cover}
        .dealer-info{flex:1;display:flex;flex-direction:column;gap:0.3rem;min-width:200px}
        .dealer-name{font-weight:700;font-size:0.95rem;color:#1A1A1A}
        .dealer-id{font-family:var(--font-mono);font-size:0.68rem;color:#AAA}
        .dealer-meta{display:flex;gap:1rem;flex-wrap:wrap}
        .dealer-meta span{font-size:0.72rem;color:#888}
        .dealer-contacts{display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.25rem}
        .cta-pill{background:#F5F5F5;border:1px solid #E5E5E5;border-radius:20px;padding:0.25rem 0.65rem;font-size:0.72rem;color:#555;text-decoration:none;transition:all 0.2s}
        .cta-pill:hover{border-color:#3B8BD4;color:#3B8BD4;background:#EFF6FF}
        .dealer-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem;flex-shrink:0}
        .status-pill{padding:0.3rem 0.875rem;border-radius:20px;font-size:0.75rem;font-weight:500}
        .req-date{font-size:0.7rem;color:#AAA;font-family:var(--font-mono)}
        @media(max-width:640px){.dealer-right{align-items:flex-start}}
      `}</style>
    </div>
  );
}
