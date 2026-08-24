"use client";

/**
 * Marketing materials: Complimentary Cards (business cards) and
 * Flyers. Complimentary cards use the same CR80 card proportions as
 * ID cards (337.5px x 212.5px); flyers are A4-proportioned
 * (794x1123px) since they're meant to promote a specific vehicle in
 * more visual detail than a card allows.
 *
 * Same inline-style-object approach as every other Design Studio
 * template - html2canvas's DOM clone doesn't reliably resolve scoped
 * CSS classes during capture.
 */

export interface ComplimentaryCardData {
  companyName: string;
  companyLogo: string | null;
  qrCode: string | null;
  personName?: string;
  personRole?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
}

export interface FlyerCarData {
  companyName: string;
  companyLogo: string | null;
  qrCode: string | null;
  companyPhone?: string;
  companyCity?: string;
  companyState?: string;
  carImage: string | null;
  carBrand: string;
  carModel: string;
  carYear: string | number;
  carPrice: number;
  carCondition?: string;
  carMileage?: string;
  carTransmission?: string;
  carFuelType?: string;
  headline?: string;
}

const CARD_W = 337.5;
const CARD_H = 212.5;
const PAGE_W = 794;
const PAGE_H = 1123;

const fmtNaira = (n: number) => `NGN ${(n || 0).toLocaleString()}`;

const poweredByCard = (dark: boolean) => (
  <div style={{
    position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
    fontSize: 6, letterSpacing: "0.04em", color: dark ? "rgba(255,255,255,0.35)" : "#C4C4C4",
    fontFamily: "Arial, sans-serif",
  }}>
    Powered by UASE TECH STUDIO
  </div>
);

const poweredByPage = (dark: boolean) => (
  <div style={{
    position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center",
    fontSize: 8, letterSpacing: "0.04em", color: dark ? "rgba(255,255,255,0.4)" : "#C4C4C4",
    fontFamily: "Arial, sans-serif",
  }}>
    Powered by UASE TECH STUDIO
  </div>
);

// ── Complimentary Cards ──────────────────────────────────────────

export function ComplimentaryCardOrange({ data }: { data: ComplimentaryCardData }) {
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#F47B20", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.08), transparent)" }} />
      <div style={{ position: "absolute", left: 20, top: 20, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, objectFit: "contain" }} />}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 20, top: 90 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.85)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{data.personRole}</div>}
        </div>
      )}
      <div style={{ position: "absolute", left: 20, bottom: 22, fontSize: 7.5, color: "#fff", lineHeight: 1.7 }}>
        {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
        {(data.companyCity || data.companyState) && <div>{[data.companyCity, data.companyState].filter(Boolean).join(", ")}</div>}
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 16, bottom: 16, width: 44, height: 44, background: "#fff", padding: 3, borderRadius: 4 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(true)}
    </div>
  );
}

export function ComplimentaryCardWhite({ data }: { data: ComplimentaryCardData }) {
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #E5E5E5" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: "#F47B20" }} />
      <div style={{ position: "absolute", left: 26, top: 22, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, objectFit: "contain" }} />}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 26, top: 92 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: "#F47B20", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{data.personRole}</div>}
        </div>
      )}
      <div style={{ position: "absolute", left: 26, bottom: 22, fontSize: 7.5, color: "#737373", lineHeight: 1.7 }}>
        {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 16, bottom: 16, width: 42, height: 42, border: "1px solid #E5E5E5", borderRadius: 4, padding: 2 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export const COMPLIMENTARY_CARD_DESIGNS = [
  { id: "orange", name: "Orange", Component: ComplimentaryCardOrange },
  { id: "white", name: "White", Component: ComplimentaryCardWhite },
];

// ── Flyers ────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E5E5E5", fontSize: 10 }}>
      <span style={{ color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{label}</span>
      <span style={{ color: "#1A1A1A", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

export function FlyerBold({ data }: { data: FlyerCarData }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", overflow: "hidden" }}>
      <div style={{ position: "relative", width: "100%", height: 420, background: "#E5E5E5" }}>
        {data.carImage && <img src={data.carImage} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140, background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
        <div style={{ position: "absolute", left: 40, bottom: 24, color: "#fff" }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{data.carBrand} {data.carModel}</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{data.carYear}{data.carCondition ? ` · ${data.carCondition}` : ""}</div>
        </div>
        <div style={{ position: "absolute", right: 30, top: 30, background: "#F47B20", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 20, fontWeight: 700 }}>
          {fmtNaira(data.carPrice)}
        </div>
      </div>

      <div style={{ padding: "30px 40px 0" }}>
        {data.headline && <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 14 }}>{data.headline}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 30px" }}>
          <SpecRow label="Mileage" value={data.carMileage} />
          <SpecRow label="Transmission" value={data.carTransmission} />
          <SpecRow label="Fuel Type" value={data.carFuelType} />
          <SpecRow label="Condition" value={data.carCondition} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#1A1A1A", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain" }} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{[data.companyPhone, [data.companyCity, data.companyState].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        {data.qrCode && (
          <div style={{ width: 50, height: 50, background: "#fff", padding: 3, borderRadius: 4 }}>
            <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
      </div>
    </div>
  );
}

export function FlyerClean({ data }: { data: FlyerCarData }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        </div>
        {data.qrCode && <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
      </div>

      <div style={{ padding: "20px 40px 0", textAlign: "center" }}>
        {data.headline && <div style={{ fontSize: 12, fontWeight: 700, color: "#F47B20", textTransform: "uppercase", letterSpacing: "0.1em" }}>{data.headline}</div>}
        <div style={{ fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginTop: 6 }}>{data.carBrand} {data.carModel}</div>
        <div style={{ fontSize: 13, color: "#737373", marginTop: 2 }}>{data.carYear}</div>
      </div>

      <div style={{ padding: "20px 60px 0" }}>
        <div style={{ width: "100%", height: 360, borderRadius: 12, overflow: "hidden", background: "#F5F5F5" }}>
          {data.carImage && <img src={data.carImage} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{ display: "inline-block", background: "#F47B20", color: "#fff", padding: "12px 30px", borderRadius: 10, fontSize: 22, fontWeight: 700 }}>
          {fmtNaira(data.carPrice)}
        </div>
      </div>

      <div style={{ padding: "24px 60px 0", display: "flex", justifyContent: "center", gap: 30, fontSize: 10, color: "#737373" }}>
        {data.carMileage && <span><b style={{ color: "#1A1A1A" }}>{data.carMileage}</b> mileage</span>}
        {data.carTransmission && <span><b style={{ color: "#1A1A1A" }}>{data.carTransmission}</b></span>}
        {data.carFuelType && <span><b style={{ color: "#1A1A1A" }}>{data.carFuelType}</b></span>}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontSize: 10, color: "#A3A3A3" }}>
        {[data.companyPhone, [data.companyCity, data.companyState].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ")}
      </div>
      {poweredByPage(false)}
    </div>
  );
}

export const FLYER_DESIGNS = [
  { id: "bold", name: "Bold", Component: FlyerBold },
  { id: "clean", name: "Clean", Component: FlyerClean },
];
