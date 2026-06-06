"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

function getNotifUrl(n: any): string {
  const msg   = (n.message || "").toLowerCase();
  const title = (n.title   || "").toLowerCase();
  const type  = n.type     || "";
  const role  = n.role     || "";
  const base  = role === "DEALER_STAFF" ? "/dashboard/staff" : "/dashboard/dealer";

  if (type === "message"   || msg.includes("message"))    return `${base}/messages`;
  if (type === "movement"  || msg.includes("movement"))   return `${base}/movements`;
  if (type === "movement_approval" || msg.includes("approval")) return `${base}/movements`;
  if (msg.includes("partner")   || title.includes("partner"))   return `${base}/partners`;
  if (msg.includes("appointment")|| title.includes("appoint"))  return `${base}/appointments`;
  if (msg.includes("request")   || title.includes("request"))   return `${base}/requests`;
  if (msg.includes("expense")   || title.includes("expense"))   return `${base}/expenses`;
  if (msg.includes("staff")     || title.includes("staff"))     return `${base}/staff`;
  if (msg.includes("report")    || title.includes("report"))    return `${base}/reports`;
  if (msg.includes("car")       || title.includes("car"))       return `${base}/inventory`;
  if (type === "car_sold"  || msg.includes("sold"))       return `${base}/sales`;
  if (type === "dealer_approved") return base;
  return base;
}

async function firePush(notif: any) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const prefs = JSON.parse(localStorage.getItem("notif_prefs") || "{}");
    if (Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(notif.title || "CARSTRIMS", {
      body:    notif.message?.slice(0, 120) || "",
      icon:    "/icon-192.png",
      badge:   "/icon-72.png",
      tag:     notif._id || `notif-${Date.now()}`,
      data:    { url: getNotifUrl(notif) },
      vibrate: [200, 100, 200],
      silent:  prefs.sound === false || prefs.soundType === "none" || prefs.dnd,
    });
    // Also play sound via SW message
    const clients = await (reg as any).getNotifications?.();
    navigator.serviceWorker.controller?.postMessage({ type: "PLAY_SOUND" });
  } catch {}
}

export default function NotificationBell({ role = "dealer" }: { role?: string }) {
  const router = useRouter();
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const ref       = useRef<HTMLDivElement>(null);
  const prevIds   = useRef<Set<string>>(new Set());
  const pollRef   = useRef<ReturnType<typeof setInterval>|null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res  = await api.get("/api/v1/notifications/?limit=30");
      const data: any[] = res.data.notifications || res.data || [];

      // Fire push for any NEW notifications that just arrived
      const newOnes = data.filter(n => !prevIds.current.has(n._id) && !n.isRead);
      for (const n of newOnes) {
        await firePush({ ...n, role });
      }
      data.forEach(n => prevIds.current.add(n._id));

      setNotifs(data);
      setUnread(data.filter((n: any) => !n.isRead).length);
    } catch {}
  }, [role]);

  useEffect(() => {
    fetchNotifs();
    // Poll every 10 seconds for real-time feel
    pollRef.current = setInterval(fetchNotifs, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const markRead = async (n: any) => {
    await api.post(`/api/v1/notifications/${n._id}/read`).catch(() => {});
    setNotifs(p => p.map(x => x._id === n._id ? { ...x, isRead: true } : x));
    setUnread(u => Math.max(0, u - 1));
    setOpen(false);
    router.push(getNotifUrl({ ...n, role }));
  };

  const markAll = async () => {
    await api.post("/api/v1/notifications/read-all").catch(() => {});
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const fmtTime = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "now"; if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m/60)}h`;
    return new Date(iso).toLocaleDateString("en-NG", { day:"numeric", month:"short" });
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
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              {unread > 0 && <button className="nd-mark-all" onClick={markAll}>Mark all read</button>}
              <button className="nd-mark-all" onClick={() => { setOpen(false); router.push(role==="DEALER_STAFF"?"/dashboard/staff/notifications":"/dashboard/dealer/notifications"); }}>View all</button>
            </div>
          </div>
          <div className="nd-list">
            {notifs.length === 0
              ? <div className="nd-empty">No notifications yet</div>
              : notifs.slice(0, 20).map(n => (
                  <div key={n._id} className={`nd-item ${!n.isRead?"unread":""}`} onClick={() => markRead(n)}>
                    <div className="nd-dot" style={{ background: !n.isRead ? "#F47B20" : "#E5E5E5" }}/>
                    <div className="nd-content">
                      <div className="nd-text">{n.title}</div>
                      <div className="nd-sub">{(n.message||"").slice(0,70)}{(n.message||"").length>70?"...":""}</div>
                      <div className="nd-time">{fmtTime(n.createdAt)}</div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      <style>{`
        .bell-wrap{position:relative;flex-shrink:0}
        .bell-btn{position:relative;width:36px;height:36px;border-radius:8px;background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
        .bell-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .bell-badge{position:absolute;top:-4px;right:-4px;background:#DC2626;color:#fff;border-radius:50%;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:700;border:2px solid #fff;padding:0 2px}
        .notif-dropdown{position:absolute;top:calc(100% + 8px);right:0;width:320px;max-height:460px;background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;box-shadow:0 16px 48px rgba(0,0,0,.14);z-index:9999;overflow:hidden;display:flex;flex-direction:column}
        @media(max-width:480px){.notif-dropdown{right:-50px;width:calc(100vw - 2rem);max-width:320px}}
        .nd-header{display:flex;align-items:center;justify-content:space-between;padding:.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#FAFAFA;flex-shrink:0}
        .nd-title{font-family:var(--font-display);font-size:.875rem;letter-spacing:.08em;color:#1A1A1A}
        .nd-mark-all{background:none;border:none;color:#F47B20;font-size:.72rem;cursor:pointer;font-family:var(--font-body)}
        .nd-list{overflow-y:auto;flex:1}
        .nd-empty{padding:2rem;text-align:center;color:#A3A3A3;font-size:.875rem}
        .nd-item{display:flex;align-items:flex-start;gap:.75rem;padding:.875rem 1rem;cursor:pointer;border-bottom:1px solid #F5F5F5;transition:background .15s}
        .nd-item:hover{background:#FFFBF5}
        .nd-item.unread{background:#FFFDF9}
        .nd-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}
        .nd-content{flex:1;min-width:0}
        .nd-text{font-size:.8rem;font-weight:600;color:#1A1A1A;line-height:1.3}
        .nd-sub{font-size:.72rem;color:#737373;margin-top:.15rem;line-height:1.3}
        .nd-time{font-size:.65rem;color:#A3A3A3;margin-top:.2rem;font-family:monospace}
      `}</style>
    </div>
  );
}
