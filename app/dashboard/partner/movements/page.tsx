"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { rowsToExcelBlob, renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, downloadBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";
import { parseServerDate } from "@/lib/timeUtils";

export default function PartnerMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportPicker, setShowExportPicker] = useState(false);
  const [exportBusy, setExportBusy] = useState("");
  const showToast = useToast();

  useEffect(() => {
    api.get("/api/v1/partners/my-dashboard")
      .then((r) => setMovements(r.data.recentMovements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso: string) => iso ? (parseServerDate(iso)?.toLocaleString("en-NG")||"") : "";
  const STATUS_COLORS: Record<string,string> = { out:"#C9A84C", returned:"#4CAF82", overdue:"#E05252" };

  const buildMovementsHtml = () => {
    const now = new Date().toLocaleString("en-NG");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;font-size:12px}
      h1{font-size:18px;margin:0 0 4px} .sub{color:#737373;font-size:11px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{background:#1A1A1A;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase}
      td{padding:7px 10px;border-bottom:1px solid #E5E5E5;font-size:11px}
      tr:nth-child(even) td{background:#FAFAFA}
      .footer{margin-top:16px;font-size:9px;color:#A3A3A3;text-align:center}
      </style></head><body>
      <h1>Vehicle Movements</h1>
      <div class="sub">${movements.length} record${movements.length!==1?"s":""} &bull; Generated ${now}</div>
      <table><thead><tr><th>Vehicle</th><th>Taken By</th><th>Purpose</th><th>Status</th><th>Out</th><th>Returned</th></tr></thead>
      <tbody>${movements.map((m:any) => `<tr><td>${m.carBrand||""} ${m.carModel||""} ${m.carYear||""}</td><td>${m.takenByName||""}</td><td>${(m.purpose||"").replace(/_/g," ")}</td><td>${m.status||""}</td><td>${fmt(m.timeOut)}</td><td>${m.timeReturned?fmt(m.timeReturned):"—"}</td></tr>`).join("")}</tbody>
      </table>
      <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
      </body></html>`;
  };

  const handleExport = async (format: "pdf"|"jpg"|"excel") => {
    setShowExportPicker(false);
    setExportBusy(format);
    try {
      const filename = `carstrims-partner-movements-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob(movements.map((m:any) => ({
          Vehicle: `${m.carBrand||""} ${m.carModel||""} ${m.carYear||""}`.trim(),
          "Taken By": m.takenByName || "", Purpose: (m.purpose||"").replace(/_/g," "),
          Status: m.status || "", Out: fmt(m.timeOut), Returned: m.timeReturned ? fmt(m.timeReturned) : "",
        })), "Movements");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const html = buildMovementsHtml();
        const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "Vehicle Movements");
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
    <div className="page">
      <div className="page-header" style={{flexDirection:"row" as const, justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap" as const, gap:"0.75rem"}}>
        <div>
          <h2 className="page-heading">Vehicle Movements</h2>
          <p className="page-sub">Track when your cars leave or return to the dealership</p>
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

      {loading ? <div className="loading"><div className="spinner" /></div>
      : movements.length === 0 ? (
        <div className="empty"><div className="empty-icon"></div><h3>No movements logged</h3><p>Movement logs for your cars will appear here</p></div>
      ) : (
        <div className="mov-list">
          {movements.map((m) => (
            <div key={m._id} className="mov-card">
              <div className="mov-left">
                <div className="mov-car">{m.carBrand} {m.carModel} {m.carYear}</div>
                <div className="mov-id">{m.movementId}  {m.carId}</div>
              </div>
              <div className="mov-center">
                <div className="mov-person">{m.takenByName}</div>
                <div className="mov-phone">{m.takenByPhone}</div>
                <div className="mov-purpose">{m.purpose?.replace(/_/g," ")}</div>
              </div>
              <div className="mov-times">
                <div className="time-row"><span className="tl">Out</span><span className="tv">{fmt(m.timeOut)}</span></div>
                {m.expectedReturnTime && <div className="time-row"><span className="tl">Expected</span><span className="tv">{fmt(m.expectedReturnTime)}</span></div>}
                {m.timeReturned && <div className="time-row"><span className="tl">Returned</span><span className="tv">{fmt(m.timeReturned)}</span></div>}
              </div>
              <div className="mov-status" style={{color: STATUS_COLORS[m.status] || "#888"}}> {m.status}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;flex-direction:column;gap:0.3rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.875rem;color:var(--text-muted)}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:#3B8BD4;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:var(--text)}
        .empty p{color:var(--text-muted);font-size:0.875rem}
        .mov-list{display:flex;flex-direction:column;gap:0.75rem}
        .mov-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.25rem 1.5rem;display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap}
        .mov-left{display:flex;flex-direction:column;gap:0.2rem;min-width:150px}
        .mov-car{font-weight:600;font-size:0.9rem;color:var(--text)}
        .mov-id{font-family:var(--font-mono);font-size:0.68rem;color:var(--text-dim)}
        .mov-center{display:flex;flex-direction:column;gap:0.2rem;flex:1;min-width:120px}
        .mov-person{font-weight:500;font-size:0.875rem;color:var(--text)}
        .mov-phone{font-size:0.78rem;color:var(--text-muted)}
        .mov-purpose{font-size:0.75rem;color:#3B8BD4;text-transform:capitalize}
        .mov-times{display:flex;flex-direction:column;gap:0.3rem;min-width:180px}
        .time-row{display:flex;gap:0.5rem}
        .tl{font-size:0.68rem;color:var(--text-dim);text-transform:uppercase;width:60px}
        .tv{font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono)}
        .mov-status{font-size:0.75rem;letter-spacing:0.05em;text-transform:capitalize;flex-shrink:0}
      `}</style>
    </div>
  );
}
