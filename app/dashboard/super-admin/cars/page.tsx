"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { rowsToExcelBlob, renderHtmlStringToPdfBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

const STATUSES = ["all", "available", "sold", "pending", "unavailable"];
const STATUS_COLORS: Record<string, string> = {
  available: "#4CAF82", sold: "#F47B20", pending: "#C9A84C", unavailable: "#888",
};

function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCarsPage() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [skip, setSkip] = useState(0);
  const [exportBusy, setExportBusy] = useState("");
  const [showExportPicker, setShowExportPicker] = useState(false);
  const showToast = useToast();
  const LIMIT = 20;

  const fetchCars = async () => {
    setLoading(true);
    try {
      const params: any = { skip, limit: LIMIT };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/api/v1/admin/cars", { params });
      setCars(res.data.cars || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCars(); }, [search, statusFilter, skip]);

  const rowsFor = (list: any[]) => list.map((c: any) => ({
    "Car ID": c.carId,
    Brand: c.brand,
    Model: c.model,
    Year: c.year,
    Dealer: c.dealerName || "",
    Status: c.status,
    "Selling Price (NGN)": c.sellingPrice || 0,
    "Listed On": fmtDate(c.createdAt),
  }));

  // Fetches EVERY car matching the current search/status filter (not
  // just whatever page happens to be on screen), so "export Toyota"
  // after searching genuinely covers every matching Toyota, not just
  // the visible 20.
  const fetchAllMatching = async (): Promise<any[]> => {
    const params: any = { skip: 0, limit: 2000 };
    if (statusFilter !== "all") params.status = statusFilter;
    if (search) params.search = search;
    const res = await api.get("/api/v1/admin/cars", { params });
    return res.data.cars || [];
  };

  const handleExport = async (format: "excel" | "pdf") => {
    setShowExportPicker(false);
    setExportBusy(format);
    try {
      const matching = await fetchAllMatching();
      if (!matching.length) { showToast("No cars match this search/filter", "error"); return; }
      const scopeLabel = search ? `search-${search}` : statusFilter !== "all" ? statusFilter : "all";
      const filename = `carstrims-cars-${scopeLabel.replace(/[^a-z0-9]/gi,"-")}-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob(rowsFor(matching), "Cars");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const now = new Date().toLocaleString("en-NG");
        const title = search ? `Cars matching "${search}"` : statusFilter !== "all" ? `${statusFilter} Cars` : "All Cars";
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
          *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;font-size:12px}
          h1{font-size:18px;margin:0 0 4px} .sub{color:#737373;font-size:11px;margin-bottom:16px}
          table{width:100%;border-collapse:collapse}
          th{background:#1A1A1A;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase}
          td{padding:7px 10px;border-bottom:1px solid #E5E5E5;font-size:11px}
          tr:nth-child(even) td{background:#FAFAFA}
          .footer{margin-top:16px;font-size:9px;color:#A3A3A3;text-align:center}
          </style></head><body>
          <h1>${title}</h1>
          <div class="sub">${matching.length} vehicle${matching.length!==1?"s":""} &bull; Generated ${now}</div>
          <table><thead><tr><th>Car ID</th><th>Vehicle</th><th>Dealer</th><th>Status</th><th>Price (NGN)</th><th>Listed</th></tr></thead>
          <tbody>${matching.map((c:any)=>`<tr><td>${c.carId}</td><td>${c.brand} ${c.model} ${c.year}</td><td>${c.dealerName||""}</td><td>${c.status}</td><td>${Number(c.sellingPrice||0).toLocaleString()}</td><td>${fmtDate(c.createdAt)}</td></tr>`).join("")}</tbody>
          </table>
          <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
          </body></html>`;
        const blob = await renderHtmlStringToPdfBlob(html, title);
        await downloadBlob(blob, `${filename}.pdf`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) { showToast(e?.message || "Export failed", "error"); }
    finally { setExportBusy(""); }
  };

  return (
    <div className="dealers-page">
      <div className="page-header">
        <div>
          <h1 className="page-heading">Cars Listed</h1>
          <p className="page-sub">{total} car{total !== 1 ? "s" : ""} across every dealer on the platform</p>
        </div>
        <div style={{position:"relative"}}>
          <button className="btn-red" onClick={() => setShowExportPicker(v=>!v)} disabled={exportBusy !== ""}>
            {exportBusy ? "Exporting…" : search ? `Export "${search}" results` : "Export"}
          </button>
          {showExportPicker && (
            <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid var(--border)",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.18)",overflow:"hidden",minWidth:"140px"}}>
              <button onClick={()=>handleExport("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>as PDF</button>
              <button onClick={()=>handleExport("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid var(--border)",cursor:"pointer",fontSize:"0.8rem",fontWeight:600,color:"var(--text)"}}>as Excel</button>
            </div>
          )}
        </div>
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search brand, model, car ID..." value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
        <div className="status-tabs">
          {STATUSES.map((s) => (
            <button key={s} className={`status-tab ${statusFilter === s ? "active" : ""}`} onClick={() => { setStatusFilter(s); setSkip(0); }}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : cars.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🚗</div><h3>No cars found</h3></div>
      ) : (
        <div className="dealers-table-wrap">
          <table className="dealers-table">
            <thead>
              <tr>
                <th>Car</th><th>Dealer</th><th>Price</th><th>Status</th><th>Listed</th><th></th>
              </tr>
            </thead>
            <tbody>
              {cars.map((c) => (
                <tr key={c._id} className="clickable-row" onClick={() => window.open(`/cars/${c.carId}`, "_blank")}>
                  <td>
                    <div className="co-name">{c.brand} {c.model} {c.year}</div>
                    <div className="co-id">{c.carId}</div>
                  </td>
                  <td>{c.dealerName || "—"}</td>
                  <td className="num-cell">NGN {Number(c.sellingPrice || 0).toLocaleString()}</td>
                  <td>
                    <span className="status-pill" style={{ color: STATUS_COLORS[c.status] || "#888", borderColor: (STATUS_COLORS[c.status] || "#888") + "44", background: (STATUS_COLORS[c.status] || "#888") + "11" }}>
                      {c.status}
                    </span>
                  </td>
                  <td className="date-cell">{fmtDate(c.createdAt)}</td>
                  <td>
                    <Link href={`/cars/${c.carId}`} target="_blank" className="act-btn" onClick={(e)=>e.stopPropagation()}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="pg-btn" onClick={() => setSkip(Math.max(0, skip - LIMIT))} disabled={skip === 0}>← Prev</button>
        <span className="pg-info">{Math.floor(skip / LIMIT) + 1} / {Math.max(1, Math.ceil(total / LIMIT))}</span>
        <button className="pg-btn" onClick={() => setSkip(skip + LIMIT)} disabled={skip + LIMIT >= total}>Next →</button>
      </div>

      <style>{`
        .dealers-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem}
        .btn-red{background:var(--error);color:#fff;border:none;border-radius:6px;padding:0.7rem 1.25rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;text-decoration:none;white-space:nowrap;transition:opacity 0.2s}
        .btn-red:hover{opacity:0.85}
        .filters{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
        .search-input{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:0.65rem 1rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:280px}
        .search-input:focus{border-color:var(--error)}
        .status-tabs{display:flex;gap:0.35rem;flex-wrap:wrap}
        .status-tab{background:transparent;border:1px solid var(--border);border-radius:20px;padding:0.35rem 0.875rem;color:var(--text-muted);font-size:0.75rem;cursor:pointer;transition:all 0.2s;text-transform:capitalize;font-family:var(--font-body)}
        .status-tab:hover{border-color:rgba(224,82,82,0.4);color:var(--text)}
        .status-tab.active{background:var(--error);color:#fff;border-color:var(--error)}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--error);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:2.5rem}
        .empty-state h3{font-family:var(--font-display);font-size:1.2rem;color:var(--text)}
        .dealers-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:10px}
        .dealers-table{width:100%;border-collapse:collapse;min-width:800px}
        .dealers-table th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);background:var(--surface-2);border-bottom:1px solid var(--border)}
        .dealers-table td{padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.825rem;color:var(--text);vertical-align:top}
        .dealers-table tr:last-child td{border-bottom:none}
        .dealers-table tr:hover td{background:var(--surface-2)}
        .clickable-row{cursor:pointer}
        .co-name{font-weight:600;font-size:0.875rem}
        .co-id{font-family:var(--font-mono);font-size:0.68rem;color:var(--text-dim)}
        .num-cell{text-align:left;font-family:var(--font-mono)}
        .status-pill{padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:500;text-transform:capitalize;border:1px solid;white-space:nowrap}
        .date-cell{color:var(--text-muted);font-size:0.75rem;white-space:nowrap}
        .act-btn{background:transparent;border:1px solid var(--border);border-radius:4px;padding:0.3rem 0.6rem;font-size:0.75rem;cursor:pointer;text-decoration:none;color:var(--text-muted);white-space:nowrap}
        .act-btn:hover{color:var(--text);border-color:var(--border-light)}
        .pagination{display:flex;align-items:center;gap:1rem;justify-content:center}
        .pg-btn{background:var(--surface);border:1px solid var(--border);color:var(--text-muted);padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.825rem;font-family:var(--font-body);transition:all 0.2s}
        .pg-btn:hover:not(:disabled){border-color:var(--error);color:var(--text)}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}
        .pg-info{font-size:0.825rem;color:var(--text-muted);font-family:var(--font-mono)}
      `}</style>
    </div>
  );
}
