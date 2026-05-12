"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

export default function DealerSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ companyName:"", phone:"", whatsapp:"", address:"", city:"", state:"", country:"Nigeria", description:"" });

  useEffect(() => {
    api.get("/api/v1/dealers/me")
      .then(() => router.replace("/dashboard/dealer"))
      .catch(() => setChecking(false));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError("Company name is required"); return; }
    if (!form.phone.trim()) { setError("Phone number is required"); return; }
    if (!form.state) { setError("Please select your state"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/v1/dealers/setup", form);
      router.replace("/dashboard/dealer");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Setup failed. Please try again.");
    } finally { setLoading(false); }
  };

  const fi: React.CSSProperties = { background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.75rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", width:"100%", boxSizing:"border-box" as const };
  const lbl: React.CSSProperties = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"0.35rem" };

  if (checking) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{fontSize:"0.78rem",color:"#737373"}}>Dealership Setup</div>
      </div>
      <div style={{maxWidth:"600px",margin:"2rem auto",padding:"0 1.5rem 4rem"}}>
        {error && (
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.875rem 1rem",borderRadius:"8px",fontSize:"0.875rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between"}}>
            <span>{error}</span>
            <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
          </div>
        )}
        <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.5rem"}}>Set Up Your Dealership</h2>
          <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem",lineHeight:1.6}}>
            Complete your dealership profile. You will get instant access to your dashboard. Your listings will be hidden until admin approves your account.
          </p>
          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            <div><label style={lbl}>Company / Business Name *</label><input style={fi} placeholder="e.g. Ayo Motors Ltd" value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})} required/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div><label style={lbl}>Business Phone *</label><input style={fi} placeholder="+234..." value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></div>
              <div><label style={lbl}>WhatsApp</label><input style={fi} placeholder="+234..." value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/></div>
            </div>
            <div><label style={lbl}>Business Address</label><input style={fi} placeholder="Street address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div><label style={lbl}>City</label><input style={fi} placeholder="e.g. Lagos" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
              <div><label style={lbl}>State *</label>
                <select style={{...fi,cursor:"pointer"}} value={form.state} onChange={e=>setForm({...form,state:e.target.value})} required>
                  <option value="">Select state...</option>
                  {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label style={lbl}>Business Description</label>
              <textarea style={{...fi,minHeight:"80px",resize:"vertical" as const}} placeholder="Tell buyers about your dealership..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
            </div>
            <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.82rem",color:"#C4621A",lineHeight:1.6}}>
              After submitting you will be taken to your dashboard immediately. Your listings will be hidden from buyers until a CARSTRIMS admin approves your account (usually 1-2 business days).
            </div>
            <button type="submit" disabled={loading}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.12em",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1}}>
              {loading?"Submitting...":"SUBMIT & ENTER DASHBOARD"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
