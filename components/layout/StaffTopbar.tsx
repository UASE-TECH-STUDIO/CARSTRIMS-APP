"use client";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/ui/NotificationBell";

const TITLES: Record<string,string> = {
  "/dashboard/staff":"Staff Overview","/dashboard/staff/inventory":"Inventory",
  "/dashboard/staff/sales":"Sales","/dashboard/staff/movements":"Vehicle Movement",
  "/dashboard/staff/cctv":"CCTV","/dashboard/staff/reports":"Reports",
  "/dashboard/staff/notifications":"Notifications",
};

export default function StaffTopbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  return (
    <header className="topbar">
      <h1 className="page-title">{TITLES[pathname] || "Staff Dashboard"}</h1>
      <div className="topbar-right">
        <NotificationBell />
        <div className="avatar" style={{background:"#1D9E75"}}>{user?.fullName?.charAt(0).toUpperCase() || "S"}</div>
      </div>
      <style>{`
        .topbar{height:64px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 2rem;position:sticky;top:0;z-index:50}
        .page-title{font-family:var(--font-display);font-size:1.3rem;letter-spacing:0.08em;color:var(--text);line-height:1}
        .topbar-right{display:flex;align-items:center;gap:0.75rem}
        .avatar{width:34px;height:34px;border-radius:50%;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center}
      `}</style>
    </header>
  );
}
