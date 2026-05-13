"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Isuzu","Opel","Renault","Other"];
const CONDITIONS = ["brand new","foreign used","locally used","salvage"];
const STATUSES   = ["available","reserved","sold","out_for_inspection","in_repair","on_promotion"];
const FUEL_TYPES  = ["petrol","diesel","electric","hybrid","gas","other"];
const TRANS      = ["automatic","manual","semi-automatic","cvt"];

interface Car { _id:string; carId:string; brand:string; model:string; year:number; color:string; condition:string; status:string; sellingPrice:number; purchasePrice:number; promoPrice:number; mileage:number; fuelType:string; transmission:string; engineType:string; vin:string; description:string; images:string[]; video:string; city:string; state:string; }

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dkvj0wjta/auto/upload";
const CLOUDINARY_PRESET = "carstrims_cars";

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(CLOUDINARY_URL, { method:"POST", body:fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

const emptyForm = () => ({ brand:"Toyota", model:"", year:new Date().getFullYear(), color:"", condition:"foreign used", status:"available", sellingPrice:"", purchasePrice:"", promoPrice:"", mileage:"", fuelType:"petrol", transmission:"automatic", engineType:"", vin:"", description:"", city:"", state:"" });

export default function DealerCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [editCar, setEditCar] = useState<Car|null>(null);
  const [formRef] = useState(() => ({ current: emptyForm() }));
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rerender, setRerender] = useState(0);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);
  const formData = formRef.current;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit:30 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const r = await api.get("/api/v1/cars/", { params });
      setCars(r.data.cars || []); setTotal(r.data.total || 0);
    } catch(_){} finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    formRef.current = emptyForm();
    setImages([]); setVideo(""); setErr("");
    setModal("add"); setEditCar(null);
    setRerender(r=>r+1);
  };

  const openEdit = (car: Car) => {
    formRef.current = {
      brand:car.brand||"Toyota", model:car.model||"", year:car.year||2024,
      color:car.color||"", condition:car.condition||"foreign used",
      status:car.status||"available", sellingPrice:String(car.sellingPrice||""),
      purchasePrice:String(car.purchasePrice||""), promoPrice:String(car.promoPrice||""),
      mileage:String(car.mileage||""), fuelType:car.fuelType||"petrol",
      transmission:car.transmission||"automatic", engineType:car.engineType||"",
      vin:car.vin||"", description:car.description||"",
      city:car.city||"", state:car.state||"",
    };
    setImages(car.images||[]); setVideo(car.video||""); setErr("");
    setEditCar(car); setModal("edit");
    setRerender(r=>r+1);
  };

  const closeModal = () => { setModal(null); setEditCar(null); setErr(""); };

  const handleImgFiles = async (files: FileList) => {
    if (images.length + files.length > 10) { setErr("Maximum 10 photos allowed"); return; }
    setUploading(true); setUploadProgress("Uploading photos...");
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading photo ${i+1} of ${files.length}...`);
        const url = await uploadToCloudinary(files[i]);
        urls.push(url);
      }
      setImages(prev => [...prev, ...urls]);
      setErr("");
    } catch(_){ setErr("Photo upload failed. Please try again."); }
    finally { setUploading(false); setUploadProgress(""); if(imgInputRef.current) imgInputRef.current.value=""; }
  };

  const handleVideoFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) { setErr("Video must be under 50MB"); return; }
    setUploading(true); setUploadProgress("Uploading video...");
    try {
      const url = await uploadToCloudinary(file);
      setVideo(url); setErr("");
    } catch(_){ setErr("Video upload failed. Please try again."); }
    finally { setUploading(false); setUploadProgress(""); if(vidInputRef.current) vidInputRef.current.value=""; }
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_,i)=>i!==idx));
  const removeVideo = () => setVideo("");

  const handleSave = async () => {
    const f = formRef.current;
    if (!f.model.trim()) { setErr("Car model is required"); return; }
    if (!f.sellingPrice) { setErr("Selling price is required"); return; }
    setSaving(true); setErr("");
    try {
      const payload = {
        ...f,
        year: Number(f.year),
        sellingPrice: Number(f.sellingPrice),
        purchasePrice: Number(f.purchasePrice)||0,
        promoPrice: Number(f.promoPrice)||0,
        mileage: Number(f.mileage)||0,
        images,
        video: video||undefined,
      };
      if (modal === "add") {
        await api.post("/api/v1/cars/", payload);
      } else if (editCar) {
        await api.patch(`/api/v1/cars/${editCar.carId}`, payload);
      }
      await load();
      closeModal();
    } catch(ex:any){ setErr(ex.response?.data?.detail||"Save failed. Please try again."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (carId: string) => {
    if (!confirm("Delete this car permanently?")) return;
    try { await api.delete(`/api/v1/cars/${carId}`); await load(); }
    catch(_){ alert("Delete failed"); }
  };

  const set = (k: string, v: any) => { (formRef.current as any)[k] = v; setRerender(r=>r+1); };

  const STATUS_COLORS: Record<string,string> = {
    available:"#16A34A", sold:"#737373", reserved:"#D97706",
    out_for_inspection:"#3B8BD4", in_repair:"#DC2626", on_promotion:"#7C3AED",
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Cars & Inventory</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{total} total vehicles</p>
        </div>
        <button onClick={openAdd}
          style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",cursor:"pointer"}}>
          + Add Car
        </button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
        <input placeholder="Search by brand, model, ID..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{flex:1,minWidth:"200px",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem 1rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",color:"#1A1A1A"}} />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem 1rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",cursor:"pointer",color:"#1A1A1A"}}>
          <option value="all">All Status</option>
          {STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {/* Cars grid */}
      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : cars.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px dashed #E5E5E5",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
          <div style={{fontSize:"2.5rem"}}>🚗</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No cars yet</div>
          <p style={{fontSize:"0.875rem",color:"#737373"}}>Add your first car to start building your inventory</p>
          <button onClick={openAdd} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer"}}>+ Add First Car</button>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"1rem"}}>
          {cars.map(car => (
            <div key={car._id} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",transition:"border-color 0.2s",display:"flex",flexDirection:"column"}}>
              <div style={{height:"160px",background:"#F5F5F5",position:"relative",overflow:"hidden"}}>
                {car.images?.[0]
                  ? <img src={car.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2rem",opacity:0.3}}>🚗</div>
                }
                <div style={{position:"absolute",top:"0.5rem",left:"0.5rem",background:STATUS_COLORS[car.status]||"#737373",color:"#fff",fontSize:"0.6rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:"4px",textTransform:"capitalize"}}>
                  {car.status.replace(/_/g," ")}
                </div>
                {car.images?.length > 1 && (
                  <div style={{position:"absolute",bottom:"0.5rem",right:"0.5rem",background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:"0.65rem",padding:"0.15rem 0.4rem",borderRadius:"4px"}}>
                    +{car.images.length-1} photos
                  </div>
                )}
              </div>
              <div style={{padding:"0.875rem",flex:1,display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                <div style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{car.brand} {car.model}</div>
                <div style={{fontSize:"0.72rem",color:"#737373"}}>{car.year} · {car.color} · {car.transmission}</div>
                {car.city && <div style={{fontSize:"0.7rem",color:"#A3A3A3"}}>{car.city}, {car.state}</div>}
                <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#F47B20",marginTop:"0.25rem"}}>
                  ₦{(car.sellingPrice||0).toLocaleString()}
                </div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",color:"#A3A3A3"}}>{car.carId}</div>
              </div>
              <div style={{display:"flex",gap:"0.5rem",padding:"0.75rem",borderTop:"1px solid #F0F0F0"}}>
                <button onClick={()=>openEdit(car)}
                  style={{flex:1,background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)",color:"#525252",transition:"all 0.2s"}}>
                  Edit
                </button>
                <button onClick={()=>handleDelete(car.carId)}
                  style={{flex:1,background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.25)",borderRadius:"6px",padding:"0.5rem",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)",color:"#DC2626"}}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:1000,overflowY:"auto",padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"640px",marginTop:"1rem",marginBottom:"1rem",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            {/* Modal header */}
            <div style={{padding:"1.25rem 1.5rem",borderBottom:"1.5px solid #E5E5E5",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",position:"sticky",top:0,zIndex:10}}>
              <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>{modal==="add"?"ADD NEW CAR":"EDIT CAR"}</h3>
              <button onClick={closeModal} style={{background:"#F5F5F5",border:"none",borderRadius:"6px",width:"32px",height:"32px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"1rem",color:"#737373"}}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1.25rem",maxHeight:"70vh",overflowY:"auto"}}>
              {err && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem"}}>{err}</div>}

              {/* Images */}
              <div>
                <label style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.5rem"}}>Photos ({images.length}/10)</label>
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.5rem"}}>
                  {images.map((img,i)=>(
                    <div key={i} style={{position:"relative",width:"72px",height:"56px",borderRadius:"6px",overflow:"hidden",border:"1.5px solid #E5E5E5"}}>
                      <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      <button onClick={()=>removeImage(i)} style={{position:"absolute",top:"2px",right:"2px",background:"rgba(220,38,38,0.85)",border:"none",borderRadius:"50%",width:"16px",height:"16px",color:"#fff",fontSize:"0.6rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                    </div>
                  ))}
                  {images.length < 10 && (
                    <button onClick={()=>imgInputRef.current?.click()} disabled={uploading}
                      style={{width:"72px",height:"56px",border:"1.5px dashed #D4D4D4",borderRadius:"6px",background:"#FAFAFA",cursor:"pointer",fontSize:"1.25rem",color:"#A3A3A3",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      +
                    </button>
                  )}
                </div>
                <input ref={imgInputRef} type="file" accept="image/*" multiple style={{display:"none"}}
                  onChange={e=>{ if(e.target.files?.length) handleImgFiles(e.target.files); }} />
                {uploadProgress && <div style={{fontSize:"0.78rem",color:"#F47B20"}}>{uploadProgress}</div>}
              </div>

              {/* Video */}
              <div>
                <label style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.5rem"}}>Video (optional, max 50MB)</label>
                {video ? (
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                    <video src={video} style={{width:"120px",height:"70px",objectFit:"cover",borderRadius:"6px",border:"1.5px solid #E5E5E5"}} />
                    <button onClick={removeVideo} style={{background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Remove</button>
                  </div>
                ) : (
                  <button onClick={()=>vidInputRef.current?.click()} disabled={uploading}
                    style={{background:"#F5F5F5",border:"1.5px dashed #D4D4D4",borderRadius:"8px",padding:"0.75rem 1.25rem",fontSize:"0.825rem",cursor:"pointer",fontFamily:"var(--font-body)",color:"#737373"}}>
                    + Upload Video
                  </button>
                )}
                <input ref={vidInputRef} type="file" accept="video/*" style={{display:"none"}}
                  onChange={e=>{ if(e.target.files?.[0]) handleVideoFile(e.target.files[0]); }} />
              </div>

              {/* Form fields */}
              {[
                { label:"Brand *", key:"brand", type:"select", opts:BRANDS },
                { label:"Model *", key:"model", placeholder:"e.g. Camry, Accord..." },
                { label:"Year", key:"year", type:"number" },
                { label:"Color", key:"color", placeholder:"e.g. Black, White, Red..." },
                { label:"Condition", key:"condition", type:"select", opts:CONDITIONS },
                { label:"Status", key:"status", type:"select", opts:STATUSES },
                { label:"Selling Price (₦) *", key:"sellingPrice", type:"number" },
                { label:"Purchase Price (₦)", key:"purchasePrice", type:"number" },
                { label:"Promo Price (₦)", key:"promoPrice", type:"number" },
                { label:"Mileage (km)", key:"mileage", type:"number" },
                { label:"Fuel Type", key:"fuelType", type:"select", opts:FUEL_TYPES },
                { label:"Transmission", key:"transmission", type:"select", opts:TRANS },
                { label:"Engine Type", key:"engineType", placeholder:"e.g. V6 3.5L, 2.0T..." },
                { label:"VIN", key:"vin", placeholder:"Vehicle Identification Number" },
                { label:"City", key:"city", placeholder:"e.g. Lagos, Abuja..." },
                { label:"State", key:"state", placeholder:"e.g. Lagos, FCT..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.35rem"}}>{f.label}</label>
                  {f.type==="select" ? (
                    <select value={(formData as any)[f.key]} onChange={e=>set(f.key,e.target.value)}
                      style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",cursor:"pointer",textTransform:"capitalize" as const}}>
                      {(f.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type||"text"} value={(formData as any)[f.key]} onChange={e=>set(f.key,e.target.value)}
                      placeholder={(f as any).placeholder||""}
                      style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}} />
                  )}
                </div>
              ))}

              {/* Description */}
              <div>
                <label style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.35rem"}}>Description</label>
                <textarea value={formData.description} onChange={e=>set("description",e.target.value)}
                  placeholder="Describe the car, features, condition, service history..."
                  rows={4}
                  style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",resize:"vertical" as const,boxSizing:"border-box" as const}} />
              </div>
            </div>

            {/* Modal footer */}
            <div style={{padding:"1rem 1.5rem",borderTop:"1.5px solid #E5E5E5",display:"flex",gap:"0.75rem",background:"#FAFAFA"}}>
              <button onClick={closeModal} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Cancel</button>
              <button onClick={handleSave} disabled={saving||uploading}
                style={{flex:2,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:(saving||uploading)?0.6:1}}>
                {saving?"Saving...":(modal==="add"?"ADD CAR":"SAVE CHANGES")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
