"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { rowsToExcelBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
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

  const exportRows = () => cars.map((c: any) => ({
    "Car ID": c.carId,
    Brand: c.brand,
    Model: c.model,
    Year: c.year,
    Dealer: c.dealerName || "",
    Status: c.status,
    "Selling Price (NGN)": c.sellingPrice || 0,
    "Listed On": fmtDate(c.createdAt),
  }));

  const handleExport = async (format: "excel") => {
    setExportBusy(format);
    try {
      const blob = rowsToExcelBlob(exportRows(), "Cars");
      await downloadBlob(blob, `carstrims-all-cars-${Date.now()}.xlsx`);
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
        <button className="btn-red" onClick={() => handleExport("excel")} disabled={exportBusy !== ""}>
          {exportBusy ? "Exporting…" : "Export as Excel"}
        </button>
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
                <tr key={c._id}>
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
                    <Link href={`/cars/${c.carId}`} target="_blank" className="act-btn">View</Link>
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
