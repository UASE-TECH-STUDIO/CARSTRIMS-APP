"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import DealerSidebar from "@/components/layout/DealerSidebar";
import DealerTopbar from "@/components/layout/DealerTopbar";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

function DealerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [dealerStatus, setDealerStatus] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.includes("/setup")) { setReady(true); return; }
    api.get("/api/v1/dealers/me")
      .then((r) => {
        const d = r.data;
        setDealerStatus(d?.status || null);
        if (!d?.companyName) {
          router.replace("/dashboard/dealer/setup");
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        if (err?.response?.status !== 401) {
          router.replace("/dashboard/dealer/setup");
        }
      });
  }, [pathname, router]);

  if (!ready && !pathname.includes("/setup")) {
    return (
      <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{width:"28px",height:"28px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (pathname.includes("/setup")) return <>{children}</>;

  const isPending = dealerStatus === "awaiting_approval" || dealerStatus === "pending";

  return (
    <div className="dealer-shell">
      <DealerSidebar />
      <div className="dealer-main">
        <DealerTopbar />
        {isPending && (
          <div style={{background:"#FFF7ED",borderBottom:"2px solid #F47B20",padding:"0.6rem 1.75rem",fontSize:"0.82rem",color:"#C4621A",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
            <span>&#9203;</span>
            <span><strong>Pending Approval:</strong> Your account is under review. Your listings are hidden from buyers until approved. You can still set up your dashboard, add cars and manage staff.</span>
          </div>
        )}
        <main className="dealer-content">{children}</main>
      </div>
      <style>{`
        .dealer-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .dealer-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .dealer-content{flex:1;padding:1.75rem}
        @media(max-width:768px){.dealer-main{margin-left:0}.dealer-content{padding:1rem}}
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
