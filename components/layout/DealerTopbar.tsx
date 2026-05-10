"use client";
import { useAuthStore } from "@/store/authStore";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/ui/NotificationBell";
import MenuToggle from "@/components/layout/MenuToggle";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/dealer": "Overview",
  "/dashboard/dealer/cars": "Cars & Inventory",
  "/dashboard/dealer/sales": "Sales",
  "/dashboard/dealer/expenses": "Expenses",
  "/dashboard/dealer/staff": "Staff Management",
  "/dashboard/dealer/partners": "Partners",
  "/dashboard/dealer/requests": "Requests",
  "/dashboard/dealer/appointments": "Appointments",
  "/dashboard/dealer/movements": "Vehicle Movement",
  "/dashboard/dealer/cctv": "CCTV",
  "/dashboard/dealer/reports": "Reports",
  "/dashboard/dealer/notifications": "Notifications",
  "/dashboard/dealer/settings": "Settings",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

interface Props {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export default function DealerTopbar({ onMenuToggle, isSidebarOpen }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [dealer, setDealer] = useState<any>(null);
  const title = PAGE_TITLES[pathname] || "Dashboard";

  useEffect(() => {
    api.get("/api/v1/dealers/me").then((r) => setDealer(r.data)).catch(() => {});
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <MenuToggle isOpen={isSidebarOpen} onClick={onMenuToggle} />
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <span className="greeting">Good {getGreeting()}, <strong>{user?.fullName?.split(" ")[0]}</strong></span>
        <NotificationBell />
        <button
          className="avatar-btn"
          onClick={() => router.push("/dashboard/dealer/settings")}
          title="Settings"
        >
          {dealer?.logo
            ? <img src={dealer.logo} alt="" className="avatar-img" />
            : <span className="avatar-letter">{user?.fullName?.charAt(0).toUpperCase() || "D"}</span>
          }
        </button>
      </div>
      <style>{`
        .topbar{height:60px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.05);gap:0.75rem}
        .topbar-left{display:flex;align-items:center;gap:0.75rem;min-width:0}
        .page-title{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.06em;color:#1A1A1A;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .topbar-right{display:flex;align-items:center;gap:0.75rem;flex-shrink:0}
        .greeting{font-size:0.78rem;color:#888;white-space:nowrap}
        .greeting strong{color:#F47B20}
        .avatar-btn{width:34px;height:34px;border-radius:50%;border:2px solid #F47B20;background:#FFF7ED;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;padding:0}
        .avatar-btn:hover{transform:scale(1.06)}
        .avatar-img{width:100%;height:100%;object-fit:cover;display:block}
        .avatar-letter{font-family:var(--font-display);font-size:0.9rem;color:#F47B20}
        @media(max-width:640px){.greeting{display:none}}
      `}</style>
    </header>
  );
}
