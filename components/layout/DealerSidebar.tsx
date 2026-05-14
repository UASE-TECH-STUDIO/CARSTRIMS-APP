"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { href:"/dashboard/dealer", label:"Overview", icon:"▦", exact:true },
  { href:"/dashboard/dealer/cars", label:"Cars & Inventory", icon:"▣" },
  { href:"/dashboard/dealer/sales", label:"Sales", icon:"◈" },
  { href:"/dashboard/dealer/expenses", label:"Expenses", icon:"◉" },
  { href:"/dashboard/dealer/staff", label:"Staff", icon:"◎" },
  { href:"/dashboard/dealer/partners", label:"Partners", icon:"⊕" },
  { href:"/dashboard/dealer/requests", label:"Requests", icon:"◔" },
  { href:"/dashboard/dealer/appointments", label:"Appointments", icon:"◷" },
  { href:"/dashboard/dealer/movements", label:"Movements", icon:"↺" },
  { href:"/dashboard/dealer/cctv", label:"CCTV", icon:"◑" },
  { href:"/dashboard/dealer/reports", label:"Reports", icon:"▤" },
  { href:"/dashboard/dealer/notifications", label:"Notifications", icon:"◓" },
  { href:"/dashboard/dealer/settings", label:"Settings", icon:"⚙" },
];

interface Props { isOpen?: boolean; onClose?: () => void; }

export default function DealerSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dealer, setDealer] = useState<any>(null);

  useEffect(() => {
    api.get("/api/v1/dealers/me").then((r) => setDealer(r.data)).catch(() => {});
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const handleNav = () => { if (typeof window !== "undefined" && window.innerWidth <= 768) onClose?.(); };

  return (
    <>
      <aside className={`dealer-sidebar${isOpen?" mobile-open":""}`}>
        <div className="sb-brand">
          <span className="sb-bi">◈</span>
          <span className="sb-bn">CARSTRIMS</span>
          <button className="sb-x" onClick={onClose}>✕</button>
        </div>

        <Link href="/dashboard/dealer/settings" className="sb-profile" onClick={handleNav}>
          <div className="sb-av">
            {dealer?.logo?<img src={dealer.logo} alt=""/>:<span>{(dealer?.companyName||user?.fullName||"D").charAt(0).toUpperCase()}</span>}
          </div>
          <div className="sb-info">
            <div className="sb-name">{dealer?.companyName||user?.fullName||"Dealer"}</div>
            {dealer?.dealerId&&<div className="sb-id">{dealer.dealerId}</div>}
          </div>
          <span className="sb-edit">✏</span>
        </Link>

        <nav className="sb-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className={`sb-item${isActive(item.href,(item as any).exact)?" active":""}`}
              onClick={handleNav}>
              <span className="sb-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="sb-div"/>
          <Link href="/feed" className="sb-item feed" onClick={handleNav}>
            <span className="sb-icon">⌂</span><span>View Feed</span>
          </Link>
        </nav>

        <div className="sb-bot">
          <div className="sb-dev">Powered by <strong>UASE TECH STUDIO</strong></div>
          <button className="sb-out" onClick={()=>{logout();router.push("/login");}}>↩ Sign Out</button>
        </div>
      </aside>

      <style>{`
        .dealer-sidebar{width:240px;height:100vh;background:#fff;border-right:1.5px solid #E5E5E5;display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:60;overflow-y:auto}
        .sb-brand{display:flex;align-items:center;gap:0.6rem;padding:1.1rem 1rem;background:#1A1A1A;border-bottom:1px solid #E5E5E5;flex-shrink:0;min-height:56px}
        .sb-bi{font-size:1.1rem;color:#F47B20}
        .sb-bn{font-family:var(--font-display);font-size:1rem;letter-spacing:0.2em;color:#fff;flex:1}
        .sb-x{display:none;background:none;border:none;color:#aaa;font-size:1rem;cursor:pointer;padding:0.25rem}
        .sb-profile{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:#FFF7ED;text-decoration:none;transition:background 0.15s;flex-shrink:0}
        .sb-profile:hover{background:#FFEDD5}
        .sb-av{width:34px;height:34px;border-radius:8px;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:0.95rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:2px solid #F47B20}
        .sb-av img{width:100%;height:100%;object-fit:cover}
        .sb-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:0.08rem}
        .sb-name{font-size:0.8rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sb-id{font-size:0.6rem;color:#A3A3A3;font-family:monospace}
        .sb-edit{font-size:0.75rem;color:#A3A3A3}
        .sb-nav{display:flex;flex-direction:column;flex:1;padding:0.4rem 0;overflow-y:auto}
        .sb-item{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 1rem;text-decoration:none;color:#525252;font-size:0.82rem;transition:all 0.15s;border-left:3px solid transparent;white-space:nowrap}
        .sb-item:hover{color:#F47B20;background:#FFF7ED}
        .sb-item.active{color:#F47B20;background:rgba(244,123,32,0.06);border-left-color:#F47B20;font-weight:600}
        .sb-item.feed{color:#A3A3A3}
        .sb-item.feed:hover{color:#F47B20}
        .sb-icon{font-size:0.9rem;width:16px;text-align:center;flex-shrink:0}
        .sb-div{height:1px;background:#E5E5E5;margin:0.4rem 1rem}
        .sb-bot{padding:0.875rem 1rem;border-top:1px solid #E5E5E5;flex-shrink:0}
        .sb-dev{font-size:0.6rem;color:#C0C0C0;text-align:center;margin-bottom:0.5rem}
        .sb-dev strong{color:#F47B20}
        .sb-out{display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.55rem 0;background:none;border:none;color:#A3A3A3;font-size:0.82rem;font-family:var(--font-body);cursor:pointer;transition:color 0.2s}
        .sb-out:hover{color:#DC2626}
        @media(max-width:768px){
          .sb-x{display:block}
          .dealer-sidebar{transform:translateX(-100%);transition:transform 0.25s ease}
          .dealer-sidebar.mobile-open{transform:translateX(0)}
        }
      `}</style>
    </>
  );
}
