"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

const STATUS_C: Record<string,string> = {
  pending:"#D97706", confirmed:"#16A34A", cancelled:"#DC2626",
  completed:"#888", cancelled_by_buyer:"#DC2626", pending_buyer:"#7B68EE",
};
const STATUS_LABEL: Record<string,string> = {
  pending:"Pending", confirmed:"Confirmed", cancelled:"Declined",
  completed:"Done", cancelled_by_buyer:"Cancelled by Buyer", pending_buyer:"Awaiting Buyer",
};
const TYPE_LABEL: Record<string,string> = {
  showroom_visit:"Showroom Visit", test_drive:"Test Drive",
  inspection:"Inspection", payment_meeting:"Payment Meeting",
};

export default function DealerAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [selected, setSelected]   = useState<any>(null);

  // Counter-proposal form state
  const [showCounter, setShowCounter] = useState(false);
  const [counterDt, setCounterDt]   = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/dealers/me/appointments",
        filter !== "all" ? { params: { status: filter } } : {}
      );
      setAppointments(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const action = async (aptId: string, status: string, extra?: any) => {
    setSaving(true); setMsg("");
    try {
      await api.patch(`/api/v1/dealers/appointments/${aptId}`, { status, ...extra });
      setMsg(status === "confirmed" ? "Appointment confirmed! Buyer has been notified."
           : status === "cancelled" ? "Appointment declined. Buyer notified."
           : status === "completed" ? "Marked as completed."
           : "Updated.");
      await load();
      // Refresh selected with updated data
      if (selected) {
        const updated = (await api.get("/api/v1/dealers/me/appointments")).data.find(
          (a: any) => (a.appointmentId||a._id) === (selected.appointmentId||selected._id)
        );
        if (updated) setSelected(updated);
      }
    } catch(e:any) { setMsg("Error: " + (e.response?.data?.detail || "Failed")); }
    finally { setSaving(false); }
  };

  const submitCounter = async () => {
    if (!counterDt) { setMsg("Please pick a date and time."); return; }
    setSaving(true);
    try {
      await api.patch(`/api/v1/dealers/appointments/${selected.appointmentId||selected._id}`, {
        counterProposal: { scheduledAt: counterDt, note: counterNote }
      });
      setMsg("Alternative time sent to buyer! They will be notified.");
      setShowCounter(false); setCounterDt(""); setCounterNote("");
      await load();
    } catch(e:any) { setMsg(e.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const fmt = (iso: any) => {
    if (!iso) return "Not set";
    return new Date(iso).toLocaleString("en-NG", {
      weekday:"short", day:"numeric", month:"short", year:"numeric",
      hour:"2-digit", minute:"2-digit"
    });
  };

  const filtered = filter === "all"
    ? appointments
    : appointments.filter(a => a.status === filter);

  const pending  = appointments.filter(a => a.status === "pending").length;
  const today    = appointments.filter(a => {
    const d = a.scheduledAt ? new Date(a.scheduledAt) : null;
    const n = new Date();
    return d && d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
  }).length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem",paddingBottom:"2rem"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Appointments</h2>
          <p style={{fontSize:"0.8rem",color:"#888",marginTop:"0.3rem"}}>
            {appointments.length} total
            {pending > 0 && <span style={{color:"#D97706",fontWeight:700}}> &bull; {pending} pending action</span>}
            {today > 0 && <span style={{color:"#16A34A",fontWeight:700}}> &bull; {today} today</span>}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
        {[["all","All"],["pending","Pending"],["confirmed","Confirmed"],["completed","Done"],["cancelled","Declined"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{background:filter===v?"#F47B20":"transparent",color:filter===v?"#fff":"#888",border:`1.5px solid ${filter===v?"#F47B20":"#DDD"}`,borderRadius:"20px",padding:"0.3rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontFamily:"var(--font-body)",transition:"all 0.2s",whiteSpace:"nowrap"}}>
            {l}
            {v==="pending"&&pending>0&&<span style={{background:"rgba(255,255,255,0.3)",borderRadius:"20px",padding:"0.05rem 0.35rem",marginLeft:"0.3rem",fontSize:"0.65rem",fontWeight:700}}>{pending}</span>}
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
          <div style={{fontSize:"3rem"}}>&#x1F4C5;</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No appointments</h3>
          <p style={{color:"#888",fontSize:"0.875rem"}}>
            {filter==="all" ? "Appointments booked by buyers will appear here" : `No ${filter} appointments`}
          </p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {filtered.map(a => {
            const sc = STATUS_C[a.status] || "#888";
            const isPending = a.status === "pending";
            const hasCounter = a.counterProposal?.scheduledAt;
            return (
              <div key={a._id} onClick={()=>{setSelected(a);setShowCounter(false);setMsg("");}}
                style={{background:"#fff",border:`1.5px solid ${isPending?"#F47B20":"#E5E5E5"}`,borderRadius:"12px",padding:"1rem 1.25rem",cursor:"pointer",transition:"all 0.2s",boxShadow:isPending?"0 2px 12px rgba(244,123,32,0.12)":"none"}}
                onMouseOver={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";}}
                onMouseOut={e=>{(e.currentTarget as HTMLElement).style.borderColor=isPending?"#F47B20":"#E5E5E5";}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"0.875rem",flexWrap:"wrap"}}>

                  {/* Buyer avatar */}
                  <div style={{width:"44px",height:"44px",borderRadius:"50%",background:"#FFF7ED",border:"2px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                    {a.buyerAvatar
                      ? <img src={a.buyerAvatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : <span style={{fontFamily:"var(--font-display)"}}>{(a.buyerName||a.userName||"?").charAt(0).toUpperCase()}</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:"160px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.2rem"}}>
                      <span style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{a.buyerName||a.userName||"Buyer"}</span>
                      <span style={{fontSize:"0.72rem",padding:"0.15rem 0.5rem",borderRadius:"20px",background:`${sc}15`,color:sc,border:`1px solid ${sc}40`,fontWeight:700}}>
                        {STATUS_LABEL[a.status]||a.status}
                      </span>
                      {isPending && <span style={{fontSize:"0.68rem",background:"#FFF7ED",color:"#C4621A",border:"1px solid rgba(244,123,32,0.4)",borderRadius:"20px",padding:"0.12rem 0.5rem",fontWeight:700}}>Action needed</span>}
                    </div>
                    <div style={{fontSize:"0.78rem",color:"#525252",fontWeight:600}}>{TYPE_LABEL[a.type]||a.type?.replace(/_/g," ")}</div>
                    <div style={{fontSize:"0.75rem",color:"#888",marginTop:"0.15rem"}}>
                      {a.scheduledAt ? `Requested: ${fmt(a.scheduledAt)}` : "No time specified"}
                    </div>
                    {hasCounter && (
                      <div style={{fontSize:"0.72rem",color:"#7B68EE",marginTop:"0.15rem",fontWeight:600}}>
                        Your counter: {fmt(a.counterProposal.scheduledAt)}  awaiting buyer
                      </div>
                    )}
                    {a.notes && <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.2rem",fontStyle:"italic"}}>{a.notes}</div>}
                    {a.dealerNote && <div style={{fontSize:"0.72rem",color:"#F47B20",marginTop:"0.15rem"}}>Your note: {a.dealerNote}</div>}
                  </div>

                  {/* Quick actions for pending */}
                  {isPending && (
                    <div style={{display:"flex",gap:"0.375rem",flexShrink:0,flexWrap:"wrap"}}>
                      <button onClick={e=>{e.stopPropagation();action(a.appointmentId||a._id,"confirmed");}}
                        style={{background:"#16A34A",color:"#fff",border:"none",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontFamily:"var(--font-display)",letterSpacing:"0.06em",fontWeight:700}}>
                        Confirm
                      </button>
                      <button onClick={e=>{e.stopPropagation();action(a.appointmentId||a._id,"cancelled");}}
                        style={{background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>
                        Decline
                      </button>
                    </div>
                  )}
                  {a.status==="confirmed" && (
                    <button onClick={e=>{e.stopPropagation();action(a.appointmentId||a._id,"completed");}}
                      style={{flexShrink:0,background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL PANEL / MODAL */}
      {selected && (
        <div onClick={()=>{setSelected(null);setShowCounter(false);setMsg("");}}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"520px",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>

            {/* Modal header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",borderBottom:"1px solid #E5E5E5",background:"#fff"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>APPOINTMENT DETAILS</div>
              <button onClick={()=>{setSelected(null);setShowCounter(false);setMsg("");}}
                style={{background:"none",border:"none",color:"#AAA",fontSize:"1.1rem",cursor:"pointer",width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}
                onMouseOver={e=>(e.currentTarget.style.background="#F5F5F5")}
                onMouseOut={e=>(e.currentTarget.style.background="none")}>
                X
              </button>
            </div>

            {/* Modal body */}
            <div style={{overflowY:"auto",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem",flex:1,minHeight:0}}>

              {msg && (
                <div style={{background:msg.startsWith("Error")?"#FEF2F2":"#F0FDF4",border:`1px solid ${msg.startsWith("Error")?"#FECACA":"#86EFAC"}`,borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.82rem",color:msg.startsWith("Error")?"#DC2626":"#15803D",fontWeight:600}}>
                  {msg}
                </div>
              )}

              {/* Buyer card */}
              <div style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.2)",borderRadius:"12px",padding:"1rem",display:"flex",gap:"0.875rem",alignItems:"center"}}>
                <div style={{width:"52px",height:"52px",borderRadius:"50%",background:"#F47B20",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0,overflow:"hidden"}}>
                  {selected.buyerAvatar
                    ? <img src={selected.buyerAvatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <span style={{fontFamily:"var(--font-display)"}}>{(selected.buyerName||selected.userName||"?").charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:"0.95rem",color:"#1A1A1A"}}>{selected.buyerName||selected.userName||"Buyer"}</div>
                  {selected.buyerEmail && <div style={{fontSize:"0.78rem",color:"#737373"}}>{selected.buyerEmail}</div>}
                  <div style={{display:"flex",gap:"0.375rem",marginTop:"0.375rem",flexWrap:"wrap"}}>
                    {selected.buyerPhone && (
                      <a href={`tel:${selected.buyerPhone}`}
                        style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:"6px",padding:"0.25rem 0.625rem",fontSize:"0.72rem",textDecoration:"none",fontWeight:600}}>
                        Call
                      </a>
                    )}
                    {selected.buyerWhatsapp && (
                      <a href={`https://wa.me/${selected.buyerWhatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                        style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",borderRadius:"6px",padding:"0.25rem 0.625rem",fontSize:"0.72rem",textDecoration:"none",fontWeight:600}}>
                        WhatsApp
                      </a>
                    )}
                    {selected.buyerUserId && (
                      <Link href={`/users/${selected.buyerUserId}`}
                        style={{background:"#F5F5F5",border:"1px solid #E5E5E5",color:"#525252",borderRadius:"6px",padding:"0.25rem 0.625rem",fontSize:"0.72rem",textDecoration:"none",fontWeight:600}}>
                        View Profile
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment info grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.625rem"}}>
                {[
                  ["Type", TYPE_LABEL[selected.type]||selected.type?.replace(/_/g," ")],
                  ["Status", STATUS_LABEL[selected.status]||selected.status],
                  ["Requested Date", fmt(selected.scheduledAt)],
                  ["Booked On", fmt(selected.createdAt)],
                ].map(([l,v])=>(
                  <div key={l} style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.75rem"}}>
                    <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.25rem",fontWeight:600}}>{l}</div>
                    <div style={{fontSize:"0.85rem",color:"#1A1A1A",fontWeight:600,textTransform:"capitalize" as const}}>{v||""}</div>
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div style={{background:"#FAFAFA",border:"1px solid #F0F0F0",borderRadius:"8px",padding:"0.875rem"}}>
                  <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"#AAA",marginBottom:"0.35rem",fontWeight:600}}>Buyer Notes</div>
                  <p style={{fontSize:"0.875rem",color:"#525252",lineHeight:1.6,margin:0}}>{selected.notes}</p>
                </div>
              )}

              {/* Counter-proposal display */}
              {selected.counterProposal?.scheduledAt && (
                <div style={{background:"#F5F3FF",border:"1.5px solid rgba(123,104,238,0.3)",borderRadius:"10px",padding:"0.875rem"}}>
                  <div style={{fontSize:"0.68rem",textTransform:"uppercase" as const,letterSpacing:"0.08em",color:"#7B68EE",fontWeight:700,marginBottom:"0.35rem"}}>Your Counter-Proposal (Awaiting Buyer)</div>
                  <div style={{fontSize:"0.875rem",color:"#1A1A1A",fontWeight:600}}>{fmt(selected.counterProposal.scheduledAt)}</div>
                  {selected.counterProposal.note && <p style={{fontSize:"0.8rem",color:"#737373",margin:"0.35rem 0 0",lineHeight:1.5}}>{selected.counterProposal.note}</p>}
                </div>
              )}

              {/* Counter-proposal form */}
              {showCounter && (
                <div style={{background:"#F5F5F5",borderRadius:"10px",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem",border:"1.5px solid #E5E5E5"}}>
                  <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.08em",color:"#525252",textTransform:"uppercase" as const}}>Suggest Alternative Time</div>
                  <div>
                    <label style={{fontSize:"0.68rem",color:"#888",fontWeight:600,display:"block",marginBottom:"0.3rem"}}>Your Available Date &amp; Time *</label>
                    <input type="datetime-local" value={counterDt} onChange={e=>setCounterDt(e.target.value)}
                      style={{width:"100%",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.6rem 0.875rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}
                      onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#E5E5E5"}/>
                  </div>
                  <div>
                    <label style={{fontSize:"0.68rem",color:"#888",fontWeight:600,display:"block",marginBottom:"0.3rem"}}>Message to Buyer (optional)</label>
                    <textarea value={counterNote} onChange={e=>setCounterNote(e.target.value)} rows={2}
                      placeholder="e.g. This time works better for us..."
                      style={{width:"100%",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.6rem 0.875rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",resize:"vertical" as const,boxSizing:"border-box" as const}}/>
                  </div>
                  <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end"}}>
                    <button onClick={()=>{setShowCounter(false);setCounterDt("");setCounterNote("");}}
                      style={{background:"#fff",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>
                      Cancel
                    </button>
                    <button onClick={submitCounter} disabled={saving||!counterDt}
                      style={{background:"#7B68EE",color:"#fff",border:"none",borderRadius:"7px",padding:"0.5rem 1.25rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"var(--font-display)",letterSpacing:"0.06em",fontWeight:700,opacity:saving||!counterDt?0.6:1}}>
                      {saving ? "Sending..." : "Send to Buyer"}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                {selected.status === "pending" && !showCounter && (
                  <>
                    <button onClick={()=>action(selected.appointmentId||selected._id,"confirmed")} disabled={saving}
                      style={{flex:1,background:"#16A34A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.08em",fontWeight:700,opacity:saving?0.6:1}}>
                      Confirm Appointment
                    </button>
                    <button onClick={()=>action(selected.appointmentId||selected._id,"cancelled")} disabled={saving}
                      style={{flex:1,background:"#FEF2F2",color:"#DC2626",border:"1.5px solid #FECACA",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.08em",fontWeight:700,opacity:saving?0.6:1}}>
                      Decline
                    </button>
                  </>
                )}
                {(selected.status === "pending" || selected.status === "confirmed") && !showCounter && (
                  <button onClick={()=>setShowCounter(true)}
                    style={{flex:1,background:"#F5F3FF",color:"#7B68EE",border:"1.5px solid rgba(123,104,238,0.3)",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700}}>
                    Suggest Different Time
                  </button>
                )}
                {selected.status === "confirmed" && !showCounter && (
                  <button onClick={()=>action(selected.appointmentId||selected._id,"completed")} disabled={saving}
                    style={{flex:"1 1 100%",background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600,opacity:saving?0.6:1}}>
                    Mark as Completed
                  </button>
                )}
              </div>

              {/* Dealer note field */}
              {(selected.status==="confirmed"||selected.status==="pending") && !showCounter && (
                <details style={{background:"#FAFAFA",borderRadius:"8px",border:"1px solid #F0F0F0"}}>
                  <summary style={{padding:"0.625rem 0.875rem",fontSize:"0.75rem",color:"#888",cursor:"pointer",fontWeight:600}}>Add internal note</summary>
                  <div style={{padding:"0.625rem 0.875rem",paddingTop:0,display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                    <textarea placeholder="Note visible to you only..." rows={2} id="dealer-note-input"
                      defaultValue={selected.dealerNote||""}
                      style={{width:"100%",background:"#fff",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.5rem",fontSize:"0.8rem",fontFamily:"var(--font-body)",outline:"none",resize:"vertical" as const,boxSizing:"border-box" as const}}/>
                    <button onClick={()=>{
                      const note = (document.getElementById("dealer-note-input") as HTMLTextAreaElement)?.value||"";
                      action(selected.appointmentId||selected._id, selected.status, {dealerNote: note});
                    }} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:700,alignSelf:"flex-end"}}>
                      Save Note
                    </button>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}