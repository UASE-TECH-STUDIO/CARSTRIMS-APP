"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function StaffPage() {
    const [allowed, setAllowed] = useState<boolean|null>(null);
  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => {
      setAllowed(r.data.permissions?.includes("view_cctv") || false);
    }).catch(() => setAllowed(false));
  }, []);
  if (allowed === null) return <div style={{padding:"2rem",color:"#737373"}}>Checking permissions...</div>;
  if (!allowed) return (
    <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
      <div style={{fontSize:"1rem",fontWeight:700,color:"#DC2626"}}>Access Denied</div>
      <p style={{color:"#737373",marginTop:"0.5rem",fontSize:"0.875rem"}}>You do not have permission to view CCTV Monitoring.</p>
    </div>
  );
  return (
    <div style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>
      <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.6rem", color:"#1A1A1A", letterSpacing:"0.04em"}}>CCTV Monitoring</h2>
      <div style={{background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", padding:"2rem", textAlign:"center"}}>
        <p style={{color:"#737373", fontSize:"0.875rem", marginBottom:"1rem"}}>This section shares data with the dealer dashboard.</p>
        <Link href="/dashboard/dealer/cctv" style={{background:"#F47B20", color:"#fff", borderRadius:"8px", padding:"0.75rem 1.5rem", fontFamily:"var(--font-display)", fontSize:"0.875rem", letterSpacing:"0.08em", textDecoration:"none"}}>
          Go to CCTV Monitoring
        </Link>
      </div>
    </div>
  );
}