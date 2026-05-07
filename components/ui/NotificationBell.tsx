"use client";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

const TYPE_ICONS: Record<string, string> = {
  car_sold: "💰",
  car_added: "🚗",
  car_moved: "🔄",
  dealer_approved: "✅",
  dealer_suspended: "⛔",
  partner_request: "🤝",
  payment_received: "💳",
  cctv_alert: "📹",
  general: "🔔",
};

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)}>
        🔔
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <span className="notif-title">NOTIFICATIONS</span>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span>🔕</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.isRead ? "unread" : ""}`}
                  onClick={() => !n.isRead && markRead(n._id)}
                >
                  <div className="notif-icon">
                    {TYPE_ICONS[n.type] || "🔔"}
                  </div>
                  <div className="notif-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{formatTime(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .bell-wrap { position:relative; }
        .bell-btn {
          background:none;
          border:none;
          font-size:1.1rem;
          cursor:pointer;
          position:relative;
          padding:0.4rem;
          border-radius:6px;
          transition:background 0.2s;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .bell-btn:hover { background:var(--surface-2); }
        .bell-badge {
          position:absolute;
          top:-2px;
          right:-2px;
          background:var(--error);
          color:#fff;
          font-size:0.6rem;
          font-weight:700;
          min-width:16px;
          height:16px;
          border-radius:8px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0 3px;
          font-family:var(--font-mono);
          border:2px solid var(--surface);
        }
        .notif-panel {
          position:absolute;
          top:calc(100% + 0.5rem);
          right:0;
          width:340px;
          background:#fff;
          border:1.5px solid #E5E5E5;
          border-radius:10px;
          box-shadow:0 8px 32px rgba(0,0,0,0.5);
          z-index:500;
          overflow:hidden;
          animation:fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .notif-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0.875rem 1rem;
          border-bottom:1px solid var(--border);
          background:var(--surface-2);
        }
        .notif-title {
          font-family:var(--font-display);
          font-size:0.8rem;
          letter-spacing:0.12em;
          color:var(--text-muted);
        }
        .mark-all-btn {
          background:none;
          border:none;
          color:var(--gold-dim);
          font-size:0.72rem;
          cursor:pointer;
          transition:color 0.2s;
          font-family:var(--font-body);
        }
        .mark-all-btn:hover { color:#F47B20; }
        .notif-list {
          max-height:380px;
          overflow-y:auto;
        }
        .notif-empty {
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:0.5rem;
          padding:2.5rem 1rem;
          color:var(--text-dim);
          font-size:0.825rem;
        }
        .notif-empty span { font-size:1.5rem; }
        .notif-item {
          display:flex;
          align-items:flex-start;
          gap:0.75rem;
          padding:0.875rem 1rem;
          border-bottom:1px solid var(--border);
          cursor:pointer;
          transition:background 0.15s;
          position:relative;
        }
        .notif-item:last-child { border-bottom:none; }
        .notif-item:hover { background:var(--surface-2); }
        .notif-item.unread { background:rgba(201,168,76,0.04); }
        .notif-icon { font-size:1.1rem; flex-shrink:0; margin-top:1px; }
        .notif-body { flex:1; display:flex; flex-direction:column; gap:0.2rem; }
        .notif-item-title {
          font-size:0.82rem;
          font-weight:500;
          color:var(--text);
        }
        .notif-msg {
          font-size:0.775rem;
          color:var(--text-muted);
          line-height:1.4;
        }
        .notif-time {
          font-size:0.68rem;
          color:var(--text-dim);
          margin-top:0.1rem;
          font-family:var(--font-mono);
        }
        .unread-dot {
          width:7px;
          height:7px;
          border-radius:50%;
          background:var(--gold);
          flex-shrink:0;
          margin-top:4px;
        }
      `}</style>
    </div>
  );
}

