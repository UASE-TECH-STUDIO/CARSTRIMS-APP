"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

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
      setOptions(res.data.options || []);
      setStep("options");
    } catch {
      setOptions([{ type:"admin_message", label:"Contact Support", masked:"Send a request to CARSTRIMS admin for manual verification" }]);
      setStep("options");
    } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true); setError("");
    try {
      await api.post("/api/v1/auth/forgot-password/send", { email, method: selected.type });
      setSentMsg(
        selected.type === "whatsapp"
          ? "A recovery code was sent to your registered WhatsApp number."
          : selected.type === "email"
          ? "A recovery link was sent to your registered email address."
          : "Your request has been sent to the CARSTRIMS admin. You will be contacted via your registered contact."
      );
      setStep("sent");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send. Please try again.");
    } finally { setSending(false); }
  };

  const METHOD_ICONS: Record<string,string> = {
    whatsapp: "WhatsApp",
    email: "Email",
    admin_message: "Admin Support",
  };

  const inputStyle: React.CSSProperties = {
    background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px",
    padding:"0.875rem 1rem", color:"#1A1A1A", fontSize:"0.95rem",
    fontFamily:"var(--font-body)", outline:"none", width:"100%",
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg, #E5E5E5 0%, #F5F5F5 60%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"2rem", fontFamily:"var(--font-body)",
    }}>
      <div style={{
        width:"100%", maxWidth:"440px", background:"#fff",
        borderRadius:"16px", padding:"2.5rem",
        boxShadow:"0 8px 32px rgba(0,0,0,0.1)",
        display:"flex", flexDirection:"column", gap:"1.25rem",
      }}>
        <div style={{fontFamily:"var(--font-display)", fontSize:"1.2rem", letterSpacing:"0.2em", color:"#F47B20"}}>
          CARSTRIMS
        </div>
        <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.75rem", color:"#1A1A1A", marginTop:"-0.5rem"}}>
          Account Recovery
        </h2>

        {step === "email" && (
          <>
            <p style={{fontSize:"0.875rem", color:"#737373", lineHeight:"1.6"}}>
              Enter the email address linked to your account. We will show you secure ways to recover access.
            </p>
            {error && <div style={{background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#DC2626", padding:"0.75rem 1rem", borderRadius:"8px", fontSize:"0.875rem"}}>{error}</div>}
            <form onSubmit={handleEmail} style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
              <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
                <label style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#525252"}}>Email Address</label>
                <input type="email" style={inputStyle} placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} style={{
                background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px",
                padding:"1rem", fontFamily:"var(--font-display)", fontSize:"0.95rem",
                letterSpacing:"0.12em", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.6 : 1,
              }}>
                {loading ? "Looking up account..." : "FIND MY ACCOUNT"}
              </button>
            </form>
          </>
        )}

        {step === "options" && (
          <>
            <p style={{fontSize:"0.875rem", color:"#737373", lineHeight:"1.6"}}>
              Choose how you want to recover access. Only methods linked to your registered account are shown.
            </p>
            {error && <div style={{background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#DC2626", padding:"0.75rem 1rem", borderRadius:"8px", fontSize:"0.875rem"}}>{error}</div>}
            <div style={{display:"flex", flexDirection:"column", gap:"0.75rem"}}>
              {options.map((opt) => (
                <button key={opt.type} onClick={() => setSelected(opt)}
                  style={{
                    display:"flex", alignItems:"flex-start", gap:"1rem", padding:"1rem 1.25rem",
                    background:selected?.type === opt.type ? "#FFF7ED" : "#F5F5F5",
                    border:selected?.type === opt.type ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
                    borderRadius:"10px", cursor:"pointer", textAlign:"left",
                    fontFamily:"var(--font-body)", width:"100%",
                    boxShadow:selected?.type === opt.type ? "0 0 0 3px rgba(244,123,32,0.12)" : "none",
                  }}>
                  <div style={{
                    background:selected?.type === opt.type ? "#F47B20" : "#E5E5E5",
                    color:selected?.type === opt.type ? "#fff" : "#737373",
                    borderRadius:"6px", padding:"0.25rem 0.5rem",
                    fontSize:"0.72rem", fontWeight:600, flexShrink:0,
                  }}>
                    {METHOD_ICONS[opt.type] || opt.type}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.9rem", fontWeight:600, color:"#1A1A1A"}}>{opt.label}</div>
                    <div style={{fontSize:"0.75rem", color:"#737373", marginTop:"0.2rem"}}>{opt.masked}</div>
                  </div>
                  {selected?.type === opt.type && (
                    <div style={{color:"#F47B20", fontWeight:"bold"}}>OK</div>
                  )}
                </button>
              ))}
            </div>
            <div style={{background:"#F5F5F5", border:"1px solid #E5E5E5", borderRadius:"8px", padding:"0.875rem 1rem", fontSize:"0.78rem", color:"#525252", lineHeight:"1.5"}}>
              Security note: Recovery can only be sent to contacts registered on your account.
            </div>
            <button onClick={handleSend} disabled={!selected || sending}
              style={{
                background:selected && !sending ? "#F47B20" : "#D4D4D4",
                color:selected && !sending ? "#fff" : "#A3A3A3",
                border:"none", borderRadius:"8px", padding:"1rem",
                fontFamily:"var(--font-display)", fontSize:"0.95rem",
                letterSpacing:"0.12em", cursor:selected && !sending ? "pointer" : "not-allowed",
              }}>
              {sending ? "Sending..." : "SEND RECOVERY"}
            </button>
            <button onClick={() => setStep("email")}
              style={{background:"none", border:"none", color:"#A3A3A3", fontSize:"0.78rem", cursor:"pointer", fontFamily:"var(--font-body)"}}>
              Use a different email
            </button>
          </>
        )}

        {step === "sent" && (
          <>
            <div style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:"1rem",
              padding:"1.5rem", background:"#FFF7ED",
              border:"1px solid rgba(244,123,32,0.3)", borderRadius:"12px", textAlign:"center",
            }}>
              <div style={{fontSize:"2.5rem"}}>Done</div>
              <div style={{fontSize:"0.9rem", color:"#525252", lineHeight:"1.6"}}>{sentMsg}</div>
            </div>
            <Link href="/login" style={{
              background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px",
              padding:"1rem", fontFamily:"var(--font-display)", fontSize:"0.95rem",
              letterSpacing:"0.12em", textAlign:"center", display:"block", textDecoration:"none",
            }}>
              BACK TO LOGIN
            </Link>
          </>
        )}

        <Link href="/login" style={{fontSize:"0.78rem", color:"#A3A3A3", textAlign:"center", display:"block", textDecoration:"none"}}>
          Back to login
        </Link>
      </div>
    </div>
  );
}
