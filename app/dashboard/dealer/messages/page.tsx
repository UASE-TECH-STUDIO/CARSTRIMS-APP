"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMessagesStore } from "@/store/messagesStore";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { openConversation } = useMessagesStore();

  useEffect(() => {
    const conv = searchParams.get("conv");
    if (conv) {
      // Small delay to let MessagesWidget mount first
      setTimeout(() => openConversation(conv), 400);
    }
  }, []);

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"60vh", gap:"1rem",
      fontFamily:"var(--font-body)", color:"#737373"
    }}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.1em",color:"#F47B20"}}>
        MESSAGES
      </div>
      <p style={{fontSize:"0.875rem",textAlign:"center",maxWidth:"320px",lineHeight:1.6}}>
        Click the orange MSG button at the bottom-right to open your conversations.
      </p>
    </div>
  );
}