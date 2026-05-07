"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DealerQRCode() {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchQR = async () => {
    try {
      const res = await api.get("/api/v1/public/qr/me");
      setQrData(res.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchQR(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/api/v1/public/qr/generate");
      setQrData(res.data);
    } catch { } finally { setGenerating(false); }
  };

  const handleDownload = async () => {
    if (!qrData?.qrCode) return;
    setDownloading(true);
    try {
      const qrUrl: string = qrData.qrCode;

      if (qrUrl.startsWith("data:")) {
        // base64 — direct download
        const link = document.createElement("a");
        link.href = qrUrl;
        link.download = `carstrims-qr-${qrData.dealerId || "dealer"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Cloudinary URL — fetch as blob then download
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `carstrims-qr-${qrData.dealerId || "dealer"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: open in new tab
      window.open(qrData.qrCode, "_blank");
    } finally { setDownloading(false); }
  };

  return (
    <div className="qr-wrap">
      <div className="qr-header">
        <div className="qr-title">DEALER QR CODE</div>
        <div className="qr-sub">Share to direct customers to your car listings</div>
      </div>

      {loading ? (
        <div className="qr-loading"><div className="qr-spin" /></div>
      ) : qrData?.qrCode ? (
        <div className="qr-content">
          <div className="qr-display">
            <img src={qrData.qrCode} alt="Dealer QR Code" className="qr-img" />
            {qrData.dealerUrl && (
              <div className="qr-url">{qrData.dealerUrl}</div>
            )}
          </div>
          <div className="qr-actions">
            <button className="qr-download-btn" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Downloading..." : "⬇ Download PNG"}
            </button>
            <button className="qr-regen-btn" onClick={handleGenerate} disabled={generating}>
              {generating ? "..." : "↻ Regenerate"}
            </button>
          </div>
          <div className="qr-uses">
            <div className="qu-title">USE FOR</div>
            <div className="qu-grid">
              {["Showroom displays","Business cards","Print banners","Social media","Windshield tags","WhatsApp status"].map((u) => (
                <div key={u} className="qu-item">✓ {u}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="qr-empty">
          <div className="qe-icon">📷</div>
          <p>No QR code yet</p>
          <button className="qr-download-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : "Generate QR Code"}
          </button>
        </div>
      )}

      <style>{`
        .qr-wrap{display:flex;flex-direction:column;gap:1rem}
        .qr-title{font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.15em;color:#888}
        .qr-sub{font-size:0.75rem;color:#AAA;margin-top:0.2rem}
        .qr-loading{display:flex;align-items:center;justify-content:center;padding:2rem}
        .qr-spin{width:24px;height:24px;border:2px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .qr-content{display:flex;flex-direction:column;gap:1rem}
        .qr-display{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:1.25rem;background:#FAFAFA;border:1.5px solid #E5E5E5;border-radius:8px}
        .qr-img{width:160px;height:160px;border-radius:6px;border:4px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,0.1)}
        .qr-url{font-family:var(--font-mono);font-size:0.65rem;color:#AAA;text-align:center;word-break:break-all;max-width:240px}
        .qr-actions{display:flex;gap:0.5rem}
        .qr-download-btn{flex:1;background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.75rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;transition:background 0.2s}
        .qr-download-btn:hover{background:#FF9340}
        .qr-download-btn:disabled{opacity:0.6;cursor:not-allowed}
        .qr-regen-btn{background:#fff;border:1.5px solid #DDD;color:#888;border-radius:6px;padding:0.75rem 0.875rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .qr-regen-btn:hover{border-color:#F47B20;color:#F47B20}
        .qr-regen-btn:disabled{opacity:0.5;cursor:not-allowed}
        .qr-uses{background:#FFF7ED;border:1px solid #F47B20;border-radius:6px;padding:0.875rem}
        .qu-title{font-size:0.65rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#C4621A;margin-bottom:0.5rem}
        .qu-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.3rem}
        .qu-item{font-size:0.75rem;color:#C4621A}
        .qr-empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:2rem;text-align:center;border:1.5px dashed #DDD;border-radius:8px}
        .qe-icon{font-size:2.5rem}
        .qr-empty p{font-size:0.875rem;color:#888}
      `}</style>
    </div>
  );
}
