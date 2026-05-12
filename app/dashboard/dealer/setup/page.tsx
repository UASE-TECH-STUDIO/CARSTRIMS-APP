"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

export default function DealerSetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<1|2|3|"done">(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ companyName:"", phone:"", whatsapp:"", address:"", city:"", state:"", country:"Nigeria", description:"", website:"", instagram:"" });

  useEffect(() => {
    api.get("/api/v1/dealers/me")
      .then((r) => {
        const s = r.data?.status;
        if (s === "approved" || s === "active") { router.replace("/dashboard/dealer"); }
        else { setStep("done"); } // already submitted, show pending screen
      })
      .catch(() => { setStep(1); }) // no profile yet, start setup
      .finally(() => setChecking(false));
  }, [router]);

  const submitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError("Company name is required"); return; }
    if (!form.state) { setError("Please select your state"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/v1/dealers/setup", form);
      setStep("done");
    } catch (err: any) {
      setError(err.userMessage || err.response?.data?.detail || "Setup failed. Please try again.");
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

  if (step === "done") return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"var(--font-body)"}}>
      <div style={{maxWidth:"520px",width:"100%",background:"#fff",borderRadius:"16px",padding:"2.5rem",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",textAlign:"center"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.3rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:"#FFF7ED",border:"2px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem"}}>&#10003;</div>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",letterSpacing:"0.04em",color:"#1A1A1A"}}>Setup Complete!</h2>
          <p style={{fontSize:"0.875rem",color:"#737373",marginTop:"0.5rem",lineHeight:"1.7"}}>Your dealership profile has been submitted for review. You can now access your dashboard while your account is being reviewed.</p>
        </div>
        <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"12px",padding:"1.25rem",width:"100%",textAlign:"left"}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#F47B20",marginBottom:"0.75rem"}}>While pending approval:</div>
          {["You can access your full dealer dashboard","Add cars to your inventory","Create staff accounts","View and respond to buyer messages"].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:"0.75rem",marginBottom:"0.5rem",fontSize:"0.825rem",color:"#525252",alignItems:"flex-start"}}>
              <span style={{color:"#16A34A",fontWeight:700,flexShrink:0}}>&#10003;</span><span>{t}</span>
            </div>
          ))}
          <div style={{borderTop:"1px solid rgba(244,123,32,0.2)",paddingTop:"0.75rem",marginTop:"0.25rem"}}>
            <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#DC2626",marginBottom:"0.5rem"}}>Until approved:</div>
            {["Your car listings are hidden from the public feed","You cannot message other users (buyers can message you)"].map((t,i)=>(
              <div key={i} style={{display:"flex",gap:"0.75rem",marginBottom:"0.4rem",fontSize:"0.825rem",color:"#737373",alignItems:"flex-start"}}>
                <span style={{color:"#DC2626",flexShrink:0}}>&#8722;</span><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>router.push("/dashboard/dealer")}
          style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem 2.5rem",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.12em",cursor:"pointer",width:"100%"}}>
          GO TO MY DASHBOARD
        </button>
      </div>
    </div>
  );

  // Steps 1-3
  const STEPS = ["Company Info","Location & Details","Optional: Socials"];
  const stepIdx = (step as number) - 1;

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{fontSize:"0.78rem",color:"#737373"}}>Dealership Setup — Step {step} of 3</div>
      </div>
      <div style={{background:"#fff",borderBottom:"1px solid #E5E5E5",padding:"0.875rem 1.5rem"}}>
        <div style={{maxWidth:"640px",margin:"0 auto",display:"flex",alignItems:"center",gap:"0"}}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{display:"flex",alignItems:"center",flex:i<2?1:"auto"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexShrink:0}}>
                <div style={{width:"28px",height:"28px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.78rem",fontWeight:700,background:i<stepIdx?"#16A34A":i===stepIdx?"#F47B20":"#E5E5E5",color:i<=stepIdx?"#fff":"#737373"}}>
                  {i<stepIdx?"✓":i+1}
                </div>
                <span style={{fontSize:"0.72rem",color:i===stepIdx?"#F47B20":"#A3A3A3",fontWeight:i===stepIdx?600:400,whiteSpace:"nowrap"}}>{s}</span>
              </div>
              {i<2&&<div style={{flex:1,height:"2px",background:i<stepIdx?"#16A34A":"#E5E5E5",margin:"0 0.5rem"}}/>}
            </div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:"640px",margin:"2rem auto",padding:"0 1.5rem 3rem"}}>
        {error&&<div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.875rem 1rem",borderRadius:"8px",fontSize:"0.875rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between"}}><span>{error}</span><button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>X</button></div>}

        <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          {step===1&&(
            <>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"1.5rem"}}>Company Information</h2>
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div><label style={lbl}>Company / Business Name *</label><input style={fi} placeholder="e.g. Ayo Motors Ltd" value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})} /></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  <div><label style={lbl}>Business Phone *</label><input style={fi} placeholder="+234..." value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
                  <div><label style={lbl}>WhatsApp</label><input style={fi} placeholder="+234..." value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} /></div>
                </div>
                <div><label style={lbl}>Business Description</label><textarea style={{...fi,minHeight:"80px",resize:"vertical" as const}} placeholder="Tell customers about your dealership..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
                <button onClick={()=>{if(!form.companyName.trim()||!form.phone.trim()){setError("Company name and phone are required");return;}setError("");setStep(2);}}
                  style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:"pointer",marginTop:"0.5rem"}}>
                  CONTINUE
                </button>
              </div>
            </>
          )}

          {step===2&&(
            <>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"1.5rem"}}>Location Details</h2>
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div><label style={lbl}>Business Address *</label><input style={fi} placeholder="Street address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  <div><label style={lbl}>City *</label><input style={fi} placeholder="e.g. Lagos" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /></div>
                  <div><label style={lbl}>State *</label>
                    <select style={{...fi,cursor:"pointer"}} value={form.state} onChange={e=>setForm({...form,state:e.target.value})}>
                      <option value="">Select state...</option>
                      {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:"0.75rem"}}>
                  <button onClick={()=>setStep(1)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Back</button>
                  <button onClick={()=>{if(!form.address.trim()||!form.city.trim()||!form.state){setError("Address, city and state are required");return;}setError("");setStep(3);}}
                    style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:"pointer"}}>
                    CONTINUE
                  </button>
                </div>
              </div>
            </>
          )}

          {step===3&&(
            <>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.5rem"}}>Online Presence</h2>
              <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem",lineHeight:1.6}}>Optional — helps buyers find and trust your dealership.</p>
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div><label style={lbl}>Website (optional)</label><input style={fi} placeholder="https://..." value={form.website} onChange={e=>setForm({...form,website:e.target.value})} /></div>
                <div><label style={lbl}>Instagram (optional)</label><input style={fi} placeholder="@handle or URL" value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} /></div>
                <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.875rem",fontSize:"0.82rem",color:"#C4621A",lineHeight:1.6}}>
                  After submitting, a CARSTRIMS admin will review your application. You can access your dashboard immediately but your listings will be hidden until approved.
                </div>
                <div style={{display:"flex",gap:"0.75rem"}}>
                  <button onClick={()=>setStep(2)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Back</button>
                  <button onClick={submitSetup} disabled={loading}
                    style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1}}>
                    {loading?"Submitting...":"SUBMIT FOR APPROVAL"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
