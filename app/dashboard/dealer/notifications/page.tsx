"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const TYPE_ICON: Record<string,string> = {
  car_sold:"💰", dealer_approved:"✅", dealer_suspended:"🚫",
  partner_request:"🤝", general:"🔔", announcement:"📢",
  warning:"⚠️", car:"🚗",
};

// Map notification types/keywords to dashboard pages
function getNotifLink(notif: any): string | null {
  const msg = (notif.message || "").toLowerCase();
  const title = (notif.title || "").toLowerCase();
  const type = notif.type || "";

  if (type === "car_sold" || msg.includes("sold") || title.includes("sold")) return "/dashboard/dealer/sales";
  if (msg.includes("partner") || title.includes("partner") || type === "partner_request") return "/dashboard/dealer/partners";
  if (msg.includes("appointment") || title.includes("appointment")) return "/dashboard/dealer/appointments";
  if (msg.includes("request") || title.includes("request")) return "/dashboard/dealer/requests";
  if (msg.includes("movement") || title.includes("movement")) return "/dashboard/dealer/movements";
  if (msg.includes("expense") || title.includes("expense")) return "/dashboard/dealer/expenses";
  if (msg.includes("staff") || title.includes("staff")) return "/dashboard/dealer/staff";
  if (msg.includes("car") || title.includes("car") || type === "car") return "/dashboard/dealer/cars";
  if (type === "dealer_approved") return "/dashboard/dealer";
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/notifications/");
      const data = res.data.notifications || res.data || [];
      setNotifications(data);
      setUnread(data.filter((n: any) => !n.isRead).length);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id: string) => {
    try { await api.post(`/api/v1/notifications/${id}/read`); }
    catch { }
    setNotifications((prev) =>
      prev.map((n) => n._id === id ? {...n, isRead:true} : n)
    );
    setUnread((u) => Math.max(0, u-1));
  };

  const markAllRead = async () => {
    try { await api.post("/api/v1/notifications/read-all"); }
    catch { }
    setNotifications((prev) => prev.map((n) => ({...n, isRead:true})));
    setUnread(0);
  };

  const handleClick = async (notif: any) => {
    if (!notif.isRead) await markRead(notif._id);
    const link = getNotifLink(notif);
    if (link) router.push(link);
  };

  const fmtTime = (iso: string) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString("en-NG");
  };

  return (
    <div className="notifs-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Notifications</h2>
          <p className="page-sub">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
        </div>
        {unread > 0 && (
          <button className="mark-all-btn" onClick={markAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="empty">
          <div className="ei">🔕</div>
          <h3>No notifications yet</h3>
          <p>Activity from your dealership will appear here</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => {
            const link = getNotifLink(n);
            return (
              <div
                key={n._id}
                className={`notif-row ${!n.isRead ? "unread" : ""} ${link ? "clickable" : ""}`}
                onClick={() => handleClick(n)}
              >
                <div className="notif-icon-wrap">
                  <span className="notif-icon">{TYPE_ICON[n.type] || "🔔"}</span>
                </div>
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-meta">
                    <span className="notif-time">{fmtTime(n.createdAt)}</span>
                    {link && <span className="notif-link-hint">Click to view →</span>}
                  </div>
                </div>
                {!n.isRead && <div className="unread-dot" />}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .notifs-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .mark-all-btn{background:#fff;border:1.5px solid #DDD;color:#666;border-radius:6px;padding:0.55rem 1rem;font-size:0.825rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s;white-space:nowrap}
        .mark-all-btn:hover{border-color:#F47B20;color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .notif-list{display:flex;flex-direction:column;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;background:#fff}
        .notif-row{display:flex;align-items:flex-start;gap:1rem;padding:1rem 1.25rem;border-bottom:1px solid #F0F0F0;transition:background 0.15s;position:relative}
        .notif-row:last-child{border-bottom:none}
        .notif-row.clickable{cursor:pointer}
        .notif-row.clickable:hover{background:#FFFAF5}
        .notif-row.unread{background:#FFFBF5;border-left:3px solid #F47B20}
        .notif-row.unread.clickable:hover{background:#FFF7ED}
        .notif-icon-wrap{width:36px;height:36px;border-radius:50%;background:#FFF7ED;border:1px solid #F47B20;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .notif-icon{font-size:1rem}
        .notif-body{flex:1;display:flex;flex-direction:column;gap:0.2rem}
        .notif-title{font-size:0.875rem;font-weight:600;color:#1A1A1A}
        .notif-message{font-size:0.8rem;color:#666;line-height:1.4}
        .notif-meta{display:flex;align-items:center;gap:1rem;margin-top:0.2rem}
        .notif-time{font-size:0.7rem;color:#AAA;font-family:var(--font-mono)}
        .notif-link-hint{font-size:0.7rem;color:#F47B20;font-weight:500}
        .unread-dot{width:8px;height:8px;border-radius:50%;background:#F47B20;flex-shrink:0;margin-top:6px}
      `}</style>
    </div>
  );
}
