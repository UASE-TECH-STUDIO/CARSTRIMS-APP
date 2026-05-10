"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

function getLink(n: any): string | null {
  const msg = (n.message || "").toLowerCase();
  const title = (n.title || "").toLowerCase();
  if (n.type === "message" || msg.includes("message")) return null; // handled in messages
  if (msg.includes("partner") || title.includes("partner")) return null;
  if (msg.includes("appointment")) return null;
  if (msg.includes("request")) return null;
  return null;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/api/v1/notifications/?limit=15");
      const data = res.data.notifications || res.data || [];
      setNotifs(data);
      setUnread(data.filter((n: any) => !n.isRead).length);
    } catch { }
  };

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id: string) => {
    await api.post(`/api/v1/notifications/${id}/read`).catch(() => {});
    setNotifs((p) => p.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAll = async () => {
    await api.post("/api/v1/notifications/read-all").catch(() => {});
    setNotifs((p) => p.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const fmtTime = (iso: string) => {
    const d = Date.now() - new Date(iso).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen(!open)} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="nd-header">
            <span className="nd-title">Notifications</span>
            {unread > 0 && (
              <button className="nd-mark-all" onClick={markAll}>Mark all read</button>
            )}
          </div>
          <div className="nd-list">
            {notifs.length === 0 ? (
              <div className="nd-empty">No notifications yet</div>
            ) : notifs.map((n) => (
              <div
                key={n._id}
                className={`nd-item ${!n.isRead ? "unread" : ""}`}
                onClick={() => markRead(n._id)}
              >
                <div className="nd-dot" style={{ background: !n.isRead ? "#F47B20" : "#E5E5E5" }} />
                <div className="nd-content">
                  <div className="nd-text">{n.title}</div>
                  <div className="nd-sub">{n.message?.slice(0, 60)}{n.message?.length > 60 ? "..." : ""}</div>
                  <div className="nd-time">{fmtTime(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .bell-wrap { position: relative; flex-shrink: 0; }
        .bell-btn {
          position: relative; width: 36px; height: 36px; border-radius: 8px;
          background: #F5F5F5; border: 1.5px solid #E5E5E5; color: #525252;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .bell-btn:hover { border-color: #F47B20; color: #F47B20; background: #FFF7ED; }
        .bell-badge {
          position: absolute; top: -4px; right: -4px;
          background: #DC2626; color: #fff; border-radius: 50%;
          min-width: 16px; height: 16px; display: flex; align-items: center;
          justify-content: center; font-size: 0.58rem; font-weight: 700;
          border: 2px solid #fff; padding: 0 2px;
        }
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 300px;
          max-height: 420px;
          background: #fff;
          border: 1.5px solid #E5E5E5;
          border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.14);
          z-index: 9999;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        /* Keep it on screen on mobile */
        @media (max-width: 480px) {
          .notif-dropdown {
            right: -50px;
            width: calc(100vw - 2rem);
            max-width: 300px;
          }
        }
        .nd-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1rem; border-bottom: 1px solid #E5E5E5;
          background: #FAFAFA; flex-shrink: 0;
        }
        .nd-title { font-family: var(--font-display); font-size: 0.875rem; letter-spacing: 0.08em; color: #1A1A1A; }
        .nd-mark-all { background: none; border: none; color: #F47B20; font-size: 0.72rem; cursor: pointer; font-family: var(--font-body); }
        .nd-list { overflow-y: auto; flex: 1; }
        .nd-empty { padding: 2rem; text-align: center; color: #A3A3A3; font-size: 0.875rem; }
        .nd-item {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 0.875rem 1rem; cursor: pointer; border-bottom: 1px solid #F5F5F5;
          transition: background 0.15s;
        }
        .nd-item:hover { background: #FFFBF5; }
        .nd-item.unread { background: #FFFDF9; }
        .nd-item:last-child { border-bottom: none; }
        .nd-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .nd-content { flex: 1; min-width: 0; }
        .nd-text { font-size: 0.8rem; font-weight: 600; color: #1A1A1A; line-height: 1.3; }
        .nd-sub { font-size: 0.72rem; color: #737373; margin-top: 0.15rem; line-height: 1.3; }
        .nd-time { font-size: 0.65rem; color: #A3A3A3; margin-top: 0.2rem; font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
