"use client";

import Link from "next/link";

export default function StaffPage() {
  
  return (
    <div style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>
      <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.6rem", color:"#1A1A1A", letterSpacing:"0.04em"}}>Notifications</h2>
      <div style={{background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", padding:"2rem", textAlign:"center"}}>
        <p style={{color:"#737373", fontSize:"0.875rem", marginBottom:"1rem"}}>This section shares data with the dealer dashboard.</p>
        <Link href="/dashboard/dealer/notifications" style={{background:"#F47B20", color:"#fff", borderRadius:"8px", padding:"0.75rem 1.5rem", fontFamily:"var(--font-display)", fontSize:"0.875rem", letterSpacing:"0.08em", textDecoration:"none"}}>
          Go to Notifications
        </Link>
      </div>
    </div>
  );
}