"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { timeAgoLong } from "@/lib/timeUtils";

function fmtTime(iso: string) {
  return timeAgoLong(iso);
}

function getNotifUrl(n: any, isDealer = false) {
  const msg = (n.message||"").toLowerCase(), title=(n.title||"").toLowerCase();
  const base = isDealer ? "/dashboard/staff" : "/dashboard/staff";
  if ((n.type||"").includes("message") || msg.includes("message")) return `${base}/messages`;
  if (msg.includes("movement") || title.includes("movement")) return `${base}/movements`;
  if (msg.includes("partner"))  return `${base}/partners`;
  if (msg.includes("appointment")) return `${base}/appointments`;
  if (msg.includes("request"))  return `${base}/requests`;
  if (msg.includes("expense"))  return `${base}/expenses`;
  if (msg.includes("car") || msg.includes("sold")) return `${base}/inventory`;
  return base;
}

function NotifList({ notifs, onRead, emptyMsg }: { notifs: any[], onRead:(n:any)=>void, emptyMsg:string }) {
  const router = useRouter();
  if (notifs.length === 0) return (
    <div style={{padding:"2rem",textAlign:"center",color:"#A3A3A3",fontSize:"14px"}}>{emptyMsg}</div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
      {notifs.map(n => (
        <div key={n._id} onClick={() => { onRead(n); router.push(getNotifUrl(n)); }}
          style={{display:"flex",gap:"12px",padding:"14px 16px",cursor:"pointer",
            borderBottom:"1px solid #F5F5F5",
            background:n.isRead?"#fff":"#FFFDF9",
            transition:"background .15s"}}
          onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFFBF5"}
          onMouseOut={e=>(e.currentTarget as HTMLElement).style.background=n.isRead?"#fff":"#FFFDF9"}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",flexShrink:0,marginTop:"5px",
            background:n.isRead?"#E5E5E5":"#F47B20"}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:"14px",fontWeight:n.isRead?400:700,color:"#1A1A1A",lineHeight:1.3}}>{n.title}</div>
            <div style={{fontSize:"12px",color:"#737373",marginTop:"3px",lineHeight:1.4}}>{n.message}</div>
            <div style={{fontSize:"11px",color:"#A3A3A3",marginTop:"4px",fontFamily:"monospace"}}>{fmtTime(n.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StaffNotificationsPage() {
  const [tab,        setTab]        = useState<"mine"|"dealer">("mine");
  const [myNotifs,   setMyNotifs]   = useState<any[]>([]);
  const [dealerNotifs,setDealerNotifs]=useState<any[]>([]);
  const [myUnread,   setMyUnread]   = useState(0);
  const [dlrUnread,  setDlrUnread]  = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [dlrName,    setDlrName]    = useState("Dealer");
  const [hasMsgPerm, setHasMsgPerm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // My own notifications
      const myRes = await api.get("/api/v1/notifications/?limit=50");
      const mine  = myRes.data.notifications || myRes.data || [];
      setMyNotifs(mine);
      setMyUnread(mine.filter((n:any)=>!n.isRead).length);

      // Staff profile to get permissions + dealer name
      const staffRes = await api.get("/api/v1/staff/me").catch(()=>null);
      const perms = staffRes?.data?.permissions || [];
      setHasMsgPerm(perms.includes("view_messages") || perms.includes("send_messages"));

      // Dealer notifications (if permitted)
      if (perms.includes("view_messages") || perms.includes("manage_requests") || perms.length > 5) {
        const dlrRes = await api.get("/api/v1/notifications/dealer-notifications?limit=50").catch(()=>null);
        const dlr    = dlrRes?.data?.notifications || dlrRes?.data || [];
        setDealerNotifs(dlr);
        setDlrUnread(dlr.filter((n:any)=>!n.isRead).length);
      }

      // Get dealer name
      const dlrInfo = await api.get("/api/v1/staff/me/dealer").catch(()=>null);
      if (dlrInfo?.data?.companyName) setDlrName(dlrInfo.data.companyName);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (n: any, isDealer = false) => {
    const endpoint = isDealer
      ? `/api/v1/notifications/dealer/${n._id}/read`
      : `/api/v1/notifications/${n._id}/read`;
    await api.post(endpoint).catch(() => {});
    if (isDealer) {
      setDealerNotifs(p => p.map(x => x._id===n._id ? {...x,isRead:true} : x));
      setDlrUnread(u => Math.max(0,u-1));
    } else {
      setMyNotifs(p => p.map(x => x._id===n._id ? {...x,isRead:true} : x));
      setMyUnread(u => Math.max(0,u-1));
    }
  };

  const markAllRead = async (isDealer = false) => {
    if (isDealer) {
      await api.post("/api/v1/notifications/dealer-read-all").catch(()=>{});
      setDealerNotifs(p => p.map(n=>({...n,isRead:true}))); setDlrUnread(0);
    } else {
      await api.post("/api/v1/notifications/read-all").catch(()=>{});
      setMyNotifs(p => p.map(n=>({...n,isRead:true}))); setMyUnread(0);
    }
  };

  const tabBtn = (id: "mine"|"dealer", label: string, count: number) => (
    <button onClick={()=>setTab(id)}
      style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 18px",
        border:`1.5px solid ${tab===id?"#F47B20":"#E5E5E5"}`,
        background:tab===id?"#F47B20":"#fff",
        color:tab===id?"#fff":"#525252",
        borderRadius:"8px",fontSize:"14px",cursor:"pointer",fontWeight:tab===id?700:400,
        transition:"all .15s",fontFamily:"var(--font-body)"}}>
      {label}
      {count > 0 && (
        <span style={{background:tab===id?"rgba(255,255,255,.3)":"#F47B20",color:tab===id?"#fff":"#fff",
          borderRadius:"20px",padding:"1px 7px",fontSize:"11px",fontWeight:700}}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",margin:"0 0 4px"}}>
            Notifications
          </h2>
          <p style={{fontSize:"13px",color:"#888",margin:0}}>
            {myUnread + dlrUnread} unread across all sections
          </p>
        </div>
        <button onClick={() => markAllRead(tab==="dealer")}
          style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",
            padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
          Mark all read
        </button>
      </div>

      {/* Tab selector */}
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
        {tabBtn("mine",   "My Notifications",         myUnread)}
        {tabBtn("dealer", `${dlrName} Notifications`, dlrUnread)}
      </div>

      {/* Info banner */}
      {tab === "dealer" && (
        <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",
          padding:"10px 14px",fontSize:"13px",color:"#1D4ED8",lineHeight:1.5}}>
          <strong>Dealer notifications:</strong> These are your employer's notifications. You can see and act on them to help manage the dealership. Your actions will be recorded under the dealership.
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden"}}>
          {tab === "mine"
            ? <NotifList notifs={myNotifs} onRead={n=>markRead(n,false)} emptyMsg="No notifications yet"/>
            : <NotifList notifs={dealerNotifs} onRead={n=>markRead(n,true)} emptyMsg="No dealer notifications yet"/>
          }
        </div>
      )}
    </div>
  );
}
