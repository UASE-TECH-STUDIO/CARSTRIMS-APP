"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import FormattedNumberInput from "@/components/ui/FormattedNumberInput";
import CustomSelect from "@/components/ui/CustomSelect";
import { rowsToExcelBlob, renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";
import { useConfirm } from "@/store/confirmStore";

const SC: Record<string,{bg:string;color:string;label:string}> = {
  pending:           {bg:"#FFF7ED",  color:"#D97706", label:"Pending"},
  countered:         {bg:"#F5F3FF",  color:"#7B68EE", label:"Counter Offer"},
  accepted_by_dealer:{bg:"#F0FDF4",  color:"#16A34A", label:"Dealer Accepted"},
  accepted:          {bg:"#F0FDF4",  color:"#16A34A", label:"In Progress"},
  declined:          {bg:"#FEF2F2",  color:"#DC2626", label:"Declined"},
  cancelled:         {bg:"#F5F5F5",  color:"#888",    label:"Cancelled"},
  aborted:           {bg:"#FEF2F2",  color:"#DC2626", label:"Aborted"},
  completed:         {bg:"#EFF6FF",  color:"#3B8BD4", label:"Completed"},
  responded:         {bg:"#F0FDF4",  color:"#16A34A", label:"Responded"},
  rejected:          {bg:"#FEF2F2",  color:"#DC2626", label:"Rejected"},
};

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Nissan","Audi","Land Rover","Jeep","Peugeot","Mitsubishi","Subaru","Volkswagen","Other"];
const TRANS  = ["automatic","manual","semi-automatic","cvt","any"];
const FUELS  = ["petrol","diesel","electric","hybrid","any"];
const CONDS  = ["brand new","foreign used","locally used","any"];
const MAX_PHOTOS = 3;

const blank = {
  carBrand:"Toyota",carModel:"",carYear:new Date().getFullYear(),carColor:"",
  condition:"any",transmission:"any",fuelType:"any",
  budget:"",paymentType:"full",description:"",dealerId:"",
  referencePhotos:[] as string[],
};

const fi: React.CSSProperties = {
  background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",
  padding:"0.65rem 0.875rem",color:"#1A1A1A",fontSize:"0.875rem",
  fontFamily:"var(--font-body)",outline:"none",width:"100%",boxSizing:"border-box"
};
const lbl: React.CSSProperties = {
  fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",
  textTransform:"uppercase",color:"#525252",display:"block",marginBottom:"0.3rem"
};

type Mode = "view"|"edit"|"new";

export default function UserRequestsPage() {
  const [requests,   setRequests]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [mode,       setMode]       = useState<Mode|null>(null);
  const [active,     setActive]     = useState<any>(null);
  const [form,       setForm]       = useState({...blank});
  const [dealers,    setDealers]    = useState<any[]>([]);
  const [dealerSearch,setDealerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState("");
  const [lightbox,   setLightbox]   = useState<string|null>(null);
  const [showAbort,  setShowAbort]  = useState(false);
  const [abortReason,setAbortReason]= useState("");
  const [aborting,   setAborting]   = useState(false);
  const photoRef    = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/api/v1/users/requests");
      setRequests(Array.isArray(r.data) ? r.data : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (dealerSearch.length < 2) { setDealers([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/api/v1/public/dealers",{params:{search:dealerSearch,limit:10}});
        setDealers(r.data.dealers||[]);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [dealerSearch]);

  const setField = useCallback((key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const openNew = () => {
    setForm({...blank}); setDealerSearch(""); setError(""); setMode("new"); setActive(null);
  };

  // Deep link support for the navigation search ("make a request" ->
  // takes them here and opens the new-request form directly).
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openNew();
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openView = (r:any) => {
    setActive(r); setMode("view"); setError(""); setShowAbort(false); setAbortReason("");
  };
  const openEdit = (r:any) => {
    setForm({
      carBrand: r.carBrand||"Toyota", carModel: r.carModel||"",
      carYear: r.carYear||new Date().getFullYear(), carColor: r.carColor||"",
      condition: r.condition||"any", transmission: r.transmission||"any", fuelType: r.fuelType||"any",
      budget: r.budget?String(r.budget):"", paymentType: r.paymentType||"full",
      description: r.description||"", dealerId: r.dealerId||"",
      referencePhotos: r.referencePhotos?.length ? r.referencePhotos : (r.referencePhoto?[r.referencePhoto]:[]),
    });
    setDealerSearch(r.dealerName||"");
    setActive(r); setMode("edit"); setError("");
  };
  const close = () => { setMode(null); setActive(null); setError(""); setShowAbort(false); };

  const uploadPhoto = async (file:File) => {
    if (form.referencePhotos.length >= MAX_PHOTOS) { setError(`Max ${MAX_PHOTOS} photos`); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file",file);
      const res = await api.post("/api/v1/upload/temp/image",fd,{headers:{"Content-Type":"multipart/form-data"}});
      const url = res.data.url||res.data.secure_url||"";
      if (url) setForm(f=>({...f,referencePhotos:[...f.referencePhotos,url]}));
    } catch { setError("Photo upload failed"); } finally { setUploading(false); }
  };

  const removePhoto = useCallback((i:number) => {
    setForm(f=>({...f,referencePhotos:f.referencePhotos.filter((_,j)=>j!==i)}));
  }, []);

  const doAction = async (id:string, endpoint:string, body?:any) => {
    try { await api.post(`/api/v1/users/requests/${id}/${endpoint}`,body||{}); load(); close(); }
    catch(e:any) { showToast(e.response?.data?.detail||"Action failed", "error"); }
  };

  const submitNew = async (e:React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      await api.post("/api/v1/users/requests",{
        ...form,
        budget: form.budget?Number(form.budget):undefined,
        carYear: Number(form.carYear),
        condition: form.condition==="any"?undefined:form.condition,
        transmission: form.transmission==="any"?undefined:form.transmission,
        fuelType: form.fuelType==="any"?undefined:form.fuelType,
        referencePhoto: form.referencePhotos[0]||undefined,
        referencePhotos: form.referencePhotos,
      });
      close(); load();
    } catch(err:any) { setError(err.response?.data?.detail||"Failed. Please try again."); }
    finally { setSubmitting(false); }
  };

  const submitEdit = async (e:React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await api.patch(`/api/v1/users/requests/${active.requestId||active._id}`,{
        ...form,
        budget: form.budget?Number(form.budget):undefined,
        carYear: Number(form.carYear),
        condition: form.condition==="any"?undefined:form.condition,
        transmission: form.transmission==="any"?undefined:form.transmission,
        fuelType: form.fuelType==="any"?undefined:form.fuelType,
        referencePhoto: form.referencePhotos[0]||undefined,
        referencePhotos: form.referencePhotos,
      });
      close(); load();
    } catch(err:any) { setError(err.response?.data?.detail||"Failed to save changes."); }
    finally { setSaving(false); }
  };

  const submitAbort = async () => {
    if (!abortReason.trim()) { setError("Please provide a reason for aborting."); return; }
    setAborting(true); setError("");
    try {
      await api.post(`/api/v1/users/requests/${active.requestId||active._id}/abort`,{reason:abortReason});
      close(); load();
    } catch(e:any) { setError(e.response?.data?.detail||"Failed to abort."); }
    finally { setAborting(false); }
  };

  const fmtDate = (iso:any) => iso?new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):"";
  const showToast = useToast();
  const askConfirm = useConfirm();
  const [exportBusy, setExportBusy] = useState<""|"pdf"|"jpg"|"excel">("");
  const [showExportPicker, setShowExportPicker] = useState(false);

  const buildRequestsExportHtml = () => {
    const now = new Date().toLocaleString("en-NG");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
          *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;font-size:12px}
          h1{font-size:18px;margin:0 0 4px} .sub{color:#737373;font-size:11px;margin-bottom:16px}
          table{width:100%;border-collapse:collapse}
          th{background:#1A1A1A;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase}
          td{padding:7px 10px;border-bottom:1px solid #E5E5E5;font-size:11px}
          tr:nth-child(even) td{background:#FAFAFA}
          .footer{margin-top:16px;font-size:9px;color:#A3A3A3;text-align:center}
          </style></head><body>
          <h1>My Vehicle Requests</h1>
          <div class="sub">${requests.length} request${requests.length!==1?"s":""} &bull; Generated ${now}</div>
          <table><thead><tr><th>Vehicle</th><th>Budget</th><th>Sent To</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${requests.map((r:any)=>`<tr><td>${r.carBrand||""} ${r.carModel||""} ${r.carYear||""}</td><td>${r.budget?"NGN "+Number(r.budget).toLocaleString():"-"}</td><td>${r.dealerName||"All dealers"}</td><td>${(SC[r.status]||SC.pending).label}</td><td>${fmtDate(r.createdAt)}</td></tr>`).join("")}</tbody>
          </table>
          <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
          </body></html>`;
  };

  const handleRequestsExport = async (format: "pdf" | "jpg" | "excel") => {
    setShowExportPicker(false);
    setExportBusy(format);
    try {
      const filename = `carstrims-my-requests-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob(requests.map((r:any) => ({
          "Request ID": r.requestId, Vehicle: `${r.carBrand||""} ${r.carModel||""} ${r.carYear||""}`,
          Condition: r.condition || "", Budget: r.budget || "",
          "Sent To": r.dealerName || "All dealers", Status: (SC[r.status]||SC.pending).label,
          Date: fmtDate(r.createdAt),
        })), "My Requests");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const html = buildRequestsExportHtml();
        const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "My Vehicle Requests");
        await downloadBlob(blob, `${filename}.${format}`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Export failed", "error");
    } finally {
      setExportBusy("");
    }
  };

  const canEdit  = (r:any) => r.status==="pending";
  const canAbort = (r:any) => !["cancelled","completed","aborted","declined"].includes(r.status);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>

      {/* Lightbox */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.2rem",width:"38px",height:"38px",borderRadius:"50%",cursor:"pointer"}}>X</button>
          <img src={lightbox} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Vehicle Requests</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>Request a specific vehicle - dealers will respond</p>
        </div>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap" as const,alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowExportPicker(v=>!v)} disabled={exportBusy!==""} style={{background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.7rem 1rem",fontSize:"0.85rem",cursor:"pointer",fontWeight:600}}>
              {exportBusy ? "Exporting…" : "Export"}
            </button>
            {showExportPicker && (
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"120px",maxWidth:"calc(100vw - 2rem)"}}>
                <button onClick={()=>handleRequestsExport("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
                <button onClick={()=>handleRequestsExport("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
                <button onClick={()=>handleRequestsExport("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as Excel</button>
              </div>
            )}
          </div>
          <button onClick={openNew} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap"}}>
            + New Request
          </button>
        </div>
      </div>

      {/* List */}
      {loading?(
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ):requests.length===0?(
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
          <div style={{fontSize:"2.5rem"}}>🚗</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No requests yet</h3>
          <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:1.6,maxWidth:"380px"}}>Cannot find the vehicle you want? Place a request and dealers will respond.</p>
          <button onClick={openNew} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer"}}>Place a Request</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
          {requests.map(r=>{
            const sc = SC[r.status]||SC.pending;
            const photos = r.referencePhotos?.length?r.referencePhotos:(r.referencePhoto?[r.referencePhoto]:[]);
            const hasAction = r.status==="countered";
            const hasUpdate = r.journey?.milestones?.length>0||r.journey?.paymentPlan;
            return (
              <div key={r._id||r.requestId} style={{background:"#fff",border:`1.5px solid ${hasAction?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",overflow:"hidden",boxShadow:hasAction?"0 2px 16px rgba(244,123,32,0.12)":"none"}}>
                <div onClick={()=>openView(r)} style={{padding:"1rem 1.25rem",cursor:"pointer",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}
                  onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFFAF7"}
                  onMouseOut={e=>(e.currentTarget as HTMLElement).style.background=""}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"monospace",fontSize:"0.65rem",color:"#AAA",marginBottom:"0.15rem"}}>{r.requestId}</div>
                    <div style={{fontWeight:700,fontSize:"1rem",color:"#1A1A1A"}}>{r.carBrand} {r.carModel} {r.carYear||""}</div>
                    <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.2rem",display:"flex",gap:"0.625rem",flexWrap:"wrap"}}>
                      {r.carColor&&<span>{r.carColor}</span>}
                      {r.condition&&r.condition!=="any"&&<span>{r.condition}</span>}
                      {r.budget&&<span style={{color:"#F47B20",fontWeight:600}}>NGN {Number(r.budget).toLocaleString()}</span>}
                      {photos.length>0&&<span style={{color:"#A3A3A3"}}>📷 {photos.length} photo{photos.length>1?"s":""}</span>}
                    </div>
                    <div style={{fontSize:"0.68rem",color:"#A3A3A3",marginTop:"0.25rem"}}>
                      {r.dealerName?`Sent to: ${r.dealerName}`:"Sent to all dealers"} · {fmtDate(r.createdAt)}
                    </div>
                    {hasAction&&<div style={{fontSize:"0.72rem",color:"#7B68EE",fontWeight:700,marginTop:"0.25rem"}}>Counter offer from dealer - tap to view</div>}
                    {hasUpdate&&<div style={{fontSize:"0.72rem",color:"#16A34A",fontWeight:600,marginTop:"0.15rem"}}>Order update available</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.375rem",flexShrink:0}}>
                    <span style={{background:sc.bg,color:sc.color,padding:"0.22rem 0.625rem",borderRadius:"20px",fontSize:"0.68rem",fontWeight:700,border:`1px solid ${sc.color}44`}}>{sc.label}</span>
                    <span style={{fontSize:"0.65rem",color:"#A3A3A3"}}>Tap to view</span>
                  </div>
                </div>
                {(canEdit(r)||canAbort(r))&&(
                  <div style={{display:"flex",borderTop:"1px solid #F5F5F5"}}>
                    {canEdit(r)&&(
                      <button onClick={()=>openEdit(r)} style={{flex:1,padding:"0.625rem",background:"none",border:"none",borderRight:"1px solid #F5F5F5",color:"#F47B20",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,fontFamily:"var(--font-body)"}}>Edit Request</button>
                    )}
                    {canAbort(r)&&(
                      <button onClick={()=>{openView(r);setShowAbort(true);}} style={{flex:1,padding:"0.625rem",background:"none",border:"none",color:"#DC2626",fontSize:"0.78rem",cursor:"pointer",fontWeight:600,fontFamily:"var(--font-body)"}}>Abort Request</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {mode&&(
        <div onClick={close} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",maxWidth:"600px",height:"95vh",display:"flex",flexDirection:"column",borderRadius:"16px 16px 0 0",overflow:"hidden"}}>

            <div style={{display:"flex",justifyContent:"center",padding:"0.5rem 0 0",flexShrink:0}}>
              <div style={{width:"36px",height:"4px",background:"#E5E5E5",borderRadius:"2px"}}/>
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1.25rem",borderBottom:"1px solid #E5E5E5",flexShrink:0}}>
              <div>
                <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.06em",color:"#1A1A1A"}}>
                  {mode==="new"?"NEW VEHICLE REQUEST":mode==="edit"?"EDIT REQUEST":`${active?.carBrand} ${active?.carModel} ${active?.carYear||""}`}
                </div>
                {mode==="view"&&active&&(
                  <div style={{fontSize:"0.72rem",color:SC[active.status]?.color||"#888",fontWeight:700,marginTop:"0.1rem"}}>{SC[active.status]?.label||active.status}</div>
                )}
              </div>
              <button onClick={close} style={{background:"#F5F5F5",border:"none",color:"#525252",width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>X</button>
            </div>

            <div style={{overflowY:"auto",flex:1,minHeight:0}}>
              <div style={{padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem",paddingBottom:"2rem"}}>

                {error&&<div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem",borderRadius:"8px",fontSize:"0.875rem",fontWeight:500}}>{error}</div>}

                {/* VIEW */}
                {mode==="view"&&active&&(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                      {[
                        ["Vehicle",`${active.carBrand} ${active.carModel} ${active.carYear||""}`],
                        ["Color",active.carColor||"Any"],
                        ["Budget",active.budget?`NGN ${Number(active.budget).toLocaleString()}`:"Not set"],
                        ["Payment",active.paymentType],
                        ["Condition",active.condition||"Any"],
                        ["Gearbox",active.transmission||"Any"],
                        ["Fuel",active.fuelType||"Any"],
                        ["Sent to",active.dealerName||"All dealers"],
                        ["Status",SC[active.status]?.label||active.status],
                        ["Date",fmtDate(active.createdAt)],
                      ].map(([l,v])=>(
                        <div key={l} style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"7px",padding:"0.6rem 0.75rem"}}>
                          <div style={{fontSize:"0.6rem",textTransform:"uppercase" as const,letterSpacing:"0.06em",color:"#AAA",marginBottom:"0.18rem",fontWeight:700}}>{l}</div>
                          <div style={{fontSize:"0.83rem",color:"#1A1A1A",fontWeight:600,textTransform:"capitalize" as const}}>{String(v||"")}</div>
                        </div>
                      ))}
                    </div>

                    {active.description&&(
                      <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.875rem"}}>
                        <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.35rem",fontWeight:700}}>Your Notes</div>
                        <p style={{fontSize:"0.9rem",color:"#1A1A1A",lineHeight:1.65,margin:0}}>{active.description}</p>
                      </div>
                    )}

                    {(()=>{
                      const photos = active.referencePhotos?.length?active.referencePhotos:(active.referencePhoto?[active.referencePhoto]:[]);
                      if(!photos.length) return null;
                      return (
                        <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.875rem"}}>
                          <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.5rem",fontWeight:700}}>Reference Photos ({photos.length})</div>
                          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                            {photos.map((url:string,i:number)=>(
                              <img key={i} src={url} alt="" onClick={()=>setLightbox(url)} style={{width:"96px",height:"72px",objectFit:"cover",borderRadius:"7px",border:"1.5px solid #E5E5E5",cursor:"zoom-in"}}/>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {active.dealerResponse&&(
                      <div style={{background:"#F0FDF4",border:"1.5px solid #86EFAC",borderRadius:"8px",padding:"1rem"}}>
                        <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#16A34A",marginBottom:"0.35rem"}}>Dealer Response</div>
                        {active.dealerName&&<div style={{fontSize:"0.72rem",color:"#737373",marginBottom:"0.25rem"}}>From: {active.dealerName}</div>}
                        <p style={{fontSize:"0.9rem",color:"#1A1A1A",lineHeight:1.6,margin:0,fontWeight:500}}>{active.dealerResponse}</p>
                        {active.dealerResponseAt&&<div style={{fontSize:"0.68rem",color:"#A3A3A3",marginTop:"0.35rem"}}>Responded {fmtDate(active.dealerResponseAt)}</div>}
                      </div>
                    )}

                    {active.counterOffer&&active.status==="countered"&&(
                      <div style={{background:"#F5F3FF",border:"1.5px solid rgba(123,104,238,0.35)",borderRadius:"10px",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                        <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#7B68EE"}}>{active.dealerName} Has an Alternative</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                          {[
                            ["Vehicle",`${active.counterOffer.carBrand||""} ${active.counterOffer.carModel||""} ${active.counterOffer.carYear||""}`],
                            ["Price",`NGN ${(active.counterOffer.price||0).toLocaleString()}`],
                            ["Condition",active.counterOffer.condition||""],
                            ["Delivery",active.counterOffer.estimatedDelivery||"TBD"],
                          ].filter(([,v])=>v).map(([l,v])=>(
                            <div key={String(l)} style={{background:"#fff",borderRadius:"6px",padding:"0.5rem 0.625rem"}}>
                              <div style={{fontSize:"0.6rem",color:"#AAA",marginBottom:"0.15rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{l}</div>
                              <div style={{fontWeight:600,fontSize:"0.82rem",color:"#1A1A1A"}}>{v||""}</div>
                            </div>
                          ))}
                        </div>
                        {active.counterOffer.description&&<p style={{fontSize:"0.82rem",color:"#525252",margin:0,lineHeight:1.55}}>{active.counterOffer.description}</p>}
                        <div style={{display:"flex",gap:"0.5rem"}}>
                          <button onClick={()=>doAction(active.requestId||active._id,"accept")} style={{flex:1,background:"#16A34A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",fontWeight:700}}>Accept Offer</button>
                          <button onClick={async ()=>{if(!(await askConfirm({message:"Decline this offer?",danger:true})))return;doAction(active.requestId||active._id,"decline",{reason:"Declined by buyer"});}} style={{flex:1,background:"#FEF2F2",color:"#DC2626",border:"1.5px solid #FECACA",borderRadius:"8px",padding:"0.75rem",fontSize:"0.82rem",cursor:"pointer",fontWeight:600}}>Decline</button>
                        </div>
                      </div>
                    )}

                    {active.journey?.milestones?.length>0&&(
                      <div style={{display:"flex",flexDirection:"column",gap:"0.625rem"}}>
                        <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373"}}>Order Journey</div>
                        {[...active.journey.milestones].reverse().map((m:any,i:number)=>(
                          <div key={i} style={{display:"flex",gap:"0.75rem",alignItems:"flex-start",background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.75rem"}}>
                            <div style={{width:"26px",height:"26px",borderRadius:"50%",background:i===0?"#F47B20":"#E5E5E5",color:i===0?"#fff":"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",fontWeight:700,flexShrink:0}}>{i===0?"NEW":i+1}</div>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:"0.85rem",color:"#1A1A1A"}}>{m.title}</div>
                              <div style={{fontSize:"0.7rem",color:"#A3A3A3",marginBottom:"0.25rem"}}>{m.addedAt?new Date(m.addedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):""}</div>
                              {m.description&&<p style={{fontSize:"0.8rem",color:"#525252",margin:"0 0 0.375rem",lineHeight:1.5}}>{m.description}</p>}
                              {m.evidence?.length>0&&(
                                <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
                                  {m.evidence.map((url:string,ei:number)=>(
                                    <img key={ei} src={url} alt="" onClick={()=>setLightbox(url)} style={{width:"60px",height:"45px",objectFit:"cover",borderRadius:"5px",border:"1px solid #E5E5E5",cursor:"zoom-in"}}/>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {active.journey?.paymentPlan&&(
                      <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
                        <div style={{padding:"0.625rem 0.875rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.68rem",letterSpacing:"0.1em",color:"#525252"}}>PAYMENT PLAN</div>
                        <div style={{padding:"0.875rem",display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                          <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{active.journey.paymentPlan.type==="full"?"Full Payment":"Installments"} — NGN {(active.journey.paymentPlan.totalAmount||0).toLocaleString()}</div>
                          {active.journey.paymentPlan.installments?.map((inst:any,i:number)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.5rem 0",borderBottom:"1px solid #F5F5F5",flexWrap:"wrap",gap:"0.5rem"}}>
                              <div>
                                <div style={{fontWeight:600,fontSize:"0.82rem"}}>{inst.label||`Installment ${i+1}`}</div>
                                <div style={{fontSize:"0.72rem",color:"#888"}}>NGN {(inst.amount||0).toLocaleString()} · {inst.dueDate||"TBD"}</div>
                                {inst.evidence&&<a href={inst.evidence} target="_blank" rel="noreferrer" style={{fontSize:"0.7rem",color:"#F47B20",fontWeight:600}}>View Receipt</a>}
                              </div>
                              <span style={{fontSize:"0.7rem",fontWeight:700,padding:"0.18rem 0.5rem",borderRadius:"20px",background:inst.paid?"#F0FDF4":"#FFF7ED",color:inst.paid?"#15803D":"#D97706"}}>{inst.paid?"Paid":"Pending"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {canAbort(active)&&(
                      <div style={{border:`1.5px solid ${showAbort?"#DC2626":"#E5E5E5"}`,borderRadius:"10px",overflow:"hidden",transition:"border-color 0.2s"}}>
                        <button onClick={()=>setShowAbort(!showAbort)} style={{width:"100%",padding:"0.875rem 1rem",background:showAbort?"#FEF2F2":"#FAFAFA",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.08em",color:showAbort?"#DC2626":"#737373",fontWeight:700}}>
                          <span>ABORT THIS REQUEST</span>
                          <span>{showAbort?"▼":"▶"}</span>
                        </button>
                        {showAbort&&(
                          <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem",background:"#FFFAFA",borderTop:"1px solid #FEE2E2"}}>
                            <div style={{fontSize:"0.82rem",color:"#525252",lineHeight:1.55}}>{active.status==="pending"?"You can abort this request before any dealer responds.":"You are aborting an active order. The dealer will be notified immediately."}</div>
                            <div>
                              <label style={{...lbl,color:"#DC2626"}}>Reason for aborting *</label>
                              <textarea rows={3} value={abortReason} onChange={e=>setAbortReason(e.target.value)} placeholder="e.g. Found the vehicle elsewhere, changed my mind..." style={{...fi,resize:"vertical",borderColor:abortReason?"#FECACA":"#E5E5E5",background:"#fff"}}/>
                            </div>
                            <div style={{display:"flex",gap:"0.5rem"}}>
                              <button onClick={()=>setShowAbort(false)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.75rem",fontSize:"0.82rem",cursor:"pointer",fontWeight:600}}>Keep Request</button>
                              <button onClick={submitAbort} disabled={aborting||!abortReason.trim()} style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",fontWeight:700,opacity:aborting||!abortReason.trim()?0.55:1}}>{aborting?"Aborting...":"Confirm Abort"}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {canEdit(active)&&!showAbort&&(
                      <button onClick={()=>openEdit(active)} style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.85rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700}}>Edit Request</button>
                    )}
                  </>
                )}

                {/* NEW / EDIT FORM — inputs defined inline, no nested components */}
                {(mode==="new"||mode==="edit")&&(
                  <form onSubmit={mode==="new"?submitNew:submitEdit} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                    {mode==="edit"&&(
                      <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.82rem",color:"#C4621A",fontWeight:500}}>
                        You are editing your request. Only pending requests can be edited.
                      </div>
                    )}

                    {/* Brand + Model */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                      <div>
                        <label style={lbl}>Brand *</label>
                        <CustomSelect value={form.carBrand} onChange={(v)=>setField("carBrand",v)} options={BRANDS.map((b:string)=>({value:b,label:b}))} />
                      </div>
                      <div>
                        <label style={lbl}>Model *</label>
                        <input
                          style={fi}
                          placeholder="e.g. Camry"
                          value={form.carModel}
                          onChange={e=>setField("carModel",e.target.value)}
                          required
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    {/* Year + Color */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                      <div>
                        <label style={lbl}>Year</label>
                        <input
                          type="number"
                          style={fi}
                          value={form.carYear}
                          onChange={e=>setField("carYear",Number(e.target.value))}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label style={lbl}>Color</label>
                        <input
                          style={fi}
                          placeholder="e.g. Black"
                          value={form.carColor}
                          onChange={e=>setField("carColor",e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    {/* Condition + Gearbox + Fuel */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.625rem"}}>
                      <div>
                        <label style={lbl}>Condition</label>
                        <CustomSelect value={form.condition} onChange={(v)=>setField("condition",v)} options={CONDS.map((c:string)=>({value:c,label:c.charAt(0).toUpperCase()+c.slice(1)}))} />
                      </div>
                      <div>
                        <label style={lbl}>Gearbox</label>
                        <CustomSelect value={form.transmission} onChange={(v)=>setField("transmission",v)} options={TRANS.map((t:string)=>({value:t,label:t.toUpperCase()}))} />
                      </div>
                      <div>
                        <label style={lbl}>Fuel</label>
                        <CustomSelect value={form.fuelType} onChange={(v)=>setField("fuelType",v)} options={FUELS.map((f:string)=>({value:f,label:f.charAt(0).toUpperCase()+f.slice(1)}))} />
                      </div>
                    </div>

                    {/* Budget + Payment */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                      <div>
                        <label style={lbl}>Budget (NGN)</label>
                        <FormattedNumberInput
                          style={fi}
                          placeholder="Max budget"
                          value={form.budget}
                          onChange={(raw)=>setField("budget",raw)}
                        />
                      </div>
                      <div>
                        <label style={lbl}>Payment Type</label>
                        <CustomSelect value={form.paymentType} onChange={(v)=>setField("paymentType",v)} options={["full","installment","lease"].map((p:string)=>({value:p,label:p.charAt(0).toUpperCase()+p.slice(1)}))} />
                      </div>
                    </div>

                    {/* Dealer search */}
                    <div style={{position:"relative"}}>
                      <label style={lbl}>Specific Dealer (blank = all dealers)</label>
                      <input
                        style={fi}
                        placeholder="Search dealer..."
                        value={dealerSearch}
                        onChange={e=>{setDealerSearch(e.target.value);setField("dealerId","");}}
                        autoComplete="off"
                      />
                      {dealers.length>0&&(
                        <div style={{position:"absolute",top:"calc(100%+4px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",zIndex:60,maxHeight:"150px",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}>
                          {dealers.map(d=>(
                            <div key={d._id} onClick={()=>{setField("dealerId",d._id);setDealerSearch(d.companyName);setDealers([]);}}
                              style={{padding:"0.625rem 1rem",cursor:"pointer",borderBottom:"1px solid #F5F5F5",fontSize:"0.875rem",color:"#1A1A1A"}}
                              onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
                              onMouseOut={e=>e.currentTarget.style.background=""}>
                              {d.companyName} <span style={{color:"#A3A3A3",fontSize:"0.72rem"}}>{d.city||""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {form.dealerId&&<div style={{marginTop:"0.3rem",fontSize:"0.7rem",color:"#16A34A",fontWeight:600}}>Sending to: {dealerSearch}</div>}
                      {!form.dealerId&&!dealerSearch&&<div style={{marginTop:"0.3rem",fontSize:"0.7rem",color:"#A3A3A3"}}>Will be sent to ALL dealers</div>}
                    </div>

                    {/* Description */}
                    <div>
                      <label style={lbl}>Additional Details</label>
                      <textarea
                        style={{...fi,minHeight:"72px",resize:"vertical"}}
                        placeholder="Specific features, trim level, preferences..."
                        value={form.description}
                        onChange={e=>setField("description",e.target.value)}
                      />
                    </div>

                    {/* Photos */}
                    <div>
                      <label style={lbl}>Reference Photos (up to {MAX_PHOTOS})</label>
                      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.35rem"}}>
                        {form.referencePhotos.map((url,i)=>(
                          <div key={url} style={{position:"relative"}}>
                            <img src={url} alt="" onClick={()=>setLightbox(url)} style={{width:"84px",height:"63px",objectFit:"cover",borderRadius:"6px",border:"1.5px solid #E5E5E5",cursor:"zoom-in",display:"block"}}/>
                            <button type="button" onClick={()=>removePhoto(i)} style={{position:"absolute",top:"-5px",right:"-5px",background:"#DC2626",color:"#fff",border:"none",borderRadius:"50%",width:"18px",height:"18px",cursor:"pointer",fontSize:"0.6rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>X</button>
                          </div>
                        ))}
                        {form.referencePhotos.length<MAX_PHOTOS&&(
                          <button type="button" onClick={()=>photoRef.current?.click()} disabled={uploading}
                            style={{width:"84px",height:"63px",background:"#F5F5F5",border:"1.5px dashed #D4D4D4",borderRadius:"6px",cursor:"pointer",color:"#737373",fontSize:"0.75rem",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.15rem",opacity:uploading?0.6:1}}>
                            <span style={{fontSize:"1.4rem",lineHeight:1}}>+</span>
                            <span>{uploading?"...":"Photo"}</span>
                          </button>
                        )}
                        <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadPhoto(e.target.files[0]);e.target.value="";}}/>
                      </div>
                      <div style={{fontSize:"0.65rem",color:"#A3A3A3"}}>{form.referencePhotos.length}/{MAX_PHOTOS} uploaded</div>
                    </div>

                    {/* Submit */}
                    <div style={{display:"flex",gap:"0.75rem",position:"sticky",bottom:0,background:"#fff",paddingTop:"0.5rem",paddingBottom:"0.25rem"}}>
                      <button type="button" onClick={close} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-body)",fontSize:"0.9rem",cursor:"pointer"}}>Cancel</button>
                      <button type="submit" disabled={submitting||saving||!form.carModel}
                        style={{flex:2,background:submitting||saving||!form.carModel?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:submitting||saving||!form.carModel?"not-allowed":"pointer",fontWeight:700}}>
                        {submitting||saving?"Saving...":mode==="new"?"SEND REQUEST":"SAVE CHANGES"}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
