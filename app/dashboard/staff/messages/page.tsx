"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";

const DealerMessages = dynamic(
  () => import("@/app/dashboard/dealer/messages/page"),
  { ssr: false, loading: () => <div style={{padding:"2rem",color:"#737373"}}>Loading messages...</div> }
);

export default function StaffMessagesPage() {
  const [tab,      setTab]      = useState<"dealer"|"mine">("dealer");
  const [perms,    setPerms]    = useState<string[]>([]);
  const [dlrName,  setDlrName]  = useState("Dealer");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/staff/me").catch(()=>null),
      api.get("/api/v1/staff/me/dealer").catch(()=>null),
    ]).then(([staffRes, dlrRes]) => {
      setPerms(staffRes?.data?.permissions || []);
      if (dlrRes?.data?.companyName) setDlrName(dlrRes.data.companyName);
    }).finally(() => setLoading(false));
  }, []);

  const canViewDealer = perms.includes("view_messages") || perms.includes("send_messages");

  if (loading) return <div style={{padding:"2rem",color:"#737373"}}>Loading...</div>;

  const tabBtn = (id: "dealer"|"mine", label: string) => (
    <button onClick={()=>setTab(id)}
      style={{flex:1,padding:"10px 16px",border:`1.5px solid ${tab===id?"#F47B20":"#E5E5E5"}`,
        background:tab===id?"#F47B20":"#fff",color:tab===id?"#fff":"#525252",
        borderRadius:"8px",fontSize:"14px",cursor:"pointer",fontWeight:tab===id?700:400,
        fontFamily:"var(--font-body)",transition:"all .15s"}}>
      {label}
    </button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",margin:"0 0 4px"}}>Messages</h2>
        <p style={{fontSize:"13px",color:"#888",margin:0}}>
          Help manage dealer conversations or send your own messages
        </p>
      </div>

      <div style={{display:"flex",gap:"8px"}}>
        {canViewDealer && tabBtn("dealer", `${dlrName} Messages (Help)`)}
        {tabBtn("mine", "My Messages")}
      </div>

      {tab === "dealer" && canViewDealer && (
        <div>
          <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",
            padding:"10px 14px",fontSize:"13px",color:"#1D4ED8",marginBottom:"12px",lineHeight:1.5}}>
            <strong>Dealer messages:</strong> You are viewing and replying as <strong>{dlrName}</strong>. Customers and partners see the dealer name, not yours.
          </div>
          <DealerMessages/>
        </div>
      )}

      {tab === "mine" && (
        <div>
          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",
            padding:"10px 14px",fontSize:"13px",color:"#15803D",marginBottom:"12px",lineHeight:1.5}}>
            <strong>Your messages:</strong> Personal conversations with the dealer, colleagues, or anyone on the platform.
          </div>
          <DealerMessages/>
        </div>
      )}

      {!canViewDealer && tab === "dealer" && (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
          <div style={{fontSize:"2rem",marginBottom:"12px"}}></div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#DC2626",fontWeight:700}}>Message Permission Required</div>
          <p style={{color:"#737373",marginTop:"8px",fontSize:"14px"}}>You need "View Messages" or "Send Messages" permission to access dealer messages.</p>
        </div>
      )}
    </div>
  );
}
