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

import type { ColorScheme } from "./colorSchemes";

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

export type { ColorScheme } from "./colorSchemes";
export { COLOR_SCHEMES } from "./colorSchemes";

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

export function ComplimentaryCardOrange({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  const text = colorScheme?.text || "rgba(255,255,255,0.85)";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: accent, fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.08), transparent)" }} />
      <div style={{ position: "absolute", left: 20, top: 20, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, objectFit: "contain" }} />}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 20, top: 90 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: text, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{data.personRole}</div>}
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

export function ComplimentaryCardOrangeBack({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: accent, fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.08), transparent)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {data.companyLogo
          ? <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 50, height: 50, objectFit: "contain" }} />
          : <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
        }
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.85)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          Buy &bull; Sell &bull; Trust
        </div>
        {(data.companyCity || data.companyState) && (
          <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.7)" }}>{[data.companyCity, data.companyState].filter(Boolean).join(", ")}</div>
        )}
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 16, bottom: 16, width: 40, height: 40, background: "#fff", padding: 3, borderRadius: 4 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(true)}
    </div>
  );
}


export function ComplimentaryCardWhite({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #E5E5E5" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: accent }} />
      <div style={{ position: "absolute", left: 26, top: 22, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, objectFit: "contain" }} />}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 26, top: 92 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: accent, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{data.personRole}</div>}
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

export function ComplimentaryCardWhiteBack({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #E5E5E5" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: accent }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, paddingLeft: 8 }}>
        {data.companyLogo
          ? <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />
          : <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        }
        <div style={{ fontSize: 7.5, color: accent, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          Buy &bull; Sell &bull; Trust
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 16, bottom: 16, width: 40, height: 40, border: "1px solid #E5E5E5", borderRadius: 4, padding: 2 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export function ComplimentaryCardDarkGold({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  const text = colorScheme?.text || "#C9A84C";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#1A1A1A", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.25)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${text})` }} />
      <div style={{ position: "absolute", left: 20, top: 20, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, objectFit: "contain" }} />}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 20, top: 90 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: text, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{data.personRole}</div>}
        </div>
      )}
      <div style={{ position: "absolute", left: 20, bottom: 22, fontSize: 7.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
        {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
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

export function ComplimentaryCardDarkGoldBack({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  const text = colorScheme?.text || "#C9A84C";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#1A1A1A", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.25)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${text})` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {data.companyLogo
          ? <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: "contain" }} />
          : <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
        }
        <div style={{ fontSize: 8, color: text, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          Buy &bull; Sell &bull; Trust
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 16, bottom: 16, width: 40, height: 40, background: "#fff", padding: 3, borderRadius: 4 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(true)}
    </div>
  );
}

export function ComplimentaryCardMinimalLine({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#525252";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 4 }}>
      <div style={{ position: "absolute", left: 22, top: 22, display: "flex", alignItems: "center", gap: 6 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 16, height: 16, objectFit: "contain" }} />}
        <div style={{ fontSize: 8, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.1em", textTransform: "uppercase" }}>{data.companyName}</div>
      </div>
      <div style={{ position: "absolute", left: 22, right: 22, top: 44, height: 1, background: "#E5E5E5" }} />
      {data.personName && (
        <div style={{ position: "absolute", left: 22, top: 90 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: accent, marginTop: 3, fontWeight: 700 }}>{data.personRole}</div>}
        </div>
      )}
      <div style={{ position: "absolute", left: 22, bottom: 22, fontSize: 7, color: "#A3A3A3", lineHeight: 1.7 }}>
        {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 22, bottom: 22, width: 38, height: 38 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export function ComplimentaryCardMinimalLineBack({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#525252";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 4 }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {data.companyLogo
          ? <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />
          : <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.1em", textTransform: "uppercase" }}>{data.companyName}</div>
        }
        <div style={{ width: 30, height: 1, background: "#E5E5E5" }} />
        <div style={{ fontSize: 7, color: accent, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          Buy &bull; Sell &bull; Trust
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 22, bottom: 22, width: 34, height: 34 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export function ComplimentaryCardSplit({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "38%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: "contain" }} />}
      </div>
      <div style={{ position: "absolute", left: "42%", top: 18, right: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        {data.personName && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginTop: 16 }}>{data.personName}</div>
            {data.personRole && <div style={{ fontSize: 7.5, color: accent, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{data.personRole}</div>}
          </>
        )}
      </div>
      <div style={{ position: "absolute", left: "42%", bottom: 20, fontSize: 7, color: "#737373", lineHeight: 1.6 }}>
        {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 14, bottom: 14, width: 36, height: 36 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export function ComplimentaryCardSplitBack({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "38%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
      </div>
      <div style={{ position: "absolute", left: "42%", top: 0, bottom: 0, right: 16, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        <div style={{ fontSize: 7.5, color: accent, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Buy &bull; Sell &bull; Trust</div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 14, bottom: 14, width: 36, height: 36 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

// ── Customizable (color-combo picker) front + back ─────────────────

export function ComplimentaryCardCustom({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme: ColorScheme }) {
  const { accent, text } = colorScheme;
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: accent, fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 4, background: text }} />
      <div style={{ position: "absolute", left: 20, top: 24, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, objectFit: "contain" }} />}
        <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 20, top: 94 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: text, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{data.personRole}</div>}
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

export function ComplimentaryCardCustomBack({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme: ColorScheme }) {
  const { accent, text } = colorScheme;
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8, border: `1.5px solid ${accent}` }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 6, background: accent }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {data.companyLogo
          ? <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 52, height: 52, objectFit: "contain" }} />
          : <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{data.companyName}</div>
        }
        <div style={{ fontSize: 8.5, color: "#525252", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          Buy &bull; Sell &bull; Trust
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 16, bottom: 16, width: 36, height: 36 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export function ComplimentaryCardDiagonal({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: -60, top: -20, width: 220, height: CARD_H + 80, background: accent, transform: "rotate(-9deg)", transformOrigin: "top left" }} />
      <div style={{ position: "absolute", left: 16, top: 20, width: 70 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
      </div>
      <div style={{ position: "absolute", left: 140, top: 20, right: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.04em" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 140, top: 88 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 7.5, color: accent, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{data.personRole}</div>}
        </div>
      )}
      <div style={{ position: "absolute", left: 140, bottom: 20, fontSize: 7, color: "#737373", lineHeight: 1.6 }}>
        {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 14, bottom: 14, width: 34, height: 34 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export function ComplimentaryCardBottomBanner({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8 }}>
      <div style={{ position: "absolute", left: 20, top: 22, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, objectFit: "contain" }} />}
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.04em" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 20, top: 70 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 8, color: accent, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{data.personRole}</div>}
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 46, background: accent, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
        <div style={{ fontSize: 7, color: "#fff", lineHeight: 1.5 }}>
          {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {data.qrCode && (
          <div style={{ width: 34, height: 34, background: "#fff", padding: 2, borderRadius: 3, flexShrink: 0 }}>
            <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
      </div>
      {poweredByCard(true)}
    </div>
  );
}

export function ComplimentaryCardCenteredBadge({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#1A1A1A";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8, border: `1px solid ${accent}` }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 20px" }}>
        {data.companyLogo ? (
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: "80%", height: "80%", objectFit: "contain" }} />
          </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{data.companyName}</div>
        )}
        {data.personName && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginTop: 6, textAlign: "center" }}>{data.personName}</div>
            {data.personRole && <div style={{ fontSize: 7.5, color: accent, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{data.personRole}</div>}
          </>
        )}
        <div style={{ fontSize: 7, color: "#737373", lineHeight: 1.5, textAlign: "center", marginTop: 4 }}>
          {[data.companyPhone, data.companyEmail].filter(Boolean).join(" | ")}
        </div>
      </div>
      {data.qrCode && (
        <div style={{ position: "absolute", right: 12, bottom: 12, width: 30, height: 30 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      {poweredByCard(false)}
    </div>
  );
}

export function ComplimentaryCardCornerAccent({ data, colorScheme }: { data: ComplimentaryCardData; colorScheme?: ColorScheme }) {
  const accent = colorScheme?.accent || "#F47B20";
  return (
    <div style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", background: "#ffffff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8 }}>
      <div style={{ position: "absolute", right: -45, top: -45, width: 90, height: 90, background: accent, transform: "rotate(45deg)" }} />
      {data.qrCode && (
        <div style={{ position: "absolute", right: 10, top: 10, width: 26, height: 26 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: 20, top: 22, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, objectFit: "contain" }} />}
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
      </div>
      {data.personName && (
        <div style={{ position: "absolute", left: 20, top: 100 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{data.personName}</div>
          {data.personRole && <div style={{ fontSize: 7.5, color: accent, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{data.personRole}</div>}
        </div>
      )}
      <div style={{ position: "absolute", left: 20, bottom: 20, fontSize: 7, color: "#737373", lineHeight: 1.6 }}>
        {[data.companyPhone, data.companyEmail].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {poweredByCard(false)}
    </div>
  );
}

export const COMPLIMENTARY_CARD_DESIGNS = [
  { id: "orange", name: "Orange", Component: ComplimentaryCardOrange },
  { id: "white", name: "White", Component: ComplimentaryCardWhite },
  { id: "dark-gold", name: "Dark Gold", Component: ComplimentaryCardDarkGold },
  { id: "minimal-line", name: "Minimal Line", Component: ComplimentaryCardMinimalLine },
  { id: "split", name: "Split", Component: ComplimentaryCardSplit },
  { id: "diagonal", name: "Diagonal Cut", Component: ComplimentaryCardDiagonal },
  { id: "bottom-banner", name: "Bottom Banner", Component: ComplimentaryCardBottomBanner },
  { id: "centered-badge", name: "Centered Badge", Component: ComplimentaryCardCenteredBadge },
  { id: "corner-accent", name: "Corner Accent", Component: ComplimentaryCardCornerAccent },
  { id: "custom", name: "Custom Colors", Component: ComplimentaryCardCustom, customizable: true, hasBack: true },
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

export function FlyerSplit({ data }: { data: FlyerCarData }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", display: "flex" }}>
      <div style={{ width: "44%", height: "100%", background: "#F5F5F5", position: "relative" }}>
        {data.carImage && <img src={data.carImage} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1, padding: "50px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, objectFit: "contain" }} />}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        </div>
        {data.headline && <div style={{ fontSize: 11, fontWeight: 700, color: "#F47B20", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 30 }}>{data.headline}</div>}
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginTop: 8, lineHeight: 1.2 }}>{data.carBrand} {data.carModel}</div>
        <div style={{ fontSize: 12, color: "#737373", marginTop: 2 }}>{data.carYear}{data.carCondition ? ` · ${data.carCondition}` : ""}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#F47B20", marginTop: 20 }}>{fmtNaira(data.carPrice)}</div>
        <div style={{ marginTop: 24 }}>
          <SpecRow label="Mileage" value={data.carMileage} />
          <SpecRow label="Transmission" value={data.carTransmission} />
          <SpecRow label="Fuel Type" value={data.carFuelType} />
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 9.5, color: "#A3A3A3" }}>{[data.companyPhone, [data.companyCity, data.companyState].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</div>
          {data.qrCode && (
            <div style={{ width: 44, height: 44 }}>
              <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlyerDarkLuxury({ data }: { data: FlyerCarData }) {
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#1A1A1A", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, background: "linear-gradient(90deg, #F47B20, #C9A84C)" }} />
      <div style={{ padding: "34px 40px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, objectFit: "contain" }} />}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{data.companyName}</div>
        </div>
        {data.qrCode && (
          <div style={{ width: 38, height: 38, background: "#fff", padding: 2, borderRadius: 4 }}>
            <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
      </div>
      <div style={{ padding: "16px 60px 0", textAlign: "center" }}>
        {data.headline && <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.12em" }}>{data.headline}</div>}
        <div style={{ fontSize: 27, fontWeight: 700, color: "#fff", marginTop: 8 }}>{data.carBrand} {data.carModel}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{data.carYear}</div>
      </div>
      <div style={{ padding: "20px 60px 0" }}>
        <div style={{ width: "100%", height: 380, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          {data.carImage && <img src={data.carImage} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{ display: "inline-block", border: "2px solid #C9A84C", color: "#C9A84C", padding: "10px 28px", borderRadius: 10, fontSize: 20, fontWeight: 700 }}>
          {fmtNaira(data.carPrice)}
        </div>
      </div>
      <div style={{ padding: "22px 60px 0", display: "flex", justifyContent: "center", gap: 26, fontSize: 9.5, color: "rgba(255,255,255,0.55)" }}>
        {data.carMileage && <span>{data.carMileage}</span>}
        {data.carTransmission && <span>{data.carTransmission}</span>}
        {data.carFuelType && <span>{data.carFuelType}</span>}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontSize: 9.5, color: "rgba(255,255,255,0.4)" }}>
        {[data.companyPhone, [data.companyCity, data.companyState].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ")}
      </div>
      {poweredByPage(true)}
    </div>
  );
}

export function FlyerGridSpecs({ data }: { data: FlyerCarData }) {
  const specs = [
    ["Mileage", data.carMileage], ["Transmission", data.carTransmission],
    ["Fuel Type", data.carFuelType], ["Condition", data.carCondition],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, position: "relative", background: "#fff", fontFamily: "Arial, sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data.companyLogo && <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, objectFit: "contain" }} />}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{data.companyName}</div>
        </div>
        {data.headline && <div style={{ fontSize: 10, fontWeight: 700, color: "#F47B20", textTransform: "uppercase", letterSpacing: "0.08em" }}>{data.headline}</div>}
      </div>
      <div style={{ padding: "16px 40px 0" }}>
        <div style={{ width: "100%", height: 340, borderRadius: 10, overflow: "hidden", background: "#F5F5F5" }}>
          {data.carImage && <img src={data.carImage} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
      </div>
      <div style={{ padding: "20px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A" }}>{data.carBrand} {data.carModel}</div>
          <div style={{ fontSize: 12, color: "#737373" }}>{data.carYear}</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#F47B20" }}>{fmtNaira(data.carPrice)}</div>
      </div>
      <div style={{ padding: "24px 40px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {specs.map(([label, value]) => (
          <div key={label} style={{ border: "1px solid #E5E5E5", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 8, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 12, color: "#1A1A1A", fontWeight: 700, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", fontSize: 10, color: "#A3A3A3" }}>
        {[data.companyPhone, [data.companyCity, data.companyState].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ")}
      </div>
      {poweredByPage(false)}
    </div>
  );
}

export const FLYER_DESIGNS = [
  { id: "bold", name: "Bold", Component: FlyerBold },
  { id: "clean", name: "Clean", Component: FlyerClean },
  { id: "split", name: "Split", Component: FlyerSplit },
  { id: "dark-luxury", name: "Dark Luxury", Component: FlyerDarkLuxury },
  { id: "grid-specs", name: "Grid Specs", Component: FlyerGridSpecs },
];
