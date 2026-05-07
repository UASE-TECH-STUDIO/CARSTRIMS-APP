"use client";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import NotificationBell from "@/components/ui/NotificationBell";

export default function UserTopbar() {
  const { user } = useAuthStore();
  return (
    <header className="user-topbar">
      <Link href="/" className="topbar-brand">◈ CARSTRIMS</Link>
      <div className="topbar-right">
        <NotificationBell />
        <Link href="/dashboard/user/profile" className="user-pill">
          <div className="user-dot">{user?.fullName?.charAt(0).toUpperCase() || "U"}</div>
          <span>{user?.fullName?.split(" ")[0] || "Profile"}</span>
        </Link>
      </div>
      <style>{`
        .user-topbar{height:56px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;position:sticky;top:0;z-index:50}
        .topbar-brand{font-family:var(--font-display);font-size:1rem;letter-spacing:0.2em;color:var(--gold);text-decoration:none}
        .topbar-right{display:flex;align-items:center;gap:0.75rem}
        .user-pill{display:flex;align-items:center;gap:0.5rem;text-decoration:none;color:var(--text-muted);font-size:0.825rem;transition:color 0.2s}
        .user-pill:hover{color:var(--text)}
        .user-dot{width:28px;height:28px;border-radius:50%;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:600;color:var(--text)}
      `}</style>
    </header>
  );
}


