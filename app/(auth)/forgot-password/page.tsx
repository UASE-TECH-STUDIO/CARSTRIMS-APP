"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

const genPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = "";
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random()*chars.length)];
  return pw;
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email"|"options"|"sent">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");
  const [error, setError] = useState("");

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await api.post("/api/v1/auth/forgot-password/options", { email });
      setOptions(res.data.options || []); setStep("options");
    } catch (err: any) {
      if (err.response?.status===404) { setError("No account found with this email address. Please check and try again."); }
      else {
        setOptions([
          { type:"email", label:"Send to Email", masked:"Send a new password to your registered email address" },
          { type:"whatsapp", label:"Send via WhatsApp", masked:"Send a new password to your registered WhatsApp number" },
          { type:"admin_message", label:"Contact Support", masked:"Send a request to CARSTRIMS admin for manual verification" },
        ]);
        setStep("options");
      }
    } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true); setError("");
    const newPassword = genPassword();
    try {
      await api.post("/api/v1/auth/forgot-password/send", { email, method:selected.type, newPassword });
      if (selected.type==="whatsapp") setSentMsg("A new password has been sent to your registered WhatsApp number. Log in and change it from Settings.");
      else if (selected.type==="email") setSentMsg("A new password has been sent to your registered email address. Log in and change it from Settings.");
      else setSentMsg("Your request has been sent to the CARSTRIMS admin. You will be contacted for identity verification.");
      setStep("sent");
    } catch (err: any) {
      const detail = (err.response?.data?.detail||"").toLowerCase();
      if (selected.type==="email") {
        if (detail.includes("email")&&(detail.includes("invalid")||detail.includes("not found"))) setError("The email address on your account appears invalid or unreachable. Try WhatsApp or contact support.");
        else setError("Could not send to email. Please try WhatsApp or contact support.");
      } else if (selected.type==="whatsapp") {
        if (detail.includes("phone")||detail.includes("whatsapp")||detail.includes("number")) setError("The WhatsApp/phone number on your account is missing or incorrect. Try email or contact support.");
        else setError("Could not send via WhatsApp. Please try email or contact support.");
      } else {
        setSentMsg("Your request has been sent to the CARSTRIMS admin. You will be contacted for identity verification.");
        setStep("sent");
      }
    } finally { setSending(false); }
  };

  const ICONS: Record<string,string> = { whatsapp:"WhatsApp", email:"Email", admin_message:"Admin Support" };
  const inp: React.CSSProperties = { background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem 1rem",color:"#1A1A1A",fontSize:"0.95rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",transition:"border-color 0.2s" };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#E5E5E5 0%,#F5F5F5 60%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)"}}>
      <div style={{width:"100%",maxWidth:"440px",background:"#fff",borderRadius:"16px",padding:"2.5rem",boxShadow:"0 8px 32px rgba(0,0,0,0.1)",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",color:"#1A1A1A",marginTop:"-0.5rem"}}>Account Recovery</h2>

        {step==="email"&&(
          <>
            <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:"1.6"}}>Enter the email linked to your account. We will send you a new password via your registered contact.</p>
            {error&&<div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}
            <form onSubmit={handleEmail} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#525252"}}>Email Address</label>
                <input type="email" style={inp} placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required
                  onFocus={(ev)=>{ev.target.style.borderColor="#F47B20";ev.target.style.background="#fff";}}
                  onBlur={(ev)=>{ev.target.style.borderColor="#E5E5E5";ev.target.style.background="#F5F5F5";}} />
              </div>
              <button type="submit" disabled={loading} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.12em",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1}}>
                {loading?"Looking up account...":"FIND MY ACCOUNT"}
              </button>
            </form>
          </>
        )}

        {step==="options"&&(
          <>
            <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:"1.6"}}>Choose how to receive your new password. It will be auto-generated and sent immediately.</p>
            {error&&<div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
              {options.map((opt)=>(
                <button key={opt.type} onClick={()=>setSelected(opt)}
                  style={{display:"flex",alignItems:"flex-start",gap:"1rem",padding:"1rem 1.25rem",background:selected?.type===opt.type?"#FFF7ED":"#F5F5F5",border:selected?.type===opt.type?"1.5px solid #F47B20":"1.5px solid #E5E5E5",borderRadius:"10px",cursor:"pointer",textAlign:"left",fontFamily:"var(--font-body)",width:"100%",transition:"all 0.2s"}}>
                  <div style={{background:selected?.type===opt.type?"#F47B20":"#E5E5E5",color:selected?.type===opt.type?"#fff":"#737373",borderRadius:"6px",padding:"0.25rem 0.5rem",fontSize:"0.75rem",fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>
                    {ICONS[opt.type]||opt.type}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.9rem",fontWeight:600,color:"#1A1A1A"}}>{opt.label}</div>
                    <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.2rem"}}>{opt.masked}</div>
                  </div>
                  {selected?.type===opt.type&&<div style={{color:"#F47B20",fontWeight:"bold",fontSize:"1.1rem"}}>OK</div>}
                </button>
              ))}
            </div>
            <div style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.78rem",color:"#525252",lineHeight:"1.5"}}>
              A new secure password will be generated and sent to your registered contact.
            </div>
            <button onClick={handleSend} disabled={!selected||sending}
              style={{background:selected&&!sending?"#F47B20":"#D4D4D4",color:selected&&!sending?"#fff":"#A3A3A3",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.12em",cursor:selected&&!sending?"pointer":"not-allowed",transition:"all 0.2s"}}>
              {sending?"Sending...":"SEND NEW PASSWORD"}
            </button>
            <button onClick={()=>{setStep("email");setError("");setSelected(null);}} style={{background:"none",border:"none",color:"#A3A3A3",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>
              Use a different email
            </button>
          </>
        )}

        {step==="sent"&&(
          <>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"1.5rem",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"12px",textAlign:"center"}}>
              <div style={{fontSize:"2.5rem"}}>Done</div>
              <div style={{fontSize:"0.9rem",color:"#525252",lineHeight:"1.6"}}>{sentMsg}</div>
            </div>
            <p style={{fontSize:"0.78rem",color:"#A3A3A3",textAlign:"center",lineHeight:1.5}}>Log in with your new password and change it from Settings.</p>
            <Link href="/login" style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.12em",textAlign:"center",display:"block",textDecoration:"none"}}>
              GO TO LOGIN
            </Link>
          </>
        )}

        <Link href="/login" style={{fontSize:"0.78rem",color:"#A3A3A3",textAlign:"center",display:"block",textDecoration:"none"}}>Back to login</Link>
      </div>
    </div>
  );
}