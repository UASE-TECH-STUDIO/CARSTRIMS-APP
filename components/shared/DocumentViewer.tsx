"use client";
import { useRef } from "react";

interface Props { doc: any; onClose: () => void; }

const fmt  = (n: number) => `NGN ${(n||0).toLocaleString()}`;
const fmtD = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}) : "-";

export default function DocumentViewer({ doc, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const html = `<!DOCTYPE html><html><head><title>${doc.title||"Document"} - CARSTRIMS</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;padding:24px;color:#1A1A1A;max-width:750px;margin:0 auto}
h1{color:#F47B20;font-size:1.75rem;margin-bottom:0.5rem}
h2{font-size:1rem;color:#1A1A1A;margin:1.25rem 0 0.5rem}
table{width:100%;border-collapse:collapse;margin:1rem 0}
th{background:#1A1A1A;color:#fff;padding:0.625rem 0.875rem;text-align:left;font-size:0.75rem;letter-spacing:0.06em}
td{padding:0.625rem 0.875rem;border-bottom:1px solid #E5E5E5;font-size:0.875rem}
.badge{display:inline-block;padding:0.2rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:700;letter-spacing:0.08em}
.orange{color:#F47B20}.green{color:#16A34A}.red{color:#DC2626}
img{max-height:70px;object-fit:contain}
hr{border:none;border-top:1px solid #E5E5E5;margin:1.25rem 0}
.sig-box{height:50px;border-bottom:1px solid #1A1A1A;margin-bottom:6px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1.5rem}
.label{font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A3A3A3;margin-bottom:0.3rem}
.value{font-size:0.95rem;font-weight:600;color:#1A1A1A}
.info-block{background:#F5F5F5;border-radius:8px;padding:1rem;margin:0.75rem 0}
.total-line{display:flex;justify-content:space-between;padding:0.35rem 0;font-size:0.9rem}
.total-final{display:flex;justify-content:space-between;padding:0.625rem 0;font-size:1.1rem;font-weight:700;border-top:2.5px solid #1A1A1A;margin-top:0.25rem}
.footer{text-align:center;margin-top:2rem;padding-top:1rem;border-top:1px solid #E5E5E5;font-size:0.65rem;color:#A3A3A3;letter-spacing:0.08em}
@media print{@page{margin:1cm}}
</style></head><body>${content}</body></html>`;

    // Use blob URL — avoids popup blocker completely
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

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9000,overflowY:"auto",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:"720px",margin:"auto",background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.35)"}}>

        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1.25rem",background:"#1A1A1A",gap:"0.5rem",flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.1em",color:"#F47B20"}}>{docTitle}</div>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
            <button onClick={handleCSV} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer"}}>CSV / Excel</button>
            <button onClick={handlePrint} style={{background:"#F47B20",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>Print / PDF</button>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.875rem",cursor:"pointer"}}>X</button>
          </div>
        </div>

        {/* Document */}
        <div ref={printRef} style={{padding:"2rem",fontFamily:"Arial,sans-serif",color:"#1A1A1A"}}>
          {/* Header row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"3px solid #F47B20",paddingBottom:"1.25rem",marginBottom:"1.5rem",flexWrap:"wrap",gap:"1rem"}}>
            <div>
              {d.dealer?.logo&&<img src={d.dealer.logo} alt="" style={{height:"60px",objectFit:"contain",display:"block",marginBottom:"0.5rem"}}/>}
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,letterSpacing:"0.08em",color:"#1A1A1A"}}>{d.dealer?.companyName||"CARSTRIMS DEALER"}</div>
              {d.dealer?.address&&<div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>{[d.dealer.address,d.dealer.city,d.dealer.state].filter(Boolean).join(", ")}</div>}
              {d.dealer?.phone&&<div style={{fontSize:"0.78rem",color:"#737373"}}>Tel: {d.dealer.phone}</div>}
              {d.dealer?.email&&<div style={{fontSize:"0.78rem",color:"#737373"}}>{d.dealer.email}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <h1 style={{color:"#F47B20",fontSize:"1.75rem",letterSpacing:"0.06em",margin:0}}>{docTitle}</h1>
              {d.documentType==="PROFORMA_INVOICE"&&<div style={{fontSize:"0.75rem",color:"#D97706",marginTop:"0.2rem"}}>Formal Quote - Not a Demand for Payment</div>}
              <div style={{marginTop:"0.75rem",display:"flex",flexDirection:"column",gap:"0.2rem",alignItems:"flex-end"}}>
                <div style={{fontSize:"0.78rem",color:"#737373"}}>No: <strong>{d.documentNumber}</strong></div>
                <div style={{fontSize:"0.78rem",color:"#737373"}}>Date: <strong>{fmtD(d.issuedAt)}</strong></div>
                {d.dueDate&&<div style={{fontSize:"0.78rem",color:"#DC2626"}}>Due: <strong>{fmtD(d.dueDate)}</strong></div>}
                {d.validUntil&&<div style={{fontSize:"0.78rem",color:"#D97706"}}>Valid until: <strong>{fmtD(d.validUntil)}</strong></div>}
                {d.status&&<span style={{background:d.status==="PAID"?"#16A34A":d.status==="QUOTE"?"#D97706":"#3B8BD4",color:"#fff",padding:"0.2rem 0.75rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.06em",marginTop:"0.25rem"}}>{d.status}</span>}
              </div>
            </div>
          </div>

          {/* Buyer */}
          {d.buyer?.name&&(
            <div style={{background:"#F5F5F5",borderRadius:"8px",padding:"1rem",marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.35rem"}}>Billed To</div>
              <div style={{fontSize:"0.95rem",fontWeight:700,color:"#1A1A1A"}}>{d.buyer.name}</div>
              {d.buyer.phone&&<div style={{fontSize:"0.8rem",color:"#737373"}}>Tel: {d.buyer.phone}</div>}
              {d.buyer.email&&<div style={{fontSize:"0.8rem",color:"#737373"}}>{d.buyer.email}</div>}
            </div>
          )}

          {/* Vehicle */}
          <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.25)",borderRadius:"8px",padding:"1rem",marginBottom:"1.25rem",display:"flex",gap:"1rem",alignItems:"center"}}>
            {d.car?.image&&<img src={d.car.image} alt="" style={{width:"80px",height:"60px",objectFit:"cover",borderRadius:"6px",flexShrink:0}}/>}
            <div>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.3rem"}}>Vehicle</div>
              <div style={{fontSize:"1rem",fontWeight:700,color:"#1A1A1A"}}>{d.car?.brand} {d.car?.model} {d.car?.year}</div>
              <div style={{fontSize:"0.78rem",color:"#737373"}}>{[d.car?.color,d.car?.condition,d.car?.transmission].filter(Boolean).join(" · ")}</div>
              {d.car?.vin&&<div style={{fontSize:"0.72rem",color:"#A3A3A3",fontFamily:"monospace"}}>VIN: {d.car.vin}</div>}
              <div style={{fontSize:"0.72rem",color:"#A3A3A3",fontFamily:"monospace"}}>Car ID: {d.car?.carId}</div>
            </div>
          </div>

          {/* Line items */}
          {d.lineItems&&d.lineItems.length>0&&(
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"1.25rem",fontSize:"0.875rem"}}>
              <thead>
                <tr style={{background:"#1A1A1A",color:"#fff"}}>
                  {["Description","Qty","Unit Price","Total"].map(h=>(
                    <th key={h} style={{padding:"0.625rem 0.875rem",textAlign:h==="Description"?"left":"right" as const,fontSize:"0.72rem",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.lineItems.map((item:any,i:number)=>(
                  <tr key={i} style={{borderBottom:"1px solid #E5E5E5",background:i%2===0?"#fff":"#FAFAFA"}}>
                    <td style={{padding:"0.625rem 0.875rem"}}>{item.description}</td>
                    <td style={{padding:"0.625rem 0.875rem",textAlign:"right" as const}}>{item.quantity}</td>
                    <td style={{padding:"0.625rem 0.875rem",textAlign:"right" as const}}>{fmt(item.unitPrice)}</td>
                    <td style={{padding:"0.625rem 0.875rem",textAlign:"right" as const,fontWeight:600,color:"#F47B20"}}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          {d.financials&&(
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"1.5rem"}}>
              <div style={{width:"280px",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                {d.financials.subtotal!==undefined&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem",color:"#737373"}}><span>Subtotal</span><span>{fmt(d.financials.subtotal)}</span></div>}
                {(d.financials.discount||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem",color:"#16A34A"}}><span>Discount</span><span>- {fmt(d.financials.discount)}</span></div>}
                {(d.financials.vatAmount||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem",color:"#737373"}}><span>VAT ({((d.financials.vatRate||0)*100).toFixed(1)}%)</span><span>{fmt(d.financials.vatAmount)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"1.1rem",fontWeight:700,color:"#1A1A1A",borderTop:"2.5px solid #1A1A1A",paddingTop:"0.5rem",marginTop:"0.25rem"}}>
                  <span>{d.documentType==="RECEIPT"?"Amount Paid":"Total Due"}</span>
                  <span style={{color:"#F47B20"}}>{fmt(d.financials.total||d.financials.amountPaid||0)}</span>
                </div>
                {d.documentType==="RECEIPT"&&(
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",color:"#16A34A",fontWeight:600}}><span>Balance Due</span><span>NGN 0 — PAID IN FULL</span></div>
                )}
              </div>
            </div>
          )}

          {/* Receipt confirmation */}
          {d.documentType==="RECEIPT"&&d.transaction&&(
            <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"1rem",marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#15803D",marginBottom:"0.4rem"}}>Payment Received</div>
              <div style={{fontSize:"0.9rem",color:"#15803D",fontWeight:600}}>Paid in full - {d.transaction.paymentMethod?.replace(/_/g," ").toUpperCase()}</div>
              <div style={{fontSize:"0.72rem",color:"#737373",fontFamily:"monospace",marginTop:"0.2rem"}}>Ref: {d.transaction.transactionId}</div>
              {d.confirmation&&<p style={{fontSize:"0.82rem",color:"#1A1A1A",marginTop:"0.75rem",lineHeight:1.6}}>{d.confirmation}</p>}
            </div>
          )}

          {/* Notes */}
          {(d.notes||d.paymentInstructions)&&(
            <div style={{fontSize:"0.78rem",color:"#737373",lineHeight:1.6,marginBottom:"1.25rem",padding:"0.875rem",background:"#F5F5F5",borderRadius:"8px"}}>
              {d.paymentInstructions&&<p style={{marginBottom:"0.4rem"}}>{d.paymentInstructions}</p>}
              {d.notes&&<p><em>Notes: {d.notes}</em></p>}
            </div>
          )}
          {d.legalNote&&<div style={{fontSize:"0.72rem",color:"#A3A3A3",lineHeight:1.5,marginBottom:"1.25rem",padding:"0.75rem",borderLeft:"3px solid #E5E5E5"}}>{d.legalNote}</div>}

          {/* Signature */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem",marginTop:"2rem",paddingTop:"1.25rem",borderTop:"1px solid #E5E5E5"}}>
            <div>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>Issued By</div>
              {d.dealer?.signature?<img src={d.dealer.signature} alt="Signature" style={{height:"50px",objectFit:"contain",display:"block",marginBottom:"4px"}}/>:<div style={{height:"40px",borderBottom:"1px solid #1A1A1A",marginBottom:"4px"}}/>}
              <div style={{fontSize:"0.78rem",color:"#1A1A1A",fontWeight:600}}>{d.dealer?.companyName}</div>
              <div style={{fontSize:"0.7rem",color:"#737373"}}>Authorised Signatory</div>
            </div>
            <div>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>Customer Acknowledgement</div>
              <div style={{height:"40px",borderBottom:"1px solid #1A1A1A",marginBottom:"4px"}}/>
              <div style={{fontSize:"0.7rem",color:"#737373"}}>Signature & Date</div>
            </div>
          </div>

          <div style={{textAlign:"center",marginTop:"1.5rem",paddingTop:"1rem",borderTop:"1px solid #E5E5E5",fontSize:"0.65rem",color:"#A3A3A3",letterSpacing:"0.08em"}}>
            {d.footer||"Powered by CARSTRIMS - Built by UASE TECH STUDIO"}
          </div>
        </div>
      </div>
    </div>
  );
}
