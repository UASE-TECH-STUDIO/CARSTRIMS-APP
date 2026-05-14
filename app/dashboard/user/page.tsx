"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";

export default function UserHomePage() {
  const { user } = useAuthStore();
  const [me, setMe] = useState<any>(null);
  const [favCount, setFavCount]   = useState(0);
  const [reqCount, setReqCount]   = useState(0);
  const [aptCount, setAptCount]   = useState(0);

  useEffect(() => {
    api.get("/api/v1/auth/me").then(r=>setMe(r.data)).catch(()=>{});

    // Favorites count — from unified collection
    api.get("/api/v1/users/favorites")
      .then(r => setFavCount(Array.isArray(r.data) ? r.data.length : 0))
      .catch(()=>setFavCount(0));

    // Pre-orders (requests) — defensive: only count if array returned
    api.get("/api/v1/users/requests")
      .then(r => {
        const data = r.data;
        if (Array.isArray(data)) setReqCount(data.length);
        else if (data?.requests) setReqCount(Array.isArray(data.requests) ? data.requests.length : 0);
        else setReqCount(0);
      })
      .catch(()=>setReqCount(0));

    // Appointments — defensive
    api.get("/api/v1/users/appointments")
      .then(r => {
        const data = r.data;
        if (Array.isArray(data)) setAptCount(data.length);
        else if (data?.appointments) setAptCount(Array.isArray(data.appointments) ? data.appointments.length : 0);
        else setAptCount(0);
      })
      .catch(()=>setAptCount(0));
  }, []);

  const STATS = [
    { label:"Saved Vehicles", val:favCount, icon:"❤️", href:"/dashboard/user/favorites", color:"#DC2626" },
    { label:"Pre-Orders",     val:reqCount, icon:"📋", href:"/dashboard/user/preorders",  color:"#F47B20" },
    { label:"Appointments",   val:aptCount, icon:"📅", href:"/dashboard/user/appointments", color:"#3B8BD4" },
  ];

  const ACTIONS = [
    { label:"Browse Vehicles", icon:"🚗", href:"/feed" },
    { label:"Messages",        icon:"💬", href:"/dashboard/user/messages" },
    { label:"Notifications",   icon:"🔔", href:"/dashboard/user/notifications" },
    { label:"My Profile",      icon:"👤", href:"/dashboard/user/profile" },
    { label:"Settings",        icon:"⚙️", href:"/dashboard/user/settings" },
  ];

  return (
    <div className="home">
      <div className="welcome-card">
        <div className="welcome-avatar">
          {me?.profilePicture
            ? <img src={me.profilePicture} alt="" className="welcome-pic"/>
            : <span>{(me?.fullName||user?.fullName||"U").charAt(0).toUpperCase()}</span>
          }
        </div>
        <div>
          <h2 className="welcome-name">Hello, {me?.fullName?.split(" ")[0]||"there"}!</h2>
          <p className="welcome-sub">Welcome to your CARSTRIMS dashboard</p>
        </div>
      </div>

      <div className="section-title">YOUR ACTIVITY</div>
      <div className="stats-row">
        {STATS.map(c=>(
          <Link key={c.label} href={c.href} className="stat-card">
            <span className="sc-icon">{c.icon}</span>
            <div className="sc-val" style={{color:c.color}}>{c.val}</div>
            <div className="sc-label">{c.label}</div>
            <div className="sc-go">View all →</div>
          </Link>
        ))}
      </div>

      <div className="section-title">QUICK ACTIONS</div>
      <div className="actions-grid">
        {ACTIONS.map(a=>(
          <Link key={a.label} href={a.href} className="action-card">
            <span className="ac-icon">{a.icon}</span>
            <span className="ac-label">{a.label}</span>
          </Link>
        ))}
      </div>

      <style>{`
        .home{display:flex;flex-direction:column;gap:1.25rem}
        .welcome-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;padding:1.5rem;display:flex;align-items:center;gap:1.25rem}
        .welcome-avatar{width:56px;height:56px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1.5rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:3px solid #F47B20}
        .welcome-pic{width:100%;height:100%;object-fit:cover}
        .welcome-name{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.04em;color:#1A1A1A;line-height:1}
        .welcome-sub{font-size:0.825rem;color:#888;margin-top:0.3rem}
        .section-title{font-size:0.7rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#888;margin-top:0.25rem}
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:0.875rem}
        .stat-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:0.25rem;text-decoration:none;transition:all 0.2s}
        .stat-card:hover{border-color:#F47B20;transform:translateY(-2px);box-shadow:0 4px 16px rgba(244,123,32,0.1)}
        .sc-icon{font-size:1.3rem}
        .sc-val{font-family:var(--font-display);font-size:1.8rem;line-height:1}
        .sc-label{font-size:0.68rem;color:#888;text-transform:uppercase;letter-spacing:0.06em;text-align:center}
        .sc-go{font-size:0.62rem;color:#F47B20;margin-top:0.2rem}
        .actions-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.75rem}
        .action-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:1rem 0.875rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s}
        .action-card:hover{border-color:#F47B20;background:#FFF7ED;transform:translateY(-1px)}
        .ac-icon{font-size:1.4rem}
        .ac-label{font-size:0.72rem;color:#666;text-align:center;font-weight:500;line-height:1.2}
        .action-card:hover .ac-label{color:#F47B20}
      `}</style>
    </div>
  );
}
