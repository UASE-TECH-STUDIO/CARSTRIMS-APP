"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NetworkErrorPage() {
  const router = useRouter();
  return (
    <div style={{
      minHeight:"100vh", background:"#F5F5F5", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"2rem",
      fontFamily:"var(--font-body)",
    }}>
      <div style={{
        maxWidth:"440px", width:"100%", background:"#fff",
        borderRadius:"16px", padding:"2.5rem",
        boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
        display:"flex", flexDirection:"column", alignItems:"center",
        gap:"1.25rem", textAlign:"center",
      }}>
        <div style={{fontSize:"3rem"}}>No Connection</div>
        <div style={{fontFamily:"var(--font-display)", fontSize:"1.5rem", letterSpacing:"0.04em", color:"#1A1A1A"}}>
          Network Error
        </div>
        <p style={{fontSize:"0.875rem", color:"#737373", lineHeight:"1.6", maxWidth:"320px"}}>
          We could not connect to the CARSTRIMS server. Please check your internet connection and try again.
        </p>
        <div style={{display:"flex", flexDirection:"column", gap:"0.5rem", width:"100%", fontSize:"0.825rem", color:"#A3A3A3", background:"#F5F5F5", borderRadius:"8px", padding:"1rem", textAlign:"left"}}>
          <div>Check that you are connected to the internet</div>
          <div>Try refreshing the page</div>
          <div>If the problem persists, the server may be starting up (this can take 30-60 seconds)</div>
        </div>
        <div style={{display:"flex", gap:"0.75rem", width:"100%"}}>
          <button
            onClick={() => router.back()}
            style={{flex:1, background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#737373", borderRadius:"8px", padding:"0.875rem", fontFamily:"var(--font-body)", fontSize:"0.875rem", cursor:"pointer"}}>
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{flex:1, background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"0.875rem", fontFamily:"var(--font-display)", fontSize:"0.9rem", letterSpacing:"0.08em", cursor:"pointer"}}>
            RETRY
          </button>
        </div>
        <Link href="/feed" style={{fontSize:"0.78rem", color:"#A3A3A3", textDecoration:"none"}}>
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}