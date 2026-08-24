"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const Page = dynamic(
  () => import("@/app/dashboard/dealer/id-cards/page"),
  { ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading ID Cards...</div> }
);

export default function StaffIdCardsPage() {
  const [allowed, setAllowed] = useState<boolean|null>(null);
  useEffect(() => {
    api.get("/api/v1/staff/me").then(r => {
      const p: string[] = r.data.permissions || [];
      setAllowed(p.includes("generate_id_cards"));
    }).catch(() => setAllowed(false));
  }, []);
  if (allowed === null) return <div style={{padding:"2rem",color:"#737373"}}>Loading...</div>;
  if (!allowed) return (
    <div style={{padding:"3rem 1.5rem",textAlign:"center",color:"#A3A3A3"}}>
      <p style={{fontSize:"0.9rem"}}>You don't have permission to generate ID cards.</p>
      <p style={{fontSize:"0.8rem"}}>Ask your dealer to grant the "Generate ID Cards" permission if you need access.</p>
    </div>
  );
  return <Page />;
}
