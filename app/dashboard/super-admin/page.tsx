"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function SuperAdminOverview() {
  const [stats,  setStats]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]  = useState("");

  useEffect(() => {
    api.get("/api/v1/admin/stats")
      .then(r => setStats(r.data))
      .catch(e => setError(e?.response?.data?.detail || "Could not load stats"))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;

  const STAT_CARDS = stats ? [
    { label:"Total Dealers",     value:stats.dealers?.total||0,     icon:"🏢", color:"#F47B20", href:"/dashboard/super-admin/dealers" },
    { label:"Active Dealers",    value:stats.dealers?.active||0,    icon:"✅", color:"#16A34A", href:"/dashboard/super-admin/dealers?status=approved" },
    { label:"Pending Approval",  value:stats.dealers?.pending||0,   icon:"⏳", color:"#D97706", href:"/dashboard/super-admin/approvals" },
    { label:"Suspended",         value:stats.dealers?.suspended||0, icon:"⛔", color:"#DC2626", href:"/dashboard/super-admin/dealers?status=suspended" },
    { label:"Total Users",       value:stats.users?.total||0,       icon:"👥", color:"#3B8BD4", href:"/dashboard/super-admin/users" },
    { label:"Total Cars",        value:stats.inventory?.totalCars||0,icon:"🚗", color:"#7B68EE", href:"/dashboard/super-admin/dealers" },
    { label:"Cars Sold",         value:stats.inventory?.totalSold||0,icon:"🏷️",color:"#1D9E75", href:"/dashboard/super-admin/dealers" },
    { label:"New This Month",    value:stats.dealers?.thisMonth||0, icon:"✨", color:"#F47B20", href:"/dashboard/super-admin/dealers" },
  ] : [];

  const QUICK = [
    { label:"Pending Approvals", icon:"⏳", href:"/dashboard/super-admin/approvals", color:"#D97706" },
    { label:"All Dealers",       icon:"🏢", href:"/dashboard/super-admin/dealers",   color:"#F47B20" },
    { label:"All Users",         icon:"👥", href:"/dashboard/super-admin/users",     color:"#3B8BD4" },
    { label:"Analytics",         icon:"📊", href:"/dashboard/super-admin/analytics", color:"#16A34A" },
    { label:"Broadcast",         icon:"📢", href:"/dashboard/super-admin/broadcast", color:"#7B68EE" },
    { label:"Activity Log",      icon:"📋", href:"/dashboard/super-admin/activity",  color:"#737373" },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.75rem",fontFamily:"var(--font-body)"}}>

      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>
          Platform Overview
        </h2>
        <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>
          CARSTRIMS — Admin Control Panel
        </p>
      </div>

      {error && (
        <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between"}}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"1rem"}}>
          {[...Array(8)].map((_,i) => (
            <div key={i} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem",height:"110px",animation:"shimmer 1.5s infinite",backgroundImage:"linear-gradient(90deg,#F0F0F0 25%,#E5E5E5 50%,#F0F0F0 75%)",backgroundSize:"400% 100%"}}/>
          ))}
          <style>{`@keyframes shimmer{0%{background-position:400% 0}100%{background-position:-400% 0}}`}</style>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"1rem"}}>
          {STAT_CARDS.map(s => (
            <Link key={s.label} href={s.href}
              style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.35rem",textDecoration:"none",transition:"all 0.2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = s.color;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${s.color}22`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E5E5";
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem"}}>
                <span style={{fontSize:"1.1rem"}}>{s.icon}</span>
                <span style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#A3A3A3"}}>{s.label}</span>
              </div>
              <div style={{fontFamily:"var(--font-display)",fontSize:"2.2rem",letterSpacing:"0.02em",color:s.color,lineHeight:1}}>
                {s.value}
              </div>
              <span style={{position:"absolute",bottom:"0.875rem",right:"1rem",fontSize:"0.8rem",color:"#DDD"}}>→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Revenue */}
      {stats && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.5rem"}}>ALL-TIME REVENUE</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"2rem",color:"#16A34A"}}>{fmt(stats.revenue?.allTime||0)}</div>
            <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.25rem"}}>{stats.revenue?.totalTransactions||0} transactions total</div>
          </div>
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.5rem"}}>THIS MONTH REVENUE</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"2rem",color:"#F47B20"}}>{fmt(stats.revenue?.thisMonth||0)}</div>
            <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.25rem"}}>{stats.revenue?.monthTransactions||0} transactions this month</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p style={{fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.18em",color:"#A3A3A3",marginBottom:"0.875rem",textTransform:"uppercase"}}>QUICK ACTIONS</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0.875rem"}}>
          {QUICK.map(a => (
            <Link key={a.label} href={a.href}
              style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1rem 0.875rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",textDecoration:"none",transition:"all 0.2s"}}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = a.color;
                (e.currentTarget as HTMLElement).style.background = `${a.color}11`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E5E5";
                (e.currentTarget as HTMLElement).style.background = "#fff";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}>
              <span style={{fontSize:"1.5rem"}}>{a.icon}</span>
              <span style={{fontSize:"0.72rem",fontWeight:500,color:"#666",textAlign:"center",lineHeight:1.3}}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`@media(max-width:640px){div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
