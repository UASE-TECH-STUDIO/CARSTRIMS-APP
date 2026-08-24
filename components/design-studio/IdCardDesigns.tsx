"use client";

/**
 * ID card visual designs. Fixed at CR80 card proportions
 * (3.375in x 2.125in) rendered at a base size of 337.5px x 212.5px
 * (100px per inch) - html2canvas captures this at 3x scale
 * (see renderElementToCardPdfBlob), landing at print-appropriate
 * resolution without the source markup needing huge fixed pixel
 * values itself.
 *
 * Deliberately built with inline style objects throughout, not
 * styled-jsx classes - html2canvas's DOM clone doesn't always resolve
 * scoped CSS classes reliably, but inline styles always capture
 * correctly.
 */

export interface IdCardData {
  companyName: string;
  companyLogo: string | null;
  qrCode: string | null;
  personName: string;
  personRole: string;
  personId: string;
  personPhoto: string | null;
  companyCity?: string;
  companyState?: string;
}

const CARD_W = 337.5;
const CARD_H = 212.5;

const poweredBy = (dark: boolean) => (
  <div style={{
    position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
    fontSize: 6, letterSpacing: "0.04em", color: dark ? "rgba(255,255,255,0.35)" : "#C4C4C4",
    fontFamily: "Arial, sans-serif",
  }}>
    Powered by UASE TECH STUDIO
  </div>
);

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

/**
 * Design 1: "Executive" - clean white card, bold left accent bar,
 * logo + name top, circular photo, QR bottom-right for scanning to
 * the dealer's page at any time.
 */
export function IdCardExecutive({ data }: { data: IdCardData }) {
  return (
    <div style={{
      width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden",
      background: "#ffffff", fontFamily: "Arial, sans-serif",
      boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8,
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: "#F47B20" }} />

      <div style={{ position: "absolute", left: 24, top: 14, right: 16, display: "flex", alignItems: "center", gap: 8 }}>
        {data.companyLogo && (
          <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, objectFit: "contain", borderRadius: 4 }} />
        )}
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.02em", lineHeight: 1.2 }}>
          {data.companyName}
        </div>
      </div>

      <div style={{ position: "absolute", left: 24, top: 56, width: 62, height: 62, borderRadius: "50%", overflow: "hidden", background: "#F5F5F5", border: "2px solid #F47B20", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.personPhoto ? (
          <img src={data.personPhoto} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 20, fontWeight: 700, color: "#A3A3A3" }}>{initials(data.personName)}</span>
        )}
      </div>

      <div style={{ position: "absolute", left: 98, top: 62, right: 90 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.25 }}>{data.personName}</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: "#F47B20", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>
          {data.personRole}
        </div>
        <div style={{ fontSize: 7, color: "#737373", marginTop: 6 }}>ID: {data.personId}</div>
        {(data.companyCity || data.companyState) && (
          <div style={{ fontSize: 7, color: "#A3A3A3", marginTop: 2 }}>
            {[data.companyCity, data.companyState].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {data.qrCode && (
        <div style={{ position: "absolute", right: 14, bottom: 18, width: 44, height: 44, background: "#fff", padding: 2, border: "1px solid #E5E5E5", borderRadius: 4 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}

      {poweredBy(false)}
    </div>
  );
}

/**
 * Design 2: "Corporate Dark" - dark charcoal background matching the
 * app's own brand aesthetic, gold/orange accents, centered logo,
 * photo with accent ring.
 */
export function IdCardCorporateDark({ data }: { data: IdCardData }) {
  return (
    <div style={{
      width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden",
      background: "#1A1A1A", fontFamily: "Arial, sans-serif",
      boxShadow: "0 1px 4px rgba(0,0,0,0.3)", borderRadius: 8,
    }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, background: "linear-gradient(90deg, #F47B20, #C9A84C)" }} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {data.companyLogo && (
          <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, objectFit: "contain" }} />
        )}
        <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {data.companyName}
        </div>
      </div>

      <div style={{ position: "absolute", left: 20, top: 62, width: 58, height: 58, borderRadius: "50%", overflow: "hidden", background: "#2A2A2A", border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.personPhoto ? (
          <img src={data.personPhoto} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 700, color: "#C9A84C" }}>{initials(data.personName)}</span>
        )}
      </div>

      <div style={{ position: "absolute", left: 90, top: 66, right: 88 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>{data.personName}</div>
        <div style={{ fontSize: 7.5, fontWeight: 700, color: "#C9A84C", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>
          {data.personRole}
        </div>
        <div style={{ fontSize: 6.5, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>ID: {data.personId}</div>
      </div>

      {data.qrCode && (
        <div style={{ position: "absolute", right: 14, bottom: 18, width: 42, height: 42, background: "#fff", padding: 2, borderRadius: 4 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}

      {poweredBy(true)}
    </div>
  );
}

/**
 * Design 3: "Minimalist Line" - lots of white space, square photo
 * with sharp corners, thin geometric accent line, monochrome with a
 * single accent color. A more understated, modern-minimal look than
 * Executive.
 */
export function IdCardMinimalist({ data }: { data: IdCardData }) {
  return (
    <div style={{
      width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden",
      background: "#ffffff", fontFamily: "Arial, sans-serif",
      boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 4,
    }}>
      <div style={{ position: "absolute", left: 24, right: 24, top: 40, bottom: 0, borderLeft: "1.5px solid #E5E5E5" }} />

      <div style={{ position: "absolute", left: 24, top: 16, display: "flex", alignItems: "center", gap: 6 }}>
        {data.companyLogo && (
          <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 16, height: 16, objectFit: "contain" }} />
        )}
        <div style={{ fontSize: 8, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {data.companyName}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 24, top: 38, height: 2, background: "#1A1A1A" }} />

      <div style={{ position: "absolute", left: 24, top: 56, width: 54, height: 54, background: "#F5F5F5", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.personPhoto ? (
          <img src={data.personPhoto} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 700, color: "#A3A3A3" }}>{initials(data.personName)}</span>
        )}
      </div>

      <div style={{ position: "absolute", left: 90, top: 60, right: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.25 }}>{data.personName}</div>
        <div style={{ fontSize: 8, fontWeight: 600, color: "#525252", letterSpacing: "0.05em", marginTop: 4 }}>
          {data.personRole}
        </div>
        <div style={{ fontSize: 7, color: "#A3A3A3", marginTop: 10 }}>{data.personId}</div>
      </div>

      {data.qrCode && (
        <div style={{ position: "absolute", right: 24, bottom: 16, width: 40, height: 40 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}

      {poweredBy(false)}
    </div>
  );
}

/**
 * Design 4: "Two-Tone Split" - bold horizontal split background,
 * photo overlapping the split line for a dynamic, contemporary look.
 */
export function IdCardTwoTone({ data }: { data: IdCardData }) {
  return (
    <div style={{
      width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden",
      background: "#ffffff", fontFamily: "Arial, sans-serif",
      boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 8,
    }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 78, background: "#F47B20" }} />

      <div style={{ position: "absolute", left: 18, top: 12, display: "flex", alignItems: "center", gap: 6 }}>
        {data.companyLogo && (
          <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain" }} />
        )}
        <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
          {data.companyName}
        </div>
      </div>

      <div style={{ position: "absolute", left: 18, top: 50, width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#fff", border: "3px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.personPhoto ? (
          <img src={data.personPhoto} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 700, color: "#F47B20" }}>{initials(data.personName)}</span>
        )}
      </div>

      <div style={{ position: "absolute", left: 86, top: 88, right: 90 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.25 }}>{data.personName}</div>
        <div style={{ fontSize: 7.5, fontWeight: 700, color: "#F47B20", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>
          {data.personRole}
        </div>
      </div>

      <div style={{ position: "absolute", left: 18, bottom: 14, fontSize: 6.5, color: "#A3A3A3" }}>
        ID: {data.personId}
      </div>

      {data.qrCode && (
        <div style={{ position: "absolute", right: 14, bottom: 14, width: 40, height: 40, background: "#fff", padding: 2, border: "1px solid #E5E5E5", borderRadius: 4 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}

      {poweredBy(false)}
    </div>
  );
}

/**
 * Design 5: "Classic Badge" - traditional, formal look with a
 * bordered frame and centered layout, suited to more conservative
 * dealerships.
 */
export function IdCardClassic({ data }: { data: IdCardData }) {
  return (
    <div style={{
      width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden",
      background: "#FCFCFB", fontFamily: "Arial, sans-serif",
      boxShadow: "0 1px 4px rgba(0,0,0,0.15)", borderRadius: 6,
      border: "1px solid #D4C9A8",
    }}>
      <div style={{ position: "absolute", left: 6, right: 6, top: 6, bottom: 6, border: "1px solid #C9A84C" }} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        {data.companyLogo && (
          <img src={data.companyLogo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, objectFit: "contain" }} />
        )}
        <div style={{ fontSize: 9, fontWeight: 700, color: "#1A1A1A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {data.companyName}
        </div>
        <div style={{ width: 30, height: 1.5, background: "#C9A84C", marginTop: 2 }} />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 56, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", background: "#F5F5F0", border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {data.personPhoto ? (
            <img src={data.personPhoto} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 700, color: "#C9A84C" }}>{initials(data.personName)}</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1A1A1A", marginTop: 6 }}>{data.personName}</div>
        <div style={{ fontSize: 7.5, fontWeight: 600, color: "#8A7539", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
          {data.personRole}
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, textAlign: "center", fontSize: 6.5, color: "#A3A3A3" }}>
        ID: {data.personId}
      </div>

      {data.qrCode && (
        <div style={{ position: "absolute", right: 16, bottom: 16, width: 34, height: 34, background: "#fff", padding: 2, border: "1px solid #C9A84C", borderRadius: 3 }}>
          <img src={data.qrCode} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}

      {poweredBy(false)}
    </div>
  );
}

export const ID_CARD_DESIGNS = [
  { id: "executive", name: "Executive", Component: IdCardExecutive },
  { id: "corporate-dark", name: "Corporate Dark", Component: IdCardCorporateDark },
  { id: "minimalist", name: "Minimalist Line", Component: IdCardMinimalist },
  { id: "two-tone", name: "Two-Tone Split", Component: IdCardTwoTone },
  { id: "classic", name: "Classic Badge", Component: IdCardClassic },
];
