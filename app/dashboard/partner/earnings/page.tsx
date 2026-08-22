"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { rowsToExcelBlob, renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, downloadBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

export default function PartnerEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/partners/my-earnings")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `${(n || 0).toLocaleString()}`;
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "";
  const showToast = useToast();
  const [exportBusy, setExportBusy] = useState("");
  const [showExportPicker, setShowExportPicker] = useState(false);

  const buildEarningsHtml = () => {
    const now = new Date().toLocaleString("en-NG");
    const sales = data?.recentSales || [];
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;font-size:12px}
      h1{font-size:18px;margin:0 0 4px} .sub{color:#737373;font-size:11px;margin-bottom:16px}
      .stats{display:flex;gap:16px;margin-bottom:16px}
      .stat{background:#FAFAFA;border-radius:8px;padding:10px 16px}
      .stat .l{font-size:9px;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.05em}
      .stat .v{font-size:16px;font-weight:700;color:#3B8BD4}
      table{width:100%;border-collapse:collapse}
      th{background:#1A1A1A;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase}
      td{padding:7px 10px;border-bottom:1px solid #E5E5E5;font-size:11px}
      tr:nth-child(even) td{background:#FAFAFA}
      .footer{margin-top:16px;font-size:9px;color:#A3A3A3;text-align:center}
      </style></head><body>
      <h1>My Earnings</h1>
      <div class="sub">Generated ${now}</div>
      <div class="stats">
        <div class="stat"><div class="l">Total Revenue</div><div class="v">NGN ${fmt(data?.totalRevenue||0)}</div></div>
        <div class="stat"><div class="l">Total Sales</div><div class="v">${data?.totalSales||0}</div></div>
      </div>
      <table><thead><tr><th>Vehicle ID</th><th>Selling Price</th><th>Profit</th><th>Date</th></tr></thead>
      <tbody>${sales.map((s:any) => `<tr><td>${s.carId||""}</td><td>NGN ${fmt(s.sellingPrice)}</td><td>+NGN ${fmt(s.profit)}</td><td>${fmtDate(s.soldAt)}</td></tr>`).join("")}</tbody>
      </table>
      <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
      </body></html>`;
  };

  const handleExport = async (format: "pdf"|"jpg"|"excel") => {
    setShowExportPicker(false);
    setExportBusy(format);
    try {
      const filename = `carstrims-my-earnings-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob((data?.recentSales||[]).map((s:any) => ({
          "Vehicle ID": s.carId || "", "Selling Price": s.sellingPrice || 0,
          Profit: s.profit || 0, Date: fmtDate(s.soldAt),
        })), "Earnings");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const html = buildEarningsHtml();
        const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "My Earnings");
        await downloadBlob(blob, `${filename}.${format}`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Export failed", "error");
    } finally {
      setExportBusy("");
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /><style>{`.loading{display:flex;align-items:center;justify-content:center;min-height:50vh}.spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:#3B8BD4;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const maxRev = Math.max(...(data?.monthlySales?.map((m: any) => m.revenue) || [1]), 1);

  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap" as const,gap:"0.75rem"}}>
        <div>
          <h2 className="page-heading">Earnings</h2>
          <p className="page-sub">Revenue from your vehicles sold through dealers</p>
        </div>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowExportPicker(v=>!v)} disabled={exportBusy!==""}
            style={{background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.5rem 0.9rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>
            {exportBusy?"Exporting…":"Export"}
          </button>
          {showExportPicker && (
            <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"120px",maxWidth:"calc(100vw - 2rem)"}}>
              <button onClick={()=>handleExport("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
              <button onClick={()=>handleExport("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
              <button onClick={()=>handleExport("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as Excel</button>
            </div>
          )}
        </div>
      </div>

      <div className="summary-row">
        <div className="sum-card accent">
          <div className="sum-label">Total Revenue</div>
          <div className="sum-value">{fmt(data?.totalRevenue || 0)}</div>
        </div>
        <div className="sum-card">
          <div className="sum-label">Total Sales</div>
          <div className="sum-value">{data?.totalSales || 0}</div>
        </div>
      </div>

      {data?.monthlySales?.length > 0 && (
        <div className="chart-card">
          <div className="chart-title">MONTHLY REVENUE</div>
          <div className="bar-chart">
            {data.monthlySales.map((m: any, i: number) => (
              <div key={i} className="bar-col">
                <div className="bar-tip">{fmt(m.revenue)}</div>
                <div className="bar" style={{height:`${Math.max(8,(m.revenue/maxRev)*140)}px`}} />
                <div className="bar-label">{m.month}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.recentSales?.length > 0 && (
        <div className="sales-card">
          <div className="sales-title">RECENT SALES</div>
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead><tr><th>Vehicle ID</th><th>Selling Price</th><th>Profit</th><th>Date</th></tr></thead>
              <tbody>
                {data.recentSales.map((s: any) => (
                  <tr key={s._id}>
                    <td><span className="mono">{s.carId}</span></td>
                    <td className="price-cell">{fmt(s.sellingPrice)}</td>
                    <td className="profit-cell">+{fmt(s.profit)}</td>
                    <td className="date-cell">{fmtDate(s.soldAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!data?.recentSales?.length) && (
        <div className="empty"><div className="empty-icon"></div><h3>No sales yet</h3><p>Revenue from your cars will appear here when sold</p></div>
      )}

      <style>{`
        .page{display:flex;flex-direction:column;gap:1.5rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.875rem;color:var(--text-muted)}
        .summary-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .sum-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:0.5rem}
        .sum-card.accent{border-color:rgba(59,139,212,0.3);background:rgba(59,139,212,0.04)}
        .sum-label{font-size:0.72rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
        .sum-value{font-family:var(--font-display);font-size:2rem;color:#3B8BD4;line-height:1}
        .chart-card,.sales-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .chart-title,.sales-title{font-family:var(--font-display);font-size:0.75rem;letter-spacing:0.15em;color:var(--text-muted)}
        .bar-chart{display:flex;align-items:flex-end;gap:8px;height:160px;overflow-x:auto;padding-bottom:1.5rem}
        .bar-col{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:40px;position:relative}
        .bar-col:hover .bar-tip{display:block}
        .bar-tip{display:none;position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--surface-3);border:1px solid var(--border);padding:0.3rem 0.5rem;border-radius:4px;font-size:0.65rem;color:var(--text);white-space:nowrap;z-index:10}
        .bar{background:rgba(59,139,212,0.5);border-radius:3px 3px 0 0;min-width:28px;cursor:pointer}
        .bar-col:hover .bar{background:#3B8BD4}
        .bar-label{font-size:0.7rem;color:var(--text-dim)}
        .sales-table-wrap{overflow-x:auto}
        .sales-table{width:100%;border-collapse:collapse}
        .sales-table th{padding:0.65rem 0.875rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--border)}
        .sales-table td{padding:0.75rem 0.875rem;border-bottom:1px solid var(--border);font-size:0.825rem;color:var(--text)}
        .sales-table tr:last-child td{border-bottom:none}
        .mono{font-family:var(--font-mono);font-size:0.75rem}
        .price-cell{font-weight:600}
        .profit-cell{color:var(--success);font-weight:500}
        .date-cell{color:var(--text-muted);font-size:0.78rem}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:var(--text)}
        .empty p{color:var(--text-muted);font-size:0.875rem}
      `}</style>
    </div>
  );
}
