"use client";
import { useRef, useState } from "react";

interface Props { doc: any; onClose: () => void; }

const fmtN = (n: number) => `NGN ${(n||0).toLocaleString()}`;
const fmtD = (iso: any) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}); }
  catch { return String(iso); }
};

const DOC_TITLES: Record<string,string> = {
  PROFORMA_INVOICE: "PROFORMA INVOICE",
  STANDARD_INVOICE: "CASH INVOICE",
  RECEIPT:          "RECEIPT",
  VEHICLE_SALES_RECEIPT: "VEHICLE SALES RECEIPT",
  CASH_INVOICE:     "CASH INVOICE",
};

export default function DocumentViewer({ doc: initialDoc, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // Two-step: "view" = preview, "edit" = edit fields before printing
  const [step, setStep] = useState<"view"|"edit">("view");

  // Editable fields state - mirrors the document structure
  const [fields, setFields] = useState({
    // Buyer
    buyerName:    initialDoc?.buyer?.name    || "",
    buyerPhone:   initialDoc?.buyer?.phone   || "",
    buyerEmail:   initialDoc?.buyer?.email   || "",
    buyerAddress: initialDoc?.buyer?.address || "",
    // Vehicle
    carBrand:     initialDoc?.car?.brand     || "",
    carModel:     initialDoc?.car?.model     || "",
    carYear:      String(initialDoc?.car?.year || ""),
    carColor:     initialDoc?.car?.color     || "",
    carVin:       initialDoc?.car?.vin       || "",
    carCondition: initialDoc?.car?.condition || "",
    // Document meta
    docNumber:    initialDoc?.documentNumber || "",
    docDate:      initialDoc?.issuedAt?.split("T")[0] || "",
    dueDate:      initialDoc?.dueDate?.split("T")[0]  || "",
    // Financial
    amount:       String(initialDoc?.financials?.total || initialDoc?.financials?.amountPaid || initialDoc?.transaction?.amountPaid || ""),
    paymentMethod:initialDoc?.financials?.paymentMethod || initialDoc?.transaction?.paymentMethod || "cash",
    paymentType:  initialDoc?.buyer?.paymentType || "full",
    // Dealer
    dealerName:   initialDoc?.dealer?.companyName || "",
    dealerAddress:initialDoc?.dealer?.address     || "",
    dealerPhone:  initialDoc?.dealer?.phone       || "",
    // Extra
    notes:        initialDoc?.notes || "",
    lpo:          "",
  });

  // Build the live doc merging initialDoc with editable fields
  const liveDoc = {
    ...initialDoc,
    documentNumber: fields.docNumber,
    issuedAt:       fields.docDate ? fields.docDate + "T00:00:00Z" : initialDoc?.issuedAt,
    dueDate:        fields.dueDate ? fields.dueDate + "T00:00:00Z" : initialDoc?.dueDate,
    notes:          fields.notes,
    buyer: {
      ...initialDoc?.buyer,
      name:        fields.buyerName,
      phone:       fields.buyerPhone,
      email:       fields.buyerEmail,
      address:     fields.buyerAddress,
      paymentType: fields.paymentType,
    },
    car: {
      ...initialDoc?.car,
      brand:     fields.carBrand,
      model:     fields.carModel,
      year:      fields.carYear,
      color:     fields.carColor,
      vin:       fields.carVin,
      condition: fields.carCondition,
    },
    dealer: {
      ...initialDoc?.dealer,
      companyName: fields.dealerName,
      address:     fields.dealerAddress,
      phone:       fields.dealerPhone,
    },
    financials: {
      ...initialDoc?.financials,
      total:       parseFloat(fields.amount) || 0,
      amountPaid:  parseFloat(fields.amount) || 0,
      paymentMethod: fields.paymentMethod,
    },
    transaction: initialDoc?.transaction ? {
      ...initialDoc.transaction,
      paymentMethod: fields.paymentMethod,
      amountPaid:    parseFloat(fields.amount) || 0,
    } : undefined,
  };

  const docTitle = DOC_TITLES[liveDoc.documentType] || liveDoc.title?.toUpperCase() || "DOCUMENT";
  const installments = liveDoc.buyer?.installmentPlan?.installments || 
                       (Array.isArray(liveDoc.buyer?.installmentPlan) ? liveDoc.buyer.installmentPlan : null);

  //  Print 
  const handlePrint = () => {
    const d = liveDoc;
    const rcNum = fields.docNumber || d.documentNumber || "";
    const totalAmt = parseFloat(fields.amount) || d.financials?.total || d.financials?.amountPaid || 0;
    const isReceipt = d.documentType === "RECEIPT" || d.documentType === "VEHICLE_SALES_RECEIPT";
    const isProforma= d.documentType === "PROFORMA_INVOICE";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${docTitle} ${rcNum}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Arial",sans-serif;padding:28px 32px;color:#1A1A1A;max-width:760px;margin:0 auto;font-size:12px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #F47B20;padding-bottom:14px;margin-bottom:18px;gap:12px}
  .logo{max-height:68px;max-width:200px;object-fit:contain;display:block;margin-bottom:6px}
  .dealer-name{font-size:17px;font-weight:700;color:#1A1A1A;margin-bottom:2px}
  .dealer-sub{font-size:9px;color:#737373;line-height:1.5}
  .doc-title{font-size:24px;font-weight:700;color:#F47B20;letter-spacing:0.06em;text-align:right}
  .doc-sub{font-size:9px;color:#D97706;text-align:right;margin-top:2px}
  .doc-meta{font-size:9px;color:#737373;text-align:right;line-height:1.7;margin-top:6px}
  .doc-meta strong{color:#1A1A1A}
  .bill-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
  .bill-box{background:#F5F5F5;border-radius:6px;padding:11px}
  .bill-label{font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A3A3A3;margin-bottom:5px}
  .bill-name{font-size:13px;font-weight:700;color:#1A1A1A;margin-bottom:2px}
  .bill-sub{font-size:10px;color:#737373;line-height:1.6}
  .veh{display:flex;gap:12px;align-items:flex-start;background:#FFF7ED;border:1px solid rgba(244,123,32,0.2);border-radius:7px;padding:11px;margin-bottom:16px}
  .veh-img{width:88px;height:66px;object-fit:cover;border-radius:5px;border:1px solid rgba(244,123,32,0.2);flex-shrink:0}
  .veh-title-label{font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#F47B20;margin-bottom:3px}
  .veh-name{font-size:14px;font-weight:700;color:#1A1A1A}
  .veh-sub{font-size:9px;color:#737373;margin-top:2px}
  .veh-vin{font-size:8px;color:#A3A3A3;font-family:monospace;margin-top:3px}
  table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px}
  th{background:#1A1A1A;color:#fff;padding:7px 10px;text-align:left;font-size:8px;letter-spacing:0.06em;font-weight:600}
  th.r,td.r{text-align:right}
  td{padding:7px 10px;border-bottom:1px solid #EEEEEE}
  tr:nth-child(even) td{background:#FAFAFA}
  .tfoot-row{display:flex;justify-content:space-between;font-size:10px;color:#737373;padding:2px 0}
  .tfoot-final{display:flex;justify-content:space-between;font-size:14px;font-weight:700;border-top:2px solid #1A1A1A;padding-top:5px;margin-top:3px}
  .pay-box{background:#F0FDF4;border:1px solid #86EFAC;border-radius:5px;padding:9px 11px;margin-bottom:14px;display:flex;gap:20px;flex-wrap:wrap;font-size:10px}
  .pay-label{font-size:8px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#A3A3A3;margin-bottom:2px}
  .inst-hdr{font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#D97706;margin-bottom:7px;border-bottom:1px solid #FDE68A;padding-bottom:3px}
  .inst-table th{background:#D97706}
  .conf-box{background:#F0FDF4;border:1px solid #86EFAC;border-radius:5px;padding:11px;margin-bottom:14px;font-size:10px;color:#15803D;line-height:1.5}
  .terms{font-size:8px;color:#737373;border-left:2px solid #F47B20;padding-left:7px;margin-bottom:14px;line-height:1.6}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:22px;border-top:1px solid #E5E5E5;padding-top:14px}
  .sig-label{font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A3A3A3;margin-bottom:7px}
  .sig-line{height:38px;border-bottom:1px solid #1A1A1A;margin-bottom:4px}
  .sig-name{font-size:10px;font-weight:700;color:#1A1A1A}
  .sig-sub{font-size:8px;color:#737373}
  .sig-img{max-height:52px;max-width:180px;object-fit:contain;display:block;mix-blend-mode:multiply;margin-bottom:4px}
  .footer{text-align:center;margin-top:22px;padding-top:11px;border-top:1px solid #E5E5E5;font-size:7px;color:#A3A3A3;letter-spacing:0.08em}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:8px;font-weight:700;letter-spacing:0.06em;margin-top:4px}
  .badge-paid{background:#F0FDF4;color:#15803D;border:1px solid #86EFAC}
  .badge-invoice{background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE}
  .badge-quote{background:#FFF7ED;color:#D97706;border:1px solid #FDE68A}
  @media print{@page{margin:0.8cm}body{padding:0}}
  /* Vehicle Sales Receipt style */
  .vsr-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
  .vsr-row{display:flex;flex-direction:column;gap:1px}
  .vsr-lbl{font-size:8px;text-transform:uppercase;letter-spacing:0.06em;color:#A3A3A3;font-weight:700}
  .vsr-val{font-size:11px;color:#1A1A1A;font-weight:600;border-bottom:1px solid #D4D4D4;padding-bottom:2px}
  .check-row{display:flex;align-items:center;gap:16px;font-size:10px;color:#1A1A1A;margin-bottom:8px}
  .check-box{width:12px;height:12px;border:1.5px solid #1A1A1A;display:inline-block;margin-right:4px;vertical-align:middle}
  .check-box.checked{background:#1A1A1A}
</style></head><body>

<div class="hdr">
  <div>
    ${d.dealer?.logo ? `<img src="${d.dealer.logo}" class="logo" alt="Logo"/>` : ""}
    <div class="dealer-name">${fields.dealerName || d.dealer?.companyName || "CARSTRIMS"}</div>
    ${[fields.dealerAddress, d.dealer?.city, d.dealer?.state].filter(Boolean).map(v=>`<div class="dealer-sub">${v}</div>`).join("")}
    ${fields.dealerPhone ? `<div class="dealer-sub">Tel: ${fields.dealerPhone}</div>` : ""}
    ${d.dealer?.email  ? `<div class="dealer-sub">${d.dealer.email}</div>` : ""}
    ${d.dealer?.website? `<div class="dealer-sub">${d.dealer.website}</div>` : ""}
  </div>
  <div>
    <div class="doc-title">${docTitle}</div>
    ${isProforma ? `<div class="doc-sub">Formal Quote  Not a Demand for Payment</div>` : ""}
    <div class="doc-meta">
      No: <strong>${rcNum}</strong><br/>
      Date: <strong>${fmtD(fields.docDate + "T00:00:00Z") || fmtD(d.issuedAt)}</strong>
      ${fields.dueDate ? `<br/>Due: <strong style="color:#DC2626">${fmtD(fields.dueDate + "T00:00:00Z")}</strong>` : ""}
      ${fields.lpo ? `<br/>L.P.O No: <strong>${fields.lpo}</strong>` : ""}
    </div>
    <span class="badge ${isReceipt?"badge-paid":isProforma?"badge-quote":"badge-invoice"}">
      ${isReceipt?"PAID  RECEIPT":isProforma?"PROFORMA QUOTE":"INVOICE"}
    </span>
  </div>
</div>

<!-- Bill From / Bill To -->
<div class="bill-grid">
  <div class="bill-box">
    <div class="bill-label">Bill From (Seller)</div>
    <div class="bill-name">${fields.dealerName || d.dealer?.companyName || ""}</div>
    <div class="bill-sub">${fields.dealerAddress || d.dealer?.address || ""}</div>
    ${fields.dealerPhone ? `<div class="bill-sub">Tel: ${fields.dealerPhone}</div>` : ""}
  </div>
  <div class="bill-box">
    <div class="bill-label">Bill To (Customer)</div>
    <div class="bill-name">${fields.buyerName || ""}</div>
    ${fields.buyerAddress ? `<div class="bill-sub">${fields.buyerAddress}</div>` : ""}
    ${fields.buyerPhone   ? `<div class="bill-sub">Tel: ${fields.buyerPhone}</div>` : ""}
    ${fields.buyerEmail   ? `<div class="bill-sub">${fields.buyerEmail}</div>` : ""}
  </div>
</div>

<!-- Vehicle -->
<div class="veh">
  ${d.car?.image ? `<img src="${d.car.image}" class="veh-img" alt="Vehicle"/>` : ""}
  <div>
    <div class="veh-title-label">Vehicle Details</div>
    <div class="veh-name">${fields.carBrand} ${fields.carModel} ${fields.carYear}</div>
    <div class="veh-sub">${[fields.carColor, fields.carCondition, d.car?.transmission, d.car?.fuelType].filter(Boolean).join("  ")}</div>
    ${fields.carVin ? `<div class="veh-vin">Chassis/VIN: ${fields.carVin}</div>` : ""}
    <div class="veh-vin">Car ID: ${d.car?.carId || ""}</div>
  </div>
</div>

<!-- Line items -->
${d.lineItems?.length ? `
<table>
  <thead><tr>
    <th>Description</th>
    <th class="r">Qty</th>
    <th class="r">Unit Price (NGN)</th>
    <th class="r">Total (NGN)</th>
  </tr></thead>
  <tbody>
    ${d.lineItems.map((item:any,i:number)=>`
    <tr>
      <td>${item.description || ""}</td>
      <td class="r">${item.quantity || 1}</td>
      <td class="r">${fmtN(item.unitPrice)}</td>
      <td class="r" style="font-weight:700;color:#F47B20">${fmtN(item.total)}</td>
    </tr>`).join("")}
  </tbody>
</table>
<div style="display:flex;justify-content:flex-end;margin-bottom:14px">
  <div style="width:280px">
    ${d.financials?.subtotal != null ? `<div class="tfoot-row"><span>Subtotal</span><span>${fmtN(d.financials.subtotal)}</span></div>` : ""}
    ${d.financials?.vatAmount ? `<div class="tfoot-row"><span>VAT (${((d.financials.vatRate||0)*100).toFixed(1)}%)</span><span>${fmtN(d.financials.vatAmount)}</span></div>` : ""}
    <div class="tfoot-final"><span>${isReceipt?"Amount Paid":"Total Due"}</span><span style="color:#F47B20">${fmtN(totalAmt)}</span></div>
    ${isReceipt ? `<div class="tfoot-row" style="color:#16A34A;font-weight:600"><span>Balance Due</span><span>NGN 0  PAID IN FULL</span></div>` : ""}
  </div>
</div>` : `
<!-- Simple amount row for receipt without line items -->
<div style="text-align:right;margin-bottom:16px;padding:10px 0;border-top:1px solid #E5E5E5;border-bottom:1px solid #E5E5E5">
  <span style="font-size:11px;color:#737373">${isReceipt?"Amount Paid":"Total Due"}: </span>
  <span style="font-size:16px;font-weight:700;color:#F47B20">${fmtN(totalAmt)}</span>
</div>`}

<!-- Vehicle Sales Receipt layout (extra fields) -->
${d.documentType === "VEHICLE_SALES_RECEIPT" || d.documentType === "RECEIPT" ? `
<div class="vsr-grid">
  <div class="vsr-row"><div class="vsr-lbl">Seller</div><div class="vsr-val">${fields.dealerName || ""}</div></div>
  <div class="vsr-row"><div class="vsr-lbl">Buyer</div><div class="vsr-val">${fields.buyerName || ""}</div></div>
  <div class="vsr-row"><div class="vsr-lbl">Make</div><div class="vsr-val">${fields.carBrand || ""}</div></div>
  <div class="vsr-row"><div class="vsr-lbl">Model</div><div class="vsr-val">${fields.carModel || ""}</div></div>
  <div class="vsr-row"><div class="vsr-lbl">Colour</div><div class="vsr-val">${fields.carColor || ""}</div></div>
  <div class="vsr-row"><div class="vsr-lbl">Year</div><div class="vsr-val">${fields.carYear || ""}</div></div>
  <div class="vsr-row" style="grid-column:1/-1"><div class="vsr-lbl">Chassis Number</div><div class="vsr-val">${fields.carVin || ""}</div></div>
</div>
<div style="margin-bottom:10px;font-size:10px">
  Amount Paid: <strong>${fmtN(totalAmt)}</strong> &nbsp; Paid as: 
  <span class="check-box ${fields.paymentType==="full"?"checked":""}"></span> Full &nbsp;
  <span class="check-box ${fields.paymentType==="installment"?"checked":""}"></span> Instalment by: ${fields.paymentType==="installment"?String(installments?.length||""):""} payments
</div>
<div class="check-row">
  Payment Type:
  <span><span class="check-box ${fields.paymentMethod==="cash"?"checked":""}"></span> Cash</span>
  <span><span class="check-box ${fields.paymentMethod==="card"?"checked":""}"></span> Card</span>
  <span><span class="check-box ${fields.paymentMethod==="transfer"?"checked":""}"></span> Transfer</span>
  <span><span class="check-box ${fields.paymentMethod==="cheque"?"checked":""}"></span> Cheque</span>
  ${fields.paymentMethod==="cheque"?`&nbsp; Cheque No: ____________`:""}
</div>` : ""}

<!-- Payment info -->
<div class="pay-box">
  <div><div class="pay-label">Payment Type</div><strong style="text-transform:capitalize">${fields.paymentType || "Full"}</strong></div>
  <div><div class="pay-label">Payment Method</div><strong style="text-transform:capitalize">${fields.paymentMethod?.replace(/_/g," ") || "Cash"}</strong></div>
  ${d.transaction?.transactionId ? `<div><div class="pay-label">Transaction Ref</div><span style="font-family:monospace">${d.transaction.transactionId}</span></div>` : ""}
</div>

<!-- Installments -->
${installments?.length ? `
<div style="margin-bottom:14px">
  <div class="inst-hdr">Installment Payment Schedule</div>
  <table class="inst-table">
    <thead><tr>
      <th>#</th><th>Description</th><th class="r">Amount (NGN)</th><th>Due Date</th><th>Status</th>
    </tr></thead>
    <tbody>
      ${installments.map((inst:any,i:number)=>`
      <tr style="background:${i%2===0?"#FFFBEB":"#FFF7D6"}">
        <td>${i+1}</td>
        <td>${inst.label || `Installment ${i+1}`}</td>
        <td class="r" style="font-weight:600">${fmtN(inst.amount||0)}</td>
        <td>${inst.dueDate || "TBD"}</td>
        <td style="font-weight:700;color:${inst.paid?"#16A34A":"#D97706"}">${inst.paid?"PAID":"PENDING"}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>` : ""}

<!-- Receipt confirmation -->
${isReceipt ? `
<div class="conf-box">
  <div style="font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Payment Confirmed</div>
  <strong>Received in full  ${fields.paymentMethod?.replace(/_/g," ").toUpperCase() || "CASH"}</strong>
  ${d.transaction?.transactionId ? `<div style="font-family:monospace;font-size:8px;color:#737373;margin-top:2px">Ref: ${d.transaction.transactionId}</div>` : ""}
  <div style="font-style:italic;margin-top:6px;font-size:10px">Signed, Sealed and Delivered</div>
</div>` : ""}

<!-- Notes -->
${fields.notes ? `<div style="background:#F5F5F5;border-radius:5px;padding:9px 11px;font-size:9px;color:#737373;margin-bottom:14px;line-height:1.6"><em>Notes: ${fields.notes}</em></div>` : ""}

<!-- Terms -->
<div class="terms">
  This invoice is valid for 7 calendar days from the date it was signed.
  Goods sold in good condition are returnable. No refund of money after payment.
  Thanks for your patronage  Please call again.
</div>

<!-- Signatures -->
<div class="sig-grid">
  <div>
    <div class="sig-label">Seller Signature / Manager's Signature</div>
    ${d.dealer?.signature ? `<img src="${d.dealer.signature}" class="sig-img" alt="Signature"/>` : `<div class="sig-line"></div>`}
    <div class="sig-name">${fields.dealerName || d.dealer?.companyName || ""}</div>
    <div class="sig-sub">Authorised Signatory</div>
  </div>
  <div>
    <div class="sig-label">Buyer Signature / Customer's Signature</div>
    <div class="sig-line"></div>
    <div class="sig-sub">Signature &amp; Date</div>
  </div>
</div>

<div class="footer">
  ${d.dealer?.companyName || "CARSTRIMS"} &nbsp;|&nbsp;
  RC: 7753519 &nbsp;|&nbsp;
  108B Muhammadu Buhari Way Central Business District, Abuja &nbsp;|&nbsp;
  0806 520 6576 &nbsp;|&nbsp;
  Powered by CARSTRIMS  UASE TECH STUDIO
</div>

<script>window.onload=()=>window.print()<\/script>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  //  Input field component 
  const fi: React.CSSProperties = {
    width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5",
    borderRadius:"6px", padding:"0.55rem 0.75rem", fontSize:"0.875rem",
    fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box",
    transition:"border-color 0.2s",
  };
  const lbl: React.CSSProperties = {
    fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em",
    textTransform:"uppercase", color:"#525252", display:"block", marginBottom:"0.3rem",
  };
  const onFocus = (e: React.FocusEvent<any>) => e.target.style.borderColor="#F47B20";
  const onBlur  = (e: React.FocusEvent<any>) => e.target.style.borderColor="#E5E5E5";

  const F = ({label,k,type="text",placeholder=""}:{label:string;k:keyof typeof fields;type?:string;placeholder?:string}) => (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} style={fi} value={fields[k]} placeholder={placeholder}
        onChange={e=>setFields(f=>({...f,[k]:e.target.value}))}
        onFocus={onFocus} onBlur={onBlur}/>
    </div>
  );

  const docTitle2 = DOC_TITLES[initialDoc?.documentType] || initialDoc?.title?.toUpperCase() || "DOCUMENT";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9000,overflowY:"auto",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:"820px",margin:"auto",background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.35)"}}>

        {/*  Toolbar  */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1.25rem",background:"#1A1A1A",gap:"0.5rem",flexWrap:"wrap"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.1em",color:"#F47B20"}}>{docTitle2}</div>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}>
            {/* Step tabs */}
            <div style={{display:"flex",background:"rgba(255,255,255,0.1)",borderRadius:"7px",padding:"2px",gap:"2px"}}>
              <button onClick={()=>setStep("view")}
                style={{background:step==="view"?"#F47B20":"transparent",color:"#fff",border:"none",borderRadius:"5px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:step==="view"?700:400,fontFamily:"var(--font-display)",letterSpacing:"0.06em"}}>
                Preview
              </button>
              <button onClick={()=>setStep("edit")}
                style={{background:step==="edit"?"#F47B20":"transparent",color:"#fff",border:"none",borderRadius:"5px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:step==="edit"?700:400,fontFamily:"var(--font-display)",letterSpacing:"0.06em"}}>
                Edit Fields
              </button>
            </div>
            <button onClick={handlePrint}
              style={{background:"#16A34A",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:700}}>
              Print / Export PDF
            </button>
            <button onClick={onClose}
              style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.875rem",cursor:"pointer"}}>
              X
            </button>
          </div>
        </div>

        {/*  Step hint bar  */}
        {step === "edit" && (
          <div style={{background:"#FFF7ED",borderBottom:"1px solid rgba(244,123,32,0.3)",padding:"0.625rem 1.25rem",fontSize:"0.78rem",color:"#C4621A",fontWeight:500}}>
            Edit any field below, then click <strong>Print / Export PDF</strong> to generate the final document.
          </div>
        )}
        {step === "view" && (
          <div style={{background:"#EFF6FF",borderBottom:"1px solid #BFDBFE",padding:"0.625rem 1.25rem",fontSize:"0.78rem",color:"#1D4ED8",fontWeight:500}}>
            Preview mode  click <strong>Edit Fields</strong> to change customer details, amounts, or any info before printing.
          </div>
        )}

        {/*  PREVIEW TAB  */}
        {step === "view" && (
          <div ref={printRef} style={{padding:"2rem 2.5rem",fontFamily:"Arial,sans-serif",color:"#1A1A1A",fontSize:"13px",maxHeight:"80vh",overflowY:"auto"}}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"3px solid #F47B20",paddingBottom:"14px",marginBottom:"18px",gap:"12px",flexWrap:"wrap"}}>
              <div>
                {liveDoc.dealer?.logo && <img src={liveDoc.dealer.logo} alt="" style={{display:"block",maxHeight:"68px",maxWidth:"200px",objectFit:"contain",marginBottom:"6px"}}/>}
                <div style={{fontSize:"18px",fontWeight:700,color:"#1A1A1A"}}>{fields.dealerName || liveDoc.dealer?.companyName}</div>
                {[fields.dealerAddress, liveDoc.dealer?.city, liveDoc.dealer?.state].filter(Boolean).map((v,i)=>(
                  <div key={i} style={{fontSize:"10px",color:"#737373"}}>{v}</div>
                ))}
                {fields.dealerPhone && <div style={{fontSize:"10px",color:"#737373"}}>Tel: {fields.dealerPhone}</div>}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"24px",fontWeight:700,color:"#F47B20",letterSpacing:"0.06em"}}>{docTitle2}</div>
                <div style={{fontSize:"10px",color:"#737373",marginTop:"6px",lineHeight:1.7}}>
                  No: <strong style={{fontFamily:"monospace"}}>{fields.docNumber}</strong><br/>
                  Date: <strong>{fmtD((fields.docDate||"")+"T00:00:00Z") || fmtD(liveDoc.issuedAt)}</strong>
                  {fields.dueDate && <><br/>Due: <strong style={{color:"#DC2626"}}>{fmtD(fields.dueDate+"T00:00:00Z")}</strong></>}
                  {fields.lpo && <><br/>L.P.O No: <strong>{fields.lpo}</strong></>}
                </div>
              </div>
            </div>

            {/* Bill From / Bill To */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"16px"}}>
              <div style={{background:"#F5F5F5",borderRadius:"6px",padding:"11px"}}>
                <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"5px"}}>Bill From (Seller)</div>
                <div style={{fontSize:"13px",fontWeight:700,color:"#1A1A1A"}}>{fields.dealerName}</div>
                <div style={{fontSize:"10px",color:"#737373",marginTop:"2px"}}>{fields.dealerAddress}</div>
                <div style={{fontSize:"10px",color:"#737373"}}>Tel: {fields.dealerPhone}</div>
              </div>
              <div style={{background:"#F5F5F5",borderRadius:"6px",padding:"11px"}}>
                <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"5px"}}>Bill To (Customer)</div>
                <div style={{fontSize:"13px",fontWeight:700,color:fields.buyerName?"#1A1A1A":"#A3A3A3"}}>{fields.buyerName || "Customer name not set"}</div>
                <div style={{fontSize:"10px",color:fields.buyerAddress?"#737373":"#FECACA",marginTop:"2px"}}>{fields.buyerAddress || "Address not set"}</div>
                {fields.buyerPhone && <div style={{fontSize:"10px",color:"#737373"}}>Tel: {fields.buyerPhone}</div>}
                {fields.buyerEmail && <div style={{fontSize:"10px",color:"#737373"}}>{fields.buyerEmail}</div>}
              </div>
            </div>

            {/* Vehicle */}
            <div style={{display:"flex",gap:"12px",alignItems:"flex-start",background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.2)",borderRadius:"7px",padding:"11px",marginBottom:"16px"}}>
              {liveDoc.car?.image && <img src={liveDoc.car.image} alt="" style={{width:"88px",height:"66px",objectFit:"cover",borderRadius:"5px",flexShrink:0}}/>}
              <div>
                <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#F47B20",marginBottom:"3px"}}>Vehicle Details</div>
                <div style={{fontSize:"15px",fontWeight:700,color:"#1A1A1A"}}>{fields.carBrand} {fields.carModel} {fields.carYear}</div>
                <div style={{fontSize:"9px",color:"#737373",marginTop:"2px"}}>{[fields.carColor,fields.carCondition,liveDoc.car?.transmission,liveDoc.car?.fuelType].filter(Boolean).join("  ")}</div>
                {fields.carVin && <div style={{fontSize:"8px",color:"#A3A3A3",fontFamily:"monospace",marginTop:"3px"}}>Chassis/VIN: {fields.carVin}</div>}
                <div style={{fontSize:"8px",color:"#A3A3A3",fontFamily:"monospace"}}>Car ID: {liveDoc.car?.carId}</div>
              </div>
            </div>

            {/* Amount */}
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"14px"}}>
              <div style={{width:"280px",borderTop:"2px solid #1A1A1A",paddingTop:"6px",display:"flex",justifyContent:"space-between",fontSize:"15px",fontWeight:700}}>
                <span>{liveDoc.documentType==="RECEIPT"?"Amount Paid":"Total Due"}</span>
                <span style={{color:"#F47B20"}}>{fmtN(parseFloat(fields.amount)||0)}</span>
              </div>
            </div>

            {/* Payment */}
            <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"5px",padding:"9px 11px",marginBottom:"14px",display:"flex",gap:"20px",flexWrap:"wrap",fontSize:"10px"}}>
              <div><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"2px"}}>Payment Type</div><strong style={{textTransform:"capitalize" as const}}>{fields.paymentType}</strong></div>
              <div><div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"2px"}}>Method</div><strong style={{textTransform:"capitalize" as const}}>{fields.paymentMethod?.replace(/_/g," ")}</strong></div>
            </div>

            {/* Installments preview */}
            {installments?.length > 0 && (
              <div style={{marginBottom:"14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:"6px",padding:"10px"}}>
                <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#D97706",marginBottom:"7px"}}>Installment Payment Schedule</div>
                {installments.map((inst:any,i:number)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"10px",padding:"4px 0",borderBottom:"1px solid #FDE68A"}}>
                    <span>{inst.label||`Installment ${i+1}`}</span>
                    <span>{fmtN(inst.amount||0)}  {inst.dueDate||"TBD"}</span>
                    <span style={{fontWeight:700,color:inst.paid?"#16A34A":"#D97706"}}>{inst.paid?"PAID":"PENDING"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Terms */}
            <div style={{fontSize:"8px",color:"#737373",borderLeft:"2px solid #F47B20",paddingLeft:"7px",marginBottom:"14px",lineHeight:1.6}}>
              This invoice is valid for 7 calendar days from the date it was signed. Goods sold in good condition are returnable. No refund of money after payment. Thanks for your patronage  Please call again.
            </div>

            {/* Signatures */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"30px",borderTop:"1px solid #E5E5E5",paddingTop:"14px"}}>
              {["Seller Signature","Buyer Signature / Customer's Signature"].map((lbl2,i)=>(
                <div key={i}>
                  <div style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"7px"}}>{lbl2}</div>
                  <div style={{height:"38px",borderBottom:"1px solid #1A1A1A",marginBottom:"4px"}}/>
                  <div style={{fontSize:"8px",color:"#737373"}}>{i===0?fields.dealerName:"Signature & Date"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*  EDIT TAB  */}
        {step === "edit" && (
          <div style={{padding:"1.5rem",overflowY:"auto",maxHeight:"80vh",display:"flex",flexDirection:"column",gap:"1.25rem"}}>

            {/* Customer section */}
            <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
              <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#525252",fontWeight:700,borderBottom:"1px solid #E5E5E5"}}>
                CUSTOMER DETAILS
              </div>
              <div style={{padding:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                <F label="Customer Name"  k="buyerName"    placeholder="Full name"/>
                <F label="Phone Number"   k="buyerPhone"   placeholder="e.g. 0801 234 5678"/>
                <F label="Email Address"  k="buyerEmail"   placeholder="customer@email.com"/>
                <F label="L.P.O Number"   k="lpo"          placeholder="(optional)"/>
                <div style={{gridColumn:"1/-1"}}>
                  <F label="Customer Address" k="buyerAddress" placeholder="Street, City, State"/>
                </div>
              </div>
            </div>

            {/* Vehicle section */}
            <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
              <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#525252",fontWeight:700,borderBottom:"1px solid #E5E5E5"}}>
                VEHICLE DETAILS
              </div>
              <div style={{padding:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                <F label="Brand / Make" k="carBrand" placeholder="e.g. Toyota"/>
                <F label="Model"        k="carModel" placeholder="e.g. Camry"/>
                <F label="Year"         k="carYear"  placeholder="e.g. 2024"/>
                <F label="Colour"       k="carColor" placeholder="e.g. Black"/>
                <div style={{gridColumn:"1/-1"}}>
                  <F label="Chassis / VIN Number" k="carVin" placeholder="Chassis number"/>
                </div>
              </div>
            </div>

            {/* Payment section */}
            <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
              <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#525252",fontWeight:700,borderBottom:"1px solid #E5E5E5"}}>
                PAYMENT DETAILS
              </div>
              <div style={{padding:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                <F label="Amount (NGN)" k="amount" type="number" placeholder="0"/>
                <div>
                  <label style={lbl}>Payment Type</label>
                  <select style={fi} value={fields.paymentType} onChange={e=>setFields(f=>({...f,paymentType:e.target.value}))}>
                    {["full","installment","lease"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Payment Method</label>
                  <select style={fi} value={fields.paymentMethod} onChange={e=>setFields(f=>({...f,paymentMethod:e.target.value}))}>
                    {["cash","card","transfer","cheque","pos"].map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
                  </select>
                </div>
                <F label="Invoice / Document No" k="docNumber" placeholder="e.g. INV-0026"/>
              </div>
            </div>

            {/* Dates section */}
            <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
              <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#525252",fontWeight:700,borderBottom:"1px solid #E5E5E5"}}>
                DATES
              </div>
              <div style={{padding:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                <F label="Invoice Date"    k="docDate" type="date"/>
                <F label="Due Date"        k="dueDate" type="date"/>
              </div>
            </div>

            {/* Dealer section */}
            <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
              <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#525252",fontWeight:700,borderBottom:"1px solid #E5E5E5"}}>
                SELLER / DEALER DETAILS
              </div>
              <div style={{padding:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                <F label="Company Name"  k="dealerName"    placeholder="Dealer name"/>
                <F label="Phone"         k="dealerPhone"   placeholder="Phone number"/>
                <div style={{gridColumn:"1/-1"}}>
                  <F label="Address"       k="dealerAddress" placeholder="Full address"/>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={lbl}>Additional Notes (optional)</label>
              <textarea style={{...fi, minHeight:"72px", resize:"vertical" as const}} value={fields.notes}
                onChange={e=>setFields(f=>({...f,notes:e.target.value}))}
                placeholder="Any additional notes to appear on the document..."/>
            </div>

            {/* Print button at bottom of form */}
            <button onClick={handlePrint}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:"pointer",fontWeight:700}}>
              Print / Export PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}