"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

const ROLES = [
  { value:"DEALER_ADMIN", label:"Dealer / Car Stand", icon:"D", desc:"Manage inventory, staff and sales" },
  { value:"PARTNER_USER", label:"Partner / Asset Owner", icon:"P", desc:"Monitor your cars across dealers" },
  { value:"PUBLIC_USER", label:"Car Buyer", icon:"B", desc:"Browse, save and request cars" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ fullName:"", username:"", email:"", password:"", phone:"", whatsapp:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/api/v1/auth/register", { ...form, role });
      router.push(role === "DEALER_ADMIN" ? "/login?msg=pending" : "/login?msg=created");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px",
    padding:"0.8rem 1rem", color:"#1A1A1A", fontSize:"0.9rem",
    fontFamily:"var(--font-body)", outline:"none", width:"100%",
  };

  return (
    <div style={{display:"flex", minHeight:"100vh", fontFamily:"var(--font-body)", background:"#F5F5F5"}}>
      {/* LEFT PANEL */}
      <div style={{
        width:"42%", background:"linear-gradient(160deg,#E5E5E5 0%,#D4D4D4 55%,#C8C8C8 100%)",
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        padding:"2.5rem", position:"relative", overflow:"hidden",
      }}>
        <div style={{fontFamily:"var(--font-display)", fontSize:"1.4rem", letterSpacing:"0.2em", color:"#F47B20"}}>
          CARSTRIMS
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:"1.25rem"}}>
          <h1 style={{fontFamily:"var(--font-display)", fontSize:"2.5rem", lineHeight:"1.05", color:"#1A1A1A"}}>
            JOIN THE PLATFORM TODAY
          </h1>
          <p style={{fontSize:"0.9rem", color:"#525252", lineHeight:"1.7", maxWidth:"340px"}}>
            Whether you are a dealer, partner or buyer, CARSTRIMS gives you the tools to succeed.
          </p>
          <div style={{display:"flex", flexDirection:"column", gap:"0.5rem", marginTop:"0.5rem"}}>
            {["Free to join", "Verified dealers", "Real-time inventory", "Secure messaging"].map((f) => (
              <div key={f} style={{display:"flex", alignItems:"center", gap:"0.625rem", fontSize:"0.875rem", color:"#404040"}}>
                <span style={{width:"8px", height:"8px", borderRadius:"50%", background:"#F47B20", flexShrink:0, display:"block"}} />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:"0.7rem", color:"#A3A3A3"}}>
          Built by <span style={{color:"#F47B20"}}>UASE TECH STUDIO</span> &middot; CARSTRIMS 2026
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{flex:1, background:"#F5F5F5", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", overflowY:"auto"}}>
        <div style={{
          width:"100%", maxWidth:"480px", background:"#fff", borderRadius:"16px",
          padding:"2.5rem", boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
          display:"flex", flexDirection:"column", gap:"1.25rem",
        }}>
          {/* Step indicators */}
          <div style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
            {[1, 2].map((s) => (
              <div key={s} style={{
                width:"28px", height:"28px", borderRadius:"50%",
                background:step >= s ? "#F47B20" : "#E5E5E5",
                color:step >= s ? "#fff" : "#737373",
                fontSize:"0.8rem", fontWeight:"bold",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{s}</div>
            ))}
            <div style={{flex:1, height:"2px", background:"#E5E5E5", maxWidth:"50px"}} />
          </div>

          <div>
            <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.75rem", color:"#1A1A1A"}}>
              {step === 1 ? "Choose Account Type" : "Create Your Account"}
            </h2>
            <p style={{fontSize:"0.875rem", color:"#737373", marginTop:"0.25rem"}}>
              {step === 1 ? "Select how you will use CARSTRIMS" : "Fill in your details below"}
            </p>
          </div>

          {error && (
            <div style={{background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#DC2626", padding:"0.75rem 1rem", borderRadius:"8px", fontSize:"0.875rem"}}>
              {error}
            </div>
          )}

          {step === 1 ? (
            <div style={{display:"flex", flexDirection:"column", gap:"0.75rem"}}>
              {ROLES.map((r) => (
                <button key={r.value}
                  onClick={() => setRole(r.value)}
                  style={{
                    display:"flex", alignItems:"center", gap:"1rem",
                    padding:"1rem 1.25rem", textAlign:"left", width:"100%",
                    background:role === r.value ? "#FFF7ED" : "#F5F5F5",
                    border:role === r.value ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
                    borderRadius:"10px", cursor:"pointer", fontFamily:"var(--font-body)",
                    boxShadow:role === r.value ? "0 0 0 3px rgba(244,123,32,0.12)" : "none",
                  }}>
                  <div style={{
                    width:"36px", height:"36px", borderRadius:"8px",
                    background:role === r.value ? "#F47B20" : "#E5E5E5",
                    color:role === r.value ? "#fff" : "#737373",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"var(--font-display)", fontSize:"1rem", flexShrink:0,
                  }}>{r.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.9rem", fontWeight:600, color:"#1A1A1A"}}>{r.label}</div>
                    <div style={{fontSize:"0.75rem", color:"#737373", marginTop:"0.2rem"}}>{r.desc}</div>
                  </div>
                  {role === r.value && (
                    <div style={{color:"#F47B20", fontWeight:"bold", fontSize:"1.1rem"}}>OK</div>
                  )}
                </button>
              ))}
              <button
                onClick={() => setStep(2)}
                disabled={!role}
                style={{
                  background:role ? "#F47B20" : "#D4D4D4", color:role ? "#fff" : "#A3A3A3",
                  border:"none", borderRadius:"8px", padding:"0.875rem",
                  fontFamily:"var(--font-display)", fontSize:"0.95rem", letterSpacing:"0.12em",
                  cursor:role ? "pointer" : "not-allowed", marginTop:"0.5rem",
                }}>
                CONTINUE
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
                  <label style={{fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#525252"}}>Full Name *</label>
                  <input style={inputStyle} placeholder="John Doe" value={form.fullName}
                    onChange={(e) => setForm({...form, fullName:e.target.value})} required />
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
                  <label style={{fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#525252"}}>Username *</label>
                  <input style={inputStyle} placeholder="johndoe" value={form.username}
                    onChange={(e) => setForm({...form, username:e.target.value})} required />
                </div>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
                <label style={{fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#525252"}}>Email Address *</label>
                <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({...form, email:e.target.value})} required />
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
                <label style={{fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#525252"}}>Password *</label>
                <input type="password" style={inputStyle} placeholder="Minimum 8 characters" value={form.password}
                  onChange={(e) => setForm({...form, password:e.target.value})} required minLength={8} />
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
                  <label style={{fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#525252"}}>Phone *</label>
                  <input style={inputStyle} placeholder="+234..." value={form.phone}
                    onChange={(e) => setForm({...form, phone:e.target.value})} required />
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
                  <label style={{fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#525252"}}>WhatsApp</label>
                  <input style={inputStyle} placeholder="+234..." value={form.whatsapp}
                    onChange={(e) => setForm({...form, whatsapp:e.target.value})} />
                </div>
              </div>
              {role === "DEALER_ADMIN" && (
                <div style={{background:"#FFF7ED", border:"1px solid rgba(244,123,32,0.3)", color:"#C4621A", padding:"0.75rem 1rem", borderRadius:"8px", fontSize:"0.8rem", lineHeight:"1.5"}}>
                  Dealer accounts require admin approval before full access is granted.
                </div>
              )}
              <div style={{display:"flex", gap:"0.75rem", marginTop:"0.25rem"}}>
                <button type="button" onClick={() => setStep(1)}
                  style={{background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#525252", borderRadius:"8px", padding:"0.875rem 1.25rem", fontFamily:"var(--font-body)", fontSize:"0.875rem", cursor:"pointer"}}>
                  Back
                </button>
                <button type="submit" disabled={loading}
                  style={{flex:1, background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"0.875rem", fontFamily:"var(--font-display)", fontSize:"0.9rem", letterSpacing:"0.1em", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.6 : 1}}>
                  {loading ? "Creating account..." : "CREATE ACCOUNT"}
                </button>
              </div>
            </form>
          )}

          <p style={{fontSize:"0.875rem", color:"#737373", textAlign:"center"}}>
            Already have an account?{" "}
            <Link href="/login" style={{color:"#F47B20", fontWeight:600, textDecoration:"none"}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
