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

  useEffect(() => {
    // Don't redirect if already on setup page
    if (pathname.includes("/setup")) {
      setReady(true);
      return;
    }

    api.get("/api/v1/dealers/me")
      .then((r) => {
        const status = r.data.status;
        if (status === "approved" || status === "active") {
          setReady(true);
        } else if (status === "awaiting_approval" || status === "pending") {
          router.replace("/dashboard/dealer/setup");
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        // No dealer profile — redirect to setup
        router.replace("/dashboard/dealer/setup");
      });
  }, [pathname, router]);

  if (!ready && !pathname.includes("/setup")) {
    return (
      <div style={{
        minHeight:"100vh", background:"#F5F5F5",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexDirection:"column", gap:"1rem",
      }}>
        <div style={{fontFamily:"var(--font-display)", fontSize:"1.5rem", letterSpacing:"0.2em", color:"#F47B20"}}>
          CARSTRIMS
        </div>
        <div style={{
          width:"28px", height:"28px",
          border:"2px solid #E5E5E5", borderTopColor:"#F47B20",
          borderRadius:"50%", animation:"spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Setup page renders without sidebar
  if (pathname.includes("/setup")) return <>{children}</>;

  return (
    <div className="dealer-shell">
      <DealerSidebar />
      <div className="dealer-main">
        <DealerTopbar />
        <main className="dealer-content">{children}</main>
      </div>
      <style>{`
        .dealer-shell { display:flex; min-height:100vh; background:#F5F5F5; }
        .dealer-main { flex:1; margin-left:240px; display:flex; flex-direction:column; min-height:100vh; min-width:0; }
        .dealer-content { flex:1; padding:1.75rem; }
        @media(max-width:768px) {
          .dealer-main { margin-left:0; }
          .dealer-content { padding:1rem; }
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