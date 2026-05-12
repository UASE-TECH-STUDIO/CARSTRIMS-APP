"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore, getRoleRedirect } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setIsPending(false); setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", form);
      const d = res.data;
      const token = d.accessToken || d.access_token || d.token || "";
      const userId = d.userId || d.user_id || d.id || "";
      const role = d.role || "";
      const dealerId = d.dealerId || d.dealer_id || null;

      if (!token) {
        setError("Login succeeded but no session token received. Please try again.");
        return;
      }

      setUser({ userId, fullName: d.fullName || d.full_name || "", email: d.email || form.email, role, dealerId, accessToken: token, refreshToken: d.refreshToken || d.refresh_token || "" } as any);

      // Dealers go to dealer dashboard — layout handles setup redirect
      if (role === "DEALER_ADMIN") {
        router.push("/dashboard/dealer");
      } else {
        router.push(getRoleRedirect(role, dealerId));
      }
    } catch (err: any) {
      const status = err.response?.status;
      const raw = (err.response?.data?.detail || err.response?.data?.message || "").toString();
      const lower = raw.toLowerCase();

      // Backend blocks pending dealers — show friendly message instead of error
      if (lower.includes("pending") || lower.includes("approval") || lower.includes("awaiting") ||
          lower.includes("not approved") || lower.includes("not active") || lower.includes("inactive") ||
          lower.includes("not verified") || status === 403) {
        setIsPending(true);
        return;
      }

      if (status === 401 || lower.includes("password") || lower.includes("invalid") || lower.includes("incorrect") || lower.includes("credentials")) {
        setError("Invalid email or password. Please check and try again.");
      } else if (status === 404 || lower.includes("not found") || lower.includes("no account")) {
        setError("No account found with this email address.");
      } else if (!err.response) {
        setError("Cannot reach the server. Please check your internet connection.");
      } else if (raw) {
        setError(raw);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="al-top"><div className="brand">CARSTRIMS</div></div>
        <div className="al-mid">
          <h1 className="al-title">THE SMARTER WAY TO BUY &amp; SELL CARS</h1>
          <p className="al-sub">Connect with verified dealers. Browse thousands of vehicles. Track every deal from listing to sale.</p>
          <div className="al-stats">
            <div className="stat-item"><span className="stat-num">5</span><span className="stat-lbl">User Roles</span></div>
            <div className="stat-item"><span className="stat-num">24/7</span><span className="stat-lbl">Live</span></div>
          </div>
        </div>
        <div className="al-foot">Built by <strong>UASE TECH STUDIO</strong> &middot; CARSTRIMS 2026</div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div>
            <h2 className="card-title">Welcome back</h2>
            <p className="card-sub">Sign in to your CARSTRIMS account</p>
          </div>

          {isPending && (
            <div style={{background:"#FFF7ED",border:"1.5px solid #F47B20",borderRadius:"10px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.06em",color:"#C4621A"}}>ACCOUNT PENDING APPROVAL</div>
              <p style={{fontSize:"0.875rem",color:"#525252",lineHeight:"1.6"}}>Your dealer account has been received and is currently being reviewed by the CARSTRIMS admin team.</p>
              <div style={{fontSize:"0.82rem",color:"#737373",lineHeight:"1.6"}}>
                <strong style={{color:"#C4621A"}}>What to expect:</strong><br/>
                The admin will verify your details and may contact you. You will receive an email once approved. Review typically takes 1-2 business days.
              </div>
              <div style={{fontSize:"0.75rem",color:"#A3A3A3",borderTop:"1px solid rgba(244,123,32,0.2)",paddingTop:"0.625rem"}}>
                Questions? Contact: <a href="mailto:support@carstrims.com" style={{color:"#F47B20"}}>support@carstrims.com</a>
              </div>
            </div>
          )}

          {error && <div className="auth-err">{error}</div>}

          {!isPending && (
            <form onSubmit={submit} className="auth-form">
              <div className="field">
                <label className="fl">Email Address</label>
                <input type="email" className="fi" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} required />
              </div>
              <div className="field">
                <label className="fl">Password</label>
                <input type="password" className="fi" placeholder="Your password" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} required />
                <Link href="/forgot-password" className="forgot-lnk">Forgot password?</Link>
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>{loading ? "Signing in..." : "SIGN IN"}</button>
            </form>
          )}

          {isPending && (
            <button onClick={() => { setIsPending(false); setForm({ email:"", password:"" }); }}
              style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>
              Try a different account
            </button>
          )}

          <p className="auth-switch">No account? <Link href="/register" className="sw-lnk">Create one free</Link></p>
          <Link href="/feed" className="back-feed">Browse cars without signing in</Link>
        </div>
      </div>
      <style>{`
        .auth-root{display:flex;min-height:100vh;font-family:var(--font-body);background:#F5F5F5}
        .auth-left{width:42%;background:linear-gradient(160deg,#E5E5E5 0%,#D4D4D4 55%,#C8C8C8 100%);display:flex;flex-direction:column;justify-content:space-between;padding:2.5rem;position:relative;overflow:hidden}
        .brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.2em;color:#F47B20}
        .al-mid{display:flex;flex-direction:column;gap:1.25rem}
        .al-title{font-family:var(--font-display);font-size:clamp(1.8rem,2.8vw,3rem);line-height:1.05;color:#1A1A1A;letter-spacing:0.02em}
        .al-sub{font-size:0.9rem;color:#525252;line-height:1.7;max-width:340px}
        .al-stats{display:flex;gap:2rem;padding-top:1.5rem;border-top:1px solid rgba(0,0,0,0.1);margin-top:0.5rem}
        .stat-item{display:flex;flex-direction:column;gap:0.2rem}
        .stat-num{font-family:var(--font-display);font-size:2rem;color:#F47B20;line-height:1}
        .stat-lbl{font-size:0.68rem;color:#737373;letter-spacing:0.1em;text-transform:uppercase}
        .al-foot{font-size:0.7rem;color:#A3A3A3}
        .al-foot strong{color:#F47B20}
        .auth-right{flex:1;background:#F5F5F5;display:flex;align-items:center;justify-content:center;padding:2rem}
        .auth-card{width:100%;max-width:440px;background:#fff;border-radius:16px;padding:2.5rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);display:flex;flex-direction:column;gap:1.5rem}
        .card-title{font-family:var(--font-display);font-size:2rem;letter-spacing:0.04em;color:#1A1A1A}
        .card-sub{font-size:0.875rem;color:#737373;margin-top:0.25rem}
        .auth-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem;line-height:1.5}
        .auth-form{display:flex;flex-direction:column;gap:1.25rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.72rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#525252}
        .fi{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.875rem 1rem;color:#1A1A1A;font-size:0.95rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff;box-shadow:0 0 0 3px rgba(244,123,32,0.1)}
        .fi::placeholder{color:#A3A3A3}
        .forgot-lnk{font-size:0.78rem;color:#F47B20;text-align:right;align-self:flex-end}
        .auth-btn{background:#F47B20;color:#fff;border:none;border-radius:8px;padding:1rem;font-family:var(--font-display);font-size:1rem;letter-spacing:0.15em;cursor:pointer;transition:background 0.2s;margin-top:0.25rem}
        .auth-btn:hover{background:#FF9340}
        .auth-btn:disabled{opacity:0.6;cursor:not-allowed}
        .auth-switch{font-size:0.875rem;color:#737373;text-align:center}
        .sw-lnk{color:#F47B20;font-weight:600}
        .back-feed{font-size:0.78rem;color:#A3A3A3;text-align:center;display:block;transition:color 0.2s}
        .back-feed:hover{color:#F47B20}
        @media(max-width:768px){.auth-left{display:none}.auth-right{padding:1.5rem;background:#fff}.auth-card{box-shadow:none;padding:1.5rem}}
      `}</style>
    </div>
  );
}
