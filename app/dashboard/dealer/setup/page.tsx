"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function DealerSetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<"form"|"pending">("form");
  const [dealerStatus, setDealerStatus] = useState<string|null>(null);
  const [form, setForm] = useState({
    companyName:"", phone:"", whatsapp:"", address:"",
    city:"", state:"", country:"Nigeria", description:"",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Check if dealer profile already exists
  useEffect(() => {
    api.get("/api/v1/dealers/me")
      .then((r) => {
        setDealerStatus(r.data.status);
        if (r.data.status === "approved" || r.data.status === "active") {
          router.replace("/dashboard/dealer");
        } else {
          setStep("pending");
        }
      })
      .catch(() => {
        // No profile yet - show setup form
        setStep("form");
      })
      .finally(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError("Company name is required"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/v1/dealers/setup", form);
      setStep("pending");
    } catch (err: any) {
      setError((err as any).userMessage || err.response?.data?.detail || "Setup failed. Please try again.");
    } finally { setLoading(false); }
  };

  const fi: React.CSSProperties = {
    background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px",
    padding:"0.875rem 1rem", color:"#1A1A1A", fontSize:"0.9rem",
    fontFamily:"var(--font-body)", outline:"none", width:"100%",
  };
  const lbl: React.CSSProperties = {
    fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em",
    textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"0.4rem",
  };

  if (checking) return (
    <div style={{minHeight:"100vh", background:"#F5F5F5", display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{width:"28px", height:"28px", border:"2.5px solid #E5E5E5", borderTopColor:"#F47B20", borderRadius:"50%", animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (step === "pending") return (
    <div style={{minHeight:"100vh", background:"#F5F5F5", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"var(--font-body)"}}>
      <div style={{maxWidth:"520px", width:"100%", background:"#fff", borderRadius:"16px", padding:"2.5rem", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", alignItems:"center", gap:"1.5rem", textAlign:"center"}}>
        <div style={{fontFamily:"var(--font-display)", fontSize:"1.3rem", letterSpacing:"0.2em", color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{width:"72px", height:"72px", borderRadius:"50%", background:"#FFF7ED", border:"2px solid #F47B20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem"}}>
          Pending
        </div>
        <div>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.75rem", letterSpacing:"0.04em", color:"#1A1A1A"}}>
            Awaiting Approval
          </h2>
          <p style={{fontSize:"0.875rem", color:"#737373", marginTop:"0.5rem", lineHeight:"1.6"}}>
            Your dealer account application has been submitted and is currently under review by the CARSTRIMS admin team.
          </p>
        </div>
        <div style={{background:"#FFF7ED", border:"1px solid rgba(244,123,32,0.3)", borderRadius:"10px", padding:"1.25rem", width:"100%", textAlign:"left"}}>
          <div style={{fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#F47B20", marginBottom:"0.75rem"}}>
            What happens next?
          </div>
          {[
            "The CARSTRIMS admin will review your application",
            "You will receive a notification once approved",
            "After approval, you get full access to your dealer dashboard",
            "You can then set up your inventory and start listing cars",
          ].map((step, i) => (
            <div key={i} style={{display:"flex", gap:"0.75rem", marginBottom:"0.5rem", fontSize:"0.825rem", color:"#525252"}}>
              <span style={{color:"#F47B20", fontWeight:700, flexShrink:0}}>{i+1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:"0.8rem", color:"#A3A3A3", lineHeight:"1.5"}}>
          Review typically takes 1-2 business days. You will be notified by email and in-app notification.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"0.875rem 2rem", fontFamily:"var(--font-display)", fontSize:"0.9rem", letterSpacing:"0.1em", cursor:"pointer"}}>
          CHECK STATUS
        </button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh", background:"#F5F5F5", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"var(--font-body)"}}>
      <div style={{maxWidth:"560px", width:"100%", background:"#fff", borderRadius:"16px", padding:"2.5rem", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", gap:"1.5rem"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"var(--font-display)", fontSize:"1.3rem", letterSpacing:"0.2em", color:"#F47B20", marginBottom:"0.75rem"}}>CARSTRIMS</div>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.75rem", color:"#1A1A1A", letterSpacing:"0.04em"}}>Set Up Your Dealership</h2>
          <p style={{fontSize:"0.875rem", color:"#737373", marginTop:"0.35rem"}}>
            Complete your dealership profile to submit for approval
          </p>
        </div>

        {error && (
          <div style={{background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#DC2626", padding:"0.75rem 1rem", borderRadius:"8px", fontSize:"0.875rem"}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
          <div>
            <label style={lbl}>Company / Business Name *</label>
            <input style={fi} placeholder="e.g. Ayo Motors Ltd" value={form.companyName}
              onChange={(e) => setForm({...form, companyName:e.target.value})} required
              onFocus={(e) => { e.target.style.borderColor="#F47B20"; e.target.style.background="#fff"; }}
              onBlur={(e) => { e.target.style.borderColor="#E5E5E5"; e.target.style.background="#F5F5F5"; }}
            />
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
            <div>
              <label style={lbl}>Phone</label>
              <input style={fi} placeholder="+234..." value={form.phone}
                onChange={(e) => setForm({...form, phone:e.target.value})}
                onFocus={(e) => { e.target.style.borderColor="#F47B20"; e.target.style.background="#fff"; }}
                onBlur={(e) => { e.target.style.borderColor="#E5E5E5"; e.target.style.background="#F5F5F5"; }}
              />
            </div>
            <div>
              <label style={lbl}>WhatsApp</label>
              <input style={fi} placeholder="+234..." value={form.whatsapp}
                onChange={(e) => setForm({...form, whatsapp:e.target.value})}
                onFocus={(e) => { e.target.style.borderColor="#F47B20"; e.target.style.background="#fff"; }}
                onBlur={(e) => { e.target.style.borderColor="#E5E5E5"; e.target.style.background="#F5F5F5"; }}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Business Address</label>
            <input style={fi} placeholder="Street address" value={form.address}
              onChange={(e) => setForm({...form, address:e.target.value})}
              onFocus={(e) => { e.target.style.borderColor="#F47B20"; e.target.style.background="#fff"; }}
              onBlur={(e) => { e.target.style.borderColor="#E5E5E5"; e.target.style.background="#F5F5F5"; }}
            />
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
            <div>
              <label style={lbl}>City</label>
              <input style={fi} placeholder="e.g. Abuja" value={form.city}
                onChange={(e) => setForm({...form, city:e.target.value})}
                onFocus={(e) => { e.target.style.borderColor="#F47B20"; e.target.style.background="#fff"; }}
                onBlur={(e) => { e.target.style.borderColor="#E5E5E5"; e.target.style.background="#F5F5F5"; }}
              />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input style={fi} placeholder="e.g. FCT" value={form.state}
                onChange={(e) => setForm({...form, state:e.target.value})}
                onFocus={(e) => { e.target.style.borderColor="#F47B20"; e.target.style.background="#fff"; }}
                onBlur={(e) => { e.target.style.borderColor="#E5E5E5"; e.target.style.background="#F5F5F5"; }}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Business Description</label>
            <textarea
              style={{...fi, minHeight:"80px", resize:"vertical" as const}}
              placeholder="Tell customers about your dealership..."
              value={form.description}
              onChange={(e) => setForm({...form, description:e.target.value})}
              onFocus={(e) => { e.target.style.borderColor="#F47B20"; e.target.style.background="#fff"; }}
              onBlur={(e) => { e.target.style.borderColor="#E5E5E5"; e.target.style.background="#F5F5F5"; }}
            />
          </div>

          <div style={{background:"#FFF7ED", border:"1px solid rgba(244,123,32,0.3)", borderRadius:"8px", padding:"0.875rem 1rem", fontSize:"0.8rem", color:"#C4621A", lineHeight:"1.5"}}>
            After submission, your account will be reviewed by CARSTRIMS admin. You will not have full dashboard access until approved.
          </div>

          <button type="submit" disabled={loading}
            style={{background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"1rem", fontFamily:"var(--font-display)", fontSize:"1rem", letterSpacing:"0.12em", cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1}}>
            {loading ? "Submitting..." : "SUBMIT FOR APPROVAL"}
          </button>
        </form>
      </div>
    </div>
  );
}