"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";

const MessagesPage = dynamic(
  () => import("@/app/dashboard/dealer/messages/page"),
  { ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading messages...</div> }
);

export default function StaffMessagesPage() {
  const [tab,     setTab]     = useState<"dealer"|"mine">("dealer");
  const [perms,   setPerms]   = useState<string[]>([]);
  const [dlrName, setDlrName] = useState("Dealer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/staff/me").catch(() => null),
      api.get("/api/v1/staff/me/dealer").catch(() => null),
    ]).then(([staffRes, dlrRes]) => {
      setPerms(staffRes?.data?.permissions || []);
      if (dlrRes?.data?.companyName) setDlrName(dlrRes.data.companyName);
    }).finally(() => setLoading(false));
  }, []);

  const canViewDealer = perms.includes("view_messages") || perms.includes("send_messages");

  if (loading) return <div style={{padding:"2rem",color:"#737373"}}>Loading...</div>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",margin:"0 0 4px"}}>Messages</h2>
          <p style={{fontSize:"13px",color:"#888",margin:0}}>
            {tab==="dealer" ? `Helping ${dlrName} manage conversations` : "Your personal conversations"}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:"8px",borderBottom:"2px solid #E5E5E5",paddingBottom:"0"}}>
        {canViewDealer && (
          <button onClick={()=>setTab("dealer")}
            style={{padding:"10px 20px",border:"none",background:"none",
              fontFamily:"var(--font-display)",fontSize:"13px",letterSpacing:"0.06em",cursor:"pointer",
              color:tab==="dealer"?"#F47B20":"#737373",
              borderBottom:tab==="dealer"?"2.5px solid #F47B20":"2.5px solid transparent",
              fontWeight:tab==="dealer"?700:400,marginBottom:"-2px",transition:"all .15s"}}>
            {dlrName} Messages
          </button>
        )}
        <button onClick={()=>setTab("mine")}
          style={{padding:"10px 20px",border:"none",background:"none",
            fontFamily:"var(--font-display)",fontSize:"13px",letterSpacing:"0.06em",cursor:"pointer",
            color:tab==="mine"?"#F47B20":"#737373",
            borderBottom:tab==="mine"?"2.5px solid #F47B20":"2.5px solid transparent",
            fontWeight:tab==="mine"?700:400,marginBottom:"-2px",transition:"all .15s"}}>
          My Messages
        </button>
      </div>

      {/* Info banner */}
      {tab==="dealer" && canViewDealer && (
        <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",
          padding:"10px 14px",fontSize:"13px",color:"#1D4ED8",lineHeight:1.5}}>
          <strong>Dealer view:</strong> You are viewing and replying as <strong>{dlrName}</strong>. Customers see the dealer name, not yours.
        </div>
      )}
      {tab==="mine" && (
        <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",
          padding:"10px 14px",fontSize:"13px",color:"#15803D",lineHeight:1.5}}>
          <strong>Your messages:</strong> Personal conversations  use this to message the dealer, colleagues, or anyone.
        </div>
      )}

      {/* Content */}
      {tab==="dealer" && !canViewDealer ? (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
          <div style={{fontSize:"2rem",marginBottom:"12px"}}></div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#DC2626",fontWeight:700}}>Permission Required</div>
          <p style={{color:"#737373",marginTop:"8px",fontSize:"14px"}}>You need message permissions to access dealer conversations.</p>
        </div>
      ) : (
        <MessagesPage/>
      )}
    </div>
  );
}
