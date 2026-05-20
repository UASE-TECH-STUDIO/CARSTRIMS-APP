"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function UserDashboardPage() {
  const { user: me } = useAuthStore();
  const [favCount, setFavCount] = useState(0);
  const [reqCount, setReqCount] = useState(0);
  const [aptCount, setAptCount] = useState(0);

  useEffect(() => {
    api.get("/api/v1/users/favorites").then(r => setFavCount((r.data||[]).length)).catch(()=>setFavCount(0));
    api.get("/api/v1/users/requests").then(r => setReqCount((Array.isArray(r.data)?r.data:r.data?.requests||[]).length)).catch(()=>setReqCount(0));
    api.get("/api/v1/users/appointments").then(r => setAptCount((r.data?.appointments||r.data||[]).length)).catch(()=>setAptCount(0));
  }, []);

  const STATS = [
    { label:"Saved Vehicles",  val:favCount, color:"#DC2626", href:"/dashboard/user/favorites",     svg:'<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' },
    { label:"My Requests",     val:reqCount, color:"#F47B20", href:"/dashboard/user/requests",      svg:'<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>' },
    { label:"Appointments",    val:aptCount, color:"#3B8BD4", href:"/dashboard/user/appointments",  svg:'<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>' },
  ];

  const ACTIONS = [
    { label:"Browse Cars",    href:"/feed",                          svg:'<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>' },
    { label:"Messages",       href:"/dashboard/user/messages",       svg:'<path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>' },
    { label:"Notifications",  href:"/dashboard/user/notifications",  svg:'<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>' },
    { label:"My Profile",     href:"/dashboard/user/profile",        svg:'<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>' },
    { label:"Settings",       href:"/dashboard/user/settings",       svg:'<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' },
  ];

  const Svg = ({ path }: { path: string }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" dangerouslySetInnerHTML={{ __html: path }}/>
  );

  return (
    <div className="home">
      <div className="welcome-card">
        <div className="welcome-avatar">
          {me?.profilePicture
            ? <img src={me.profilePicture} alt="" className="welcome-pic"/>
            : <span>{(me?.fullName||"U").charAt(0).toUpperCase()}</span>
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
            <span className="sc-icon" style={{color:c.color}}><Svg path={c.svg}/></span>
            <div className="sc-val" style={{color:c.color}}>{c.val}</div>
            <div className="sc-label">{c.label}</div>
            <div className="sc-go">View all</div>
          </Link>
        ))}
      </div>

      <div className="section-title">QUICK ACTIONS</div>
      <div className="actions-grid">
        {ACTIONS.map(a=>(
          <Link key={a.label} href={a.href} className="action-card">
            <span className="ac-icon"><Svg path={a.svg}/></span>
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
        .sc-icon{display:flex;align-items:center;justify-content:center;margin-bottom:0.1rem}
        .sc-val{font-family:var(--font-display);font-size:1.8rem;line-height:1}
        .sc-label{font-size:0.68rem;color:#888;text-transform:uppercase;letter-spacing:0.06em;text-align:center}
        .sc-go{font-size:0.62rem;color:#F47B20;margin-top:0.2rem}
        .actions-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.75rem}
        .action-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:1rem 0.875rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem;text-decoration:none;transition:all 0.2s;color:#525252}
        .action-card:hover{border-color:#F47B20;background:#FFF7ED;transform:translateY(-1px);color:#F47B20}
        .ac-icon{display:flex;align-items:center;justify-content:center}
        .ac-label{font-size:0.72rem;color:#666;text-align:center;font-weight:500;line-height:1.2}
        .action-card:hover .ac-label{color:#F47B20}
        @media(max-width:480px){.stats-row{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
}
