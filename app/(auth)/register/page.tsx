"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

const ROLES = [
  {
    value: "DEALER_ADMIN",
    label: "Dealer / Car Stand",
    icon: "Ã°Å¸ÂÂ¢",
    desc: "Manage inventory, staff and sales",
  },
  {
    value: "PARTNER_USER",
    label: "Partner / Asset Owner",
    icon: "Ã°Å¸Â¤Â",
    desc: "Monitor your cars across dealers",
  },
  {
    value: "PUBLIC_USER",
    label: "Car Buyer",
    icon: "Ã°Å¸â€˜Â¤",
    desc: "Browse, save and request cars",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/register", { ...form, role });
      router.push(
        role === "DEALER_ADMIN"
          ? "/auth/login?msg=pending"
          : "/auth/login?msg=created"
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="al-inner">
          <div className="al-brand">Ã¢â€”Ë† CARSTRIMS</div>
          <div className="al-mid">
            <h1 className="al-title">JOIN THE PLATFORM TODAY</h1>
            <p className="al-sub">
              Whether you are a dealer, partner or buyer Ã¢â‚¬â€ CARSTRIMS gives you
              the tools to succeed in the car market.
            </p>
            <div className="al-features">
              {["Free to join", "Verified dealers", "Real-time inventory", "Secure messaging"].map(
                (f) => (
                  <div key={f} className="al-feat">
                    <span className="feat-dot" />
                    {f}
                  </div>
                )
              )}
            </div>
          </div>
          <div className="al-dev">
            Developed by <strong>UASE TECH STUDIO</strong> Ã‚Â· CARSTRIMS 2026
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="step-row">
            <div className={`step-dot ${step >= 1 ? "done" : ""}`}>1</div>
            <div className="step-line" />
            <div className={`step-dot ${step >= 2 ? "done" : ""}`}>2</div>
          </div>

          <div className="ac-head">
            <h2 className="ac-title">
              {step === 1 ? "Choose Account Type" : "Create Your Account"}
            </h2>
            <p className="ac-sub">
              {step === 1
                ? "Select how you will use CARSTRIMS"
                : "Fill in your details below"}
            </p>
          </div>

          {error && <div className="auth-err">{error}</div>}

          {step === 1 ? (
            <div className="role-list">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  className={`role-card ${role === r.value ? "selected" : ""}`}
                  onClick={() => setRole(r.value)}
                >
                  <span className="rc-icon">{r.icon}</span>
                  <div className="rc-body">
                    <div className="rc-label">{r.label}</div>
                    <div className="rc-desc">{r.desc}</div>
                  </div>
                  {role === r.value && <span className="rc-check">Ã¢Å“â€œ</span>}
                </button>
              ))}
              <button
                className="auth-btn"
                onClick={() => setStep(2)}
                disabled={!role}
              >
                CONTINUE Ã¢â€ â€™
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="field">
                  <label className="fl">Full Name *</label>
                  <input
                    className="fi"
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label className="fl">Username *</label>
                  <input
                    className="fi"
                    placeholder="johndoe"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="fl">Email Address *</label>
                <input
                  type="email"
                  className="fi"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="fl">Password *</label>
                <input
                  type="password"
                  className="fi"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={8}
                />
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="fl">Phone *</label>
                  <input
                    className="fi"
                    placeholder="+234..."
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label className="fl">WhatsApp</label>
                  <input
                    className="fi"
                    placeholder="+234..."
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                  />
                </div>
              </div>
              {role === "DEALER_ADMIN" && (
                <div className="dealer-note">
                  Dealer accounts require approval before you get full access.
                  You will be notified once approved.
                </div>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setStep(1)}
                >
                  Ã¢â€ Â Back
                </button>
                <button
                  type="submit"
                  className="auth-btn flex-btn"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "CREATE ACCOUNT"}
                </button>
              </div>
            </form>
          )}

          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/login" className="switch-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-root { display:flex; min-height:100vh; font-family:var(--font-body); }
        .auth-left {
          width:42%; background:linear-gradient(160deg,#E5E5E5 0%,#D4D4D4 55%,#C8C8C8 100%);
          display:flex; align-items:stretch; position:relative; overflow:hidden;
        }
        .auth-left::before {
          content:"Ã¢â€”Ë†"; position:absolute; bottom:-60px; right:-50px;
          font-family:var(--font-display); font-size:320px;
          color:rgba(244,123,32,0.07); line-height:1; pointer-events:none;
        }
        .al-inner {
          position:relative; z-index:1; display:flex; flex-direction:column;
          justify-content:space-between; padding:2.5rem; width:100%;
        }
        .al-brand { font-family:var(--font-display); font-size:1.4rem; letter-spacing:0.2em; color:#F47B20; }
        .al-mid { display:flex; flex-direction:column; gap:1.25rem; }
        .al-title { font-family:var(--font-display); font-size:clamp(1.75rem,2.8vw,3rem); line-height:1.05; color:#1A1A1A; }
        .al-sub { font-size:0.9rem; color:#525252; line-height:1.7; max-width:340px; }
        .al-features { display:flex; flex-direction:column; gap:0.625rem; margin-top:0.5rem; }
        .al-feat { display:flex; align-items:center; gap:0.625rem; font-size:0.875rem; color:#404040; }
        .feat-dot { width:8px; height:8px; border-radius:50%; background:#F47B20; flex-shrink:0; }
        .al-dev { font-size:0.7rem; color:#A3A3A3; }
        .al-dev strong { color:#F47B20; }
        .auth-right {
          flex:1; background:#F5F5F5; display:flex; align-items:center;
          justify-content:center; padding:2rem; overflow-y:auto;
        }
        .auth-card {
          width:100%; max-width:480px; background:#fff; border-radius:16px;
          padding:2.5rem; box-shadow:0 4px 24px rgba(0,0,0,0.08);
          display:flex; flex-direction:column; gap:1.25rem;
        }
        .step-row { display:flex; align-items:center; gap:0; }
        .step-dot {
          width:28px; height:28px; border-radius:50%; background:#E5E5E5;
          color:#737373; font-size:0.8rem; font-weight:600;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
          transition:all 0.2s;
        }
        .step-dot.done { background:#F47B20; color:#fff; }
        .step-line { flex:1; height:2px; background:#E5E5E5; max-width:60px; }
        .ac-head { display:flex; flex-direction:column; gap:0.3rem; }
        .ac-title { font-family:var(--font-display); font-size:1.75rem; letter-spacing:0.04em; color:#1A1A1A; }
        .ac-sub { font-size:0.875rem; color:#737373; }
        .auth-err { background:#FEF2F2; border:1px solid #FCA5A5; color:#DC2626; padding:0.75rem 1rem; border-radius:8px; font-size:0.875rem; }
        .role-list { display:flex; flex-direction:column; gap:0.75rem; }
        .role-card {
          display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem;
          background:#F5F5F5; border:1.5px solid #E5E5E5; border-radius:10px;
          cursor:pointer; text-align:left; transition:all 0.2s;
          font-family:var(--font-body); width:100%;
        }
        .role-card:hover { border-color:#F47B20; background:#FFF7ED; }
        .role-card.selected { border-color:#F47B20; background:#FFF7ED; box-shadow:0 0 0 3px rgba(244,123,32,0.12); }
        .rc-icon { font-size:1.5rem; flex-shrink:0; }
        .rc-body { flex:1; }
        .rc-label { font-size:0.9rem; font-weight:600; color:#1A1A1A; }
        .rc-desc { font-size:0.75rem; color:#737373; margin-top:0.2rem; }
        .rc-check { color:#F47B20; font-weight:700; font-size:1.1rem; flex-shrink:0; }
        .auth-form { display:flex; flex-direction:column; gap:1rem; }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .field { display:flex; flex-direction:column; gap:0.4rem; }
        .fl { font-size:0.7rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#525252; }
        .fi {
          background:#F5F5F5; border:1.5px solid #E5E5E5; border-radius:8px;
          padding:0.8rem 1rem; color:#1A1A1A; font-size:0.9rem;
          font-family:var(--font-body); outline:none; transition:all 0.2s; width:100%;
        }
        .fi:focus { border-color:#F47B20; background:#fff; box-shadow:0 0 0 3px rgba(244,123,32,0.1); }
        .fi::placeholder { color:#A3A3A3; }
        .dealer-note {
          background:#FFF7ED; border:1px solid rgba(244,123,32,0.3);
          color:#C4621A; padding:0.75rem 1rem; border-radius:8px;
          font-size:0.8rem; line-height:1.5;
        }
        .form-actions { display:flex; gap:0.75rem; align-items:center; margin-top:0.25rem; }
        .back-btn {
          background:#F5F5F5; border:1.5px solid #E5E5E5; color:#525252;
          border-radius:8px; padding:0.875rem 1.25rem; font-family:var(--font-body);
          font-size:0.875rem; cursor:pointer; transition:all 0.2s; white-space:nowrap;
        }
        .back-btn:hover { border-color:#F47B20; color:#F47B20; }
        .auth-btn {
          background:#F47B20; color:#fff; border:none; border-radius:8px;
          padding:0.875rem 1.25rem; font-family:var(--font-display); font-size:0.95rem;
          letter-spacing:0.12em; cursor:pointer; transition:background 0.2s;
        }
        .auth-btn:hover { background:#FF9340; }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .flex-btn { flex:1; }
        .auth-switch { font-size:0.875rem; color:#737373; text-align:center; }
        .switch-link { color:#F47B20; text-decoration:none; font-weight:600; }
        @media(max-width:768px) {
          .auth-left { display:none; }
          .auth-right { background:#fff; padding:1.5rem; }
          .auth-card { box-shadow:none; padding:1.5rem; }
          .form-row { grid-template-columns:1fr; }
        }
      `}</style>
    </div>
  );
}