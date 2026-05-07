"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function StaffReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => setPerms(r.data.permissions||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (perms.includes("view_reports")) {
      api.get("/api/v1/dealers/me/reports").then((r) => setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));
    } else { setLoading(false); }
  }, [perms]);

  const canView = perms.includes("view_reports");

  if (!canView) return <div style={{padding:"3rem",textAlign:"center",color:"#888"}}><div style={{fontSize:"3rem"}}>🔒</div><h3 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Access Restricted</h3><p>You need <strong style={{color:"#1D9E75"}}>view_reports</strong> permission.</p></div>;

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;

  return (
    <div className="reports">
      <h2 className="page-heading">Reports</h2>
      {loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"200px"}}><div className="spinner" /></div>
      : !data ? <div style={{color:"#888",padding:"2rem"}}>No report data available yet.</div>
      : (
        <div className="summary-grid">
          {[
            { label:"Total Revenue", val:fmt(data.summary?.totalRevenue||0) },
            { label:"Gross Profit", val:fmt(data.summary?.totalProfit||0) },
            { label:"Total Expenses", val:fmt(data.summary?.totalExpenses||0) },
            { label:"Total Sales", val:data.summary?.totalSales||0 },
            { label:"Cars Listed", val:data.summary?.totalCars||0 },
            { label:"Cars Sold", val:data.summary?.soldCars||0 },
          ].map((s) => (
            <div key={s.label} className="sum-card">
              <div className="sc-val">{s.val}</div>
              <div className="sc-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <style>{`.reports{display:flex;flex-direction:column;gap:1.5rem}.page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A}.spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem}.sum-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:0.3rem}.sc-val{font-family:var(--font-display);font-size:1.6rem;color:#1D9E75;line-height:1}.sc-label{font-size:0.68rem;color:#888;text-transform:uppercase;letter-spacing:0.06em}`}</style>
    </div>
  );
}
