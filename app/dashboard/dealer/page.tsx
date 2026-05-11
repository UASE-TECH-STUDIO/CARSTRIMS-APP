"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

interface DealerStats {
  totalCars: number; availableCars: number; soldCars: number;
  totalStaff: number; totalPartners: number; pendingRequests: number;
  totalRevenue: number; totalProfit: number;
  pendingAppointments?: number;
}

export default function DealerOverviewPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealerRes, statsRes] = await Promise.all([
          api.get("/api/v1/dealers/me"),
          api.get("/api/v1/dealers/me/stats"),
        ]);
        setDealer(dealerRes.data);
        setStats(statsRes.data);
      } catch { } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      <style>{`.loading-state{display:flex;align-items:center;justify-content:center;min-height:60vh}.spinner{width:32px;height:32px;border:3px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

  const STAT_CARDS = [
    { label:"Total Cars", value: stats?.totalCars ?? 0, icon:"🚗", sub:"All listed vehicles", href:"/dashboard/dealer/cars", color:"#F47B20" },
    { label:"Available", value: stats?.availableCars ?? 0, icon:"✅", sub:"Ready for sale", href:"/dashboard/dealer/cars?status=available", color:"#16A34A" },
    { label:"Sold", value: stats?.soldCars ?? 0, icon:"🏷️", sub:"Completed sales", href:"/dashboard/dealer/sales", color:"#3B8BD4" },
    { label:"Total Staff", value: stats?.totalStaff ?? 0, icon:"👥", sub:"Team members", href:"/dashboard/dealer/staff", color:"#7B68EE" },
    { label:"Partners", value: stats?.totalPartners ?? 0, icon:"🤝", sub:"Active partners", href:"/dashboard/dealer/partners", color:"#D97706" },
    { label:"Requests", value: stats?.pendingRequests ?? 0, icon:"📩", sub:"Pending customer requests", href:"/dashboard/dealer/requests", color:"#DC2626" },
    { label:"Revenue", value: fmt(stats?.totalRevenue ?? 0), icon:"💰", sub:"All time sales value", href:"/dashboard/dealer/sales", color:"#F47B20", wide: true },
    { label:"Net Profit", value: fmt(stats?.totalProfit ?? 0), icon:"📈", sub:"After expenses", href:"/dashboard/dealer/reports", color:"#16A34A", wide: true },
  ];

  return (
    <div className="overview">
      {dealer && dealer?.status === "awaiting_approval" && (
        <div className="pending-banner">
          ⏳ Your dealer account is <strong>awaiting approval</strong>. Some features are limited until approved by CARSTRIMS admin.
        </div>
      )}

      <div className="overview-header">
        <div>
          <h2 className="company-name">{dealer?.companyName || "Your Dealership"}</h2>
          <p className="company-meta">
            {dealer?.city && dealer?.state ? `${dealer.city}, ${dealer.state}` : "Set location in settings"}
            {dealer?.dealerId && <span className="dealer-id"> · {dealer.dealerId}</span>}
          </p>
        </div>
        <div className={`status-badge ${dealer?.status}`}>
          {dealer?.status?.replace("_", " ").toUpperCase() || "PENDING"}
        </div>
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map((s) => (
          <Link key={s.label} href={s.href} className={`stat-card ${(s as any).wide ? "wide" : ""}`}>
            <div className="stat-top">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-label">{s.label}</span>
            </div>
            <div className="stat-value" style={{color: s.color}}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="stat-arrow">→</div>
          </Link>
        ))}
      </div>

      <div className="quick-actions">
        <h3 className="section-title">QUICK ACTIONS</h3>
        <div className="actions-grid">
          {[
            { label:"Add New Car", icon:"➕", href:"/dashboard/dealer/cars" },
            { label:"Record Sale", icon:"💳", href:"/dashboard/dealer/sales" },
            { label:"Log Expense", icon:"📋", href:"/dashboard/dealer/expenses" },
            { label:"Add Staff", icon:"👤", href:"/dashboard/dealer/staff" },
            { label:"Log Movement", icon:"🔄", href:"/dashboard/dealer/movements" },
            { label:"View Reports", icon:"📊", href:"/dashboard/dealer/reports" },
            { label:"View Requests", icon:"📩", href:"/dashboard/dealer/requests" },
            { label:"View Feed", icon:"🏠", href:"/feed" },
          ].map((action) => (
            <Link key={action.label} href={action.href} className="action-card">
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .overview{display:flex;flex-direction:column;gap:1.5rem}
        .pending-banner{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem}
        .overview-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .company-name{font-family:var(--font-display);font-size:1.8rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1}
        .company-meta{font-size:0.825rem;color:#888;margin-top:0.35rem}
        .dealer-id{font-family:var(--font-mono);font-size:0.75rem;color:#AAA}
        .status-badge{padding:0.35rem 0.875rem;border-radius:20px;font-size:0.65rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;border:1.5px solid;white-space:nowrap}
        .status-badge.approved{color:#16A34A;border-color:#16A34A;background:#F0FDF4}
        .status-badge.awaiting_approval{color:#F47B20;border-color:#F47B20;background:#FFF7ED}
        .status-badge.suspended{color:#DC2626;border-color:#DC2626;background:#FEF2F2}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem}
        .stat-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:0.4rem;text-decoration:none;transition:all 0.2s;cursor:pointer;position:relative;overflow:hidden}
        .stat-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--primary);opacity:0;transition:opacity 0.2s}
        .stat-card:hover{border-color:#F47B20;transform:translateY(-2px);box-shadow:0 4px 16px rgba(244,123,32,0.1)}
        .stat-card:hover::before{opacity:1}
        .stat-card.wide{grid-column:span 2}
        .stat-top{display:flex;align-items:center;gap:0.5rem}
        .stat-icon{font-size:1rem}
        .stat-label{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .stat-value{font-family:var(--font-display);font-size:2rem;letter-spacing:0.02em;color:#1A1A1A;line-height:1}
        .stat-sub{font-size:0.72rem;color:#AAA}
        .stat-arrow{position:absolute;bottom:0.75rem;right:0.875rem;font-size:0.8rem;color:#DDD;transition:color 0.2s}
        .stat-card:hover .stat-arrow{color:#F47B20}
        .section-title{font-family:var(--font-display);font-size:0.8rem;letter-spacing:0.15em;color:#AAA;margin-bottom:0.875rem}
        .actions-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:0.75rem}
        .action-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:1.1rem 0.875rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s}
        .action-card:hover{border-color:#F47B20;background:#FFF7ED;transform:translateY(-1px)}
        .action-icon{font-size:1.4rem}
        .action-label{font-size:0.75rem;font-weight:500;color:#666;text-align:center}
        .action-card:hover .action-label{color:#F47B20}
        @media(max-width:640px){.stats-grid{grid-template-columns:1fr 1fr}.stat-card.wide{grid-column:span 2}.actions-grid{grid-template-columns:repeat(3,1fr)}}
      `}</style>
    </div>
  );
}
