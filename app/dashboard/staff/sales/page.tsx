"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function StaffSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => {
      const p = r.data.permissions || [];
      setPerms(p);
      if (!p.includes("view_sales") && !p.includes("record_sales")) {
        setDenied(true); setLoading(false); return;
      }
      api.get("/api/v1/dealers/me/sales?limit=30").then((res) => {
        setSales(res.data.sales || []); setTotal(res.data.total || 0);
      }).catch(()=>{}).finally(()=>setLoading(false));
    }).catch(()=>setLoading(false));
  }, []);

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "-";
  const fmt = (n: number) => `NGN ${(n||0).toLocaleString()}`;

  if (denied) return (
    <div style={{padding:"3rem", textAlign:"center", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px"}}>
      <div style={{fontSize:"1.2rem", fontWeight:700, color:"#DC2626"}}>Access Denied</div>
      <p style={{color:"#737373", marginTop:"0.5rem", fontSize:"0.875rem"}}>You do not have permission to view sales.</p>
    </div>
  );

  return (
    <div style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.6rem", color:"#1A1A1A", letterSpacing:"0.04em"}}>Sales</h2>
          <p style={{fontSize:"0.8rem", color:"#737373", marginTop:"0.2rem"}}>{total} total sales</p>
        </div>
        {perms.includes("record_sales") && (
          <a href="/dashboard/dealer/sales" style={{background:"#F47B20", color:"#fff", borderRadius:"8px", padding:"0.65rem 1.25rem", fontFamily:"var(--font-display)", fontSize:"0.875rem", letterSpacing:"0.08em", textDecoration:"none"}}>
            Record Sale
          </a>
        )}
      </div>

      {loading ? (
        <div style={{display:"flex", justifyContent:"center", padding:"3rem"}}>
          <div style={{width:"28px", height:"28px", border:"2.5px solid #E5E5E5", borderTopColor:"#F47B20", borderRadius:"50%", animation:"spin 0.8s linear infinite"}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : sales.length === 0 ? (
        <div style={{padding:"3rem", textAlign:"center", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px"}}>
          <div style={{fontSize:"0.875rem", color:"#737373"}}>No sales recorded yet</div>
        </div>
      ) : (
        <div style={{background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", overflow:"hidden"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#F5F5F5"}}>
                {["Car","Buyer","Selling Price","Profit","Date","Payment"].map((h) => (
                  <th key={h} style={{padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.68rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#737373", borderBottom:"1.5px solid #E5E5E5"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s: any) => (
                <tr key={s._id} style={{borderBottom:"1px solid #F5F5F5"}}>
                  <td style={{padding:"0.875rem 1rem"}}>
                    <div style={{fontSize:"0.85rem", fontWeight:500, color:"#1A1A1A"}}>{s.carBrand} {s.carModel} {s.carYear}</div>
                    <div style={{fontFamily:"var(--font-mono)", fontSize:"0.68rem", color:"#A3A3A3"}}>{s.carId}</div>
                  </td>
                  <td style={{padding:"0.875rem 1rem", fontSize:"0.825rem", color:"#525252"}}>{s.buyerName || "Walk-in"}</td>
                  <td style={{padding:"0.875rem 1rem", fontSize:"0.85rem", fontWeight:600, color:"#F47B20"}}>{fmt(s.sellingPrice)}</td>
                  <td style={{padding:"0.875rem 1rem", fontSize:"0.825rem", color:"#16A34A"}}>{fmt(s.profit)}</td>
                  <td style={{padding:"0.875rem 1rem", fontSize:"0.78rem", color:"#737373"}}>{fmtDate(s.soldAt)}</td>
                  <td style={{padding:"0.875rem 1rem"}}>
                    <span style={{fontSize:"0.72rem", background:"#FFF7ED", color:"#F47B20", border:"1px solid rgba(244,123,32,0.3)", padding:"0.2rem 0.6rem", borderRadius:"20px", textTransform:"capitalize"}}>
                      {s.paymentType?.replace(/_/g," ") || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}