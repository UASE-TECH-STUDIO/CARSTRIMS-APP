"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";

export default function PartnerOverviewPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, linksRes] = await Promise.all([
          api.get("/api/v1/partners/my-dashboard"),
          api.get("/api/v1/partners/my-links"),
        ]);
        setData(dashRes.data);
        setLinks(linksRes.data);
      } catch { } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#3B8BD4",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const pendingLinks = links.filter((l) => l.status === "pending");
  const approvedLinks = links.filter((l) => l.status === "approved");

  return (
    <div className="overview">
      <div className="overview-header">
        <div>
          <h2 className="company-name">Partner Dashboard</h2>
          <p className="company-meta">{user?.fullName} · Partner Account</p>
        </div>
      </div>

      {pendingLinks.length > 0 && (
        <div className="pending-banner">
          ⏳ You have <strong>{pendingLinks.length}</strong> pending partnership request{pendingLinks.length > 1 ? "s" : ""} awaiting dealer approval.
          <Link href="/dashboard/partner/dealers" className="banner-link">View status →</Link>
        </div>
      )}

      <div className="stats-grid">
        {[
          { label:"Linked Dealers", val:data?.totalLinkedDealers||0, icon:"🏢", href:"/dashboard/partner/dealers", color:"#3B8BD4" },
          { label:"Cars Assigned", val:data?.totalCarsAssigned||0, icon:"🚗", href:"/dashboard/partner/cars", color:"#F47B20" },
          { label:"Cars Sold", val:data?.totalCarsSold||0, icon:"🏷️", href:"/dashboard/partner/earnings", color:"#16A34A" },
          { label:"Available Cars", val:data?.totalCarsAvailable||0, icon:"✅", href:"/dashboard/partner/cars", color:"#1D9E75" },
          { label:"Total Revenue", val:fmt(data?.totalRevenue||0), icon:"💰", href:"/dashboard/partner/earnings", color:"#3B8BD4", wide:true },
        ].map((s) => (
          <Link key={s.label} href={s.href} className={`stat-card ${(s as any).wide?"wide":""}`}>
            <div className="sc-top">
              <span className="sc-icon">{s.icon}</span>
              <span className="sc-label">{s.label}</span>
            </div>
            <div className="sc-val" style={{color:s.color}}>{s.val}</div>
            <div className="sc-arrow">→</div>
          </Link>
        ))}
      </div>

      <div className="quick-actions">
        <div className="qa-title">QUICK ACCESS</div>
        <div className="qa-grid">
          {[
            { label:"Find Dealer", icon:"🔍", href:"/dashboard/partner/find-dealer" },
            { label:"My Cars", icon:"🚗", href:"/dashboard/partner/cars" },
            { label:"My Dealers", icon:"🏢", href:"/dashboard/partner/dealers" },
            { label:"Earnings", icon:"💰", href:"/dashboard/partner/earnings" },
            { label:"Movements", icon:"🔄", href:"/dashboard/partner/movements" },
            { label:"View Feed", icon:"🏠", href:"/feed" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="qa-card">
              <span className="qa-icon">{a.icon}</span>
              <span className="qa-label">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {approvedLinks.length > 0 && (
        <div className="linked-dealers">
          <div className="qa-title">LINKED DEALERS</div>
          <div className="dealer-pills">
            {approvedLinks.map((l) => (
              <Link key={l._id} href="/dashboard/partner/dealers" className="dealer-pill">
                <div className="dp-logo">{l.dealerLogo?<img src={l.dealerLogo} alt=""/>:l.dealerName?.charAt(0)}</div>
                <div>
                  <div className="dp-name">{l.dealerName}</div>
                  <div className="dp-loc">{l.dealerCity||""}</div>
                </div>
                <div className="dp-cars">{l.carsAssigned||0} cars</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .overview{display:flex;flex-direction:column;gap:1.5rem}
        .overview-header{display:flex;align-items:flex-start;justify-content:space-between}
        .company-name{font-family:var(--font-display);font-size:1.8rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1}
        .company-meta{font-size:0.825rem;color:#888;margin-top:0.3rem}
        .pending-banner{background:#EFF6FF;border:1px solid #3B8BD4;color:#1D4ED8;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        .banner-link{color:#3B8BD4;font-weight:600;text-decoration:none;margin-left:auto}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem}
        .stat-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:0.4rem;text-decoration:none;transition:all 0.2s;position:relative;overflow:hidden}
        .stat-card:hover{border-color:#3B8BD4;transform:translateY(-2px);box-shadow:0 4px 16px rgba(59,139,212,0.1)}
        .stat-card.wide{grid-column:span 2}
        .sc-top{display:flex;align-items:center;gap:0.5rem}
        .sc-icon{font-size:1rem}
        .sc-label{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .sc-val{font-family:var(--font-display);font-size:2rem;line-height:1}
        .sc-arrow{position:absolute;bottom:0.75rem;right:0.875rem;font-size:0.8rem;color:#DDD;transition:color 0.2s}
        .stat-card:hover .sc-arrow{color:#3B8BD4}
        .quick-actions,.linked-dealers{display:flex;flex-direction:column;gap:0.875rem}
        .qa-title{font-size:0.7rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#888}
        .qa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.75rem}
        .qa-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s}
        .qa-card:hover{border-color:#3B8BD4;background:#EFF6FF;transform:translateY(-1px)}
        .qa-icon{font-size:1.4rem}
        .qa-label{font-size:0.75rem;color:#666;text-align:center;font-weight:500}
        .qa-card:hover .qa-label{color:#3B8BD4}
        .dealer-pills{display:flex;flex-direction:column;gap:0.5rem}
        .dealer-pill{display:flex;align-items:center;gap:0.875rem;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.875rem 1.25rem;text-decoration:none;transition:all 0.2s}
        .dealer-pill:hover{border-color:#3B8BD4;background:#EFF6FF}
        .dp-logo{width:36px;height:36px;border-radius:8px;background:#3B8BD4;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .dp-logo img{width:100%;height:100%;object-fit:cover}
        .dp-name{font-size:0.875rem;font-weight:600;color:#1A1A1A}
        .dp-loc{font-size:0.72rem;color:#888}
        .dp-cars{font-size:0.75rem;color:#3B8BD4;margin-left:auto;font-weight:500}
        @media(max-width:640px){.stats-grid{grid-template-columns:1fr 1fr}.stat-card.wide{grid-column:span 2}.qa-grid{grid-template-columns:repeat(3,1fr)}}
      `}</style>
    </div>
  );
}
