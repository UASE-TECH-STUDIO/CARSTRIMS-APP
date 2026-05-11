"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore, getRoleRedirect } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", { email, password });
      const d = res.data;
      setUser({ userId:d.userId, fullName:d.fullName, email:d.email, role:d.role, dealerId:d.dealerId, accessToken:d.accessToken, refreshToken:d.refreshToken });
      router.push(getRoleRedirect(d.role, d.dealerId));
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally { setLoading(false); }
  };

  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      <div style={{width:"42%",background:"linear-gradient(160deg,#E5E5E5,#D4D4D4,#C8C8C8)",padding:"3rem",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"2.5rem",lineHeight:1.05,color:"#171717",marginBottom:"1rem"}}>THE SMARTER WAY TO BUY AND SELL CARS</h1>
          <p style={{fontSize:"0.9rem",color:"#525252",lineHeight:1.65}}>Connect with verified dealers. Track every deal from listing to sale.</p>
        </div>
        <div style={{fontSize:"0.7rem",color:"#A3A3A3"}}>Built by UASE TECH STUDIO</div>
      </div>
      <div style={{flex:1,background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{width:"100%",maxWidth:"420px",background:"#fff",borderRadius:"16px",padding:"2.5rem",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          <div>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",color:"#171717"}}>Welcome back</h2>
            <p style={{fontSize:"0.875rem",color:"#737373",marginTop:"0.25rem"}}>Sign in to your CARSTRIMS account</p>
          </div>
          {error && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}
          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <label style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#525252"}}>Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required
                style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem 1rem",color:"#171717",fontSize:"0.95rem",outline:"none",width:"100%"}}
                onFocus={(e)=>e.target.style.borderColor="#F47B20"}
                onBlur={(e)=>e.target.style.borderColor="#E5E5E5"} />
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <label style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#525252"}}>Password</label>
              <input type="password" placeholder="Your password" value={password} onChange={(e)=>setPassword(e.target.value)} required
                style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem 1rem",color:"#171717",fontSize:"0.95rem",outline:"none",width:"100%"}}
                onFocus={(e)=>e.target.style.borderColor="#F47B20"}
                onBlur={(e)=>e.target.style.borderColor="#E5E5E5"} />
              <Link href="/auth/forgot-password" style={{fontSize:"0.78rem",color:"#F47B20",textDecoration:"none",textAlign:"right"}}>Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.15em",cursor:"pointer",opacity:loading?0.6:1}}>
              {loading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>
          <p style={{fontSize:"0.875rem",color:"#737373",textAlign:"center"}}>
            No account? <Link href="/auth/register" style={{color:"#F47B20",textDecoration:"none",fontWeight:600}}>Register free</Link>
          </p>
          <Link href="/feed" style={{fontSize:"0.78rem",color:"#A3A3A3",textDecoration:"none",textAlign:"center",display:"block"}}>Browse cars without signing in</Link>
        </div>
      </div>
    </div>
  );
}