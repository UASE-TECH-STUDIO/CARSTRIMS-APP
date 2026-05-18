"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// Consistent message system — same engine as MessagesWidget used by all other roles
export default function UserMessagesPage() {
  const { user } = useAuthStore();
  const uid = user?.userId;
  const searchParams = useSearchParams();
  const targetConvId = searchParams?.get("conv");
  const targetCarId  = searchParams?.get("carId");

  const [conversations, setConvs]   = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages]     = useState<any[]>([]);
  const [newMsg, setNewMsg]         = useState("");
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [showNew, setShowNew]       = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [startMsg, setStartMsg]     = useState("");
  const [selUser, setSelUser]       = useState<any>(null);
  const [unread, setUnread]         = useState(0);
  const [carContext, setCarContext]  = useState<any>(null);
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const activeRef  = useRef<any>(null);

  const loadConvs = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/api/v1/messages/conversations");
      const convs = res.data || [];
      setConvs(convs);
      setUnread(convs.reduce((a:number,c:any)=>a+(c.unreadCount||0),0));
    } catch {} finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  // Background poll
  useEffect(() => {
    const t = setInterval(()=>loadConvs(true), 12000);
    return () => clearInterval(t);
  }, [loadConvs]);

  const loadMessages = useCallback(async (conv:any) => {
    try {
      const res = await api.get(`/api/v1/messages/conversation/${conv.conversationId}`);
      setMessages(res.data||[]);
      setTimeout(()=>msgsEndRef.current?.scrollIntoView({behavior:"smooth"}),60);
    } catch {}
  },[]);

  const openConv = (conv:any) => {
    setActiveConv(conv); activeRef.current=conv;
    loadMessages(conv);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async()=>{
      if (!activeRef.current) return;
      try {
        const res = await api.get(`/api/v1/messages/conversation/${activeRef.current.conversationId}`);
        const msgs = res.data||[];
        setMessages(prev=>{
          if (msgs.length>prev.length) setTimeout(()=>msgsEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
          return msgs;
        });
      } catch {};
    },5000);
    setConvs(p=>p.map(c=>c.conversationId===conv.conversationId?{...c,unreadCount:0}:c));
    setUnread(u=>Math.max(0,u-(conv.unreadCount||0)));
  };

  useEffect(()=>()=>{if(pollRef.current) clearInterval(pollRef.current);},[]);

  // Auto-open conversation from URL params (e.g. from "Message Dealer" button)
  useEffect(()=>{
    if (!targetConvId || conversations.length===0) return;
    const found = conversations.find(c=>c.conversationId===targetConvId);
    if (found && (!activeConv || activeConv.conversationId!==targetConvId)) openConv(found);
  },[targetConvId, conversations]);

  // Load car context if carId param exists
  useEffect(()=>{
    if (!targetCarId) return;
    api.get(`/api/v1/public/cars/${targetCarId}`).then(r=>setCarContext(r.data)).catch(()=>{});
  },[targetCarId]);

  const sendMessage = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()||!activeConv) return;
    setSending(true);
    try {
      const res = await api.post(`/api/v1/messages/conversation/${activeConv.conversationId}/send`,{
        receiverId:activeConv.otherUser?.userId, message:newMsg,
      });
      setMessages(p=>[...p,res.data]); setNewMsg("");
      setTimeout(()=>msgsEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
      loadConvs(true);
    } catch {} finally { setSending(false); }
  };

  useEffect(()=>{
    if (userSearch.length<2){setUserResults([]);return;}
    const t=setTimeout(async()=>{
      try{const res=await api.get("/api/v1/messages/search-users",{params:{q:userSearch}});setUserResults(res.data||[]);}catch{}
    },300);
    return()=>clearTimeout(t);
  },[userSearch]);

  const startConversation = async () => {
    if (!selUser||!startMsg.trim()) return;
    try {
      const res = await api.post("/api/v1/messages/start",{receiverId:selUser.userId,message:startMsg});
      setShowNew(false); setUserSearch(""); setSelUser(null); setStartMsg(""); setUserResults([]);
      await loadConvs();
      const freshRes = await api.get("/api/v1/messages/conversations");
      const found = (freshRes.data||[]).find((c:any)=>c.conversationId===res.data?.conversationId);
      if (found) openConv(found);
    } catch(err:any){alert(err.response?.data?.detail||"Failed");}
  };

  const fmtTime=(iso:string)=>{
    if(!iso) return "";
    const d=Date.now()-new Date(iso).getTime(); const m=Math.floor(d/60000);
    return m<1?"now":m<60?`${m}m`:m<1440?`${Math.floor(m/60)}h`:new Date(iso).toLocaleDateString();
  };

  const MsgBubble = ({m}:{m:any}) => {
    const isMe = m.senderId===uid;
    const isAnnouncement = m.type==="announcement";
    return (
      <div style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:"0.625rem"}}>
        <div style={{maxWidth:"80%",background:isAnnouncement?"#FFF7ED":isMe?"#F47B20":"#fff",border:isAnnouncement?"1.5px solid rgba(244,123,32,0.3)":isMe?"none":"1.5px solid #E5E5E5",color:isAnnouncement?"#1A1A1A":isMe?"#fff":"#1A1A1A",borderRadius:isAnnouncement?"10px":isMe?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:isAnnouncement?"0.875rem":"0.6rem 0.875rem",display:"flex",flexDirection:"column" as const,gap:"0.3rem",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          {isAnnouncement&&(<div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.2rem"}}><span>📢</span><span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#F47B20"}}>ANNOUNCEMENT</span></div>)}
          {isAnnouncement&&m.title&&<div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A",borderBottom:"1px solid rgba(244,123,32,0.2)",paddingBottom:"0.375rem"}}>{m.title}</div>}
          <div style={{fontSize:"0.875rem",lineHeight:1.55,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.message}</div>
          {m.attachmentUrl&&(
            <div style={{marginTop:"0.375rem"}}>
              {m.attachmentType==="image"&&<img src={m.attachmentUrl} alt="" onClick={()=>window.open(m.attachmentUrl,"_blank")} style={{maxWidth:"100%",maxHeight:"180px",objectFit:"cover",borderRadius:"6px",cursor:"pointer"}}/>}
              {m.attachmentType==="video"&&<video src={m.attachmentUrl} controls style={{maxWidth:"100%",maxHeight:"160px",borderRadius:"6px"}}/>}
              {(!m.attachmentType||m.attachmentType==="document")&&m.attachmentUrl&&<a href={m.attachmentUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",background:"rgba(29,68,212,0.08)",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.4rem 0.75rem",color:"#1D4ED8",fontSize:"0.8rem",textDecoration:"none"}}>📄 {m.attachmentName||"View Document"}</a>}
            </div>
          )}
          <div style={{fontSize:"0.6rem",opacity:0.55,textAlign:"right"}}>{fmtTime(m.createdAt)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="um-page">
      {/* Header */}
      <div className="um-header">
        <div>
          <h2 className="um-title">Messages</h2>
          <p className="um-sub">{unread>0?`${unread} unread`:"All caught up"}</p>
        </div>
        <button className="um-new-btn" onClick={()=>setShowNew(true)}>+ New</button>
      </div>

      <div className="um-body">
        {/* Conversations list */}
        <div className={`um-convs ${activeConv?"hide-mobile":""}`}>
          {loading ? (
            <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
              <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : conversations.length===0 ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"3rem",textAlign:"center"}}>
              <div style={{fontSize:"2.5rem"}}>💬</div>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#1A1A1A",letterSpacing:"0.06em"}}>No conversations yet</div>
              <p style={{fontSize:"0.875rem",color:"#737373",lineHeight:1.5}}>Message a dealer from any car listing or start a new conversation</p>
              <button onClick={()=>setShowNew(true)} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer"}}>Start a Conversation</button>
            </div>
          ) : conversations.map(conv=>(
            <div key={conv.conversationId} className={`um-conv-item ${activeConv?.conversationId===conv.conversationId?"active":""}`} onClick={()=>openConv(conv)}>
              <div className="um-ci-avatar">
                {conv.type==="announcement"?"📢":conv.otherUser?.profilePicture?<img src={conv.otherUser.profilePicture} alt=""/>:conv.otherUser?.fullName?.charAt(0)||"?"}
              </div>
              <div className="um-ci-info">
                <div className="um-ci-name">{conv.type==="announcement"?"📢 CARSTRIMS":conv.otherUser?.fullName||"User"}</div>
                <div className="um-ci-last">{conv.lastMessage}</div>
              </div>
              <div className="um-ci-meta">
                <span className="um-ci-time">{fmtTime(conv.lastMessageAt)}</span>
                {(conv.unreadCount||0)>0&&<span className="um-ci-unread">{conv.unreadCount}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Chat view */}
        <div className={`um-chat ${!activeConv?"um-chat-empty":""}`}>
          {!activeConv ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:"1rem",color:"#A3A3A3",textAlign:"center",padding:"2rem"}}>
              <div style={{fontSize:"3rem",opacity:0.4}}>💬</div>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.08em"}}>Select a conversation</div>
              <p style={{fontSize:"0.875rem",lineHeight:1.5}}>Choose a conversation from the left or start a new one</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="um-chat-head">
                <button className="um-back-btn" onClick={()=>{setActiveConv(null);activeRef.current=null;if(pollRef.current)clearInterval(pollRef.current);}}>← Back</button>
                <div className="um-ch-avatar">
                  {activeConv.type==="announcement"?"📢":activeConv.otherUser?.profilePicture?<img src={activeConv.otherUser.profilePicture} alt=""/>:activeConv.otherUser?.fullName?.charAt(0)||"?"}
                </div>
                <div className="um-ch-name">{activeConv.type==="announcement"?"CARSTRIMS Announcements":activeConv.otherUser?.fullName||"User"}</div>
              </div>

              {/* Car context card (WhatsApp-style) */}
              {carContext && (
                <div style={{padding:"0.75rem 1rem",borderBottom:"1px solid #F0F0F0"}}>
                  <a href={`/cars/${carContext.carId}`} style={{display:"flex",alignItems:"center",gap:"0.75rem",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",borderRadius:"10px",padding:"0.75rem",textDecoration:"none",transition:"background 0.15s"}} onMouseOver={e=>e.currentTarget.style.background="#FFE8CC"} onMouseOut={e=>e.currentTarget.style.background="#FFF7ED"}>
                    {carContext.images?.[0]&&<img src={carContext.images[0]} alt="" style={{width:"52px",height:"40px",objectFit:"cover",borderRadius:"6px",flexShrink:0,border:"1px solid rgba(244,123,32,0.2)"}}/>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#F47B20"}}>Car Enquiry</div>
                      <div style={{fontSize:"0.9rem",fontWeight:700,color:"#1A1A1A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{carContext.brand} {carContext.model} {carContext.year}</div>
                      {carContext.sellingPrice&&<div style={{fontFamily:"var(--font-display)",fontSize:"0.875rem",color:"#F47B20"}}>₦{carContext.sellingPrice.toLocaleString()}</div>}
                    </div>
                    <span style={{fontSize:"0.72rem",color:"#F47B20",fontWeight:700,flexShrink:0}}>View →</span>
                  </a>
                </div>
              )}

              {/* Messages */}
              <div className="um-msgs">
                {messages.length===0?<div style={{textAlign:"center",color:"#A3A3A3",fontSize:"0.875rem",padding:"2rem"}}>No messages yet — say hello!</div>:messages.map(m=><MsgBubble key={m._id||m.messageId} m={m}/>)}
                <div ref={msgsEndRef}/>
              </div>

              {/* Input */}
              {activeConv.type!=="announcement" && (
                <form className="um-input-row" onSubmit={sendMessage}>
                  <input className="um-input" placeholder="Type a message..." value={newMsg} onChange={e=>setNewMsg(e.target.value)} disabled={sending}/>
                  <button type="submit" className="um-send-btn" disabled={sending||!newMsg.trim()}>Send</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      {showNew && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"440px",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",background:"#F47B20",color:"#fff"}}>
              <span style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em"}}>NEW CONVERSATION</span>
              <button onClick={()=>setShowNew(false)} style={{background:"none",border:"none",color:"#fff",fontSize:"1.1rem",cursor:"pointer",fontWeight:700}}>✕</button>
            </div>
            <div style={{padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
              <div style={{position:"relative"}}>
                <input style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}} placeholder="Search by name or email..." value={userSearch} onChange={e=>{setUserSearch(e.target.value);setSelUser(null);}} autoFocus/>
                {userResults.length>0&&(
                  <div style={{position:"absolute",top:"calc(100%+4px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",zIndex:50,maxHeight:"160px",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}>
                    {userResults.map(u=>(
                      <div key={u.userId} onClick={()=>{setSelUser(u);setUserSearch(u.fullName);setUserResults([]);}} style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.65rem 0.875rem",cursor:"pointer",borderBottom:"1px solid #F5F5F5",transition:"background 0.15s"}} onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"} onMouseOut={e=>e.currentTarget.style.background=""}>
                        <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#E5E5E5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:700,flexShrink:0,overflow:"hidden"}}>
                          {u.profilePicture?<img src={u.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:u.fullName?.charAt(0)||"?"}
                        </div>
                        <div><div style={{fontSize:"0.8rem",fontWeight:600,color:"#1A1A1A"}}>{u.fullName}</div><div style={{fontSize:"0.68rem",color:"#A3A3A3",textTransform:"capitalize" as const}}>{u.role?.replace(/_/g," ")}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selUser&&<div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",color:"#C4621A",padding:"0.5rem 0.875rem",borderRadius:"6px",fontSize:"0.85rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>To: <strong>{selUser.fullName}</strong><button onClick={()=>{setSelUser(null);setUserSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:"1rem"}}>×</button></div>}
              <textarea style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",resize:"vertical" as const,minHeight:"80px",boxSizing:"border-box" as const}} placeholder="Write your message..." value={startMsg} onChange={e=>setStartMsg(e.target.value)}/>
              <button onClick={startConversation} disabled={!selUser||!startMsg.trim()} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",cursor:"pointer",opacity:!selUser||!startMsg.trim()?0.5:1}}>Start Conversation</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .um-page{display:flex;flex-direction:column;gap:0;height:calc(100vh - 130px);font-family:var(--font-body)}
        .um-header{display:flex;align-items:center;justify-content:space-between;padding:0 0 1rem}
        .um-title{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .um-sub{font-size:0.8rem;color:#737373;margin-top:0.2rem}
        .um-new-btn{background:#F47B20;color:#fff;border:none;border-radius:8px;padding:0.6rem 1.25rem;fontFamily:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;font-family:var(--font-display)}
        .um-body{display:flex;flex:1;gap:0;background:#fff;border:1.5px solid #E5E5E5;border-radius:14px;overflow:hidden;min-height:0}
        .um-convs{width:300px;flex-shrink:0;border-right:1.5px solid #E5E5E5;overflow-y:auto;background:#FAFAFA}
        .um-conv-item{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;cursor:pointer;border-bottom:1px solid #F0F0F0;transition:background 0.15s}
        .um-conv-item:hover,.um-conv-item.active{background:#FFF7ED}
        .um-ci-avatar{width:38px;height:38px;border-radius:50%;background:#E5E5E5;color:#737373;font-weight:700;font-size:0.875rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .um-ci-avatar img{width:100%;height:100%;object-fit:cover}
        .um-ci-info{flex:1;min-width:0}
        .um-ci-name{font-size:0.875rem;font-weight:700;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .um-ci-last{font-size:0.75rem;color:#A3A3A3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:0.15rem}
        .um-ci-meta{display:flex;flex-direction:column;align-items:flex-end;gap:0.2rem;flex-shrink:0}
        .um-ci-time{font-size:0.65rem;color:#A3A3A3}
        .um-ci-unread{background:#F47B20;color:#fff;border-radius:50%;width:17px;height:17px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700}
        .um-chat{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
        .um-chat-empty{align-items:center;justify-content:center}
        .um-chat-head{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1.25rem;border-bottom:1.5px solid #E5E5E5;flex-shrink:0;background:#fff}
        .um-back-btn{background:none;border:none;color:#A3A3A3;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:var(--font-body);display:none}
        .um-ch-avatar{width:32px;height:32px;border-radius:50%;background:#E5E5E5;display:flex;align-items:center;justify-content:center;font-size:0.875rem;font-weight:700;overflow:hidden;flex-shrink:0}
        .um-ch-avatar img{width:100%;height:100%;object-fit:cover}
        .um-ch-name{font-size:0.9rem;font-weight:700;color:#1A1A1A;flex:1}
        .um-msgs{flex:1;overflow-y:auto;padding:1rem;background:#F5F5F5;min-height:0}
        .um-input-row{display:flex;gap:0.5rem;padding:0.875rem;border-top:1.5px solid #E5E5E5;background:#fff;flex-shrink:0}
        .um-input{flex:1;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:20px;padding:0.625rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none}
        .um-input:focus{border-color:#F47B20;background:#fff}
        .um-send-btn{background:#F47B20;color:#fff;border:none;border-radius:20px;padding:0.625rem 1.25rem;font-family:var(--font-display);font-size:0.8rem;cursor:pointer;flex-shrink:0}
        .um-send-btn:disabled{opacity:0.5;cursor:not-allowed}
        @media(max-width:768px){
          .um-page{height:calc(100vh - 100px)}
          .um-convs{width:100%}
          .um-convs.hide-mobile{display:none}
          .um-back-btn{display:block}
          .um-convs{border-right:none}
        }
      `}</style>
    </div>
  );
}
