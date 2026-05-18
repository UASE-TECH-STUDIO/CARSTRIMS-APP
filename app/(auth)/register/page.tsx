"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore, getRoleRedirect } from "@/store/authStore";

const ROLES = [
  { value:"DEALER_ADMIN", label:"Dealership", icon:"🏪", desc:"Manage inventory, staff and sales from your own dealership" },
  { value:"PARTNER_USER", label:"Partner / Consignor", icon:"🤝", desc:"Monitor your vehicles assigned across multiple dealers" },
  { value:"PUBLIC_USER", label:"Buyer", icon:"🚗", desc:"Browse, save and request vehicles from verified dealers" },
];

// Twilio WhatsApp Sandbox number — update this to your actual Twilio number
const TWILIO_WHATSAPP_NUMBER = "+14155238886";
const TWILIO_SANDBOX_KEYWORD = "join carstrims";

export default function RegisterPage() {
  const router   = useRouter();
  const setUser  = useAuthStore((s) => s.setUser);
  const [step, setStep]       = useState(1);
  const [role, setRole]       = useState("");
  const [form, setForm]       = useState({ fullName:"", username:"", email:"", password:"", phone:"", whatsapp:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showWaSandbox, setShowWaSandbox] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/api/v1/auth/register", { ...form, role });
      const loginRes = await api.post("/api/v1/auth/login", { emailOrPhone: form.email, password: form.password });
      const d = loginRes.data;
      setUser({ userId:d.userId, fullName:d.fullName, email:d.email, role:d.role, dealerId:d.dealerId, accessToken:d.accessToken, refreshToken:d.refreshToken });
      if (role === "DEALER_ADMIN") { router.push("/dashboard/dealer/setup"); }
      else { router.push(getRoleRedirect(d.role, d.dealerId)); }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else { setError(msg || "Registration failed. Please try again."); }
    } finally { setLoading(false); }
  };

  return (
    <div className="rg-root">
      <div className="rg-left">
        <div className="rg-brand">CARSTRIMS</div>
        <div className="rg-mid">
          <h1 className="rg-title">JOIN THE PLATFORM TODAY</h1>
          <p className="rg-sub">Whether you are a dealership, partner or buyer — CARSTRIMS gives you the tools to succeed in the Nigerian automotive market.</p>
          <div className="rg-feats">
            {["Free to join","Verified dealerships only","Real-time inventory","Secure messaging"].map(f=>(
              <div key={f} className="rg-feat"><span className="rg-dot"/>{f}</div>
            ))}
          </div>
        </div>
        <div className="rg-foot">Built by <strong>UASE TECH STUDIO</strong> · CARSTRIMS 2026</div>
      </div>

      <div className="rg-right">
        <div className="rg-card">
          <div className="rg-mobile-top">
            <div className="rg-mobile-brand">CARSTRIMS</div>
            <p style={{fontSize:"0.7rem",color:"#A3A3A3",margin:0}}>Built by UASE TECH STUDIO</p>
          </div>
          <div className="rg-progress">
            <div className={`rg-dot-step ${step>=1?"done":""}`}><span>1</span></div>
            <div className="rg-prog-line"/>
            <div className={`rg-dot-step ${step>=2?"done":""}`}><span>2</span></div>
          </div>
          <div>
            <h2 className="rg-card-title">{step===1?"Choose Account Type":"Create Your Account"}</h2>
            <p className="rg-card-sub">{step===1?"Select how you will use CARSTRIMS":"Fill in your details below"}</p>
          </div>
          {error && <div className="rg-err"><span>{error}</span><button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button></div>}

          {step===1 ? (
            <div className="rg-roles">
              {ROLES.map(r=>(
                <button key={r.value} className={`rg-role ${role===r.value?"sel":""}`} onClick={()=>setRole(r.value)}>
                  <span className="rg-role-icon">{r.icon}</span>
                  <div className="rg-role-body">
                    <div className="rg-role-label">{r.label}</div>
                    <div className="rg-role-desc">{r.desc}</div>
                  </div>
                  {role===r.value && <span className="rg-check">✓</span>}
                </button>
              ))}
              <button className="rg-btn" onClick={()=>setStep(2)} disabled={!role}>CONTINUE →</button>
            </div>
          ) : (
            <form onSubmit={submit} className="rg-form">
              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-lbl">Full Name *</label>
                  <input className="rg-input" placeholder="e.g. Muhammed Abdullahi" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} required/>
                </div>
                <div className="rg-field">
                  <label className="rg-lbl">Username *</label>
                  <input className="rg-input" placeholder="e.g. muhammedabd" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required/>
                </div>
              </div>
              <div className="rg-field">
                <label className="rg-lbl">Email Address *</label>
                <input type="email" className="rg-input" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
              </div>
              <div className="rg-field">
                <label className="rg-lbl">Password *</label>
                <input type="password" className="rg-input" placeholder="Minimum 8 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={8}/>
              </div>
              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-lbl">Phone Number *</label>
                  <input className="rg-input" placeholder="+234 800 000 0000" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/>
                </div>
                <div className="rg-field">
                  <label className="rg-lbl">WhatsApp Number</label>
                  <input className="rg-input" placeholder="+234 800 000 0000" value={form.whatsapp}
                    onChange={e=>{setForm({...form,whatsapp:e.target.value});if(e.target.value.length>=7) setShowWaSandbox(true); else setShowWaSandbox(false);}}/>
                </div>
              </div>

              {/* WhatsApp Sandbox Onboarding */}
              {showWaSandbox && form.whatsapp && (
                <div className="rg-wa-box">
                  <div className="rg-wa-title">📱 Receive Admin Messages on WhatsApp?</div>
                  <p className="rg-wa-desc">
                    To receive notifications and messages from CARSTRIMS admins on WhatsApp, send this exact phrase from your WhatsApp number to our platform number:
                  </p>
                  <div className="rg-wa-step">
                    <span className="rg-wa-num">1</span>
                    <div>
                      <div className="rg-wa-label">Open WhatsApp and send to:</div>
                      <a href={`https://wa.me/${TWILIO_WHATSAPP_NUMBER.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="rg-wa-phone">{TWILIO_WHATSAPP_NUMBER}</a>
                    </div>
                  </div>
                  <div className="rg-wa-step">
                    <span className="rg-wa-num">2</span>
                    <div>
                      <div className="rg-wa-label">Send exactly this message:</div>
                      <div className="rg-wa-code">{TWILIO_SANDBOX_KEYWORD}</div>
                    </div>
                  </div>
                  <p className="rg-wa-note">This is optional. If you skip it, you will still receive notifications inside the app.</p>
                </div>
              )}

              {role==="DEALER_ADMIN" && (
                <div className="rg-notice"><strong>Dealership Account:</strong> After registering you will complete your dealership setup. Listings are hidden until a CARSTRIMS admin approves your account.</div>
              )}
              <div className="rg-actions">
                <button type="button" className="rg-back" onClick={()=>setStep(1)}>← Back</button>
                <button type="submit" className="rg-btn rg-flex1" disabled={loading}>{loading?"Creating account...":"CREATE ACCOUNT"}</button>
              </div>
            </form>
          )}
          <p className="rg-switch">Already have an account? <Link href="/login" className="rg-link">Sign in</Link></p>
        </div>
      </div>

      <style>{`
        .rg-root{display:flex;min-height:100vh;background:#F5F5F5;font-family:var(--font-body)}
        .rg-left{width:42%;background:linear-gradient(160deg,#1A1A1A 0%,#262626 60%,#333 100%);display:flex;flex-direction:column;justify-content:space-between;padding:2.5rem;flex-shrink:0;overflow:hidden}
        .rg-brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.25em;color:#F47B20}
        .rg-mid{display:flex;flex-direction:column;gap:1.25rem}
        .rg-title{font-family:var(--font-display);font-size:clamp(1.8rem,2.5vw,3rem);line-height:1.05;color:#fff}
        .rg-sub{font-size:0.9rem;color:#A3A3A3;line-height:1.7}
        .rg-feats{display:flex;flex-direction:column;gap:0.5rem}
        .rg-feat{display:flex;align-items:center;gap:0.6rem;font-size:0.875rem;color:#D4D4D4;font-weight:500}
        .rg-dot{width:7px;height:7px;border-radius:50%;background:#F47B20;flex-shrink:0;display:block}
        .rg-foot{font-size:0.7rem;color:#404040}.rg-foot strong{color:#F47B20}
        .rg-right{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:2rem;overflow-y:auto;background:#F5F5F5}
        .rg-card{width:100%;max-width:520px;background:#fff;border-radius:16px;padding:2rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);display:flex;flex-direction:column;gap:1.25rem;margin:auto}
        .rg-mobile-top{display:none;flex-direction:column;align-items:center;gap:0.2rem}
        .rg-mobile-brand{font-family:var(--font-display);font-size:1.4rem;letter-spacing:0.25em;color:#F47B20}
        .rg-progress{display:flex;align-items:center;gap:0}
        .rg-dot-step{width:28px;height:28px;border-radius:50%;background:#E5E5E5;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#737373;flex-shrink:0;transition:all 0.2s}
        .rg-dot-step.done{background:#F47B20;color:#fff}
        .rg-prog-line{flex:1;height:2px;background:#E5E5E5;max-width:50px}
        .rg-card-title{font-family:var(--font-display);font-size:1.6rem;color:#1A1A1A;line-height:1}
        .rg-card-sub{font-size:0.875rem;color:#737373;margin-top:0.25rem}
        .rg-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem;line-height:1.5;display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem}
        .rg-roles{display:flex;flex-direction:column;gap:0.75rem}
        .rg-role{display:flex;align-items:center;gap:0.875rem;padding:1rem;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:10px;cursor:pointer;text-align:left;width:100%;font-family:var(--font-body);transition:all 0.2s}
        .rg-role:hover,.rg-role.sel{border-color:#F47B20;background:#FFF7ED}
        .rg-role-icon{font-size:1.5rem;flex-shrink:0}
        .rg-role-body{flex:1}
        .rg-role-label{font-size:0.95rem;font-weight:700;color:#1A1A1A}
        .rg-role-desc{font-size:0.78rem;color:#737373;margin-top:0.15rem;line-height:1.4}
        .rg-check{color:#F47B20;font-size:1.2rem;font-weight:700;flex-shrink:0}
        .rg-form{display:flex;flex-direction:column;gap:1rem}
        .rg-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .rg-field{display:flex;flex-direction:column;gap:0.4rem}
        .rg-lbl{font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#525252}
        .rg-input{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.875rem 1rem;color:#1A1A1A;font-size:0.9rem;font-family:var(--font-body);outline:none;width:100%;transition:border-color 0.2s;box-sizing:border-box;font-weight:500}
        .rg-input:focus{border-color:#F47B20;background:#fff}
        .rg-input::placeholder{color:#A3A3A3;font-weight:400}
        /* WhatsApp sandbox box */
        .rg-wa-box{background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:10px;padding:1rem;display:flex;flex-direction:column;gap:0.625rem}
        .rg-wa-title{font-size:0.875rem;font-weight:700;color:#15803D}
        .rg-wa-desc{font-size:0.78rem;color:#525252;line-height:1.55;margin:0}
        .rg-wa-step{display:flex;align-items:flex-start;gap:0.75rem}
        .rg-wa-num{width:22px;height:22px;border-radius:50%;background:#16A34A;color:#fff;font-size:0.72rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
        .rg-wa-label{font-size:0.72rem;font-weight:600;color:#525252;margin-bottom:0.2rem}
        .rg-wa-phone{font-size:0.875rem;font-weight:700;color:#16A34A;text-decoration:none;display:block}
        .rg-wa-phone:hover{text-decoration:underline}
        .rg-wa-code{background:#1A1A1A;color:#fff;font-family:monospace;font-size:0.875rem;padding:0.4rem 0.75rem;border-radius:6px;display:inline-block;letter-spacing:0.05em}
        .rg-wa-note{font-size:0.72rem;color:#A3A3A3;margin:0;font-style:italic}
        .rg-notice{background:#FFF7ED;border:1px solid rgba(244,123,32,0.3);color:#C4621A;padding:0.875rem 1rem;border-radius:8px;font-size:0.82rem;line-height:1.6}
        .rg-actions{display:flex;gap:0.75rem}
        .rg-back{background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;border-radius:8px;padding:0.875rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;white-space:nowrap;font-weight:600}
        .rg-btn{background:#F47B20;color:#fff;border:none;border-radius:8px;padding:0.875rem 1.25rem;font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.1em;cursor:pointer;transition:background 0.2s;font-weight:700}
        .rg-btn:hover{background:#FF9340}.rg-btn:disabled{opacity:0.6;cursor:not-allowed}
        .rg-flex1{flex:1}
        .rg-switch{font-size:0.9rem;color:#737373;text-align:center}
        .rg-link{color:#F47B20;font-weight:700;text-decoration:none}
        .rg-link:hover{text-decoration:underline}
        @media(max-width:768px){
          .rg-left{display:none}
          .rg-right{padding:0;background:#fff;align-items:flex-start}
          .rg-card{box-shadow:none;border-radius:0;padding:1.5rem 1.25rem;max-width:100%;min-height:100vh}
          .rg-mobile-top{display:flex}
          .rg-row{grid-template-columns:1fr}
          .rg-card-title{font-size:1.4rem}
          .rg-actions{flex-direction:column}
          .rg-back{order:2}
          .rg-btn.rg-flex1{order:1}
        }
      `}</style>
    </div>
  );
}
