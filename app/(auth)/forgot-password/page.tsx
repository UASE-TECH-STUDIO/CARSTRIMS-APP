"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{tempPassword?:string;message?:string} | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/v1/auth/forgot-password", { email });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
      <div style={{width:"100%",maxWidth:"420px",background:"#fff",borderRadius:"16px",padding:"2.5rem",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",gap:"1.5rem"}}>
        <div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.15em",color:"#F47B20",marginBottom:"0.75rem"}}>CARSTRIMS</div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",color:"#171717"}}>Reset Password</h2>
          <p style={{fontSize:"0.875rem",color:"#737373",marginTop:"0.35rem"}}>Enter your email to receive a temporary password</p>
        </div>

        {error && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}

        {result ? (
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{background:"#FFF7ED",border:"1px solid #F47B20",color:"#C4621A",padding:"1rem",borderRadius:"8px",lineHeight:1.6}}>
              <div style={{fontWeight:600,marginBottom:"0.5rem"}}>Temporary password set!</div>
              {result.tempPassword && (
                <div style={{background:"#fff",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"6px",padding:"0.75rem",fontFamily:"monospace",fontSize:"1.1rem",fontWeight:700,color:"#F47B20",textAlign:"center",letterSpacing:"0.1em"}}>
                  {result.tempPassword}
                </div>
              )}
              <div style={{fontSize:"0.8rem",marginTop:"0.75rem"}}>Copy this password and log in. Then change it immediately in your Settings.</div>
            </div>
            <Link href="/auth/login" style={{background:"#F47B20",color:"#fff",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:"pointer",textDecoration:"none",display:"block",textAlign:"center"}}>
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <label style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252"}}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required
                style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem 1rem",color:"#171717",fontSize:"0.95rem",outline:"none",width:"100%"}} />
            </div>
            <button type="submit" disabled={loading}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.15em",cursor:"pointer",opacity:loading?0.6:1}}>
              {loading ? "Sending..." : "SEND TEMP PASSWORD"}
            </button>
          </form>
        )}

        <Link href="/auth/login" style={{fontSize:"0.78rem",color:"#A3A3A3",textDecoration:"none",textAlign:"center",display:"block"}}>
          Back to login
        </Link>
      </div>
    </div>
  );
}