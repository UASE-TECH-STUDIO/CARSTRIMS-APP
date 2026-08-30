"use client";
import { useEffect, useRef, useState, CSSProperties } from "react";
import api from "@/lib/api";
import FeedHomeButton from "@/components/shared/FeedHomeButton";
import { useToast } from "@/store/toastStore";
import { renderElementToPdfBlob, renderElementToJpgBlob, downloadBlob } from "@/lib/documentExport";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  LETTERHEAD_DESIGNS, PROFORMA_DESIGNS, RECEIPT_DESIGNS, BusinessDocData,
} from "@/components/design-studio/BusinessDocDesigns";
import { ColorScheme, COLOR_SCHEMES } from "@/components/design-studio/colorSchemes";
import DocumentPreviewLightbox from "@/components/shared/DocumentPreviewLightbox";

type DocType = "letterhead" | "proforma" | "receipt";

interface LineItem { description: string; qty: number; unitPrice: number; }

export default function BusinessDocsPage() {
  const showToast = useToast();
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [docType, setDocType] = useState<DocType | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [colorSchemeId, setColorSchemeId] = useState(COLOR_SCHEMES[0].id);
  const colorScheme: ColorScheme = COLOR_SCHEMES.find(c => c.id === colorSchemeId) || COLOR_SCHEMES[0];
  const [downloading, setDownloading] = useState<"jpg" | "pdf" | null>(null);

  // Proforma/Receipt form fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", qty: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const dRes = await api.get("/api/v1/dealers/me");
        let d = dRes.data;
        if (!d.qrCode) {
          try {
            const qrRes = await api.post("/api/v1/public/qr/generate");
            d = { ...d, qrCode: qrRes.data.qrCode };
          } catch { /* still works without a QR code */ }
        }
        setDealer(d);
      } catch {
        showToast("Couldn't load your details", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const designsForType = docType === "letterhead" ? LETTERHEAD_DESIGNS
    : docType === "proforma" ? PROFORMA_DESIGNS
    : docType === "receipt" ? RECEIPT_DESIGNS
    : [];
  const activeDesign = designsForType.find(d => d.id === designId);

  const needsForm = docType === "proforma" || docType === "receipt";
  // Letterhead needs no filled-in fields to preview - proforma/receipt
  // need at least one real line item before there's anything
  // meaningful to show.
  const formReady = docType === "letterhead"
    ? true
    : items.some(i => i.description.trim().length > 0);

  const buildDocData = (): BusinessDocData | null => {
    if (!dealer || !docType) return null;
    const base: BusinessDocData = {
      companyName: dealer.companyName || "Dealer",
      companyLogo: dealer.logo || null,
      qrCode: dealer.qrCode || null,
      companyAddress: dealer.address,
      companyPhone: dealer.phone,
      companyEmail: dealer.email,
      companyCity: dealer.city,
      companyState: dealer.state,
    };
    if (docType === "letterhead") return base;

    const docNumberPrefix = docType === "proforma" ? "PRO" : "RCT";
    return {
      ...base,
      docNumber: `${docNumberPrefix}-${Date.now().toString().slice(-6)}`,
      docDate: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }),
      customerName,
      customerPhone,
      customerAddress,
      items: items.filter(i => i.description.trim()),
      notes: docType === "proforma" ? notes : undefined,
      amountPaid: docType === "receipt" ? (amountPaid === "" ? undefined : Number(amountPaid)) : undefined,
      paymentMethod: docType === "receipt" ? paymentMethod : undefined,
    };
  };

  const docData = buildDocData();

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };
  const addItem = () => setItems(prev => [...prev, { description: "", qty: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  const handleDownload = async (format: "jpg" | "pdf") => {
    if (!docRef.current || !docData) return;
    setDownloading(format);
    try {
      const labelPart = docType === "letterhead" ? "letterhead" : (docData.customerName || docType);
      const filenameBase = `${dealer.companyName || docType}-${labelPart}`.replace(/\s+/g, "-").toLowerCase();
      if (format === "jpg") {
        const blob = await renderElementToJpgBlob(docRef.current, 0.95);
        await downloadBlob(blob, `${filenameBase}.jpg`);
      } else {
        const title = docType === "letterhead" ? "Letterhead" : `${docData.customerName || ""} - ${docType}`;
        const blob = await renderElementToPdfBlob(docRef.current, title);
        await downloadBlob(blob, `${filenameBase}.pdf`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Download failed", "error");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#737373" }}>Loading…</div>;
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.03em", color: "#1A1A1A", margin: 0 }}>
          Business Documents
        </h1>
        <FeedHomeButton compact />
      </div>

      {/* Step 1: document type */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={stepLabelStyle}>1. What do you need?</div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {([["letterhead", "Letterhead"], ["proforma", "Proforma Invoice"], ["receipt", "Receipt"]] as [DocType, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setDocType(val); setDesignId(null); }}
              style={choiceButtonStyle(docType === val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: form (proforma/receipt only) */}
      {needsForm && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>2. Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <input placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} style={inputStyle} />
              <input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={inputStyle} />
            </div>
            <input placeholder="Address (optional)" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} style={inputStyle} />

            <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", fontWeight: 700, color: "#737373" }}>Items</div>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input placeholder="Description" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, "qty", Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                <input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => removeItem(i)} style={removeButtonStyle}>×</button>
              </div>
            ))}
            <button onClick={addItem} style={addItemButtonStyle}>+ Add item</button>

            {docType === "proforma" && (
              <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            )}
            {docType === "receipt" && (
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input type="number" placeholder="Amount paid (leave blank = item total)" value={amountPaid} onChange={e => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                <div style={{ flex: 1 }}>
                  <CustomSelect value={paymentMethod} onChange={setPaymentMethod} options={[{value:"Cash",label:"Cash"},{value:"Bank Transfer",label:"Bank Transfer"},{value:"Card / POS",label:"Card / POS"}]} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: design */}
      {docType && formReady && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>{needsForm ? "3" : "2"}. Choose a design</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {designsForType.map(d => (
              <button key={d.id} onClick={() => setDesignId(d.id)} style={designThumbStyle(designId === d.id)}>
                <div style={{ width: "80px", height: "113px", overflow: "hidden" }}>
                  <div style={{ transform: "scale(0.1)", transformOrigin: "top left", pointerEvents: "none" }}>
                    {docData && <d.Component data={docData} colorScheme={colorScheme} />}
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#525252", marginTop: "0.3rem" }}>{d.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3.5: color-combo picker - lets a dealer keep a design's layout but match it to their own branding colors */}
      {docType && formReady && designId && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>Pick a color combo</div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {COLOR_SCHEMES.map(cs => (
              <button
                key={cs.id}
                onClick={() => setColorSchemeId(cs.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.4rem 0.7rem", borderRadius: "8px",
                  border: colorSchemeId === cs.id ? "2px solid #F47B20" : "1.5px solid #E5E5E5",
                  background: "#fff", cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", borderRadius: "50%", overflow: "hidden", width: "18px", height: "18px", border: "1px solid #E5E5E5" }}>
                  <span style={{ flex: 1, background: cs.accent }} />
                  <span style={{ flex: 1, background: cs.text }} />
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#525252" }}>{cs.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: preview + download */}
      {docData && activeDesign && (
        <div>
          <div style={stepLabelStyle}>{needsForm ? "4" : "3"}. Preview & download</div>
          <DocumentPreviewLightbox getElements={() => [docRef.current]}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem", padding: "1.5rem", background: "#FAFAFA", borderRadius: "12px", overflowX: "auto" }}>
            <div style={{ transform: "scale(0.55)", transformOrigin: "top center" }}>
              <div ref={docRef}>
                <activeDesign.Component data={docData} colorScheme={colorScheme} />
              </div>
            </div>
          </div>
          </DocumentPreviewLightbox>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => handleDownload("jpg")} disabled={downloading !== null} style={downloadButtonStyle(false)}>
              {downloading === "jpg" ? "Generating…" : "Download JPG"}
            </button>
            <button onClick={() => handleDownload("pdf")} disabled={downloading !== null} style={downloadButtonStyle(true)}>
              {downloading === "pdf" ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const stepLabelStyle: CSSProperties = {
  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
  color: "#A3A3A3", marginBottom: "0.6rem",
};

const inputStyle: CSSProperties = {
  flex: 1, padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1.5px solid #E5E5E5",
  fontSize: "0.85rem", fontFamily: "var(--font-body, inherit)",
};

function choiceButtonStyle(active: boolean): CSSProperties {
  return {
    padding: "0.75rem 1.1rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem",
    cursor: "pointer", border: active ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
    background: active ? "#FFF7ED" : "#fff", color: active ? "#F47B20" : "#525252",
  };
}

function designThumbStyle(active: boolean): CSSProperties {
  return {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0.5rem", borderRadius: "10px", cursor: "pointer",
    border: active ? "2px solid #F47B20" : "1.5px solid #E5E5E5",
    background: "#fff", width: "104px",
  };
}

function downloadButtonStyle(primary: boolean): CSSProperties {
  return {
    flex: 1, padding: "0.8rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem",
    cursor: "pointer", border: "none",
    background: primary ? "#1A1A1A" : "#F47B20", color: "#fff",
  };
}

const removeButtonStyle: CSSProperties = {
  width: "32px", height: "32px", borderRadius: "8px", border: "1.5px solid #FECACA",
  background: "#FEF2F2", color: "#DC2626", fontSize: "1.1rem", cursor: "pointer", flexShrink: 0,
};

const addItemButtonStyle: CSSProperties = {
  alignSelf: "flex-start", background: "none", border: "1.5px dashed #F47B20", color: "#F47B20",
  borderRadius: "8px", padding: "0.4rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
};
