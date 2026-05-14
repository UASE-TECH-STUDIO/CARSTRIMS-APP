"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Isuzu","Other"];
const CONDITIONS = ["brand new","foreign used","locally used","salvage"];
const FUEL_TYPES = ["petrol","diesel","electric","hybrid","gas","other"];
const TRANS = ["automatic","manual","semi-automatic","cvt"];
const STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

export default function StaffAddCarPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    brand:"Toyota", model:"", year:new Date().getFullYear(), color:"",
    condition:"foreign used", sellingPrice:"", purchasePrice:"",
    mileage:"", fuelType:"petrol", transmission:"automatic",
    engineType:"", vin:"", description:"", city:"", state:"",
  });
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedCarId, setSavedCarId] = useState<string|null>(null);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  const fi: React.CSSProperties = { width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.75rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" as const };
  const lbl: React.CSSProperties = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"0.35rem" };

  const saveCarDraft = async (): Promise<string|null> => {
    if (savedCarId) return savedCarId;
    if (!form.model.trim()) { setError("Model is required before uploading photos"); return null; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        sellingPrice: Number(form.sellingPrice)||0,
        purchasePrice: Number(form.purchasePrice)||0,
        mileage: Number(form.mileage)||0,
      };
      const res = await api.post("/api/v1/cars/", payload);
      const id = res.data.carId || res.data.car?.carId;
      setSavedCarId(id);
      return id;
    } catch(e:any) { setError(e.response?.data?.detail||"Failed to save"); return null; }
    finally { setSaving(false); }
  };

  const handleImages = async (files: FileList) => {
    setUploading(true); setError("");
    const carId = await saveCarDraft();
    if (!carId) { setUploading(false); return; }
    const newUrls: string[] = [];
    for (let i=0; i<files.length; i++) {
      try {
        const fd = new FormData();
        fd.append("files", files[i]);
        const res = await api.post(`/api/v1/upload/car/${carId}/images`, fd, { headers:{"Content-Type":"multipart/form-data"} });
        if (res.data.images?.length) newUrls.push(...res.data.images.slice(-1));
      } catch {}
    }
    if (newUrls.length) setImages(p=>[...p,...newUrls]);
    setUploading(false);
    if (imgRef.current) imgRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.model.trim()) { setError("Model is required"); return; }
    if (!form.sellingPrice) { setError("Selling price is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        sellingPrice: Number(form.sellingPrice),
        purchasePrice: Number(form.purchasePrice)||0,
        mileage: Number(form.mileage)||0,
      };
      if (savedCarId) {
        await api.patch(`/api/v1/cars/${savedCarId}`, payload);
      } else {
        await api.post("/api/v1/cars/", payload);
      }
      router.push("/dashboard/staff/inventory");
    } catch(e:any) { setError(e.response?.data?.detail||"Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#737373",cursor:"pointer",fontSize:"0.875rem",fontFamily:"var(--font-body)"}}>← Back</button>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>Add Vehicle</h2>
      </div>

      {error && (
        <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {error}<button onClick={()=>setError("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
        </div>
      )}

      <form onSubmit={handleSave} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1.25rem"}}>

        {/* Photos */}
        <div>
          <label style={lbl}>Photos</label>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.5rem"}}>
            {images.map((img,i)=>(
              <div key={i} style={{width:"80px",height:"60px",borderRadius:"6px",overflow:"hidden",border:"1.5px solid #E5E5E5",position:"relative"}}>
                <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <button type="button" onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))}
                  style={{position:"absolute",top:"2px",right:"2px",background:"rgba(220,38,38,0.85)",border:"none",borderRadius:"50%",width:"18px",height:"18px",color:"#fff",fontSize:"0.6rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            ))}
            <button type="button" onClick={()=>imgRef.current?.click()} disabled={uploading}
              style={{width:"80px",height:"60px",border:"1.5px dashed #D4D4D4",borderRadius:"6px",background:"#FAFAFA",cursor:"pointer",fontSize:"1.4rem",color:"#A3A3A3",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {uploading?"⏳":"+"}
            </button>
          </div>
          <input ref={imgRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{if(e.target.files?.length) handleImages(e.target.files);}}/>
        </div>

        {/* Form fields */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div>
            <label style={lbl}>Brand *</label>
            <select style={{...fi,cursor:"pointer"}} value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}>
              {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Model *</label>
            <input style={fi} placeholder="e.g. Camry" value={form.model} onChange={e=>setForm({...form,model:e.target.value})} required/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div><label style={lbl}>Year</label><input type="number" style={fi} value={form.year} onChange={e=>setForm({...form,year:Number(e.target.value)})}/></div>
          <div><label style={lbl}>Color</label><input style={fi} placeholder="e.g. Black" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div><label style={lbl}>Selling Price (₦) *</label><input type="number" style={fi} value={form.sellingPrice} onChange={e=>setForm({...form,sellingPrice:e.target.value})} required/></div>
          <div><label style={lbl}>Purchase Price (₦)</label><input type="number" style={fi} value={form.purchasePrice} onChange={e=>setForm({...form,purchasePrice:e.target.value})}/></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div>
            <label style={lbl}>Condition</label>
            <select style={{...fi,cursor:"pointer"}} value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}>
              {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Transmission</label>
            <select style={{...fi,cursor:"pointer"}} value={form.transmission} onChange={e=>setForm({...form,transmission:e.target.value})}>
              {TRANS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div>
            <label style={lbl}>Fuel Type</label>
            <select style={{...fi,cursor:"pointer"}} value={form.fuelType} onChange={e=>setForm({...form,fuelType:e.target.value})}>
              {FUEL_TYPES.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Mileage (km)</label><input type="number" style={fi} value={form.mileage} onChange={e=>setForm({...form,mileage:e.target.value})}/></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div><label style={lbl}>City</label><input style={fi} placeholder="e.g. Lagos" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
          <div>
            <label style={lbl}>State</label>
            <select style={{...fi,cursor:"pointer"}} value={form.state} onChange={e=>setForm({...form,state:e.target.value})}>
              <option value="">Select...</option>
              {STATES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>Engine</label>
          <input style={fi} placeholder="e.g. V6 3.5L" value={form.engineType} onChange={e=>setForm({...form,engineType:e.target.value})}/>
        </div>

        <div>
          <label style={lbl}>Description</label>
          <textarea style={{...fi,minHeight:"80px",resize:"vertical" as const}} rows={3}
            placeholder="Describe condition, features..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        </div>

        <div style={{display:"flex",gap:"0.75rem",justifyContent:"flex-end"}}>
          <button type="button" onClick={()=>router.back()}
            style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem 1.5rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>
            Cancel
          </button>
          <button type="submit" disabled={saving||uploading}
            style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem 2rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:(saving||uploading)?0.6:1}}>
            {saving?"Saving...":uploading?"Uploading...":"Save Vehicle"}
          </button>
        </div>
      </form>

      <style>{`
        @media(max-width:640px){
          div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}
        }
        input:focus,select:focus,textarea:focus{border-color:#F47B20!important;background:#fff!important}
      `}</style>
    </div>
  );
}
