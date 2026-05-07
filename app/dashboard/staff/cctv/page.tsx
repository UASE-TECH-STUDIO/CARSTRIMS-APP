"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function StaffCCTVPage() {
  const [perms, setPerms] = useState<string[]>([]);
  useEffect(() => { api.get("/api/v1/staff/me").then((r)=>setPerms(r.data.permissions||[])).catch(()=>{}); }, []);

  if (!perms.includes("view_cctv")) return (
    <div style={{padding:"3rem",textAlign:"center",color:"#888"}}>
      <div style={{fontSize:"3rem"}}>🔒</div>
      <h3 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Access Restricted</h3>
      <p>You need <strong style={{color:"#1D9E75"}}>view_cctv</strong> permission.</p>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.05em",color:"#1A1A1A"}}>CCTV Monitoring</h2>
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"3rem",textAlign:"center",color:"#888"}}>
        <div style={{fontSize:"3rem",marginBottom:"1rem"}}>📹</div>
        <p>CCTV streams are configured by your dealer admin in dealer settings. Contact them to add cameras.</p>
      </div>
    </div>
  );
}
