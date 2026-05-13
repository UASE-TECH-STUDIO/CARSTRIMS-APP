"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const STEPS = [
  { num:1, label:"Company Info" },
  { num:2, label:"Documents" },
  { num:3, label:"First Car" },
  { num:4, label:"First Staff" },
  { num:5, label:"CCTV" },
];

const STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const PERMISSIONS = ["view_inventory","add_cars","edit_cars","view_sales","record_sales","view_staff","view_partners","view_cctv","view_movements","view_reports"];

// Upload via backend endpoint — NO Cloudinary preset needed
async function uploadFile(file: File, endpoint: string, fieldName = "file"): Promise<string> {
  const fd = new FormData();
  fd.append(fieldName, file);
  const res = await api.post(endpoint, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // Each endpoint returns different field names
  return res.data.logo || res.data.profilePicture || res.data.url || res.data.idCardUrl || res.data.secure_url || "";
}

export default function DealerSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingLabel, setUploadingLabel] = useState("");

  // Step 1
  const [logoUrl, setLogoUrl] = useState("");
  const [passportUrl, setPassportUrl] = useState("");
  const [company, setCompany] = useState({ companyName:"", phone:"", whatsapp:"", address:"", city:"", state:"", country:"Nigeria", description:"" });

  // Step 2
  const [idUrl, setIdUrl] = useState("");
  const [cacUrl, setCacUrl] = useState("");
  const [isRegistered, setIsRegistered] = useState<boolean|null>(null);

  // Step 3
  const [car, setCar] = useState({ brand:"Toyota", model:"", year:new Date().getFullYear(), color:"", mileage:"", transmission:"automatic", fuelType:"petrol", condition:"foreign used", description:"", state:"", city:"", purchasePrice:"", sellingPrice:"" });

  // Step 4
  const [staff, setStaff] = useState({ fullName:"", username:"", email:"", phone:"", position:"Sales Manager", password:"Staff@1234", permissions:["view_inventory","view_sales","add_cars"] });

  // Step 5
  const [cctv, setCctv] = useState({ cameraName:"", cameraLocation:"", streamUrl:"", streamType:"rtsp" });

  const logoRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const cacRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/api/v1/dealers/me")
      .then(() => router.replace("/dashboard/dealer"))
      .catch(() => setChecking(false));
  }, [router]);

  const doUpload = async (file: File, endpoint: string, setter: (u:string)=>void, label: string, fieldName="file") => {
    setUploadingLabel(label); setError("");
    try {
      const url = await uploadFile(file, endpoint, fieldName);
      if (url) setter(url);
      else setError(`${label}: upload succeeded but no URL returned`);
    } catch(e:any) {
      setError(`${label} upload failed: ${e.response?.data?.detail || e.message}`);
    } finally { setUploadingLabel(""); }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.companyName.trim()) { setError("Company name is required"); return; }
    if (!company.phone.trim()) { setError("Phone number is required"); return; }
    if (!company.state) { setError("Please select your state"); return; }
    if (!logoUrl) { setError("Please upload your business logo"); return; }
    if (!passportUrl) { setError("Please upload your passport photograph"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/v1/dealers/setup", { ...company, logo: logoUrl, passportPhoto: passportUrl });
      setStep(2);
    } catch(err:any) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("already exists")) { setStep(2); }
      else { setError(detail || "Failed to save company info. Please try again."); }
    } finally { setLoading(false); }
  };

  const handleStep2 = async (skip?: boolean) => {
    if (skip) { setStep(3); return; }
    if (!idUrl) { setError("Please upload a government-issued ID"); return; }
    setLoading(true); setError("");
    try {
      await api.patch("/api/v1/dealers/me", { idCardUrl: idUrl, cacUrl: cacUrl||undefined, isRegisteredBusiness: isRegistered });
      setStep(3);
    } catch(err:any) { setError(err.response?.data?.detail || "Failed to save documents."); }
    finally { setLoading(false); }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car.model.trim()) { setError("Car model is required"); return; }
    if (!car.sellingPrice) { setError("Selling price is required"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/v1/cars/", { ...car, year:Number(car.year), mileage:car.mileage?Number(car.mileage):0, purchasePrice:car.purchasePrice?Number(car.purchasePrice):0, sellingPrice:Number(car.sellingPrice) });
      setStep(4);
    } catch(err:any) { setError(err.response?.data?.detail || "Failed to add car."); }
    finally { setLoading(false); }
  };

  const handleStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.fullName.trim() || !staff.email.trim()) { setError("Full name and email are required"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/v1/staff/", staff);
      setStep(5);
    } catch(err:any) { setError(err.response?.data?.detail || "Failed to create staff."); }
    finally { setLoading(false); }
  };

  const handleStep5 = async (skip?: boolean) => {
    if (!skip && cctv.cameraName && cctv.streamUrl) {
      setLoading(true);
      try { await api.post("/api/v1/cctv/", cctv); } catch {}
      finally { setLoading(false); }
    }
    router.push("/dashboard/dealer");
  };

  const fi: React.CSSProperties = { width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.75rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" as const };
  const lbl: React.CSSProperties = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"0.35rem" };
  const row: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" };

  const UploadBox = ({ label, url, inputRef, onFile, accept="image/*", note="" }: { label:string, url:string, inputRef:React.RefObject<HTMLInputElement>, onFile:(f:File)=>void, accept?:string, note?:string }) => (
    <div
      onClick={()=>!uploadingLabel&&inputRef.current?.click()}
      style={{border:`1.5px dashed ${url?"#16A34A":uploadingLabel===label?"#F47B20":"#D4D4D4"}`, borderRadius:"10px", padding:"1.25rem 1rem", background:url?"#F0FDF4":uploadingLabel===label?"#FFF7ED":"#FAFAFA", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.625rem", cursor:uploadingLabel?"not-allowed":"pointer", textAlign:"center", transition:"all 0.2s", minHeight:"110px", justifyContent:"center"}}>
      {uploadingLabel===label ? (
        <>
          <div style={{width:"24px",height:"24px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{fontSize:"0.75rem",color:"#F47B20",fontWeight:600}}>Uploading {label}...</div>
        </>
      ) : url ? (
        <>
          {accept.includes("image") && <img src={url} alt="" style={{width:"64px",height:"64px",objectFit:"cover",borderRadius:"8px",border:"2px solid #86EFAC"}}/>}
          <div style={{fontSize:"0.75rem",color:"#15803D",fontWeight:600}}>✓ {label} uploaded</div>
          <div style={{fontSize:"0.68rem",color:"#86EFAC",background:"#15803D",padding:"0.15rem 0.5rem",borderRadius:"4px"}}>Click to change</div>
        </>
      ) : (
        <>
          <div style={{fontSize:"1.75rem",opacity:0.35}}>{accept.includes("image")?"📷":"📄"}</div>
          <div style={{fontSize:"0.8rem",color:"#525252",fontWeight:600}}>{label}</div>
          {note&&<div style={{fontSize:"0.7rem",color:"#A3A3A3"}}>{note}</div>}
          <div style={{fontSize:"0.72rem",color:"#F47B20",fontWeight:600,border:"1px solid rgba(244,123,32,0.3)",borderRadius:"4px",padding:"0.2rem 0.6rem"}}>Click to upload</div>
        </>
      )}
      <input ref={inputRef} type="file" accept={accept} style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]; if(f) onFile(f); e.target.value="";}} />
    </div>
  );

  if (checking) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>
      {/* Header + progress */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5",padding:"1rem 1.5rem",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:"720px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.875rem"}}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
            <div style={{fontSize:"0.75rem",color:"#737373"}}>Dealership Setup — Step {step} of {STEPS.length}</div>
          </div>
          <div style={{display:"flex",alignItems:"center"}}>
            {STEPS.map((s,i)=>(
              <div key={s.num} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
                  <div style={{width:"26px",height:"26px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",fontWeight:700,background:step>s.num?"#16A34A":step===s.num?"#F47B20":"#E5E5E5",color:step>=s.num?"#fff":"#737373",transition:"all 0.25s",flexShrink:0}}>
                    {step>s.num?"✓":s.num}
                  </div>
                  <span style={{fontSize:"0.65rem",color:step===s.num?"#F47B20":step>s.num?"#16A34A":"#A3A3A3",fontWeight:step===s.num?700:400,whiteSpace:"nowrap"}}>
                    {s.label}
                  </span>
                </div>
                {i<STEPS.length-1&&<div style={{flex:1,height:"2px",background:step>s.num?"#16A34A":"#E5E5E5",margin:"0 0.4rem",transition:"background 0.25s"}}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:"720px",margin:"0 auto",padding:"2rem 1.5rem 5rem"}}>
        {error && (
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.875rem 1rem",borderRadius:"8px",fontSize:"0.875rem",marginBottom:"1.25rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.75rem",lineHeight:1.5}}>
            <span>{error}</span>
            <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",flexShrink:0}}>✕</button>
          </div>
        )}

        {/* ─── STEP 1: Company + Passport ─── */}
        {step===1&&(
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>Company & Personal Details</h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem",lineHeight:1.6}}>Set up your dealership profile. Your logo and passport are required for verification.</p>
            <form onSubmit={handleStep1} style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <div>
                <label style={lbl}>Business Logo & Your Passport Photo *</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  <UploadBox label="Business Logo" url={logoUrl} inputRef={logoRef}
                    onFile={f=>doUpload(f, "/api/v1/upload/dealer/logo", setLogoUrl, "Business Logo")}
                    note="Your dealership logo or brand image" />
                  <UploadBox label="Your Passport Photo" url={passportUrl} inputRef={passportRef}
                    onFile={f=>doUpload(f, "/api/v1/upload/profile/picture", setPassportUrl, "Your Passport Photo")}
                    note="Clear face photo for verification" />
                </div>
              </div>
              <div style={row}>
                <div><label style={lbl}>Company / Business Name *</label><input style={fi} placeholder="e.g. Ayo Motors Ltd" value={company.companyName} onChange={e=>setCompany({...company,companyName:e.target.value})} required /></div>
                <div><label style={lbl}>Business Phone *</label><input style={fi} placeholder="+234..." value={company.phone} onChange={e=>setCompany({...company,phone:e.target.value})} required /></div>
              </div>
              <div style={row}>
                <div><label style={lbl}>WhatsApp</label><input style={fi} placeholder="+234..." value={company.whatsapp} onChange={e=>setCompany({...company,whatsapp:e.target.value})} /></div>
                <div><label style={lbl}>City *</label><input style={fi} placeholder="e.g. Lagos" value={company.city} onChange={e=>setCompany({...company,city:e.target.value})} required /></div>
              </div>
              <div style={row}>
                <div><label style={lbl}>State *</label>
                  <select style={{...fi,cursor:"pointer"}} value={company.state} onChange={e=>setCompany({...company,state:e.target.value})} required>
                    <option value="">Select state...</option>
                    {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Address</label><input style={fi} placeholder="Street address" value={company.address} onChange={e=>setCompany({...company,address:e.target.value})} /></div>
              </div>
              <div><label style={lbl}>Description</label><textarea style={{...fi,minHeight:"70px",resize:"vertical" as const}} placeholder="What does your dealership specialise in?" value={company.description} onChange={e=>setCompany({...company,description:e.target.value})} /></div>
              <button type="submit" disabled={loading||!!uploadingLabel}
                style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:loading||uploadingLabel?"not-allowed":"pointer",opacity:loading||uploadingLabel?0.6:1}}>
                {loading?"Saving...":uploadingLabel?`Uploading ${uploadingLabel}...`:"CONTINUE →"}
              </button>
            </form>
          </div>
        )}

        {/* ─── STEP 2: Documents ─── */}
        {step===2&&(
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>Verification Documents</h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem",lineHeight:1.6}}>Upload your ID for faster approval. You can take a photo or upload from gallery. All documents are securely encrypted.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
              <div>
                <label style={lbl}>Government-Issued ID * <span style={{color:"#F47B20"}}>(Required)</span></label>
                <p style={{fontSize:"0.75rem",color:"#737373",marginBottom:"0.5rem",marginTop:"0.1rem"}}>NIN, Voter's Card, Driver's Licence, or International Passport</p>
                <UploadBox label="Upload ID Card" url={idUrl} inputRef={idRef}
                  onFile={f=>doUpload(f, "/api/v1/upload/document", setIdUrl, "ID Card")}
                  accept="image/jpeg,image/png,application/pdf"
                  note="JPG, PNG or PDF — up to 10MB" />
              </div>
              <div>
                <label style={lbl}>Is your business registered with CAC?</label>
                <div style={{display:"flex",gap:"0.75rem",marginBottom:"0.75rem",marginTop:"0.4rem"}}>
                  {[{v:true,l:"Yes, it is registered"},{v:false,l:"No, not registered"}].map(o=>(
                    <button key={String(o.v)} onClick={()=>setIsRegistered(o.v)} type="button"
                      style={{flex:1,padding:"0.75rem",borderRadius:"8px",border:`1.5px solid ${isRegistered===o.v?"#F47B20":"#E5E5E5"}`,background:isRegistered===o.v?"#FFF7ED":"#F5F5F5",color:isRegistered===o.v?"#C4621A":"#525252",fontSize:"0.85rem",cursor:"pointer",fontFamily:"var(--font-body)",fontWeight:isRegistered===o.v?600:400,transition:"all 0.2s"}}>
                      {o.l}
                    </button>
                  ))}
                </div>
                {isRegistered&&(
                  <div>
                    <label style={{...lbl,marginBottom:"0.5rem"}}>CAC Certificate <span style={{color:"#A3A3A3",fontWeight:400,textTransform:"none" as const}}>(optional)</span></label>
                    <UploadBox label="Upload CAC Document" url={cacUrl} inputRef={cacRef}
                      onFile={f=>doUpload(f, "/api/v1/upload/document", setCacUrl, "CAC Document")}
                      accept="image/jpeg,image/png,application/pdf"
                      note="CAC registration certificate or form" />
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <button onClick={()=>setStep(1)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>← Back</button>
                <button onClick={()=>handleStep2()} disabled={loading||!!uploadingLabel}
                  style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em",cursor:"pointer",opacity:loading||uploadingLabel?0.6:1}}>
                  {loading?"Saving...":uploadingLabel?`Uploading ${uploadingLabel}...`:"CONTINUE →"}
                </button>
                <button onClick={()=>handleStep2(true)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>Skip</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 3: First Car ─── */}
        {step===3&&(
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>Add Your First Car</h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem",lineHeight:1.6}}>List your first vehicle. You can add photos and more cars from your dashboard.</p>
            <form onSubmit={handleStep3} style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <div style={row}>
                <div><label style={lbl}>Brand *</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.brand} onChange={e=>setCar({...car,brand:e.target.value})}>
                    {["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Nissan","Audi","Land Rover","Jeep","Volkswagen","Peugeot","Mitsubishi","Other"].map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Model *</label><input style={fi} placeholder="e.g. Camry, Accord..." value={car.model} onChange={e=>setCar({...car,model:e.target.value})} required /></div>
              </div>
              <div style={row}>
                <div><label style={lbl}>Year</label><input type="number" style={fi} value={car.year} onChange={e=>setCar({...car,year:Number(e.target.value)})} /></div>
                <div><label style={lbl}>Color</label><input style={fi} placeholder="e.g. Black" value={car.color} onChange={e=>setCar({...car,color:e.target.value})} /></div>
              </div>
              <div style={row}>
                <div><label style={lbl}>Selling Price (₦) *</label><input type="number" style={fi} placeholder="0" value={car.sellingPrice} onChange={e=>setCar({...car,sellingPrice:e.target.value})} required /></div>
                <div><label style={lbl}>Purchase Price (₦)</label><input type="number" style={fi} placeholder="0" value={car.purchasePrice} onChange={e=>setCar({...car,purchasePrice:e.target.value})} /></div>
              </div>
              <div style={row}>
                <div><label style={lbl}>Condition</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.condition} onChange={e=>setCar({...car,condition:e.target.value})}>
                    {["brand new","foreign used","locally used","salvage"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Transmission</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.transmission} onChange={e=>setCar({...car,transmission:e.target.value})}>
                    {["automatic","manual","semi-automatic"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={row}>
                <div><label style={lbl}>City</label><input style={fi} placeholder="e.g. Lagos" value={car.city} onChange={e=>setCar({...car,city:e.target.value})} /></div>
                <div><label style={lbl}>State</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.state} onChange={e=>setCar({...car,state:e.target.value})}>
                    <option value="">Select state...</option>
                    {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <button type="button" onClick={()=>setStep(2)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>← Back</button>
                <button type="submit" disabled={loading} style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em",cursor:"pointer",opacity:loading?0.6:1}}>
                  {loading?"Adding car...":"ADD CAR & CONTINUE →"}
                </button>
                <button type="button" onClick={()=>setStep(4)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>Skip</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── STEP 4: First Staff ─── */}
        {step===4&&(
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>Create First Staff Account</h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem",lineHeight:1.6}}>Add a team member and set their permissions. They can sign in immediately with these details.</p>
            <form onSubmit={handleStep4} style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <div style={row}>
                <div><label style={lbl}>Full Name *</label><input style={fi} placeholder="John Doe" value={staff.fullName} onChange={e=>setStaff({...staff,fullName:e.target.value})} required /></div>
                <div><label style={lbl}>Username *</label><input style={fi} placeholder="johndoe" value={staff.username} onChange={e=>setStaff({...staff,username:e.target.value})} required /></div>
              </div>
              <div style={row}>
                <div><label style={lbl}>Email *</label><input type="email" style={fi} placeholder="staff@email.com" value={staff.email} onChange={e=>setStaff({...staff,email:e.target.value})} required /></div>
                <div><label style={lbl}>Phone</label><input style={fi} placeholder="+234..." value={staff.phone} onChange={e=>setStaff({...staff,phone:e.target.value})} /></div>
              </div>
              <div style={row}>
                <div><label style={lbl}>Position</label><input style={fi} placeholder="Sales Manager" value={staff.position} onChange={e=>setStaff({...staff,position:e.target.value})} /></div>
                <div><label style={lbl}>Temp Password</label><input style={fi} value={staff.password} onChange={e=>setStaff({...staff,password:e.target.value})} /></div>
              </div>
              <div>
                <label style={lbl}>Permissions</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginTop:"0.35rem"}}>
                  {PERMISSIONS.map(p=>(
                    <label key={p} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 0.75rem",border:`1.5px solid ${staff.permissions.includes(p)?"#F47B20":"#E5E5E5"}`,borderRadius:"6px",cursor:"pointer",fontSize:"0.78rem",color:staff.permissions.includes(p)?"#C4621A":"#737373",background:staff.permissions.includes(p)?"#FFF7ED":"#F5F5F5",transition:"all 0.15s"}}>
                      <input type="checkbox" checked={staff.permissions.includes(p)} onChange={()=>setStaff(f=>({...f,permissions:f.permissions.includes(p)?f.permissions.filter(x=>x!==p):[...f.permissions,p]}))} style={{accentColor:"#F47B20"}} />
                      <span style={{textTransform:"capitalize"}}>{p.replace(/_/g," ")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <button type="button" onClick={()=>setStep(3)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>← Back</button>
                <button type="submit" disabled={loading} style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em",cursor:"pointer",opacity:loading?0.6:1}}>
                  {loading?"Creating...":"CREATE STAFF & CONTINUE →"}
                </button>
                <button type="button" onClick={()=>setStep(5)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>Skip</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── STEP 5: CCTV ─── */}
        {step===5&&(
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>CCTV Setup <span style={{fontSize:"0.85rem",color:"#A3A3A3",fontWeight:400}}>(Optional)</span></h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem",lineHeight:1.6}}>Connect a security camera to monitor your dealership. You can add more from Settings later.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <div style={row}>
                <div><label style={lbl}>Camera Name</label><input style={fi} placeholder="Main Gate" value={cctv.cameraName} onChange={e=>setCctv({...cctv,cameraName:e.target.value})} /></div>
                <div><label style={lbl}>Location</label><input style={fi} placeholder="Front Entrance" value={cctv.cameraLocation} onChange={e=>setCctv({...cctv,cameraLocation:e.target.value})} /></div>
              </div>
              <div><label style={lbl}>Stream URL</label><input style={fi} placeholder="rtsp://192.168.1.x:554/stream or https://..." value={cctv.streamUrl} onChange={e=>setCctv({...cctv,streamUrl:e.target.value})} /></div>
              <div><label style={lbl}>Stream Type</label>
                <select style={{...fi,cursor:"pointer"}} value={cctv.streamType} onChange={e=>setCctv({...cctv,streamType:e.target.value})}>
                  {["rtsp","hls","ip"].map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>

              {/* Summary */}
              <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"10px",padding:"1.25rem"}}>
                <div style={{fontFamily:"var(--font-display)",fontSize:"0.75rem",letterSpacing:"0.1em",color:"#15803D",marginBottom:"0.75rem"}}>SETUP COMPLETE — SUMMARY</div>
                {[
                  {label:"Company profile saved",done:true},
                  {label:"Business logo uploaded",done:!!logoUrl},
                  {label:"Documents uploaded",done:!!idUrl},
                  {label:"First car listed",done:!!car.model},
                  {label:"First staff created",done:!!staff.email},
                ].map(item=>(
                  <div key={item.label} style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.4rem",fontSize:"0.825rem",color:item.done?"#15803D":"#A3A3A3"}}>
                    <span>{item.done?"✅":"⬜"}</span><span>{item.label}</span>
                  </div>
                ))}
                <div style={{marginTop:"0.75rem",paddingTop:"0.75rem",borderTop:"1px solid rgba(22,163,74,0.2)",fontSize:"0.78rem",color:"#15803D",lineHeight:1.6}}>
                  You will have immediate access to your full dashboard. Your car listings appear on the public feed once a CARSTRIMS admin approves your account.
                </div>
              </div>

              <div style={{display:"flex",gap:"0.75rem"}}>
                <button onClick={()=>setStep(4)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>← Back</button>
                <button onClick={()=>handleStep5()} disabled={loading}
                  style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em",cursor:"pointer",opacity:loading?0.6:1}}>
                  {loading?"Saving...":"SAVE & GO TO DASHBOARD →"}
                </button>
                <button onClick={()=>handleStep5(true)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#737373",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>Skip CCTV</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
