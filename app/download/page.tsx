"use client";
import { useState } from "react";

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);

  const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.uasetechstudio.carstrims";
  const APK_URL = "/carstrims.apk";

  const copy = () => {
    navigator.clipboard.writeText(PLAY_STORE_URL).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ minHeight:"100vh", background:"#525252",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"2rem", fontFamily:"var(--font-body, system-ui)" }}>

      <div style={{ background:"#fff", borderRadius:"20px", padding:"2.5rem",
        maxWidth:"460px", width:"100%", textAlign:"center",
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>

        {/* Logo */}
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ width:"80px", height:"80px", background:"#fff",
            borderRadius:"20px", margin:"0 auto 12px",
            border:"2px solid #F5F5F5", display:"flex",
            alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
            <img src="/icon-192.png" alt="CARSTRIMS" width="60" height="60"
              style={{ borderRadius:"12px" }}
              onError={e => { (e.target as HTMLImageElement).style.display="none"; }}/>
          </div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:"1.8rem",
            fontWeight:700, letterSpacing:"0.2em", color:"#F47B20" }}>
            CARSTRIMS
          </div>
          <p style={{ color:"#737373", fontSize:"13px", margin:"4px 0 0" }}>
            Nigeria's Premier Car Dealership Platform
          </p>
        </div>

        {/* Rating row */}
        <div style={{ display:"flex", justifyContent:"center", gap:"20px",
          padding:"12px 0", marginBottom:"1.5rem",
          borderTop:"1px solid #F5F5F5", borderBottom:"1px solid #F5F5F5" }}>
          {[["🚗","Marketplace"],["🏢","Dealer Tools"],["📊","Analytics"],["🔔","Live Alerts"]].map(([icon,label]) => (
            <div key={label} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"1.4rem" }}>{icon}</div>
              <div style={{ fontSize:"10px", color:"#A3A3A3", marginTop:"2px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Google Play button */}
        <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer"
          style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:"12px", background:"#1A1A1A", color:"#fff",
            borderRadius:"12px", padding:"16px 24px",
            textDecoration:"none", marginBottom:"10px",
            fontSize:"15px", fontWeight:700, transition:"opacity .2s" }}
          onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity="0.85"}
          onMouseOut={e => (e.currentTarget as HTMLElement).style.opacity="1"}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3.18 1.07L13.41 12 3.18 22.93A2 2 0 012 21V3a2 2 0 011.18-1.93z" fill="#4CAF50"/>
            <path d="M13.41 12l3.95 3.95-8.72 5.04A2 2 0 016 21L13.41 12z" fill="#F44336"/>
            <path d="M20.82 10.26L17.36 12l-3.95-3.95L20.82 3.74A2 2 0 0122 5v.18a2 2 0 01-1.18 5.08z" fill="#FFC107"/>
            <path d="M13.41 12L6 3a2 2 0 002.64-.91l8.72 5.04L13.41 12z" fill="#2196F3"/>
          </svg>
          Download on Google Play
        </a>

        {/* Direct APK */}
        <a href={APK_URL} download="carstrims.apk"
          style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:"12px", background:"#F47B20", color:"#fff",
            borderRadius:"12px", padding:"16px 24px",
            textDecoration:"none", marginBottom:"16px",
            fontSize:"15px", fontWeight:700 }}
          onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity="0.85"}
          onMouseOut={e => (e.currentTarget as HTMLElement).style.opacity="1"}>
          ⬇ Download APK (Direct Install)
        </a>

        {/* APK install note */}
        <div style={{ background:"#FFF7ED", borderRadius:"8px",
          padding:"10px 14px", marginBottom:"16px",
          fontSize:"11px", color:"#D97706", lineHeight:1.6, textAlign:"left" }}>
          <strong>For APK install:</strong> Settings → Security →
          Enable "Install unknown apps" → Open downloaded file
        </div>

        {/* Share link */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
          <input readOnly value={PLAY_STORE_URL}
            style={{ flex:1, background:"#F5F5F5", border:"1px solid #E5E5E5",
              borderRadius:"8px", padding:"8px 10px", fontSize:"11px",
              color:"#737373", outline:"none" }}/>
          <button onClick={copy}
            style={{ background:copied?"#16A34A":"#F47B20", color:"#fff",
              border:"none", borderRadius:"8px", padding:"8px 14px",
              fontSize:"12px", cursor:"pointer", fontWeight:700,
              transition:"background .2s", whiteSpace:"nowrap" }}>
            {copied ? "✓ Copied" : "Copy Link"}
          </button>
        </div>

        {/* Web app link */}
        <div style={{ borderTop:"1px solid #F5F5F5", paddingTop:"16px" }}>
          <p style={{ fontSize:"13px", color:"#737373", marginBottom:"8px" }}>
            Or use the web app directly:
          </p>
          <a href="https://www.carstrims.com"
            style={{ color:"#F47B20", fontSize:"14px", fontWeight:600,
              textDecoration:"none" }}>
            www.carstrims.com →
          </a>
          <p style={{ fontSize:"11px", color:"#A3A3A3", marginTop:"12px" }}>
            Built by UASE Tech Studio · v1.0.1
          </p>
        </div>
      </div>
    </div>
  );
}
