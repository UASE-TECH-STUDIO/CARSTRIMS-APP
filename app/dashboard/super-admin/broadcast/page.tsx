"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

const ROLE_OPTIONS = [
  { value:"all", label:"All Users", icon:"👥" },
  { value:"DEALER_ADMIN", label:"Dealers Only", icon:"🏢" },
  { value:"DEALER_STAFF", label:"Staff Only", icon:"👤" },
  { value:"PARTNER_USER", label:"Partners Only", icon:"🤝" },
  { value:"PUBLIC_USER", label:"Public Users Only", icon:"🌐" },
];

export default function BroadcastPage() {
  const [form, setForm] = useState({ title:"", message:"", targetRole:"all", type:"announcement" });
  const [attachUrl, setAttachUrl] = useState("");
  const [attachName, setAttachName] = useState("");
  const [attachIsImage, setAttachIsImage] = useState(false);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    api.get("/api/v1/admin/broadcasts").then(r=>setHistory(r.data?.broadcasts||[])).catch(()=>{});
  },[]);

  const handleAttach = async (file: File) => {
    setUploadingAttach(true); setErr("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await api.post("/api/v1/admin/upload/document", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setAttachUrl(res.data.url); setAttachName(res.data.name||file.name); setAttachIsImage(!!res.data.isImage);
    } catch(e:any) { setErr("Attachment upload failed: "+(e.response?.data?.detail||e.message)); }
    finally { setUploadingAttach(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()||!form.message.trim()) { setErr("Title and message are required"); return; }
    setSending(true); setErr("");
    try {
      const res = await api.post("/api/v1/admin/broadcast", {
        ...form,
        documentUrl: attachUrl||undefined,
        documentName: attachName||undefined,
      });
      setResult(res.data);
      setHistory(prev=>[{ ...form, attachUrl, attachName, sentAt:new Date().toISOString(), sentTo:res.data.sentTo||0 },...prev]);
      setForm({ title:"", message:"", targetRole:"all", type:"announcement" });
      setAttachUrl(""); setAttachName(""); setAttachIsImage(false);
    } catch(e:any) { setErr(e.response?.data?.detail||"Failed to send"); }
    finally { setSending(false); }
  };

  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleString("en-NG"); } catch { return "-"; } };

  const fi: React.CSSProperties = { background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.75rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", fontFamily:"var(--font-body)", outline:"none", width:"100%", boxSizing:"border-box" as const };
  const lbl: React.CSSProperties = { fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"0.35rem" };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Broadcast Messages</h2>
        <p style={{fontSize:"0.82rem",color:"#737373",marginTop:"0.3rem"}}>Send announcements to all or specific users — delivered to their notifications and inbox. Users cannot reply to broadcasts.</p>
      </div>

      {result&&(
        <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>✅ Broadcast sent to <strong>{result.sentTo||result.recipientCount||"all"}</strong> users. It appears in their notifications and inbox.</span>
          <button onClick={()=>setResult(null)} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
        </div>
      )}
      {err&&(
        <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.875rem 1.25rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between"}}>
          <span>❌ {err}</span><button onClick={()=>setErr("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:"1.25rem"}}>
        {/* Compose */}
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373"}}>COMPOSE BROADCAST</div>

          <form onSubmit={handleSend} style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            {/* Target */}
            <div>
              <label style={lbl}>Target Audience</label>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {ROLE_OPTIONS.map(r=>(
                  <button key={r.value} type="button" onClick={()=>setForm({...form,targetRole:r.value})}
                    style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.6rem 0.875rem",background:form.targetRole===r.value?"#FFF7ED":"#F5F5F5",border:`1.5px solid ${form.targetRole===r.value?"#F47B20":"#E5E5E5"}`,borderRadius:"8px",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:"0.825rem",color:form.targetRole===r.value?"#C4621A":"#525252",transition:"all 0.2s",textAlign:"left" as const}}>
                    <span>{r.icon}</span><span>{r.label}</span>
                    {form.targetRole===r.value&&<span style={{marginLeft:"auto",color:"#F47B20",fontWeight:700}}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label style={lbl}>Message Type</label>
              <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
                {["announcement","warning","update","promotion"].map(t=>(
                  <button key={t} type="button" onClick={()=>setForm({...form,type:t})}
                    style={{background:form.type===t?"#1A1A1A":"transparent",border:"1.5px solid",borderColor:form.type===t?"#1A1A1A":"#E5E5E5",borderRadius:"20px",padding:"0.3rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",color:form.type===t?"#fff":"#737373",fontFamily:"var(--font-body)",textTransform:"capitalize" as const,transition:"all 0.2s"}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={lbl}>Title *</label>
              <input style={fi} placeholder="e.g. Platform Update Notice" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
            </div>

            {/* Message */}
            <div>
              <label style={lbl}>Message *</label>
              <textarea style={{...fi,minHeight:"120px",resize:"vertical" as const}} rows={6}
                placeholder="Write your message. This will appear in the user's notifications and inbox." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required/>
              <div style={{fontSize:"0.68rem",color:"#A3A3A3",textAlign:"right",marginTop:"0.25rem"}}>{form.message.length} characters</div>
            </div>

            {/* Attachment */}
            <div>
              <label style={lbl}>Attachment <span style={{fontWeight:400,textTransform:"none" as const,color:"#A3A3A3"}}>(optional — image or document)</span></label>
              {attachUrl?(
                <div style={{display:"flex",alignItems:"center",gap:"0.75rem",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem"}}>
                  {attachIsImage&&<img src={attachUrl} alt="" style={{width:"56px",height:"44px",objectFit:"cover",borderRadius:"4px",border:"1px solid #E5E5E5"}}/>}
                  {!attachIsImage&&<span style={{fontSize:"1.5rem"}}>📄</span>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"0.8rem",fontWeight:600,color:"#1A1A1A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{attachName}</div>
                    <div style={{fontSize:"0.7rem",color:"#A3A3A3"}}>{attachIsImage?"Image":"Document"} · Click × to remove</div>
                  </div>
                  <button type="button" onClick={()=>{setAttachUrl("");setAttachName("");setAttachIsImage(false);}} style={{background:"#FEF2F2",border:"1px solid rgba(220,38,38,0.3)",color:"#DC2626",borderRadius:"6px",padding:"0.3rem 0.6rem",fontSize:"0.75rem",cursor:"pointer",flexShrink:0}}>✕ Remove</button>
                </div>
              ):(
                <button type="button" onClick={()=>fileRef.current?.click()} disabled={uploadingAttach}
                  style={{background:"#F5F5F5",border:"1.5px dashed #D4D4D4",borderRadius:"8px",padding:"0.875rem 1.25rem",fontSize:"0.825rem",cursor:"pointer",color:"#737373",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",transition:"all 0.2s",opacity:uploadingAttach?0.6:1}}>
                  {uploadingAttach?"⏳ Uploading...":"📎 Attach image or document (JPG, PNG, PDF)"}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f) handleAttach(f); e.target.value="";}}/>
            </div>

            {/* No-reply notice */}
            <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.8rem",color:"#1D4ED8",lineHeight:1.6}}>
              📢 <strong>One-way broadcast:</strong> Recipients cannot reply. This message is sent to their notification feed and inbox. For two-way messaging, use the Messages widget to start a direct conversation.
            </div>

            {/* Preview */}
            <div style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderLeft:"3px solid #F47B20",borderRadius:"8px",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <div style={{fontSize:"0.65rem",letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#A3A3A3"}}>Preview</div>
              <div style={{fontWeight:600,fontSize:"0.9rem",color:"#1A1A1A"}}>{form.title||"Message title..."}</div>
              <div style={{fontSize:"0.8rem",color:"#737373",lineHeight:1.5}}>{form.message||"Your message will appear here..."}</div>
              {attachUrl&&attachIsImage&&<img src={attachUrl} alt="" style={{maxWidth:"200px",borderRadius:"6px",marginTop:"0.25rem"}}/>}
              {attachUrl&&!attachIsImage&&<div style={{fontSize:"0.78rem",color:"#1D4ED8"}}>📄 {attachName}</div>}
              <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.2rem",textTransform:"capitalize" as const}}>
                To: {ROLE_OPTIONS.find(r=>r.value===form.targetRole)?.label} · Type: {form.type}
              </div>
            </div>

            <button type="submit" disabled={sending||uploadingAttach}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.1em",cursor:"pointer",opacity:sending||uploadingAttach?0.6:1,transition:"opacity 0.2s"}}>
              {sending?"Sending...":uploadingAttach?"Uploading...":(`Send to ${ROLE_OPTIONS.find(r=>r.value===form.targetRole)?.label}`)}
            </button>
          </form>
        </div>

        {/* History */}
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373"}}>SENT BROADCASTS</div>
          {history.length===0?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",padding:"2rem",textAlign:"center",color:"#737373",fontSize:"0.875rem"}}>
              <span style={{fontSize:"2rem"}}>📭</span><p>No broadcasts yet</p>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",overflowY:"auto",maxHeight:"600px"}}>
              {history.map((h,i)=>(
                <div key={i} style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"8px",padding:"0.875rem",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
                    <span style={{fontSize:"0.68rem",fontWeight:600,textTransform:"capitalize" as const,padding:"0.15rem 0.5rem",borderRadius:"20px",background:h.type==="warning"?"rgba(220,38,38,0.1)":h.type==="announcement"?"rgba(244,123,32,0.1)":"rgba(59,139,212,0.1)",color:h.type==="warning"?"#DC2626":h.type==="announcement"?"#F47B20":"#3B8BD4",border:`1px solid ${h.type==="warning"?"rgba(220,38,38,0.2)":h.type==="announcement"?"rgba(244,123,32,0.2)":"rgba(59,139,212,0.2)"}`}}>{h.type||"broadcast"}</span>
                    <span style={{fontSize:"0.68rem",color:"#A3A3A3"}}>→ {ROLE_OPTIONS.find(r=>r.value===h.targetRole)?.label}</span>
                    {h.sentTo&&<span style={{fontSize:"0.65rem",color:"#A3A3A3",marginLeft:"auto"}}>{h.sentTo} users</span>}
                  </div>
                  <div style={{fontWeight:600,fontSize:"0.875rem",color:"#1A1A1A"}}>{h.title}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373",lineHeight:1.4}}>{(h.message||"").slice(0,80)}{(h.message||"").length>80?"...":""}</div>
                  {h.attachUrl&&<div style={{fontSize:"0.72rem",color:"#1D4ED8"}}>📎 {h.attachName||"Attachment"}</div>}
                  <div style={{fontSize:"0.68rem",color:"#A3A3A3",fontFamily:"monospace"}}>{fmtDate(h.sentAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:900px){div[style*="gridTemplateColumns:1fr 340px"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
