"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const STATUS_C: Record<string,{bg:string;color:string}> = {
  pending:   {bg:"#FFF7ED",color:"#D97706"},
  responded: {bg:"#F0FDF4",color:"#16A34A"},
  rejected:  {bg:"#FEF2F2",color:"#DC2626"},
  completed: {bg:"#EFF6FF",color:"#3B8BD4"},
};

export default function UserRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [dealers, setDealers]   = useState<any[]>([]);
  const [dealerSearch, setDealerSearch] = useState("");
  const [form, setForm] = useState({ carBrand:"Toyota", carModel:"", carYear:new Date().getFullYear(), carColor:"", budget:"", paymentType:"full", description:"", dealerId:"" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const r = await api.get("/api/v1/users/requests");
      setRequests(Array.isArray(r.data) ? r.data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (dealerSearch.length < 2) { setDealers([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/api/v1/public/dealers", { params: { search: dealerSearch, limit: 10 } });
        setDealers(r.data.dealers || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [dealerSearch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      await api.post("/api/v1/users/requests", { ...form, budget: form.budget ? Number(form.budget) : undefined, carYear: Number(form.carYear) });
      setShowNew(false);
      setForm({ carBrand:"Toyota", carModel:"", carYear:new Date().getFullYear(), carColor:"", budget:"", paymentType:"full", description:"", dealerId:"" });
      load();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed. Please try again."); }
    finally { setSubmitting(false); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }) : "—";
  const fi: React.CSSProperties = {background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.9rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",boxSizing:"border-box" as const,transition:"border-color 0.2s"};
  const lbl: React.CSSProperties = {fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.35rem"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Vehicle Requests</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>Request a specific vehicle from one dealer or broadcast to all dealers</p>
        </div>
        <button onClick={()=>setShowNew(true)}
          style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",whiteSpace:"nowrap"}}>
          + New Request
        </button>
      </div>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : requests.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
          <div style={{fontSize:"2.5rem"}}>📩</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No requests yet</h3>
          <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:1.6,maxWidth:"380px"}}>Can't find the car you're looking for? Place a request and dealers will respond with matching vehicles.</p>
          <button onClick={()=>setShowNew(true)} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer"}}>
            Place a Request
          </button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
          {requests.map(r => {
            const sc = STATUS_C[r.status] || STATUS_C.pending;
            return (
              <div key={r._id||r.requestId} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.95rem",color:"#1A1A1A"}}>{r.carBrand} {r.carModel} {r.carYear||""}</div>
                    {r.carColor && <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.1rem"}}>Color: {r.carColor}</div>}
                    {r.budget   && <div style={{fontSize:"0.78rem",color:"#F47B20",fontWeight:600,fontFamily:"var(--font-display)",marginTop:"0.2rem"}}>Budget: ₦{Number(r.budget).toLocaleString()}</div>}
                    {r.dealerName && <div style={{fontSize:"0.78rem",color:"#525252",marginTop:"0.1rem"}}>Dealer: {r.dealerName}</div>}
                    {!r.dealerId && <div style={{fontSize:"0.72rem",color:"#A3A3A3"}}>Broadcast to all dealers</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.4rem",flexShrink:0}}>
                    <span style={{background:sc.bg,color:sc.color,padding:"0.25rem 0.75rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:700,textTransform:"capitalize" as const}}>
                      {r.status}
                    </span>
                    <span style={{fontSize:"0.68rem",color:"#A3A3A3"}}>{fmtDate(r.createdAt)}</span>
                  </div>
                </div>
                {r.description && <div style={{fontSize:"0.82rem",color:"#525252",lineHeight:1.55,background:"#F5F5F5",borderRadius:"6px",padding:"0.625rem 0.875rem"}}>{r.description}</div>}
                {r.dealerResponse && (
                  <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"0.875rem",display:"flex",flexDirection:"column",gap:"0.25rem"}}>
                    <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#16A34A"}}>Dealer Response</div>
                    <div style={{fontSize:"0.875rem",color:"#1A1A1A",lineHeight:1.55}}>{r.dealerResponse}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New request modal */}
      {showNew && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"520px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1.25rem 1.5rem",background:"#1A1A1A",borderRadius:"16px 16px 0 0"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.1em",color:"#F47B20"}}>NEW VEHICLE REQUEST</div>
              <button onClick={()=>setShowNew(false)} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"1rem"}}>✕</button>
            </div>
            <form onSubmit={submit} style={{padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
              {error && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Brand *</label>
                  <select style={fi} value={form.carBrand} onChange={e=>setForm({...form,carBrand:e.target.value})}>
                    {["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Nissan","Audi","Land Rover","Jeep","Peugeot","Mitsubishi","Other"].map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Model *</label><input style={fi} placeholder="e.g. Camry" value={form.carModel} onChange={e=>setForm({...form,carModel:e.target.value})} required onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Year</label><input type="number" style={fi} value={form.carYear} onChange={e=>setForm({...form,carYear:Number(e.target.value)})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/></div>
                <div><label style={lbl}>Color (optional)</label><input style={fi} placeholder="e.g. Black" value={form.carColor} onChange={e=>setForm({...form,carColor:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                <div><label style={lbl}>Budget (₦)</label><input type="number" style={fi} placeholder="Your max budget" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/></div>
                <div><label style={lbl}>Payment Type</label>
                  <select style={fi} value={form.paymentType} onChange={e=>setForm({...form,paymentType:e.target.value})}>
                    {["full","installment","lease"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              {/* Dealer search */}
              <div style={{position:"relative"}}>
                <label style={lbl}>Specific Dealer (leave blank to broadcast to all)</label>
                <input style={fi} placeholder="Search dealer name..." value={dealerSearch} onChange={e=>{setDealerSearch(e.target.value);setForm({...form,dealerId:""});}} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
                {dealers.length > 0 && (
                  <div style={{position:"absolute",top:"calc(100%+4px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",zIndex:50,maxHeight:"160px",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}>
                    {dealers.map(d=>(
                      <div key={d._id} onClick={()=>{setForm({...form,dealerId:d._id});setDealerSearch(d.companyName);setDealers([]);}}
                        style={{padding:"0.75rem 1rem",cursor:"pointer",borderBottom:"1px solid #F5F5F5",fontSize:"0.875rem",color:"#1A1A1A",fontWeight:500,transition:"background 0.15s"}}
                        onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
                        onMouseOut={e=>e.currentTarget.style.background=""}>
                        {d.companyName} <span style={{color:"#A3A3A3",fontSize:"0.72rem",fontWeight:400}}>· {d.city||""}</span>
                      </div>
                    ))}
                  </div>
                )}
                {form.dealerId && <div style={{marginTop:"0.35rem",fontSize:"0.72rem",color:"#16A34A",fontWeight:600}}>✓ Sending to: {dealerSearch}</div>}
                {!form.dealerId && !dealerSearch && <div style={{marginTop:"0.35rem",fontSize:"0.72rem",color:"#A3A3A3"}}>Will be sent to all dealers on the platform</div>}
              </div>
              <div><label style={lbl}>Additional Details</label>
                <textarea style={{...fi,minHeight:"80px",resize:"vertical" as const}} placeholder="Any specific features, trim level, condition preference..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
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
