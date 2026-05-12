"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  const msg = error?.message || "";
  let title = "Something went wrong";
  let description = "An unexpected error occurred. Our team has been notified.";
  let action = "Try Again";

  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
    title = "Connection Problem";
    description = "We could not reach the CARSTRIMS server. Please check your internet connection and try again.";
    action = "Retry";
  } else if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("session")) {
    title = "Session Expired";
    description = "Your login session has expired. Please sign in again to continue.";
    action = "Sign In";
  } else if (msg.includes("403") || msg.includes("permission") || msg.includes("forbidden")) {
    title = "Access Denied";
    description = "You do not have permission to view this page. If you think this is a mistake, please contact support.";
    action = "Go Back";
  } else if (msg.includes("404") || msg.includes("not found")) {
    title = "Page Not Found";
    description = "The page or item you are looking for does not exist or has been removed.";
    action = "Go Home";
  } else if (msg.toLowerCase().includes("already") && msg.toLowerCase().includes("email")) {
    title = "Email Already Registered";
    description = "An account with this email address already exists. Please sign in or use a different email address.";
    action = "Sign In";
  } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
    title = "Already Registered";
    description = "This account already exists on CARSTRIMS. Please sign in to continue.";
    action = "Sign In";
  } else if (msg.includes("500") || msg.includes("server")) {
    title = "Server Error";
    description = "Something went wrong on our end. Please wait a moment and try again. If this keeps happening, please contact support.";
    action = "Try Again";
  } else if (msg.includes("Cannot read") || msg.includes("undefined") || msg.includes("null")) {
    title = "Page Failed to Load";
    description = "This page encountered a loading error. This sometimes happens after an update. Please refresh the page to fix it.";
    action = "Refresh Page";
  }

  const handleAction = () => {
    if (action === "Sign In") { router.push("/login"); }
    else if (action === "Go Back") { router.back(); }
    else if (action === "Go Home") { router.push("/feed"); }
    else { reset(); }
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#F5F5F5", display:"flex",
      alignItems:"center", justifyContent:"center",
      padding:"2rem", fontFamily:"var(--font-body)",
    }}>
      <div style={{
        maxWidth:"480px", width:"100%", background:"#fff",
        borderRadius:"16px", padding:"2.5rem",
        boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
        display:"flex", flexDirection:"column", alignItems:"center",
        gap:"1.25rem", textAlign:"center",
      }}>
        <div style={{fontSize:"3rem"}}>Oops</div>
        <div style={{fontFamily:"var(--font-display)", fontSize:"1.5rem", letterSpacing:"0.04em", color:"#1A1A1A"}}>
          {title}
        </div>
        <p style={{fontSize:"0.9rem", color:"#737373", lineHeight:"1.7", maxWidth:"360px"}}>
          {description}
        </p>

        {process.env.NODE_ENV === "development" && (
          <div style={{background:"#F5F5F5", border:"1px solid #E5E5E5", borderRadius:"8px", padding:"0.875rem", width:"100%", textAlign:"left"}}>
            <div style={{fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#A3A3A3", marginBottom:"0.4rem"}}>
              Dev Info
            </div>
            <code style={{fontSize:"0.72rem", color:"#DC2626", wordBreak:"break-all" as const, display:"block"}}>
              {error?.message}
            </code>
          </div>
        )}

        <div style={{display:"flex", gap:"0.75rem", width:"100%"}}>
          <button
            onClick={() => router.push("/feed")}
            style={{flex:1, background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#737373", borderRadius:"8px", padding:"0.875rem", fontSize:"0.875rem", cursor:"pointer", fontFamily:"var(--font-body)"}}>
            Home
          </button>
          <button
            onClick={handleAction}
            style={{flex:1, background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"0.875rem", fontFamily:"var(--font-display)", fontSize:"0.95rem", letterSpacing:"0.08em", cursor:"pointer"}}>
            {action}
          </button>
        </div>

        <button
          onClick={() => router.back()}
          style={{background:"none", border:"none", color:"#A3A3A3", fontSize:"0.78rem", cursor:"pointer", fontFamily:"var(--font-body)"}}>
          Go back to previous page
        </button>

        <div style={{fontSize:"0.7rem", color:"#CCC"}}>
          CARSTRIMS &middot; Built by <strong style={{color:"#F47B20"}}>UASE TECH STUDIO</strong>
        </div>
      </div>
    </div>
  );
}