"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const Page = dynamic(
  () => import("@/app/dashboard/dealer/notifications/page"),
  { ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading Notifications...</div> }
);

export default function StaffNotificationsPage() {
  const allowed = true;
  return <Page />;
}
