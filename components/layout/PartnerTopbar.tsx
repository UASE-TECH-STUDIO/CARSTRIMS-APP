"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/ui/NotificationBell";
import FeedHomeButton from "@/components/shared/FeedHomeButton";

const IconSignout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>;

const TITLES: Record<string,string> = {
  "/dashboard/partner":"Overview","/dashboard/partner/cars":"My Cars",
  "/dashboard/partner/dealers":"My Dealers","/dashboard/partner/movements":"Movement Logs",
  "/dashboard/partner/earnings":"Earnings","/dashboard/partner/find-dealer":"Find Dealer",
  "/dashboard/partner/notifications":"Notifications","/dashboard/partner/settings":"Settings",
};

export default function PartnerTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  return (
    <header className="topbar">
      <div><h1 className="page-title">{TITLES[pathname] || "Partner Dashboard"}</h1></div>
      <div className="topbar-right">
        <FeedHomeButton compact />
        <NotificationBell />
        <div className="avatar" style={{background:"#3B8BD4"}}>{user?.fullName?.charAt(0).toUpperCase() || "P"}</div>
        <button className="logout-topbar-btn" onClick={() => { logout(); router.push("/login"); }} title="Sign Out">
          <IconSignout/>
        </button>
      </div>
      <style>{`
        .topbar{height:calc(64px + var(--sat, 0px));background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 2rem;padding-top:var(--sat, 0px);position:sticky;top:0;z-index:50}
        .page-title{font-family:var(--font-display);font-size:1.3rem;letter-spacing:0.08em;color:var(--text);line-height:1}
        .topbar-right{display:flex;align-items:center;gap:0.75rem}
        .avatar{width:34px;height:34px;border-radius:50%;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center}
        .logout-topbar-btn{background:none;border:1px solid #E5E5E5;border-radius:6px;color:#AAA;cursor:pointer;padding:0.3rem 0.5rem;transition:all 0.2s;display:flex;align-items:center;justify-content:center}
        .logout-topbar-btn:hover{color:#DC2626;border-color:#FCA5A5;background:#FEF2F2}
      `}</style>
    </header>
  );
}
