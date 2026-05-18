"use client";
import { useState, useRef } from "react";
import api from "@/lib/api";

interface Props {
  transactionId: string;
  onClose: () => void;
}

export default function ReceiptGenerator({ transactionId, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"receipt"|"invoice"|"proforma">("receipt");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/api/v1/inventory/sales/${transactionId}/receipt`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  const printOrDownload = () => {
    if (!printRef.current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>CARSTRIMS ${type.toUpperCase()} - ${transactionId}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1A1A1A}
        .receipt{max-width:600px;margin:0 auto;border:1px solid #E5E5E5;border-radius:8px;overflow:hidden}
        @media print{body{padding:0}.no-print{display:none}}
      </style></head><body>
      ${printRef.current.innerHTML}
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    w.document.close();
  };

  const shareReceipt = () => {
    const text = data ? `CARSTRIMS Sale Receipt\n${data.dealer?.name}\n${data.car?.brand} ${data.car?.model} ${data.car?.year}\nSelling Price: ${fmt(data.financials?.sellingPrice)}\nTransaction: ${transactionId}\nBuyer: ${data.buyer?.name || "N/A"}\nDate: ${data.issuedAt ? fmtDate(data.issuedAt) : ""}` : "";
    if (navigator.share) { navigator.share({ title: `CARSTRIMS Receipt ${transactionId}`, text }); }
    else { navigator.clipboard.writeText(text); alert("Receipt details copied to clipboard!"); }
  };

  if (loading) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100}}>
      <div style={{background:"#fff",borderRadius:"12px",padding:"2rem",textAlign:"center"}}>
        <div style={{width:"32px",height:"32px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{marginTop:"1rem",color:"#737373",fontSize:"0.875rem"}}>Loading receipt...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const TITLES = { receipt:"RECEIPT", invoice:"INVOICE", proforma:"PROFORMA INVOICE" };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:"1rem",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"640px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        {/* Controls */}
        <div className="no-print" style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"1rem 1.25rem",borderBottom:"1px solid #E5E5E5",flexWrap:"wrap"}}>
          {(["receipt","invoice","proforma"] as const).map(t=>(
            <button key={t} onClick={()=>setType(t)}
              style={{padding:"0.45rem 0.875rem",borderRadius:"6px",border:"1.5px solid",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",background:type===t?"#F47B20":"#F5F5F5",color:type===t?"#fff":"#525252",borderColor:type===t?"#F47B20":"#E5E5E5",transition:"all 0.15s"}}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button onClick={printOrDownload} style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>🖨 Print / Download PDF</button>
          <button onClick={shareReceipt} style={{background:"#F0FDF4",color:"#16A34A",border:"1.5px solid #86EFAC",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>↗ Share</button>
          <button onClick={onClose} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",cursor:"pointer"}}>✕ Close</button>
        </div>

        {/* Document */}
        <div ref={printRef} style={{padding:"2rem",background:"#fff"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"2rem",borderBottom:"3px solid #F47B20",paddingBottom:"1.25rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
              {data.dealer?.logo && <img src={data.dealer.logo} alt="" style={{width:"60px",height:"60px",objectFit:"cover",borderRadius:"8px"}}/>}
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:"1.3rem",fontWeight:700,color:"#1A1A1A"}}>{data.dealer?.name}</div>
                {data.dealer?.phone && <div style={{fontSize:"0.8rem",color:"#737373"}}>📞 {data.dealer.phone}</div>}
                {data.dealer?.email && <div style={{fontSize:"0.8rem",color:"#737373"}}>✉ {data.dealer.email}</div>}
                {(data.dealer?.city||data.dealer?.state) && <div style={{fontSize:"0.8rem",color:"#737373"}}>📍 {[data.dealer.city,data.dealer.state].filter(Boolean).join(", ")}</div>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.75rem",fontWeight:700,color:"#F47B20",letterSpacing:"0.1em"}}>{TITLES[type]}</div>
              <div style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.25rem"}}>#{data.receiptNumber}</div>
              <div style={{fontSize:"0.8rem",color:"#737373"}}>{data.issuedAt ? fmtDate(data.issuedAt) : ""}</div>
            </div>
          </div>

          {/* Parties */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"1.5rem"}}>
            <div>
              <div style={{fontSize:"0.62rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>From (Seller)</div>
              <div style={{fontSize:"0.875rem",fontWeight:600,color:"#1A1A1A"}}>{data.dealer?.name}</div>
              {data.dealer?.address && <div style={{fontSize:"0.8rem",color:"#737373"}}>{data.dealer.address}</div>}
            </div>
            <div>
              <div style={{fontSize:"0.62rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>To (Buyer)</div>
              <div style={{fontSize:"0.875rem",fontWeight:600,color:"#1A1A1A"}}>{data.buyer?.name || "Cash Buyer"}</div>
              {data.buyer?.phone && <div style={{fontSize:"0.8rem",color:"#737373"}}>{data.buyer.phone}</div>}
              {data.buyer?.email && <div style={{fontSize:"0.8rem",color:"#737373"}}>{data.buyer.email}</div>}
            </div>
          </div>

          {/* Car details */}
          <div style={{background:"#F5F5F5",borderRadius:"10px",padding:"1rem",marginBottom:"1.5rem"}}>
            <div style={{fontSize:"0.62rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.875rem"}}>Vehicle Details</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem"}}>
              {[
                ["Make / Brand", data.car?.brand],
                ["Model", data.car?.model],
                ["Year", data.car?.year],
                ["Color", data.car?.color || "—"],
                ["VIN", data.car?.vin || "—"],
                ["Car ID", data.car?.carId || "—"],
              ].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:"0.62rem",color:"#A3A3A3",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{l}</div>
                  <div style={{fontSize:"0.875rem",fontWeight:600,color:"#1A1A1A"}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Financials table */}
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"1.5rem"}}>
            <thead>
              <tr style={{background:"#1A1A1A",color:"#fff"}}>
                <th style={{padding:"0.625rem 0.875rem",textAlign:"left",fontSize:"0.75rem",fontWeight:600}}>Description</th>
                <th style={{padding:"0.625rem 0.875rem",textAlign:"right",fontSize:"0.75rem",fontWeight:600}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom:"1px solid #E5E5E5"}}>
                <td style={{padding:"0.75rem 0.875rem",fontSize:"0.875rem"}}>
                  {data.car?.brand} {data.car?.model} {data.car?.year}<br/>
                  <span style={{fontSize:"0.75rem",color:"#737373"}}>Payment: {data.financials?.paymentMethod?.replace(/_/g," ") || "Cash"}</span>
                </td>
                <td style={{padding:"0.75rem 0.875rem",textAlign:"right",fontFamily:"Georgia,serif",fontSize:"1.1rem",fontWeight:700,color:"#F47B20"}}>{fmt(data.financials?.sellingPrice)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{background:"#F5F5F5"}}>
                <td style={{padding:"0.875rem",fontWeight:700,fontSize:"0.9rem"}}>TOTAL AMOUNT</td>
                <td style={{padding:"0.875rem",textAlign:"right",fontFamily:"Georgia,serif",fontSize:"1.25rem",fontWeight:700,color:"#F47B20"}}>{fmt(data.financials?.sellingPrice)}</td>
              </tr>
            </tfoot>
          </table>

          {data.financials?.notes && (
            <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.2)",borderRadius:"8px",padding:"0.875rem",marginBottom:"1.5rem"}}>
              <div style={{fontSize:"0.68rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.1em",color:"#A3A3A3",marginBottom:"0.3rem"}}>Notes</div>
              <div style={{fontSize:"0.875rem",color:"#525252"}}>{data.financials.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{borderTop:"2px solid #E5E5E5",paddingTop:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"0.7rem",color:"#A3A3A3"}}>
              This document was generated on {new Date().toLocaleDateString("en-NG")} and is valid as a proof of sale.
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:"0.875rem",color:"#F47B20",letterSpacing:"0.1em",fontWeight:700}}>CARSTRIMS</div>
              <div style={{fontSize:"0.6rem",color:"#D4D4D4",marginTop:"2px"}}>Powered by UASE TECH STUDIO</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

