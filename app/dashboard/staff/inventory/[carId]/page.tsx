"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const CarsPage = dynamic(
  () => import("@/app/dashboard/dealer/cars/page"),
  { ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading...</div> }
);

export default function StaffCarEditPage() {
  const [allowed, setAllowed] = useState<boolean|null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get("/api/v1/staff/me").then(r => {
      const p: string[] = r.data.permissions || [];
      setAllowed(p.includes("edit_cars") || p.includes("view_inventory"));
    }).catch(() => setAllowed(false));
  }, []);

  if (allowed === null) return <div style={{padding:"2rem",color:"#737373"}}>Loading...</div>;
  if (!allowed) return (
    <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
      <div style={{fontSize:"2rem",marginBottom:"0.75rem"}}>&#x1F512;</div>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#DC2626",fontWeight:700}}>Access Restricted</div>
      <p style={{color:"#737373",marginTop:"0.5rem",fontSize:"0.875rem"}}>You need edit_cars permission.</p>
    </div>
  );
  // Just render the cars page - the modal will open for the specific car
  return <CarsPage />;
}
