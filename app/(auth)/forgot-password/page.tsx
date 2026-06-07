"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

// Coming soon types - shown dimmed and not clickable
const COMING_SOON = ["sms", "whatsapp"];

const ICONS: Record<string,string> = {
  sms:" SMS",
  whatsapp:" WhatsApp",
  email:" Email",
  admin_message:" Admin Support"
};

export default function ForgotPasswordPage() {
  const [step, setStep]       = useState<"email"|"options"|"sent">("email");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");
  const [error, setError]     = useState("");

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await api.post("/api/v1/auth/forgot-password/options", { email });
      const opts = res.data.options || [];
      const types = opts.map((o:any) => o.type);

      const extra: any[] = [];
      if (!types.includes("sms"))           extra.push({ type:"sms",           label:"Send via SMS",           masked:"Coming soon  SMS password recovery" });
      if (!types.includes("whatsapp"))      extra.push({ type:"whatsapp",      label:"Send via WhatsApp",      masked:"Coming soon  WhatsApp password recovery" });
      if (!types.includes("email"))         extra.push({ type:"email",         label:"Send to Email",          masked:"Send a new password to your registered email address" });
      if (!types.includes("admin_message")) extra.push({ type:"admin_message", label:"Contact Admin Support",  masked:"Request manual identity verification from the CARSTRIMS admin team" });

      setOptions([...opts, ...extra]);
      setStep("options");
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("No account found with this email address.");
      } else {
        setOptions([
          { type:"sms",           label:"Send via SMS",          masked:"Coming soon  SMS password recovery" },
          { type:"whatsapp",      label:"Send via WhatsApp",      masked:"Coming soon  WhatsApp password recovery" },
          { type:"email",         label:"Send to Email",          masked:"Send a new password to your registered email address" },
          { type:"admin_message", label:"Contact Admin Support",  masked:"Request manual identity verification from the CARSTRIMS admin team" },
        ]);
        setStep("options");
      }
    } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!selected || COMING_SOON.includes(selected.type)) return;
    setSending(true); setError("");
    try {
      await api.post("/api/v1/auth/forgot-password/send", { email, method: selected.type });
      if (selected.type === "email") {
        setSentMsg("A new temporary password has been sent to your email address. Check your inbox (and spam folder). Log in and change it from Settings.");
      } else {
        setSentMsg("Your recovery request has been sent to the CARSTRIMS admin team. You will be contacted to verify your identity and restore access.");
      }
      setStep("sent");
    } catch (err: any) {
      const detail = (err.response?.data?.detail || "").toLowerCase();
      if (selected.type === "admin_message") {
        setSentMsg("Your recovery request has been sent to the CARSTRIMS admin team. You will be contacted shortly.");
        setStep("sent");
      } else if (detail.includes("email") && detail.includes("send")) {
        setError("Could not send to your email. Please try contacting Admin Support.");
      } else {
        setError(err.response?.data?.detail || "Failed to send. Please try another option or contact Admin Support.");
      }
    } finally { setSending(false); }
  };

  const inp: React.CSSProperties = {
    background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px",
    padding:"0.875rem 1rem", color:"#525252", fontSize:"0.95rem",
    fontFamily:"var(--font-body)", outline:"none", width:"100%",
    boxSizing:"border-box" as const, transition:"border-color 0.2s", fontWeight:500,
  };

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{width:"100%",maxWidth:"460px",background:"#fff",borderRadius:"16px",padding:"2.25rem",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",display:"flex",flexDirection:"column",gap:"1.25rem"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
          <Link href="/login" style={{fontSize:"0.8rem",color:"#A3A3A3",textDecoration:"none",fontWeight:600}}> Back to login</Link>
        </div>

        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",color:"#525252",lineHeight:1,marginBottom:"0.4rem"}}>Account Recovery</h2>
          <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:"1.6",margin:0}}>
            {step==="email"   && "Enter the email linked to your account. We will show you recovery options."}
            {step==="options" && "Choose how to receive your new temporary password."}
            {step==="sent"    && "Recovery initiated successfully."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.5rem",lineHeight:1.5}}>
            <span>{error}</span>
            <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",flexShrink:0}}></button>
          </div>
        )}

        {/* Step 1: Enter email */}
        {step==="email" && (
          <form onSubmit={handleEmail} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <label style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252"}}>Email Address</label>
              <input type="email" style={inp} placeholder="you@example.com" value={email}
                onChange={e=>setEmail(e.target.value)} required
                onFocus={ev=>{ev.target.style.borderColor="#F47B20";ev.target.style.background="#fff";}}
                onBlur={ev=>{ev.target.style.borderColor="#E5E5E5";ev.target.style.background="#F5F5F5";}}/>
            </div>
            <button type="submit" disabled={loading}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.12em",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontWeight:700}}>
              {loading?"Looking up account...":"FIND MY ACCOUNT"}
            </button>
          </form>
        )}

        {/* Step 2: Choose method */}
        {step==="options" && (
          <>
            <div style={{background:"#F5F5F5",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.82rem",color:"#525252",lineHeight:1.5}}>
              A new secure temporary password will be auto-generated and sent immediately. You can change it after logging in from Settings.
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"0.625rem"}}>
              {options.map(opt => {
                const isComingSoon = COMING_SOON.includes(opt.type);
                const isSelected   = selected?.type === opt.type;

                return (
                  <button key={opt.type}
                    onClick={() => !isComingSoon && setSelected(opt)}
                    disabled={isComingSoon}
                    style={{
                      display:"flex", alignItems:"flex-start", gap:"0.875rem",
                      padding:"1rem 1.125rem",
                      background: isComingSoon ? "#F9F9F9" : isSelected ? "#FFF7ED" : "#F5F5F5",
                      border: isComingSoon ? "1.5px solid #F0F0F0" : isSelected ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
                      borderRadius:"10px",
                      cursor: isComingSoon ? "not-allowed" : "pointer",
                      textAlign:"left",
                      fontFamily:"var(--font-body)",
                      width:"100%",
                      opacity: isComingSoon ? 0.5 : 1,
                      transition:"all 0.2s",
                      position:"relative" as const,
                    }}>

                    <div style={{
                      background: isComingSoon ? "#E5E5E5" : isSelected ? "#F47B20" : "#E5E5E5",
                      color: isComingSoon ? "#A3A3A3" : isSelected ? "#fff" : "#737373",
                      borderRadius:"6px", padding:"0.3rem 0.6rem",
                      fontSize:"0.75rem", fontWeight:700, flexShrink:0, whiteSpace:"nowrap" as const,
                    }}>
                      {ICONS[opt.type] || opt.label}
                    </div>

                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                        <span style={{fontSize:"0.9rem",fontWeight:700,color:isComingSoon?"#A3A3A3":"#525252"}}>{opt.label}</span>
                        {isComingSoon && (
                          <span style={{background:"#F0F0F0",color:"#A3A3A3",border:"1px solid #E5E5E5",borderRadius:"20px",padding:"0.1rem 0.5rem",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.06em"}}>
                            COMING SOON
                          </span>
                        )}
                      </div>
                      <div style={{fontSize:"0.75rem",color:"#A3A3A3",marginTop:"0.2rem",lineHeight:1.45}}>{opt.masked}</div>
                    </div>

                    {isSelected && !isComingSoon && (
                      <div style={{color:"#F47B20",fontWeight:"bold",fontSize:"1.1rem",flexShrink:0}}></div>
                    )}
                  </button>
                );
              })}
            </div>

            <button onClick={handleSend}
              disabled={!selected || sending || COMING_SOON.includes(selected?.type)}
              style={{
                background: selected && !sending && !COMING_SOON.includes(selected?.type) ? "#F47B20" : "#D4D4D4",
                color: selected && !sending && !COMING_SOON.includes(selected?.type) ? "#fff" : "#A3A3A3",
                border:"none", borderRadius:"10px", padding:"1rem",
                fontFamily:"var(--font-display)", fontSize:"0.95rem",
                letterSpacing:"0.12em",
                cursor: selected && !sending && !COMING_SOON.includes(selected?.type) ? "pointer" : "not-allowed",
                transition:"all 0.2s", fontWeight:700,
              }}>
              {sending ? "Sending new password..." : "SEND NEW PASSWORD"}
            </button>

            <button onClick={()=>{setStep("email");setError("");setSelected(null);}}
              style={{background:"none",border:"none",color:"#A3A3A3",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",textDecoration:"underline",fontWeight:600}}>
              Use a different email address
            </button>
          </>
        )}

        {/* Step 3: Success */}
        {step==="sent" && (
          <>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"1.5rem",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"12px",textAlign:"center"}}>
              <div style={{fontSize:"2.5rem"}}></div>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#15803D",letterSpacing:"0.06em"}}>RECOVERY INITIATED</div>
              <div style={{fontSize:"0.9rem",color:"#525252",lineHeight:"1.6"}}>{sentMsg}</div>
            </div>
            <p style={{fontSize:"0.78rem",color:"#A3A3A3",textAlign:"center",lineHeight:1.5}}>
              Log in with your new temporary password and change it immediately from your Settings page.
            </p>
            <Link href="/login" style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.12em",textAlign:"center",display:"block",textDecoration:"none",fontWeight:700}}>
              GO TO LOGIN
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
