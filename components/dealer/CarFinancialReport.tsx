"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { renderElementToPdfBlob, downloadBlob, shareBlob, rowsToExcelBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

interface Props {
  carId: string;
  onClose: () => void;
}

export default function CarFinancialReport({ carId, onClose }: Props) {
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/api/v1/reports/dealer/car/${carId}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carId]);

  const fmt = (n: number) => `${(n || 0).toLocaleString()}`;
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }) : "";

  const [busy, setBusy] = useState<"" | "pdf" | "excel" | "share">("");
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const showToast = useToast();

  const reportFilename = () => `carstrims-financial-report-${carId}-${Date.now()}`;

  const handleDownload = async (format: "pdf" | "excel") => {
    setShowFormatPicker(false);
    setBusy(format);
    try {
      if (format === "excel") {
        const rows = (data?.expenses || []).map((e: any) => ({
          Category: e.category,
          Description: e.description || "",
          "Amount (NGN)": e.amount || 0,
          Date: fmtDate(e.createdAt),
        }));
        rows.push({ Category: "TOTAL EXPENSES", Description: "", "Amount (NGN)": data?.financials?.totalExpenses || 0, Date: "" });
        const blob = rowsToExcelBlob(rows, "Expenses");
        await downloadBlob(blob, `${reportFilename()}.xlsx`);
      } else {
        if (!printRef.current) throw new Error("Report isn't ready yet");
        const blob = await renderElementToPdfBlob(printRef.current, `Vehicle Financial Report - ${carId}`);
        await downloadBlob(blob, `${reportFilename()}.pdf`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Download failed", "error");
    } finally {
      setBusy("");
    }
  };

  const handleShare = async () => {
    setBusy("share");
    try {
      if (!printRef.current) throw new Error("Report isn't ready yet");
      const blob = await renderElementToPdfBlob(printRef.current, `Vehicle Financial Report - ${carId}`);
      await shareBlob(blob, `${reportFilename()}.pdf`, `Vehicle Financial Report - ${carId}`);
    } catch (e: any) {
      showToast(e?.message || "Share failed", "error");
    } finally {
      setBusy("");
    }
  };

  if (loading) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100}}>
      <div style={{background:"#fff",borderRadius:"12px",padding:"2rem",textAlign:"center",display:"flex",flexDirection:"column",gap:"1rem",alignItems:"center"}}>
        <div style={{width:"28px",height:"28px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{color:"#737373",margin:0,fontSize:"0.875rem"}}>Generating report...</p>
      </div>
    </div>
  );

  if (!data) return null;
  const { car, dealer, financials, expenses, sale, movements } = data;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:"1rem",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"720px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        {/* Controls */}
        <div className="no-print" style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"1rem 1.25rem",borderBottom:"1px solid #E5E5E5",flexWrap:"wrap",background:"#FAFAFA"}}>
          <span style={{fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",color:"#1A1A1A",flex:1}}>CAR FINANCIAL REPORT</span>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowFormatPicker(v=>!v)} disabled={busy!==""}
              style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 0.875rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap",opacity:busy?0.7:1}}>
              {busy==="pdf"||busy==="excel" ? "Downloading…" : "Download"}
            </button>
            {showFormatPicker && (
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:20,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"130px"}}>
                <button onClick={()=>handleDownload("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.78rem",fontWeight:600}}>as PDF</button>
                <button onClick={()=>handleDownload("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.78rem",fontWeight:600}}>as Excel</button>
              </div>
            )}
          </div>
          <button onClick={handleShare} disabled={busy!==""} style={{background:"#F0FDF4",color:"#16A34A",border:"1.5px solid #86EFAC",borderRadius:"8px",padding:"0.5rem 0.875rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap",opacity:busy?0.7:1}}>{busy==="share"?"Sharing…":"Share"}</button>
          <button onClick={onClose} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 0.75rem",fontSize:"0.78rem",cursor:"pointer"}}>×</button>
        </div>

        <div ref={printRef} style={{padding:"2rem",background:"#fff"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"3px solid #F47B20"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.875rem"}}>
              {dealer?.logo && <img src={dealer.logo} alt="" style={{width:"48px",height:"48px",objectFit:"cover",borderRadius:"8px"}}/>}
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:"1rem",fontWeight:700,color:"#1A1A1A"}}>{dealer?.companyName||"CARSTRIMS Dealer"}</div>
                <div style={{fontSize:"0.72rem",color:"#737373"}}>Vehicle Financial Statement</div>
              </div>
            </div>
            <div style={{textAlign:"right" as const}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.1rem",color:"#F47B20",fontWeight:700}}>PER-CAR REPORT</div>
              <div style={{fontSize:"0.72rem",color:"#737373"}}>{data.generatedAt ? new Date(data.generatedAt).toLocaleString("en-NG") : ""}</div>
            </div>
          </div>

          {/* Car info */}
          <div style={{background:"#F5F5F5",borderRadius:"10px",padding:"1rem",marginBottom:"1.5rem"}}>
            <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.75rem"}}>Vehicle</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:"0.75rem"}}>
              {[["Brand",car?.brand],["Model",car?.model],["Year",car?.year],["Color",car?.color||""],["Condition",car?.condition||""],["VIN",car?.vin||""],["Vehicle ID",car?.carId||carId],["Status",car?.status||""]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:"0.6rem",color:"#A3A3A3",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{l}</div><div style={{fontSize:"0.82rem",fontWeight:600,color:"#1A1A1A",textTransform:"capitalize" as const}}>{String(v)||""}</div></div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div style={{marginBottom:"1.5rem"}}>
            <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.875rem"}}>Financial Summary</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0.875rem"}}>
              {[
                {label:"Purchase Price",value:fmt(financials?.purchasePrice),color:"#737373"},
                {label:"Total Expenses",value:fmt(financials?.totalExpenses),color:"#DC2626"},
                {label:"Selling Price",  value:fmt(financials?.sellingPrice),color:"#F47B20"},
                {label:"Gross Profit",   value:fmt(financials?.grossProfit), color:financials?.grossProfit>=0?"#16A34A":"#DC2626"},
                {label:"Net Profit",     value:fmt(financials?.netProfit),   color:financials?.netProfit>=0?"#16A34A":"#DC2626"},
                {label:"Profit Margin",  value:`${financials?.margin||0}%`,  color:"#3B8BD4"},
              ].map(s=>(
                <div key={s.label} style={{background:s.label==="Net Profit"?"#F0FDF4":"#F5F5F5",border:s.label==="Net Profit"?"1.5px solid #86EFAC":"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",textAlign:"center" as const}}>
                  <div style={{fontSize:"0.6rem",color:"#A3A3A3",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.3rem"}}>{s.label}</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:"1.1rem",fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sale details */}
          {sale && (
            <div style={{marginBottom:"1.5rem"}}>
              <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.875rem"}}>Sale Transaction</div>
              <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",overflow:"hidden"}}>
                {[["Transaction ID",sale.transactionId],["Buyer",sale.buyerName||"Cash Buyer"],["Buyer Phone",sale.buyerPhone||""],["Payment Method",sale.paymentMethod?.replace(/_/g," ")||"Cash"],["Sold At",fmtDate(sale.soldAt)],["Notes",sale.notes||""]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",alignItems:"flex-start",gap:"1rem",padding:"0.625rem 0.875rem",borderBottom:"1px solid #F0F0F0"}}>
                    <div style={{fontSize:"0.72rem",color:"#A3A3A3",minWidth:"120px",flexShrink:0}}>{l}</div>
                    <div style={{fontSize:"0.875rem",color:"#1A1A1A",flex:1,textTransform:"capitalize" as const}}>{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {expenses?.length > 0 && (
            <div style={{marginBottom:"1.5rem"}}>
              <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.875rem"}}>Expenses Logged ({expenses.length})</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"#F5F5F5"}}>
                  {["Category","Description","Amount","Date"].map(h=><th key={h} style={{padding:"0.5rem 0.75rem",textAlign:"left" as const,fontSize:"0.65rem",fontWeight:600,textTransform:"uppercase" as const,color:"#A3A3A3",letterSpacing:"0.08em"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {expenses.map((e: any, i: number)=>(
                    <tr key={i} style={{borderBottom:"1px solid #F0F0F0"}}>
                      <td style={{padding:"0.5rem 0.75rem",fontSize:"0.78rem",textTransform:"capitalize" as const}}>{e.category}</td>
                      <td style={{padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#525252"}}>{e.description||""}</td>
                      <td style={{padding:"0.5rem 0.75rem",fontSize:"0.82rem",fontWeight:600,color:"#DC2626"}}>{fmt(e.amount)}</td>
                      <td style={{padding:"0.5rem 0.75rem",fontSize:"0.72rem",color:"#A3A3A3"}}>{fmtDate(e.createdAt)}</td>
                    </tr>
                  ))}
                  <tr style={{background:"#FEF2F2"}}>
                    <td colSpan={2} style={{padding:"0.625rem 0.75rem",fontSize:"0.78rem",fontWeight:700}}>TOTAL EXPENSES</td>
                    <td style={{padding:"0.625rem 0.75rem",fontSize:"0.875rem",fontWeight:700,color:"#DC2626"}}>{fmt(financials?.totalExpenses)}</td>
                    <td/>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Movements */}
          {movements?.length > 0 && (
            <div style={{marginBottom:"1.5rem"}}>
              <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.875rem"}}>Movements Log ({movements.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {movements.map((m: any, i: number)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 0.75rem",background:"#F5F5F5",borderRadius:"6px",fontSize:"0.78rem"}}>
                    <span style={{color:"#F47B20",flexShrink:0}}></span>
                    <span style={{flex:1,color:"#1A1A1A",textTransform:"capitalize" as const}}>{m.movementType?.replace(/_/g," ")||"Movement"}</span>
                    <span style={{color:"#525252"}}>{m.destination||m.notes||""}</span>
                    <span style={{color:"#A3A3A3",flexShrink:0}}>{fmtDate(m.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{borderTop:"2px solid #E5E5E5",paddingTop:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"0.68rem",color:"#A3A3A3"}}>Confidential  For internal use only  {new Date().getFullYear()}</div>
            <div style={{textAlign:"right" as const}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",justifyContent:"flex-end"}}>
                <img src="/logo.png" alt="CARSTRIMS" style={{height:"16px",objectFit:"contain"}}/>
              </div>
              <div style={{fontSize:"0.55rem",color:"#D4D4D4",marginTop:"2px"}}>Powered by UASE TECH STUDIO</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
