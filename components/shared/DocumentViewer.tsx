"use client";
import { useState, useRef } from "react";
import FormattedNumberInput from "@/components/ui/FormattedNumberInput";
import CustomSelect from "@/components/ui/CustomSelect";
import { renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, renderElementToPdfBlob, renderElementToJpgBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";
import { parseServerDate } from "@/lib/timeUtils";
import { RECEIPT_DESIGNS, PROFORMA_DESIGNS, BusinessDocData } from "@/components/design-studio/BusinessDocDesigns";

interface Props { doc: any; onClose: () => void; }

const fmtN = (n: number) => `NGN ${(n || 0).toLocaleString()}`;
const fmtD = (iso: any) => {
  if (!iso) return "";
  try { return parseServerDate(iso)?.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) || ""; }
  catch { return ""; }
};
const DOC_TITLES: Record<string, string> = {
  PROFORMA_INVOICE: "PROFORMA INVOICE",
  STANDARD_INVOICE: "CASH INVOICE",
  RECEIPT: "RECEIPT",
  VEHICLE_SALES_RECEIPT: "VEHICLE SALES RECEIPT",
  CASH_INVOICE: "CASH INVOICE",
};

export default function DocumentViewer({ doc: initialDoc, onClose }: Props) {
  const [step, setStep] = useState<"view" | "edit">("view");

  //  Each field is its own useState  NO sub-components, NO object setState 
  const [buyerName,     setBuyerName]     = useState(initialDoc?.buyer?.name    || "");
  const [buyerPhone,    setBuyerPhone]    = useState(initialDoc?.buyer?.phone   || "");
  const [buyerEmail,    setBuyerEmail]    = useState(initialDoc?.buyer?.email   || "");
  const [buyerAddress,  setBuyerAddress]  = useState(initialDoc?.buyer?.address || "");
  const [carBrand,      setCarBrand]      = useState(initialDoc?.car?.brand     || "");
  const [carModel,      setCarModel]      = useState(initialDoc?.car?.model     || "");
  const [carYear,       setCarYear]       = useState(String(initialDoc?.car?.year || ""));
  const [carColor,      setCarColor]      = useState(initialDoc?.car?.color     || "");
  const [carVin,        setCarVin]        = useState(initialDoc?.car?.vin       || "");
  const [docNumber,     setDocNumber]     = useState(initialDoc?.documentNumber || "");
  const [docDate,       setDocDate]       = useState(initialDoc?.issuedAt?.split("T")[0] || "");
  const [dueDate,       setDueDate]       = useState(initialDoc?.dueDate?.split("T")[0]  || "");
  const [amount,        setAmount]        = useState(String(
    initialDoc?.financials?.total || initialDoc?.financials?.amountPaid ||
    initialDoc?.transaction?.amountPaid || ""
  ));
  const [paymentType,   setPaymentType]   = useState(initialDoc?.buyer?.paymentType || "full");
  const [paymentMethod, setPaymentMethod] = useState(
    initialDoc?.financials?.paymentMethod || initialDoc?.transaction?.paymentMethod || "cash"
  );
  const [dealerName,    setDealerName]    = useState(initialDoc?.dealer?.companyName || "");
  const [dealerAddress, setDealerAddress] = useState(initialDoc?.dealer?.address     || "");
  const [dealerPhone,   setDealerPhone]   = useState(initialDoc?.dealer?.phone       || "");
  const [notes,         setNotes]         = useState(initialDoc?.notes || "");
  const [lpo,           setLpo]           = useState("");

  const docTitle   = DOC_TITLES[initialDoc?.documentType] || initialDoc?.title?.toUpperCase() || "DOCUMENT";
  const totalAmt   = parseFloat(amount) || 0;
  const isReceipt  = ["RECEIPT","VEHICLE_SALES_RECEIPT"].includes(initialDoc?.documentType);
  const isProforma = initialDoc?.documentType === "PROFORMA_INVOICE";

  // Design picker: "original" keeps the existing, fully-featured
  // template (installments, vehicle image, etc.) completely
  // unchanged as the default - the 5 new Design Studio designs are
  // offered as additional style choices for receipts/invoices/
  // proforma, reusing the same templates from the standalone
  // Business Documents generator so both places share one set of
  // designs. These cover the simpler, common case (no installment
  // breakdown, no vehicle photo) - "Original" stays the right choice
  // whenever those matter.
  const designChoices = isProforma ? PROFORMA_DESIGNS : RECEIPT_DESIGNS;
  const [designId, setDesignId] = useState<string>("original");
  const newDesignRef = useRef<HTMLDivElement>(null);
  const activeNewDesign = designId !== "original" ? designChoices.find(d => d.id === designId) : null;

  const businessDocData: BusinessDocData = {
    companyName: dealerName || "Dealer",
    companyLogo: initialDoc?.dealer?.logo || null,
    qrCode: initialDoc?.dealer?.qrCode || null,
    companyAddress: dealerAddress,
    companyPhone: dealerPhone,
    companyEmail: initialDoc?.dealer?.email,
    companyCity: initialDoc?.dealer?.city,
    companyState: initialDoc?.dealer?.state,
    docNumber: docNumber,
    docDate: fmtD((docDate || "") + "T00:00:00Z") || fmtD(initialDoc?.issuedAt) || "",
    customerName: buyerName || "Cash Buyer",
    customerPhone: buyerPhone,
    customerAddress: buyerAddress,
    items: [{ description: `${carBrand} ${carModel} ${carYear}`.trim(), qty: 1, unitPrice: totalAmt }],
    notes: notes,
    amountPaid: isReceipt ? totalAmt : undefined,
    paymentMethod: paymentMethod?.replace(/_/g, " "),
    documentTitle: docTitle,
  };

  const installments =
    initialDoc?.buyer?.installmentPlan?.installments ||
    (Array.isArray(initialDoc?.buyer?.installmentPlan) ? initialDoc?.buyer?.installmentPlan : null);

  //  Build the document HTML (unchanged) 
  const buildHtml = (): string => {
    const d = initialDoc;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${docTitle} ${docNumber}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;max-width:760px;margin:0 auto;font-size:12px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #F47B20;padding-bottom:14px;margin-bottom:18px;gap:12px;flex-wrap:wrap}
.logo{max-height:68px;max-width:200px;object-fit:contain;display:block;margin-bottom:6px}
.dn{font-size:17px;font-weight:700;color:#1A1A1A;margin-bottom:2px}
.ds{font-size:9px;color:#737373;line-height:1.6}
.dt{font-size:22px;font-weight:700;color:#F47B20;letter-spacing:0.06em;text-align:right}
.dm{font-size:9px;color:#737373;text-align:right;line-height:1.8;margin-top:6px}
.dm strong{color:#1A1A1A}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
.bb{background:#F5F5F5;border-radius:6px;padding:11px}
.bl{font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A3A3A3;margin-bottom:5px}
.bn{font-size:13px;font-weight:700;color:#1A1A1A;margin-bottom:3px}
.bs{font-size:10px;color:#737373;line-height:1.6}
.vb{display:flex;gap:12px;align-items:flex-start;background:#FFF7ED;border:1px solid rgba(244,123,32,0.2);border-radius:7px;padding:11px;margin-bottom:16px}
.vi{width:88px;height:66px;object-fit:cover;border-radius:5px;flex-shrink:0;border:1px solid rgba(244,123,32,0.2)}
.vl{font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#F47B20;margin-bottom:3px}
.vn{font-size:14px;font-weight:700;color:#1A1A1A}
.vs{font-size:9px;color:#737373;margin-top:2px}
.vv{font-size:8px;color:#A3A3A3;font-family:monospace;margin-top:3px}
.tb{display:flex;justify-content:flex-end;margin-bottom:14px}
.ti{width:280px;border-top:2px solid #1A1A1A;padding-top:6px;display:flex;justify-content:space-between;font-size:15px;font-weight:700}
.pb{background:#F0FDF4;border:1px solid #86EFAC;border-radius:5px;padding:9px 11px;margin-bottom:14px;display:flex;gap:20px;flex-wrap:wrap;font-size:10px}
.pl{font-size:8px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#A3A3A3;margin-bottom:2px}
.cb{width:12px;height:12px;border:1.5px solid #1A1A1A;display:inline-block;margin-right:4px;vertical-align:middle;flex-shrink:0}
.cbon{background:#1A1A1A}
table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px}
th{background:#D97706;color:#fff;padding:7px 10px;text-align:left;font-size:8px;letter-spacing:0.06em;font-weight:600}
th.r,td.r{text-align:right}
td{padding:7px 10px;border-bottom:1px solid #EEE}
tr:nth-child(even) td{background:#FFFBEB}
.conf{background:#F0FDF4;border:1px solid #86EFAC;border-radius:5px;padding:11px;margin-bottom:14px;font-size:10px;color:#15803D;line-height:1.5}
.terms{font-size:8px;color:#737373;border-left:2px solid #F47B20;padding-left:7px;margin-bottom:14px;line-height:1.6}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:22px;border-top:1px solid #E5E5E5;padding-top:14px}
.sl{font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A3A3A3;margin-bottom:7px}
.sline{height:38px;border-bottom:1px solid #1A1A1A;margin-bottom:4px}
.ss{font-size:8px;color:#737373}
.ft{text-align:center;margin-top:22px;padding-top:11px;border-top:1px solid #E5E5E5;font-size:7px;color:#A3A3A3;letter-spacing:0.06em}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:8px;font-weight:700;margin-top:4px}
.vsr{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.vsr-r{display:flex;flex-direction:column;gap:1px}
.vsr-l{font-size:8px;text-transform:uppercase;letter-spacing:0.06em;color:#A3A3A3;font-weight:700}
.vsr-v{font-size:11px;color:#1A1A1A;font-weight:600;border-bottom:1px solid #D4D4D4;padding-bottom:2px;min-height:16px}
@media print{@page{margin:0.8cm}body{padding:0}}
</style></head><body>

<div class="hdr">
  <div>
    ${d?.dealer?.logo ? `<img src="${d.dealer.logo}" class="logo" alt=""/>` : ""}
    <div class="dn">${dealerName || "CARSTRIMS"}</div>
    ${dealerAddress ? `<div class="ds">${dealerAddress}</div>` : ""}
    ${[d?.dealer?.city, d?.dealer?.state].filter(Boolean).map((v: string) => `<div class="ds">${v}</div>`).join("")}
    ${dealerPhone ? `<div class="ds">Tel: ${dealerPhone}</div>` : ""}
    ${d?.dealer?.email ? `<div class="ds">${d.dealer.email}</div>` : ""}
  </div>
  <div>
    <div class="dt">${docTitle}</div>
    ${isProforma ? `<div class="ds" style="text-align:right;color:#D97706;margin-top:3px">Formal Quote  Not a Demand for Payment</div>` : ""}
    <div class="dm">
      No: <strong>${docNumber}</strong><br>
      Date: <strong>${fmtD((docDate || "") + "T00:00:00Z") || fmtD(d?.issuedAt) || new Date().toLocaleDateString("en-NG")}</strong>
      ${dueDate ? `<br>Due: <strong style="color:#DC2626">${fmtD(dueDate + "T00:00:00Z")}</strong>` : ""}
      ${lpo ? `<br>L.P.O No: <strong>${lpo}</strong>` : ""}
    </div>
    <span class="badge" style="${isReceipt ? "background:#F0FDF4;color:#15803D;border:1px solid #86EFAC" : isProforma ? "background:#FFF7ED;color:#D97706;border:1px solid #FDE68A" : "background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE"}">
      ${isReceipt ? "PAID  RECEIPT" : isProforma ? "PROFORMA QUOTE" : "INVOICE"}
    </span>
  </div>
</div>

<div class="g2">
  <div class="bb">
    <div class="bl">Bill From (Seller)</div>
    <div class="bn">${dealerName}</div>
    <div class="bs">${dealerAddress}</div>
    <div class="bs">${dealerPhone ? "Tel: " + dealerPhone : ""}</div>
  </div>
  <div class="bb">
    <div class="bl">Bill To (Customer)</div>
    <div class="bn">${buyerName || "________________"}</div>
    <div class="bs">${buyerAddress || "________________"}</div>
    ${buyerPhone ? `<div class="bs">Tel: ${buyerPhone}</div>` : ""}
    ${buyerEmail ? `<div class="bs">${buyerEmail}</div>` : ""}
  </div>
</div>

<div class="vb">
  ${d?.car?.image ? `<img src="${d.car.image}" class="vi" alt=""/>` : ""}
  <div>
    <div class="vl">Vehicle Details</div>
    <div class="vn">${carBrand} ${carModel} ${carYear}</div>
    <div class="vs">${[carColor, d?.car?.condition, d?.car?.transmission, d?.car?.fuelType].filter(Boolean).join("  ")}</div>
    ${carVin ? `<div class="vv">Chassis/VIN: ${carVin}</div>` : ""}
    <div class="vv">Vehicle ID: ${d?.car?.carId || ""}</div>
  </div>
</div>

${isReceipt ? `
<div class="vsr">
  <div class="vsr-r"><div class="vsr-l">Seller</div><div class="vsr-v">${dealerName}</div></div>
  <div class="vsr-r"><div class="vsr-l">Buyer</div><div class="vsr-v">${buyerName}</div></div>
  <div class="vsr-r"><div class="vsr-l">Make</div><div class="vsr-v">${carBrand}</div></div>
  <div class="vsr-r"><div class="vsr-l">Model</div><div class="vsr-v">${carModel}</div></div>
  <div class="vsr-r"><div class="vsr-l">Colour</div><div class="vsr-v">${carColor}</div></div>
  <div class="vsr-r"><div class="vsr-l">Year</div><div class="vsr-v">${carYear}</div></div>
  <div class="vsr-r" style="grid-column:1/-1"><div class="vsr-l">Chassis Number</div><div class="vsr-v">${carVin}</div></div>
</div>
<div style="margin-bottom:10px;font-size:10px">
  Amount Paid: <strong>${fmtN(totalAmt)}</strong>&nbsp;&nbsp;
  Paid as: <span class="cb ${paymentType === "full" ? "cbon" : ""}"></span> Full&nbsp;
  <span class="cb ${paymentType !== "full" ? "cbon" : ""}"></span> Instalment
</div>
<div style="display:flex;align-items:center;gap:16px;font-size:10px;margin-bottom:10px">
  Payment Type:
  <label><span class="cb ${paymentMethod === "cash" ? "cbon" : ""}"></span>Cash</label>
  <label><span class="cb ${paymentMethod === "card" ? "cbon" : ""}"></span>Card</label>
  <label><span class="cb ${paymentMethod === "transfer" ? "cbon" : ""}"></span>Transfer</label>
  <label><span class="cb ${paymentMethod === "cheque" ? "cbon" : ""}"></span>Cheque${paymentMethod === "cheque" ? " No: ____________" : ""}</label>
</div>` : ""}

<div class="tb">
  <div class="ti">
    <span>${isReceipt ? "Amount Paid" : "Total Due"}</span>
    <span style="color:#F47B20">${fmtN(totalAmt)}</span>
  </div>
</div>

<div class="pb">
  <div><div class="pl">Payment Type</div><strong style="text-transform:capitalize">${paymentType}</strong></div>
  <div><div class="pl">Method</div><strong style="text-transform:capitalize">${paymentMethod?.replace(/_/g, " ")}</strong></div>
  ${d?.transaction?.transactionId ? `<div><div class="pl">Transaction Ref</div><span style="font-family:monospace">${d.transaction.transactionId}</span></div>` : ""}
</div>

${installments?.length ? `
<div style="font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#D97706;margin:14px 0 7px;border-bottom:1px solid #FDE68A;padding-bottom:3px">Installment Payment Schedule</div>
<table>
  <thead><tr><th>#</th><th>Description</th><th class="r">Amount (NGN)</th><th>Due Date</th><th>Status</th></tr></thead>
  <tbody>
    ${installments.map((inst: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? "#FFFBEB" : "#FFF7D6"}">
      <td>${i + 1}</td><td>${inst.label || `Installment ${i + 1}`}</td>
      <td class="r" style="font-weight:600">${fmtN(inst.amount || 0)}</td>
      <td>${inst.dueDate || "TBD"}</td>
      <td style="font-weight:700;color:${inst.paid ? "#16A34A" : "#D97706"}">${inst.paid ? "PAID" : "PENDING"}</td>
    </tr>`).join("")}
  </tbody>
</table>` : ""}

${isReceipt ? `
<div class="conf">
  <div style="font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Payment Confirmed</div>
  <strong>Received in full  ${paymentMethod?.replace(/_/g, " ").toUpperCase()}</strong>
  ${d?.transaction?.transactionId ? `<div style="font-family:monospace;font-size:8px;color:#737373;margin-top:2px">Ref: ${d.transaction.transactionId}</div>` : ""}
  <div style="font-style:italic;margin-top:6px"><em>Signed, Sealed and Delivered</em></div>
</div>` : ""}

${notes ? `<div style="background:#F5F5F5;border-radius:5px;padding:9px 11px;font-size:9px;color:#737373;margin-bottom:14px;line-height:1.6"><em>Notes: ${notes}</em></div>` : ""}

<div class="terms">This invoice is valid for 7 calendar days from the date it was signed. Goods sold in good condition are returnable. No refund of money after payment. Thanks for your patronage  Please call again.</div>

<div class="sg">
  <div>
    <div class="sl">Seller Signature / Manager's Signature</div>
    ${d?.dealer?.signature ? `<img src="${d.dealer.signature}" style="max-height:52px;max-width:180px;object-fit:contain;display:block;margin-bottom:4px" alt=""/>` : `<div class="sline"></div>`}
    <div style="font-size:10px;font-weight:700">${dealerName}</div>
    <div class="ss">Authorised Signatory</div>
  </div>
  <div>
    <div class="sl">Buyer Signature / Customer's Signature</div>
    <div class="sline"></div>
    <div class="ss">Signature &amp; Date</div>
  </div>
</div>

<div class="ft">${dealerName} | RC: 7753519 | 108B Muhammadu Buhari Way Central Business District, Abuja | 0806 520 6576 | Powered by CARSTRIMS  UASE TECH STUDIO</div>
<script>window.onload=()=>window.print()<\/script>
</body></html>`;
    return html;
  };

  const docFilename = () =>
    `carstrims-${(docTitle || "doc").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

  const [busy, setBusy] = useState<"" | "pdf" | "jpg" | "share">("");
  const [showFormatPicker, setShowFormatPicker] = useState<"download" | "share" | "">("");
  const showToast = useToast();

  const handleDownload = async (format: "pdf" | "jpg") => {
    setShowFormatPicker("");
    setBusy(format);
    try {
      const blob = activeNewDesign && newDesignRef.current
        ? (format === "jpg" ? await renderElementToJpgBlob(newDesignRef.current, 0.95) : await renderElementToPdfBlob(newDesignRef.current, docTitle))
        : (format === "jpg" ? await renderHtmlStringToJpgBlob(buildHtml()) : await renderHtmlStringToPdfBlob(buildHtml(), docTitle));
      await downloadBlob(blob, `${docFilename()}.${format}`);
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Download failed — please try again", "error");
    } finally {
      setBusy("");
    }
  };

  const handleShare = async (format: "pdf" | "jpg") => {
    setShowFormatPicker("");
    setBusy("share");
    try {
      const blob = activeNewDesign && newDesignRef.current
        ? (format === "jpg" ? await renderElementToJpgBlob(newDesignRef.current, 0.95) : await renderElementToPdfBlob(newDesignRef.current, docTitle))
        : (format === "jpg" ? await renderHtmlStringToJpgBlob(buildHtml()) : await renderHtmlStringToPdfBlob(buildHtml(), docTitle));
      await shareBlob(blob, `${docFilename()}.${format}`, docTitle);
    } catch (e: any) {
      showToast(e?.message || "Share failed — please try again", "error");
    } finally {
      setBusy("");
    }
  };

  //  Shared input style  defined as a constant STRING of CSS, applied inline 
  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    fontFamily: "Arial, sans-serif",
    color: "#1A1A1A",
    background: "#FFFFFF",
    border: "2px solid #D4D4D4",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
    marginTop: "6px",
    WebkitAppearance: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "#737373",
    marginBottom: "0",
  };

  const fieldWrap: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    marginBottom: "16px",
  };

  const sectionCard: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "12px",
    border: "1.5px solid #E5E5E5",
    marginBottom: "12px",
    overflow: "visible",
  };

  const sectionTitle: React.CSSProperties = {
    padding: "12px 16px",
    background: "#1A1A1A",
    borderRadius: "10px 10px 0 0",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#F47B20",
  };

  const sectionInner: React.CSSProperties = {
    padding: "16px",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 9000, overflowY: "auto", padding: "12px" }}>
      <div style={{ width: "100%", maxWidth: "680px", margin: "0 auto", background: "#F0F0F0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>

        {/*  Top bar  */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#1A1A1A", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", letterSpacing: "0.12em", color: "#F47B20", fontWeight: 700 }}>{docTitle}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: "8px", padding: "3px" }}>
              <button onClick={() => setStep("view")}
                style={{ background: step === "view" ? "#F47B20" : "transparent", color: "#fff", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", cursor: "pointer", fontWeight: step === "view" ? 700 : 400 }}>
                Preview
              </button>
              <button onClick={() => setStep("edit")}
                style={{ background: step === "edit" ? "#F47B20" : "transparent", color: "#fff", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", cursor: "pointer", fontWeight: step === "edit" ? 700 : 400 }}>
                Edit Fields
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFormatPicker(showFormatPicker === "download" ? "" : "download")} disabled={busy !== ""}
                style={{ background: "#16A34A", border: "none", color: "#fff", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer", fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
                {busy === "pdf" || busy === "jpg" ? "Downloading…" : "Download"}
              </button>
              {showFormatPicker === "download" && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 40, background: "#fff", border: "1.5px solid #E5E5E5", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", overflow: "hidden", minWidth: "120px", maxWidth: "calc(100vw - 2rem)" }}>
                  <button onClick={() => handleDownload("pdf")} style={{ display: "block", width: "100%", textAlign: "left" as const, padding: "0.6rem 0.9rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#1A1A1A" }}>as PDF</button>
                  <button onClick={() => handleDownload("jpg")} style={{ display: "block", width: "100%", textAlign: "left" as const, padding: "0.6rem 0.9rem", background: "none", border: "none", borderTop: "1px solid #F5F5F5", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#1A1A1A" }}>as JPG Image</button>
                </div>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFormatPicker(showFormatPicker === "share" ? "" : "share")} disabled={busy !== ""}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer", fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
                {busy === "share" ? "Sharing…" : "Share"}
              </button>
              {showFormatPicker === "share" && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 40, background: "#fff", border: "1.5px solid #E5E5E5", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", overflow: "hidden", minWidth: "120px", maxWidth: "calc(100vw - 2rem)" }}>
                  <button onClick={() => handleShare("pdf")} style={{ display: "block", width: "100%", textAlign: "left" as const, padding: "0.6rem 0.9rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#1A1A1A" }}>as PDF</button>
                  <button onClick={() => handleShare("jpg")} style={{ display: "block", width: "100%", textAlign: "left" as const, padding: "0.6rem 0.9rem", background: "none", border: "none", borderTop: "1px solid #F5F5F5", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#1A1A1A" }}>as JPG Image</button>
                </div>
              )}
            </div>
            <button onClick={onClose}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "8px", padding: "8px 12px", fontSize: "16px", cursor: "pointer", lineHeight: 1 }}>
              X
            </button>
          </div>
        </div>

        {/*  Hint  */}
        <div style={{ padding: "10px 16px", background: step === "edit" ? "#FFF7ED" : "#EFF6FF", borderBottom: "1px solid", borderColor: step === "edit" ? "#FDE68A" : "#BFDBFE", fontSize: "13px", color: step === "edit" ? "#92400E" : "#1E40AF", fontWeight: 500, lineHeight: 1.5 }}>
          {step === "edit"
            ? "Fill in or edit any detail below, then tap Download or Share to generate your document. You can generate it as many times as you like."
            : "Preview of your document. Tap Edit Fields to add customer name, address and payment details."}
        </div>

        {/*  PREVIEW  */}
        {step === "view" && (
          <div style={{ background: "#fff", padding: "20px", maxHeight: "75vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #F47B20", paddingBottom: "12px", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
              <div>
                {initialDoc?.dealer?.logo && <img src={initialDoc.dealer.logo} alt="" style={{ display: "block", maxHeight: "56px", maxWidth: "160px", objectFit: "contain", marginBottom: "6px" }} />}
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A1A" }}>{dealerName || "Dealer"}</div>
                {dealerAddress && <div style={{ fontSize: "10px", color: "#737373" }}>{dealerAddress}</div>}
                {dealerPhone && <div style={{ fontSize: "10px", color: "#737373" }}>Tel: {dealerPhone}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#F47B20", letterSpacing: "0.06em" }}>{docTitle}</div>
                <div style={{ fontSize: "10px", color: "#737373", marginTop: "5px", lineHeight: 1.7 }}>
                  No: <strong>{docNumber || ""}</strong><br />
                  Date: <strong>{fmtD((docDate || "") + "T00:00:00Z") || fmtD(initialDoc?.issuedAt) || ""}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              {[
                { title: "Bill From (Seller)", name: dealerName, sub: dealerAddress, phone: dealerPhone },
                { title: "Bill To (Customer)", name: buyerName, sub: buyerAddress, phone: buyerPhone, warn: !buyerName },
              ].map((b, i) => (
                <div key={i} style={{ background: "#F5F5F5", borderRadius: "6px", padding: "10px" }}>
                  <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#A3A3A3", marginBottom: "5px" }}>{b.title}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: b.warn ? "#EF4444" : "#1A1A1A" }}>{b.name || "Not filled yet"}</div>
                  <div style={{ fontSize: "10px", color: b.warn && !b.sub ? "#EF4444" : "#737373" }}>{b.sub || (b.warn ? "Address missing" : "")}</div>
                  {b.phone && <div style={{ fontSize: "10px", color: "#737373" }}>Tel: {b.phone}</div>}
                </div>
              ))}
            </div>

            <div style={{ background: "#FFF7ED", border: "1px solid rgba(244,123,32,0.2)", borderRadius: "7px", padding: "10px", marginBottom: "12px", display: "flex", gap: "10px" }}>
              {initialDoc?.car?.image && <img src={initialDoc.car.image} alt="" style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "5px", flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase" as const, color: "#F47B20", marginBottom: "3px" }}>Vehicle</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A1A" }}>{carBrand} {carModel} {carYear}</div>
                <div style={{ fontSize: "9px", color: "#737373" }}>{[carColor, initialDoc?.car?.condition].filter(Boolean).join("  ")}</div>
                {carVin && <div style={{ fontSize: "8px", color: "#A3A3A3", fontFamily: "monospace" }}>VIN: {carVin}</div>}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <div style={{ borderTop: "2px solid #1A1A1A", paddingTop: "5px", display: "flex", justifyContent: "space-between", width: "240px", fontSize: "14px", fontWeight: 700 }}>
                <span>{isReceipt ? "Amount Paid" : "Total Due"}</span>
                <span style={{ color: "#F47B20" }}>{fmtN(totalAmt)}</span>
              </div>
            </div>

            {!buyerName && (
              <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#DC2626", fontWeight: 600 }}>
                Customer name and address are empty. Tap <strong>Edit Fields</strong> to fill them before printing.
              </div>
            )}
          </div>
        )}

        {/*  EDIT FORM  */}
        {step === "edit" && (
          <div style={{ padding: "14px", overflowY: "auto", maxHeight: "75vh" }}>

            {/* CUSTOMER */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Customer Details</div>
              <div style={sectionInner}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <div style={fieldWrap}>
                    <label htmlFor="f-bname" style={labelStyle}>Customer Name</label>
                    <input id="f-bname" type="text" style={inputStyle} value={buyerName} placeholder="Full name" onChange={e => setBuyerName(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-bphone" style={labelStyle}>Phone Number</label>
                    <input id="f-bphone" type="tel" style={inputStyle} value={buyerPhone} placeholder="0801 234 5678" onChange={e => setBuyerPhone(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-bemail" style={labelStyle}>Email Address</label>
                    <input id="f-bemail" type="email" style={inputStyle} value={buyerEmail} placeholder="email@example.com" onChange={e => setBuyerEmail(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-lpo" style={labelStyle}>L.P.O Number</label>
                    <input id="f-lpo" type="text" style={inputStyle} value={lpo} placeholder="Optional" onChange={e => setLpo(e.target.value)} />
                  </div>
                  <div style={{ ...fieldWrap, gridColumn: "1 / -1" }}>
                    <label htmlFor="f-baddr" style={labelStyle}>Customer Address</label>
                    <input id="f-baddr" type="text" style={inputStyle} value={buyerAddress} placeholder="Street, City, State" onChange={e => setBuyerAddress(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* VEHICLE */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Vehicle Details</div>
              <div style={sectionInner}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <div style={fieldWrap}>
                    <label htmlFor="f-cbrand" style={labelStyle}>Brand / Make</label>
                    <input id="f-cbrand" type="text" style={inputStyle} value={carBrand} placeholder="e.g. Toyota" onChange={e => setCarBrand(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-cmodel" style={labelStyle}>Model</label>
                    <input id="f-cmodel" type="text" style={inputStyle} value={carModel} placeholder="e.g. Camry" onChange={e => setCarModel(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-cyear" style={labelStyle}>Year</label>
                    <input id="f-cyear" type="text" style={inputStyle} value={carYear} placeholder="e.g. 2024" onChange={e => setCarYear(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-ccolor" style={labelStyle}>Colour</label>
                    <input id="f-ccolor" type="text" style={inputStyle} value={carColor} placeholder="e.g. Black" onChange={e => setCarColor(e.target.value)} />
                  </div>
                  <div style={{ ...fieldWrap, gridColumn: "1 / -1" }}>
                    <label htmlFor="f-cvin" style={labelStyle}>Chassis / VIN Number</label>
                    <input id="f-cvin" type="text" style={inputStyle} value={carVin} placeholder="Chassis number" onChange={e => setCarVin(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Payment Details</div>
              <div style={sectionInner}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <div style={fieldWrap}>
                    <label htmlFor="f-amt" style={labelStyle}>Amount (NGN)</label>
                    <FormattedNumberInput id="f-amt" style={inputStyle} value={amount} placeholder="0" onChange={(raw) => setAmount(raw)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-docnum" style={labelStyle}>Document Number</label>
                    <input id="f-docnum" type="text" style={inputStyle} value={docNumber} placeholder="e.g. RCP-0026" onChange={e => setDocNumber(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-ptype" style={labelStyle}>Payment Type</label>
                    <CustomSelect value={paymentType} onChange={setPaymentType} options={[{value:"full",label:"Full Payment"},{value:"installment",label:"Installment"},{value:"lease",label:"Lease"}]} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-pmethod" style={labelStyle}>Payment Method</label>
                    <CustomSelect value={paymentMethod} onChange={setPaymentMethod} options={[{value:"cash",label:"Cash"},{value:"card",label:"Card"},{value:"transfer",label:"Bank Transfer"},{value:"cheque",label:"Cheque"},{value:"pos",label:"POS"}]} />
                  </div>
                </div>
              </div>
            </div>

            {/* DATES */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Dates</div>
              <div style={sectionInner}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <div style={fieldWrap}>
                    <label htmlFor="f-ddate" style={labelStyle}>Document Date</label>
                    <input id="f-ddate" type="date" style={inputStyle} value={docDate} onChange={e => setDocDate(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-ddue" style={labelStyle}>Due Date (optional)</label>
                    <input id="f-ddue" type="date" style={inputStyle} value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* SELLER */}
            <div style={sectionCard}>
              <div style={sectionTitle}>Seller / Dealer Details</div>
              <div style={sectionInner}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <div style={fieldWrap}>
                    <label htmlFor="f-dname" style={labelStyle}>Company Name</label>
                    <input id="f-dname" type="text" style={inputStyle} value={dealerName} placeholder="Dealer name" onChange={e => setDealerName(e.target.value)} />
                  </div>
                  <div style={fieldWrap}>
                    <label htmlFor="f-dphone" style={labelStyle}>Phone</label>
                    <input id="f-dphone" type="tel" style={inputStyle} value={dealerPhone} placeholder="Phone number" onChange={e => setDealerPhone(e.target.value)} />
                  </div>
                  <div style={{ ...fieldWrap, gridColumn: "1 / -1" }}>
                    <label htmlFor="f-daddr" style={labelStyle}>Address</label>
                    <input id="f-daddr" type="text" style={inputStyle} value={dealerAddress} placeholder="Full address" onChange={e => setDealerAddress(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div style={{ ...sectionCard, marginBottom: "16px" }}>
              <div style={sectionTitle}>Additional Notes (Optional)</div>
              <div style={sectionInner}>
                <div style={fieldWrap}>
                  <textarea id="f-notes" style={{ ...inputStyle, minHeight: "80px", resize: "vertical" as const }}
                    value={notes} placeholder="Any additional notes to appear on the document..."
                    onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Download / Share / Cancel */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <button onClick={() => setShowFormatPicker(showFormatPicker === "download" ? "" : "download")} disabled={busy !== ""}
                  style={{ width: "100%", background: "#F47B20", color: "#fff", border: "none", borderRadius: "12px", padding: "16px", fontFamily: "var(--font-display)", fontSize: "15px", letterSpacing: "0.08em", cursor: "pointer", fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
                  {busy === "pdf" || busy === "jpg" ? "DOWNLOADING…" : "DOWNLOAD DOCUMENT"}
                </button>
                {showFormatPicker === "download" && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, zIndex: 40, background: "#fff", border: "1.5px solid #E5E5E5", borderRadius: "10px", boxShadow: "0 -8px 24px rgba(0,0,0,0.2)", overflow: "hidden" }}>
                    <button onClick={() => handleDownload("pdf")} style={{ display: "block", width: "100%", textAlign: "center" as const, padding: "0.8rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "#1A1A1A" }}>as PDF</button>
                    <button onClick={() => handleDownload("jpg")} style={{ display: "block", width: "100%", textAlign: "center" as const, padding: "0.8rem", background: "none", border: "none", borderTop: "1px solid #F5F5F5", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "#1A1A1A" }}>as JPG Image</button>
                  </div>
                )}
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                <button onClick={() => setShowFormatPicker(showFormatPicker === "share" ? "" : "share")} disabled={busy !== ""}
                  style={{ width: "100%", background: "#1A1A1A", color: "#fff", border: "none", borderRadius: "12px", padding: "16px", fontFamily: "var(--font-display)", fontSize: "15px", letterSpacing: "0.08em", cursor: "pointer", fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
                  {busy === "share" ? "SHARING…" : "SHARE"}
                </button>
                {showFormatPicker === "share" && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, zIndex: 40, background: "#fff", border: "1.5px solid #E5E5E5", borderRadius: "10px", boxShadow: "0 -8px 24px rgba(0,0,0,0.2)", overflow: "hidden" }}>
                    <button onClick={() => handleShare("pdf")} style={{ display: "block", width: "100%", textAlign: "center" as const, padding: "0.8rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "#1A1A1A" }}>as PDF</button>
                    <button onClick={() => handleShare("jpg")} style={{ display: "block", width: "100%", textAlign: "center" as const, padding: "0.8rem", background: "none", border: "none", borderTop: "1px solid #F5F5F5", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "#1A1A1A" }}>as JPG Image</button>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose}
              style={{ width: "100%", background: "#F5F5F5", color: "#525252", border: "1.5px solid #E5E5E5", borderRadius: "12px", padding: "12px", fontSize: "14px", cursor: "pointer", fontWeight: 600, marginBottom: "8px" }}>
              Cancel
            </button>

          </div>
        )}

      </div>
    </div>
  );
}