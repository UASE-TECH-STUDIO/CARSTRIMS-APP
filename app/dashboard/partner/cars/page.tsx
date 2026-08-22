"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { rowsToExcelBlob, renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

const STATUS_COLORS: Record<string,string> = {
  available:"#16A34A", sold:"#888", reserved:"#D97706",
  out_for_inspection:"#3B8BD4", in_repair:"#DC2626",
};

export default function PartnerCarsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [cars, setCars] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [exportBusy, setExportBusy] = useState<""|"pdf"|"jpg"|"excel">("");
  const [showExportPicker, setShowExportPicker] = useState(false);

  useEffect(() => {
    api.get("/api/v1/partners/my-dashboard")
      .then((r) => { setCars(r.data.cars || []); setMovements(r.data.recentMovements || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? cars : cars.filter((c) => c.status === filter);
  const fmt = (n: number) => `${(n||0).toLocaleString()}`;

  const handleExport = async (format: "pdf" | "jpg" | "excel") => {
    setShowExportPicker(false);
    setExportBusy(format);
    try {
      const filename = `carstrims-my-assigned-cars-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob(filtered.map((c:any) => ({
          "Vehicle ID": c.carId, Vehicle: `${c.brand} ${c.model} ${c.year}`,
          Dealer: c.dealerName || "", Status: c.status,
          "Selling Price (NGN)": c.sellingPrice || 0,
          "Total Expenses (NGN)": c.totalExpenses || 0,
          "Profit (NGN)": c.status==="sold" ? (c.actualProfit||c.estimatedProfit||0) : "",
        })), "My Assigned Vehicles");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const now = new Date().toLocaleString("en-NG");
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
          *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;font-size:12px}
          h1{font-size:18px;margin:0 0 4px} .sub{color:#737373;font-size:11px;margin-bottom:16px}
          table{width:100%;border-collapse:collapse}
          th{background:#1A1A1A;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase}
          td{padding:7px 10px;border-bottom:1px solid #E5E5E5;font-size:11px}
          tr:nth-child(even) td{background:#FAFAFA}
          .footer{margin-top:16px;font-size:9px;color:#A3A3A3;text-align:center}
          </style></head><body>
          <h1>My Assigned Vehicles</h1>
          <div class="sub">${filtered.length} vehicle${filtered.length!==1?"s":""} &bull; Generated ${now}</div>
          <table><thead><tr><th>Vehicle</th><th>Dealer</th><th>Status</th><th>Price</th><th>Expenses</th><th>Profit</th></tr></thead>
          <tbody>${filtered.map((c:any)=>`<tr><td>${c.brand} ${c.model} ${c.year}<br/><span style="color:#A3A3A3;font-size:9px">${c.carId}</span></td><td>${c.dealerName||""}</td><td>${c.status}</td><td>${fmt(c.sellingPrice)}</td><td>${fmt(c.totalExpenses)}</td><td>${c.status==="sold"?fmt(c.actualProfit||c.estimatedProfit||0):"-"}</td></tr>`).join("")}</tbody>
          </table>
          <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
          </body></html>`;
        const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "My Assigned Vehicles");
        await downloadBlob(blob, `${filename}.${format}`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Export failed", "error");
    } finally {
      setExportBusy("");
    }
  };

  return (
    <div className="cars-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">My Vehicles</h2>
          <p className="page-sub">{cars.length} vehicle{cars.length!==1?"s":""} assigned</p>
        </div>
        <div style={{position:"relative"}}>
          <button className="ftab" style={{background:"#1A1A1A",color:"#fff",borderColor:"#1A1A1A"}} onClick={()=>setShowExportPicker(v=>!v)} disabled={exportBusy!==""}>
            {exportBusy ? "Exporting…" : "Export"}
          </button>
          {showExportPicker && (
            <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"130px",maxWidth:"calc(100vw - 2rem)"}}>
              <button onClick={()=>handleExport("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
              <button onClick={()=>handleExport("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
              <button onClick={()=>handleExport("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as Excel</button>
            </div>
          )}
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
        <div className="empty"><div className="ei"></div><h3>No vehicles found</h3><p>Vehicles assigned by dealers will appear here</p></div>
      ) : (
        <div className="cars-grid">
          {filtered.map((c) => (
            <div key={c._id} className="car-card" onClick={() => router.push(`/cars/${c.carId}`)}>
              <div className="car-img-wrap">
                {c.images?.[0]
                  ? <img src={c.images[0]} alt="" />
                  : <div className="car-ph"></div>
                }
                <div className="car-badge" style={{background:STATUS_COLORS[c.status]||"#888"}}>{c.status.replace(/_/g," ")}</div>
                <div className="view-overlay">View Details </div>
              </div>
              <div className="car-dealer-strip">
                <div className="dl-logo">{c.dealerLogo?<img src={c.dealerLogo} alt=""/>:c.dealerName?.charAt(0)||"D"}</div>
                <span className="dl-name">{c.dealerName||"Dealer"}</span>
              </div>
              <div className="car-body">
                <div className="car-id">{c.carId}</div>
                <div className="car-title">{c.brand} {c.model} {c.year}</div>
                <div className="car-meta">{c.color}  {c.transmission}</div>
                <div className="car-price">{fmt(c.sellingPrice)}</div>
                {c.totalExpenses > 0 && <div className="car-meta" style={{color:"#DC2626"}}>Expenses: {fmt(c.totalExpenses)}</div>}
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

      {!!movements.length && (
        <div className="movements-section">
          <h3 className="section-title">Recent Movements ({movements.length})</h3>
          <div className="movements-list">
            {movements.map((m: any, i: number) => (
              <div key={m._id || i} className="mv-row">
                <div>
                  <div className="mv-title">{m.type || m.purpose || "Movement"} &middot; {m.carId}</div>
                  {m.takenByName && <div className="mv-sub">Taken by {m.takenByName}</div>}
                </div>
                <div className="mv-date">{m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short"}) : ""}</div>
              </div>
            ))}
          </div>
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
        .movements-section{border:1.5px solid #E5E5E5;border-radius:12px;overflow:hidden}
        .section-title{font-family:var(--font-display);font-size:0.85rem;letter-spacing:0.08em;color:#525252;padding:0.875rem 1rem;background:#F5F5F5;border-bottom:1px solid #E5E5E5;margin:0}
        .movements-list{max-height:280px;overflow-y:auto}
        .mv-row{display:flex;justify-content:space-between;gap:0.75rem;padding:0.75rem 1rem;border-bottom:1px solid #F5F5F5}
        .mv-row:last-child{border-bottom:none}
        .mv-title{font-size:0.82rem;font-weight:600;color:#1A1A1A}
        .mv-sub{font-size:0.7rem;color:#888;margin-top:0.1rem}
        .mv-date{font-size:0.7rem;color:#AAA;white-space:nowrap;flex-shrink:0}
      `}</style>
    </div>
  );
}
