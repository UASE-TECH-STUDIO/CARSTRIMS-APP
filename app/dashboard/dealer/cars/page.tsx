"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import DocumentViewer from "@/components/shared/DocumentViewer";

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Isuzu","Other"];
const CONDITIONS = ["brand new","foreign used","locally used","salvage"];
const STATUSES = ["available","reserved","sold","out_for_inspection","in_repair","on_promotion"];
const FUEL_TYPES = ["petrol","diesel","electric","hybrid","gas","other"];
const TRANS = ["automatic","manual","semi-automatic","cvt"];
const MAX_IMAGES = 10;

interface Car {
  _id:string; carId:string; brand:string; model:string; year:number;
  color:string; condition:string; status:string; sellingPrice:number;
  purchasePrice:number; promoPrice:number; mileage:number; fuelType:string;
  transmission:string; engineType:string; vin:string; description:string;
  images:string[]; video:string; city:string; state:string;
}

async function uploadViaBackend(file: File, endpoint: string): Promise<string> {
  const fd = new FormData();
  fd.append(endpoint.includes("images") ? "files" : "file", file);
  const res = await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
  if (res.data.images && Array.isArray(res.data.images)) return res.data.images[res.data.images.length-1] || "";
  return res.data.video || res.data.url || res.data.secure_url || "";
}

const emptyForm = () => ({
  brand:"Toyota", model:"", year:new Date().getFullYear(), color:"",
  condition:"foreign used", status:"available", sellingPrice:"",
  purchasePrice:"", promoPrice:"", mileage:"", fuelType:"petrol",
  transmission:"automatic", engineType:"", vin:"", description:"", city:"", state:"",
});

function PreviewModal({ src, type, onClose }: { src:string; type:"image"|"video"; onClose:()=>void }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",maxWidth:"92vw",maxHeight:"92vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <button onClick={onClose} style={{position:"absolute",top:"-2rem",right:0,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"50%",width:"32px",height:"32px",color:"#fff",fontSize:"1rem",cursor:"pointer",zIndex:10}}>X</button>
        {type==="image"
          ? <img src={src} alt="" style={{maxWidth:"88vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px",display:"block"}} />
          : <video src={src} controls autoPlay style={{maxWidth:"88vw",maxHeight:"88vh",borderRadius:"8px"}} />
        }
      </div>
    </div>
  );
}

const DOC_TYPES = [
  {type:"proforma", label:"Proforma", title:"Proforma Invoice (Quote before sale)"},
  {type:"invoice",  label:"Invoice",  title:"Standard Invoice (Official bill)"},
  {type:"receipt",  label:"Receipt",  title:"Receipt (Proof of payment)"},
  {type:"report",   label:"Report",   title:"Car Financial Report"},
];

export default function DealerCarsPage() {
  const [cars, setCars]           = useState<Car[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<"add"|"edit"|null>(null);
  const [editCar, setEditCar]     = useState<Car|null>(null);
  const [form, setForm]           = useState<any>(emptyForm());
  const [images, setImages]       = useState<string[]>([]);
  const [video, setVideo]         = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");
  const [savedCarId, setSavedCarId] = useState<string|null>(null);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [preview, setPreview]     = useState<{src:string;type:"image"|"video"}|null>(null);
  const [docData, setDocData]     = useState<any|null>(null);
  const [docLoading, setDocLoading] = useState<string|null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit:30 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const r = await api.get("/api/v1/cars/", { params });
      setCars(r.data.cars||[]); setTotal(r.data.total||0);
    } catch(_){} finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm()); setImages([]); setVideo(""); setErr(""); setSavedCarId(null); setModal("add"); setEditCar(null); };
  const openEdit = (car:Car) => {
    setForm({ brand:car.brand||"Toyota", model:car.model||"", year:car.year||2024, color:car.color||"", condition:car.condition||"foreign used", status:car.status||"available", sellingPrice:String(car.sellingPrice||""), purchasePrice:String(car.purchasePrice||""), promoPrice:String(car.promoPrice||""), mileage:String(car.mileage||""), fuelType:car.fuelType||"petrol", transmission:car.transmission||"automatic", engineType:car.engineType||"", vin:car.vin||"", description:car.description||"", city:car.city||"", state:car.state||"" });
    setImages(car.images||[]); setVideo(car.video||""); setErr(""); setSavedCarId(car.carId); setEditCar(car); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditCar(null); setErr(""); setSavedCarId(null); };

  const ensureCarSaved = async (): Promise<string|null> => {
    if (savedCarId) return savedCarId;
    if (!form.model.trim()) { setErr("Please enter the car model before uploading photos"); return null; }
    setSaving(true);
    try {
      const payload = { ...form, year:Number(form.year), sellingPrice:Number(form.sellingPrice)||0, purchasePrice:Number(form.purchasePrice)||0, promoPrice:Number(form.promoPrice)||0, mileage:Number(form.mileage)||0, images:[], video:undefined };
      const res = await api.post("/api/v1/cars/", payload);
      const cid = res.data.carId || res.data.car?.carId;
      setSavedCarId(cid); return cid;
    } catch(ex:any) { setErr(ex.response?.data?.detail || "Save car info first"); return null; }
    finally { setSaving(false); }
  };

  const handleImgFiles = async (files: FileList) => {
    if (images.length + files.length > MAX_IMAGES) { setErr(`Maximum ${MAX_IMAGES} photos`); return; }
    setUploading(true);
    try {
      const carId = await ensureCarSaved();
      if (!carId) { setUploading(false); return; }
      const newUrls: string[] = [];
      for (let i=0; i<files.length; i++) {
        setUploadProgress(`Uploading photo ${i+1} of ${files.length}...`);
        try { const url = await uploadViaBackend(files[i], `/api/v1/upload/car/${carId}/images`); if (url) newUrls.push(url); }
        catch(e:any) { setErr(`Photo ${i+1} failed: ${e.response?.data?.detail||e.message}`); }
      }
      if (newUrls.length > 0) {
        const r = await api.get("/api/v1/cars/", { params:{ carId } }).catch(()=>null);
        const updatedCar = r?.data?.cars?.find((c:any)=>c.carId===carId);
        setImages(updatedCar?.images || [...images, ...newUrls]);
      }
      if (imgInputRef.current) imgInputRef.current.value = "";
    } catch(e:any) { setErr(e.response?.data?.detail || "Photo upload failed."); }
    finally { setUploading(false); setUploadProgress(""); }
  };

  const handleVideoFile = async (file: File) => {
    if (file.size > 100*1024*1024) { setErr("Video must be under 100MB"); return; }
    setUploading(true); setUploadProgress("Uploading video...");
    try {
      const carId = await ensureCarSaved();
      if (!carId) { setUploading(false); return; }
      const url = await uploadViaBackend(file, `/api/v1/upload/car/${carId}/video`);
      setVideo(url);
      if (vidInputRef.current) vidInputRef.current.value = "";
    } catch(e:any) { setErr(e.response?.data?.detail || "Video upload failed."); }
    finally { setUploading(false); setUploadProgress(""); }
  };

  const handleSave = async () => {
    if (!form.model.trim()) { setErr("Car model is required"); return; }
    if (!form.sellingPrice) { setErr("Selling price is required"); return; }
    setSaving(true); setErr("");
    try {
      const payload = { ...form, year:Number(form.year), sellingPrice:Number(form.sellingPrice), purchasePrice:Number(form.purchasePrice)||0, promoPrice:Number(form.promoPrice)||0, mileage:Number(form.mileage)||0 };
      if (savedCarId && modal==="add") { await api.patch(`/api/v1/cars/${savedCarId}`, payload); }
      else if (modal==="edit" && editCar) { await api.patch(`/api/v1/cars/${editCar.carId}`, payload); }
      else { await api.post("/api/v1/cars/", payload); }
      await load(); closeModal();
    } catch(ex:any) { setErr(ex.response?.data?.detail || "Save failed."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (carId:string) => {
    if (!confirm("Delete this car permanently?")) return;
    try { await api.delete(`/api/v1/cars/${carId}`); await load(); }
    catch(_) { alert("Delete failed."); }
  };

  const fetchDoc = async (carId: string, type: string) => {
    const key = `${carId}-${type}`;
    setDocLoading(key); setErr("");
    try {
      const endpoints: Record<string,string> = {
        proforma: `/api/v1/cars/${carId}/proforma-invoice`,
        invoice:  `/api/v1/cars/${carId}/invoice`,
        receipt:  `/api/v1/cars/${carId}/receipt`,
        report:   `/api/v1/cars/${carId}/report`,
      };
      const res = await api.get(endpoints[type]);
      setDocData(res.data);
    } catch(e:any) {
      setErr(e.response?.data?.detail || `Could not generate ${type}. Record a sale first for invoice/receipt.`);
    } finally { setDocLoading(null); }
  };

  const STATUS_COLORS: Record<string,string> = { available:"#16A34A", sold:"#737373", reserved:"#D97706", out_for_inspection:"#3B8BD4", in_repair:"#DC2626", on_promotion:"#7C3AED" };
  const fi: React.CSSProperties = { width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.75rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" as const };
  const lbl: React.CSSProperties = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"0.35rem" };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      {preview && <PreviewModal src={preview.src} type={preview.type} onClose={()=>setPreview(null)} />}
      {docData && <DocumentViewer doc={docData} onClose={()=>setDocData(null)} />}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Cars & Inventory</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{total} total vehicles</p>
        </div>
        <button onClick={openAdd} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",cursor:"pointer"}}>+ Add Car</button>
      </div>

      <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
        <input placeholder="Search brand, model, ID..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{flex:1,minWidth:"180px",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem 1rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",color:"#1A1A1A"}} />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem 1rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",cursor:"pointer"}}>
          <option value="all">All Status</option>
          {STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {err && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between"}}><span>{err}</span><button onClick={()=>setErr("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>X</button></div>}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : cars.length===0 ? (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",border:"1.5px dashed #E5E5E5",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
          <div style={{fontSize:"2.5rem"}}>&#x1F697;</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No cars yet</div>
          <button onClick={openAdd} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer"}}>+ Add First Car</button>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(260px,100%),1fr))",gap:"1rem"}}>
          {cars.map(car=>(
            <div key={car._id} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{height:"155px",background:"#F5F5F5",position:"relative",overflow:"hidden",cursor:car.images?.[0]?"zoom-in":"default"}}
                onClick={()=>car.images?.[0]&&setPreview({src:car.images[0],type:"image"})}>
                {car.images?.[0]
                  ? <img src={car.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2.5rem",opacity:0.2}}>&#x1F697;</div>
                }
                <div style={{position:"absolute",top:"0.5rem",left:"0.5rem",background:STATUS_COLORS[car.status]||"#737373",color:"#fff",fontSize:"0.6rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:"4px",textTransform:"capitalize"}}>
                  {car.status?.replace(/_/g," ")}
                </div>
                {(car.images?.length||0)>1&&(
                  <div style={{position:"absolute",bottom:"0.4rem",right:"0.4rem",background:"rgba(0,0,0,0.55)",color:"#fff",fontSize:"0.62rem",padding:"0.15rem 0.4rem",borderRadius:"4px"}}>
                    +{car.images.length-1} photos
                  </div>
                )}
              </div>
              <div style={{padding:"0.875rem",flex:1,display:"flex",flexDirection:"column",gap:"0.25rem"}}>
                <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{car.brand} {car.model}</div>
                <div style={{fontSize:"0.72rem",color:"#737373"}}>{car.year} &middot; {car.color} &middot; {car.transmission}</div>
                <div style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",color:"#F47B20",marginTop:"0.25rem"}}>&#x20A6;{(car.sellingPrice||0).toLocaleString()}</div>
                <div style={{fontSize:"0.62rem",color:"#A3A3A3",fontFamily:"monospace"}}>{car.carId}</div>
              </div>
              {/* Edit / Delete */}
              <div style={{display:"flex",gap:"0.5rem",padding:"0.625rem 0.75rem",borderTop:"1px solid #F0F0F0"}}>
                <button onClick={()=>openEdit(car)} style={{flex:1,background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.4rem",fontSize:"0.78rem",cursor:"pointer",color:"#525252"}}>Edit</button>
                <button onClick={()=>handleDelete(car.carId)} style={{flex:1,background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.2)",borderRadius:"6px",padding:"0.4rem",fontSize:"0.78rem",cursor:"pointer",color:"#DC2626"}}>Delete</button>
              </div>
              {/* Document buttons */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0.3rem",padding:"0 0.75rem 0.625rem"}}>
                {DOC_TYPES.map(d=>(
                  <button key={d.type} onClick={()=>fetchDoc(car.carId,d.type)}
                    disabled={docLoading===`${car.carId}-${d.type}`}
                    title={d.title}
                    style={{background:docLoading===`${car.carId}-${d.type}`?"#FFF7ED":"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.3rem 0.1rem",fontSize:"0.6rem",cursor:"pointer",color:docLoading===`${car.carId}-${d.type}`?"#F47B20":"#737373",textAlign:"center",transition:"all 0.15s",fontFamily:"var(--font-body)",fontWeight:500}}>
                    {docLoading===`${car.carId}-${d.type}`?"...":d.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:1000,overflowY:"auto",padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"600px",margin:"1rem auto",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{padding:"1.25rem 1.5rem",borderBottom:"1.5px solid #E5E5E5",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#fff",zIndex:10}}>
              <div>
                <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>{modal==="add"?"ADD NEW CAR":"EDIT CAR"}</h3>
                {savedCarId&&modal==="add"&&<div style={{fontSize:"0.68rem",color:"#16A34A",marginTop:"0.1rem"}}>Draft saved ({savedCarId})</div>}
              </div>
              <button onClick={closeModal} style={{background:"#F5F5F5",border:"none",borderRadius:"6px",width:"32px",height:"32px",cursor:"pointer",fontSize:"1rem",color:"#737373"}}>X</button>
            </div>

            <div style={{padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1.25rem",maxHeight:"72vh",overflowY:"auto"}}>
              {err && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem"}}>{err}</div>}

              <div>
                <label style={lbl}>Photos ({images.length}/{MAX_IMAGES})</label>
                {modal==="add"&&!savedCarId&&(
                  <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"6px",padding:"0.625rem 0.875rem",fontSize:"0.75rem",color:"#C4621A",marginBottom:"0.5rem",lineHeight:1.5}}>
                    Fill in model and price first, then click + to add photos.
                  </div>
                )}
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.5rem"}}>
                  {images.map((img,i)=>(
                    <div key={i} style={{position:"relative",width:"76px",height:"60px",borderRadius:"6px",overflow:"hidden",border:"1.5px solid #E5E5E5",cursor:"zoom-in"}}
                      onClick={()=>setPreview({src:img,type:"image"})}>
                      <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      <button onClick={async e=>{
                        e.stopPropagation();
                        const carId=savedCarId||editCar?.carId;
                        if(carId){try{await api.delete(`/api/v1/upload/car/${carId}/images`,{data:{image_url:img}});}catch(_){}}
                        setImages(p=>p.filter((_,j)=>j!==i));
                      }} style={{position:"absolute",top:"2px",right:"2px",background:"rgba(220,38,38,0.85)",border:"none",borderRadius:"50%",width:"18px",height:"18px",color:"#fff",fontSize:"0.6rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>X</button>
                    </div>
                  ))}
                  {images.length<MAX_IMAGES&&(
                    <button onClick={()=>imgInputRef.current?.click()} disabled={uploading}
                      style={{width:"76px",height:"60px",border:"1.5px dashed #D4D4D4",borderRadius:"6px",background:"#FAFAFA",cursor:uploading?"not-allowed":"pointer",fontSize:"1.4rem",color:"#A3A3A3",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {uploading&&uploadProgress.includes("photo")?"...":"+"}
                    </button>
                  )}
                </div>
                <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{display:"none"}} onChange={e=>{if(e.target.files?.length) handleImgFiles(e.target.files);}} />
                {uploadProgress&&<div style={{fontSize:"0.78rem",color:"#F47B20"}}>{uploadProgress}</div>}
              </div>

              <div>
                <label style={lbl}>Video (optional, max 100MB)</label>
                {video ? (
                  <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                    <video src={video} style={{width:"120px",height:"72px",objectFit:"cover",borderRadius:"6px",border:"1.5px solid #E5E5E5",cursor:"pointer"}} onClick={()=>setPreview({src:video,type:"video"})} />
                    <button onClick={async()=>{
                      const carId=savedCarId||editCar?.carId;
                      if(carId){try{await api.patch(`/api/v1/cars/${carId}`,{video:null});}catch(_){}}
                      setVideo("");
                    }} style={{background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.78rem",cursor:"pointer"}}>Remove</button>
                  </div>
                ) : (
                  <button onClick={()=>vidInputRef.current?.click()} disabled={uploading}
                    style={{background:"#F5F5F5",border:"1.5px dashed #D4D4D4",borderRadius:"8px",padding:"0.75rem 1.25rem",fontSize:"0.825rem",cursor:"pointer",color:"#737373"}}>
                    {uploading&&uploadProgress.includes("video")?"Uploading video...":"+ Upload Video"}
                  </button>
                )}
                <input ref={vidInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0]) handleVideoFile(e.target.files[0]);}} />
              </div>

              {([
                {label:"Brand *",key:"brand",type:"select",opts:BRANDS},
                {label:"Model *",key:"model",placeholder:"e.g. Camry, Accord..."},
                {label:"Year",key:"year",type:"number"},
                {label:"Color",key:"color",placeholder:"e.g. Black, White..."},
                {label:"Condition",key:"condition",type:"select",opts:CONDITIONS},
                {label:"Status",key:"status",type:"select",opts:STATUSES},
                {label:"Selling Price (NGN) *",key:"sellingPrice",type:"number"},
                {label:"Purchase Price (NGN)",key:"purchasePrice",type:"number"},
                {label:"Promo Price (NGN)",key:"promoPrice",type:"number"},
                {label:"Mileage (km)",key:"mileage",type:"number"},
                {label:"Fuel Type",key:"fuelType",type:"select",opts:FUEL_TYPES},
                {label:"Transmission",key:"transmission",type:"select",opts:TRANS},
                {label:"Engine",key:"engineType",placeholder:"e.g. V6 3.5L..."},
                {label:"VIN",key:"vin",placeholder:"Vehicle Identification Number"},
                {label:"City",key:"city",placeholder:"e.g. Lagos..."},
                {label:"State",key:"state",placeholder:"e.g. Lagos, FCT..."},
              ] as any[]).map((f:any)=>(
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  {f.type==="select"
                    ? <select value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))} style={{...fi,cursor:"pointer",textTransform:"capitalize" as const}}>
                        {(f.opts||[]).map((o:string)=><option key={o} value={o}>{o}</option>)}
                      </select>
                    : <input type={f.type||"text"} value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder||""} style={fi} />
                  }
                </div>
              ))}
              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description||""} onChange={e=>setForm((p:any)=>({...p,description:e.target.value}))} placeholder="Describe the car, features, condition, history..." rows={4} style={{...fi,resize:"vertical" as const}} />
              </div>
            </div>

            <div style={{padding:"1rem 1.5rem",borderTop:"1.5px solid #E5E5E5",display:"flex",gap:"0.75rem",background:"#FAFAFA"}}>
              <button onClick={closeModal} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Cancel</button>
              <button onClick={handleSave} disabled={saving||uploading}
                style={{flex:2,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:(saving||uploading)?0.6:1}}>
                {saving?"Saving...":(modal==="add"?"SAVE CAR":"SAVE CHANGES")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
