"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/toastStore";
import { timeAgoLong } from "@/lib/timeUtils";

interface OrgStats {
  totalCars:number; availableCars:number; soldCars:number;
  totalStaff:number; totalRevenue:number; totalProfit:number;
}

function getActivityIcon(type: string) {
  const m: Record<string,string> = {
    car_sold:"", general:"", announcement:"",
  };
  return m[type]||"";
}

const verbMap: Record<string,string> = {
  car_sold:"vehicle disposed", general:"activity logged", announcement:"posted an announcement",
};

export default function OrganizationOverviewPage() {
  const { user } = useAuthStore();
  const showToast = useToast();
  const [stats, setStats]   = useState<OrgStats|null>(null);
  const [org, setOrg] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      // Real backend dependency: /api/v1/organizations/me,
      // /api/v1/organizations/me/stats, and
      // /api/v1/organizations/me/notifications all need to exist,
      // mirroring their Dealer equivalents but scoped to an
      // organization's own private data only.
      const [oRes, sRes] = await Promise.all([
        api.get("/api/v1/organizations/me"),
        api.get("/api/v1/organizations/me/stats").catch(()=>({data:{}})),
      ]);
      setOrg(oRes.data);
      setStats(sRes.data);
      const nRes = await api.get("/api/v1/organizations/me/notifications",{params:{limit:30}}).catch(()=>({data:{notifications:[]}}));
      const notifs = nRes.data?.notifications||nRes.data||[];
      const acts = notifs.map((n:any)=>({
        id:n._id, type:n.type, title:n.title, message:n.message,
        actor:n.actorName||"Someone",
        verb:verbMap[n.type||"general"]||"activity logged",
        targetLabel:n.data?.carName||n.data?.label,
        createdAt:n.createdAt, isRead:n.isRead,
      }));
      setActivity(acts);
    } catch {} finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await api.post("/api/v1/upload/organization/logo", fd, {headers:{"Content-Type":"multipart/form-data"}});
      setOrg((o:any)=>({...o, logo:res.data.logo||res.data.url}));
    } catch(e:any){ showToast(e.response?.data?.detail||"Upload failed", "error"); }
    finally { setLogoUploading(false); if(logoRef.current) logoRef.current.value=""; }
  };

  const fmtTime = (iso:string) => timeAgoLong(iso);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:"1rem"}}>
      <div style={{width:"32px",height:"32px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const fmt = (n:number) => (n||0).toLocaleString();

  const STATS = [
    {label:"Total Vehicles",  value:stats?.totalCars??0,     icon:"",sub:"All fleet vehicles",   href:"/dashboard/organization/cars",               color:"#F47B20"},
    {label:"Available",   value:stats?.availableCars??0,  icon:"",sub:"Currently in use / ready",        href:"/dashboard/organization/cars?status=available",color:"#16A34A"},
    {label:"Disposed",        value:stats?.soldCars??0,       icon:"",sub:"Removed from the fleet",      href:"/dashboard/organization/reports",              color:"#3B8BD4"},
    {label:"Staff",       value:stats?.totalStaff??0,     icon:"",sub:"Team members",          href:"/dashboard/organization/staff",              color:"#7B68EE"},
  ];

  const ACTIONS = [
    {label:"Add New Vehicle",  icon:"",href:"/dashboard/organization/cars"},
    {label:"Log Expense",  icon:"",href:"/dashboard/organization/expenses"},
    {label:"Add Staff",    icon:"",href:"/dashboard/organization/staff"},
    {label:"Log Movement", icon:"",href:"/dashboard/organization/movements"},
    {label:"View Reports", icon:"",href:"/dashboard/organization/reports"},
    {label:"CCTV Monitoring", icon:"",href:"/dashboard/organization/cctv"},
  ];

  return (
    <div className="overview">
      {lightbox && org?.logo && (
        <div onClick={()=>setLightbox(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <button onClick={()=>setLightbox(false)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>×</button>
          <img src={org.logo} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"88vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"12px"}}/>
        </div>
      )}

      {(stats?.totalCars ?? 0) === 0 && (
        <div className="welcome-banner">
          <div className="wb-text">
            <strong>Welcome to CARSTRIMS, {org?.companyName || "there"}!</strong>
            <span>Your organization account is private - nothing you add here is ever shown publicly. Add your first vehicle to start tracking your fleet.</span>
          </div>
          <Link href="/dashboard/organization/cars" className="wb-cta">+ Add Your First Vehicle</Link>
        </div>
      )}

      <div className="ov-header">
        <div className="ov-header-left">
          <div className="ov-logo-wrap">
            <div className="ov-logo" onClick={()=>org?.logo&&setLightbox(true)} title={org?.logo?"Click to enlarge":"Upload logo from Settings"}>
              {logoUploading
                ? <div style={{width:"24px",height:"24px",border:"2.5px solid rgba(244,123,32,0.3)",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                : org?.logo ? <img src={org.logo} alt=""/> : <span>{org?.companyName?.charAt(0)||"O"}</span>
              }
            </div>
            <button className="ov-logo-edit" onClick={()=>logoRef.current?.click()} title="Change logo">✎</button>
            <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleLogoUpload(f);}}/>
          </div>
          <div>
            <div className="ov-company">{org?.companyName||"Your Organization"}</div>
            <p className="ov-meta">
              {org?.city&&org?.state?`${org.city}, ${org.state}`:"Set location in settings"}
              {org?.organizationId&&<span className="ov-id">  {org.organizationId}</span>}
            </p>
            <div className="ov-meta-links">
              <span className="ov-private-badge"> Private Account</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap",flexShrink:0}}>
          <Link href="/dashboard/organization/settings" className="ov-settings-btn"> Settings</Link>
        </div>
      </div>

      <div>
        <p className="section-label">OVERVIEW</p>
        <div className="stats-grid">
          {STATS.map(s=>(
            <Link key={s.label} href={s.href} className="stat-card">
              <div className="stat-top"><span className="stat-icon">{s.icon}</span><span className="stat-label">{s.label}</span></div>
              <div className="stat-value" style={{color:s.color}}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
              <span className="stat-arrow"></span>
            </Link>
          ))}
        </div>
        <div className="wide-grid">
          <Link href="/dashboard/organization/reports" className="wide-card">
            <div className="stat-top"><span className="stat-icon"></span><span className="stat-label">Total Value Disposed</span></div>
            <div className="stat-value" style={{color:"#F47B20"}}>{fmt(stats?.totalRevenue??0)}</div>
            <div className="stat-sub">All time</div><span className="stat-arrow"></span>
          </Link>
          <Link href="/dashboard/organization/reports" className="wide-card">
            <div className="stat-top"><span className="stat-icon"></span><span className="stat-label">Net Position</span></div>
            <div className="stat-value" style={{color:"#16A34A"}}>{fmt(stats?.totalProfit??0)}</div>
            <div className="stat-sub">After all expenses</div><span className="stat-arrow"></span>
          </Link>
        </div>
      </div>

      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.875rem"}}>
          <p className="section-label" style={{marginBottom:0}}>RECENT ACTIVITY</p>
          <Link href="/dashboard/organization/notifications" style={{fontSize:"0.78rem",color:"#F47B20",textDecoration:"none",fontWeight:600}}>See all </Link>
        </div>
        <div className="activity-list">
          {activity.length===0 ? (
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"2rem",textAlign:"center",color:"#A3A3A3",fontSize:"0.875rem"}}>
              <div style={{fontSize:"1.75rem",marginBottom:"0.5rem"}}></div>
              Activity from your team will appear here
            </div>
          ) : activity.slice(0,8).map((act,i)=>(
            <div key={act.id||i} className={`activity-item ${act.isRead?"":"unread"}`}>
              <div className="activity-icon">{getActivityIcon(act.type)}</div>
              <div className="activity-body">
                <div className="activity-msg">
                  <strong>{act.actor||"Someone"}</strong> {act.verb}
                  {act.targetLabel&&<span className="activity-target">  {act.targetLabel}</span>}
                </div>
                <div className="activity-time">{fmtTime(act.createdAt)}</div>
              </div>
              {!act.isRead&&<div className="activity-dot"/>}
            </div>
          ))}
        </div>
      </div>

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
        .welcome-banner{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;background:#F0FDF4;border:1.5px solid rgba(22,163,74,0.3);border-left:4px solid #16A34A;padding:1rem 1.25rem;border-radius:10px}
        .wb-text{display:flex;flex-direction:column;gap:0.2rem;min-width:0}
        .wb-text strong{font-size:0.9rem;color:#15803D;display:block}
        .wb-text span{color:#166534;font-size:0.82rem;line-height:1.55}
        .wb-cta{background:#16A34A;color:#fff;border-radius:8px;padding:0.6rem 1.1rem;font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.06em;text-decoration:none;white-space:nowrap;flex-shrink:0}
        .wb-cta:hover{opacity:0.9}
        .ov-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .ov-header-left{display:flex;align-items:center;gap:0.875rem;min-width:0}
        .ov-logo-wrap{position:relative;flex-shrink:0}
        .ov-logo{width:64px;height:64px;border-radius:12px;overflow:hidden;background:#FFF7ED;border:2px solid rgba(244,123,32,0.3);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.5rem;color:#F47B20;cursor:pointer;transition:transform 0.2s}
        .ov-logo:hover{transform:scale(1.04)}
        .ov-logo img{width:100%;height:100%;object-fit:cover}
        .ov-logo-edit{position:absolute;bottom:-4px;right:-4px;background:#F47B20;border:2px solid #fff;border-radius:50%;width:20px;height:20px;font-size:0.55rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s}
        .ov-logo-edit:hover{background:#FF9340}
        .ov-company{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1}
        .ov-meta{font-size:0.8rem;color:#888;margin-top:0.2rem}
        .ov-id{font-family:var(--font-mono);font-size:0.72rem;color:#AAA}
        .ov-meta-links{display:flex;align-items:center;gap:0.75rem;margin-top:0.3rem;flex-wrap:wrap}
        .ov-private-badge{font-size:0.72rem;color:#737373;font-weight:600;background:#F5F5F5;padding:0.2rem 0.6rem;border-radius:20px}
        .ov-settings-btn{background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;border-radius:8px;padding:0.5rem 1rem;font-size:0.82rem;text-decoration:none;font-weight:600;transition:all 0.2s}
        .ov-settings-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .section-label{font-family:var(--font-display);font-size:0.72rem;letter-spacing:0.18em;color:#A3A3A3;margin-bottom:0.875rem;text-transform:uppercase}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
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
        .activity-item{display:flex;align-items:flex-start;gap:0.75rem;background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:0.875rem 1rem;position:relative}
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
