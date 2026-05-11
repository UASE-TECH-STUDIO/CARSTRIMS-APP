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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", form);
      const d = res.data;
      setUser({
        userId: d.userId,
        fullName: d.fullName,
        email: d.email,
        role: d.role,
        dealerId: d.dealerId,
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
      });
      router.push(getRoleRedirect(d.role, d.dealerId));
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="al-inner">
          <div className="al-brand">◈ CARSTRIMS</div>
          <div className="al-mid">
            <h1 className="al-title">THE SMARTER WAY TO BUY & SELL CARS</h1>
            <p className="al-sub">Connect with verified dealers. Browse thousands of vehicles. Track every deal from listing to sale.</p>
            <div className="al-stats">
              <div className="als-item"><span className="als-num">6</span><span className="als-label">User Roles</span></div>
              <div className="als-item"><span className="als-num">∞</span><span className="als-label">Inventory</span></div>
              <div className="als-item"><span className="als-num">24/7</span><span className="als-label">Live</span></div>
            </div>
          </div>
          <div className="al-dev">Developed by <strong>UASE TECH STUDIO</strong> · CARSTRIMS 2026</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="card-header">
            <h2 className="card-title">Welcome back</h2>
            <p className="card-sub">Sign in to your CARSTRIMS account</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label className="field-label">Email Address</label>
              <input type="email" className="field-input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input type="password" className="field-input" placeholder="Your password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>

          <p className="auth-switch">
            No account? <Link href="/register" className="switch-link">Create one free</Link>
          </p>
          <Link href="/feed" className="back-feed">← Browse cars without signing in</Link>
        </div>
      </div>

      <style>{`
        .auth-root{display:flex;min-height:100vh;background:var(--black);font-family:var(--font-body)}
        .auth-left{width:45%;background:var(--surface);border-right:1px solid var(--border);display:flex;align-items:stretch;position:relative;overflow:hidden}
        .auth-left::before{content:"◈";position:absolute;bottom:-80px;right:-60px;font-family:var(--font-display);font-size:340px;color:rgba(201,168,76,0.04);line-height:1;pointer-events:none}
        .al-inner{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:space-between;padding:2.5rem;width:100%}
        .al-brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.2em;color:var(--gold)}
        .al-mid{display:flex;flex-direction:column;gap:1.25rem}
        .al-title{font-family:var(--font-display);font-size:clamp(1.75rem,2.8vw,3rem);line-height:1.05;color:var(--text);letter-spacing:0.02em}
        .al-sub{font-size:0.9rem;color:var(--text-muted);line-height:1.7;max-width:340px}
        .al-stats{display:flex;gap:2rem;padding-top:1.5rem;border-top:1px solid var(--border);margin-top:0.5rem}
        .als-item{display:flex;flex-direction:column;gap:0.2rem}
        .als-num{font-family:var(--font-display);font-size:2rem;color:var(--gold);line-height:1}
        .als-label{font-size:0.68rem;color:var(--text-dim);letter-spacing:0.1em;text-transform:uppercase}
        .al-dev{font-size:0.7rem;color:var(--text-dim)}
        .al-dev strong{color:var(--gold)}
        .auth-right{flex:1;background:var(--black);display:flex;align-items:center;justify-content:center;padding:2rem}
        .auth-card{width:100%;max-width:420px;display:flex;flex-direction:column;gap:1.5rem}
        .card-header{display:flex;flex-direction:column;gap:0.3rem}
        .card-title{font-family:var(--font-display);font-size:2.2rem;letter-spacing:0.04em;color:var(--text)}
        .card-sub{font-size:0.875rem;color:var(--text-muted)}
        .auth-error{background:rgba(224,82,82,0.1);border:1px solid rgba(224,82,82,0.3);color:var(--error);padding:0.75rem 1rem;border-radius:6px;font-size:0.875rem}
        .auth-form{display:flex;flex-direction:column;gap:1.25rem}
        .field{display:flex;flex-direction:column;gap:0.45rem}
        .field-label{font-size:0.72rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
        .field-input{background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:0.875rem 1rem;color:var(--text);font-size:0.95rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .field-input:focus{border-color:var(--gold)}
        .field-input::placeholder{color:var(--text-dim)}
        .forgot-link{font-size:0.78rem;color:var(--gold);text-align:right;align-self:flex-end;opacity:0.8}
        .forgot-link:hover{opacity:1}
        .auth-btn{background:var(--gold);color:var(--black);border:none;border-radius:6px;padding:1rem;font-family:var(--font-display);font-size:1rem;letter-spacing:0.15em;cursor:pointer;transition:background 0.2s;margin-top:0.25rem}
        .auth-btn:hover{background:var(--gold-light)}
        .auth-btn:disabled{opacity:0.6;cursor:not-allowed}
        .auth-switch{font-size:0.875rem;color:var(--text-muted);text-align:center}
        .switch-link{color:var(--gold);font-weight:500}
        .back-feed{font-size:0.78rem;color:var(--text-dim);text-align:center;display:block;transition:color 0.2s}
        .back-feed:hover{color:var(--gold)}
        @media(max-width:768px){.auth-left{display:none}.auth-right{padding:2rem 1.5rem}}
      `}</style>
    </div>
  );
}