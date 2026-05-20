"use client";
// Staff messages — reuses same MessagesWidget logic
import MessagesWidget from "@/components/shared/MessagesWidget";

export default function StaffMessagesPage() {
  return (
    <div style={{padding:"1.5rem",fontFamily:"var(--font-body)"}}>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",marginBottom:"1rem"}}>Messages</h2>
      <p style={{color:"#737373",fontSize:"0.875rem"}}>Your conversations are accessible via the Messages button at the bottom right of the screen.</p>
    </div>
  );
}
