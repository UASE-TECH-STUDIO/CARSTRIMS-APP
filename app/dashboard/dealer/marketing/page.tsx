"use client";
import { useEffect, useRef, useState, CSSProperties } from "react";
import api from "@/lib/api";
import FeedHomeButton from "@/components/shared/FeedHomeButton";
import { useToast } from "@/store/toastStore";
import { renderElementToPdfBlob, renderElementToJpgBlob, renderElementToCardPdfBlob, downloadBlob } from "@/lib/documentExport";
import {
  COMPLIMENTARY_CARD_DESIGNS, FLYER_DESIGNS, ComplimentaryCardData, FlyerCarData,
} from "@/components/design-studio/MarketingDesigns";

type MaterialType = "complimentary-card" | "flyer";

export default function MarketingPage() {
  const showToast = useToast();
  const [dealer, setDealer] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [materialType, setMaterialType] = useState<MaterialType | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<"jpg" | "pdf" | null>(null);

  // Complimentary card form
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");

  // Flyer form
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [headline, setHeadline] = useState("");

  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [dRes, cRes] = await Promise.all([
          api.get("/api/v1/dealers/me"),
          api.get("/api/v1/cars/", { params: { limit: 100 } }).catch(() => ({ data: { cars: [] } })),
        ]);
        let d = dRes.data;
        if (!d.qrCode) {
          try {
            const qrRes = await api.post("/api/v1/public/qr/generate");
            d = { ...d, qrCode: qrRes.data.qrCode };
          } catch { /* still works without a QR code */ }
        }
        setDealer(d);
        setCars(cRes.data.cars || []);
      } catch {
        showToast("Couldn't load your details", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const designsForType = materialType === "complimentary-card" ? COMPLIMENTARY_CARD_DESIGNS
    : materialType === "flyer" ? FLYER_DESIGNS
    : [];
  const activeDesign = designsForType.find(d => d.id === designId);

  const buildComplimentaryData = (): ComplimentaryCardData | null => {
    if (!dealer) return null;
    return {
      companyName: dealer.companyName || "Dealer",
      companyLogo: dealer.logo || null,
      qrCode: dealer.qrCode || null,
      personName: personName || undefined,
      personRole: personRole || undefined,
      companyPhone: dealer.phone,
      companyEmail: dealer.email,
      companyAddress: dealer.address,
      companyCity: dealer.city,
      companyState: dealer.state,
    };
  };

  const buildFlyerData = (): FlyerCarData | null => {
    if (!dealer || !selectedCar) return null;
    return {
      companyName: dealer.companyName || "Dealer",
      companyLogo: dealer.logo || null,
      qrCode: dealer.qrCode || null,
      companyPhone: dealer.phone,
      companyCity: dealer.city,
      companyState: dealer.state,
      carImage: selectedCar.images?.[0] || null,
      carBrand: selectedCar.brand || "",
      carModel: selectedCar.model || "",
      carYear: selectedCar.year || "",
      carPrice: selectedCar.sellingPrice || 0,
      carCondition: selectedCar.condition,
      carMileage: selectedCar.mileage ? `${Number(selectedCar.mileage).toLocaleString()} km` : undefined,
      carTransmission: selectedCar.transmission,
      carFuelType: selectedCar.fuelType,
      headline: headline || undefined,
    };
  };

  const docData = materialType === "complimentary-card" ? buildComplimentaryData()
    : materialType === "flyer" ? buildFlyerData()
    : null;

  const isCardFormat = materialType === "complimentary-card";

  const handleDownload = async (format: "jpg" | "pdf") => {
    if (!docRef.current || !docData) return;
    setDownloading(format);
    try {
      const labelPart = materialType === "flyer"
        ? `${(docData as FlyerCarData).carBrand}-${(docData as FlyerCarData).carModel}`
        : "complimentary-card";
      const filenameBase = `${dealer.companyName || materialType}-${labelPart}`.replace(/\s+/g, "-").toLowerCase();
      if (format === "jpg") {
        const blob = await renderElementToJpgBlob(docRef.current, 0.95);
        await downloadBlob(blob, `${filenameBase}.jpg`);
      } else {
        const blob = isCardFormat
          ? await renderElementToCardPdfBlob(docRef.current, "Complimentary Card")
          : await renderElementToPdfBlob(docRef.current, `${(docData as FlyerCarData).carBrand} ${(docData as FlyerCarData).carModel} Flyer`);
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
          Marketing Materials
        </h1>
        <FeedHomeButton compact />
      </div>

      {/* Step 1: material type */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={stepLabelStyle}>1. What do you need?</div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button onClick={() => { setMaterialType("complimentary-card"); setDesignId(null); }} style={choiceButtonStyle(materialType === "complimentary-card")}>
            Complimentary Card
          </button>
          <button onClick={() => { setMaterialType("flyer"); setDesignId(null); }} style={choiceButtonStyle(materialType === "flyer")}>
            Flyer
          </button>
        </div>
      </div>

      {/* Step 2: form */}
      {materialType === "complimentary-card" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>2. Details (optional)</div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <input placeholder="Name (leave blank for company-only card)" value={personName} onChange={e => setPersonName(e.target.value)} style={inputStyle} />
            <input placeholder="Title / Role" value={personRole} onChange={e => setPersonRole(e.target.value)} style={inputStyle} />
          </div>
        </div>
      )}

      {materialType === "flyer" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>2. Which vehicle?</div>
          {cars.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#A3A3A3" }}>No vehicles found. Add a car to inventory first.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "220px", overflowY: "auto", marginBottom: "0.75rem" }}>
              {cars.map((c: any) => (
                <button key={c.carId || c._id} onClick={() => setSelectedCar(c)} style={staffRowStyle(selectedCar?.carId === c.carId)}>
                  <span style={{ fontWeight: 700 }}>{c.brand} {c.model} ({c.year})</span>
                  <span style={{ color: "#A3A3A3", fontSize: "0.78rem" }}>{`NGN ${(c.sellingPrice || 0).toLocaleString()}`}</span>
                </button>
              ))}
            </div>
          )}
          {selectedCar && (
            <input placeholder={'Headline (optional, e.g. "Just Arrived")'} value={headline} onChange={e => setHeadline(e.target.value)} style={inputStyle} />
          )}
        </div>
      )}

      {/* Step 3: design */}
      {docData && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={stepLabelStyle}>3. Choose a design</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {designsForType.map(d => (
              <button key={d.id} onClick={() => setDesignId(d.id)} style={designThumbStyle(designId === d.id, isCardFormat)}>
                <div style={{ width: isCardFormat ? "94px" : "80px", height: isCardFormat ? "59px" : "113px", overflow: "hidden" }}>
                  <div style={{ transform: isCardFormat ? "scale(0.28)" : "scale(0.1)", transformOrigin: "top left", pointerEvents: "none" }}>
                    <d.Component data={docData as any} />
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#525252", marginTop: "0.3rem" }}>{d.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: preview + download */}
      {docData && activeDesign && (
        <div>
          <div style={stepLabelStyle}>4. Preview & download</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem", padding: "1.5rem", background: "#FAFAFA", borderRadius: "12px", overflowX: "auto" }}>
            <div style={{ transform: isCardFormat ? "none" : "scale(0.55)", transformOrigin: "top center" }}>
              <div ref={docRef}>
                <activeDesign.Component data={docData as any} />
              </div>
            </div>
          </div>
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

function staffRowStyle(active: boolean): CSSProperties {
  return {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.75rem 1rem", borderRadius: "8px", cursor: "pointer", textAlign: "left",
    border: active ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
    background: active ? "#FFF7ED" : "#fff",
  };
}

function designThumbStyle(active: boolean, isCard: boolean): CSSProperties {
  return {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0.5rem", borderRadius: "10px", cursor: "pointer",
    border: active ? "2px solid #F47B20" : "1.5px solid #E5E5E5",
    background: "#fff", width: isCard ? "116px" : "104px",
  };
}

function downloadButtonStyle(primary: boolean): CSSProperties {
  return {
    flex: 1, padding: "0.8rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem",
    cursor: "pointer", border: "none",
    background: primary ? "#1A1A1A" : "#F47B20", color: "#fff",
  };
}
