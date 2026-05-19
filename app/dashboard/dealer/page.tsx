"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface DealerStats {
  totalCars:number; availableCars:number; soldCars:number;
  totalStaff:number; totalPartners:number; pendingRequests:number;
  totalRevenue:number; totalProfit:number; followerCount:number;
}

function groupActivity(items: any[]) {
  const groups: any[] = [];
  const seen = new Map<string,number>();
  for (const item of items) {
    const key = `${item.type}-${item.targetId}`;
    if (seen.has(key)) {
      const idx = seen.get(key)!;
      groups[idx].count = (groups[idx].count||1)+1;
      groups[idx].actors = groups[idx].actors||[groups[idx].actor];
      groups[idx].actors.push(item.actor);
    } else {
      seen.set(key, groups.length);
      groups.push({...item, count:1, actors:[item.actor]});
    }
  }
  return groups;
}

function getActivityIcon(type: string) {
  const m: Record<string,string> = {
    car_liked:"❤️",like:"❤️",car_commented:"💬",comment:"💬",
    follow:"👥",new_follower:"👥",car_request:"📩",request:"📩",
    car_sold:"🏷️",new_message:"✉️",general:"🔔",announcement:"📢",dealer_approved:"✅",
  };
  return m[type]||"🔔";
}

function getLinkForActivity(n: any): string {
  const t = n.type||""; const d = n.data||{};
  if (t==="car_liked"||t==="car_commented"||t==="like"||t==="comment") return d.carId?`/cars/${d.carId}`:"/dashboard/dealer/cars";
  if (t==="follow"||t==="new_follower") return `/dealers/${d.dealerId||""}`;
  if (t==="car_request"||t==="request") return "/dashboard/dealer/requests";
  if (t==="car_sold") return "/dashboard/dealer/sales";
  if (t==="new_message") return "/dashboard/dealer/messages";
  return "/dashboard/dealer/notifications";
}

export default function DealerOverviewPage() {
  const { user } = useAuthStore();
  const [stats, setStats]   = useState<DealerStats|null>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [dRes, sRes, rRes] = await Promise.all([
        api.get("/api/v1/dealers/me"),
        api.get("/api/v1/dealers/me/stats").catch(()=>({data:{}})),
        api.get("/api/v1/users/requests/dealer").catch(()=>({data:[]})),
      ]);
      setDealer(dRes.data);
      setStats(sRes.data);
      const reqs = Array.isArray(rRes.data)?rRes.data:[];
      setRequests(reqs);
      const nRes = await api.get("/api/v1/dealers/me/notifications",{params:{limit:30}}).catch(()=>({data:{notifications:[]}}));
      const notifs = nRes.data?.notifications||nRes.data||[];
      const acts = notifs.map((n:any)=>({
        id:n._id, type:n.type, title:n.title, message:n.message,
        actor:(()=>{let a=n.actorName||n.senderName||"";if(!a&&n.message){const m=n.message.match(/^([A-Z][a-zA-Z ]+?)\s+(liked|commented on|started following|sent|requested|posted|submitted|recorded)/);if(m)a=m[1].trim();}return a||"Someone";})(),
        verb:verbMap[n.type||"general"]||"interacted with your dealership",
        actorId:n.actorId||n.senderId,
        targetId:n.data?.carId||n.data?.targetId, targetLabel:n.data?.carName||n.data?.label,
        link:getLinkForActivity(n), createdAt:n.createdAt, isRead:n.isRead,
      }));
      setActivity(groupActivity(acts));
    } catch {} finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await api.post("/api/v1/upload/dealer/logo", fd, {headers:{"Content-Type":"multipart/form-data"}});
      setDealer((d:any)=>({...d, logo:res.data.logo||res.data.url}));
    } catch(e:any){ alert(e.response?.data?.detail||"Upload failed"); }
    finally { setLogoUploading(false); if(logoRef.current) logoRef.current.value=""; }
  };

  const fmtTime = (iso:string) => {
    const d = Date.now()-new Date(iso).getTime(); const m = Math.floor(d/60000);
    return m<1?"just now":m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short"});
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:"1rem"}}>
      <div style={{width:"32px",height:"32px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const fmt = (n:number) => (n||0).toLocaleString();
  const isPending = dealer?.status==="awaiting_approval"||dealer?.status==="pending"||dealer?.status==="pending_setup";
  // Count only actual pending requests from real data
  const pendingRequestCount = requests.filter((r:any)=>r.status==="pending").length;

  const STATS = [
    {label:"Total Cars",  value:stats?.totalCars??0,     icon:"🚗",sub:"All listed vehicles",   href:"/dashboard/dealer/cars",               color:"#F47B20"},
    {label:"Available",   value:stats?.availableCars??0,  icon:"✅",sub:"Ready for sale",        href:"/dashboard/dealer/cars?status=available",color:"#16A34A"},
    {label:"Sold",        value:stats?.soldCars??0,       icon:"🏷️",sub:"Completed sales",      href:"/dashboard/dealer/sales",              color:"#3B8BD4"},
    {label:"Staff",       value:stats?.totalStaff??0,     icon:"👥",sub:"Team members",          href:"/dashboard/dealer/staff",              color:"#7B68EE"},
    {label:"Partners",    value:stats?.totalPartners??0,  icon:"🤝",sub:"Active partners",       href:"/dashboard/dealer/partners",           color:"#D97706"},
    {label:"Requests",    value:pendingRequestCount,       icon:"📩",sub:"Pending from customers",href:"/dashboard/dealer/requests",           color:"#DC2626"},
  ];

  const ACTIONS = [
    {label:"Add New Car",  icon:"➕",href:"/dashboard/dealer/cars"},
    {label:"Record Sale",  icon:"💳",href:"/dashboard/dealer/sales"},
    {label:"Log Expense",  icon:"📋",href:"/dashboard/dealer/expenses"},
    {label:"Add Staff",    icon:"👤",href:"/dashboard/dealer/staff"},
    {label:"Log Movement", icon:"🔄",href:"/dashboard/dealer/movements"},
    {label:"View Reports", icon:"📊",href:"/dashboard/dealer/reports"},
    {label:"My Profile",   icon:"🌐",href:`/dealers/${dealer?.dealerId}`},
    {label:"View Feed",    icon:"🏠",href:"/feed"},
  ];

  return (
    <div className="overview">
      {/* Lightbox for logo */}
      {lightbox && dealer?.logo && (
        <div onClick={()=>setLightbox(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <button onClick={()=>setLightbox(false)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>✕</button>
          <img src={dealer.logo} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"88vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"12px"}}/>
        </div>
      )}

      {/* ONE pending banner only */}
      {isPending && (
        <div className="pending-banner">
          <span className="pb-icon">⏳</span>
          <div className="pb-text">
            <strong>Account Pending Approval</strong>
            <span>Your dealership is under review. Listings are hidden from the public feed until a CARSTRIMS admin approves your account. You can still add cars, manage staff, and configure your dashboard.</span>
          </div>
        </div>
      )}

      {/* Dealer header */}
      <div className="ov-header">
        <div className="ov-header-left">
          <div className="ov-logo-wrap">
            <div className="ov-logo" onClick={()=>dealer?.logo&&setLightbox(true)} title={dealer?.logo?"Click to enlarge":"Upload logo from Settings"}>
              {logoUploading
                ? <div style={{width:"24px",height:"24px",border:"2.5px solid rgba(244,123,32,0.3)",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                : dealer?.logo ? <img src={dealer.logo} alt=""/> : <span>{dealer?.companyName?.charAt(0)||"D"}</span>
              }
            </div>
            <button className="ov-logo-edit" onClick={()=>logoRef.current?.click()} title="Change logo">✏️</button>
            <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleLogoUpload(f);}}/>
          </div>
          <div>
            <Link href={`/dealers/${dealer?.dealerId}`} className="ov-company" title="View your public profile">
              {dealer?.companyName||"Your Dealership"}
            </Link>
            <p className="ov-meta">
              {dealer?.city&&dealer?.state?`${dealer.city}, ${dealer.state}`:"Set location in settings"}
              {dealer?.dealerId&&<span className="ov-id"> · {dealer.dealerId}</span>}
            </p>
            <div className="ov-meta-links">
              <Link href={`/dealers/${dealer?.dealerId}`} className="ov-profile-link">View Public Profile →</Link>
              {(stats as any)?.followerCount>0&&<span className="ov-followers">👥 {(stats as any).followerCount} followers</span>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap",flexShrink:0}}>
          <Link href="/dashboard/dealer/settings" className="ov-settings-btn">⚙ Settings</Link>
          <div className={`status-badge ${dealer?.status}`}>
            {dealer?.status?.replace(/_/g," ").toUpperCase()||"PENDING"}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="section-label">OVERVIEW</p>
        <div className="stats-grid">
          {STATS.map(s=>(
            <Link key={s.label} href={s.href} className="stat-card">
              <div className="stat-top"><span className="stat-icon">{s.icon}</span><span className="stat-label">{s.label}</span></div>
              <div className="stat-value" style={{color:s.color}}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
              <span className="stat-arrow">→</span>
            </Link>
          ))}
        </div>
        <div className="wide-grid">
          <Link href="/dashboard/dealer/sales" className="wide-card">
            <div className="stat-top"><span className="stat-icon">💰</span><span className="stat-label">Revenue</span></div>
            <div className="stat-value" style={{color:"#F47B20"}}>₦{fmt(stats?.totalRevenue??0)}</div>
            <div className="stat-sub">All time sales value</div><span className="stat-arrow">→</span>
          </Link>
          <Link href="/dashboard/dealer/reports" className="wide-card">
            <div className="stat-top"><span className="stat-icon">📈</span><span className="stat-label">Net Profit</span></div>
            <div className="stat-value" style={{color:"#16A34A"}}>₦{fmt(stats?.totalProfit??0)}</div>
            <div className="stat-sub">After all expenses</div><span className="stat-arrow">→</span>
          </Link>
        </div>
      </div>

      {/* Activity log */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.875rem"}}>
          <p className="section-label" style={{marginBottom:0}}>RECENT ACTIVITY</p>
          <Link href="/dashboard/dealer/notifications" style={{fontSize:"0.78rem",color:"#F47B20",textDecoration:"none",fontWeight:600}}>See all →</Link>
        </div>
        <div className="activity-list">
          {activity.length===0 ? (
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"2rem",textAlign:"center",color:"#A3A3A3",fontSize:"0.875rem"}}>
              <div style={{fontSize:"1.75rem",marginBottom:"0.5rem"}}>🔔</div>
              Activity from likes, comments, follows and requests will appear here
            </div>
          ) : activity.slice(0,8).map((act,i)=>(
            <Link key={act.id||i} href={act.link||"/dashboard/dealer/notifications"} className={`activity-item ${act.isRead?"":"unread"}`}>
              <div className="activity-icon">{getActivityIcon(act.type)}</div>
              <div className="activity-body">
                <div className="activity-msg">
                  {act.count>1
                    ? <><strong>{act.actors?.[0]||act.actor||"Someone"}</strong> and <strong>{act.count-1} other{act.count>2?"s":""}</strong> {act.verb||"interacted with your dealership"}</>
                    : <><strong>{act.actor||"Someone"}</strong> {act.verb||"interacted with your dealership"}</>
                  }
                  {act.targetLabel&&<span className="activity-target"> · {act.targetLabel}</span>}
                </div>
                <div className="activity-time">{fmtTime(act.createdAt)}</div>
              </div>
              {!act.isRead&&<div className="activity-dot"/>}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="section-label">QUICK ACTIONS</p>
        <div className="actions-grid">
          {ACTIONS.map(a=>(
            <Link key={a.label} href={a.href} className="action-card">
              <span className="action-icon">{a.icon}</span>
              <span className="action-label">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .overview{display:flex;flex-direction:column;gap:1.75rem}
        .pending-banner{display:flex;align-items:flex-start;gap:0.875rem;background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.35);border-left:4px solid #F47B20;padding:1rem 1.25rem;border-radius:10px}
        .pb-icon{font-size:1.25rem;flex-shrink:0;margin-top:0.1rem}
        .pb-text{display:flex;flex-direction:column;gap:0.2rem}
        .pb-text strong{font-size:0.9rem;color:#C4621A;display:block}
        .pb-text span{color:#92400E;font-size:0.82rem;line-height:1.55}
        .ov-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .ov-header-left{display:flex;align-items:center;gap:0.875rem;min-width:0}
        .ov-logo-wrap{position:relative;flex-shrink:0}
        .ov-logo{width:64px;height:64px;border-radius:12px;overflow:hidden;background:#FFF7ED;border:2px solid rgba(244,123,32,0.3);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.5rem;color:#F47B20;cursor:pointer;transition:transform 0.2s}
        .ov-logo:hover{transform:scale(1.04)}
        .ov-logo img{width:100%;height:100%;object-fit:cover}
        .ov-logo-edit{position:absolute;bottom:-4px;right:-4px;background:#F47B20;border:2px solid #fff;border-radius:50%;width:20px;height:20px;font-size:0.55rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s}
        .ov-logo-edit:hover{background:#FF9340}
        .ov-company{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1;text-decoration:none;display:block;transition:color 0.2s}
        .ov-company:hover{color:#F47B20}
        .ov-meta{font-size:0.8rem;color:#888;margin-top:0.2rem}
        .ov-id{font-family:var(--font-mono);font-size:0.72rem;color:#AAA}
        .ov-meta-links{display:flex;align-items:center;gap:0.75rem;margin-top:0.3rem;flex-wrap:wrap}
        .ov-profile-link{font-size:0.78rem;color:#F47B20;text-decoration:none;font-weight:600}
        .ov-profile-link:hover{text-decoration:underline}
        .ov-followers{font-size:0.78rem;color:#737373;font-weight:500}
        .ov-settings-btn{background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;border-radius:8px;padding:0.5rem 1rem;font-size:0.82rem;text-decoration:none;font-weight:600;transition:all 0.2s}
        .ov-settings-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .status-badge{padding:0.35rem 0.875rem;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border:1.5px solid;white-space:nowrap;flex-shrink:0}
        .status-badge.active,.status-badge.approved{color:#16A34A;border-color:#16A34A;background:#F0FDF4}
        .status-badge.awaiting_approval,.status-badge.pending,.status-badge.pending_setup{color:#F47B20;border-color:#F47B20;background:#FFF7ED}
        .status-badge.suspended{color:#DC2626;border-color:#DC2626;background:#FEF2F2}
        .section-label{font-family:var(--font-display);font-size:0.72rem;letter-spacing:0.18em;color:#A3A3A3;margin-bottom:0.875rem;text-transform:uppercase}
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
        .stat-card,.wide-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:0.35rem;text-decoration:none;transition:all 0.2s;position:relative;overflow:hidden}
        .stat-card::before,.wide-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:#F47B20;opacity:0;transition:opacity 0.2s}
        .stat-card:hover,.wide-card:hover{border-color:#F47B20;transform:translateY(-2px);box-shadow:0 6px 20px rgba(244,123,32,0.1)}
        .stat-card:hover::before,.wide-card:hover::before{opacity:1}
        .stat-top{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.2rem}
        .stat-icon{font-size:1.1rem}
        .stat-label{font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A3A3A3}
        .stat-value{font-family:var(--font-display);font-size:2.2rem;letter-spacing:0.02em;line-height:1}
        .stat-sub{font-size:0.72rem;color:#A3A3A3}
        .stat-arrow{position:absolute;bottom:0.875rem;right:1rem;font-size:0.8rem;color:#DDD;transition:color 0.2s}
        .stat-card:hover .stat-arrow,.wide-card:hover .stat-arrow{color:#F47B20}
        .wide-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem}
        .activity-list{display:flex;flex-direction:column;gap:0.4rem}
        .activity-item{display:flex;align-items:flex-start;gap:0.75rem;background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:0.875rem 1rem;text-decoration:none;transition:all 0.15s;position:relative}
        .activity-item:hover{border-color:#F47B20;background:#FFF7ED}
        .activity-item.unread{border-left:3px solid #F47B20;background:#FFFBF5}
        .activity-icon{font-size:1.1rem;flex-shrink:0;margin-top:0.05rem}
        .activity-body{flex:1;min-width:0}
        .activity-msg{font-size:0.875rem;color:#404040;line-height:1.5}
        .activity-msg strong{color:#1A1A1A;font-weight:700}
        .activity-target{color:#F47B20;font-weight:600;font-size:0.82rem}
        .activity-time{font-size:0.72rem;color:#A3A3A3;margin-top:0.2rem}
        .activity-dot{width:8px;height:8px;border-radius:50%;background:#F47B20;flex-shrink:0;margin-top:0.4rem}
        .actions-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0.875rem}
        .action-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.1rem 0.875rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s}
        .action-card:hover{border-color:#F47B20;background:#FFF7ED;transform:translateY(-2px);box-shadow:0 4px 12px rgba(244,123,32,0.08)}
        .action-icon{font-size:1.5rem}
        .action-label{font-size:0.72rem;font-weight:600;color:#666;text-align:center;line-height:1.3}
        .action-card:hover .action-label{color:#F47B20}
        @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)}.actions-grid{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:640px){.stats-grid{grid-template-columns:repeat(2,1fr);gap:0.65rem}.wide-grid{grid-template-columns:1fr}.actions-grid{grid-template-columns:repeat(2,1fr)}.ov-company{font-size:1.2rem}.stat-value{font-size:1.7rem}.ov-logo{width:52px;height:52px;font-size:1.2rem}}
      `}</style>
    </div>
  );
}


