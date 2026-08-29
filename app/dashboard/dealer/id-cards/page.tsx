"use client";
import { useEffect, useRef, useState, CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import FeedHomeButton from "@/components/shared/FeedHomeButton";
import { useToast } from "@/store/toastStore";
import { renderElementToCardPdfBlob, renderElementToJpgBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { ID_CARD_DESIGNS, IdCardData } from "@/components/design-studio/IdCardDesigns";
import { ColorScheme, COLOR_SCHEMES } from "@/components/design-studio/colorSchemes";
import DocumentPreviewLightbox from "@/components/shared/DocumentPreviewLightbox";

type Subject = "dealer" | "staff";

export default function IdCardsPage() {
  const showToast = useToast();
  const searchParams = useSearchParams();
  const [dealer, setDealer] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<"jpg" | "pdf" | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const [colorSchemeId, setColorSchemeId] = useState(COLOR_SCHEMES[0].id);
  const colorScheme: ColorScheme = COLOR_SCHEMES.find(c => c.id === colorSchemeId) || COLOR_SCHEMES[0];

  useEffect(() => {
    (async () => {
      try {
        const [dRes, sRes] = await Promise.all([
          api.get("/api/v1/dealers/me"),
          api.get("/api/v1/staff/").catch(() => ({ data: { staff: [] } })),
        ]);
        let d = dRes.data;
        // A QR code that scans to the dealer's own public page is
        // required for every design - generate it now if this dealer
        // has never had one made yet, rather than leaving the card
        // without one.
        if (!d.qrCode) {
          try {
            const qrRes = await api.post("/api/v1/public/qr/generate");
            d = { ...d, qrCode: qrRes.data.qrCode };
          } catch { /* card still works without a QR code if this fails */ }
        }
        setDealer(d);
        const staff = sRes.data.staff || [];
        setStaffList(staff);

        const preselectId = searchParams.get("staffId");
        if (preselectId) {
          const match = staff.find((s: any) => s.staffId === preselectId);
          if (match) {
            setSubject("staff");
            setSelectedStaff(match);
          }
        }
      } catch {
        showToast("Couldn't load your details", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buildCardData = (): IdCardData | null => {
    if (!dealer) return null;
    if (subject === "dealer") {
      return {
        companyName: dealer.companyName || "Dealer",
        companyLogo: dealer.logo || null,
        qrCode: dealer.qrCode || null,
        personName: dealer.ownerName || dealer.companyName || "Owner",
        personRole: "Owner",
        personId: dealer.dealerId || "",
        personPhoto: dealer.logo || null,
        companyCity: dealer.city,
        companyState: dealer.state,
        companyPhone: dealer.phone,
        companyEmail: dealer.email,
        companyAddress: dealer.address,
      };
    }
    if (subject === "staff" && selectedStaff) {
      return {
        companyName: dealer.companyName || "Dealer",
        companyLogo: dealer.logo || null,
        qrCode: dealer.qrCode || null,
        personName: selectedStaff.fullName || "Staff",
        personRole: selectedStaff.position || "Staff",
        personId: selectedStaff.staffId || "",
        personPhoto: selectedStaff.profilePicture || null,
        companyCity: dealer.city,
        companyState: dealer.state,
        companyPhone: dealer.phone,
        companyEmail: dealer.email,
        companyAddress: dealer.address,
      };
    }
    return null;
  };

  const cardData = buildCardData();
  const activeDesign = ID_CARD_DESIGNS.find(d => d.id === designId);

  const handleDownload = async (format: "jpg" | "pdf") => {
    if (!cardRef.current || !cardBackRef.current || !cardData) return;
    setDownloading(format);
    try {
      const filenameBase = `${dealer.companyName || "id-card"}-${cardData.personName}`.replace(/\s+/g, "-").toLowerCase();
      if (format === "jpg") {
        const [frontBlob, backBlob] = await Promise.all([
          renderElementToJpgBlob(cardRef.current, 0.95),
          renderElementToJpgBlob(cardBackRef.current, 0.95),
        ]);
        await downloadBlob(frontBlob, `${filenameBase}-front.jpg`);
        // A short gap before the second download - triggering two
        // downloads back-to-back in the same tick risks the second
        // one being silently blocked by some browsers/WebViews,
        // which treat rapid successive programmatic downloads
        // similarly to popup spam.
        await new Promise(resolve => setTimeout(resolve, 400));
        await downloadBlob(backBlob, `${filenameBase}-back.jpg`);
      } else {
        const blob = await renderElementToCardPdfBlob(
          [cardRef.current, cardBackRef.current],
          `${cardData.personName} - ID Card`
        );
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
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.03em", color: "#1A1A1A", margin: 0 }}>
          ID Cards
        </h1>
        <FeedHomeButton compact />
      </div>

      {/* Step 1: who is this for */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={stepLabelStyle}>1. Who is this ID card for?</div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => { setSubject("dealer"); setSelectedStaff(null); setDesignId(null); }}
            style={choiceButtonStyle(subject === "dealer")}
          >
            Dealer (Owner)
          </button>
          <button
            onClick={() => { setSubject("staff"); setDesignId(null); }}
            style={choiceButtonStyle(subject === "staff")}
          >
            Staff Member
          </button>
        </div>
      </div>

      {/* Step 2: pick staff (only if staff chosen) */}
      {subject === "staff" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>2. Which staff member?</div>
          {staffList.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#A3A3A3" }}>No staff members found. Add staff first.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "220px", overflowY: "auto" }}>
              {staffList.map((s: any) => (
                <button
                  key={s._id || s.staffId}
                  onClick={() => { setSelectedStaff(s); setDesignId(null); }}
                  style={staffRowStyle(selectedStaff?.staffId === s.staffId)}
                >
                  <span style={{ fontWeight: 700 }}>{s.fullName}</span>
                  <span style={{ color: "#A3A3A3", fontSize: "0.78rem" }}>{s.position || "Staff"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: pick a design */}
      {cardData && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>{subject === "staff" ? "3" : "2"}. Choose a design</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {ID_CARD_DESIGNS.map(d => (
              <button key={d.id} onClick={() => setDesignId(d.id)} style={designThumbStyle(designId === d.id)}>
                <div style={{ display: "flex", gap: "0.2rem" }}>
                  <div style={{ width: "81px", height: "51px", overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ transform: "scale(0.24)", transformOrigin: "top left", pointerEvents: "none" }}>
                      <d.Component data={cardData} colorScheme={colorScheme} />
                    </div>
                  </div>
                  <div style={{ width: "81px", height: "51px", overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ transform: "scale(0.24)", transformOrigin: "top left", pointerEvents: "none" }}>
                      <d.BackComponent data={cardData} colorScheme={colorScheme} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "0.3rem", fontSize: "0.72rem", fontWeight: 700, color: "#525252" }}>{d.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3.5: color-combo picker - lets a dealer keep a design's layout but match it to their own branding colors */}
      {cardData && activeDesign && (
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
      {cardData && activeDesign && (
        <div>
          <div style={stepLabelStyle}>{subject === "staff" ? "5" : "4"}. Preview & download</div>
          <DocumentPreviewLightbox getElements={() => [cardRef.current, cardBackRef.current]}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", marginBottom: "1.25rem", padding: "1.5rem", background: "#FAFAFA", borderRadius: "12px" }}>
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#A3A3A3", textAlign: "center", marginBottom: "0.4rem" }}>FRONT</div>
              <div ref={cardRef}>
                <activeDesign.Component data={cardData} colorScheme={colorScheme} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#A3A3A3", textAlign: "center", marginBottom: "0.4rem" }}>BACK</div>
              <div ref={cardBackRef}>
                <activeDesign.BackComponent data={cardData} colorScheme={colorScheme} />
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

function choiceButtonStyle(active: boolean): CSSProperties {
  return {
    flex: 1, padding: "0.85rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem",
    cursor: "pointer", border: active ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
    background: active ? "#FFF7ED" : "#fff", color: active ? "#F47B20" : "#525252",
  };
}

function staffRowStyle(active: boolean): CSSProperties {
  return {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.75rem 1rem", borderRadius: "8px", cursor: "pointer", textAlign: "left",
    border: active ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
    background: active ? "#FFF7ED" : "#fff",
  };
}

function designThumbStyle(active: boolean): CSSProperties {
  return {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0.5rem", borderRadius: "10px", cursor: "pointer",
    border: active ? "2px solid #F47B20" : "1.5px solid #E5E5E5",
    background: "#fff", width: "184px", height: "80px", overflow: "hidden",
  };
}

function downloadButtonStyle(primary: boolean): CSSProperties {
  return {
    flex: 1, padding: "0.8rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem",
    cursor: "pointer", border: "none",
    background: primary ? "#1A1A1A" : "#F47B20", color: "#fff",
  };
}
