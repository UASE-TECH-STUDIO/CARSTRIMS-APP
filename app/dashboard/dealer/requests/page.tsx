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
  {id:"payment_received",    label:"Payment Received"},
  {id:"car_purchased",       label:"Vehicle Purchased"},
  {id:"shipped",             label:"Shipped"},
  {id:"arrived_country",     label:"Arrived in Country"},
  {id:"in_transit",          label:"In Transit to Buyer"},
  {id:"delivered",           label:"Delivered to Buyer"},
  {id:"update",              label:"General Update"},
];

export default function DealerRequestsPage() {
  const [requests,  setRequests]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<any>(null);
  const [filter,    setFilter]    = useState("all");
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");
  const [tab,       setTab]       = useState<"details"|"journey"|"payment">("details");

  // Respond form
  const [responseType, setResponseType] = useState<"accept"|"counter">("accept");
  const [responseMsg,  setResponseMsg]  = useState("");
  const [altForm, setAltForm] = useState({
    altBrand:"", altModel:"", altYear:"", altColor:"", altCondition:"foreign used",
    altPrice:"", altCurrency:"NGN", altDescription:"", estimatedDelivery:"",
  });

  // Milestone form
  const [milestoneStage,       setMilestoneStage] = useState("update");
  const [milestoneTitle,       setMilestoneTitle] = useState("");
  const [milestoneDesc,        setMilestoneDesc]  = useState("");
  const [milestoneEvidence,    setMilestoneEvidence] = useState<string[]>([]);
  const [uploadingEvidence,    setUploadingEvidence] = useState(false);
  const evidenceRef = useRef<HTMLInputElement>(null);

  // Payment plan form
  const [planType,    setPlanType]    = useState<"full"|"installmental">("full");
  const [planTotal,   setPlanTotal]   = useState("");
  const [installments,setInstallments]= useState([{label:"Initial deposit",amount:"",dueDate:"",paid:false}]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/users/requests/dealer");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const open = (r:any) => { setSelected(r); setMsg(""); setTab("details"); setResponseType("accept"); setResponseMsg(""); };
  const close = () => { setSelected(null); setMsg(""); };
  const refresh = async () => {
    await load();
    if (selected) {
      const fresh = await api.get(`/api/v1/users/requests/${selected.requestId||selected._id}`).catch(()=>null);
      if (fresh) setSelected(fresh.data);
    }
  };

  // Respond to request
  const submitResponse = async () => {
    if (!selected) return;
    setSaving(true); setMsg("");
    try {
      const payload: any = { type: responseType, message: responseMsg };
      if (responseType === "counter") Object.assign(payload, altForm);
      await api.post(`/api/v1/users/requests/${selected.requestId||selected._id}/respond`, payload);
      setMsg(responseType==="accept" ? "Accepted! Journey has started. Set up payment plan next." : "Counter-offer sent to buyer!");
      await refresh();
    } catch(e:any) { setMsg("Error: "+(e.response?.data?.detail||"Failed")); }
    finally { setSaving(false); }
  };

  // Upload evidence image
  const uploadEvidence = async (file: File) => {
    setUploadingEvidence(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/api/v1/cars/upload-image", fd, { headers:{"Content-Type":"multipart/form-data"} });
      const url = r.data?.url || r.data?.secure_url;
      if (url) setMilestoneEvidence(prev=>[...prev, url]);
    } catch(e:any) { setMsg("Upload failed: "+(e.response?.data?.detail||"")); }
    finally { setUploadingEvidence(false); }
  };

  // Add milestone
  const submitMilestone = async () => {
    if (!selected||!milestoneTitle) return;
    setSaving(true); setMsg("");
    try {
      await api.post(`/api/v1/users/requests/${selected.requestId||selected._id}/milestone`, {
        stage: milestoneStage, title: milestoneTitle, description: milestoneDesc, evidence: milestoneEvidence,
      });
      setMsg("Update added! Buyer has been notified.");
      setMilestoneTitle(""); setMilestoneDesc(""); setMilestoneEvidence([]);
      await refresh();
    } catch(e:any) { setMsg("Error: "+(e.response?.data?.detail||"Failed")); }
    finally { setSaving(false); }
  };

  // Set payment plan
  const submitPlan = async () => {
    if (!selected||!planTotal) return;
    setSaving(true); setMsg("");
    try {
      await api.post(`/api/v1/users/requests/${selected.requestId||selected._id}/payment-plan`, {
        type: planType, totalAmount: parseFloat(planTotal), currency: "NGN",
        installments: planType==="installmental" ? installments.map(i=>({...i,amount:parseFloat(i.amount)||0})) : [],
      });
      setMsg("Payment plan sent to buyer!");
      await refresh();
    } catch(e:any) { setMsg("Error: "+(e.response?.data?.detail||"Failed")); }
    finally { setSaving(false); }
  };

  const fmt = (n:number)=>`NGN ${(n||0).toLocaleString()}`;
  const fmtDate = (iso:any)=>!iso?"":new Date(iso).toLocaleString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

  const filtered = filter==="all" ? requests : requests.filter(r=>r.status===filter);
  const pending = requests.filter(r=>r.status==="pending").length;
  const actionNeeded = requests.filter(r=>["pending","accepted"].includes(r.status)).length;

  const canRespond = selected && ["pending"].includes(selected.status);
  const journeyActive = selected && ["accepted_by_dealer","accepted","completed"].includes(selected.status);
  const paymentActive = selected && ["accepted_by_dealer","accepted"].includes(selected.status);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem",paddingBottom:"2rem"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Customer Requests</h2>
          <p style={{fontSize:"0.8rem",color:"#888",marginTop:"0.3rem"}}>
            {requests.length} total
            {pending>0&&<span style={{color:"#D97706",fontWeight:700}}> &bull; {pending} need response</span>}
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
      ) : filtered.length===0 ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.875rem",padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff"}}>
          <div style={{fontSize:"3rem"}}>&#x1F697;</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No requests</h3>
          <p style={{color:"#888",fontSize:"0.875rem"}}>Customer vehicle requests appear here when buyers submit them</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {filtered.map(r=>{
            const sc = STATUS_C[r.status]||"#888";
            const isPending = r.status==="pending";
            return (
              <div key={r._id} onClick={()=>open(r)}
                style={{background:"#fff",border:`1.5px solid ${isPending?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",padding:"1rem 1.25rem",cursor:"pointer",transition:"all 0.2s",boxShadow:isPending?"0 2px 12px rgba(244,123,32,0.1)":"none"}}
                onMouseOver={e=>(e.currentTarget as HTMLElement).style.borderColor="#F47B20"}
                onMouseOut={e=>(e.currentTarget as HTMLElement).style.borderColor=isPending?"#F47B20":"#E5E5E5"}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"0.875rem",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:"160px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.25rem"}}>
                      <span style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{r.carBrand} {r.carModel} {r.carYear||""}</span>
                      {isPending&&<span style={{fontSize:"0.67rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.4)",borderRadius:"20px",padding:"0.1rem 0.45rem",fontWeight:700}}>Action needed</span>}
                    </div>
                    <div style={{fontSize:"0.78rem",color:"#737373"}}>{r.userName||"Buyer"} &bull; {r.paymentType}</div>
                    {r.budget&&<div style={{fontSize:"0.78rem",color:"#F47B20",fontWeight:600}}>Budget: {fmt(r.budget)}</div>}
                    {r.description&&<div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.15rem",fontStyle:"italic"}}>{r.description.slice(0,80)}{r.description.length>80?"...":""}</div>}
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

      {/* DETAIL MODAL */}
      {selected && (
        <div onClick={close} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"680px",maxHeight:"94vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>

            {/* Modal header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",borderBottom:"1px solid #E5E5E5",position:"sticky",top:0,background:"#fff",zIndex:10}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"0.88rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>
                {selected.carBrand} {selected.carModel} {selected.carYear} &mdash; {STATUS_L[selected.status]||selected.status}
              </div>
              <button onClick={close} style={{background:"none",border:"none",color:"#AAA",fontSize:"1.1rem",cursor:"pointer",width:"30px",height:"30px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}
                onMouseOver={e=>(e.currentTarget.style.background="#F5F5F5")}
                onMouseOut={e=>(e.currentTarget.style.background="none")}>X</button>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",borderBottom:"1px solid #E5E5E5",background:"#FAFAFA"}}>
              {[["details","Details"],["journey","Journey & Updates"],["payment","Payment"]].map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t as any)}
                  style={{flex:1,padding:"0.75rem 0.5rem",border:"none",background:"none",borderBottom:tab===t?"2px solid #F47B20":"2px solid transparent",color:tab===t?"#F47B20":"#888",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.07em",cursor:"pointer",textTransform:"uppercase" as const,fontWeight:tab===t?700:400}}>
                  {l}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div style={{overflowY:"auto",flex:1,padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem"}}>

              {msg&&<div style={{background:msg.startsWith("Error")?"#FEF2F2":"#F0FDF4",border:"1px solid",borderColor:msg.startsWith("Error")?"#FECACA":"#86EFAC",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.82rem",color:msg.startsWith("Error")?"#DC2626":"#15803D",fontWeight:600}}>{msg}</div>}

              {/* DETAILS TAB */}
              {tab==="details"&&(
                <>
                  {/* Buyer card */}
                  <div style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.2)",borderRadius:"10px",padding:"0.875rem",display:"flex",gap:"0.75rem",alignItems:"center"}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"50%",background:"#F47B20",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",fontFamily:"var(--font-display)",flexShrink:0}}>
                      {(selected.userName||"B").charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{selected.userName||"Buyer"}</div>
                      <div style={{display:"flex",gap:"0.375rem",marginTop:"0.35rem",flexWrap:"wrap"}}>
                        {selected.userPhone&&<a href={`tel:${selected.userPhone}`} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:"5px",padding:"0.2rem 0.5rem",fontSize:"0.7rem",textDecoration:"none",fontWeight:600}}>Call</a>}
                        {selected.buyerWhatsapp&&<a href={`https://wa.me/${selected.buyerWhatsapp}`} target="_blank" rel="noreferrer" style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",borderRadius:"5px",padding:"0.2rem 0.5rem",fontSize:"0.7rem",textDecoration:"none",fontWeight:600}}>WhatsApp</a>}
                      </div>
                    </div>
                  </div>

                  {/* Request info */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                    {[
                      ["Vehicle",`${selected.carBrand} ${selected.carModel} ${selected.carYear||""}`],
                      ["Color", selected.carColor||"Any"],
                      ["Budget", selected.budget?`NGN ${Number(selected.budget).toLocaleString()}`:"Not specified"],
                      ["Payment", selected.paymentType],
                      ["Condition", selected.condition||"Any"],
                      ["Gearbox", selected.transmission||"Any"],
                      ["Fuel Type", selected.fuelType||"Any"],
                      ["Sent to", selected.dealerId?"This dealer only":"All dealers (general)"],
                      ["Requested", fmtDate(selected.createdAt)],
                      ["Status", STATUS_L[selected.status]||selected.status],
                    ].map(([l,v])=>(
                      <div key={l} style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"7px",padding:"0.6rem"}}>
                        <div style={{fontSize:"0.6rem",textTransform:"uppercase" as const,letterSpacing:"0.06em",color:"#AAA",marginBottom:"0.2rem",fontWeight:600}}>{l}</div>
                        <div style={{fontSize:"0.82rem",color:"#1A1A1A",fontWeight:600,textTransform:"capitalize" as const}}>{v||""}</div>
                      </div>
                    ))}
                  </div>

                  {selected.description&&(
                    <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.875rem"}}>
                      <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.3rem",fontWeight:700}}>Buyer Notes</div>
                      <p style={{fontSize:"0.875rem",color:"#525252",lineHeight:1.6,margin:0}}>{selected.description}</p>
                    </div>
                  )}

                  {/* Reference photos from buyer */}
                  {(()=>{
                    const photos = selected.referencePhotos?.length ? selected.referencePhotos : (selected.referencePhoto?[selected.referencePhoto]:[]);
                    return photos.length>0?(
                      <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.875rem"}}>
                        <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.5rem",fontWeight:700}}>Reference Photos ({photos.length})</div>
                        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>{photos.map((url:string,i:number)=>(
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" style={{width:"100px",height:"75px",objectFit:"cover",borderRadius:"6px",border:"1.5px solid #E5E5E5",cursor:"zoom-in"}}/>
                          </a>
                        ))}</div>
                      </div>
                    ):null;
                  })()}

                  {/* Counter offer sent */}
                  {selected.counterOffer&&(
                    <div style={{background:"#F5F3FF",border:"1.5px solid rgba(123,104,238,0.3)",borderRadius:"10px",padding:"0.875rem"}}>
                      <div style={{fontSize:"0.68rem",textTransform:"uppercase" as const,letterSpacing:"0.08em",color:"#7B68EE",fontWeight:700,marginBottom:"0.5rem"}}>Your Counter-Offer</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.375rem"}}>
                        {[
                          ["Vehicle",`${selected.counterOffer.carBrand} ${selected.counterOffer.carModel} ${selected.counterOffer.carYear||""}`],
                          ["Price",`${selected.counterOffer.currency||"NGN"} ${(selected.counterOffer.price||0).toLocaleString()}`],
                          ["Condition",selected.counterOffer.condition||""],
                          ["Est. Delivery",selected.counterOffer.estimatedDelivery||"TBD"],
                        ].map(([l,v])=>(
                          <div key={l} style={{background:"#fff",borderRadius:"5px",padding:"0.4rem 0.5rem",fontSize:"0.75rem"}}>
                            <div style={{color:"#A3A3A3",fontSize:"0.58rem",marginBottom:"0.1rem"}}>{l}</div>
                            <div style={{fontWeight:600,color:"#1A1A1A"}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {selected.counterOffer.description&&<p style={{fontSize:"0.78rem",color:"#525252",marginTop:"0.5rem",lineHeight:1.5}}>{selected.counterOffer.description}</p>}
                    </div>
                  )}

                  {/* RESPOND FORM */}
                  {canRespond&&(
                    <div style={{border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden"}}>
                      <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#525252"}}>RESPOND TO REQUEST</div>
                      <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
                        {/* Response type */}
                        <div style={{display:"flex",gap:"0.5rem"}}>
                          {[["accept","I Can Fulfil This"],["counter","Suggest Alternative"]].map(([v,l])=>(
                            <button key={v} onClick={()=>setResponseType(v as any)}
                              style={{flex:1,padding:"0.625rem",borderRadius:"8px",border:`1.5px solid ${responseType===v?"#F47B20":"#E5E5E5"}`,background:responseType===v?"#FFF7ED":"#fff",color:responseType===v?"#C4621A":"#737373",fontSize:"0.78rem",cursor:"pointer",fontWeight:responseType===v?700:400,transition:"all 0.2s"}}>
                              {l}
                            </button>
                          ))}
                        </div>

                        {responseType==="counter"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:"0.625rem",background:"#FAFAFA",borderRadius:"8px",padding:"0.875rem"}}>
                            <div style={{fontSize:"0.68rem",fontWeight:700,color:"#7B68EE",textTransform:"uppercase" as const,letterSpacing:"0.08em"}}>Alternative Vehicle Details</div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                              {[["altBrand","Brand"],["altModel","Model"],["altYear","Year"],["altColor","Color"]].map(([k,l])=>(
                                <div key={k}>
                                  <div style={{fontSize:"0.62rem",color:"#888",fontWeight:600,marginBottom:"0.2rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{l}</div>
                                  <input value={(altForm as any)[k]} onChange={e=>setAltForm(f=>({...f,[k]:e.target.value}))}
                                    style={{width:"100%",background:"#fff",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.4rem 0.5rem",fontSize:"0.8rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}/>
                                </div>
                              ))}
                              <div>
                                <div style={{fontSize:"0.62rem",color:"#888",fontWeight:600,marginBottom:"0.2rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Price (NGN)</div>
                                <input type="number" value={altForm.altPrice} onChange={e=>setAltForm(f=>({...f,altPrice:e.target.value}))}
                                  style={{width:"100%",background:"#fff",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.4rem 0.5rem",fontSize:"0.8rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}/>
                              </div>
                              <div>
                                <div style={{fontSize:"0.62rem",color:"#888",fontWeight:600,marginBottom:"0.2rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Est. Delivery</div>
                                <input value={altForm.estimatedDelivery} onChange={e=>setAltForm(f=>({...f,estimatedDelivery:e.target.value}))} placeholder="e.g. 4-6 weeks"
                                  style={{width:"100%",background:"#fff",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.4rem 0.5rem",fontSize:"0.8rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}/>
                              </div>
                            </div>
                            <div>
                              <div style={{fontSize:"0.62rem",color:"#888",fontWeight:600,marginBottom:"0.2rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Description of Alternative</div>
                              <textarea rows={2} value={altForm.altDescription} onChange={e=>setAltForm(f=>({...f,altDescription:e.target.value}))}
                                style={{width:"100%",background:"#fff",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.4rem 0.5rem",fontSize:"0.8rem",fontFamily:"var(--font-body)",outline:"none",resize:"vertical" as const,boxSizing:"border-box" as const}}/>
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{fontSize:"0.68rem",color:"#888",fontWeight:600,marginBottom:"0.3rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Message to Buyer</div>
                          <textarea rows={2} value={responseMsg} onChange={e=>setResponseMsg(e.target.value)}
                            placeholder={responseType==="accept"?"e.g. We can source this vehicle for you...":"e.g. We cannot get your exact request but we have a great alternative..."}
                            style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.6rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",resize:"vertical" as const,boxSizing:"border-box" as const}}/>
                        </div>

                        <div style={{display:"flex",gap:"0.5rem"}}>
                          <button onClick={submitResponse} disabled={saving}
                            style={{flex:1,background:responseType==="accept"?"#16A34A":"#7B68EE",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700,opacity:saving?0.6:1}}>
                            {saving?"Sending...":(responseType==="accept"?"Accept & Start Journey":"Send Counter-Offer")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* JOURNEY TAB */}
              {tab==="journey"&&(
                <>
                  {/* Existing milestones */}
                  {selected.journey?.milestones?.length>0?(
                    <div style={{display:"flex",flexDirection:"column",gap:0}}>
                      {[...selected.journey.milestones].reverse().map((m:any,i:number)=>(
                        <div key={m.id||i} style={{display:"flex",gap:"0.875rem",paddingBottom:"1rem"}}>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
                            <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#F47B20",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:700,flexShrink:0}}>
                              {i===0?"NOW":(i+1)}
                            </div>
                            <div style={{width:"2px",flex:1,background:"#E5E5E5",marginTop:"4px"}}/>
                          </div>
                          <div style={{flex:1,paddingBottom:"0.5rem"}}>
                            <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{m.title}</div>
                            <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginBottom:"0.35rem"}}>{fmtDate(m.addedAt)}</div>
                            {m.description&&<p style={{fontSize:"0.82rem",color:"#525252",margin:"0 0 0.5rem",lineHeight:1.55}}>{m.description}</p>}
                            {m.evidence?.length>0&&(
                              <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
                                {m.evidence.map((url:string,ei:number)=>(
                                  <a key={ei} href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt="" style={{width:"64px",height:"48px",objectFit:"cover",borderRadius:"5px",border:"1px solid #E5E5E5"}}/>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ):(
                    <div style={{textAlign:"center",padding:"1.5rem",color:"#A3A3A3",fontSize:"0.85rem",background:"#FAFAFA",borderRadius:"8px"}}>No updates yet</div>
                  )}

                  {/* Add milestone form - only if journey active */}
                  {journeyActive&&(
                    <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
                      <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.1em",color:"#525252"}}>ADD UPDATE / EVIDENCE</div>
                      <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                        <div>
                          <div style={{fontSize:"0.62rem",color:"#888",fontWeight:700,marginBottom:"0.3rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Stage</div>
                          <select value={milestoneStage} onChange={e=>setMilestoneStage(e.target.value)}
                            style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}>
                            {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:"0.62rem",color:"#888",fontWeight:700,marginBottom:"0.3rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Title *</div>
                          <input value={milestoneTitle} onChange={e=>setMilestoneTitle(e.target.value)} placeholder="e.g. Payment received, Vehicle shipped..."
                            style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}/>
                        </div>
                        <div>
                          <div style={{fontSize:"0.62rem",color:"#888",fontWeight:700,marginBottom:"0.3rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Details</div>
                          <textarea rows={2} value={milestoneDesc} onChange={e=>setMilestoneDesc(e.target.value)} placeholder="Describe what happened..."
                            style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",resize:"vertical" as const,boxSizing:"border-box" as const}}/>
                        </div>

                        {/* Evidence upload */}
                        <div>
                          <div style={{fontSize:"0.62rem",color:"#888",fontWeight:700,marginBottom:"0.3rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Evidence (photos/docs)</div>
                          <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap",marginBottom:"0.375rem"}}>
                            {milestoneEvidence.map((url,i)=>(
                              <div key={i} style={{position:"relative"}}>
                                <img src={url} alt="" style={{width:"56px",height:"44px",objectFit:"cover",borderRadius:"5px",border:"1px solid #E5E5E5"}}/>
                                <button onClick={()=>setMilestoneEvidence(prev=>prev.filter((_,j)=>j!==i))}
                                  style={{position:"absolute",top:"-4px",right:"-4px",background:"#DC2626",color:"#fff",border:"none",borderRadius:"50%",width:"16px",height:"16px",cursor:"pointer",fontSize:"0.55rem",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>x</button>
                              </div>
                            ))}
                            <button onClick={()=>evidenceRef.current?.click()} disabled={uploadingEvidence}
                              style={{width:"56px",height:"44px",background:"#F5F5F5",border:"1.5px dashed #E5E5E5",borderRadius:"5px",cursor:"pointer",fontSize:"1.2rem",color:"#AAA",display:"flex",alignItems:"center",justifyContent:"center",opacity:uploadingEvidence?0.6:1}}>
                              {uploadingEvidence?"...":"+"}
                            </button>
                            <input ref={evidenceRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadEvidence(e.target.files[0]);e.target.value="";}}/>
                          </div>
                        </div>

                        <button onClick={submitMilestone} disabled={saving||!milestoneTitle}
                          style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700,opacity:saving||!milestoneTitle?0.6:1}}>
                          {saving?"Posting...":"Post Update to Buyer"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PAYMENT TAB */}
              {tab==="payment"&&(
                <>
                  {selected.journey?.paymentPlan ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                      <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"9px",padding:"0.875rem"}}>
                        <div style={{fontWeight:700,fontSize:"0.875rem",color:"#15803D"}}>
                          {selected.journey.paymentPlan.type==="full"?"Full Payment":"Installment Plan"} &mdash; NGN {(selected.journey.paymentPlan.totalAmount||0).toLocaleString()}
                        </div>
                      </div>
                      {selected.journey.paymentPlan.installments?.map((inst:any,i:number)=>(
                        <div key={i} style={{background:"#FAFAFA",border:"1px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.5rem"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A"}}>{inst.label||`Installment ${i+1}`}</div>
                            <div style={{fontSize:"0.78rem",color:"#888"}}>NGN {(inst.amount||0).toLocaleString()} &bull; Due: {inst.dueDate||"TBD"}</div>
                            {inst.evidence&&<a href={inst.evidence} target="_blank" rel="noreferrer" style={{fontSize:"0.7rem",color:"#F47B20",textDecoration:"none",fontWeight:600}}>View Receipt</a>}
                          </div>
                          {inst.paid
                            ? <span style={{background:"#F0FDF4",color:"#15803D",border:"1px solid #86EFAC",borderRadius:"20px",padding:"0.2rem 0.625rem",fontSize:"0.7rem",fontWeight:700}}>Paid</span>
                            : <span style={{background:"#FFF7ED",color:"#D97706",border:"1px solid #FDE68A",borderRadius:"20px",padding:"0.2rem 0.625rem",fontSize:"0.7rem",fontWeight:700}}>Pending</span>
                          }
                        </div>
                      ))}
                    </div>
                  ) : paymentActive ? (
                    <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
                      <div style={{padding:"0.75rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.1em",color:"#525252"}}>SET PAYMENT PLAN</div>
                      <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
                        <div style={{display:"flex",gap:"0.5rem"}}>
                          {[["full","Full Payment"],["installmental","Installments"]].map(([v,l])=>(
                            <button key={v} onClick={()=>setPlanType(v as any)}
                              style={{flex:1,padding:"0.5rem",borderRadius:"7px",border:`1.5px solid ${planType===v?"#F47B20":"#E5E5E5"}`,background:planType===v?"#FFF7ED":"#fff",color:planType===v?"#C4621A":"#737373",fontSize:"0.78rem",cursor:"pointer",fontWeight:planType===v?700:400}}>
                              {l}
                            </button>
                          ))}
                        </div>
                        <div>
                          <div style={{fontSize:"0.62rem",color:"#888",fontWeight:700,marginBottom:"0.3rem",textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Total Amount (NGN) *</div>
                          <input type="number" value={planTotal} onChange={e=>setPlanTotal(e.target.value)} placeholder="0"
                            style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}/>
                        </div>
                        {planType==="installmental"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                            <div style={{fontSize:"0.62rem",color:"#888",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Installments</div>
                            {installments.map((inst,i)=>(
                              <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:"0.375rem",alignItems:"center"}}>
                                <input placeholder="Label" value={inst.label} onChange={e=>setInstallments(prev=>prev.map((x,j)=>j===i?{...x,label:e.target.value}:x))}
                                  style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.35rem 0.5rem",fontSize:"0.78rem",fontFamily:"var(--font-body)",outline:"none"}}/>
                                <input type="number" placeholder="Amount" value={inst.amount} onChange={e=>setInstallments(prev=>prev.map((x,j)=>j===i?{...x,amount:e.target.value}:x))}
                                  style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.35rem 0.5rem",fontSize:"0.78rem",fontFamily:"var(--font-body)",outline:"none"}}/>
                                <input type="date" value={inst.dueDate} onChange={e=>setInstallments(prev=>prev.map((x,j)=>j===i?{...x,dueDate:e.target.value}:x))}
                                  style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"5px",padding:"0.35rem 0.5rem",fontSize:"0.72rem",fontFamily:"var(--font-body)",outline:"none"}}/>
                                {i>0&&<button onClick={()=>setInstallments(prev=>prev.filter((_,j)=>j!==i))} style={{background:"#FEF2F2",color:"#DC2626",border:"none",borderRadius:"4px",cursor:"pointer",padding:"0.2rem 0.4rem",fontSize:"0.7rem",fontWeight:700}}>x</button>}
                              </div>
                            ))}
                            <button onClick={()=>setInstallments(prev=>[...prev,{label:`Installment ${prev.length+1}`,amount:"",dueDate:"",paid:false}])}
                              style={{background:"#F5F5F5",border:"1.5px dashed #E5E5E5",color:"#888",borderRadius:"7px",padding:"0.4rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>
                              + Add Installment
                            </button>
                          </div>
                        )}
                        <button onClick={submitPlan} disabled={saving||!planTotal}
                          style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700,opacity:saving||!planTotal?0.6:1}}>
                          {saving?"Saving...":"Send Payment Plan to Buyer"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{textAlign:"center",padding:"2rem",color:"#A3A3A3",fontSize:"0.85rem",background:"#FAFAFA",borderRadius:"8px"}}>
                      Payment plan available after accepting the request
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}