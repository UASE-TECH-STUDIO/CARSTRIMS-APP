"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import DealerSidebar from "@/components/layout/DealerSidebar";
import MessagesWidget from "@/components/shared/MessagesWidget";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/hooks/useSidebar";
import NotificationBell from "@/components/ui/NotificationBell";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import api from "@/lib/api";

const PAGE_TITLES: Record<string,string> = {
  "/dashboard/dealer":"Overview","/dashboard/dealer/cars":"Cars & Inventory",
  "/dashboard/dealer/sales":"Sales","/dashboard/dealer/expenses":"Expenses",
  "/dashboard/dealer/staff":"Staff Management","/dashboard/dealer/partners":"Partner Management",
  "/dashboard/dealer/requests":"Customer Requests","/dashboard/dealer/appointments":"Appointments",
  "/dashboard/dealer/movements":"Vehicle Movement","/dashboard/dealer/cctv":"CCTV Monitoring",
  "/dashboard/dealer/reports":"Reports & Analytics","/dashboard/dealer/notifications":"Notifications",
  "/dashboard/dealer/settings":"Settings",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h>=5&&h<12) return "Good morning"; if (h>=12&&h<17) return "Good afternoon";
  if (h>=17&&h<21) return "Good evening"; return "Good night";
}

function DealerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebar();
  const { user, logout } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [dealerStatus, setDealerStatus] = useState<string|null>(null);
  const [dealer, setDealer] = useState<any>(null);
  const title = PAGE_TITLES[pathname] || "Dashboard";

  useEffect(() => { close(); }, [pathname]);

  useEffect(() => {
    if (pathname.includes("/setup")) { setReady(true); return; }
    api.get("/api/v1/dealers/me")
      .then((r) => {
        setDealer(r.data);
        setDealerStatus(r.data?.status);
        if (!r.data?.companyName) router.replace("/dashboard/dealer/setup");
        else setReady(true);
      })
      .catch(() => router.replace("/dashboard/dealer/setup"));
  }, [pathname, router]);

  if (!ready && !pathname.includes("/setup")) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (pathname.includes("/setup")) return <>{children}</>;

  const isPending = dealerStatus==="awaiting_approval"||dealerStatus==="pending";

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#F5F5F5",position:"relative"}}>
      {/* Mobile overlay */}
      {isOpen&&<div onClick={close} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:55,cursor:"pointer"}}/>}

      {/* Sidebar */}
      <DealerSidebar isOpen={isOpen} onClose={close} />

      {/* Main */}
      <div style={{flex:1,marginLeft:"240px",display:"flex",flexDirection:"column",minHeight:"100vh",minWidth:0}}>
        {/* Topbar */}
        <header style={{height:"60px",background:"#fff",borderBottom:"1.5px solid #E5E5E5",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.75rem",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",flexShrink:0,gap:"0.75rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            {/* Hamburger */}
            <button onClick={toggle} style={{background:"none",border:"none",cursor:"pointer",padding:"0.25rem",display:"flex",flexDirection:"column",gap:"4px",flexShrink:0}}>
              <span style={{display:"block",width:"20px",height:"2px",background:"#525252",borderRadius:"2px",transition:"all 0.2s"}}/>
              <span style={{display:"block",width:"20px",height:"2px",background:"#525252",borderRadius:"2px",transition:"all 0.2s"}}/>
              <span style={{display:"block",width:"20px",height:"2px",background:"#525252",borderRadius:"2px",transition:"all 0.2s"}}/>
            </button>
            <div>
              <h1 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A",lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</h1>
              <p style={{fontSize:"0.62rem",color:"#AAA",letterSpacing:"0.04em",display:"none"}} className="topbar-date">{new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.875rem",flexShrink:0}}>
            <span style={{fontSize:"0.78rem",color:"#888",whiteSpace:"nowrap"}} className="topbar-greeting">{getGreeting()}, <strong style={{color:"#F47B20"}}>{user?.fullName?.split(" ")[0]||"Dealer"}</strong></span>
            <NotificationBell />
            <button onClick={()=>router.push("/dashboard/dealer/settings")} style={{width:"34px",height:"34px",borderRadius:"50%",border:"2px solid #F47B20",background:"#FFF0E6",cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all 0.2s",flexShrink:0}}>
              {dealer?.logo?<img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#F47B20"}}>{user?.fullName?.charAt(0).toUpperCase()||"D"}</span>}
            </button>
          </div>
        </header>

        {isPending&&(
          <div style={{background:"#FFF7ED",borderBottom:"2px solid #F47B20",padding:"0.6rem 1.75rem",fontSize:"0.82rem",color:"#C4621A",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap",flexShrink:0}}>
            <span>⏳</span>
            <span><strong>Pending Approval:</strong> Your account is under review. Listings are hidden until a CARSTRIMS admin approves your account. You can still add cars, staff, and set up your dashboard.</span>
          </div>
        )}
        <main style={{flex:1,padding:"1.75rem",width:"100%",boxSizing:"border-box"}}>{children}</main>
      </div>
      <MessagesWidget accentColor="#F47B20" />

      <style>{`
        @media(max-width:768px){
          div[style*="marginLeft:240px"]{margin-left:0!important}
          main[style*="padding:1.75rem"]{padding:1rem!important}
          .topbar-greeting{display:none!important}
          .topbar-date{display:block!important}
        }
      `}</style>
    </div>
  );
}

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["DEALER_ADMIN"]}>
      <DealerShell>{children}</DealerShell>
    </AuthGuard>
  );
}
