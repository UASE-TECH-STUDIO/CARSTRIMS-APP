"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const Inner = dynamic(() => import("@/app/dashboard/dealer/requests/page"), {
  ssr: false,
  loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading Customer Requests...</div>
});

export default function StaffRequestsPage() {
  const [allowed, setAllowed] = useState<boolean|null>(null);
  useEffect(() => {
    api.get("/api/v1/staff/me").then(r => {
      const p: string[] = r.data.permissions || [];
      setAllowed(p.includes("view_requests") || p.includes("manage_requests"));
    }).catch(() => setAllowed(false));
  }, []);

  if (allowed === null) return <div style={{padding:"2rem",color:"#737373"}}>Checking permissions...</div>;
  if (!allowed) return (
    <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
      <div style={{fontSize:"2rem",marginBottom:"0.75rem"}}>&#x1F512;</div>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#DC2626"}}>Access Restricted</div>
      <p style={{color:"#737373",marginTop:"0.5rem",fontSize:"0.875rem"}}>You do not have permission to access Customer Requests.</p>
    </div>
  );
  return <Inner />;
}
