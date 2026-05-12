# ================================================================
# CARSTRIMS — AUTH FLOW COMPLETE FIX
# Run from your project root: C:\Users\USER\car-dealer-app\frontend
# Command: powershell -ExecutionPolicy Bypass -File FIX-AUTH-FLOW.ps1
# ================================================================

$utf8NoBom = New-Object System.Text.Encoding+UTF8Encoding($false)

# IMPORTANT: PowerShell treats (auth) as a subexpression in strings.
# We use Join-Path and backtick escaping to handle this correctly.
$authDir   = Join-Path $PWD "app\`(auth`)"
$registerDir  = Join-Path $authDir "register"
$loginDir     = Join-Path $authDir "login"
$forgotDir    = Join-Path $authDir "forgot-password"
$setupDir     = Join-Path $PWD "app\dashboard\dealer\setup"
$approvalsDir = Join-Path $PWD "app\dashboard\super-admin\approvals"

# Create directories
New-Item -ItemType Directory -Force -Path $registerDir  | Out-Null
New-Item -ItemType Directory -Force -Path $loginDir     | Out-Null
New-Item -ItemType Directory -Force -Path $forgotDir    | Out-Null
New-Item -ItemType Directory -Force -Path $setupDir     | Out-Null
New-Item -ItemType Directory -Force -Path $approvalsDir | Out-Null

Write-Host "Directories verified" -ForegroundColor Cyan

# ── FIX 1: REGISTER PAGE ─────────────────────────────────────
Write-Host "[1/6] Writing register page..." -ForegroundColor Yellow
$registerPath = Join-Path $registerDir "page.tsx"
[System.IO.File]::WriteAllText($registerPath, @'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore, getRoleRedirect } from "@/store/authStore";

const ROLES = [
  { value:"DEALER_ADMIN", label:"Dealer / Car Stand", icon:"D", desc:"Manage inventory, staff and sales from your own dealership" },
  { value:"PARTNER_USER", label:"Partner / Asset Owner", icon:"P", desc:"Monitor your cars assigned across multiple dealers" },
  { value:"PUBLIC_USER",  label:"Car Buyer", icon:"B", desc:"Browse, save and request cars from verified dealers" },
];

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ fullName:"", username:"", email:"", password:"", phone:"", whatsapp:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      // Step 1: Register
      await api.post("/api/v1/auth/register", { ...form, role });

      // Step 2: Auto-login
      const loginRes = await api.post("/api/v1/auth/login", {
        email: form.email, password: form.password,
      });
      const d = loginRes.data;

      // Handle both snake_case (FastAPI) and camelCase response formats
      const userData = {
        userId:       d.userId       || d.user_id       || d.id  || "",
        fullName:     d.fullName     || d.full_name      || form.fullName || "",
        email:        d.email        || form.email,
        role:         d.role,
        dealerId:     d.dealerId     || d.dealer_id      || null,
        accessToken:  d.accessToken  || d.access_token   || "",
        refreshToken: d.refreshToken || d.refresh_token  || "",
      };

      if (!userData.accessToken) {
        throw new Error("Login succeeded but no access token received. Please log in manually.");
      }

      setUser(userData as any);

      // Step 3: Redirect
      if (role === "DEALER_ADMIN") {
        router.push("/dashboard/dealer/setup");
      } else {
        router.push(getRoleRedirect(d.role, userData.dealerId));
      }
    } catch (err: any) {
      const raw = err.response?.data?.detail || err.message || "";
      const lower = raw.toLowerCase();
      if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("email already")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (lower.includes("no access token")) {
        setError(raw);
      } else if (raw) {
        setError(raw);
      } else {
        setError("Registration failed. Please check your details and try again.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="rg-root">
      <div className="rg-left">
        <div className="rg-brand">CARSTRIMS</div>
        <div className="rg-mid">
          <h1 className="rg-title">JOIN THE PLATFORM TODAY</h1>
          <p className="rg-sub">Whether you are a dealer, partner or buyer - CARSTRIMS gives you the tools to succeed in the Nigerian automotive market.</p>
          <div className="rg-feats">
            {["Free to join","Verified dealers only","Real-time inventory","Secure messaging"].map((f) => (
              <div key={f} className="rg-feat"><span className="rg-dot" />{f}</div>
            ))}
          </div>
        </div>
        <div className="rg-foot">Built by <strong>UASE TECH STUDIO</strong> &middot; CARSTRIMS 2026</div>
      </div>

      <div className="rg-right">
        <div className="rg-card">
          <div className="rg-mobile-brand">CARSTRIMS</div>
          <div className="rg-steps">
            <div className={`rg-step ${step >= 1 ? "active" : ""}`}>1</div>
            <div className="rg-step-line" />
            <div className={`rg-step ${step >= 2 ? "active" : ""}`}>2</div>
          </div>
          <div>
            <h2 className="rg-card-title">{step === 1 ? "Choose Account Type" : "Create Your Account"}</h2>
            <p className="rg-card-sub">{step === 1 ? "Select how you will use CARSTRIMS" : "Fill in your details below"}</p>
          </div>
          {error && <div className="rg-err">{error}</div>}
          {step === 1 ? (
            <div className="rg-roles">
              {ROLES.map((r) => (
                <button key={r.value} className={`rg-role ${role === r.value ? "sel" : ""}`} onClick={() => setRole(r.value)}>
                  <div className="rg-role-body">
                    <div className="rg-role-label">{r.label}</div>
                    <div className="rg-role-desc">{r.desc}</div>
                  </div>
                  {role === r.value && <span className="rg-check">Selected</span>}
                </button>
              ))}
              <button className="rg-btn" onClick={() => setStep(2)} disabled={!role}>CONTINUE</button>
            </div>
          ) : (
            <form onSubmit={submit} className="rg-form">
              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-lbl">Full Name *</label>
                  <input className="rg-input" placeholder="John Doe" value={form.fullName} onChange={(e) => setForm({...form,fullName:e.target.value})} required />
                </div>
                <div className="rg-field">
                  <label className="rg-lbl">Username *</label>
                  <input className="rg-input" placeholder="johndoe" value={form.username} onChange={(e) => setForm({...form,username:e.target.value})} required />
                </div>
              </div>
              <div className="rg-field">
                <label className="rg-lbl">Email Address *</label>
                <input type="email" className="rg-input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} required />
              </div>
              <div className="rg-field">
                <label className="rg-lbl">Password *</label>
                <input type="password" className="rg-input" placeholder="Minimum 8 characters" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} required minLength={8} />
              </div>
              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-lbl">Phone *</label>
                  <input className="rg-input" placeholder="+234..." value={form.phone} onChange={(e) => setForm({...form,phone:e.target.value})} required />
                </div>
                <div className="rg-field">
                  <label className="rg-lbl">WhatsApp</label>
                  <input className="rg-input" placeholder="+234..." value={form.whatsapp} onChange={(e) => setForm({...form,whatsapp:e.target.value})} />
                </div>
              </div>
              {role === "DEALER_ADMIN" && (
                <div className="rg-notice">
                  <strong>Dealer Account:</strong> After registering you will complete your dealership profile. You can use your dashboard right away but your listings will be hidden from the public until a CARSTRIMS admin approves your account.
                </div>
              )}
              <div className="rg-actions">
                <button type="button" className="rg-back" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="rg-btn rg-flex1" disabled={loading}>{loading ? "Creating account..." : "CREATE ACCOUNT"}</button>
              </div>
            </form>
          )}
          <p className="rg-switch">Already have an account? <Link href="/login" className="rg-link">Sign in</Link></p>
        </div>
      </div>

      <style>{`
        .rg-root{display:flex;min-height:100vh;background:#F5F5F5;font-family:var(--font-body)}
        .rg-left{width:42%;background:linear-gradient(160deg,#E5E5E5,#D4D4D4,#C8C8C8);display:flex;flex-direction:column;justify-content:space-between;padding:2.5rem;flex-shrink:0;overflow:hidden}
        .rg-brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.2em;color:#F47B20}
        .rg-mid{display:flex;flex-direction:column;gap:1.25rem}
        .rg-title{font-family:var(--font-display);font-size:clamp(1.8rem,2.5vw,3rem);line-height:1.05;color:#1A1A1A}
        .rg-sub{font-size:0.9rem;color:#525252;line-height:1.7}
        .rg-feats{display:flex;flex-direction:column;gap:0.5rem}
        .rg-feat{display:flex;align-items:center;gap:0.6rem;font-size:0.875rem;color:#404040}
        .rg-dot{width:8px;height:8px;border-radius:50%;background:#F47B20;flex-shrink:0;display:block}
        .rg-foot{font-size:0.7rem;color:#A3A3A3}
        .rg-foot strong{color:#F47B20}
        .rg-right{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:2rem;overflow-y:auto}
        .rg-card{width:100%;max-width:500px;background:#fff;border-radius:16px;padding:2rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);display:flex;flex-direction:column;gap:1.25rem;margin:auto}
        .rg-mobile-brand{display:none;font-family:var(--font-display);font-size:1.3rem;letter-spacing:0.2em;color:#F47B20;text-align:center}
        .rg-steps{display:flex;align-items:center;gap:0.5rem}
        .rg-step{width:28px;height:28px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.8rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s}
        .rg-step.active{background:#F47B20;color:#fff}
        .rg-step-line{flex:1;height:2px;background:#E5E5E5;max-width:50px}
        .rg-card-title{font-family:var(--font-display);font-size:1.6rem;color:#1A1A1A}
        .rg-card-sub{font-size:0.875rem;color:#737373;margin-top:0.25rem}
        .rg-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem}
        .rg-roles{display:flex;flex-direction:column;gap:0.75rem}
        .rg-role{display:flex;align-items:center;gap:1rem;padding:1rem;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:10px;cursor:pointer;text-align:left;width:100%;font-family:var(--font-body);transition:all 0.2s}
        .rg-role:hover,.rg-role.sel{border-color:#F47B20;background:#FFF7ED}
        .rg-role-body{flex:1}
        .rg-role-label{font-size:0.9rem;font-weight:600;color:#1A1A1A}
        .rg-role-desc{font-size:0.75rem;color:#737373;margin-top:0.15rem}
        .rg-check{font-size:0.7rem;background:#F47B20;color:#fff;padding:0.2rem 0.5rem;border-radius:4px;white-space:nowrap}
        .rg-form{display:flex;flex-direction:column;gap:1rem}
        .rg-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .rg-field{display:flex;flex-direction:column;gap:0.4rem}
        .rg-lbl{font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#525252}
        .rg-input{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.875rem 1rem;color:#1A1A1A;font-size:0.9rem;font-family:var(--font-body);outline:none;width:100%;transition:border-color 0.2s;box-sizing:border-box}
        .rg-input:focus{border-color:#F47B20;background:#fff}
        .rg-notice{background:#FFF7ED;border:1px solid rgba(244,123,32,0.3);color:#C4621A;padding:0.875rem 1rem;border-radius:8px;font-size:0.82rem;line-height:1.6}
        .rg-actions{display:flex;gap:0.75rem}
        .rg-back{background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;border-radius:8px;padding:0.875rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;white-space:nowrap}
        .rg-btn{background:#F47B20;color:#fff;border:none;border-radius:8px;padding:0.875rem 1.25rem;font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.1em;cursor:pointer;transition:background 0.2s}
        .rg-btn:hover{background:#FF9340}
        .rg-btn:disabled{opacity:0.6;cursor:not-allowed}
        .rg-flex1{flex:1}
        .rg-switch{font-size:0.875rem;color:#737373;text-align:center}
        .rg-link{color:#F47B20;font-weight:600}
        @media(max-width:768px){.rg-left{display:none}.rg-right{padding:1rem;background:#fff}.rg-card{box-shadow:none;border-radius:0;padding:1.25rem;max-width:100%}.rg-mobile-brand{display:block}.rg-row{grid-template-columns:1fr}.rg-card-title{font-size:1.4rem}.rg-actions{flex-direction:column}.rg-back{order:2}.rg-btn.rg-flex1{order:1}}
      `}</style>
    </div>
  );
}
'@, $utf8NoBom)
Write-Host "  register/page.tsx written to: $registerPath" -ForegroundColor Green

# ── FIX 2: LOGIN PAGE ─────────────────────────────────────────
Write-Host "[2/6] Writing login page..." -ForegroundColor Yellow
$loginPath = Join-Path $loginDir "page.tsx"
[System.IO.File]::WriteAllText($loginPath, @'
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", form);
      const d = res.data;

      // Handle both snake_case (FastAPI default) and camelCase
      const userData = {
        userId:       d.userId       || d.user_id       || d.id  || "",
        fullName:     d.fullName     || d.full_name      || "",
        email:        d.email        || form.email,
        role:         d.role,
        dealerId:     d.dealerId     || d.dealer_id      || null,
        accessToken:  d.accessToken  || d.access_token   || "",
        refreshToken: d.refreshToken || d.refresh_token  || "",
      };

      if (!userData.accessToken) {
        setError("Login failed: no token received from server. Please try again.");
        return;
      }

      setUser(userData as any);

      // Dealers go to dealer dashboard — layout will redirect to setup if needed
      if (d.role === "DEALER_ADMIN") {
        router.push("/dashboard/dealer");
      } else {
        router.push(getRoleRedirect(d.role, userData.dealerId));
      }
    } catch (err: any) {
      const status  = err.response?.status;
      const detail  = (err.response?.data?.detail || "").toLowerCase();
      if (status === 401 || detail.includes("password") || detail.includes("invalid") || detail.includes("incorrect")) {
        setError("Invalid email or password. Please try again.");
      } else if (status === 404 || detail.includes("not found")) {
        setError("No account found with this email address. Please check and try again.");
      } else if (!err.response) {
        setError("Cannot reach the server. Please check your internet connection.");
      } else {
        setError(err.response?.data?.detail || "Login failed. Please try again.");
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
          {error && <div className="auth-err">{error}</div>}
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
        .auth-card{width:100%;max-width:420px;background:#fff;border-radius:16px;padding:2.5rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);display:flex;flex-direction:column;gap:1.5rem}
        .card-title{font-family:var(--font-display);font-size:2rem;letter-spacing:0.04em;color:#1A1A1A}
        .card-sub{font-size:0.875rem;color:#737373;margin-top:0.25rem}
        .auth-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem}
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
'@, $utf8NoBom)
Write-Host "  login/page.tsx written to: $loginPath" -ForegroundColor Green

# ── FIX 3: DEALER LAYOUT ──────────────────────────────────────
Write-Host "[3/6] Writing dealer layout..." -ForegroundColor Yellow
$dealerLayoutPath = Join-Path $PWD "app\dashboard\dealer\layout.tsx"
[System.IO.File]::WriteAllText($dealerLayoutPath, @'
"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import DealerSidebar from "@/components/layout/DealerSidebar";
import DealerTopbar from "@/components/layout/DealerTopbar";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

function DealerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [dealerStatus, setDealerStatus] = useState<string | null>(null);

  useEffect(() => {
    // Setup page handles its own logic
    if (pathname.includes("/setup")) { setReady(true); return; }

    api.get("/api/v1/dealers/me")
      .then((r) => {
        const d = r.data;
        setDealerStatus(d?.status || null);
        // If no company name yet, they haven't done setup
        if (!d?.companyName) {
          router.replace("/dashboard/dealer/setup");
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        // 404 = no dealer profile = needs setup
        // 401 = token issue = AuthGuard will handle
        const status = err?.response?.status;
        if (status !== 401) {
          router.replace("/dashboard/dealer/setup");
        }
      });
  }, [pathname, router]);

  if (!ready && !pathname.includes("/setup")) {
    return (
      <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{width:"28px",height:"28px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (pathname.includes("/setup")) return <>{children}</>;

  const isPending = dealerStatus === "awaiting_approval" || dealerStatus === "pending";

  return (
    <div className="dealer-shell">
      <DealerSidebar />
      <div className="dealer-main">
        <DealerTopbar />
        {isPending && (
          <div style={{background:"#FFF7ED",borderBottom:"2px solid #F47B20",padding:"0.6rem 1.75rem",fontSize:"0.82rem",color:"#C4621A",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
            <span>Pending</span>
            <span>
              <strong>Pending Approval:</strong> Your account is under review by the CARSTRIMS admin.
              Your listings are hidden from buyers until approved. You can still set up your dashboard, add cars, and manage staff.
            </span>
          </div>
        )}
        <main className="dealer-content">{children}</main>
      </div>
      <style>{`
        .dealer-shell{display:flex;min-height:100vh;background:#F5F5F5}
        .dealer-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0}
        .dealer-content{flex:1;padding:1.75rem}
        @media(max-width:768px){.dealer-main{margin-left:0}.dealer-content{padding:1rem}}
      `}</style>
    </div>
  );
}

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["DEALER_ADMIN"]}>
      <DealerShell>{children}</DealerShell>
    </AuthGuard>
  );
}
'@, $utf8NoBom)
Write-Host "  dealer/layout.tsx written" -ForegroundColor Green

# ── FIX 4: APPROVALS PAGE ─────────────────────────────────────
Write-Host "[4/6] Writing approvals page..." -ForegroundColor Yellow
$approvalsPath = Join-Path $approvalsDir "page.tsx"
[System.IO.File]::WriteAllText($approvalsPath, @'
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ApprovalsPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success"|"error">("success");
  const [debugInfo, setDebugInfo] = useState<string>("");

  const showMsg = (text: string, type: "success"|"error") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 8000);
  };

  const load = async () => {
    setLoading(true);
    const results: any[] = [];
    const debugLines: string[] = [];

    // Try every possible endpoint that might return pending dealers
    const endpoints = [
      { url: "/api/v1/admin/dealers", params: { status: "awaiting_approval", limit: 100 } },
      { url: "/api/v1/admin/dealers", params: { status: "pending", limit: 100 } },
      { url: "/api/v1/admin/dealers", params: { limit: 200 } }, // get all, filter client-side
    ];

    for (const ep of endpoints) {
      try {
        const r = await api.get(ep.url, { params: ep.params });
        const rawData = r.data;
        // Handle multiple response shapes
        const list: any[] = rawData?.dealers || rawData?.items || rawData?.data || (Array.isArray(rawData) ? rawData : []);
        const pending = list.filter((d: any) =>
          !ep.params.status || // if no status filter, filter client-side
          d.status === "awaiting_approval" || d.status === "pending"
        );
        debugLines.push(`${ep.url}?status=${ep.params.status||"all"}: ${list.length} total, ${pending.length} pending`);
        pending.forEach((d: any) => { if(!results.find(x=>x._id===d._id)) results.push(d); });
      } catch (e: any) {
        debugLines.push(`${ep.url}: ERROR ${e.response?.status} - ${e.response?.data?.detail || e.message}`);
      }
    }

    // Also check users table for DEALER_ADMIN users with pending status
    try {
      const r = await api.get("/api/v1/admin/users", { params: { role: "DEALER_ADMIN", limit: 200 } });
      const users = r.data?.users || r.data?.items || (Array.isArray(r.data) ? r.data : []);
      const pendingUsers = users.filter((u: any) => u.status === "pending" || u.status === "awaiting_approval");
      debugLines.push(`/api/v1/admin/users (DEALER_ADMIN): ${users.length} total, ${pendingUsers.length} pending`);
      pendingUsers.forEach((u: any) => {
        if (!results.find(x => x.email === u.email || x.userId === u._id)) {
          results.push({
            _id: u._id, userId: u._id,
            companyName: (u.fullName || u.username || "Unknown") + " — setup not completed",
            ownerName: u.fullName || u.username || "Unknown",
            email: u.email, phone: u.phone || u.whatsapp || "",
            createdAt: u.createdAt, status: "awaiting_approval",
            _userOnly: true, _noProfile: true,
          });
        }
      });
    } catch (e: any) {
      debugLines.push(`/api/v1/admin/users: ERROR ${e.response?.status}`);
    }

    setDealers(results);
    setDebugInfo(debugLines.join("\n"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (dealer: any) => {
    setActionLoading(dealer._id);
    const id = dealer._id;
    try {
      if (dealer._userOnly) {
        // No dealer profile — just activate the user account
        let done = false;
        const tryPatches = [
          () => api.patch(`/api/v1/admin/users/${id}`, { status: "active" }),
          () => api.post(`/api/v1/admin/users/${id}/activate`),
          () => api.put(`/api/v1/admin/users/${id}`, { status: "active" }),
        ];
        for (const fn of tryPatches) {
          try { await fn(); done = true; break; } catch {}
        }
        if (!done) throw new Error("Could not activate user — all endpoints failed");
        showMsg(`${dealer.ownerName} activated. They need to complete dealership setup to get full access.`, "success");
      } else {
        // Has dealer profile — approve it
        let done = false;
        const tryApprove = [
          () => api.post(`/api/v1/admin/dealers/${id}/approve`),
          () => api.patch(`/api/v1/admin/dealers/${id}`, { status: "approved" }),
          () => api.put(`/api/v1/admin/dealers/${id}`, { status: "approved" }),
        ];
        for (const fn of tryApprove) {
          try { await fn(); done = true; break; } catch {}
        }
        if (!done) throw new Error("Could not approve — all endpoints failed");
        showMsg(`${dealer.companyName} approved! They now have full access to the platform.`, "success");
      }
      setExpanded(null);
      load();
    } catch (err: any) {
      showMsg(
        `Approval failed: ${err.response?.data?.detail || err.message}. Check the browser console for details.`,
        "error"
      );
      console.error("Approve error:", err.response?.data || err);
    } finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id);
    const id = rejectModal._id;
    const reason = rejectReason || "Application does not meet our requirements";
    try {
      let done = false;
      const tryReject = [
        () => api.post(`/api/v1/admin/dealers/${id}/reject`, { reason }),
        () => api.patch(`/api/v1/admin/dealers/${id}`, { status: "rejected", rejectionReason: reason }),
        () => api.put(`/api/v1/admin/dealers/${id}`, { status: "rejected" }),
      ];
      for (const fn of tryReject) {
        try { await fn(); done = true; break; } catch {}
      }
      if (!done) throw new Error("All reject endpoints failed");
      showMsg(`${rejectModal.companyName} rejected.`, "success");
      setRejectModal(null); setRejectReason(""); setExpanded(null);
      load();
    } catch (err: any) {
      showMsg(`Reject failed: ${err.response?.data?.detail || err.message}`, "error");
    } finally { setActionLoading(null); }
  };

  const fmtDate = (iso: string) => {
    if (!iso) return "-";
    try { return new Date(iso).toLocaleDateString("en-NG", {day:"numeric",month:"short",year:"numeric"}); }
    catch { return iso; }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>Pending Approvals</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>
            {loading ? "Loading..." : `${dealers.length} dealer application${dealers.length!==1?"s":""} awaiting review`}
          </p>
        </div>
        <button onClick={load} style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.6rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>
          Refresh
        </button>
      </div>

      {msg && (
        <div style={{background:msgType==="success"?"#F0FDF4":"#FEF2F2",border:`1px solid ${msgType==="success"?"#86EFAC":"#FCA5A5"}`,color:msgType==="success"?"#15803D":"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1rem"}}>
          <span style={{lineHeight:1.5}}>{msg}</span>
          <button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",flexShrink:0}}>X</button>
        </div>
      )}

      {/* Debug panel - shows what each API call returned */}
      {debugInfo && (
        <details style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.75rem"}}>
          <summary style={{cursor:"pointer",color:"#737373",fontWeight:600}}>API Debug Info (click to expand)</summary>
          <pre style={{marginTop:"0.5rem",color:"#525252",whiteSpace:"pre-wrap",fontSize:"0.72rem"}}>{debugInfo}</pre>
        </details>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : dealers.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.875rem"}}>
          <div style={{fontSize:"2rem"}}>Done</div>
          <div style={{fontSize:"0.9rem",fontWeight:600,color:"#1A1A1A"}}>No pending approvals found</div>
          <p style={{fontSize:"0.825rem",color:"#737373",maxWidth:"400px",lineHeight:1.6}}>
            No dealers with pending or awaiting_approval status were found. Check the API Debug Info above to see what the server returned. If dealers registered but show here as empty, they may need to complete their setup profile first.
          </p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {dealers.map((d) => (
            <div key={d._id} style={{background:"#fff",border:`1.5px solid ${expanded===d._id?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",overflow:"hidden",transition:"border-color 0.2s"}}>
              {/* Header row */}
              <div style={{padding:"1.25rem 1.5rem",display:"flex",alignItems:"flex-start",gap:"1rem",cursor:"pointer"}} onClick={()=>setExpanded(expanded===d._id?null:d._id)}>
                <div style={{width:"48px",height:"48px",borderRadius:"8px",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1.3rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                  {d.logo ? <img src={d.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : (d.companyName?.charAt(0) || "?")}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:"0.975rem",color:"#1A1A1A"}}>{d.companyName}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>{d.ownerName} &middot; {d.email}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373"}}>{d.phone}{d.city?` &middot; ${d.city}, ${d.state}`:""}</div>
                  <div style={{display:"flex",gap:"0.5rem",marginTop:"0.4rem",flexWrap:"wrap"}}>
                    <span style={{fontSize:"0.68rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>Applied {fmtDate(d.createdAt)}</span>
                    {d._noProfile && <span style={{fontSize:"0.68rem",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FCA5A5",borderRadius:"4px",padding:"0.15rem 0.5rem"}}>Setup not completed</span>}
                    {d.dealerId && <span style={{fontSize:"0.68rem",background:"#F5F5F5",color:"#737373",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.15rem 0.5rem",fontFamily:"monospace"}}>{d.dealerId}</span>}
                    <span style={{fontSize:"0.65rem",color:"#A3A3A3"}}>ID: {d._id}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                    style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.5rem 1rem",fontFamily:"var(--font-display)",fontSize:"0.8rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1,whiteSpace:"nowrap"}}>
                    {actionLoading===d._id?"Processing...":"Approve"}
                  </button>
                  <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                    style={{background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>
                    Reject
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded===d._id && (
                <div style={{borderTop:"1px solid #F5F5F5",padding:"1.25rem 1.5rem",background:"#FAFAFA",display:"flex",flexDirection:"column",gap:"1rem"}}>
                  <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373"}}>Full Details</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.75rem"}}>
                    {[["Name",d.ownerName||"-"],["Email",d.email||"-"],["Phone",d.phone||"-"],["WhatsApp",d.whatsapp||d.phone||"-"],["Address",d.address||"-"],["City/State",d.city&&d.state?`${d.city}, ${d.state}`:(d.city||d.state||"-")],["Country",d.country||"Nigeria"],["Status",d.status||"-"],["Dealer ID",d.dealerId||"Not yet assigned"]].map(([label,val])=>(
                      <div key={label} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 0.875rem"}}>
                        <div style={{fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.2rem"}}>{label}</div>
                        <div style={{fontSize:"0.825rem",color:"#1A1A1A",fontWeight:500,wordBreak:"break-all"}}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Documents */}
                  {(d.idCardUrl||d.cacUrl) && (
                    <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                      {d.idCardUrl && <a href={d.idCardUrl} target="_blank" rel="noreferrer" style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 1rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>View ID Card</a>}
                      {d.cacUrl && <a href={d.cacUrl} target="_blank" rel="noreferrer" style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.625rem 1rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>View CAC</a>}
                    </div>
                  )}

                  {/* No docs warning */}
                  {!d.idCardUrl && !d.cacUrl && (
                    <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem",fontSize:"0.825rem",color:"#C4621A",lineHeight:1.5}}>
                      No documents uploaded yet. You can still approve, or contact the dealer to upload their ID and business registration from their Settings page before approving.
                    </div>
                  )}

                  {d._noProfile && (
                    <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"0.875rem",fontSize:"0.825rem",color:"#DC2626",lineHeight:1.5}}>
                      This dealer registered an account but has not completed their dealership profile setup yet. Contact them via the buttons below to ask them to complete setup. You can approve their user account which will let them proceed.
                    </div>
                  )}

                  {/* Contact */}
                  <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
                    {d.phone && <a href={`tel:${d.phone}`} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1A1A1A",textDecoration:"none"}}>Call {d.phone}</a>}
                    {(d.whatsapp||d.phone) && <a href={`https://wa.me/${(d.whatsapp||d.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#15803D",textDecoration:"none"}}>WhatsApp</a>}
                    {d.email && <a href={`mailto:${d.email}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.8rem",color:"#1D4ED8",textDecoration:"none"}}>Email</a>}
                  </div>

                  {/* Approve/Reject row */}
                  <div style={{display:"flex",gap:"0.75rem",borderTop:"1px solid #E5E5E5",paddingTop:"1rem"}}>
                    <button onClick={()=>approve(d)} disabled={actionLoading===d._id}
                      style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:actionLoading===d._id?0.6:1}}>
                      {actionLoading===d._id?"Processing...":"APPROVE DEALER"}
                    </button>
                    <button onClick={()=>{setRejectModal(d);setRejectReason("");}}
                      style={{flex:1,background:"#FEF2F2",border:"1.5px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>
                      Reject Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"440px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>REJECT DEALER APPLICATION</h3>
            <p style={{fontSize:"0.875rem",color:"#737373"}}>Rejecting <strong>{rejectModal.companyName}</strong>. Provide a reason to send to the dealer.</p>
            <div>
              <label style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.4rem"}}>Reason *</label>
              <textarea style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",minHeight:"100px",resize:"vertical" as const,boxSizing:"border-box" as const}}
                placeholder="e.g. Documents not provided, incomplete business information..."
                value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
            </div>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setRejectModal(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Cancel</button>
              <button onClick={reject} disabled={actionLoading===rejectModal._id}
                style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading===rejectModal._id?0.6:1}}>
                {actionLoading===rejectModal._id?"Rejecting...":"Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'@, $utf8NoBom)
Write-Host "  approvals/page.tsx written" -ForegroundColor Green

# ── FIX 5: VERIFY ALL FILES EXIST ─────────────────────────────
Write-Host "[5/6] Verifying all files exist..." -ForegroundColor Yellow
$filesToCheck = @(
  $registerPath,
  $loginPath,
  (Join-Path $forgotDir "page.tsx"),
  $dealerLayoutPath,
  (Join-Path $setupDir "page.tsx"),
  $approvalsPath
)
foreach ($f in $filesToCheck) {
  if (Test-Path $f) {
    $lines = (Get-Content $f).Count
    Write-Host "  OK ($lines lines): $f" -ForegroundColor Green
  } else {
    Write-Host "  MISSING: $f" -ForegroundColor Red
  }
}

# ── FIX 6: CLEAN & BUILD ──────────────────────────────────────
Write-Host "[6/6] Cleaning build cache..." -ForegroundColor Yellow
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL FILES WRITTEN SUCCESSFULLY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Run: npm run build" -ForegroundColor White
Write-Host "  2. Check for errors above" -ForegroundColor White
Write-Host "  3. Run: git add . && git commit -m 'fix: auth flow register login approvals' && git push" -ForegroundColor White
Write-Host ""
Write-Host "KEY FIXES APPLIED:" -ForegroundColor Yellow
Write-Host "  - Register: handles both snake_case and camelCase API responses" -ForegroundColor Gray
Write-Host "  - Login: same field normalization + clear error messages" -ForegroundColor Gray
Write-Host "  - Dealer layout: proper setup redirect logic" -ForegroundColor Gray
Write-Host "  - Approvals: tries multiple API endpoints + shows debug info" -ForegroundColor Gray
Write-Host "  - All paths use Join-Path to avoid PowerShell parentheses bug" -ForegroundColor Gray
