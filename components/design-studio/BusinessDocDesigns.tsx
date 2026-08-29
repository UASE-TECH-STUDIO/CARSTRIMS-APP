"use client";

import type { ColorScheme } from "./colorSchemes";

/**
 * Business document templates: Letterhead, Proforma Invoice, Receipt.
 * A4-proportioned (unlike the card-sized ID cards) - rendered at
 * 794px x 1123px (A4 at 96dpi), captured via the existing
 * renderElementToPdfBlob/renderElementToJpgBlob, no special export
 * utility needed since these are already full-page documents.
 *
 * Built with inline style objects throughout, same reasoning as the
 * ID card designs - html2canvas's DOM clone doesn't always resolve
 * scoped CSS classes reliably during capture.
 */

export interface BusinessDocData {
  companyName: string;
  companyLogo: string | null;
  qrCode: string | null;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyCity?: string;
  companyState?: string;
  docNumber?: string;
  docDate?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items?: { description: string; qty: number; unitPrice: number }[];
  notes?: string;
  amountPaid?: number;
  paymentMethod?: string;
}

const PAGE_W = 794;
const PAGE_H = 1123;

const fmtNaira = (n: number) => `NGN ${(n || 0).toLocaleString()}`;

const poweredByFooter = (dark: boolean) => (
  <div style={{
    position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center",
    fontSize: 8, letterSpacing: "0.04em", color: dark ? "rgba(255,255,255,0.4)" : "#C4C4C4",
    fontFamily: "Arial, sans-serif",
  }}>
    Powered by UASE TECH STUDIO
  </div>
);

function itemsSubtotal(items?: { qty: number; unitPrice: number }[]) {
  return (items || []).reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
}

// ── Letterhead ───────────────────────────────────────────────────

export function LetterheadClassic({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 6, background: accent }} />
      <div style={{ position: "absolute", left: 60, top: 40, right: 60, display: "flex", alignItems: "center", gap: 16 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, objectFit: "contain" }} />}
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
          <div style={{ fontSize: 10, color: "#737373", marginTop: 4 }}>
            {[data.companyAddress, [data.companyCity, data.companyState].filter(Boolean).join(", ")].filter(Boolean).join(" — ")}
          </div>
          <div style={{ fontSize: 10, color: "#737373" }}>
            {[data.companyPhone, data.companyEmail].filter(Boolean).join("  ·  ")}
          </div>
        </div>
        {data.qrCode && <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: "contain", marginLeft: "auto" }} />}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 130, height: 1.5, background: "#1A1A1A" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, height: 4, background: accent }} />
      {poweredByFooter(false)}
    </div>
  );
}

export function LetterheadMinimal({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#E5E5E5";
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ position: "absolute", left: 60, top: 60, display: "flex", flexDirection: "column", gap: 4 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain", marginBottom: 8 }} />}
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.04em" }}>{data.companyName}</div>
        <div style={{ fontSize: 9.5, color: "#A3A3A3" }}>
          {[data.companyAddress, [data.companyCity, data.companyState].filter(Boolean).join(", "), data.companyPhone, data.companyEmail].filter(Boolean).join("   ")}
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 150, height: 1.5, background: accent }} />
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 50, height: 50 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function LetterheadDark({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  const text = colorScheme?.text || "#C9A84C";
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ background: "#1A1A1A", padding: "40px 60px", display: "flex", alignItems: "center", gap: 16 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: "contain" }} />}
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
            {[data.companyAddress, [data.companyCity, data.companyState].filter(Boolean).join(", "), data.companyPhone, data.companyEmail].filter(Boolean).join("   ")}
          </div>
        </div>
        {data.qrCode && <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain", marginLeft: "auto" }} />}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 122, height: 4, background: `linear-gradient(90deg, ${accent}, ${text})` }} />
      {poweredByFooter(false)}
    </div>
  );
}

export function LetterheadSidebar({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: accent }} />
      <div style={{ position: "absolute", left: 50, top: 50, display: "flex", flexDirection: "column", gap: 6 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
        <div style={{ fontSize: 19, fontWeight: 700, color: "#1A1A1A", marginTop: 6 }}>{data.companyName}</div>
        <div style={{ fontSize: 9.5, color: "#737373", lineHeight: 1.6 }}>
          <div>{data.companyAddress}</div>
          <div>{[data.companyCity, data.companyState].filter(Boolean).join(", ")}</div>
          <div>{[data.companyPhone, data.companyEmail].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 50, top: 50, width: 46, height: 46 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: 50, right: 50, top: 150, height: 1, background: "#E5E5E5" }} />
      {poweredByFooter(false)}
    </div>
  );
}

export function LetterheadElegantGold({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#C9A84C";
  const text = colorScheme?.text || "#8A7539";
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#FCFCFB", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 44 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 46, height: 46, objectFit: "contain" }} />}
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 8 }}>{data.companyName}</div>
        <div style={{ width: 40, height: 1.5, background: accent, marginTop: 8 }} />
        <div style={{ fontSize: 9, color: text, marginTop: 8 }}>
          {[data.companyAddress, [data.companyCity, data.companyState].filter(Boolean).join(", "), data.companyPhone, data.companyEmail].filter(Boolean).join("   ·   ")}
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 44, height: 44 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

// ── Proforma Invoice ─────────────────────────────────────────────

function ProformaHeader({ data, accent }: { data: BusinessDocData; accent: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
          <div style={{ fontSize: 8.5, color: "#737373", marginTop: 2 }}>
            {[data.companyAddress, [data.companyCity, data.companyState].filter(Boolean).join(", ")].filter(Boolean).join(", ")}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: accent, letterSpacing: "0.05em" }}>PROFORMA INVOICE</div>
        <div style={{ fontSize: 9, color: "#737373", marginTop: 4 }}>No: {data.docNumber || "—"}</div>
        <div style={{ fontSize: 9, color: "#737373" }}>Date: {data.docDate || "—"}</div>
      </div>
    </div>
  );
}

function ItemsTable({ items, accent }: { items?: BusinessDocData["items"]; accent: string }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
      <thead>
        <tr style={{ background: accent, color: "#fff" }}>
          <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700 }}>Description</th>
          <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700, width: 50 }}>Qty</th>
          <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700, width: 100 }}>Unit Price</th>
          <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700, width: 110 }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {(items || []).map((item, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #E5E5E5" }}>
            <td style={{ padding: "8px 10px", color: "#1A1A1A" }}>{item.description}</td>
            <td style={{ padding: "8px 10px", textAlign: "center", color: "#525252" }}>{item.qty}</td>
            <td style={{ padding: "8px 10px", textAlign: "right", color: "#525252" }}>{fmtNaira(item.unitPrice)}</td>
            <td style={{ padding: "8px 10px", textAlign: "right", color: "#1A1A1A", fontWeight: 700 }}>{fmtNaira(item.qty * item.unitPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ProformaClassic({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", paddingTop: 50 }}>
      <ProformaHeader data={data} accent={accent} />
      <div style={{ padding: "24px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Prepared For</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        <div style={{ fontSize: 9.5, color: "#737373" }}>{[data.customerPhone, data.customerAddress].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ width: 220 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "2px solid #1A1A1A", fontSize: 12, fontWeight: 700 }}>
              <span>Total</span><span>{fmtNaira(total)}</span>
            </div>
          </div>
        </div>
        {data.notes && (
          <div style={{ marginTop: 24, fontSize: 9, color: "#737373", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Notes</div>
            {data.notes}
          </div>
        )}
        <div style={{ marginTop: 24, fontSize: 8.5, color: "#A3A3A3", fontStyle: "italic" }}>
          This is a proforma invoice, not a demand for payment. Prices are valid for 7 days from the date above.
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 46, height: 46 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ProformaDark({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const text = colorScheme?.text || "#C9A84C";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ background: "#1A1A1A", padding: "40px 60px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
            <div style={{ fontSize: 15, fontWeight: 700 }}>{data.companyName}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: text, letterSpacing: "0.05em" }}>PROFORMA INVOICE</div>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>No: {data.docNumber || "—"} · {data.docDate || "—"}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Prepared For</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        <div style={{ fontSize: 9.5, color: "#737373" }}>{[data.customerPhone, data.customerAddress].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <ItemsTable items={data.items} accent="#1A1A1A" />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ width: 220, background: "#1A1A1A", color: "#fff", padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
            <span>Total</span><span style={{ color: text }}>{fmtNaira(total)}</span>
          </div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 46, height: 46 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ProformaMinimal({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#1A1A1A";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", paddingTop: 50 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 60px" }}>
        <div>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: "contain", marginBottom: 8 }} />}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.1em" }}>PROFORMA</div>
          <div style={{ fontSize: 8.5, color: "#A3A3A3", marginTop: 4 }}>{data.docNumber || "—"} · {data.docDate || "—"}</div>
        </div>
      </div>
      <div style={{ margin: "24px 60px 0", height: 1.5, background: accent }} />
      <div style={{ padding: "20px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>To</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        <div style={{ fontSize: 9.5, color: "#737373" }}>{[data.customerPhone, data.customerAddress].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>Total: {fmtNaira(total)}</div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 40, height: 40 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ProformaGreenAccent({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#16A34A";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 8, background: accent }} />
      <ProformaHeader data={data} accent={accent} />
      <div style={{ padding: "36px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Prepared For</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        <div style={{ fontSize: 9.5, color: "#737373" }}>{[data.customerPhone, data.customerAddress].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ width: 220, background: "#FAFAFA", border: `1.5px solid ${accent}`, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: accent }}>
            <span>Total</span><span>{fmtNaira(total)}</span>
          </div>
        </div>
        {data.notes && (
          <div style={{ marginTop: 24, fontSize: 9, color: "#737373", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Notes</div>
            {data.notes}
          </div>
        )}
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 46, height: 46 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ProformaElegantGold({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#C9A84C";
  const text = colorScheme?.text || "#8A7539";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#FCFCFB", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ padding: "44px 60px 0", textAlign: "center" }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.06em", marginTop: 6 }}>{data.companyName}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: accent, letterSpacing: "0.1em", marginTop: 14 }}>PROFORMA INVOICE</div>
        <div style={{ fontSize: 8.5, color: text, marginTop: 4 }}>{data.docNumber || "—"} · {data.docDate || "—"}</div>
      </div>
      <div style={{ padding: "26px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: text, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Prepared For</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        <div style={{ fontSize: 9.5, color: "#737373" }}>{[data.customerPhone, data.customerAddress].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ padding: "20px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ width: 220, borderTop: `2px solid ${accent}`, padding: "8px 0", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            <span>Total</span><span>{fmtNaira(total)}</span>
          </div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 44, height: 44, border: `1px solid ${accent}`, borderRadius: 4, padding: 2 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

// ── Receipt ──────────────────────────────────────────────────────

export function ReceiptClassic({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#16A34A";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", paddingTop: 50 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
            <div style={{ fontSize: 8.5, color: "#737373", marginTop: 2 }}>{[data.companyPhone, data.companyEmail].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: accent, letterSpacing: "0.05em" }}>RECEIPT</div>
          <div style={{ fontSize: 9, color: "#737373", marginTop: 4 }}>No: {data.docNumber || "—"}</div>
          <div style={{ fontSize: 9, color: "#737373" }}>Date: {data.docDate || "—"}</div>
        </div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Received From</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        <div style={{ fontSize: 9.5, color: "#737373" }}>{data.customerPhone}</div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ width: 240 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 10, color: "#525252" }}>
              <span>Total</span><span>{fmtNaira(total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `2px solid ${accent}`, fontSize: 12, fontWeight: 700, color: accent }}>
              <span>Amount Paid</span><span>{fmtNaira(data.amountPaid ?? total)}</span>
            </div>
            {data.paymentMethod && (
              <div style={{ fontSize: 9, color: "#A3A3A3", textAlign: "right", marginTop: 4 }}>via {data.paymentMethod}</div>
            )}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, bottom: 100, fontSize: 8.5, color: "#A3A3A3", fontStyle: "italic" }}>
        Thank you for your business.
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 90, width: 46, height: 46 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ReceiptStamped({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#16A34A";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", border: `2px solid ${accent}` }}>
      <div style={{ padding: "40px 60px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
          </div>
          <div style={{
            border: `3px solid ${accent}`, borderRadius: "50%", width: 90, height: 90,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            transform: "rotate(-8deg)", color: accent,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>PAID</div>
            <div style={{ fontSize: 7, marginTop: 2 }}>{data.docDate || ""}</div>
          </div>
        </div>
        <div style={{ marginTop: 20, fontSize: 9, color: "#737373" }}>Receipt No: {data.docNumber || "—"}</div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Received From</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        </div>
        <div style={{ marginTop: 20 }}>
          <ItemsTable items={data.items} accent={accent} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <div style={{ width: 220, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: accent }}>
              <span>Amount Paid</span><span>{fmtNaira(data.amountPaid ?? total)}</span>
            </div>
          </div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 46, height: 46 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ReceiptMinimal({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#1A1A1A";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", paddingTop: 50 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 60px" }}>
        <div>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: "contain", marginBottom: 8 }} />}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.1em" }}>RECEIPT</div>
          <div style={{ fontSize: 8.5, color: "#A3A3A3", marginTop: 4 }}>{data.docNumber || "—"} · {data.docDate || "—"}</div>
        </div>
      </div>
      <div style={{ margin: "24px 60px 0", height: 1.5, background: accent }} />
      <div style={{ padding: "20px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Received From</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>Amount Paid: {fmtNaira(data.amountPaid ?? total)}</div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 40, height: 40 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ReceiptBlue({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#1E4E8C";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ background: accent, padding: "36px 60px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 38, height: 38, objectFit: "contain" }} />}
            <div style={{ fontSize: 15, fontWeight: 700 }}>{data.companyName}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.06em" }}>RECEIPT</div>
            <div style={{ fontSize: 8.5, opacity: 0.8, marginTop: 4 }}>{data.docNumber || "—"} · {data.docDate || "—"}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Received From</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
        <div style={{ fontSize: 9.5, color: "#737373" }}>{data.customerPhone}</div>
      </div>
      <div style={{ padding: "24px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ width: 220, background: accent, color: "#fff", padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
            <span>Amount Paid</span><span>{fmtNaira(data.amountPaid ?? total)}</span>
          </div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 44, height: 44 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export function ReceiptElegantGold({ data, colorScheme }: { data: BusinessDocData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#C9A84C";
  const text = colorScheme?.text || "#8A7539";
  const total = itemsSubtotal(data.items);
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#FCFCFB", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ padding: "44px 60px 0", textAlign: "center" }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.06em", marginTop: 6 }}>{data.companyName}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: accent, letterSpacing: "0.1em", marginTop: 14 }}>RECEIPT</div>
        <div style={{ fontSize: 8.5, color: text, marginTop: 4 }}>{data.docNumber || "—"} · {data.docDate || "—"}</div>
      </div>
      <div style={{ padding: "26px 60px 0" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: text, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Received From</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.customerName || "—"}</div>
      </div>
      <div style={{ padding: "20px 60px 0" }}>
        <ItemsTable items={data.items} accent={accent} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <div style={{ borderTop: `2px solid ${accent}`, padding: "8px 0", fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            Amount Paid: {fmtNaira(data.amountPaid ?? total)}
          </div>
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 60, bottom: 60, width: 44, height: 44, border: `1px solid ${accent}`, borderRadius: 4, padding: 2 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByFooter(false)}
    </div>
  );
}

export const LETTERHEAD_DESIGNS = [
  { id: "classic", name: "Classic", Component: LetterheadClassic },
  { id: "minimal", name: "Minimal", Component: LetterheadMinimal },
  { id: "dark", name: "Dark", Component: LetterheadDark },
  { id: "sidebar", name: "Sidebar", Component: LetterheadSidebar },
  { id: "elegant-gold", name: "Elegant Gold", Component: LetterheadElegantGold },
];

export const PROFORMA_DESIGNS = [
  { id: "classic", name: "Classic", Component: ProformaClassic },
  { id: "dark", name: "Dark Header", Component: ProformaDark },
  { id: "minimal", name: "Minimal", Component: ProformaMinimal },
  { id: "green-accent", name: "Green Accent", Component: ProformaGreenAccent },
  { id: "elegant-gold", name: "Elegant Gold", Component: ProformaElegantGold },
];

export const RECEIPT_DESIGNS = [
  { id: "classic", name: "Classic", Component: ReceiptClassic },
  { id: "stamped", name: "Paid Stamp", Component: ReceiptStamped },
  { id: "minimal", name: "Minimal", Component: ReceiptMinimal },
  { id: "blue", name: "Blue Professional", Component: ReceiptBlue },
  { id: "elegant-gold", name: "Elegant Gold", Component: ReceiptElegantGold },
];
