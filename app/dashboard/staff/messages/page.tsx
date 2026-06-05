"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const Page = dynamic(
  () => import("@/app/dashboard/dealer/messages/page"),
  { ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading Messages...</div> }
);

export default function StaffMessagesPage() {
  const [allowed, setAllowed] = useState<boolean|null>(null);
  useEffect(() => {
    api.get("/api/v1/staff/me").then(r => {
      const p: string[] = r.data.permissions || [];
      setAllowed(p.includes("view_messages") || p.includes("send_messages"));
    }).catch(() => setAllowed(false));
  }, []);
  if (allowed === null) return <div style={{padding:"2rem",color:"#737373"}}>Loading...</div>;
  if (!allowed) return (
    <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
      <div style={{fontSize:"2rem",marginBottom:"0.75rem"}}></div>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#DC2626",fontWeight:700}}>Access Restricted</div>
      <p style={{color:"#737373",marginTop:"0.5rem",fontSize:"0.875rem"}}>You need message permissions to access this section.</p>
    </div>
  );
  return <Page />;
}
