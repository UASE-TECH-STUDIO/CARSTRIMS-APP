"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/v1/auth/forgot-password", { email });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-brand"><span className="brand-icon">◈</span><span className="brand-name">CARSTRIMS</span></div>
        <div className="auth-hero">
          <h1 className="hero-title">FORGOT<br />PASSWORD?</h1>
          <p className="hero-sub">Enter your email and we will reset your password immediately.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          {result ? (
            <div className="success-state">
              <div className="success-icon">✅</div>
              <h2 className="card-title">Password Reset!</h2>
              <p className="card-sub">{result.message}</p>
              {result.newPassword && (
                <div className="temp-pw-box">
                  <div className="tp-label">Your new temporary password:</div>
                  <div className="tp-value">{result.newPassword}</div>
                  <div className="tp-note">Please change this after login</div>
                </div>
              )}
              <Link href="/auth/login" className="auth-btn" style={{display:"block",textAlign:"center",textDecoration:"none",marginTop:"1rem"}}>
                GO TO LOGIN
              </Link>
            </div>
          ) : (
            <>
              <div className="card-header">
                <h2 className="card-title">Reset Password</h2>
                <p className="card-sub">Enter your registered email address</p>
              </div>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="field">
                  <label className="field-label">Email Address</label>
                  <input type="email" className="field-input" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Resetting..." : "RESET PASSWORD"}
                </button>
              </form>
              <p className="auth-switch"><Link href="/auth/login" className="switch-link">← Back to Login</Link></p>
            </>
          )}
        </div>
      </div>
      <style>{`
        .auth-root{display:flex;min-height:100vh;background:var(--black);font-family:var(--font-body)}
        .auth-left{width:45%;padding:3rem;display:flex;flex-direction:column;justify-content:space-between;background:var(--surface);border-right:1px solid var(--border)}
        .auth-brand{display:flex;align-items:center;gap:0.75rem}
        .brand-icon{font-size:1.5rem;color:var(--gold)}
        .brand-name{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.2em;color:var(--text)}
        .auth-hero{flex:1;display:flex;flex-direction:column;justify-content:center;padding:3rem 0}
        .hero-title{font-family:var(--font-display);font-size:clamp(3rem,5vw,5rem);line-height:0.95;color:var(--text);margin-bottom:1.5rem}
        .hero-sub{font-size:1rem;color:var(--text-muted);font-weight:300}
        .auth-right{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem}
        .auth-card{width:100%;max-width:420px;display:flex;flex-direction:column;gap:1.5rem}
        .success-state{display:flex;flex-direction:column;gap:1rem}
        .success-icon{font-size:3rem;text-align:center}
        .card-header{display:flex;flex-direction:column;gap:0.5rem}
        .card-title{font-family:var(--font-display);font-size:2rem;letter-spacing:0.05em;color:var(--text)}
        .card-sub{font-size:0.9rem;color:var(--text-muted)}
        .auth-error{background:rgba(224,82,82,0.1);border:1px solid rgba(224,82,82,0.3);color:var(--error);padding:0.75rem 1rem;border-radius:6px;font-size:0.875rem}
        .auth-form{display:flex;flex-direction:column;gap:1.25rem}
        .field{display:flex;flex-direction:column;gap:0.5rem}
        .field-label{font-size:0.75rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
        .field-input{background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:0.875rem 1rem;color:var(--text);font-size:0.95rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .field-input:focus{border-color:var(--gold)}
        .auth-btn{background:var(--gold);color:var(--black);border:none;border-radius:6px;padding:1rem;font-family:var(--font-display);font-size:1rem;letter-spacing:0.15em;cursor:pointer;transition:background 0.2s;width:100%}
        .auth-btn:hover{background:var(--gold-light)}
        .auth-btn:disabled{opacity:0.6;cursor:not-allowed}
        .auth-switch{font-size:0.875rem;color:var(--text-muted);text-align:center}
        .switch-link{color:var(--gold);text-decoration:none;font-weight:500}
        .temp-pw-box{background:rgba(201,168,76,0.08);border:1px solid var(--gold-dim);border-radius:8px;padding:1rem;display:flex;flex-direction:column;gap:0.4rem}
        .tp-label{font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--gold-dim)}
        .tp-value{font-family:var(--font-mono);font-size:1.1rem;color:var(--gold);font-weight:600}
        .tp-note{font-size:0.72rem;color:var(--text-dim)}
        @media(max-width:768px){.auth-left{display:none}}
      `}</style>
    </div>
  );
}

