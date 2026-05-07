"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

function getLink(n: any): string | null {
  const msg = (n.message||"").toLowerCase();
  const title = (n.title||"").toLowerCase();
  if (n.type === "message" || msg.includes("message")) return "/dashboard/user/messages";
  if (msg.includes("request") || title.includes("request")) return "/dashboard/user/requests";
  if (msg.includes("appointment") || title.includes("appointment")) return "/dashboard/user/appointments";
  if (msg.includes("favorite") || msg.includes("car")) return "/dashboard/user/favorites";
  return null;
}

const TYPE_ICONS: Record<string,string> = {
  message:"💬", general:"🔔", announcement:"📢", warning:"⚠️", car:"🚗",
};

export default function UserNotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/notifications/")
      .then((r) => setNotifs(r.data.notifications||r.data||[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await api.post(`/api/v1/notifications/${id}/read`).catch(() => {});
    setNotifs((p) => p.map((n) => n._id===id?{...n,isRead:true}:n));
  };

  const markAll = async () => {
    await api.post("/api/v1/notifications/read-all").catch(() => {});
    setNotifs((p) => p.map((n) => ({...n,isRead:true})));
  };

  const fmtTime = (iso: string) => {
    const d = Date.now() - new Date(iso).getTime();
    const m = Math.floor(d/60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return new Date(iso).toLocaleDateString("en-NG");
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="notifs">
      <div className="notifs-header">
        <div>
          <h2 className="heading">Notifications</h2>
          <p className="sub">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
        </div>
        {unread > 0 && <button className="mark-btn" onClick={markAll}>✓ Mark all read</button>}
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : notifs.length === 0 ? (
        <div className="empty"><span style={{fontSize:"2.5rem"}}>🔕</span><p>No notifications yet</p></div>
      ) : (
        <div className="notif-list">
          {notifs.map((n) => {
            const link = getLink(n);
            return (
              <div key={n._id}
                className={`nr ${!n.isRead?"unread":""} ${link?"clickable":""}`}
                onClick={() => { if(!n.isRead) markRead(n._id); if(link) router.push(link); }}>
                <div className="ni-wrap">
                  <span className="ni">{TYPE_ICONS[n.type]||"🔔"}</span>
                </div>
                <div className="nb">
                  <div className="nt">{n.title}</div>
                  <div className="nm">{n.message}</div>
                  <div className="nm-meta">
                    <span className="ntm">{fmtTime(n.createdAt)}</span>
                    {link && <span className="nlink">Click to view →</span>}
                  </div>
                </div>
                {!n.isRead && <div className="ud" />}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .notifs{display:flex;flex-direction:column;gap:1.5rem}
        .notifs-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A}
        .sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .mark-btn{background:#fff;border:1.5px solid #DDD;color:#666;border-radius:6px;padding:0.5rem 0.875rem;font-size:0.8rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s;white-space:nowrap}
        .mark-btn:hover{border-color:#F47B20;color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;color:#888;font-size:0.875rem}
        .notif-list{display:flex;flex-direction:column;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;background:#fff}
        .nr{display:flex;align-items:flex-start;gap:0.875rem;padding:1rem 1.25rem;border-bottom:1px solid #F0F0F0;transition:background 0.15s;position:relative}
        .nr:last-child{border-bottom:none}
        .nr.clickable{cursor:pointer}
        .nr.clickable:hover{background:#FFF7ED}
        .nr.unread{background:#FFFBF5;border-left:3px solid #F47B20}
        .ni-wrap{width:36px;height:36px;border-radius:50%;background:#FFF7ED;border:1px solid #F47B20;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ni{font-size:1rem}
        .nb{flex:1;display:flex;flex-direction:column;gap:0.2rem}
        .nt{font-size:0.875rem;font-weight:600;color:#1A1A1A}
        .nm{font-size:0.8rem;color:#666;line-height:1.4}
        .nm-meta{display:flex;align-items:center;gap:1rem;margin-top:0.15rem}
        .ntm{font-size:0.68rem;color:#AAA;font-family:var(--font-mono)}
        .nlink{font-size:0.7rem;color:#F47B20;font-weight:500}
        .ud{width:8px;height:8px;border-radius:50%;background:#F47B20;flex-shrink:0;margin-top:6px}
      `}</style>
    </div>
  );
}
