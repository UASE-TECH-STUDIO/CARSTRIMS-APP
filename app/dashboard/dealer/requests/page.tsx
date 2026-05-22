"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

const STATUS_C: Record<string,string> = {
  pending:"#D97706", accepted_by_dealer:"#16A34A", countered:"#7B68EE",
  accepted:"#16A34A", declined:"#DC2626", cancelled:"#888",
  completed:"#3B8BD4", cancelled_by_buyer:"#888",
};
const STATUS_L: Record<string,string> = {
  pending:"Pending", accepted_by_dealer:"You Accepted", countered:"Counter Sent",
  accepted:"Buyer Accepted", declined:"Buyer Declined", cancelled:"Cancelled",
  completed:"Completed", cancelled_by_buyer:"Buyer Cancelled",
};
const STAGES = [
  {id:"payment_received",label:"Payment Received"},
  {id:"car_purchased",  label:"Vehicle Purchased"},
  {id:"shipped",        label:"Shipped"},
  {id:"arrived_country",label:"Arrived in Country"},
  {id:"in_transit",     label:"In Transit to Buyer"},
  {id:"delivered",      label:"Delivered to Buyer"},
  {id:"update",         label:"General Update"},
];

function Field({label,value}:{label:string;value:any}) {
  if (!value || value === "any" || value === "Any") return null;
  return (
    <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"7px",padding:"0.6rem 0.75rem"}}>
      <div style={{fontSize:"0.6rem",textTransform:"uppercase" as const,letterSpacing:"0.06em",color:"#AAA",marginBottom:"0.18rem",fontWeight:700}}>{label}</div>
      <div style={{fontSize:"0.85rem",color:"#1A1A1A",fontWeight:600,textTransform:"capitalize" as const}}>{String(value)}</div>
    </div>
  );
}

export default function DealerRequestsPage() {
  const [requests,  setRequests]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<any>(null);
  const [filter,    setFilter]    = useState("all");
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");
  const [tab,       setTab]       = useState<"details"|"journey"|"payment">("details");
  const [lightbox,  setLightbox]  = useState<string|null>(null);

  // Respond form
  const [responseType, setResponseType] = useState<"accept"|"counter">("accept");
  const [responseMsg,  setResponseMsg]  = useState("");
  const [altBrand, setAltBrand] = useState("");
  const [altModel, setAltModel] = useState("");
  const [altYear,  setAltYear]  = useState("");
  const [altColor, setAltColor] = useState("");
  const [altCond,  setAltCond]  = useState("foreign used");
  const [altPrice, setAltPrice] = useState("");
  const [altDesc,  setAltDesc]  = useState("");
  const [altDelivery, setAltDelivery] = useState("");

  // Milestone form
  const [msStage,   setMsStage]   = useState("update");
  const [msTitle,   setMsTitle]   = useState("");
  const [msDesc,    setMsDesc]    = useState("");
  const [msEvidence,setMsEvidence]= useState<string[]>([]);
  const [msUploading,setMsUploading]=useState(false);
  const evidenceRef = useRef<HTMLInputElement>(null);

  // Payment plan form
  const [planType,     setPlanType]    = useState<"full"|"installmental">("full");
  const [planTotal,    setPlanTotal]   = useState("");
  const [installments, setInstallments]= useState([{label:"Initial deposit",amount:"",dueDate:"",paid:false}]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/users/requests/dealer");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const open = (r:any) => {
    setSelected(r); setMsg(""); setTab("details");
    setResponseType("accept"); setResponseMsg("");
    setAltBrand(""); setAltModel(""); setAltYear(""); setAltColor("");
    setAltCond("foreign used"); setAltPrice(""); setAltDesc(""); setAltDelivery("");
  };
  const close = () => { setSelected(null); setMsg(""); };

  const refresh = async () => {
    load();
    if (selected) {
      try {
        const fresh = await api.get(`/api/v1/users/requests/${selected.requestId||selected._id}`);
        if (fresh?.data) setSelected(fresh.data);
      } catch {}
    }
  };

  const submitResponse = async () => {
    if (!selected) return;
    setSaving(true); setMsg("");
    try {
      const payload: any = { type: responseType, message: responseMsg };
      if (responseType === "counter") {
        payload.altBrand = altBrand; payload.altModel = altModel;
        payload.altYear  = altYear;  payload.altColor = altColor;
        payload.altCondition = altCond; payload.altPrice = altPrice ? Number(altPrice) : undefined;
        payload.altDescription = altDesc; payload.estimatedDelivery = altDelivery;
      }
      await api.post(`/api/v1/users/requests/${selected.requestId||selected._id}/respond`, payload);
      setMsg(responseType === "accept"
        ? "Accepted! Journey started. Go to Payment tab to set up payment plan."
        : "Counter-offer sent to buyer! They will be notified.");
      refresh();
    } catch(e:any) { setMsg("Error: " + (e.response?.data?.detail || "Failed to send")); }
    finally { setSaving(false); }
  };

  const uploadEvidence = async (file: File) => {
    setMsUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/api/v1/upload/temp/image", fd, { headers:{"Content-Type":"multipart/form-data"} });
      const url = r.data?.url || r.data?.secure_url;
      if (url) setMsEvidence(prev => [...prev, url]);
    } catch { setMsg("Upload failed"); }
    finally { setMsUploading(false); }
  };

  const submitMilestone = async () => {
    if (!selected || !msTitle) return;
    setSaving(true); setMsg("");
    try {
      await api.post(`/api/v1/users/requests/${selected.requestId||selected._id}/milestone`, {
        stage: msStage, title: msTitle, description: msDesc, evidence: msEvidence,
      });
      setMsg("Update posted! Buyer has been notified.");
      setMsTitle(""); setMsDesc(""); setMsEvidence([]);
      refresh();
    } catch(e:any) { setMsg("Error: " + (e.response?.data?.detail || "Failed")); }
    finally { setSaving(false); }
  };

  const submitPlan = async () => {
    if (!selected || !planTotal) return;
    setSaving(true); setMsg("");
    try {
      await api.post(`/api/v1/users/requests/${selected.requestId||selected._id}/payment-plan`, {
        type: planType, totalAmount: parseFloat(planTotal), currency: "NGN",
        installments: planType === "installmental"
          ? installments.map(i => ({...i, amount: parseFloat(i.amount)||0}))
          : [],
      });
      setMsg("Payment plan sent to buyer!");
      refresh();
    } catch(e:any) { setMsg("Error: " + (e.response?.data?.detail || "Failed")); }
    finally { setSaving(false); }
  };

  const fmt     = (n:number)   => `NGN ${(n||0).toLocaleString()}`;
  const fmtDate = (iso:any)    => !iso ? "" : new Date(iso).toLocaleString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

  const filtered     = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pending      = requests.filter(r => r.status === "pending").length;
  const canRespond   = selected?.status === "pending";
  const journeyActive= selected && ["accepted_by_dealer","accepted","completed"].includes(selected.status);
  const paymentActive= selected && ["accepted_by_dealer","accepted"].includes(selected.status);

  const inp: React.CSSProperties = {
    width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5",
    borderRadius:"7px", padding:"0.55rem 0.75rem", fontSize:"0.875rem",
    fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize:"0.62rem", color:"#888", fontWeight:700,
    textTransform:"uppercase", letterSpacing:"0.05em",
    display:"block", marginBottom:"0.3rem",
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem",paddingBottom:"2rem"}}>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.2rem",width:"38px",height:"38px",borderRadius:"50%",cursor:"pointer"}}>X</button>
          <img src={lightbox} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Customer Requests</h2>
          <p style={{fontSize:"0.8rem",color:"#888",marginTop:"0.3rem"}}>
            {requests.length} total
            {pending > 0 && <span style={{color:"#D97706",fontWeight:700}}> &bull; {pending} need response</span>}
          </p>
        </div>
        <button onClick={load} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>Refresh</button>
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
        {[["all","All"],["pending","Pending"],["accepted_by_dealer","Accepted"],["countered","Counter Sent"],["accepted","Buyer Accepted"],["completed","Completed"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{background:filter===v?"#F47B20":"transparent",color:filter===v?"#fff":"#888",border:`1.5px solid ${filter===v?"#F47B20":"#DDD"}`,borderRadius:"20px",padding:"0.3rem 0.875rem",fontSize:"0.72rem",cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}>
            {l}
            {v==="pending"&&pending>0&&<span style={{background:"rgba(255,255,255,0.3)",borderRadius:"20px",padding:"0 0.35rem",marginLeft:"0.3rem",fontSize:"0.65rem",fontWeight:700}}>{pending}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"200px"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.875rem",padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff"}}>
          <div style={{fontSize:"3rem"}}>&#x1F697;</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No requests</h3>
          <p style={{color:"#888",fontSize:"0.875rem"}}>Customer vehicle requests appear here</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {filtered.map(r => {
            const sc = STATUS_C[r.status]||"#888";
            const isPending = r.status === "pending";
            const photos = r.referencePhotos?.length ? r.referencePhotos : (r.referencePhoto ? [r.referencePhoto] : []);
            return (
              <div key={r._id||r.requestId} onClick={()=>open(r)}
                style={{background:"#fff",border:`1.5px solid ${isPending?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",padding:"1rem 1.25rem",cursor:"pointer",transition:"all 0.2s",boxShadow:isPending?"0 2px 12px rgba(244,123,32,0.1)":"none"}}
                onMouseOver={e=>(e.currentTarget as HTMLElement).style.borderColor="#F47B20"}
                onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor=isPending?"#F47B20":"#E5E5E5"}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"0.875rem",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:"160px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.25rem"}}>
                      <span style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{r.carBrand} {r.carModel} {r.carYear||""}</span>
                      {isPending && <span style={{fontSize:"0.67rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.4)",borderRadius:"20px",padding:"0.1rem 0.45rem",fontWeight:700}}>Action needed</span>}
                    </div>
                    <div style={{fontSize:"0.78rem",color:"#737373"}}>{r.userName||"Buyer"} &bull; {r.paymentType}</div>
                    {r.budget && <div style={{fontSize:"0.78rem",color:"#F47B20",fontWeight:600}}>Budget: {fmt(r.budget)}</div>}
                    {photos.length > 0 && <div style={{fontSize:"0.7rem",color:"#A3A3A3",marginTop:"0.15rem"}}>&#x1F4F7; {photos.length} photo{photos.length>1?"s":""} attached</div>}
                    {r.description && <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.15rem",fontStyle:"italic"}}>{r.description.slice(0,80)}{r.description.length>80?"...":""}</div>}
                    <div style={{fontSize:"0.68rem",color:"#AAA",marginTop:"0.2rem"}}>{fmtDate(r.createdAt)}</div>
                  </div>
                  <span style={{padding:"0.2rem 0.625rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:700,color:sc,border:`1px solid ${sc}44`,background:`${sc}11`,flexShrink:0}}>
                    {STATUS_L[r.status]||r.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 
          DETAIL MODAL  full-screen overlay, scrollable bottom sheet on mobile
           */}
      {selected && (
        <div onClick={close}
          style={{
            position:"fixed", inset:0, zIndex:2000,
            background:"rgba(0,0,0,0.5)",
            display:"flex",
            // On mobile: sheet from bottom. On desktop: centered.
            alignItems:"flex-end",
            justifyContent:"center",
          }}>
          <div onClick={e=>e.stopPropagation()}
            style={{
              background:"#fff",
              width:"100%",
              maxWidth:"680px",
              // KEY FIX: let the sheet grow to 95vh and SCROLL internally
              height:"95vh",
              display:"flex",
              flexDirection:"column",
              borderRadius:"16px 16px 0 0",
              // NO overflow:hidden here - that was killing scroll
              overflow:"hidden",
            }}>

            {/* Drag handle (mobile UX) */}
            <div style={{display:"flex",justifyContent:"center",padding:"0.5rem 0 0",flexShrink:0}}>
              <div style={{width:"40px",height:"4px",background:"#E5E5E5",borderRadius:"2px"}}/>
            </div>

            {/* Header - FIXED, never scrolls */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1.25rem",borderBottom:"1px solid #E5E5E5",flexShrink:0,background:"#fff"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.06em",color:"#1A1A1A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {selected.carBrand} {selected.carModel} {selected.carYear}
                </div>
                <div style={{fontSize:"0.72rem",color:STATUS_C[selected.status]||"#888",fontWeight:700,marginTop:"0.15rem"}}>
                  {STATUS_L[selected.status]||selected.status}
                </div>
              </div>
              <button onClick={close}
                style={{background:"#F5F5F5",border:"none",color:"#525252",fontSize:"0.8rem",cursor:"pointer",width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0,marginLeft:"0.5rem"}}>
                X
              </button>
            </div>

            {/* Tabs - FIXED */}
            <div style={{display:"flex",borderBottom:"1px solid #E5E5E5",background:"#FAFAFA",flexShrink:0}}>
              {[["details","Details"],["journey","Journey"],["payment","Payment"]].map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t as any)}
                  style={{flex:1,padding:"0.75rem 0.5rem",border:"none",background:"none",borderBottom:tab===t?"2.5px solid #F47B20":"2.5px solid transparent",color:tab===t?"#F47B20":"#888",fontFamily:"var(--font-display)",fontSize:"0.68rem",letterSpacing:"0.08em",cursor:"pointer",textTransform:"uppercase" as const,fontWeight:tab===t?700:400,transition:"all 0.15s"}}>
                  {l}
                </button>
              ))}
            </div>

            {/*  SCROLLABLE BODY  this is the ONLY scrolling region */}
            <div style={{overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch" as any}}>
              <div style={{padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem",paddingBottom:"2rem"}}>

                {/* Message banner */}
                {msg && (
                  <div style={{background:msg.startsWith("Error")?"#FEF2F2":"#F0FDF4",border:"1px solid",borderColor:msg.startsWith("Error")?"#FECACA":"#86EFAC",borderRadius:"8px",padding:"0.875rem 1rem",fontSize:"0.85rem",color:msg.startsWith("Error")?"#DC2626":"#15803D",fontWeight:600,lineHeight:1.5}}>
                    {msg}
                  </div>
                )}

                {/*  DETAILS TAB  */}
                {tab === "details" && (
                  <>
                    {/* Buyer contact card */}
                    <div style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",borderRadius:"12px",padding:"1rem",display:"flex",gap:"0.875rem",alignItems:"center"}}>
                      <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"#F47B20",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.25rem",fontFamily:"var(--font-display)",flexShrink:0}}>
                        {(selected.buyerName||selected.userName||"B").charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:"0.95rem",color:"#1A1A1A"}}>{selected.buyerName||selected.userName||"Buyer"}</div>
                        {selected.buyerEmail && <div style={{fontSize:"0.75rem",color:"#737373",marginTop:"0.1rem"}}>{selected.buyerEmail}</div>}
                        <div style={{display:"flex",gap:"0.375rem",marginTop:"0.4rem",flexWrap:"wrap"}}>
                          {(selected.userPhone||selected.buyerPhone) && (
                            <a href={`tel:${selected.userPhone||selected.buyerPhone}`}
                              style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:"6px",padding:"0.3rem 0.625rem",fontSize:"0.72rem",textDecoration:"none",fontWeight:600}}>
                              Call
                            </a>
                          )}
                          {(selected.buyerWhatsapp||selected.userWhatsapp) && (
                            <a href={`https://wa.me/${(selected.buyerWhatsapp||selected.userWhatsapp).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                              style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",borderRadius:"6px",padding:"0.3rem 0.625rem",fontSize:"0.72rem",textDecoration:"none",fontWeight:600}}>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ALL request fields */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                      <Field label="Vehicle" value={`${selected.carBrand} ${selected.carModel} ${selected.carYear||""}`.trim()}/>
                      <Field label="Color" value={selected.carColor||"Any"}/>
                      <Field label="Budget" value={selected.budget ? `NGN ${Number(selected.budget).toLocaleString()}` : "Not specified"}/>
                      <Field label="Payment" value={selected.paymentType}/>
                      <Field label="Condition" value={selected.condition||"Any"}/>
                      <Field label="Gearbox" value={selected.transmission||"Any"}/>
                      <Field label="Fuel Type" value={selected.fuelType||"Any"}/>
                      <Field label="Sent to" value={selected.dealerId?"This dealer only":"All dealers (general)"}/>
                      <Field label="Requested" value={fmtDate(selected.createdAt)}/>
                      <Field label="Status" value={STATUS_L[selected.status]||selected.status}/>
                    </div>

                    {/* Description / notes */}
                    {selected.description && (
                      <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"10px",padding:"1rem"}}>
                        <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.4rem",fontWeight:700}}>Buyer Notes</div>
                        <p style={{fontSize:"0.9rem",color:"#1A1A1A",lineHeight:1.65,margin:0}}>{selected.description}</p>
                      </div>
                    )}

                    {/* Reference photos  show all */}
                    {(()=>{
                      const photos = selected.referencePhotos?.length
                        ? selected.referencePhotos
                        : selected.referencePhoto
                          ? [selected.referencePhoto]
                          : [];
                      if (!photos.length) return null;
                      return (
                        <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"10px",padding:"1rem"}}>
                          <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.625rem",fontWeight:700}}>
                            Reference Photos ({photos.length})
                          </div>
                          <div style={{display:"flex",gap:"0.625rem",flexWrap:"wrap"}}>
                            {photos.map((url:string,i:number)=>(
                              <img key={i} src={url} alt={`ref ${i+1}`}
                                onClick={()=>setLightbox(url)}
                                style={{width:"100px",height:"75px",objectFit:"cover",borderRadius:"8px",border:"1.5px solid #E5E5E5",cursor:"zoom-in",display:"block"}}/>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Counter-offer already sent */}
                    {selected.counterOffer && (
                      <div style={{background:"#F5F3FF",border:"1.5px solid rgba(123,104,238,0.3)",borderRadius:"10px",padding:"1rem"}}>
                        <div style={{fontSize:"0.68rem",textTransform:"uppercase" as const,letterSpacing:"0.08em",color:"#7B68EE",fontWeight:800,marginBottom:"0.625rem"}}>Your Counter-Offer (Sent)</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.375rem",marginBottom:"0.5rem"}}>
                          {[
                            ["Vehicle",`${selected.counterOffer.carBrand||""} ${selected.counterOffer.carModel||""} ${selected.counterOffer.carYear||""}`.trim()],
                            ["Price",`NGN ${(selected.counterOffer.price||0).toLocaleString()}`],
                            ["Condition",selected.counterOffer.condition||""],
                            ["Delivery",selected.counterOffer.estimatedDelivery||"TBD"],
                          ].filter(([,v])=>v).map(([l,v])=>(
                            <div key={String(l)} style={{background:"#fff",borderRadius:"6px",padding:"0.4rem 0.5rem"}}>
                              <div style={{fontSize:"0.58rem",color:"#AAA",marginBottom:"0.1rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{l}</div>
                              <div style={{fontWeight:600,fontSize:"0.8rem",color:"#1A1A1A"}}>{v||""}</div>
                            </div>
                          ))}
                        </div>
                        {selected.counterOffer.description && <p style={{fontSize:"0.8rem",color:"#525252",margin:0,lineHeight:1.5}}>{selected.counterOffer.description}</p>}
                      </div>
                    )}

                    {/*  RESPOND FORM (only for pending)  */}
                    {canRespond && (
                      <div style={{border:"2px solid #F47B20",borderRadius:"12px",overflow:"hidden"}}>
                        {/* Respond header */}
                        <div style={{padding:"0.875rem 1rem",background:"#F47B20",fontFamily:"var(--font-display)",fontSize:"0.75rem",letterSpacing:"0.1em",color:"#fff",fontWeight:700}}>
                          RESPOND TO THIS REQUEST
                        </div>
                        <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"1rem"}}>

                          {/* Response type buttons */}
                          <div>
                            <div style={lbl}>Your response</div>
                            <div style={{display:"flex",gap:"0.625rem"}}>
                              <button onClick={()=>setResponseType("accept")}
                                style={{flex:1,padding:"0.75rem 0.5rem",borderRadius:"8px",border:`2px solid ${responseType==="accept"?"#16A34A":"#E5E5E5"}`,background:responseType==="accept"?"#F0FDF4":"#fff",color:responseType==="accept"?"#16A34A":"#737373",fontSize:"0.82rem",cursor:"pointer",fontWeight:responseType==="accept"?700:400,transition:"all 0.2s"}}>
                                I Can Fulfil This
                              </button>
                              <button onClick={()=>setResponseType("counter")}
                                style={{flex:1,padding:"0.75rem 0.5rem",borderRadius:"8px",border:`2px solid ${responseType==="counter"?"#7B68EE":"#E5E5E5"}`,background:responseType==="counter"?"#F5F3FF":"#fff",color:responseType==="counter"?"#7B68EE":"#737373",fontSize:"0.82rem",cursor:"pointer",fontWeight:responseType==="counter"?700:400,transition:"all 0.2s"}}>
                                Suggest Alternative
                              </button>
                            </div>
                          </div>

                          {/* Counter-offer fields */}
                          {responseType === "counter" && (
                            <div style={{background:"#F5F3FF",border:"1px solid rgba(123,104,238,0.2)",borderRadius:"10px",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                              <div style={{fontSize:"0.7rem",fontWeight:800,color:"#7B68EE",textTransform:"uppercase" as const,letterSpacing:"0.08em"}}>Alternative Vehicle Details</div>
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.625rem"}}>
                                <div><label style={lbl}>Brand</label><input value={altBrand} onChange={e=>setAltBrand(e.target.value)} style={inp} placeholder="e.g. Toyota"/></div>
                                <div><label style={lbl}>Model</label><input value={altModel} onChange={e=>setAltModel(e.target.value)} style={inp} placeholder="e.g. Camry"/></div>
                                <div><label style={lbl}>Year</label><input value={altYear}  onChange={e=>setAltYear(e.target.value)}  style={inp} placeholder="2023"/></div>
                                <div><label style={lbl}>Color</label><input value={altColor} onChange={e=>setAltColor(e.target.value)} style={inp} placeholder="e.g. Black"/></div>
                                <div><label style={lbl}>Price (NGN)</label><input type="number" value={altPrice} onChange={e=>setAltPrice(e.target.value)} style={inp} placeholder="0"/></div>
                                <div><label style={lbl}>Est. Delivery</label><input value={altDelivery} onChange={e=>setAltDelivery(e.target.value)} style={inp} placeholder="4-6 weeks"/></div>
                              </div>
                              <div><label style={lbl}>Description</label>
                                <textarea value={altDesc} onChange={e=>setAltDesc(e.target.value)} rows={3}
                                  placeholder="Describe the alternative vehicle..."
                                  style={{...inp, resize:"vertical" as const, minHeight:"80px"}}/>
                              </div>
                            </div>
                          )}

                          {/* Message to buyer */}
                          <div>
                            <label style={lbl}>Message to Buyer</label>
                            <textarea value={responseMsg} onChange={e=>setResponseMsg(e.target.value)} rows={3}
                              placeholder={responseType==="accept"
                                ? "e.g. We can source this vehicle for you. Here are the next steps..."
                                : "e.g. We cannot get your exact vehicle, but we have a great alternative..."}
                              style={{...inp, resize:"vertical" as const, minHeight:"80px"}}/>
                          </div>

                          {/* Action buttons */}
                          <div style={{display:"flex",gap:"0.625rem"}}>
                            <button onClick={submitResponse} disabled={saving}
                              style={{flex:1,background:responseType==="accept"?"#16A34A":"#7B68EE",color:"#fff",border:"none",borderRadius:"10px",padding:"1rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700,opacity:saving?0.6:1,transition:"opacity 0.2s"}}>
                              {saving ? "Sending..." : responseType==="accept" ? "Accept & Start Journey" : "Send Counter-Offer"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/*  JOURNEY TAB  */}
                {tab === "journey" && (
                  <>
                    {!selected.journey?.milestones?.length ? (
                      <div style={{textAlign:"center",padding:"2rem",color:"#A3A3A3",fontSize:"0.875rem",background:"#FAFAFA",borderRadius:"10px"}}>
                        No journey updates yet.{!journeyActive ? " Accept the request first." : ""}
                      </div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                        {[...selected.journey.milestones].reverse().map((m:any,i:number)=>(
                          <div key={m.id||i} style={{display:"flex",gap:"0.875rem",alignItems:"flex-start"}}>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,paddingTop:"0.1rem"}}>
                              <div style={{width:"30px",height:"30px",borderRadius:"50%",background:i===0?"#F47B20":"#E5E5E5",color:i===0?"#fff":"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",fontWeight:700,flexShrink:0}}>
                                {i===0?"NOW":i+1}
                              </div>
                              {i < selected.journey.milestones.length-1 && <div style={{width:"2px",height:"28px",background:"#E5E5E5",marginTop:"3px"}}/>}
                            </div>
                            <div style={{flex:1,background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.75rem",marginBottom:"0.375rem"}}>
                              <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{m.title}</div>
                              <div style={{fontSize:"0.7rem",color:"#A3A3A3",marginBottom:"0.35rem"}}>{fmtDate(m.addedAt)}</div>
                              {m.description && <p style={{fontSize:"0.82rem",color:"#525252",margin:"0 0 0.5rem",lineHeight:1.55}}>{m.description}</p>}
                              {m.evidence?.length > 0 && (
                                <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
                                  {m.evidence.map((url:string,ei:number)=>(
                                    <img key={ei} src={url} alt="" onClick={()=>setLightbox(url)}
                                      style={{width:"64px",height:"48px",objectFit:"cover",borderRadius:"5px",border:"1px solid #E5E5E5",cursor:"zoom-in"}}/>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {journeyActive && (
                      <div style={{border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden"}}>
                        <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.1em",color:"#525252",fontWeight:700}}>
                          ADD UPDATE / EVIDENCE
                        </div>
                        <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                          <div>
                            <label style={lbl}>Stage</label>
                            <select value={msStage} onChange={e=>setMsStage(e.target.value)} style={inp}>
                              {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Title *</label>
                            <input value={msTitle} onChange={e=>setMsTitle(e.target.value)} style={inp} placeholder="e.g. Payment received, Vehicle shipped..."/>
                          </div>
                          <div>
                            <label style={lbl}>Details</label>
                            <textarea value={msDesc} onChange={e=>setMsDesc(e.target.value)} rows={2} style={{...inp, resize:"vertical" as const}} placeholder="What happened..."/>
                          </div>
                          <div>
                            <label style={lbl}>Evidence Photos</label>
                            <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
                              {msEvidence.map((url,i)=>(
                                <div key={i} style={{position:"relative"}}>
                                  <img src={url} alt="" style={{width:"60px",height:"46px",objectFit:"cover",borderRadius:"5px",border:"1px solid #E5E5E5"}}/>
                                  <button onClick={()=>setMsEvidence(prev=>prev.filter((_,j)=>j!==i))}
                                    style={{position:"absolute",top:"-4px",right:"-4px",background:"#DC2626",color:"#fff",border:"none",borderRadius:"50%",width:"16px",height:"16px",cursor:"pointer",fontSize:"0.55rem",fontWeight:700}}>
                                    X
                                  </button>
                                </div>
                              ))}
                              <button onClick={()=>evidenceRef.current?.click()} disabled={msUploading}
                                style={{width:"60px",height:"46px",background:"#F5F5F5",border:"1.5px dashed #D4D4D4",borderRadius:"5px",cursor:"pointer",color:"#AAA",fontSize:"1.5rem",display:"flex",alignItems:"center",justifyContent:"center",opacity:msUploading?0.6:1}}>
                                {msUploading?"...":"+"}
                              </button>
                              <input ref={evidenceRef} type="file" accept="image/*,.pdf" style={{display:"none"}}
                                onChange={e=>{if(e.target.files?.[0])uploadEvidence(e.target.files[0]);e.target.value="";}}/>
                            </div>
                          </div>
                          <button onClick={submitMilestone} disabled={saving||!msTitle}
                            style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.85rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700,opacity:saving||!msTitle?0.6:1}}>
                            {saving ? "Posting..." : "Post Update to Buyer"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/*  PAYMENT TAB  */}
                {tab === "payment" && (
                  selected.journey?.paymentPlan ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                      <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"10px",padding:"1rem"}}>
                        <div style={{fontWeight:700,fontSize:"0.95rem",color:"#15803D"}}>
                          {selected.journey.paymentPlan.type==="full"?"Full Payment":"Installment Plan"}
                        </div>
                        <div style={{fontSize:"1.1rem",fontFamily:"var(--font-display)",color:"#1A1A1A",marginTop:"0.25rem"}}>
                          NGN {(selected.journey.paymentPlan.totalAmount||0).toLocaleString()}
                        </div>
                      </div>
                      {selected.journey.paymentPlan.installments?.map((inst:any,i:number)=>(
                        <div key={i} style={{background:"#FAFAFA",border:"1px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.5rem"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:"0.875rem"}}>{inst.label||`Installment ${i+1}`}</div>
                            <div style={{fontSize:"0.78rem",color:"#888"}}>NGN {(inst.amount||0).toLocaleString()} &bull; Due: {inst.dueDate||"TBD"}</div>
                            {inst.evidence && <a href={inst.evidence} target="_blank" rel="noreferrer" style={{fontSize:"0.7rem",color:"#F47B20",fontWeight:600}}>View Receipt</a>}
                          </div>
                          <span style={{background:inst.paid?"#F0FDF4":"#FFF7ED",color:inst.paid?"#15803D":"#D97706",border:`1px solid ${inst.paid?"#86EFAC":"#FDE68A"}`,borderRadius:"20px",padding:"0.2rem 0.625rem",fontSize:"0.7rem",fontWeight:700}}>
                            {inst.paid?"Paid":"Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : paymentActive ? (
                    <div style={{border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden"}}>
                      <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.1em",color:"#525252",fontWeight:700}}>SET PAYMENT PLAN</div>
                      <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
                        <div style={{display:"flex",gap:"0.5rem"}}>
                          {[["full","Full Payment"],["installmental","Installments"]].map(([v,l])=>(
                            <button key={v} onClick={()=>setPlanType(v as any)}
                              style={{flex:1,padding:"0.625rem",borderRadius:"8px",border:`1.5px solid ${planType===v?"#F47B20":"#E5E5E5"}`,background:planType===v?"#FFF7ED":"#fff",color:planType===v?"#C4621A":"#737373",fontSize:"0.82rem",cursor:"pointer",fontWeight:planType===v?700:400}}>
                              {l}
                            </button>
                          ))}
                        </div>
                        <div><label style={lbl}>Total Amount (NGN) *</label>
                          <input type="number" value={planTotal} onChange={e=>setPlanTotal(e.target.value)} style={inp} placeholder="0"/>
                        </div>
                        {planType === "installmental" && (
                          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                            <label style={lbl}>Installments</label>
                            {installments.map((inst,i)=>(
                              <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:"0.375rem",alignItems:"center"}}>
                                <input placeholder="Label" value={inst.label} onChange={e=>setInstallments(p=>p.map((x,j)=>j===i?{...x,label:e.target.value}:x))} style={{...inp,padding:"0.4rem 0.5rem",fontSize:"0.8rem"}}/>
                                <input type="number" placeholder="Amount" value={inst.amount} onChange={e=>setInstallments(p=>p.map((x,j)=>j===i?{...x,amount:e.target.value}:x))} style={{...inp,padding:"0.4rem 0.5rem",fontSize:"0.8rem"}}/>
                                <input type="date" value={inst.dueDate} onChange={e=>setInstallments(p=>p.map((x,j)=>j===i?{...x,dueDate:e.target.value}:x))} style={{...inp,padding:"0.4rem 0.5rem",fontSize:"0.75rem"}}/>
                                {i>0 && <button onClick={()=>setInstallments(p=>p.filter((_,j)=>j!==i))} style={{background:"#FEF2F2",color:"#DC2626",border:"none",borderRadius:"4px",cursor:"pointer",padding:"0.3rem 0.5rem",fontSize:"0.72rem",fontWeight:700}}>X</button>}
                              </div>
                            ))}
                            <button onClick={()=>setInstallments(p=>[...p,{label:`Installment ${p.length+1}`,amount:"",dueDate:"",paid:false}])}
                              style={{background:"#F5F5F5",border:"1.5px dashed #E5E5E5",color:"#888",borderRadius:"8px",padding:"0.5rem",fontSize:"0.78rem",cursor:"pointer",fontWeight:600}}>
                              + Add Installment
                            </button>
                          </div>
                        )}
                        <button onClick={submitPlan} disabled={saving||!planTotal}
                          style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700,opacity:saving||!planTotal?0.6:1}}>
                          {saving?"Saving...":"Send Payment Plan to Buyer"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{textAlign:"center",padding:"2.5rem",color:"#A3A3A3",fontSize:"0.875rem",background:"#FAFAFA",borderRadius:"10px"}}>
                      Payment plan is available after you accept the request
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}