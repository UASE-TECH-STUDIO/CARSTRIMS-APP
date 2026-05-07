"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function UserBottomNav() {
  const pathname = usePathname();
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <nav className="bottom-nav">
        <Link href="/" className={`bn-item ${pathname === "/" ? "active" : ""}`}>
          <span className="bn-icon">🏠</span>
          <span className="bn-label">Feed</span>
        </Link>
        <button className="bn-item qr-btn" onClick={() => setShowQR(true)}>
          <span className="bn-icon">📷</span>
          <span className="bn-label">Scan QR</span>
        </button>
        <Link href="/dashboard/user" className={`bn-item ${pathname.startsWith("/dashboard/user") ? "active" : ""}`}>
          <span className="bn-icon">👤</span>
          <span className="bn-label">My Account</span>
        </Link>
      </nav>

      {showQR && (
        <div className="qr-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-header">
              <h3>Scan Dealer QR Code</h3>
              <button onClick={() => setShowQR(false)} className="qr-close">✕</button>
            </div>
            <div className="qr-body">
              <div className="qr-viewfinder">
                <div className="qr-corner tl" /><div className="qr-corner tr" />
                <div className="qr-corner bl" /><div className="qr-corner br" />
                <div className="qr-scan-line" />
                <div className="qr-placeholder">📷</div>
              </div>
              <p className="qr-hint">Point camera at dealer QR code to open their listing</p>
              <div className="qr-manual">
                <input className="qr-input" placeholder="Or enter dealer ID manually..." />
                <button className="qr-go">Go</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:68px;background:var(--surface);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-around;z-index:100;backdrop-filter:blur(10px)}
        .bn-item{display:flex;flex-direction:column;align-items:center;gap:0.2rem;text-decoration:none;color:var(--text-dim);transition:color 0.2s;background:none;border:none;cursor:pointer;padding:0.5rem;border-radius:8px;min-width:70px}
        .bn-item:hover{color:var(--text)}
        .bn-item.active{color:var(--gold)}
        .bn-item.active .bn-icon{transform:scale(1.1)}
        .qr-btn{color:var(--text-dim)}
        .qr-btn .bn-icon{background:var(--gold);width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;margin-top:-12px;box-shadow:0 4px 12px rgba(201,168,76,0.3)}
        .bn-icon{font-size:1.2rem;transition:transform 0.2s}
        .bn-label{font-size:0.65rem;letter-spacing:0.04em;color:inherit}
        .qr-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;z-index:200}
        .qr-modal{background:var(--surface);border-radius:16px 16px 0 0;width:100%;max-width:500px;padding-bottom:2rem}
        .qr-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)}
        .qr-header h3{font-family:var(--font-display);font-size:1rem;letter-spacing:0.08em;color:var(--text)}
        .qr-close{background:none;border:none;color:var(--text-muted);font-size:1rem;cursor:pointer}
        .qr-body{padding:1.5rem;display:flex;flex-direction:column;align-items:center;gap:1.25rem}
        .qr-viewfinder{width:220px;height:220px;position:relative;display:flex;align-items:center;justify-content:center;background:var(--surface-2);border-radius:8px;overflow:hidden}
        .qr-corner{position:absolute;width:24px;height:24px;border-color:var(--gold);border-style:solid}
        .qr-corner.tl{top:12px;left:12px;border-width:3px 0 0 3px}
        .qr-corner.tr{top:12px;right:12px;border-width:3px 3px 0 0}
        .qr-corner.bl{bottom:12px;left:12px;border-width:0 0 3px 3px}
        .qr-corner.br{bottom:12px;right:12px;border-width:0 3px 3px 0}
        .qr-scan-line{position:absolute;left:20px;right:20px;height:2px;background:var(--gold);animation:scan 2s ease-in-out infinite;opacity:0.7}
        @keyframes scan{0%,100%{top:20%}50%{top:80%}}
        .qr-placeholder{font-size:3rem;opacity:0.2}
        .qr-hint{font-size:0.825rem;color:var(--text-muted);text-align:center}
        .qr-manual{display:flex;gap:0.5rem;width:100%}
        .qr-input{flex:1;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:0.65rem 0.875rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none}
        .qr-input:focus{border-color:var(--gold)}
        .qr-go{background:var(--gold);color:var(--black);border:none;border-radius:6px;padding:0.65rem 1rem;font-family:var(--font-display);font-size:0.85rem;cursor:pointer}
      `}</style>
    </>
  );
}
