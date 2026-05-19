"use client";
import { useState, useRef } from "react";

type DocType = "PROFORMA_INVOICE" | "STANDARD_INVOICE" | "RECEIPT" | "REPORT";

interface Props { doc: any; onClose: () => void; }

const fmt  = (n: number) => `₦${(n||0).toLocaleString()}`;
const fmtD = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}) : "—";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string,string> = {
    QUOTE:"#D97706", INVOICE:"#3B8BD4", PAID:"#16A34A",
  };
  return (
    <span style={{background:colors[status]||"#737373",color:"#fff",padding:"0.2rem 0.75rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em"}}>{status}</span>
  );
}

export default function DocumentViewer({ doc, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open("","_blank")!;
    w.document.write(`<html><head><title>${doc.title||"Document"}</title>
      <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1A1A1A}
      @media print{.no-print{display:none!important}}</style></head><body>`);
    w.document.write(printRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    setTimeout(()=>{ w.print(); w.close(); }, 400);
  };

  const handleCSV = () => {
    const d = doc;
    const rows = [
      ["Document","Value"],
      ["Type", d.documentType],
      ["Number", d.documentNumber],
      ["Date", fmtD(d.issuedAt)],
      ["Dealer", d.dealer?.companyName],
      ["Car", `${d.car?.brand} ${d.car?.model} ${d.car?.year}`],
      ["Car ID", d.car?.carId],
      ["VIN", d.car?.vin||""],
      ["Buyer", d.buyer?.name||""],
      ["Buyer Phone", d.buyer?.phone||""],
      ...(d.financials ? [
        ["Subtotal", d.financials.subtotal||d.financials.amountPaid||0],
        ["VAT", d.financials.vatAmount||0],
        ["Total", d.financials.total||d.financials.amountPaid||0],
        ["Currency", "NGN"],
        ["Payment Method", d.financials.paymentMethod||d.transaction?.paymentMethod||""],
      ] : []),
    ];
    const csv = rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.documentNumber||d.documentType}.csv`;
    a.click();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9000,overflowY:"auto",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:"720px",margin:"auto",background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.3)"}}>

        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1.25rem",background:"#1A1A1A",color:"#fff",gap:"0.5rem",flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.1em",color:"#F47B20"}}>{doc.title?.toUpperCase()}</div>
          <div className="no-print" style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
            <button onClick={handleCSV} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>⬇ CSV / Excel</button>
            <button onClick={handlePrint} style={{background:"#F47B20",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>🖨 Print / PDF</button>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.875rem",cursor:"pointer"}}>✕</button>
          </div>
        </div>

        {/* Document body */}
        <div ref={printRef} style={{padding:"2rem",fontFamily:"Arial,sans-serif",color:"#1A1A1A"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem",paddingBottom:"1.25rem",borderBottom:"2px solid #F47B20",flexWrap:"wrap",gap:"1rem"}}>
            <div>
              {doc.dealer?.logo && <img src={doc.dealer.logo} alt="" style={{height:"60px",objectFit:"contain",marginBottom:"0.5rem",display:"block"}}/>}
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.5rem",fontWeight:700,letterSpacing:"0.1em",color:"#1A1A1A"}}>{doc.dealer?.companyName||"CARSTRIMS DEALER"}</div>
              {doc.dealer?.address && <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>{[doc.dealer.address,doc.dealer.city,doc.dealer.state].filter(Boolean).join(", ")}</div>}
              {doc.dealer?.phone && <div style={{fontSize:"0.78rem",color:"#737373"}}>📞 {doc.dealer.phone}</div>}
              {doc.dealer?.email && <div style={{fontSize:"0.78rem",color:"#737373"}}>✉ {doc.dealer.email}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"1.6rem",fontWeight:700,color:"#F47B20",letterSpacing:"0.05em"}}>{doc.title?.toUpperCase()}</div>
              <div style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.25rem"}}>{doc.subtitle}</div>
              <div style={{marginTop:"0.75rem",display:"flex",flexDirection:"column",gap:"0.2rem",alignItems:"flex-end"}}>
                <StatusBadge status={doc.status}/>
                <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.25rem"}}>No: <strong>{doc.documentNumber}</strong></div>
                <div style={{fontSize:"0.75rem",color:"#737373"}}>Date: <strong>{fmtD(doc.issuedAt)}</strong></div>
                {doc.dueDate && <div style={{fontSize:"0.75rem",color:"#DC2626"}}>Due: <strong>{fmtD(doc.dueDate)}</strong></div>}
                {doc.validUntil && <div style={{fontSize:"0.75rem",color:"#D97706"}}>Valid until: <strong>{fmtD(doc.validUntil)}</strong></div>}
              </div>
            </div>
          </div>

          {/* Buyer / Billed To */}
          {doc.buyer?.name && (
            <div style={{marginBottom:"1.25rem",padding:"1rem",background:"#F5F5F5",borderRadius:"8px"}}>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.4rem"}}>Billed To</div>
              <div style={{fontSize:"0.95rem",fontWeight:700,color:"#1A1A1A"}}>{doc.buyer.name}</div>
              {doc.buyer.phone && <div style={{fontSize:"0.8rem",color:"#737373"}}>📞 {doc.buyer.phone}</div>}
              {doc.buyer.email && <div style={{fontSize:"0.8rem",color:"#737373"}}>✉ {doc.buyer.email}</div>}
            </div>
          )}

          {/* Vehicle Details */}
          <div style={{marginBottom:"1.25rem",padding:"1rem",background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.2)",borderRadius:"8px",display:"flex",gap:"1rem",alignItems:"center"}}>
            {doc.car?.image && <img src={doc.car.image} alt="" style={{width:"80px",height:"60px",objectFit:"cover",borderRadius:"6px",flexShrink:0}}/>}
            <div>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.3rem"}}>Vehicle Details</div>
              <div style={{fontSize:"1rem",fontWeight:700,color:"#1A1A1A"}}>{doc.car?.brand} {doc.car?.model} {doc.car?.year}</div>
              <div style={{fontSize:"0.78rem",color:"#737373"}}>{[doc.car?.color,doc.car?.transmission,doc.car?.condition].filter(Boolean).join(" · ")}</div>
              {doc.car?.vin && <div style={{fontSize:"0.72rem",color:"#A3A3A3",fontFamily:"monospace"}}>VIN: {doc.car.vin}</div>}
              <div style={{fontSize:"0.72rem",color:"#A3A3A3",fontFamily:"monospace"}}>Car ID: {doc.car?.carId}</div>
            </div>
          </div>

          {/* Line Items */}
          {doc.lineItems && doc.lineItems.length > 0 && (
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"1.25rem",fontSize:"0.875rem"}}>
              <thead>
                <tr style={{background:"#1A1A1A",color:"#fff"}}>
                  {["Description","Qty","Unit Price","Total"].map(h=>(
                    <th key={h} style={{padding:"0.625rem 0.875rem",textAlign:h==="Description"?"left":"right",fontSize:"0.72rem",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.lineItems.map((item: any, i: number) => (
                  <tr key={i} style={{borderBottom:"1px solid #E5E5E5",background:i%2===0?"#fff":"#FAFAFA"}}>
                    <td style={{padding:"0.625rem 0.875rem"}}>{item.description}</td>
                    <td style={{padding:"0.625rem 0.875rem",textAlign:"right"}}>{item.quantity}</td>
                    <td style={{padding:"0.625rem 0.875rem",textAlign:"right"}}>{fmt(item.unitPrice)}</td>
                    <td style={{padding:"0.625rem 0.875rem",textAlign:"right",fontWeight:600,color:"#F47B20"}}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          {doc.financials && (
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"1.5rem"}}>
              <div style={{width:"260px",display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                {doc.financials.subtotal!==undefined && (
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem",color:"#737373"}}>
                    <span>Subtotal</span><span>{fmt(doc.financials.subtotal)}</span>
                  </div>
                )}
                {doc.financials.discount>0 && (
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem",color:"#16A34A"}}>
                    <span>Discount</span><span>- {fmt(doc.financials.discount)}</span>
                  </div>
                )}
                {doc.financials.vatAmount>0 && (
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem",color:"#737373"}}>
                    <span>VAT ({((doc.financials.vatRate||0)*100).toFixed(1)}%)</span>
                    <span>{fmt(doc.financials.vatAmount)}</span>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"1.1rem",fontWeight:700,color:"#1A1A1A",borderTop:"2px solid #1A1A1A",paddingTop:"0.5rem",marginTop:"0.25rem"}}>
                  <span>{doc.documentType==="RECEIPT"?"Amount Paid":"Total Due"}</span>
                  <span style={{color:"#F47B20",fontFamily:"Georgia,serif"}}>{fmt(doc.financials.total||doc.financials.amountPaid||0)}</span>
                </div>
                {doc.documentType==="RECEIPT" && (
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",color:"#16A34A",fontWeight:600}}>
                    <span>Balance Due</span><span>{fmt(0)} — PAID IN FULL</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receipt transaction info */}
          {doc.transaction && (
            <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"1rem",marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#15803D",marginBottom:"0.5rem"}}>Payment Received</div>
              <div style={{fontSize:"0.875rem",color:"#15803D",fontWeight:600}}>✅ {fmt(doc.transaction.amountPaid)} — {doc.transaction.paymentMethod?.replace(/_/g," ").toUpperCase()}</div>
              <div style={{fontSize:"0.75rem",color:"#737373",fontFamily:"monospace",marginTop:"0.25rem"}}>Ref: {doc.transaction.transactionId}</div>
            </div>
          )}

          {/* Notes / Legal / Confirmation */}
          {(doc.notes||doc.paymentInstructions||doc.confirmation) && (
            <div style={{fontSize:"0.78rem",color:"#737373",lineHeight:1.6,marginBottom:"1.25rem",padding:"0.875rem",background:"#F5F5F5",borderRadius:"8px"}}>
              {doc.confirmation && <p style={{color:"#1A1A1A",fontWeight:500,marginBottom:"0.5rem"}}>{doc.confirmation}</p>}
              {doc.paymentInstructions && <p style={{marginBottom:"0.5rem"}}>{doc.paymentInstructions}</p>}
              {doc.notes && <p style={{marginBottom:"0.25rem"}}><em>Notes: {doc.notes}</em></p>}
            </div>
          )}

          {doc.legalNote && (
            <div style={{fontSize:"0.72rem",color:"#A3A3A3",lineHeight:1.5,marginBottom:"1.25rem",padding:"0.75rem",borderLeft:"3px solid #E5E5E5"}}>
              ⚖ {doc.legalNote}
            </div>
          )}

          {/* Signature area */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem",marginTop:"2rem",paddingTop:"1.25rem",borderTop:"1px solid #E5E5E5"}}>
            <div>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.5rem"}}>Issued By</div>
              {doc.dealer?.signature
                ? <img src={doc.dealer.signature} alt="Signature" style={{height:"50px",objectFit:"contain",display:"block",marginBottom:"4px"}}/>
                : <div style={{height:"40px",borderBottom:"1px solid #1A1A1A",marginBottom:"4px"}}/>
              }
              <div style={{fontSize:"0.78rem",color:"#1A1A1A",fontWeight:600}}>{doc.dealer?.companyName}</div>
              <div style={{fontSize:"0.7rem",color:"#737373"}}>Authorised Signatory</div>
            </div>
            <div>
              <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.5rem"}}>Customer Acknowledgement</div>
              <div style={{height:"40px",borderBottom:"1px solid #1A1A1A",marginBottom:"4px"}}/>
              <div style={{fontSize:"0.7rem",color:"#737373"}}>Signature & Date</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{textAlign:"center",marginTop:"1.5rem",paddingTop:"1rem",borderTop:"1px solid #E5E5E5",fontSize:"0.65rem",color:"#A3A3A3",letterSpacing:"0.08em"}}>
            {doc.footer || "Powered by CARSTRIMS · Built by UASE TECH STUDIO"}
          </div>
        </div>
      </div>
    </div>
  );
}
