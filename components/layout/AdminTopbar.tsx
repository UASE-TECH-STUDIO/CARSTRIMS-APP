"use client";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const TITLES: Record<string, string> = {
  "/dashboard/super-admin": "Platform Overview",
  "/dashboard/super-admin/dealers": "Dealer Management",
  "/dashboard/super-admin/approvals": "Approval Queue",
  "/dashboard/super-admin/analytics": "Analytics",
  "/dashboard/super-admin/activity": "Activity Feed",
  "/dashboard/super-admin/create-dealer": "Create Dealer",
};

export default function AdminTopbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const title = TITLES[pathname] || "Admin Dashboard";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{title}</h1>
        <p className="page-date">{new Date().toLocaleDateString("en-NG", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
      </div>
      <div className="topbar-right">
        <div className="admin-chip">🔴 SUPER ADMIN</div>
        <div className="topbar-avatar" style={{ background:"var(--error)" }}>A</div>
      </div>
      <style>{`
        .topbar{height:64px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 2rem;position:sticky;top:0;z-index:50}
        .topbar-left{display:flex;flex-direction:column;gap:0.1rem}
        .page-title{font-family:var(--font-display);font-size:1.3rem;letter-spacing:0.08em;color:var(--text);line-height:1}
        .page-date{font-size:0.7rem;color:var(--text-dim);letter-spacing:0.05em}
        .topbar-right{display:flex;align-items:center;gap:1rem}
        .admin-chip{font-size:0.65rem;font-weight:700;letter-spacing:0.12em;color:var(--error);border:1px solid rgba(224,82,82,0.3);background:rgba(224,82,82,0.08);padding:0.3rem 0.75rem;border-radius:20px}
        .topbar-avatar{width:34px;height:34px;border-radius:50%;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;cursor:pointer}
      `}</style>
    </header>
  );
}
