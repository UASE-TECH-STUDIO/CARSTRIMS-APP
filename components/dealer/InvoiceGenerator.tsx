"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

type DocType = "receipt" | "invoice" | "proforma";

interface Props { transactionId: string; onClose: () => void; }

export default function InvoiceGenerator({ transactionId, onClose }: Props) {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<DocType>("receipt");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/api/v1/inventory/sales/${transactionId}/receipt`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [transactionId]);

  const fmt    = (n:number) => `₦${(n||0).toLocaleString()}`;
  const fmtDate = (iso:string) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}) : "—";
  const LABELS: Record<DocType,string> = { receipt:"RECEIPT", invoice:"INVOICE", proforma:"PROFORMA INVOICE" };

  const openPrintWindow = (extraStyle = "") => {
    if (!printRef.current || !data) return;
    const dealer = data.dealer || {};
    const html = `<!DOCTYPE html><html><head>
      <title>CARSTRIMS ${LABELS[docType]} — ${transactionId}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#1A1A1A;background:#fff;max-width:680px;margin:0 auto}
        @media print{body{padding:12px}@page{margin:1cm}.no-print{display:none!important}}
        ${extraStyle}
      </style></head><body>
      ${printRef.current.innerHTML}
      <script>window.onload=()=>{window.focus();window.print();}<\/script>
      </body></html>`;
    const w = window.open("","_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const handlePDF = () => openPrintWindow();

  const handleJPG = () => {
    /* For JPG: open the print window and instruct user.
       This is the most reliable cross-browser approach — html2canvas
       has CORS issues with remote images (dealer logos, car photos). */
    openPrintWindow(`body{padding:8px}`);
    setTimeout(() => alert("In the print dialog:\n1. Choose 'Save as PDF' to get a PDF.\n2. Close and use a screenshot tool to get a JPG.\nTip: Press Windows+Shift+S to snip the document."), 800);
  };

  const handleShare = () => {
    if (!data) return;
    const text = `${LABELS[docType]}\n${data.dealer?.name||"CARSTRIMS"}\n${data.car?.brand} ${data.car?.model} ${data.car?.year}\nPrice: ${fmt(data.financials?.sellingPrice)}\nRef: ${transactionId}\nBuyer: ${data.buyer?.name||"—"}\nDate: ${fmtDate(data.issuedAt)}\n\nCARSTRIMS — UASE TECH STUDIO`;
    if (navigator.share) navigator.share({ title:`CARSTRIMS ${LABELS[docType]}`, text });
    else { navigator.clipboard.writeText(text); alert("Document details copied!"); }
  };

  if (loading) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100}}>
      <div style={{background:"#fff",borderRadius:"12px",padding:"2rem",textAlign:"center",display:"flex",flexDirection:"column",gap:"1rem",alignItems:"center"}}>
        <div style={{width:"28px",height:"28px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{color:"#737373",margin:0,fontSize:"0.875rem"}}>Loading document…</p>
      </div>
    </div>
  );

  if (!data) return null;

  const d = data;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:"1rem",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"700px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>

        {/* Controls */}
        <div className="no-print" style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"1rem 1.25rem",borderBottom:"1px solid #E5E5E5",flexWrap:"wrap",background:"#FAFAFA"}}>
          {(["receipt","invoice","proforma"] as DocType[]).map(t=>(
            <button key={t} onClick={()=>setDocType(t)}
              style={{padding:"0.45rem 0.875rem",borderRadius:"6px",border:"1.5px solid",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",
                background:docType===t?"#F47B20":"#fff",color:docType===t?"#fff":"#525252",borderColor:docType===t?"#F47B20":"#E5E5E5",transition:"all 0.15s"}}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button onClick={handlePDF} style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 0.875rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>🖨 Print / PDF</button>
          <button onClick={handleJPG} style={{background:"#EFF6FF",color:"#3B8BD4",border:"1.5px solid #BFDBFE",borderRadius:"8px",padding:"0.5rem 0.875rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>🖼 JPG</button>
          <button onClick={handleShare} style={{background:"#F0FDF4",color:"#16A34A",border:"1.5px solid #86EFAC",borderRadius:"8px",padding:"0.5rem 0.875rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>↗ Share</button>
          <button onClick={onClose} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 0.75rem",fontSize:"0.78rem",cursor:"pointer"}}>✕</button>
        </div>

        {/* Document */}
        <div ref={printRef} style={{padding:"2rem",background:"#fff",fontFamily:"Arial,sans-serif"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem",paddingBottom:"1.25rem",borderBottom:"3px solid #F47B20",flexWrap:"wrap",gap:"1rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
              {d.dealer?.logo&&(
                <div style={{width:"60px",height:"60px",borderRadius:"10px",overflow:"hidden",border:"2px solid rgba(244,123,32,0.3)",flexShrink:0}}>
                  <img src={d.dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                </div>
              )}
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:"1.15rem",fontWeight:700,color:"#1A1A1A"}}>{d.dealer?.name||"CARSTRIMS Dealer"}</div>
                {d.dealer?.phone&&<div style={{fontSize:"0.75rem",color:"#737373"}}>Tel: {d.dealer.phone}</div>}
                {d.dealer?.email&&<div style={{fontSize:"0.75rem",color:"#737373"}}>Email: {d.dealer.email}</div>}
                {(d.dealer?.city||d.dealer?.state)&&<div style={{fontSize:"0.75rem",color:"#737373"}}>{[d.dealer.city,d.dealer.state].filter(Boolean).join(", ")}</div>}
              </div>
            </div>
            <div style={{textAlign:"right" as const}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.8rem",fontWeight:700,color:"#F47B20",letterSpacing:"0.08em"}}>{LABELS[docType]}</div>
              <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.25rem"}}>Ref: #{d.receiptNumber}</div>
              <div style={{fontSize:"0.78rem",color:"#737373"}}>{fmtDate(d.issuedAt)}</div>
              {docType==="proforma"&&<div style={{fontSize:"0.7rem",color:"#D97706",marginTop:"0.25rem",fontWeight:600}}>Valid for 7 days</div>}
            </div>
          </div>

          {/* Parties */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"1.25rem"}}>
            <div>
              <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.4rem"}}>From (Seller)</div>
              <div style={{fontSize:"0.875rem",fontWeight:600,color:"#1A1A1A"}}>{d.dealer?.name||"—"}</div>
              {d.dealer?.address&&<div style={{fontSize:"0.78rem",color:"#737373"}}>{d.dealer.address}</div>}
            </div>
            <div>
              <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.4rem"}}>To (Buyer)</div>
              <div style={{fontSize:"0.875rem",fontWeight:600,color:"#1A1A1A"}}>{d.buyer?.name||"Cash Buyer"}</div>
              {d.buyer?.phone&&<div style={{fontSize:"0.78rem",color:"#737373"}}>{d.buyer.phone}</div>}
              {d.buyer?.email&&<div style={{fontSize:"0.78rem",color:"#737373"}}>{d.buyer.email}</div>}
            </div>
          </div>

          {/* Vehicle */}
          <div style={{background:"#F5F5F5",borderRadius:"10px",padding:"1rem",marginBottom:"1.25rem",display:"flex",gap:"1rem",alignItems:"center"}}>
            {d.car?.image&&<img src={d.car.image} alt="" style={{width:"80px",height:"60px",objectFit:"cover",borderRadius:"6px",flexShrink:0,border:"1px solid #E5E5E5"}}/>}
            <div>
              <div style={{fontSize:"0.6rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>Vehicle Details</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.5rem"}}>
                {[["Brand",d.car?.brand],["Model",d.car?.model],["Year",d.car?.year],["Color",d.car?.color||"—"],["VIN",d.car?.vin||"—"],["Car ID",d.car?.carId||"—"]].map(([l,v])=>(
                  <div key={l}><div style={{fontSize:"0.58rem",color:"#A3A3A3",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{l}</div><div style={{fontSize:"0.82rem",fontWeight:600,color:"#1A1A1A"}}>{v||"—"}</div></div>
                ))}
              </div>
            </div>
          </div>

          {/* Financials */}
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"1.25rem"}}>
            <thead><tr style={{background:"#1A1A1A",color:"#fff"}}>
              <th style={{padding:"0.625rem 0.875rem",textAlign:"left" as const,fontSize:"0.72rem",fontWeight:600}}>Description</th>
              <th style={{padding:"0.625rem 0.875rem",textAlign:"right" as const,fontSize:"0.72rem",fontWeight:600}}>Amount</th>
            </tr></thead>
            <tbody>
              <tr style={{borderBottom:"1px solid #E5E5E5"}}>
                <td style={{padding:"0.75rem 0.875rem",fontSize:"0.875rem"}}>
                  {d.car?.brand} {d.car?.model} {d.car?.year}<br/>
                  <span style={{fontSize:"0.72rem",color:"#737373"}}>Payment: {d.financials?.paymentMethod?.replace(/_/g," ")||"Cash"}</span>
                </td>
                <td style={{padding:"0.75rem 0.875rem",textAlign:"right" as const,fontFamily:"Georgia,serif",fontSize:"1.2rem",fontWeight:700,color:"#F47B20"}}>{fmt(d.financials?.sellingPrice)}</td>
              </tr>
            </tbody>
            <tfoot><tr style={{background:"#F5F5F5"}}>
              <td style={{padding:"0.875rem",fontWeight:700,fontSize:"0.9rem"}}>TOTAL {docType==="receipt"?"PAID":"DUE"}</td>
              <td style={{padding:"0.875rem",textAlign:"right" as const,fontFamily:"Georgia,serif",fontSize:"1.3rem",fontWeight:700,color:"#F47B20"}}>{fmt(d.financials?.sellingPrice)}</td>
            </tfoot>
          </table>

          {docType==="receipt"&&(
            <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"0.875rem",marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
              <span style={{fontSize:"1.1rem"}}>✅</span>
              <div>
                <div style={{fontSize:"0.78rem",fontWeight:700,color:"#15803D"}}>PAYMENT RECEIVED IN FULL</div>
                <div style={{fontSize:"0.72rem",color:"#15803D"}}>{fmt(d.financials?.sellingPrice)} — {d.financials?.paymentMethod?.replace(/_/g," ")||"Cash"}</div>
              </div>
            </div>
          )}

          {d.financials?.notes&&(
            <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.2)",borderRadius:"8px",padding:"0.875rem",marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.1em",color:"#A3A3A3",marginBottom:"0.3rem"}}>Notes</div>
              <div style={{fontSize:"0.875rem",color:"#525252"}}>{d.financials.notes}</div>
            </div>
          )}

          {/* Signature + footer */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem",marginTop:"2rem",paddingTop:"1.25rem",borderTop:"1px solid #E5E5E5"}}>
            <div>
              <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>Authorised By</div>
              {d.dealer?.signature
                ?<img src={d.dealer.signature} alt="Signature" style={{height:"48px",objectFit:"contain",display:"block",marginBottom:"6px"}}/>
                :<div style={{height:"40px",borderBottom:"1px solid #1A1A1A",marginBottom:"6px"}}/>
              }
              <div style={{fontSize:"0.75rem",color:"#1A1A1A",fontWeight:600}}>{d.dealer?.name}</div>
            </div>
            <div>
              <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>Customer Acknowledgement</div>
              <div style={{height:"40px",borderBottom:"1px solid #1A1A1A",marginBottom:"6px"}}/>
              <div style={{fontSize:"0.72rem",color:"#888"}}>Signature & Date</div>
            </div>
          </div>

          <div style={{borderTop:"2px solid #E5E5E5",paddingTop:"1rem",marginTop:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.5rem"}}>
            <div style={{fontSize:"0.68rem",color:"#A3A3A3",maxWidth:"320px",lineHeight:1.5}}>
              {docType==="proforma"?"This proforma invoice does not constitute a final sale or payment obligation.":"This document is valid as proof of sale and payment."}
            </div>
            <div style={{textAlign:"right" as const}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:"0.875rem",color:"#F47B20",fontWeight:700,letterSpacing:"0.1em"}}>CARSTRIMS</div>
              <div style={{fontSize:"0.58rem",color:"#D4D4D4",marginTop:"2px"}}>Powered by UASE TECH STUDIO</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
