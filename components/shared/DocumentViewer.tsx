"use client";
import { useRef } from "react";
import Link from "next/link";

interface Props { doc: any; onClose: () => void; }

const fmt  = (n: number) => `NGN ${(n||0).toLocaleString()}`;
const fmtD = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}) : "-";

export default function DocumentViewer({ doc, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.title||"Document"} - CARSTRIMS</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Arial",sans-serif;padding:28px 32px;color:#1A1A1A;max-width:760px;margin:0 auto;font-size:13px}
/* ── Dealer logo ── */
.doc-logo{
  display:block;max-height:72px;max-width:220px;
  object-fit:contain;margin-bottom:8px;
  /* No background manipulation needed — logos usually have white/transparent bg */
}
/* ── Signature ── */
.doc-sig{
  display:block;max-height:64px;max-width:200px;
  object-fit:contain;
  /* mix-blend-mode:multiply removes white/grey backgrounds from signature images
     making them look like real ink on white paper */
  mix-blend-mode:multiply;
  filter:contrast(1.15) brightness(0.95);
}
/* ── Header ── */
.doc-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #F47B20;padding-bottom:16px;margin-bottom:20px;gap:16px}
.doc-dealer{flex:1}
.doc-dealer-name{font-size:18px;font-weight:700;letter-spacing:0.04em;color:#1A1A1A;margin-bottom:2px}
.doc-dealer-sub{font-size:10px;color:#737373;line-height:1.5}
.doc-title-block{text-align:right;flex-shrink:0}
.doc-type{font-size:26px;font-weight:700;letter-spacing:0.06em;color:#F47B20;line-height:1}
.doc-type-sub{font-size:10px;color:#D97706;margin-top:3px}
.doc-meta{margin-top:8px;font-size:10px;color:#737373;display:flex;flex-direction:column;gap:2px;align-items:flex-end}
.status-badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.08em;margin-top:4px;color:#fff}
/* ── Sections ── */
.doc-section{margin-bottom:16px}
.doc-section-label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A3A3A3;border-bottom:1px solid #F0F0F0;padding-bottom:4px;margin-bottom:8px}
.info-box{background:#F5F5F5;border-radius:6px;padding:12px;margin-bottom:12px}
.info-row{display:flex;gap:8px;margin-bottom:4px;align-items:baseline}
.info-label{font-size:9px;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.06em;min-width:72px;flex-shrink:0}
.info-val{font-size:12px;color:#1A1A1A;font-weight:500}
.info-val-strong{font-size:13px;color:#1A1A1A;font-weight:700}
.info-val-price{font-size:16px;color:#F47B20;font-weight:700}
/* ── Vehicle box ── */
.vehicle-box{display:flex;gap:12px;align-items:center;background:#FFF7ED;border:1px solid rgba(244,123,32,0.2);border-radius:8px;padding:12px;margin-bottom:16px}
.vehicle-img{width:90px;height:68px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid rgba(244,123,32,0.2)}
.vehicle-name{font-size:15px;font-weight:700;color:#1A1A1A}
.vehicle-sub{font-size:10px;color:#737373;margin-top:2px;text-transform:capitalize}
.vehicle-id{font-size:9px;color:#A3A3A3;font-family:monospace;margin-top:4px}
/* ── Line items table ── */
table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px}
th{background:#1A1A1A;color:#fff;padding:8px 12px;text-align:left;font-size:9px;letter-spacing:0.06em;font-weight:600}
th:last-child,td:last-child{text-align:right}
td{padding:8px 12px;border-bottom:1px solid #E5E5E5;vertical-align:middle}
tr:nth-child(even) td{background:#FAFAFA}
.td-total{font-weight:700;color:#F47B20}
/* ── Totals ── */
.totals-wrap{display:flex;justify-content:flex-end;margin-bottom:16px}
.totals-box{width:280px;display:flex;flex-direction:column;gap:4px}
.total-row{display:flex;justify-content:space-between;font-size:11px;color:#737373;padding:2px 0}
.total-row-final{display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:#1A1A1A;border-top:2px solid #1A1A1A;padding-top:6px;margin-top:3px}
.total-row-paid{display:flex;justify-content:space-between;font-size:11px;color:#16A34A;font-weight:600;margin-top:4px}
/* ── Receipt confirmation ── */
.receipt-confirm{background:#F0FDF4;border:1px solid #86EFAC;border-radius:6px;padding:12px;margin-bottom:16px;font-size:11px;color:#15803D;line-height:1.5}
/* ── Notes ── */
.doc-notes{background:#F5F5F5;border-radius:6px;padding:10px 12px;font-size:10px;color:#737373;line-height:1.5;margin-bottom:16px}
.doc-legal{font-size:9px;color:#A3A3A3;border-left:2px solid #E5E5E5;padding-left:8px;margin-bottom:16px;line-height:1.5}
/* ── Signature row ── */
.sig-row{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:24px;padding-top:16px;border-top:1px solid #E5E5E5}
.sig-block-label{font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A3A3A3;margin-bottom:8px}
.sig-line{height:40px;border-bottom:1px solid #1A1A1A;margin-bottom:4px}
.sig-name{font-size:10px;color:#1A1A1A;font-weight:600}
.sig-title{font-size:9px;color:#A3A3A3}
/* ── Footer ── */
.doc-footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #E5E5E5;font-size:8px;color:#A3A3A3;letter-spacing:0.08em}
@media print{@page{margin:1cm}body{padding:0}}
</style></head><body>${content}</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:none;left:-9999px";
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
    };
    iframe.src = url;
  };

  const handleCSV = () => {
    const d = doc;
    const rows: string[][] = [
      ["Field","Value"],
      ["Document Type", d.documentType||""],
      ["Document Number", d.documentNumber||""],
      ["Date Issued", fmtD(d.issuedAt)],
      ["Status", d.status||""],
      ["Dealer", d.dealer?.companyName||""],
      ["Dealer Phone", d.dealer?.phone||""],
      ["Dealer Email", d.dealer?.email||""],
      ["Vehicle", `${d.car?.brand||""} ${d.car?.model||""} ${d.car?.year||""}`],
      ["Car ID", d.car?.carId||""],
      ["VIN", d.car?.vin||""],
      ["Colour", d.car?.color||""],
      ["Condition", d.car?.condition||""],
      ["Buyer Name", d.buyer?.name||""],
      ["Buyer Phone", d.buyer?.phone||""],
      ["Buyer Email", d.buyer?.email||""],
      ["Amount", String(d.financials?.total||d.financials?.amountPaid||d.financials?.subtotal||0)],
      ["Payment Method", d.financials?.paymentMethod||d.transaction?.paymentMethod||""],
      ["Currency", "NGN"],
      ["Notes", d.notes||d.transaction?.notes||""],
    ];
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(d.documentNumber||d.documentType||"document").replace(/[^a-zA-Z0-9-]/g,"_")}.csv`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };

  const d = doc;
  const titleMap: Record<string,string> = {
    PROFORMA_INVOICE:"PROFORMA INVOICE",
    STANDARD_INVOICE:"INVOICE",
    RECEIPT:"RECEIPT",
  };
  const docTitle = titleMap[d.documentType] || d.title?.toUpperCase() || "DOCUMENT";
  const statusColor: Record<string,string> = { PAID:"#16A34A", QUOTE:"#D97706", INVOICE:"#3B8BD4" };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9000,overflowY:"auto",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:"780px",margin:"auto",background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.35)"}}>

        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1.25rem",background:"#1A1A1A",gap:"0.5rem",flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.1em",color:"#F47B20"}}>{docTitle}</div>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
            <button onClick={handleCSV} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer"}}>CSV / Excel</button>
            <button onClick={handlePrint} style={{background:"#F47B20",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>🖨 Print / PDF</button>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.875rem",cursor:"pointer"}}>✕</button>
          </div>
        </div>

        {/* Document preview */}
        <div ref={printRef} style={{padding:"2rem",fontFamily:"Arial,sans-serif",color:"#1A1A1A",fontSize:"13px"}}>

          {/* ── Header ── */}
          <div className="doc-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"3px solid #F47B20",paddingBottom:"16px",marginBottom:"20px",gap:"16px",flexWrap:"wrap"}}>
            <div className="doc-dealer">
              {d.dealer?.logo&&(
                <img src={d.dealer.logo} alt="" className="doc-logo"
                  style={{display:"block",maxHeight:"72px",maxWidth:"220px",objectFit:"contain",marginBottom:"8px"}}/>
              )}
              <div style={{fontSize:"18px",fontWeight:700,letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"2px"}}>{d.dealer?.companyName||"CARSTRIMS DEALER"}</div>
              {[d.dealer?.address,d.dealer?.city,d.dealer?.state].filter(Boolean).length>0&&(
                <div style={{fontSize:"10px",color:"#737373",lineHeight:1.5}}>{[d.dealer?.address,d.dealer?.city,d.dealer?.state].filter(Boolean).join(", ")}</div>
              )}
              {d.dealer?.phone&&<div style={{fontSize:"10px",color:"#737373"}}>Tel: {d.dealer.phone}</div>}
              {d.dealer?.email&&<div style={{fontSize:"10px",color:"#737373"}}>{d.dealer.email}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:"26px",fontWeight:700,letterSpacing:"0.06em",color:"#F47B20",lineHeight:1}}>{docTitle}</div>
              {d.documentType==="PROFORMA_INVOICE"&&<div style={{fontSize:"10px",color:"#D97706",marginTop:"3px"}}>Formal Quote — Not a Demand for Payment</div>}
              <div style={{marginTop:"8px",display:"flex",flexDirection:"column",gap:"2px",alignItems:"flex-end",fontSize:"10px",color:"#737373"}}>
                <div>No: <strong style={{fontFamily:"monospace"}}>{d.documentNumber}</strong></div>
                <div>Date: <strong>{fmtD(d.issuedAt)}</strong></div>
                {d.dueDate&&<div style={{color:"#DC2626"}}>Due: <strong>{fmtD(d.dueDate)}</strong></div>}
                {d.validUntil&&<div style={{color:"#D97706"}}>Valid until: <strong>{fmtD(d.validUntil)}</strong></div>}
                {d.status&&<span style={{background:statusColor[d.status]||"#3B8BD4",color:"#fff",padding:"3px 12px",borderRadius:"20px",fontSize:"9px",fontWeight:700,letterSpacing:"0.08em",marginTop:"4px",display:"inline-block"}}>{d.status}</span>}
              </div>
            </div>
          </div>

          {/* ── Buyer ── */}
          {d.buyer?.name&&(
            <div style={{background:"#F5F5F5",borderRadius:"6px",padding:"12px",marginBottom:"16px"}}>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"6px"}}>Billed To</div>
              <div style={{fontSize:"14px",fontWeight:700,color:"#1A1A1A"}}>{d.buyer.name}</div>
              {d.buyer.phone&&<div style={{fontSize:"11px",color:"#737373",marginTop:"2px"}}>Tel: {d.buyer.phone}</div>}
              {d.buyer.email&&<div style={{fontSize:"11px",color:"#737373"}}>{d.buyer.email}</div>}
            </div>
          )}

          {/* ── Vehicle ── */}
          <div style={{display:"flex",gap:"12px",alignItems:"center",background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.2)",borderRadius:"8px",padding:"12px",marginBottom:"16px"}}>
            {d.car?.image&&<img src={d.car.image} alt="" style={{width:"90px",height:"68px",objectFit:"cover",borderRadius:"6px",flexShrink:0,border:"1px solid rgba(244,123,32,0.2)"}}/>}
            <div>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#F47B20",marginBottom:"4px"}}>Vehicle</div>
              <div style={{fontSize:"15px",fontWeight:700,color:"#1A1A1A"}}>{d.car?.brand} {d.car?.model} {d.car?.year}</div>
              <div style={{fontSize:"10px",color:"#737373",marginTop:"2px",textTransform:"capitalize" as const}}>{[d.car?.color,d.car?.condition,d.car?.transmission].filter(Boolean).join(" · ")}</div>
              {d.car?.vin&&<div style={{fontSize:"9px",color:"#A3A3A3",fontFamily:"monospace",marginTop:"3px"}}>VIN: {d.car.vin}</div>}
              <div style={{fontSize:"9px",color:"#A3A3A3",fontFamily:"monospace"}}>Car ID: {d.car?.carId}</div>
            </div>
          </div>

          {/* ── Line items ── */}
          {d.lineItems&&d.lineItems.length>0&&(
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"16px",fontSize:"12px"}}>
              <thead>
                <tr style={{background:"#1A1A1A",color:"#fff"}}>
                  {["Description","Qty","Unit Price","Total"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:h==="Description"?"left":"right" as const,fontSize:"9px",letterSpacing:"0.06em",fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.lineItems.map((item:any,i:number)=>(
                  <tr key={i} style={{borderBottom:"1px solid #E5E5E5",background:i%2===0?"#fff":"#FAFAFA"}}>
                    <td style={{padding:"8px 12px"}}>{item.description}</td>
                    <td style={{padding:"8px 12px",textAlign:"right" as const}}>{item.quantity}</td>
                    <td style={{padding:"8px 12px",textAlign:"right" as const}}>{fmt(item.unitPrice)}</td>
                    <td style={{padding:"8px 12px",textAlign:"right" as const,fontWeight:700,color:"#F47B20"}}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Totals ── */}
          {d.financials&&(
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"16px"}}>
              <div style={{width:"280px",display:"flex",flexDirection:"column",gap:"4px"}}>
                {d.financials.subtotal!==undefined&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#737373"}}><span>Subtotal</span><span>{fmt(d.financials.subtotal)}</span></div>}
                {(d.financials.discount||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#16A34A"}}><span>Discount</span><span>- {fmt(d.financials.discount)}</span></div>}
                {(d.financials.vatAmount||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#737373"}}><span>VAT ({((d.financials.vatRate||0)*100).toFixed(1)}%)</span><span>{fmt(d.financials.vatAmount)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"15px",fontWeight:700,color:"#1A1A1A",borderTop:"2px solid #1A1A1A",paddingTop:"6px",marginTop:"3px"}}>
                  <span>{d.documentType==="RECEIPT"?"Amount Paid":"Total Due"}</span>
                  <span style={{color:"#F47B20"}}>{fmt(d.financials.total||d.financials.amountPaid||0)}</span>
                </div>
                {d.documentType==="RECEIPT"&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#16A34A",fontWeight:600}}><span>Balance Due</span><span>NGN 0 — PAID IN FULL</span></div>}
              </div>
            </div>
          )}

          {/* ── Receipt confirmation ── */}
          {d.documentType==="RECEIPT"&&d.transaction&&(
            <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"12px",marginBottom:"16px",fontSize:"11px",color:"#15803D",lineHeight:1.5}}>
              <div style={{fontWeight:700,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase" as const,marginBottom:"4px"}}>Payment Received</div>
              <strong>Paid in full — {d.transaction.paymentMethod?.replace(/_/g," ").toUpperCase()}</strong>
              <div style={{fontFamily:"monospace",fontSize:"9px",color:"#737373",marginTop:"2px"}}>Ref: {d.transaction.transactionId}</div>
              {d.confirmation&&<p style={{marginTop:"8px",color:"#1A1A1A"}}>{d.confirmation}</p>}
            </div>
          )}

          {/* ── Notes ── */}
          {(d.notes||d.paymentInstructions)&&(
            <div style={{background:"#F5F5F5",borderRadius:"6px",padding:"10px 12px",fontSize:"10px",color:"#737373",lineHeight:1.5,marginBottom:"16px"}}>
              {d.paymentInstructions&&<p style={{marginBottom:"4px"}}>{d.paymentInstructions}</p>}
              {d.notes&&<p><em>Notes: {d.notes}</em></p>}
            </div>
          )}
          {d.legalNote&&<div style={{fontSize:"9px",color:"#A3A3A3",borderLeft:"2px solid #E5E5E5",paddingLeft:"8px",marginBottom:"16px",lineHeight:1.5}}>{d.legalNote}</div>}

          {/* ── Signature ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"32px",marginTop:"24px",paddingTop:"16px",borderTop:"1px solid #E5E5E5"}}>
            <div>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"8px"}}>Issued By</div>
              {d.dealer?.signature?(
                <img src={d.dealer.signature} alt="Signature" className="doc-sig"
                  style={{
                    display:"block",maxHeight:"64px",maxWidth:"200px",objectFit:"contain",
                    marginBottom:"6px",
                    /* mix-blend-mode removes white/grey background — real ink effect */
                    mixBlendMode:"multiply" as any,
                    filter:"contrast(1.15) brightness(0.95)",
                  }}/>
              ):(
                <div style={{height:"44px",borderBottom:"1px solid #1A1A1A",marginBottom:"6px"}}/>
              )}
              <div style={{fontSize:"11px",color:"#1A1A1A",fontWeight:700}}>{d.dealer?.companyName}</div>
              <div style={{fontSize:"9px",color:"#737373"}}>Authorised Signatory</div>
            </div>
            <div>
              <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"8px"}}>Customer Acknowledgement</div>
              <div style={{height:"44px",borderBottom:"1px solid #1A1A1A",marginBottom:"6px"}}/>
              <div style={{fontSize:"9px",color:"#737373"}}>Signature & Date</div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{textAlign:"center",marginTop:"24px",paddingTop:"12px",borderTop:"1px solid #E5E5E5",fontSize:"8px",color:"#A3A3A3",letterSpacing:"0.08em"}}>
            {d.footer||"Powered by CARSTRIMS · Built by UASE TECH STUDIO · Nigeria's Premier Vehicle Marketplace"}
          </div>
        </div>
      </div>
    </div>
  );
}
