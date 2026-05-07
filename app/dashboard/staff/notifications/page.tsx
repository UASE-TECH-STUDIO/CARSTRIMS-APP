"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

function getLink(n: any): string | null {
  const msg = (n.message||"").toLowerCase();
  if (msg.includes("sold") || n.type === "car_sold") return "/dashboard/staff/sales";
  if (msg.includes("movement")) return "/dashboard/staff/movements";
  if (msg.includes("car")) return "/dashboard/staff/inventory";
  return null;
}

export default function StaffNotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/notifications/").then((r) => setNotifs(r.data.notifications||r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await api.post(`/api/v1/notifications/${id}/read`).catch(()=>{});
    setNotifs((p) => p.map((n) => n._id===id?{...n,isRead:true}:n));
  };

  const markAll = async () => {
    await api.post("/api/v1/notifications/read-all").catch(()=>{});
    setNotifs((p) => p.map((n) => ({...n,isRead:true})));
  };

  const fmtTime = (iso: string) => { const d=Date.now()-new Date(iso).getTime(); const m=Math.floor(d/60000); return m<1?"just now":m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:new Date(iso).toLocaleDateString(); };
  const unread = notifs.filter((n)=>!n.isRead).length;

  return (
    <div className="notifs">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1.5rem"}}>
        <div><h2 className="heading">Notifications</h2><p className="sub">{unread>0?`${unread} unread`:"All caught up"}</p></div>
        {unread>0&&<button className="mark-btn" onClick={markAll}>✓ Mark all read</button>}
      </div>

      {loading ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"200px"}}><div className="spinner" /></div>
      : notifs.length === 0 ? (
        <div className="empty"><span>🔕</span><p>No notifications yet</p></div>
      ) : (
        <div className="notif-list">
          {notifs.map((n) => {
            const link = getLink(n);
            return (
              <div key={n._id} className={`nr ${!n.isRead?"unread":""} ${link?"clickable":""}`}
                onClick={()=>{ if(!n.isRead) markRead(n._id); if(link) router.push(link); }}>
                <div className="ni">🔔</div>
                <div className="nb">
                  <div className="nt">{n.title}</div>
                  <div className="nm">{n.message}</div>
                  <div className="ntm">{fmtTime(n.createdAt)}{link&&<span className="nlink"> · Click to view →</span>}</div>
                </div>
                {!n.isRead&&<div className="ud"/>}
              </div>
            );
          })}
        </div>
      )}

      <style>{`.notifs{display:flex;flex-direction:column;gap:0}.heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A}.sub{font-size:0.8rem;color:#888}.mark-btn{background:#fff;border:1.5px solid #DDD;color:#666;border-radius:6px;padding:0.5rem 0.875rem;font-size:0.8rem;cursor:pointer;font-family:var(--font-body)}.mark-btn:hover{border-color:#1D9E75;color:#1D9E75}.empty{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;color:#888;font-size:0.875rem}.spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.notif-list{display:flex;flex-direction:column;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;background:#fff}.nr{display:flex;align-items:flex-start;gap:0.875rem;padding:1rem 1.25rem;border-bottom:1px solid #F0F0F0;position:relative}.nr:last-child{border-bottom:none}.nr.clickable{cursor:pointer}.nr.clickable:hover{background:#F0FDF4}.nr.unread{background:#FAFFFC;border-left:3px solid #1D9E75}.ni{font-size:1.1rem;flex-shrink:0}.nb{flex:1}.nt{font-size:0.875rem;font-weight:600;color:#1A1A1A}.nm{font-size:0.78rem;color:#666;margin-top:0.15rem;line-height:1.4}.ntm{font-size:0.68rem;color:#AAA;font-family:var(--font-mono);margin-top:0.2rem}.nlink{color:#1D9E75;font-style:normal}.ud{width:8px;height:8px;border-radius:50%;background:#1D9E75;flex-shrink:0;margin-top:4px}`}</style>
    </div>
  );
}
