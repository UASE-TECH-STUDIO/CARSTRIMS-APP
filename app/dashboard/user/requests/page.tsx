"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

const STATUS_C: Record<string,{bg:string;color:string}> = {
  pending:   {bg:"#FFF7ED",color:"#D97706"},
  responded: {bg:"#F0FDF4",color:"#16A34A"},
  rejected:  {bg:"#FEF2F2",color:"#DC2626"},
  completed: {bg:"#EFF6FF",color:"#3B8BD4"},
};

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Nissan","Audi","Land Rover","Jeep","Peugeot","Mitsubishi","Subaru","Volkswagen","Other"];
const TRANS  = ["automatic","manual","semi-automatic","cvt","any"];
const FUELS  = ["petrol","diesel","electric","hybrid","any"];
const CONDS  = ["brand new","foreign used","locally used","any"];

const emptyForm = {
  carBrand:"Toyota", carModel:"", carYear:new Date().getFullYear(), carColor:"",
  condition:"any", transmission:"any", fuelType:"any",
  budget:"", paymentType:"full", description:"", dealerId:"", referencePhoto:"",
};

export default function UserRequestsPage() {
  const [requests,setRequests]   = useState<any[]>([]);
  const [loading,setLoading]     = useState(true);
  const [showNew,setShowNew]     = useState(false);
  const [dealers,setDealers]     = useState<any[]>([]);
  const [dealerSearch,setDealerSearch] = useState("");
  const [form,setForm]           = useState(emptyForm);
  const [submitting,setSubmitting] = useState(false);
  const [error,setError]         = useState("");
  const [photoUploading,setPhotoUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const r = await api.get("/api/v1/users/requests");
      setRequests(Array.isArray(r.data)?r.data:[]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(()=>{load();},[]);

  useEffect(()=>{
    if (dealerSearch.length<2){setDealers([]);return;}
    const t = setTimeout(async()=>{
      try {
        const r = await api.get("/api/v1/public/dealers",{params:{search:dealerSearch,limit:10}});
        setDealers(r.data.dealers||[]);
      } catch {}
    },300);
    return ()=>clearTimeout(t);
  },[dealerSearch]);

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try {
      const fd = new FormData(); fd.append("file",file);
      const res = await api.post("/api/v1/upload/temp/image", fd, {headers:{"Content-Type":"multipart/form-data"}});
      const url = res.data.url||res.data.secure_url||"";
      setForm(f=>({...f,referencePhoto:url}));
    } catch { setError("Photo upload failed"); }
    finally { setPhotoUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      await api.post("/api/v1/users/requests",{
        ...form,
        budget: form.budget?Number(form.budget):undefined,
        carYear: Number(form.carYear),
        condition: form.condition==="any"?undefined:form.condition,
        transmission: form.transmission==="any"?undefined:form.transmission,
        fuelType: form.fuelType==="any"?undefined:form.fuelType,
      });
      setShowNew(false); setForm(emptyForm); setDealerSearch(""); load();
    } catch (err:any){setError(err.response?.data?.detail||"Failed. Please try again.");}
    finally{setSubmitting(false);}
  };

  const fmtDate = (iso:string)=>iso?new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):"—";

  const fi: React.CSSProperties = {background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.9rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",boxSizing:"border-box" as const,transition:"border-color 0.2s"};
  const lbl: React.CSSProperties = {fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.35rem"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Vehicle Requests</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>Request a specific vehicle — dealers will respond with matching options</p>
        </div>
        <button onClick={()=>setShowNew(true)} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap"}}>
          + New Request
        </button>
      </div>

      {loading?(
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ):requests.length===0?(
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
          <div style={{fontSize:"2.5rem"}}>📩</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No requests yet</h3>
          <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:1.6,maxWidth:"380px"}}>Can not find the car you are looking for? Place a request and dealers will respond with matching vehicles.</p>
          <button onClick={()=>setShowNew(true)} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer"}}>Place a Request</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {requests.map(r=>{
            const sc = STATUS_C[r.status]||STATUS_C.pending;
            return (
              <div key={r._id||r.requestId} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontFamily:"monospace",fontSize:"0.68rem",color:"#AAA",marginBottom:"0.2rem"}}>{r.requestId}</div>
                    <div style={{fontWeight:700,fontSize:"1rem",color:"#1A1A1A"}}>{r.carBrand} {r.carModel} {r.carYear||""}</div>
                    {r.carColor&&<div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.1rem"}}>Color: {r.carColor}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.4rem",flexShrink:0}}>
                    <span style={{background:sc.bg,color:sc.color,padding:"0.25rem 0.75rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:700,textTransform:"capitalize" as const,border:`1px solid ${sc.color}44`}}>{r.status}</span>
                    <span style={{fontSize:"0.68rem",color:"#A3A3A3"}}>{fmtDate(r.createdAt)}</span>
                  </div>
                </div>

                {/* Details */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem 1.5rem"}}>
                  {r.budget&&<div style={{display:"flex",gap:"0.5rem"}}><span style={{fontSize:"0.7rem",color:"#AAA",minWidth:"80px"}}>Budget</span><span style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",color:"#F47B20",fontWeight:700}}>NGN {Number(r.budget).toLocaleString()}</span></div>}
                  {r.paymentType&&<div style={{display:"flex",gap:"0.5rem"}}><span style={{fontSize:"0.7rem",color:"#AAA",minWidth:"80px"}}>Payment</span><span style={{fontSize:"0.875rem",color:"#404040",textTransform:"capitalize" as const}}>{r.paymentType}</span></div>}
                  {r.condition&&r.condition!=="any"&&<div style={{display:"flex",gap:"0.5rem"}}><span style={{fontSize:"0.7rem",color:"#AAA",minWidth:"80px"}}>Condition</span><span style={{fontSize:"0.875rem",color:"#404040",textTransform:"capitalize" as const}}>{r.condition}</span></div>}
                  {r.transmission&&r.transmission!=="any"&&<div style={{display:"flex",gap:"0.5rem"}}><span style={{fontSize:"0.7rem",color:"#AAA",minWidth:"80px"}}>Gearbox</span><span style={{fontSize:"0.875rem",color:"#404040",textTransform:"capitalize" as const}}>{r.transmission}</span></div>}
                  {r.dealerName&&<div style={{display:"flex",gap:"0.5rem",gridColumn:"1/-1"}}><span style={{fontSize:"0.7rem",color:"#AAA",minWidth:"80px"}}>Dealer</span><span style={{fontSize:"0.875rem",color:"#404040"}}>{r.dealerName}</span></div>}
                  {!r.dealerId&&<div style={{display:"flex",gap:"0.5rem",gridColumn:"1/-1"}}><span style={{fontSize:"0.7rem",color:"#AAA",minWidth:"80px"}}>Sent to</span><span style={{fontSize:"0.875rem",color:"#404040"}}>All dealers</span></div>}
                </div>

                {r.description&&<div style={{fontSize:"0.875rem",color:"#525252",lineHeight:1.55,background:"#F5F5F5",borderRadius:"6px",padding:"0.75rem"}}>{r.description}</div>}
                {r.referencePhoto&&<img src={r.referencePhoto} alt="Reference" style={{width:"100%",maxWidth:"280px",borderRadius:"8px",border:"1.5px solid #E5E5E5"}}/>}

                {/* Dealer response */}
                {r.dealerResponse&&(
                  <div style={{background:"#F0FDF4",border:"1.5px solid #86EFAC",borderRadius:"8px",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                    <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#16A34A"}}>Dealer Response</div>
                    {r.dealerName&&<div style={{fontSize:"0.72rem",color:"#737373"}}>From: {r.dealerName}</div>}
                    <div style={{fontSize:"0.9rem",color:"#1A1A1A",lineHeight:1.6,fontWeight:500}}>{r.dealerResponse}</div>
                    {r.dealerResponseAt&&<div style={{fontSize:"0.68rem",color:"#A3A3A3"}}>Responded {fmtDate(r.dealerResponseAt)}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NEW REQUEST MODAL */}
      {showNew&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"560px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1.25rem 1.5rem",background:"#1A1A1A",borderRadius:"16px 16px 0 0",position:"sticky",top:0,zIndex:1}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.1em",color:"#F47B20"}}>NEW VEHICLE REQUEST</div>
              <button onClick={()=>setShowNew(false)} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"1rem"}}>X</button>
            </div>
            <form onSubmit={submit} style={{padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
              {error&&<div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Brand *</label>
                  <select style={fi} value={form.carBrand} onChange={e=>setForm({...form,carBrand:e.target.value})}>
                    {BRANDS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Model *</label><input style={fi} placeholder="e.g. Camry" value={form.carModel} onChange={e=>setForm({...form,carModel:e.target.value})} required/></div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Year</label><input type="number" style={fi} value={form.carYear} onChange={e=>setForm({...form,carYear:Number(e.target.value)})}/></div>
                <div><label style={lbl}>Color (optional)</label><input style={fi} placeholder="e.g. Black" value={form.carColor} onChange={e=>setForm({...form,carColor:e.target.value})}/></div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.75rem"}}>
                <div><label style={lbl}>Condition</label>
                  <select style={fi} value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}>
                    {CONDS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Gearbox</label>
                  <select style={fi} value={form.transmission} onChange={e=>setForm({...form,transmission:e.target.value})}>
                    {TRANS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Fuel</label>
                  <select style={fi} value={form.fuelType} onChange={e=>setForm({...form,fuelType:e.target.value})}>
                    {FUELS.map(f=><option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Budget (NGN)</label><input type="number" style={fi} placeholder="Your max budget" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/></div>
                <div><label style={lbl}>Payment Type</label>
                  <select style={fi} value={form.paymentType} onChange={e=>setForm({...form,paymentType:e.target.value})}>
                    {["full","installment","lease"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Dealer search */}
              <div style={{position:"relative"}}>
                <label style={lbl}>Specific Dealer (leave blank to broadcast to all dealers)</label>
                <input style={fi} placeholder="Search dealer name..." value={dealerSearch} onChange={e=>{setDealerSearch(e.target.value);setForm({...form,dealerId:""});}}/>
                {dealers.length>0&&(
                  <div style={{position:"absolute",top:"calc(100%+4px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",zIndex:50,maxHeight:"160px",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}>
                    {dealers.map(d=>(
                      <div key={d._id} onClick={()=>{setForm({...form,dealerId:d._id});setDealerSearch(d.companyName);setDealers([]);}}
                        style={{padding:"0.75rem 1rem",cursor:"pointer",borderBottom:"1px solid #F5F5F5",fontSize:"0.875rem",color:"#1A1A1A",fontWeight:500}}
                        onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
                        onMouseOut={e=>e.currentTarget.style.background=""}>
                        {d.companyName} <span style={{color:"#A3A3A3",fontSize:"0.72rem",fontWeight:400}}>· {d.city||""}</span>
                      </div>
                    ))}
                  </div>
                )}
                {form.dealerId&&<div style={{marginTop:"0.35rem",fontSize:"0.72rem",color:"#16A34A",fontWeight:600}}>Sending to: {dealerSearch}</div>}
                {!form.dealerId&&!dealerSearch&&<div style={{marginTop:"0.35rem",fontSize:"0.72rem",color:"#A3A3A3"}}>Will be sent to all dealers on the platform</div>}
              </div>

              <div><label style={lbl}>Additional Details</label>
                <textarea style={{...fi,minHeight:"80px",resize:"vertical" as const}} placeholder="Specific features, trim level, history, any other preferences..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
              </div>

              {/* Reference photo */}
              <div>
                <label style={lbl}>Reference Photo (optional — attach a picture of the car you want)</label>
                {form.referencePhoto?(
                  <div style={{display:"flex",alignItems:"center",gap:"0.875rem"}}>
                    <img src={form.referencePhoto} alt="" style={{width:"100px",height:"72px",objectFit:"cover",borderRadius:"6px",border:"1.5px solid #E5E5E5"}}/>
                    <button type="button" onClick={()=>setForm({...form,referencePhoto:""})} style={{background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.78rem",cursor:"pointer"}}>Remove</button>
                  </div>
                ):(
                  <button type="button" onClick={()=>photoRef.current?.click()} disabled={photoUploading}
                    style={{background:"#F5F5F5",border:"1.5px dashed #D4D4D4",borderRadius:"8px",padding:"0.75rem 1.25rem",fontSize:"0.825rem",cursor:"pointer",color:"#737373",display:"block",width:"100%",textAlign:"center"}}>
                    {photoUploading?"Uploading...":"+ Attach Reference Photo"}
                  </button>
                )}
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])handlePhotoUpload(e.target.files[0]);e.target.value="";}}/>
              </div>

              <div style={{display:"flex",gap:"0.75rem",marginTop:"0.5rem"}}>
                <button type="button" onClick={()=>setShowNew(false)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-body)",fontSize:"0.9rem",cursor:"pointer"}}>Cancel</button>
                <button type="submit" disabled={submitting||!form.carModel} style={{flex:2,background:submitting||!form.carModel?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:submitting||!form.carModel?"not-allowed":"pointer"}}>
                  {submitting?"Sending...":"SEND REQUEST"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
