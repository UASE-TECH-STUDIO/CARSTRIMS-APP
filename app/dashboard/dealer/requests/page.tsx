"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const STATUS_C: Record<string,{bg:string;color:string}> = {
  pending:   {bg:"#FFF7ED",color:"#D97706"},
  responded: {bg:"#F0FDF4",color:"#16A34A"},
  closed:    {bg:"#F5F5F5",color:"#737373"},
  rejected:  {bg:"#FEF2F2",color:"#DC2626"},
};

export default function DealerRequestsPage() {
  const [requests,setRequests]   = useState<any[]>([]);
  const [loading,setLoading]     = useState(true);
  const [responding,setResponding] = useState<any>(null);
  const [responseText,setResponseText] = useState("");
  const [submitting,setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/users/requests/dealer");
      setRequests(Array.isArray(res.data)?res.data:[]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(()=>{load();},[]);

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responding||!responseText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/users/requests/${responding.requestId}/respond`,{
        response: responseText, progressNote: responseText,
      });
      setResponding(null); setResponseText(""); load();
    } catch (e:any) { alert(e.response?.data?.detail||"Failed"); }
    finally { setSubmitting(false); }
  };

  const fmt  = (n:number)=>`NGN ${(n||0).toLocaleString()}`;
  const fmtDate = (iso:string)=>iso?new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):"—";

  return (
    <div className="req-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Customer Requests</h2>
          <p className="page-sub">{requests.length} request{requests.length!==1?"s":""} received</p>
        </div>
        <button className="refresh-btn" onClick={load}>Refresh</button>
      </div>

      {loading?<div className="loading"><div className="spinner"/></div>
      :requests.length===0?(
        <div className="empty">
          <div className="empty-icon">📩</div>
          <h3>No requests yet</h3>
          <p>Customer car requests will appear here when buyers submit them</p>
        </div>
      ):(
        <div className="req-list">
          {requests.map(r=>{
            const sc = STATUS_C[r.status]||STATUS_C.pending;
            return (
              <div key={r._id||r.requestId} className="req-card">
                {/* Header */}
                <div className="req-header">
                  <div>
                    <div className="req-id">{r.requestId}</div>
                    <div className="req-car">{r.carBrand} {r.carModel} {r.carYear||""}{r.carColor?` · ${r.carColor}`:""}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.35rem"}}>
                    <span className="req-status" style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}44`}}>{r.status}</span>
                    <span style={{fontSize:"0.68rem",color:"#AAA"}}>{fmtDate(r.createdAt)}</span>
                  </div>
                </div>

                {/* Customer info */}
                <div className="req-section-label">Customer</div>
                <div className="req-details">
                  <div className="req-row"><span className="req-label">Name</span><span className="req-val req-strong">{r.userName||"Unknown"}</span></div>
                  {r.userPhone&&<div className="req-row"><span className="req-label">Phone</span><a href={`tel:${r.userPhone}`} className="req-link">{r.userPhone}</a></div>}
                </div>

                {/* Vehicle request details */}
                <div className="req-section-label">Requested Vehicle</div>
                <div className="req-details">
                  {r.carBrand&&<div className="req-row"><span className="req-label">Brand</span><span className="req-val">{r.carBrand}</span></div>}
                  {r.carModel&&<div className="req-row"><span className="req-label">Model</span><span className="req-val">{r.carModel}</span></div>}
                  {r.carYear&&<div className="req-row"><span className="req-label">Year</span><span className="req-val">{r.carYear}</span></div>}
                  {r.carColor&&<div className="req-row"><span className="req-label">Color</span><span className="req-val">{r.carColor}</span></div>}
                  {r.condition&&<div className="req-row"><span className="req-label">Condition</span><span className="req-val" style={{textTransform:"capitalize"}}>{r.condition}</span></div>}
                  {r.transmission&&<div className="req-row"><span className="req-label">Gearbox</span><span className="req-val" style={{textTransform:"capitalize"}}>{r.transmission}</span></div>}
                  {r.fuelType&&<div className="req-row"><span className="req-label">Fuel</span><span className="req-val" style={{textTransform:"capitalize"}}>{r.fuelType}</span></div>}
                  {r.budget&&<div className="req-row"><span className="req-label">Budget</span><span className="req-val req-budget">{fmt(r.budget)}</span></div>}
                  {r.paymentType&&<div className="req-row"><span className="req-label">Payment</span><span className="req-val" style={{textTransform:"capitalize"}}>{r.paymentType}</span></div>}
                </div>

                {r.description&&(
                  <div className="req-note">
                    <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.35rem"}}>Customer Note</div>
                    <div style={{fontSize:"0.875rem",color:"#404040",lineHeight:1.6}}>{r.description}</div>
                  </div>
                )}

                {/* Reference photo */}
                {r.referencePhoto&&(
                  <div>
                    <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.5rem"}}>Reference Photo</div>
                    <img src={r.referencePhoto} alt="Reference" style={{width:"100%",maxWidth:"300px",borderRadius:"8px",border:"1.5px solid #E5E5E5",display:"block"}}/>
                  </div>
                )}

                {/* Dealer response if exists */}
                {r.dealerResponse&&(
                  <div className="my-response">
                    <div className="mr-label">Your Response:</div>
                    <div className="mr-text">{r.dealerResponse}</div>
                    {r.dealerResponseAt&&<div style={{fontSize:"0.68rem",color:"#A3A3A3",marginTop:"0.35rem"}}>Sent {fmtDate(r.dealerResponseAt)}</div>}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                  {r.status==="pending"&&(
                    <button className="respond-btn" onClick={()=>{setResponding(r);setResponseText("");}}>
                      Reply to Customer
                    </button>
                  )}
                  {r.status==="responded"&&(
                    <button className="respond-btn" style={{background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5"}} onClick={()=>{setResponding(r);setResponseText(r.dealerResponse||"");}}>
                      Update Response
                    </button>
                  )}
                  {r.userPhone&&<a href={`https://wa.me/${r.userPhone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="wa-btn">WhatsApp</a>}
                  {r.userPhone&&<a href={`tel:${r.userPhone}`} className="call-btn">Call</a>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {responding&&(
        <div className="modal-overlay" onClick={()=>setResponding(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">RESPOND TO REQUEST</h3>
              <button className="modal-close" onClick={()=>setResponding(null)}>X</button>
            </div>
            <div className="modal-body">
              <div className="req-info">
                <strong>{responding.carBrand} {responding.carModel} {responding.carYear||""}</strong>
                <span style={{color:"#737373"}}> — from {responding.userName}</span>
              </div>
              {responding.budget&&<div style={{fontSize:"0.825rem",color:"#F47B20",fontWeight:600,margin:"0.5rem 0"}}>Budget: NGN {Number(responding.budget).toLocaleString()}</div>}
              {responding.description&&<div style={{background:"#F5F5F5",borderRadius:"6px",padding:"0.75rem",fontSize:"0.825rem",color:"#525252",marginBottom:"0.75rem",lineHeight:1.55}}>{responding.description}</div>}
              <form onSubmit={handleRespond}>
                <div className="field">
                  <label className="fl">Your Response *</label>
                  <textarea className="fi fi-ta" rows={5}
                    placeholder="Tell the customer what you can offer — pricing, availability, condition, delivery time..."
                    value={responseText} onChange={e=>setResponseText(e.target.value)} required/>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={()=>setResponding(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Sending...":"Send Response"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .req-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .refresh-btn{background:#fff;border:1.5px solid #E5E5E5;color:#666;border-radius:6px;padding:0.6rem 1rem;font-size:0.825rem;cursor:pointer;transition:all 0.2s;font-family:var(--font-body)}
        .refresh-btn:hover{border-color:#F47B20;color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .empty-icon{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem;max-width:320px}
        .req-list{display:flex;flex-direction:column;gap:1rem}
        .req-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:12px;padding:1.25rem;display:flex;flex-direction:column;gap:0.875rem;transition:border-color 0.2s}
        .req-card:hover{border-color:#F47B20}
        .req-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .req-id{font-family:var(--font-mono);font-size:0.7rem;color:#AAA;margin-bottom:0.25rem}
        .req-car{font-weight:700;font-size:1rem;color:#1A1A1A}
        .req-status{padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize;border:1px solid}
        .req-section-label{font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A3A3A3;padding-bottom:0.25rem;border-bottom:1px solid #F0F0F0}
        .req-details{display:flex;flex-direction:column;gap:0.3rem}
        .req-row{display:flex;gap:0.75rem;align-items:baseline}
        .req-label{font-size:0.7rem;color:#AAA;text-transform:uppercase;letter-spacing:0.06em;min-width:70px;flex-shrink:0}
        .req-val{font-size:0.875rem;color:#404040}
        .req-strong{font-weight:700;color:#1A1A1A;font-size:0.95rem}
        .req-budget{font-family:var(--font-display);font-size:1rem;color:#F47B20;font-weight:700}
        .req-link{font-size:0.875rem;color:#3B8BD4;text-decoration:none;font-weight:600}
        .req-link:hover{text-decoration:underline}
        .req-note{background:#F5F5F5;borderRadius:8px;padding:0.875rem;border-left:3px solid #F47B20}
        .my-response{background:#FFF7ED;border:1.5px solid rgba(244,123,32,0.3);border-radius:8px;padding:0.875rem}
        .mr-label{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:#F47B20;margin-bottom:0.35rem;font-weight:700}
        .mr-text{font-size:0.875rem;color:#555;line-height:1.6}
        .respond-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.06em;cursor:pointer;transition:background 0.2s;white-space:nowrap}
        .respond-btn:hover{background:#FF9340}
        .wa-btn{background:#F0FDF4;color:#15803D;border:1.5px solid #86EFAC;border-radius:6px;padding:0.55rem 0.875rem;font-size:0.8rem;font-weight:600;text-decoration:none;white-space:nowrap;transition:all 0.2s}
        .wa-btn:hover{background:#15803D;color:#fff}
        .call-btn{background:#EFF6FF;color:#1D4ED8;border:1.5px solid #BFDBFE;border-radius:6px;padding:0.55rem 0.875rem;font-size:0.8rem;font-weight:600;text-decoration:none;white-space:nowrap}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:14px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.18)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer;font-weight:700}
        .modal-body{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.875rem}
        .req-info{background:#F5F5F5;border-radius:6px;padding:0.75rem;font-size:0.9rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#737373}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%;box-sizing:border-box}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:100px}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.75rem;border-top:1px solid #E5E5E5;margin-top:0.5rem}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;cursor:pointer;transition:background 0.2s}
        .btn-primary:hover{background:#FF9340}.btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-cancel{background:#F5F5F5;border:1.5px solid #E5E5E5;color:#525252;border-radius:6px;padding:0.65rem 1.25rem;font-size:0.875rem;cursor:pointer}
      `}</style>
    </div>
  );
}
