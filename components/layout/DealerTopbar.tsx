"use client";
import { useAuthStore } from "@/store/authStore";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/ui/NotificationBell";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/dealer": "Overview",
  "/dashboard/dealer/cars": "Cars & Inventory",
  "/dashboard/dealer/sales": "Sales",
  "/dashboard/dealer/expenses": "Expenses",
  "/dashboard/dealer/staff": "Staff Management",
  "/dashboard/dealer/partners": "Partner Management",
  "/dashboard/dealer/requests": "Customer Requests",
  "/dashboard/dealer/appointments": "Appointments",
  "/dashboard/dealer/movements": "Vehicle Movement",
  "/dashboard/dealer/cctv": "CCTV Monitoring",
  "/dashboard/dealer/reports": "Reports & Analytics",
  "/dashboard/dealer/notifications": "Notifications",
  "/dashboard/dealer/settings": "Settings",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

export default function DealerTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [dealer, setDealer] = useState<any>(null);
  const title = PAGE_TITLES[pathname] || "Dashboard";

  useEffect(() => {
    api.get("/api/v1/dealers/me").then((r) => setDealer(r.data)).catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{title}</h1>
        <p className="page-date">{today}</p>
      </div>
      <div className="topbar-right">
        <div className="greeting">
          {getGreeting()}, <span className="greeting-name">{user?.fullName?.split(" ")[0] || "Dealer"}</span>
        </div>
        <NotificationBell />
        <button className="avatar-btn" onClick={() => router.push("/dashboard/dealer/settings")} title="Edit Profile">
          {dealer?.logo
            ? <img src={dealer.logo} alt="" className="avatar-img" />
            : <span className="avatar-letter">{user?.fullName?.charAt(0).toUpperCase() || "D"}</span>
          }
        </button>
      </div>

      <style>{`
        .topbar{height:60px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.75rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        .topbar-left{display:flex;flex-direction:column;gap:0.1rem}
        .page-title{font-family:var(--font-display);font-size:1.25rem;letter-spacing:0.08em;color:#1A1A1A;line-height:1}
        .page-date{font-size:0.68rem;color:#AAA;letter-spacing:0.04em}
        .topbar-right{display:flex;align-items:center;gap:0.875rem}
        .greeting{font-size:0.82rem;color:#888}
        .greeting-name{color:#F47B20;font-weight:600}
        .avatar-btn{width:36px;height:36px;border-radius:50%;border:2px solid #F47B20;background:#FFF0E6;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
        .avatar-btn:hover{border-color:#FF9340;transform:scale(1.05)}
        .avatar-img{width:100%;height:100%;object-fit:cover}
        .avatar-letter{font-family:var(--font-display);font-size:1rem;color:#F47B20;font-weight:600}
        @media(max-width:480px){.greeting{display:none}.page-date{display:none}}
      `}</style>
    </header>
  );
}

