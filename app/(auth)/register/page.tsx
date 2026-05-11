"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

const ROLES = [
  { value:"DEALER_ADMIN", label:"Dealer / Car Stand", desc:"Manage inventory and sales" },
  { value:"PARTNER_USER", label:"Partner / Asset Owner", desc:"Monitor cars across dealers" },
  { value:"PUBLIC_USER", label:"Car Buyer", desc:"Browse, save and request cars" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ fullName:"", username:"", email:"", password:"", phone:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/register", { ...form, role });
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",
    padding:"0.875rem 1rem",color:"#171717",fontSize:"0.9rem",outline:"none",width:"100%",
    fontFamily:"var(--font-body)"
  };
  const labelStyle: React.CSSProperties = { fontSize:"0.7rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252" };

  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      <div style={{width:"42%",background:"linear-gradient(160deg,#E5E5E5,#D4D4D4,#C8C8C8)",padding:"3rem",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"2.5rem",lineHeight:1.05,color:"#171717",marginBottom:"1rem"}}>JOIN NIGERIA&apos;S PREMIER CAR PLATFORM</h1>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginTop:"1.5rem"}}>
            {["Free to join","Verified dealers","Real-time inventory","Secure messaging"].map((f)=>(
              <div key={f} style={{display:"flex",alignItems:"center",gap:"0.625rem",fontSize:"0.875rem",color:"#404040"}}>
                <span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#F47B20",flexShrink:0,display:"block"}} />{f}
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:"0.7rem",color:"#A3A3A3"}}>Built by UASE TECH STUDIO</div>
      </div>
      <div style={{flex:1,background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:"480px",background:"#fff",borderRadius:"16px",padding:"2.5rem",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"}}>
              {[1,2].map((s)=>(
                <div key={s} style={{width:"28px",height:"28px",borderRadius:"50%",background:step>=s?"#F47B20":"#E5E5E5",color:step>=s?"#fff":"#737373",fontSize:"0.8rem",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{s}</div>
              ))}
            </div>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",color:"#171717"}}>{step===1?"Choose Account Type":"Create Account"}</h2>
          </div>

          {error && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}

          {step===1 ? (
            <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
              {ROLES.map((r)=>(
                <button key={r.value} onClick={()=>setRole(r.value)}
                  style={{display:"flex",alignItems:"flex-start",gap:"1rem",padding:"1rem 1.25rem",background:role===r.value?"#FFF7ED":"#F5F5F5",border:role===r.value?"1.5px solid #F47B20":"1.5px solid #E5E5E5",borderRadius:"10px",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"var(--font-body)"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.9rem",fontWeight:600,color:"#171717"}}>{r.label}</div>
                    <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.2rem"}}>{r.desc}</div>
                  </div>
                  {role===r.value && <span style={{color:"#F47B20",fontWeight:700}}>✓</span>}
                </button>
              ))}
              <button onClick={()=>setStep(2)} disabled={!role}
                style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:role?"pointer":"not-allowed",opacity:role?1:0.5,marginTop:"0.5rem"}}>
                CONTINUE
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle} placeholder="John Doe" value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} required />
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                  <label style={labelStyle}>Username *</label>
                  <input style={inputStyle} placeholder="johndoe" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} required />
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={labelStyle}>Password *</label>
                <input type="password" style={inputStyle} placeholder="Min 6 characters" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={labelStyle}>Phone *</label>
                <input style={inputStyle} placeholder="+234..." value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} required />
              </div>
              {role==="DEALER_ADMIN"&&<div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",color:"#C4621A",padding:"0.75rem",borderRadius:"8px",fontSize:"0.8rem",lineHeight:1.5}}>Dealer accounts require admin approval before access is granted.</div>}
              <div style={{display:"flex",gap:"0.75rem",marginTop:"0.25rem"}}>
                <button type="button" onClick={()=>setStep(1)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Back</button>
                <button type="submit" disabled={loading} style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.1em",cursor:"pointer",opacity:loading?0.6:1}}>
                  {loading?"Creating...":"CREATE ACCOUNT"}
                </button>
              </div>
            </form>
          )}

          <p style={{fontSize:"0.875rem",color:"#737373",textAlign:"center"}}>
            Already have an account? <Link href="/auth/login" style={{color:"#F47B20",textDecoration:"none",fontWeight:600}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}