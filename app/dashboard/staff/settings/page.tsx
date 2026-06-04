"use client";
import dynamic from "next/dynamic";
const DealerSettings = dynamic(() => import("@/app/dashboard/dealer/settings/page"), {
  ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading settings...</div>
});
export default function StaffSettingsPage() { return <DealerSettings />; }
