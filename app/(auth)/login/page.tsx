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
      setUser({
        userId: d.userId, fullName: d.fullName, email: d.email,
        role: d.role, dealerId: d.dealerId,
        accessToken: d.accessToken, refreshToken: d.refreshToken,
      });
      // Dealers that haven't completed setup
      if (d.role === "DEALER_ADMIN" && !d.hasDealerProfile) {
        router.push("/dashboard/dealer/setup");
      } else {
        router.push(getRoleRedirect(d.role, d.dealerId));
      }
    } catch(err: any) {
      const msg = err.response?.data?.detail || "";
      if (msg.toLowerCase().includes("suspended")) {
        setError("Your account has been suspended. Contact support@carstrims.com");
      } else {
        setError("Invalid credentials. Check your email/phone and password.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="lg-root">
      <div className="lg-left">
        <div className="lg-brand">CARSTRIMS</div>
        <div className="lg-mid">
          <h1 className="lg-title">WELCOME BACK</h1>
          <p className="lg-sub">Nigeria's premier vehicle marketplace. Log in to access your dashboard.</p>
        </div>
        <div className="lg-foot">Built by <strong>UASE TECH STUDIO</strong> · 2026</div>
      </div>

      <div className="lg-right">
        <div className="lg-card">
          <div className="lg-mobile-brand">CARSTRIMS</div>
          <h2 className="lg-heading">Sign In</h2>

          {error && <div className="lg-err">{error}</div>}

          <form onSubmit={submit} className="lg-form">
            <div className="lg-field">
              <label className="lg-lbl">Email or Phone Number</label>
              <input
                className="lg-input"
                type="text"
                placeholder="Email or +234..."
                value={form.emailOrPhone}
                onChange={e=>setForm({...form,emailOrPhone:e.target.value})}
                autoComplete="username"
                required
              />
            </div>
            <div className="lg-field">
              <label className="lg-lbl">Password</label>
              <div style={{position:"relative"}}>
                <input
                  className="lg-input"
                  type={showPw?"text":"password"}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})}
                  autoComplete="current-password"
                  required
                  style={{paddingRight:"3rem"}}
                />
                <button type="button"
                  onClick={()=>setShowPw(!showPw)}
                  style={{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#A3A3A3",fontSize:"0.875rem",fontFamily:"var(--font-body)"}}>
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

          <div className="lg-hint">
            <p>You can sign in with your <strong>email address</strong> or <strong>phone number</strong>.</p>
          </div>

          <p className="lg-switch">New to CARSTRIMS? <Link href="/register" className="lg-link">Create account</Link></p>
        </div>
      </div>

      <style>{`
        .lg-root{display:flex;min-height:100vh;background:#F5F5F5;font-family:var(--font-body)}
        .lg-left{width:42%;background:linear-gradient(160deg,#1A1A1A,#2D2D2D);display:flex;flex-direction:column;justify-content:space-between;padding:2.5rem;flex-shrink:0}
        .lg-brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.2em;color:#F47B20}
        .lg-mid{display:flex;flex-direction:column;gap:1rem}
        .lg-title{font-family:var(--font-display);font-size:clamp(2rem,3vw,3.5rem);line-height:1.05;color:#fff}
        .lg-sub{font-size:0.9rem;color:#A3A3A3;line-height:1.7}
        .lg-foot{font-size:0.7rem;color:#525252}.lg-foot strong{color:#F47B20}
        .lg-right{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;overflow-y:auto}
        .lg-card{width:100%;max-width:420px;background:#fff;border-radius:16px;padding:2rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);display:flex;flex-direction:column;gap:1.25rem}
        .lg-mobile-brand{display:none;font-family:var(--font-display);font-size:1.3rem;letter-spacing:0.2em;color:#F47B20;text-align:center}
        .lg-heading{font-family:var(--font-display);font-size:1.75rem;color:#1A1A1A;margin:0}
        .lg-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem;line-height:1.5}
        .lg-form{display:flex;flex-direction:column;gap:1rem}
        .lg-field{display:flex;flex-direction:column;gap:0.4rem}
        .lg-lbl{font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#525252}
        .lg-input{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.875rem 1rem;color:#1A1A1A;font-size:0.9rem;font-family:var(--font-body);outline:none;width:100%;transition:border-color 0.2s;box-sizing:border-box}
        .lg-input:focus{border-color:#F47B20;background:#fff}
        .lg-forgot{font-size:0.8rem;color:#F47B20;text-decoration:none;text-align:right;margin-top:-0.25rem}
        .lg-btn{background:#F47B20;color:#fff;border:none;border-radius:8px;padding:1rem;font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.12em;cursor:pointer;transition:background 0.2s}
        .lg-btn:hover{background:#FF9340}.lg-btn:disabled{opacity:0.6;cursor:not-allowed}
        .lg-divider{display:flex;align-items:center;gap:1rem;color:#D4D4D4;font-size:0.8rem}
        .lg-divider::before,.lg-divider::after{content:"";flex:1;height:1px;background:#E5E5E5}
        .lg-hint{background:#F5F5F5;border-radius:8px;padding:0.875rem;font-size:0.8rem;color:#737373;line-height:1.5}
        .lg-switch{font-size:0.875rem;color:#737373;text-align:center}
        .lg-link{color:#F47B20;font-weight:600}
        @media(max-width:768px){
          .lg-left{display:none}
          .lg-right{padding:1rem;background:#fff}
          .lg-card{box-shadow:none;border-radius:0;padding:1.5rem;max-width:100%}
          .lg-mobile-brand{display:block}
        }
      `}</style>
    </div>
  );
}
