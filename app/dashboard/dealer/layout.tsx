"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import DealerSidebar from "@/components/layout/DealerSidebar";
import MessagesWidget from "@/components/shared/MessagesWidget";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/hooks/useSidebar";
import NotificationBell from "@/components/ui/NotificationBell";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const PAGE_TITLES: Record<string,string> = {
  "/dashboard/dealer":"Overview",
  "/dashboard/dealer/cars":"Cars & Inventory",
  "/dashboard/dealer/sales":"Sales",
  "/dashboard/dealer/expenses":"Expenses",
  "/dashboard/dealer/staff":"Staff Management",
  "/dashboard/dealer/partners":"Partner Management",
  "/dashboard/dealer/requests":"Customer Requests",
  "/dashboard/dealer/appointments":"Appointments",
  "/dashboard/dealer/movements":"Vehicle Movement",
  "/dashboard/dealer/cctv":"CCTV Monitoring",
  "/dashboard/dealer/reports":"Reports & Analytics",
  "/dashboard/dealer/notifications":"Notifications",
  "/dashboard/dealer/settings":"Settings",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h>=5&&h<12) return "Good morning";
  if (h>=12&&h<17) return "Good afternoon";
  if (h>=17&&h<21) return "Good evening";
  return "Good night";
}

function DealerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebar();
  const { user } = useAuthStore();
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

  const isPending = dealerStatus==="awaiting_approval" || dealerStatus==="pending";

  return (
    <div className="dealer-shell">
      {isOpen && <div className="mobile-overlay" onClick={close}/>}
      <DealerSidebar isOpen={isOpen} onClose={close}/>
      <div className="shell-main">
        <header className="shell-topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={toggle} aria-label="Toggle menu">
              <span className="hb-line"/>
              <span className="hb-line"/>
              <span className="hb-line"/>
            </button>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-date">{new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="greeting-text">
              {getGreeting()}, <strong className="greeting-name">{user?.fullName?.split(" ")[0]||"Dealer"}</strong>
            </span>
            <NotificationBell/>
            <button className="avatar-btn" onClick={()=>router.push("/dashboard/dealer/settings")}>
              {dealer?.logo
                ? <img src={dealer.logo} alt="" className="avatar-img"/>
                : <span className="avatar-letter">{user?.fullName?.charAt(0).toUpperCase()||"D"}</span>
              }
            </button>
          </div>
        </header>

        {isPending && (
          <div className="pending-notice">
            <span>⏳</span>
            <span>
              <strong>Pending Approval:</strong> Your account is under review. Listings are hidden until a CARSTRIMS admin approves your account.
            </span>
          </div>
        )}

        <main className="shell-content">{children}</main>
      </div>

      <MessagesWidget accentColor="#F47B20"/>

      <style>{`
        .dealer-shell{display:flex;min-height:100vh;background:#F5F5F5;position:relative}
        .mobile-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:55;cursor:pointer}
        .shell-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .shell-topbar{height:64px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.75rem;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.06);flex-shrink:0;gap:1rem}
        .topbar-left{display:flex;align-items:center;gap:0.875rem;min-width:0}
        .hamburger-btn{display:none;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:0.4rem;border-radius:6px;flex-shrink:0}
        .hamburger-btn:hover{background:#F5F5F5}
        .hb-line{display:block;width:20px;height:2px;background:#525252;border-radius:2px}
        .page-title{font-family:var(--font-display);font-size:1.15rem;letter-spacing:0.06em;color:#1A1A1A;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .page-date{font-size:0.65rem;color:#AAA;letter-spacing:0.04em}
        .topbar-right{display:flex;align-items:center;gap:0.875rem;flex-shrink:0}
        .greeting-text{font-size:0.8rem;color:#888;white-space:nowrap}
        .greeting-name{color:#F47B20;font-weight:600}
        .avatar-btn{width:36px;height:36px;border-radius:50%;border:2px solid #F47B20;background:#FFF0E6;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;padding:0}
        .avatar-btn:hover{border-color:#FF9340;transform:scale(1.05)}
        .avatar-img{width:100%;height:100%;object-fit:cover}
        .avatar-letter{font-family:var(--font-display);font-size:1rem;color:#F47B20;font-weight:600}
        .pending-notice{background:#FFF7ED;border-bottom:2px solid rgba(244,123,32,0.3);padding:0.6rem 1.75rem;font-size:0.8rem;color:#C4621A;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;flex-shrink:0}
        .pending-notice strong{color:#F47B20}
        .shell-content{flex:1;padding:1.75rem;width:100%;box-sizing:border-box}
        @media(max-width:768px){
          .hamburger-btn{display:flex!important}
          .shell-main{margin-left:0}
          .shell-content{padding:1rem}
          .greeting-text{display:none}
          .page-date{display:none}
          .shell-topbar{padding:0 1rem}
        }
        @media(min-width:769px){
          .hamburger-btn{display:none!important}
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
