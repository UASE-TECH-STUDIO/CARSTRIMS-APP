"use client";
import NotificationSettings from "@/components/ui/NotificationSettings";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const Page = dynamic(
  () => import("@/app/dashboard/dealer/settings/page"),
  { ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading Settings...</div> }
);

export default function StaffSettingsPage() {
  const allowed = true;
  return <Page />;
}
