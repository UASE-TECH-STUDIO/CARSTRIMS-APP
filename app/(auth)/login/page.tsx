"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore, getRoleRedirect } from "@/store/authStore";

export default function LoginPage() {
  const router  = useRouter();
  const setUser = useAuthStore(s => s.setUser);
  const [form, setForm] = useState({ emailOrPhone:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPw, setShowPw]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", {
        emailOrPhone: form.emailOrPhone.trim().toLowerCase(),
        password: form.password,
      });
      const d = res.data;
      setUser({ userId:d.userId, fullName:d.fullName, email:d.email, role:d.role, dealerId:d.dealerId, accessToken:d.accessToken, refreshToken:d.refreshToken });
      if (d.role === "DEALER_ADMIN" && !d.hasDealerProfile) {
        router.push("/dashboard/dealer/setup");
      } else {
        router.push(getRoleRedirect(d.role, d.dealerId));
      }
    } catch(err: any) {
      const msg = (err.response?.data?.detail || "").toLowerCase();
      if (msg.includes("suspended")) {
        setError("Your account has been suspended. Contact support@carstrims.com");
      } else {
        setError("Invalid credentials. Please check your email/phone and password.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="lg-root">
      {/* Left panel */}
      <div className="lg-left">
        <div className="lg-brand">CARSTRIMS</div>
        <div className="lg-mid">
          <h1 className="lg-title">WELCOME BACK</h1>
          <p className="lg-sub">Nigeria's premier vehicle marketplace. Sign in to access your dashboard and continue your journey.</p>
          <div className="lg-features">
            {["Browse thousands of verified cars","Message dealers directly","Track your saved vehicles","Real-time inventory updates"].map(f=>(
              <div key={f} className="lg-feat"><span className="lg-dot"/>  {f}</div>
            ))}
          </div>
        </div>
        <div className="lg-foot">Built by <strong>UASE TECH STUDIO</strong> · 2026</div>
      </div>

      {/* Right panel */}
      <div className="lg-right">
        <div className="lg-card">
          <div className="lg-mobile-top">
            <div className="lg-mobile-brand">CARSTRIMS</div>
            <p className="lg-mobile-built">Built by UASE TECH STUDIO</p>
          </div>
          <div>
            <h2 className="lg-heading">Sign In</h2>
            <p className="lg-subhead">Enter your email or phone number to continue</p>
          </div>

          {error && (
            <div className="lg-err">
              <span>{error}</span>
              <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:"1rem",lineHeight:1,flexShrink:0}}>✕</button>
            </div>
          )}

          <form onSubmit={submit} className="lg-form">
            <div className="lg-field">
              <label className="lg-lbl">Email or Phone Number</label>
              <input className="lg-input" type="text" placeholder="Email address or +234..."
                value={form.emailOrPhone} onChange={e=>setForm({...form,emailOrPhone:e.target.value})}
                autoComplete="username" required />
            </div>
            <div className="lg-field">
              <label className="lg-lbl">Password</label>
              <div style={{position:"relative"}}>
                <input className="lg-input" type={showPw?"text":"password"} placeholder="Your password"
                  value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                  autoComplete="current-password" required style={{paddingRight:"3rem"}} />
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  style={{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#A3A3A3",fontSize:"0.8rem",fontFamily:"var(--font-body)",fontWeight:600}}>
                  {showPw?"Hide":"Show"}
                </button>
              </div>
            </div>
            <Link href="/forgot-password" className="lg-forgot">Forgot password?</Link>
            <button type="submit" className="lg-btn" disabled={loading}>
              {loading?"Signing in...":"SIGN IN"}
            </button>
          </form>

          <div className="lg-divider"><span>or</span></div>

          <Link href="/feed" className="lg-browse-btn">
            Browse Cars Without Signing In →
          </Link>

       
          <p className="lg-switch">New to CARSTRIMS? <Link href="/register" className="lg-link">Create a free account</Link></p>
        </div>
      </div>

      <style>{`
        .lg-root{display:flex;min-height:100vh;background:#F5F5F5;font-family:var(--font-body)}
        /* ── Left (grey/dark panel) ── */
        .lg-left{width:42%;background:linear-gradient(160deg,#1A1A1A 0%,#262626 60%,#333 100%);display:flex;flex-direction:column;justify-content:space-between;padding:2.5rem;flex-shrink:0;position:relative;overflow:hidden}
        .lg-left::after{content:"CARSTRIMS";position:absolute;bottom:-30px;left:-10px;font-family:var(--font-display);font-size:140px;color:rgba(244,123,32,0.04);line-height:1;pointer-events:none;white-space:nowrap}
        .lg-brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.25em;color:#F47B20}
        .lg-mid{display:flex;flex-direction:column;gap:1.25rem}
        .lg-title{font-family:var(--font-display);font-size:clamp(2rem,3vw,3.5rem);line-height:1.05;color:#fff;letter-spacing:0.04em}
        .lg-sub{font-size:0.9rem;color:#A3A3A3;line-height:1.7;max-width:320px}
        .lg-features{display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem}
        .lg-feat{display:flex;align-items:center;gap:0.625rem;font-size:0.875rem;color:#D4D4D4;font-weight:500}
        .lg-dot{width:7px;height:7px;border-radius:50%;background:#F47B20;flex-shrink:0;display:block}
        .lg-foot{font-size:0.7rem;color:#404040}.lg-foot strong{color:#F47B20}
        /* ── Right ── */
        .lg-right{flex:1;background:#F5F5F5;display:flex;align-items:center;justify-content:center;padding:2rem;overflow-y:auto}
        .lg-card{width:100%;max-width:430px;background:#fff;border-radius:16px;padding:2.25rem;box-shadow:0 4px 32px rgba(0,0,0,0.08);display:flex;flex-direction:column;gap:1.25rem}
        .lg-mobile-top{display:none;flex-direction:column;align-items:center;gap:0.25rem}
        .lg-mobile-brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.25em;color:#F47B20}
        .lg-mobile-built{font-size:0.7rem;color:#A3A3A3}
        .lg-heading{font-family:var(--font-display);font-size:1.75rem;letter-spacing:0.04em;color:#1A1A1A;margin:0;line-height:1}
        .lg-subhead{font-size:0.875rem;color:#737373;margin-top:0.25rem;line-height:1.5}
        .lg-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem;line-height:1.5;display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem}
        .lg-form{display:flex;flex-direction:column;gap:1rem}
        .lg-field{display:flex;flex-direction:column;gap:0.4rem}
        .lg-lbl{font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#525252}
        .lg-input{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.875rem 1rem;color:#1A1A1A;font-size:0.95rem;font-family:var(--font-body);outline:none;width:100%;transition:border-color 0.2s;box-sizing:border-box;font-weight:500}
        .lg-input:focus{border-color:#F47B20;background:#fff;box-shadow:0 0 0 3px rgba(244,123,32,0.08)}
        .lg-input::placeholder{color:#A3A3A3;font-weight:400}
        .lg-forgot{font-size:0.8rem;color:#F47B20;text-decoration:none;text-align:right;font-weight:600;margin-top:-0.25rem}
        .lg-forgot:hover{text-decoration:underline}
        .lg-btn{background:#F47B20;color:#fff;border:none;border-radius:10px;padding:1rem;font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.14em;cursor:pointer;transition:background 0.2s;font-weight:700}
        .lg-btn:hover{background:#FF9340}.lg-btn:disabled{opacity:0.6;cursor:not-allowed}
        .lg-divider{display:flex;align-items:center;gap:1rem;color:#D4D4D4;font-size:0.8rem}
        .lg-divider::before,.lg-divider::after{content:"";flex:1;height:1px;background:#E5E5E5}
        .lg-browse-btn{display:block;text-align:center;background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;border-radius:10px;padding:0.875rem;font-size:0.875rem;text-decoration:none;font-weight:600;transition:all 0.2s}
        .lg-browse-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        
        .lg-hint strong{color:#1A1A1A}
        .lg-switch{font-size:0.9rem;color:#737373;text-align:center}
        .lg-link{color:#F47B20;font-weight:700;text-decoration:none}
        .lg-link:hover{text-decoration:underline}
        @media(max-width:768px){
          .lg-left{display:none}
          .lg-right{padding:0;background:#fff;align-items:flex-start}
          .lg-card{box-shadow:none;border-radius:0;padding:1.75rem 1.25rem;max-width:100%;min-height:100vh;justify-content:center}
          .lg-mobile-top{display:flex}
        }
      `}</style>
    </div>
  );
}

