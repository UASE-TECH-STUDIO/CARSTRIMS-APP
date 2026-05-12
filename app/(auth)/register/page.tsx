"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

const ROLES = [
  { value:"DEALER_ADMIN", label:"Dealer / Car Stand", desc:"Manage inventory, staff and sales from your own dealership" },
  { value:"PARTNER_USER", label:"Partner / Asset Owner", desc:"Monitor your cars assigned across multiple dealers" },
  { value:"PUBLIC_USER",  label:"Car Buyer", desc:"Browse, save and request cars from verified dealers" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ fullName:"", username:"", email:"", password:"", phone:"", whatsapp:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/api/v1/auth/register", { ...form, role });
      setDone(true);
    } catch (err: any) {
      const raw = (err.response?.data?.detail || err.message || "").toString();
      const lower = raw.toLowerCase();
      if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("email already")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (raw) { setError(raw); }
      else { setError("Registration failed. Please check your details and try again."); }
    } finally { setLoading(false); }
  };

  if (done) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)"}}>
      <div style={{maxWidth:"480px",width:"100%",background:"#fff",borderRadius:"16px",padding:"2.5rem",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",gap:"1.5rem",alignItems:"center",textAlign:"center"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.3rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:"#F0FDF4",border:"2px solid #16A34A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem"}}>&#10003;</div>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.04em",color:"#1A1A1A"}}>Account Created!</h2>
          <p style={{fontSize:"0.9rem",color:"#737373",marginTop:"0.5rem",lineHeight:"1.7"}}>
            {role === "DEALER_ADMIN" ? "Your dealer account has been created. Sign in to complete your dealership setup profile." : "Your account is ready. Sign in to access your dashboard."}
          </p>
        </div>
        {role === "DEALER_ADMIN" && (
          <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"10px",padding:"1.25rem",width:"100%",textAlign:"left",fontSize:"0.85rem",color:"#C4621A",lineHeight:1.8}}>
            <strong>After signing in you will:</strong><br/>
            1. Complete your dealership profile<br/>
            2. Get access to your dealer dashboard<br/>
            3. Await admin approval (your listings will be hidden until then)
          </div>
        )}
        <button onClick={() => router.push("/login")} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem 2rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.12em",cursor:"pointer",width:"100%"}}>
          SIGN IN NOW
        </button>
      </div>
    </div>
  );

  return (
    <div className="rg-root">
      <div className="rg-left">
        <div className="rg-brand">CARSTRIMS</div>
        <div className="rg-mid">
          <h1 className="rg-title">JOIN THE PLATFORM TODAY</h1>
          <p className="rg-sub">Whether you are a dealer, partner or buyer - CARSTRIMS gives you the tools to succeed in the Nigerian automotive market.</p>
          <div className="rg-feats">{["Free to join","Verified dealers only","Real-time inventory","Secure messaging"].map((f)=>(<div key={f} className="rg-feat"><span className="rg-dot"/>{f}</div>))}</div>
        </div>
        <div className="rg-foot">Built by <strong>UASE TECH STUDIO</strong> &middot; CARSTRIMS 2026</div>
      </div>
      <div className="rg-right">
        <div className="rg-card">
          <div className="rg-mobile-brand">CARSTRIMS</div>
          <div className="rg-steps">
            <div className={`rg-step ${step>=1?"active":""}`}>1</div>
            <div className="rg-step-line"/>
            <div className={`rg-step ${step>=2?"active":""}`}>2</div>
          </div>
          <div>
            <h2 className="rg-card-title">{step===1?"Choose Account Type":"Create Your Account"}</h2>
            <p className="rg-card-sub">{step===1?"Select how you will use CARSTRIMS":"Fill in your details below"}</p>
          </div>
          {error&&<div className="rg-err">{error}</div>}
          {step===1?(
            <div className="rg-roles">
              {ROLES.map((r)=>(<button key={r.value} className={`rg-role ${role===r.value?"sel":""}`} onClick={()=>setRole(r.value)}><div className="rg-role-body"><div className="rg-role-label">{r.label}</div><div className="rg-role-desc">{r.desc}</div></div>{role===r.value&&<span className="rg-check">Selected</span>}</button>))}
              <button className="rg-btn" onClick={()=>setStep(2)} disabled={!role}>CONTINUE</button>
            </div>
          ):(
            <form onSubmit={submit} className="rg-form">
              <div className="rg-row">
                <div className="rg-field"><label className="rg-lbl">Full Name *</label><input className="rg-input" placeholder="John Doe" value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} required/></div>
                <div className="rg-field"><label className="rg-lbl">Username *</label><input className="rg-input" placeholder="johndoe" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} required/></div>
              </div>
              <div className="rg-field"><label className="rg-lbl">Email Address *</label><input type="email" className="rg-input" placeholder="you@example.com" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required/></div>
              <div className="rg-field"><label className="rg-lbl">Password *</label><input type="password" className="rg-input" placeholder="Minimum 8 characters" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required minLength={8}/></div>
              <div className="rg-row">
                <div className="rg-field"><label className="rg-lbl">Phone *</label><input className="rg-input" placeholder="+234..." value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} required/></div>
                <div className="rg-field"><label className="rg-lbl">WhatsApp</label><input className="rg-input" placeholder="+234..." value={form.whatsapp} onChange={(e)=>setForm({...form,whatsapp:e.target.value})}/></div>
              </div>
              {role==="DEALER_ADMIN"&&<div className="rg-notice"><strong>Dealer Account:</strong> After signing in you will complete your dealership setup. Your listings will be hidden until admin approval.</div>}
              <div className="rg-actions">
                <button type="button" className="rg-back" onClick={()=>setStep(1)}>Back</button>
                <button type="submit" className="rg-btn rg-flex1" disabled={loading}>{loading?"Creating account...":"CREATE ACCOUNT"}</button>
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
        .rg-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem;line-height:1.5}
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
