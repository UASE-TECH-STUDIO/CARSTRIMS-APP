"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const BRANDS = ["Toyota","Honda","Mercedes-Benz","BMW","Lexus","Ford","Chevrolet","Hyundai","Kia","Nissan","Volkswagen","Audi","Peugeot","Mitsubishi","Suzuki","Mazda","Subaru","Jeep","Land Rover","Other"];
const FUEL   = ["Petrol","Diesel","Electric","Hybrid","CNG"];
const TRANS  = ["Automatic","Manual"];
const CONDS  = ["Brand New","Foreign Used","Nigerian Used"];
const YEARS  = Array.from({length:30},(_,i)=>(new Date().getFullYear()-i).toString());
type Stage = "company"|"documents"|"first_car"|"finish";

export default function DealerSetupPage() {
  const router = useRouter();
  const [stage, setStage]       = useState<Stage>("company");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");

  const [company, setCompany] = useState({ companyName:"", phone:"", whatsapp:"", address:"", city:"", state:"", country:"Nigeria", description:"", website:"", instagram:"" });
  const [docs, setDocs]       = useState({ idCardUrl:"", cacUrl:"", ownerName:"", ownerPhone:"" });
  const [uploadingId,  setUploadingId]  = useState(false);
  const [uploadingCac, setUploadingCac] = useState(false);
  const idRef  = useRef<HTMLInputElement>(null);
  const cacRef = useRef<HTMLInputElement>(null);

  const [car, setCar]         = useState({ make:"", model:"", year:new Date().getFullYear().toString(), price:"", condition:"Foreign Used", transmission:"Automatic", fuelType:"Petrol", color:"", mileage:"", description:"", state:"" });
  const [carImages, setCarImages]       = useState<string[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/api/v1/dealers/me")
      .then((r) => {
        if (r.data?.status === "approved" || r.data?.status === "active") { router.replace("/dashboard/dealer"); }
        else if (r.data?.companyName) { setStage("finish"); }
        else { setStage("company"); }
      })
      .catch(() => { setStage("company"); })
      .finally(() => setChecking(false));
  }, [router]);

  const fi: React.CSSProperties  = { background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.75rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", width:"100%", boxSizing:"border-box" as const };
  const lbl: React.CSSProperties = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"0.35rem" };

  const submitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.companyName.trim() || !company.city.trim() || !company.state) { setError("Company name, city and state are required"); return; }
    setSubmitting(true); setError("");
    try { await api.post("/api/v1/dealers/setup", company); setStage("documents"); }
    catch (err: any) { setError(err.userMessage || err.response?.data?.detail || "Setup failed. Please try again."); }
    finally { setSubmitting(false); }
  };

  const uploadDoc = async (file: File, type: "id"|"cac") => {
    const set = type==="id" ? setUploadingId : setUploadingCac;
    set(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await api.post("/api/v1/dealers/upload-document", fd, { headers:{"Content-Type":"multipart/form-data"} });
      const url = res.data.url || res.data.idCardUrl || res.data.cacUrl || "";
      if (type==="id") setDocs(d=>({...d,idCardUrl:url}));
      else setDocs(d=>({...d,cacUrl:url}));
    } catch (err: any) { setError("Upload failed: " + (err.response?.data?.detail || err.message)); }
    finally { set(false); }
  };

  const submitDocs = async () => {
    setSubmitting(true); setError("");
    try {
      await api.patch("/api/v1/dealers/me", { idCardUrl:docs.idCardUrl, cacUrl:docs.cacUrl, ownerName:docs.ownerName, ownerPhone:docs.ownerPhone }).catch(()=>null);
    } catch {}
    setSubmitting(false); setStage("first_car");
  };

  const uploadCarImg = async (file: File) => {
    setUploadingImg(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await api.post("/api/v1/cars/upload-image", fd, { headers:{"Content-Type":"multipart/form-data"} });
      const url = res.data.url || res.data.imageUrl || "";
      if (url) setCarImages(p=>[...p, url]);
    } catch (err: any) { setError("Image upload failed: " + (err.response?.data?.detail || err.message)); }
    finally { setUploadingImg(false); }
  };

  const submitCar = async () => {
    if (!car.make || !car.model || !car.price) { setError("Make, model and price are required"); return; }
    setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/cars", { ...car, price:parseFloat(car.price.replace(/,/g,"")), mileage:car.mileage?parseFloat(car.mileage):0, year:parseInt(car.year), images:carImages });
    } catch {}
    setSubmitting(false); setStage("finish");
  };

  const STAGE_LABELS = ["Company Info","Documents","First Car","Done"];
  const stageIdx = {company:0,documents:1,first_car:2,finish:3}[stage];

  if (checking) return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F5",fontFamily:"var(--font-body)"}}>
      <div style={{background:"#fff",borderBottom:"1.5px solid #E5E5E5",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
        <div style={{fontSize:"0.78rem",color:"#737373"}}>Setting up your dealership</div>
      </div>

      <div style={{background:"#fff",borderBottom:"1px solid #E5E5E5",padding:"1rem 1.5rem"}}>
        <div style={{maxWidth:"680px",margin:"0 auto",display:"flex",alignItems:"center"}}>
          {STAGE_LABELS.map((s,i)=>(
            <div key={s} style={{display:"flex",alignItems:"center",flex:i<STAGE_LABELS.length-1?1:"auto"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexShrink:0}}>
                <div style={{width:"30px",height:"30px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:700,background:i<=stageIdx?"#F47B20":"#E5E5E5",color:i<=stageIdx?"#fff":"#737373"}}>
                  {i<stageIdx?"v":i+1}
                </div>
                <span style={{fontSize:"0.75rem",color:i<=stageIdx?"#F47B20":"#A3A3A3",fontWeight:i===stageIdx?600:400,whiteSpace:"nowrap"}}>{s}</span>
              </div>
              {i<STAGE_LABELS.length-1&&<div style={{flex:1,height:"2px",background:i<stageIdx?"#F47B20":"#E5E5E5",margin:"0 0.5rem"}} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:"680px",margin:"2rem auto",padding:"0 1.5rem 3rem"}}>
        {error && (
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.875rem 1rem",borderRadius:"8px",fontSize:"0.875rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between"}}>
            <span>{error}</span>
            <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>X</button>
          </div>
        )}

        {stage==="company" && (
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>Dealership Information</h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem"}}>Tell us about your dealership. This will be your public profile on CARSTRIMS.</p>
            <form onSubmit={submitCompany} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div><label style={lbl}>Company / Business Name *</label><input style={fi} placeholder="e.g. Ayo Motors Ltd" value={company.companyName} onChange={e=>setCompany({...company,companyName:e.target.value})} required /></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Business Phone *</label><input style={fi} placeholder="+234..." value={company.phone} onChange={e=>setCompany({...company,phone:e.target.value})} required /></div>
                <div><label style={lbl}>WhatsApp</label><input style={fi} placeholder="+234..." value={company.whatsapp} onChange={e=>setCompany({...company,whatsapp:e.target.value})} /></div>
              </div>
              <div><label style={lbl}>Business Address *</label><input style={fi} placeholder="Street address" value={company.address} onChange={e=>setCompany({...company,address:e.target.value})} required /></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>City *</label><input style={fi} placeholder="e.g. Lagos" value={company.city} onChange={e=>setCompany({...company,city:e.target.value})} required /></div>
                <div><label style={lbl}>State *</label>
                  <select style={{...fi,cursor:"pointer"}} value={company.state} onChange={e=>setCompany({...company,state:e.target.value})} required>
                    <option value="">Select state...</option>{STATES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Business Description</label><textarea style={{...fi,minHeight:"80px",resize:"vertical" as const}} placeholder="What do you specialize in?" value={company.description} onChange={e=>setCompany({...company,description:e.target.value})} /></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Website (optional)</label><input style={fi} placeholder="https://..." value={company.website} onChange={e=>setCompany({...company,website:e.target.value})} /></div>
                <div><label style={lbl}>Instagram (optional)</label><input style={fi} placeholder="@handle" value={company.instagram} onChange={e=>setCompany({...company,instagram:e.target.value})} /></div>
              </div>
              <button type="submit" disabled={submitting} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.1em",cursor:submitting?"not-allowed":"pointer",opacity:submitting?0.6:1,marginTop:"0.5rem"}}>
                {submitting?"Saving...":"SAVE & CONTINUE"}
              </button>
            </form>
          </div>
        )}

        {stage==="documents" && (
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>Verification Documents</h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"0.5rem"}}>Upload documents to verify your dealership identity before approval.</p>
            <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.8rem",color:"#C4621A",marginBottom:"1.5rem",lineHeight:1.6}}>
              <strong>Required for approval:</strong> Valid ID (NIN, driver licence, passport) and CAC / business registration. Documents are only seen by CARSTRIMS admin.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
              <div><label style={lbl}>Owner Full Name *</label><input style={fi} placeholder="Full name as on ID" value={docs.ownerName} onChange={e=>setDocs({...docs,ownerName:e.target.value})} /></div>
              <div><label style={lbl}>Owner Phone *</label><input style={fi} placeholder="+234..." value={docs.ownerPhone} onChange={e=>setDocs({...docs,ownerPhone:e.target.value})} /></div>
              {[
                {type:"id" as const, label:"Valid ID Card (NIN / Driver Licence / Passport) *", url:docs.idCardUrl, uploading:uploadingId, ref:idRef},
                {type:"cac" as const, label:"CAC Certificate / Business Registration (optional)", url:docs.cacUrl, uploading:uploadingCac, ref:cacRef},
              ].map(({type,label,url,uploading,ref})=>(
                <div key={type}>
                  <label style={lbl}>{label}</label>
                  <div style={{border:"2px dashed #E5E5E5",borderRadius:"8px",padding:"1.5rem",textAlign:"center",cursor:"pointer",background:url?"#F0FDF4":"#F9F9F9",borderColor:url?"#86EFAC":"#E5E5E5"}}
                    onClick={()=>!uploading&&ref.current?.click()}>
                    {uploading ? (
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",color:"#737373",fontSize:"0.875rem"}}>
                        <div style={{width:"16px",height:"16px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />Uploading...
                      </div>
                    ) : url ? (
                      <div><div style={{fontSize:"1.5rem",marginBottom:"0.25rem"}}>Done</div><div style={{fontSize:"0.8rem",color:"#15803D",fontWeight:600}}>Uploaded successfully</div><div style={{fontSize:"0.72rem",color:"#737373"}}>Click to replace</div></div>
                    ) : (
                      <div><div style={{fontSize:"1.5rem",marginBottom:"0.25rem"}}>Upload</div><div style={{fontSize:"0.875rem",fontWeight:500,color:"#1A1A1A"}}>Click to upload</div><div style={{fontSize:"0.72rem",color:"#737373"}}>JPG, PNG or PDF up to 10MB</div></div>
                    )}
                  </div>
                  <input ref={ref} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)uploadDoc(f,type);}} />
                </div>
              ))}
              <div style={{display:"flex",gap:"0.75rem"}}>
                <button onClick={()=>setStage("company")} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Back</button>
                <button onClick={submitDocs} disabled={submitting||!docs.ownerName} style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:submitting||!docs.ownerName?"not-allowed":"pointer",opacity:submitting||!docs.ownerName?0.6:1}}>
                  {submitting?"Saving...":"SAVE & CONTINUE"}
                </button>
              </div>
              <button onClick={()=>setStage("first_car")} style={{background:"none",border:"none",color:"#A3A3A3",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)",textAlign:"center"}}>
                Skip for now (add documents later from Settings)
              </button>
            </div>
          </div>
        )}

        {stage==="first_car" && (
          <div style={{background:"#fff",borderRadius:"16px",padding:"2rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.04em",color:"#1A1A1A",marginBottom:"0.25rem"}}>Add Your First Car</h2>
            <p style={{fontSize:"0.85rem",color:"#737373",marginBottom:"1.5rem"}}>List your first car to get your inventory started. Add more from your dashboard anytime.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Make / Brand *</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.make} onChange={e=>setCar({...car,make:e.target.value})}>
                    <option value="">Select brand...</option>{BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Model *</label><input style={fi} placeholder="e.g. Camry, Civic" value={car.model} onChange={e=>setCar({...car,model:e.target.value})} /></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Year</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.year} onChange={e=>setCar({...car,year:e.target.value})}>
                    {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Condition</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.condition} onChange={e=>setCar({...car,condition:e.target.value})}>
                    {CONDS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Price (N) *</label><input style={fi} placeholder="e.g. 5000000" value={car.price} onChange={e=>setCar({...car,price:e.target.value})} /></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Transmission</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.transmission} onChange={e=>setCar({...car,transmission:e.target.value})}>
                    {TRANS.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Fuel Type</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.fuelType} onChange={e=>setCar({...car,fuelType:e.target.value})}>
                    {FUEL.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Color</label><input style={fi} placeholder="e.g. Black" value={car.color} onChange={e=>setCar({...car,color:e.target.value})} /></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Mileage (km)</label><input style={fi} placeholder="e.g. 45000" value={car.mileage} onChange={e=>setCar({...car,mileage:e.target.value})} /></div>
                <div><label style={lbl}>Location State</label>
                  <select style={{...fi,cursor:"pointer"}} value={car.state} onChange={e=>setCar({...car,state:e.target.value})}>
                    <option value="">Select state...</option>{STATES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Description</label><textarea style={{...fi,minHeight:"70px",resize:"vertical" as const}} placeholder="Brief description..." value={car.description} onChange={e=>setCar({...car,description:e.target.value})} /></div>
              <div>
                <label style={lbl}>Photos (up to 10)</label>
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}>
                  {carImages.map((img,i)=>(
                    <div key={i} style={{position:"relative",width:"72px",height:"72px",borderRadius:"6px",overflow:"hidden",border:"1px solid #E5E5E5"}}>
                      <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      <button onClick={()=>setCarImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:"2px",right:"2px",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:"50%",width:"18px",height:"18px",fontSize:"0.6rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>X</button>
                    </div>
                  ))}
                  {carImages.length<10&&(
                    <div style={{width:"72px",height:"72px",border:"2px dashed #E5E5E5",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#F9F9F9",flexDirection:"column",gap:"0.2rem"}}
                      onClick={()=>!uploadingImg&&imgRef.current?.click()}>
                      {uploadingImg?<div style={{width:"16px",height:"16px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />:<><span style={{fontSize:"1.2rem"}}>+</span><span style={{fontSize:"0.6rem",color:"#737373"}}>Photo</span></>}
                    </div>
                  )}
                </div>
                <input ref={imgRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{const files=e.target.files;if(files)Array.from(files).slice(0,10-carImages.length).forEach(f=>uploadCarImg(f));}} />
              </div>
              <div style={{display:"flex",gap:"0.75rem",marginTop:"0.5rem"}}>
                <button onClick={()=>setStage("documents")} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Back</button>
                <button onClick={submitCar} disabled={submitting} style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:submitting?"not-allowed":"pointer",opacity:submitting?0.6:1}}>
                  {submitting?"Adding car...":"ADD CAR & FINISH"}
                </button>
              </div>
              <button onClick={()=>setStage("finish")} style={{background:"none",border:"none",color:"#A3A3A3",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)",textAlign:"center"}}>
                Skip - I will add cars from my dashboard
              </button>
            </div>
          </div>
        )}

        {stage==="finish" && (
          <div style={{background:"#fff",borderRadius:"16px",padding:"2.5rem",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",textAlign:"center"}}>
            <div style={{width:"80px",height:"80px",borderRadius:"50%",background:"#FFF7ED",border:"2px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem"}}>Done</div>
            <div>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",letterSpacing:"0.04em",color:"#1A1A1A"}}>You Are All Set!</h2>
              <p style={{fontSize:"0.875rem",color:"#737373",marginTop:"0.5rem",lineHeight:"1.7",maxWidth:"420px"}}>Your dealership profile has been submitted for review. A CARSTRIMS admin will verify your documents and approve your account.</p>
            </div>
            <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"12px",padding:"1.25rem 1.5rem",width:"100%",textAlign:"left"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#F47B20",marginBottom:"0.875rem"}}>What happens next?</div>
              {[["Admin reviews your profile and documents"],["You may be contacted for verification by phone or WhatsApp"],["Once approved, your listings go live to all buyers"],["You will be notified by email and in-app when approved"]].map(([t],i)=>(
                <div key={i} style={{display:"flex",gap:"0.75rem",marginBottom:"0.625rem",fontSize:"0.85rem",color:"#525252"}}>
                  <span style={{color:"#F47B20",fontWeight:700,flexShrink:0}}>{i+1}.</span><span>{t}</span>
                </div>
              ))}
            </div>
            <div style={{background:"#F5F5F5",borderRadius:"8px",padding:"1rem",width:"100%",fontSize:"0.82rem",color:"#737373",lineHeight:1.6}}>
              <strong style={{color:"#1A1A1A"}}>While pending:</strong> You can use your full dashboard, add cars, manage staff, and configure settings. Your listings are hidden from buyers until approved.
            </div>
            <button onClick={()=>router.push("/dashboard/dealer")} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"1rem 2.5rem",fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.12em",cursor:"pointer",width:"100%"}}>
              GO TO MY DASHBOARD
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}