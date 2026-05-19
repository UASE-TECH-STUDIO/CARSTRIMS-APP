"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import MarkSoldModal from "@/components/shared/MarkSoldModal";
import CarFinancialReport from "@/components/dealer/CarFinancialReport";

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Isuzu","Other"];
const CONDITIONS = ["brand new","foreign used","locally used","salvage"];
const STATUSES   = ["available","reserved","sold","out_for_inspection","in_repair","on_promotion"];
const FUEL_TYPES = ["petrol","diesel","electric","hybrid","gas","other"];
const TRANS      = ["automatic","manual","semi-automatic","cvt"];
const MAX_IMAGES = 10;

interface Car {
  _id:string; carId:string; brand:string; model:string; year:number;
  color:string; condition:string; status:string; sellingPrice:number;
  purchasePrice:number; promoPrice:number; mileage:number; fuelType:string;
  transmission:string; engineType:string; vin:string; description:string;
  images:string[]; video:string; city:string; state:string;
}

async function uploadViaBackend(file:File, endpoint:string): Promise<string> {
  const fd = new FormData();
  fd.append(endpoint.includes("images")?"files":"file", file);
  const res = await api.post(endpoint, fd, {headers:{"Content-Type":"multipart/form-data"}});
  if (res.data.images && Array.isArray(res.data.images)) return res.data.images[res.data.images.length-1]||"";
  return res.data.video||res.data.url||res.data.secure_url||"";
}

const emptyForm = () => ({
  brand:"Toyota",model:"",year:new Date().getFullYear(),color:"",
  condition:"foreign used",status:"available",sellingPrice:"",
  purchasePrice:"",promoPrice:"",mileage:"",fuelType:"petrol",
  transmission:"automatic",engineType:"",vin:"",description:"",city:"",state:"",
});

function PreviewModal({src,type,onClose}:{src:string;type:"image"|"video";onClose:()=>void}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",maxWidth:"92vw",maxHeight:"92vh"}}>
        <button onClick={onClose} style={{position:"absolute",top:"-2rem",right:0,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"50%",width:"32px",height:"32px",color:"#fff",fontSize:"1rem",cursor:"pointer"}}>✕</button>
        {type==="image"
          ?<img src={src} alt="" style={{maxWidth:"88vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px",display:"block"}}/>
          :<video src={src} controls autoPlay style={{maxWidth:"88vw",maxHeight:"88vh",borderRadius:"8px"}}/>}
      </div>
    </div>
  );
}

export default function DealerCarsPage() {
  const [cars,setCars]         = useState<Car[]>([]);
  const [total,setTotal]       = useState(0);
  const [loading,setLoading]   = useState(true);
  const [modal,setModal]       = useState<"add"|"edit"|null>(null);
  const [editCar,setEditCar]   = useState<Car|null>(null);
  const [form,setForm]         = useState<any>(emptyForm());
  const [images,setImages]     = useState<string[]>([]);
  const [video,setVideo]       = useState("");
  const [uploading,setUploading]   = useState(false);
  const [uploadProgress,setUploadProgress] = useState("");
  const [saving,setSaving]     = useState(false);
  const [err,setErr]           = useState("");
  const [savedCarId,setSavedCarId] = useState<string|null>(null);
  const [search,setSearch]     = useState("");
  const [statusFilter,setStatusFilter] = useState("all");
  const [preview,setPreview]   = useState<{src:string;type:"image"|"video"}|null>(null);
  const [markSoldCar,setMarkSoldCar] = useState<Car|null>(null);
  const [reportCarId,setReportCarId] = useState<string|null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const params:any={limit:50};
      if(search) params.search=search;
      if(statusFilter!=="all") params.status=statusFilter;
      const r=await api.get("/api/v1/cars/",{params});
      setCars(r.data.cars||[]); setTotal(r.data.total||0);
    } catch {} finally {setLoading(false);}
  },[search,statusFilter]);

  useEffect(()=>{load();},[load]);

  const openAdd  = () => {setForm(emptyForm());setImages([]);setVideo("");setErr("");setSavedCarId(null);setModal("add");setEditCar(null);};
  const openEdit = (car:Car) => {
    setForm({brand:car.brand||"Toyota",model:car.model||"",year:car.year||2024,color:car.color||"",condition:car.condition||"foreign used",status:car.status||"available",sellingPrice:String(car.sellingPrice||""),purchasePrice:String(car.purchasePrice||""),promoPrice:String(car.promoPrice||""),mileage:String(car.mileage||""),fuelType:car.fuelType||"petrol",transmission:car.transmission||"automatic",engineType:car.engineType||"",vin:car.vin||"",description:car.description||"",city:car.city||"",state:car.state||""});
    setImages(car.images||[]);setVideo(car.video||"");setErr("");setSavedCarId(car.carId);setEditCar(car);setModal("edit");
  };
  const closeModal = () => {setModal(null);setEditCar(null);setErr("");setSavedCarId(null);};

  const ensureCarSaved = async():Promise<string|null>=>{
    if(savedCarId) return savedCarId;
    if(!form.model.trim()){setErr("Please enter the car model before uploading photos");return null;}
    setSaving(true);
    try {
      const payload={...form,year:Number(form.year),sellingPrice:Number(form.sellingPrice)||0,purchasePrice:Number(form.purchasePrice)||0,promoPrice:Number(form.promoPrice)||0,mileage:Number(form.mileage)||0,images:[],video:undefined};
      const res=await api.post("/api/v1/cars/",payload);
      const cid=res.data.carId||res.data.car?.carId;
      setSavedCarId(cid); return cid;
    } catch(ex:any){setErr(ex.response?.data?.detail||"Save car info first");return null;}
    finally{setSaving(false);}
  };

  const handleImgFiles=async(files:FileList)=>{
    if(images.length+files.length>MAX_IMAGES){setErr(`Max ${MAX_IMAGES} photos`);return;}
    setUploading(true);
    try {
      const carId=await ensureCarSaved();
      if(!carId){setUploading(false);return;}
      for(let i=0;i<files.length;i++){
        setUploadProgress(`Uploading photo ${i+1}/${files.length}…`);
        try{const url=await uploadViaBackend(files[i],`/api/v1/upload/car/${carId}/images`);if(url)setImages(p=>[...p,url]);}
        catch(e:any){setErr(`Photo ${i+1} failed: ${e.response?.data?.detail||e.message}`);}
      }
      if(imgInputRef.current)imgInputRef.current.value="";
    } catch(e:any){setErr(e.response?.data?.detail||"Upload failed");}
    finally{setUploading(false);setUploadProgress("");}
  };

  const handleVideoFile=async(file:File)=>{
    if(file.size>100*1024*1024){setErr("Video must be under 100MB");return;}
    setUploading(true);setUploadProgress("Uploading video…");
    try{
      const carId=await ensureCarSaved();if(!carId){setUploading(false);return;}
      const url=await uploadViaBackend(file,`/api/v1/upload/car/${carId}/video`);setVideo(url);
      if(vidInputRef.current)vidInputRef.current.value="";
    } catch(e:any){setErr(e.response?.data?.detail||"Video upload failed");}
    finally{setUploading(false);setUploadProgress("");}
  };

  const handleSave=async()=>{
    if(!form.model.trim()){setErr("Car model is required");return;}
    if(!form.sellingPrice){setErr("Selling price is required");return;}
    setSaving(true);setErr("");
    try{
      const payload={...form,year:Number(form.year),sellingPrice:Number(form.sellingPrice),purchasePrice:Number(form.purchasePrice)||0,promoPrice:Number(form.promoPrice)||0,mileage:Number(form.mileage)||0};
      if(savedCarId&&modal==="add"){await api.patch(`/api/v1/cars/${savedCarId}`,payload);}
      else if(modal==="edit"&&editCar){await api.patch(`/api/v1/cars/${editCar.carId}`,payload);}
      else{await api.post("/api/v1/cars/",payload);}
      await load();closeModal();
    } catch(ex:any){setErr(ex.response?.data?.detail||"Save failed");}
    finally{setSaving(false);}
  };

  const handleDelete=async(carId:string)=>{
    if(!confirm("Delete this car permanently?"))return;
    try{await api.delete(`/api/v1/cars/${carId}`);await load();}
    catch{alert("Delete failed.");}
  };

  const STATUS_C:Record<string,string>={available:"#16A34A",sold:"#737373",reserved:"#D97706",out_for_inspection:"#3B8BD4",in_repair:"#DC2626",on_promotion:"#7C3AED"};
  const fi:React.CSSProperties={width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const};
  const lbl:React.CSSProperties={fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.35rem"};

  return (
    <>
      {markSoldCar && (
        <MarkSoldModal
          car={markSoldCar}
          onClose={()=>setMarkSoldCar(null)}
          onSold={async(txn)=>{
            setMarkSoldCar(null);
            await load();
            alert(`Sale recorded! Transaction: ${txn.transactionId||"done"}`);
          }}
        />
      )}
      {reportCarId && <CarFinancialReport carId={reportCarId} onClose={()=>setReportCarId(null)}/>}
      {preview && <PreviewModal src={preview.src} type={preview.type} onClose={()=>setPreview(null)}/>}

      <div className="cars-page">
        <div className="cp-header">
          <div>
            <h2 className="cp-heading">Cars & Inventory</h2>
            <p className="cp-sub">{total} total vehicles</p>
          </div>
          <div className="cp-btns">
            <button className="btn-outline" onClick={()=>setMarkSoldCar({} as Car)}>💳 Record Sale</button>
            <button className="btn-primary" onClick={openAdd}>+ Add Car</button>
          </div>
        </div>

        <div className="cp-filters">
          <input className="cp-search" placeholder="Search brand, model, ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <select className="cp-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="cp-loading"><div className="spinner"/></div>
        ) : cars.length===0 ? (
          <div className="cp-empty">
            <div style={{fontSize:"2.5rem"}}>🚗</div>
            <div className="cp-empty-title">No cars yet</div>
            <p className="cp-empty-sub">Add your first vehicle to start building your inventory</p>
            <button className="btn-primary" onClick={openAdd}>+ Add First Car</button>
          </div>
        ) : (
          <div className="cp-grid">
            {cars.map(car=>(
              <div key={car._id} className="car-card">
                {/* Image */}
                <div className="car-img-wrap" onClick={()=>car.images?.[0]&&setPreview({src:car.images[0],type:"image"})}>
                  {car.images?.[0]
                    ?<img src={car.images[0]} alt="" className="car-img"/>
                    :<div className="car-no-img">🚗</div>
                  }
                  <div className="car-status-badge" style={{background:STATUS_C[car.status]||"#737373"}}>{car.status?.replace(/_/g," ")}</div>
                  {(car.images?.length||0)>1&&<div className="car-photo-count">+{car.images.length-1}</div>}
                </div>

                {/* Info */}
                <div className="car-info">
                  <div className="car-name">{car.brand} {car.model}</div>
                  <div className="car-meta">{car.year} · {car.color} · {car.transmission}</div>
                  <div className="car-price">₦{(car.sellingPrice||0).toLocaleString()}</div>
                  <div className="car-id">{car.carId}</div>
                </div>

                {/* Action buttons */}
                <div className="car-actions">
                  <button className="ca-btn" onClick={()=>openEdit(car)}>✏ Edit</button>
                  {car.status!=="sold"
                    ?<button className="ca-btn ca-sold" onClick={()=>setMarkSoldCar(car)}>💳 Sold</button>
                    :<button className="ca-btn ca-report" onClick={()=>setReportCarId(car.carId)}>📊 Report</button>
                  }
                  <button className="ca-btn ca-report" onClick={()=>setReportCarId(car.carId)} title="Financial Report">📊</button>
                  <button className="ca-btn ca-del" onClick={()=>handleDelete(car.carId)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit modal */}
        {modal&&(
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div className="modal-hdr">
                <div>
                  <h3 className="modal-title">{modal==="add"?"ADD NEW CAR":"EDIT CAR"}</h3>
                  {savedCarId&&modal==="add"&&<div style={{fontSize:"0.68rem",color:"#16A34A",marginTop:"0.1rem"}}>✓ Draft saved ({savedCarId})</div>}
                </div>
                <button onClick={closeModal} className="modal-close">✕</button>
              </div>
              <div className="modal-body">
                {err&&<div className="modal-err"><span>{err}</span><button onClick={()=>setErr("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button></div>}
                {/* Photos */}
                <div>
                  <label style={lbl}>Photos ({images.length}/{MAX_IMAGES})</label>
                  {modal==="add"&&!savedCarId&&<div className="upload-hint">💡 Fill model & price first, then add photos</div>}
                  <div className="photo-row">
                    {images.map((img,i)=>(
                      <div key={i} className="photo-thumb" onClick={()=>setPreview({src:img,type:"image"})}>
                        <img src={img} alt=""/>
                        <button className="photo-del" onClick={async e=>{e.stopPropagation();const cid=savedCarId||editCar?.carId;if(cid){try{await api.delete(`/api/v1/upload/car/${cid}/images`,{data:{image_url:img}});}catch{}}setImages(p=>p.filter((_,j)=>j!==i));}}>✕</button>
                      </div>
                    ))}
                    {images.length<MAX_IMAGES&&<button className="photo-add" onClick={()=>imgInputRef.current?.click()} disabled={uploading}>{uploading&&uploadProgress.includes("photo")?"⏳":"+"}</button>}
                  </div>
                  <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{display:"none"}} onChange={e=>{if(e.target.files?.length)handleImgFiles(e.target.files);}}/>
                  {uploadProgress&&<div style={{fontSize:"0.75rem",color:"#F47B20",marginTop:"0.25rem"}}>{uploadProgress}</div>}
                </div>
                {/* Video */}
                <div>
                  <label style={lbl}>Video (optional, max 100MB)</label>
                  {video?(
                    <div style={{display:"flex",gap:"0.75rem",alignItems:"center"}}>
                      <div style={{position:"relative",cursor:"pointer",width:"120px",height:"72px",borderRadius:"6px",overflow:"hidden",border:"1.5px solid #E5E5E5"}} onClick={()=>setPreview({src:video,type:"video"})}>
                        <video src={video} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.35)",fontSize:"1.5rem"}}>▶</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                        <button onClick={()=>setPreview({src:video,type:"video"})} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",color:"#525252",borderRadius:"6px",padding:"0.35rem 0.75rem",fontSize:"0.78rem",cursor:"pointer"}}>Preview</button>
                        <button onClick={async()=>{const cid=savedCarId||editCar?.carId;if(cid){try{await api.patch(`/api/v1/cars/${cid}`,{video:null});}catch{}}setVideo("");}} style={{background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.35rem 0.75rem",fontSize:"0.78rem",cursor:"pointer"}}>Remove</button>
                      </div>
                    </div>
                  ):(
                    <button onClick={()=>vidInputRef.current?.click()} disabled={uploading} style={{background:"#F5F5F5",border:"1.5px dashed #D4D4D4",borderRadius:"8px",padding:"0.75rem 1.25rem",fontSize:"0.825rem",cursor:"pointer",color:"#737373",fontFamily:"var(--font-body)"}}>
                      {uploading&&uploadProgress.includes("video")?"Uploading video…":"+ Upload Video"}
                    </button>
                  )}
                  <input ref={vidInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])handleVideoFile(e.target.files[0]);}}/>
                </div>
                {/* Form fields */}
                {([
                  {label:"Brand *",key:"brand",type:"select",opts:BRANDS},
                  {label:"Model *",key:"model",placeholder:"e.g. Camry, Accord…"},
                  {label:"Year",key:"year",type:"number"},
                  {label:"Color",key:"color",placeholder:"e.g. Black, White…"},
                  {label:"Condition",key:"condition",type:"select",opts:CONDITIONS},
                  {label:"Status",key:"status",type:"select",opts:STATUSES},
                  {label:"Selling Price (₦) *",key:"sellingPrice",type:"number"},
                  {label:"Purchase Price (₦)",key:"purchasePrice",type:"number"},
                  {label:"Promo Price (₦)",key:"promoPrice",type:"number"},
                  {label:"Mileage (km)",key:"mileage",type:"number"},
                  {label:"Fuel Type",key:"fuelType",type:"select",opts:FUEL_TYPES},
                  {label:"Transmission",key:"transmission",type:"select",opts:TRANS},
                  {label:"Engine",key:"engineType",placeholder:"e.g. V6 3.5L"},
                  {label:"VIN",key:"vin",placeholder:"Vehicle Identification Number"},
                  {label:"City",key:"city",placeholder:"e.g. Lagos"},
                  {label:"State",key:"state",placeholder:"e.g. Lagos, FCT"},
                ] as any[]).map((f:any)=>(
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    {f.type==="select"
                      ?<select value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))} style={{...fi,cursor:"pointer",textTransform:"capitalize" as const}}>{(f.opts||[]).map((o:string)=><option key={o} value={o}>{o}</option>)}</select>
                      :<input type={f.type||"text"} value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder||""} style={fi}/>
                    }
                  </div>
                ))}
                <div>
                  <label style={lbl}>Description</label>
                  <textarea value={form.description||""} onChange={e=>setForm((p:any)=>({...p,description:e.target.value}))} placeholder="Describe the car, features, condition, history…" rows={4} style={{...fi,resize:"vertical" as const}}/>
                </div>
              </div>
              <div className="modal-ftr">
                <button onClick={closeModal} className="btn-outline">Cancel</button>
                <button onClick={handleSave} disabled={saving||uploading} className="btn-primary" style={{flex:2,opacity:(saving||uploading)?0.6:1}}>
                  {saving?"Saving…":(modal==="add"?"SAVE CAR":"SAVE CHANGES")}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .cars-page{display:flex;flex-direction:column;gap:1.5rem;font-family:var(--font-body)}
          .cp-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
          .cp-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
          .cp-sub{font-size:0.8rem;color:#737373;margin-top:0.3rem}
          .cp-btns{display:flex;gap:0.5rem;flex-wrap:wrap}
          .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:background 0.2s}
          .btn-primary:hover{background:#FF9340}
          .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
          .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-size:0.875rem;cursor:pointer;font-family:var(--font-body);white-space:nowrap;transition:all 0.2s}
          .btn-outline:hover{border-color:#F47B20;color:#F47B20}
          .cp-filters{display:flex;gap:0.75rem;flex-wrap:wrap}
          .cp-search{flex:1;min-width:160px;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.625rem 1rem;font-size:0.875rem;font-family:var(--font-body);outline:none;color:#1A1A1A;transition:border-color 0.2s}
          .cp-search:focus{border-color:#F47B20}
          .cp-select{background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.625rem 0.875rem;font-size:0.875rem;font-family:var(--font-body);outline:none;cursor:pointer;color:#1A1A1A}
          .cp-loading{display:flex;align-items:center;justify-content:center;min-height:200px}
          .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
          @keyframes spin{to{transform:rotate(360deg)}}
          .cp-empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem 1rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
          .cp-empty-title{font-family:var(--font-display);font-size:1.1rem;color:#1A1A1A}
          .cp-empty-sub{color:#737373;font-size:0.875rem}
          .cp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:1rem}
          .car-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color 0.2s}
          .car-card:hover{border-color:#F47B20}
          .car-img-wrap{aspect-ratio:4/3;background:#F5F5F5;position:relative;overflow:hidden;cursor:pointer}
          .car-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s}
          .car-card:hover .car-img{transform:scale(1.03)}
          .car-no-img{display:flex;align-items:center;justify-content:center;height:100%;font-size:2.5rem;opacity:0.2}
          .car-status-badge{position:absolute;top:0.5rem;left:0.5rem;color:#fff;font-size:0.6rem;font-weight:700;padding:0.2rem 0.5rem;border-radius:4px;text-transform:capitalize}
          .car-photo-count{position:absolute;bottom:0.4rem;right:0.4rem;background:rgba(0,0,0,0.55);color:#fff;font-size:0.62rem;padding:0.15rem 0.4rem;border-radius:4px}
          .car-info{padding:0.875rem;flex:1;display:flex;flex-direction:column;gap:0.2rem}
          .car-name{font-weight:700;font-size:0.9rem;color:#1A1A1A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .car-meta{font-size:0.72rem;color:#737373;text-transform:capitalize;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .car-price{font-family:var(--font-display);font-size:1.05rem;color:#F47B20;margin-top:0.2rem}
          .car-id{font-size:0.62rem;color:#A3A3A3;font-family:monospace}
          .car-actions{display:grid;grid-template-columns:1fr auto auto auto;gap:0.3rem;padding:0.625rem 0.75rem;border-top:1px solid #F0F0F0}
          .ca-btn{background:#F5F5F5;border:1px solid #E5E5E5;border-radius:5px;padding:0.4rem 0.5rem;font-size:0.72rem;cursor:pointer;color:#525252;transition:all 0.15s;white-space:nowrap;font-family:var(--font-body)}
          .ca-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
          .ca-sold{background:#FFF7ED;border-color:rgba(244,123,32,0.4);color:#C4621A;font-weight:600}
          .ca-sold:hover{background:#F47B20!important;color:#fff!important;border-color:#F47B20!important}
          .ca-report:hover{border-color:#3B8BD4!important;color:#3B8BD4!important;background:#EFF6FF!important}
          .ca-del{color:#DC2626!important;border-color:rgba(220,38,38,0.25)!important}
          .ca-del:hover{background:#FEF2F2!important;border-color:#DC2626!important}
          .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;z-index:1000;overflow-y:auto;padding:1rem}
          .modal-box{background:#fff;border-radius:16px;width:100%;max-width:600px;margin:auto;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2)}
          .modal-hdr{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1.5px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:10}
          .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.08em;color:#1A1A1A}
          .modal-close{background:#F5F5F5;border:none;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:1rem;color:#737373}
          .modal-body{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1.1rem;max-height:68vh;overflow-y:auto}
          .modal-ftr{padding:1rem 1.5rem;border-top:1.5px solid #E5E5E5;display:flex;gap:0.75rem;background:#FAFAFA}
          .modal-err{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 0.875rem;border-radius:8px;font-size:0.825rem;display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem}
          .upload-hint{background:#FFF7ED;border:1px solid rgba(244,123,32,0.3);border-radius:6px;padding:0.5rem 0.875rem;font-size:0.72rem;color:#C4621A;margin-bottom:0.5rem}
          .photo-row{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem}
          .photo-thumb{position:relative;width:72px;height:56px;border-radius:6px;overflow:hidden;border:1.5px solid #E5E5E5;cursor:zoom-in;flex-shrink:0}
          .photo-thumb img{width:100%;height:100%;object-fit:cover;display:block}
          .photo-del{position:absolute;top:2px;right:2px;background:rgba(220,38,38,0.85);border:none;border-radius:50%;width:18px;height:18px;color:#fff;font-size:0.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
          .photo-add{width:72px;height:56px;border:1.5px dashed #D4D4D4;border-radius:6px;background:#FAFAFA;cursor:pointer;font-size:1.4rem;color:#A3A3A3;display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .photo-add:disabled{cursor:not-allowed}
          @media(max-width:640px){.cp-grid{grid-template-columns:1fr 1fr}.car-actions{grid-template-columns:1fr 1fr 1fr 1fr}}
          @media(max-width:380px){.cp-grid{grid-template-columns:1fr}}
        `}</style>
      </div>
    </>
  );
}
