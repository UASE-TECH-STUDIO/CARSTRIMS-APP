"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const ALL_NAV = [
  { href:"/dashboard/staff", label:"Overview", exact:true, perm:null },
  { href:"/dashboard/staff/inventory", label:"Inventory", perm:"view_inventory" },
  { href:"/dashboard/staff/sales", label:"Sales", perm:"view_sales" },
  { href:"/dashboard/staff/movements", label:"Movements", perm:"view_movements" },
  { href:"/dashboard/staff/cctv", label:"CCTV", perm:"view_cctv" },
  { href:"/dashboard/staff/reports", label:"Reports", perm:"view_reports" },
  { href:"/dashboard/staff/partners", label:"Partners", perm:"view_partners" },
  { href:"/dashboard/staff/notifications", label:"Notifications", perm:null },
  { href:"/dashboard/staff/settings", label:"Settings", perm:null },
];

export default function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => {
      setStaffInfo(r.data);
      setPermissions(r.data.permissions || []);
    }).catch(() => {});
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const hasAccess = (perm: string | null) => !perm || permissions.includes(perm);

  const doLogout = () => { logout(); router.push("/login"); };

  const sidebarBg = "#FFFFFF";
  const accentColor = "#F47B20";

  return (
    <div style={{display:"flex", minHeight:"100vh", background:"#F5F5F5", fontFamily:"var(--font-body)"}}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:99, display:"none"}}
          className="mobile-overlay" />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width:"240px", minHeight:"100vh", background:sidebarBg,
        borderRight:"1.5px solid #E5E5E5",
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        position:"fixed", left:0, top:0, bottom:0, zIndex:100,
        overflowY:"auto",
        transform:sidebarOpen ? "translateX(0)" : undefined,
      }}>
        {/* Brand */}
        <div>
          <div style={{padding:"1.25rem 1.5rem", borderBottom:"1.5px solid #E5E5E5", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{fontFamily:"var(--font-display)", fontSize:"1.1rem", letterSpacing:"0.2em", color:accentColor}}>CARSTRIMS</div>
            <button onClick={() => setSidebarOpen(false)} className="sidebar-close"
              style={{background:"none", border:"none", cursor:"pointer", color:"#737373", fontSize:"1.1rem", display:"none"}}>X</button>
          </div>

          {/* Staff badge */}
          <div style={{padding:"1rem 1.25rem", borderBottom:"1.5px solid #E5E5E5", background:"#FFF7ED"}}>
            <div style={{display:"flex", alignItems:"center", gap:"0.75rem"}}>
              <div style={{
                width:"38px", height:"38px", borderRadius:"50%",
                background:accentColor, color:"#fff",
                fontFamily:"var(--font-display)", fontSize:"1.1rem",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                {user?.fullName?.charAt(0).toUpperCase() || "S"}
              </div>
              <div>
                <div style={{fontSize:"0.85rem", fontWeight:600, color:"#1A1A1A"}}>{user?.fullName || "Staff"}</div>
                <div style={{fontSize:"0.7rem", color:accentColor}}>{staffInfo?.position || "Staff Member"}</div>
              </div>
            </div>
            {staffInfo?.dealerName && (
              <div style={{marginTop:"0.5rem", fontSize:"0.72rem", color:"#737373", background:"#F5F5F5", borderRadius:"5px", padding:"0.3rem 0.6rem"}}>
                {staffInfo.dealerName}
              </div>
            )}
          </div>

          {/* Permissions summary */}
          {permissions.length > 0 && (
            <div style={{padding:"0.75rem 1.25rem", borderBottom:"1.5px solid #E5E5E5"}}>
              <div style={{fontSize:"0.62rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3", marginBottom:"0.4rem"}}>YOUR ACCESS</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:"0.25rem"}}>
                {permissions.slice(0,4).map((p) => (
                  <span key={p} style={{
                    background:"#FFF7ED", border:"1px solid rgba(244,123,32,0.25)",
                    color:accentColor, fontSize:"0.6rem", padding:"0.15rem 0.45rem",
                    borderRadius:"20px", textTransform:"capitalize", whiteSpace:"nowrap",
                  }}>{p.replace(/_/g," ")}</span>
                ))}
                {permissions.length > 4 && (
                  <span style={{fontSize:"0.6rem", color:"#A3A3A3"}}>+{permissions.length - 4} more</span>
                )}
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{display:"flex", flexDirection:"column", padding:"0.75rem 0"}}>
            {ALL_NAV.map((item) => {
              if (!hasAccess(item.perm)) return null;
              const active = isActive(item.href, item.exact);
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display:"flex", alignItems:"center", gap:"0.75rem",
                    padding:"0.7rem 1.25rem", textDecoration:"none",
                    color:active ? accentColor : "#737373",
                    background:active ? "#FFF7ED" : "transparent",
                    borderLeft:active ? `3px solid ${accentColor}` : "3px solid transparent",
                    fontSize:"0.875rem", fontWeight:active ? 600 : 400,
                    transition:"all 0.15s",
                  }}>
                  <span style={{
                    width:"6px", height:"6px", borderRadius:"50%",
                    background:active ? accentColor : "#D4D4D4",
                    flexShrink:0,
                  }} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sign out */}
        <div style={{padding:"1rem 1.25rem", borderTop:"1.5px solid #E5E5E5"}}>
          <button onClick={doLogout} style={{
            display:"flex", alignItems:"center", gap:"0.75rem", width:"100%",
            padding:"0.7rem 0", background:"none", border:"none",
            color:"#A3A3A3", fontSize:"0.875rem", fontFamily:"var(--font-body)",
            cursor:"pointer",
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{marginLeft:"240px", flex:1, display:"flex", flexDirection:"column"}}>
        {/* Topbar */}
        <header style={{
          height:"60px", background:"#fff", borderBottom:"1.5px solid #E5E5E5",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 1.5rem", position:"sticky", top:0, zIndex:50,
        }}>
          <div style={{fontFamily:"var(--font-display)", fontSize:"1.1rem", letterSpacing:"0.06em", color:"#1A1A1A"}}>
            Staff Dashboard
          </div>
          <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
            <Link href="/feed" style={{fontSize:"0.78rem", color:"#F47B20", textDecoration:"none"}}>View Feed</Link>
            <div style={{
              width:"34px", height:"34px", borderRadius:"50%",
              background:"#F47B20", color:"#fff",
              fontFamily:"var(--font-display)", fontSize:"1rem",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {user?.fullName?.charAt(0).toUpperCase() || "S"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{flex:1, padding:"1.5rem", maxWidth:"1200px", width:"100%", margin:"0 auto"}}>
          {children}
        </main>
      </div>

      <style>{`
        @media(max-width:768px) {
          .mobile-overlay { display:block !important; }
          aside { transform:translateX(-100%); transition:transform 0.25s; }
          aside.open { transform:translateX(0); }
          .sidebar-close { display:block !important; }
          main { margin-left:0 !important; }
        }
      `}</style>
    </div>
  );
}