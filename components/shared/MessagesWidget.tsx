"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Props { accentColor?: string; }

export default function MessagesWidget({ accentColor = "#F47B20" }: Props) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SYSTEM_ADMIN";
  const uid = user?.userId;

  const [open, setOpen]               = useState(false);
  const [conversations, setConvs]     = useState<any[]>([]);
  const [activeConv, setActiveConv]   = useState<any>(null);
  const [messages, setMessages]       = useState<any[]>([]);
  const [newMsg, setNewMsg]           = useState("");
  const [sending, setSending]         = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [userSearch, setUserSearch]   = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [startMsg, setStartMsg]       = useState("");
  const [selUser, setSelUser]         = useState<any>(null);
  const [unread, setUnread]           = useState(0);
  const msgsEndRef   = useRef<HTMLDivElement>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval>|null>(null);
  const activeRef    = useRef<any>(null);

  // Resizable
  const [panelW, setPanelW] = useState(340);
  const [panelH, setPanelH] = useState(520);
  const isResizing = useRef(false);
  const resizeStart = useRef({x:0,y:0,w:0,h:0});
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault(); isResizing.current=true;
    resizeStart.current={x:e.clientX,y:e.clientY,w:panelW,h:panelH};
    const onMove=(ev:MouseEvent)=>{
      if(!isResizing.current) return;
      setPanelW(Math.min(700,Math.max(280,resizeStart.current.w+(resizeStart.current.x-ev.clientX))));
      setPanelH(Math.min(900,Math.max(340,resizeStart.current.h+(resizeStart.current.y-ev.clientY))));
    };
    const onUp=()=>{isResizing.current=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
  };

  const loadConvs = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/messages/conversations");
      const convs = res.data || [];
      setConvs(convs);
      setUnread(convs.reduce((acc:number,c:any)=>acc+(c.unreadCount||0),0));
    } catch {}
  }, []);

  useEffect(() => {
    loadConvs();
    const t = setInterval(loadConvs, 10000);
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
    if(pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async()=>{
      if(!activeRef.current) return;
      try {
        const res = await api.get(`/api/v1/messages/conversation/${activeRef.current.conversationId}`);
        const msgs = res.data||[];
        setMessages(prev=>{
          if(msgs.length>prev.length) setTimeout(()=>msgsEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
          return msgs;
        });
      } catch {}
    }, 5000);
    setConvs(p=>p.map(c=>c.conversationId===conv.conversationId?{...c,unreadCount:0}:c));
    setUnread(u=>Math.max(0,u-(conv.unreadCount||0)));
  };

  useEffect(()=>()=>{if(pollRef.current) clearInterval(pollRef.current);},[]);

  const sendMessage = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!newMsg.trim()||!activeConv) return;
    // !password command
    if(isSuperAdmin && newMsg.trim().toLowerCase()==="!password") {
      setNewMsg("");
      const genPw = "Reset@"+"".padStart(0)+Math.random().toString(36).slice(-8).toUpperCase();
      try {
        const res = await api.post(`/api/v1/messages/conversation/${activeConv.conversationId}/send`,{
          receiverId:activeConv.otherUser?.userId,
          message:`Your password has been reset by the admin.\n\nNew Password: ${genPw}\n\nPlease log in and change it immediately from your profile settings.`,
        });
        setMessages(p=>[...p,res.data]);
        try { await api.post(`/api/v1/admin/users/${activeConv.otherUser?.userId}/reset-password`,{newPassword:genPw}); } catch {}
      } catch {}
      return;
    }
    setSending(true);
    try {
      const res = await api.post(`/api/v1/messages/conversation/${activeConv.conversationId}/send`,{
        receiverId:activeConv.otherUser?.userId, message:newMsg,
      });
      setMessages(p=>[...p,res.data]); setNewMsg("");
      setTimeout(()=>msgsEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
    } catch {} finally { setSending(false); }
  };

  useEffect(()=>{
    if(userSearch.length<2){setUserResults([]);return;}
    const t=setTimeout(async()=>{
      try{const res=await api.get("/api/v1/messages/search-users",{params:{q:userSearch}});setUserResults(res.data||[]);}catch{}
    },300);
    return()=>clearTimeout(t);
  },[userSearch]);

  const startConversation = async () => {
    if(!selUser||!startMsg.trim()) return;
    try {
      const res = await api.post("/api/v1/messages/start",{receiverId:selUser.userId,message:startMsg});
      setShowNew(false); setUserSearch(""); setSelUser(null); setStartMsg(""); setUserResults([]);
      await loadConvs();
      const freshRes = await api.get("/api/v1/messages/conversations");
      const found = (freshRes.data||[]).find((c:any)=>c.conversationId===res.data?.conversationId);
      if(found) openConv(found);
    } catch(err:any){alert(err.response?.data?.detail||"Failed");}
  };

  const fmtTime=(iso:string)=>{
    if(!iso) return "";
    const d=Date.now()-new Date(iso).getTime(); const m=Math.floor(d/60000);
    return m<1?"now":m<60?`${m}m`:m<1440?`${Math.floor(m/60)}h`:new Date(iso).toLocaleDateString();
  };

  // Render a message bubble — handles announcement + normal messages
  const MsgBubble = ({m}:{m:any}) => {
    const isMe = m.senderId===uid;
    const isAnnouncement = m.type==="announcement";
    return (
      <div style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:"0.5rem"}}>
        <div style={{
          maxWidth:"88%",
          background: isAnnouncement ? "#FFF7ED" : isMe ? accentColor : "#F5F5F5",
          border: isAnnouncement ? "1.5px solid rgba(244,123,32,0.3)" : "none",
          color: isAnnouncement ? "#1A1A1A" : isMe?"#fff":"#1A1A1A",
          borderRadius: isAnnouncement ? "10px" : isMe?"10px 10px 0 10px":"10px 10px 10px 0",
          padding: isAnnouncement ? "0.875rem" : "0.55rem 0.8rem",
          display:"flex",flexDirection:"column" as const,gap:"0.375rem",
        }}>
          {/* Announcement header */}
          {isAnnouncement && (
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.2rem"}}>
              <span style={{fontSize:"0.9rem"}}>📢</span>
              <span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#F47B20"}}>ANNOUNCEMENT</span>
            </div>
          )}
          {/* Title */}
          {(isAnnouncement && m.title) && (
            <div style={{fontWeight:700,fontSize:"0.875rem",color:"#1A1A1A",borderBottom:"1px solid rgba(244,123,32,0.2)",paddingBottom:"0.375rem",marginBottom:"0.25rem"}}>{m.title}</div>
          )}
          {/* Body */}
          <div style={{fontSize:"0.82rem",lineHeight:1.5,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.message}</div>
          {/* Attachment */}
          {m.attachmentUrl && (
            <div style={{marginTop:"0.5rem"}}>
              {m.attachmentType==="image" && (
                <img src={m.attachmentUrl} alt={m.attachmentName||"Image"} onClick={()=>window.open(m.attachmentUrl,"_blank")}
                  style={{maxWidth:"100%",maxHeight:"180px",objectFit:"cover",borderRadius:"6px",cursor:"pointer",border:"1px solid #E5E5E5"}}/>
              )}
              {m.attachmentType==="video" && (
                <video src={m.attachmentUrl} controls style={{maxWidth:"100%",maxHeight:"180px",borderRadius:"6px"}}/>
              )}
              {(!m.attachmentType||m.attachmentType==="document") && m.attachmentUrl && (
                <a href={m.attachmentUrl} target="_blank" rel="noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",background:"rgba(29,68,212,0.08)",border:"1px solid #BFDBFE",borderRadius:"6px",padding:"0.4rem 0.75rem",color:"#1D4ED8",fontSize:"0.8rem",textDecoration:"none"}}>
                  📄 {m.attachmentName||"View Document"}
                </a>
              )}
            </div>
          )}
          <div style={{fontSize:"0.58rem",opacity:0.6,textAlign:"right"}}>{fmtTime(m.createdAt)}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button className="msg-fab" onClick={()=>setOpen(!open)} style={{"--accent":accentColor} as any}>
        MSG
        {unread>0&&!open&&<span className="fab-badge">{unread}</span>}
      </button>

      {open && (
        <div className="msg-panel" style={{"--accent":accentColor,width:panelW+"px",height:panelH+"px"} as any}>
          <div className="resize-handle" onMouseDown={startResize} title="Drag to resize">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 11L11 1M1 6L6 1M6 11L11 6" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>

          <div className="mp-header">
            <span className="mp-title">Messages</span>
            <button className="mp-new" onClick={()=>setShowNew(true)}>+ New</button>
            <button className="mp-close" onClick={()=>{setOpen(false);setActiveConv(null);activeRef.current=null;if(pollRef.current)clearInterval(pollRef.current);}}>✕</button>
          </div>

          {!activeConv ? (
            <div className="conv-list">
              {conversations.length===0 ? (
                <div className="conv-empty">
                  <p>No conversations yet</p>
                  <button className="mp-new-lg" onClick={()=>setShowNew(true)}>Start a conversation</button>
                </div>
              ) : conversations.map(conv=>(
                <div key={conv.conversationId||conv._id} className={`conv-item${activeConv?.conversationId===conv.conversationId?" active":""}`} onClick={()=>openConv(conv)}>
                  <div className="ci-avatar">
                    {conv.type==="announcement"?"📢":conv.otherUser?.profilePicture?<img src={conv.otherUser.profilePicture} alt=""/>:conv.otherUser?.fullName?.charAt(0)||"?"}
                  </div>
                  <div className="ci-info">
                    <div className="ci-name">{conv.type==="announcement"?"📢 CARSTRIMS":conv.otherUser?.fullName||"User"}</div>
                    <div className="ci-last">{conv.lastMessage}</div>
                  </div>
                  <div className="ci-meta">
                    <div className="ci-time">{fmtTime(conv.lastMessageAt)}</div>
                    {(conv.unreadCount||0)>0&&<div className="ci-unread">{conv.unreadCount}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="chat-view">
              <div className="chat-head">
                <button className="chat-back" onClick={()=>{setActiveConv(null);activeRef.current=null;if(pollRef.current)clearInterval(pollRef.current);}}>← back</button>
                <div className="ch-avatar">
                  {activeConv.type==="announcement"?"📢":activeConv.otherUser?.profilePicture?<img src={activeConv.otherUser.profilePicture} alt=""/>:activeConv.otherUser?.fullName?.charAt(0)||"?"}
                </div>
                <div className="ch-name">{activeConv.type==="announcement"?"CARSTRIMS Announcements":activeConv.otherUser?.fullName||"User"}</div>
              </div>
              {/* Car context card — shown when navigated from car listing page */}
              {(activeConv?.carContext||carIdParam)&&(
                <div style={{margin:"0.75rem",borderRadius:"10px",overflow:"hidden",border:"1.5px solid rgba(244,123,32,0.3)",background:"#FFF7ED",flexShrink:0}}>
                  <Link href={activeConv?.carContext?.carId?`/cars/${activeConv.carContext.carId}`:carIdParam?`/cars/${carIdParam}`:"#"}
                    style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.625rem 0.875rem",textDecoration:"none",cursor:"pointer"}}
                    onMouseOver={e=>e.currentTarget.style.background="rgba(244,123,32,0.06)"}
                    onMouseOut={e=>e.currentTarget.style.background=""}>
                    {(activeConv?.carContext?.carImage||carImgParam)&&(
                      <img src={activeConv?.carContext?.carImage||decodeURIComponent(carImgParam||"")} alt=""
                        style={{width:"52px",height:"40px",objectFit:"cover",borderRadius:"6px",flexShrink:0,border:"1px solid rgba(244,123,32,0.2)"}}/>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.6rem",color:"#F47B20",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,marginBottom:"0.15rem"}}>Enquiring about</div>
                      <div style={{fontWeight:700,fontSize:"0.8rem",color:"#1A1A1A",whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis"}}>
                        {activeConv?.carContext?.carBrand||""} {activeConv?.carContext?.carModel||""} {activeConv?.carContext?.carYear||""}
                      </div>
                      {(activeConv?.carContext?.carPrice)&&(
                        <div style={{fontSize:"0.72rem",color:"#F47B20",fontFamily:"var(--font-display)",fontWeight:700}}>NGN {Number(activeConv.carContext.carPrice).toLocaleString()}</div>
                      )}
                    </div>
                    <div style={{fontSize:"0.65rem",color:"#F47B20",fontWeight:600,flexShrink:0}}>View car →</div>
                  </Link>
                </div>
              )}
              <div className="chat-msgs">
                {messages.length===0?<div className="chat-start">No messages yet</div>:messages.map(m=><MsgBubble key={m._id||m.messageId} m={m}/>)}
                <div ref={msgsEndRef}/>
              </div>
              <form className="chat-input" onSubmit={sendMessage}>
                <input placeholder={isSuperAdmin?"Type or !password...":"Type a reply..."} value={newMsg} onChange={e=>setNewMsg(e.target.value)} disabled={sending}/>
                <button type="submit" disabled={sending||!newMsg.trim()}>Send</button>
              </form>
              {isSuperAdmin && <div className="pw-tip">Tip: type <code>!password</code> to reset this user's password</div>}
            </div>
          )}

          {showNew && !activeConv && (
            <div className="new-conv-overlay" onClick={()=>setShowNew(false)}>
              <div className="new-conv" onClick={e=>e.stopPropagation()}>
                <div className="nc-header"><span>New Conversation</span><button onClick={()=>setShowNew(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:"24px",height:"24px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem"}}>✕</button></div>
                <div className="nc-body">
                  <div style={{position:"relative"}}>
                    <input className="nc-input" placeholder="Search by name or email..." value={userSearch} onChange={e=>{setUserSearch(e.target.value);setSelUser(null);}} autoFocus/>
                    {userResults.length>0&&(
                      <div className="nc-results">
                        {userResults.map(u=>(
                          <div key={u.userId} className={`nc-user${selUser?.userId===u.userId?" selected":""}`} onClick={()=>{setSelUser(u);setUserSearch(u.fullName);setUserResults([]);}}>
                            <div className="nu-avatar">{u.profilePicture?<img src={u.profilePicture} alt=""/>:u.fullName?.charAt(0)||"?"}</div>
                            <div><div className="nu-name">{u.fullName}</div><div className="nu-role">{u.role?.replace(/_/g," ")} · {u.email}</div></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selUser&&<div className="nc-selected">To: <strong>{selUser.fullName}</strong><button onClick={()=>{setSelUser(null);setUserSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",marginLeft:"0.5rem"}}>×</button></div>}
                  <textarea className="nc-msg" placeholder="Write your message..." value={startMsg} onChange={e=>setStartMsg(e.target.value)} rows={3}/>
                  <button className="nc-send" onClick={startConversation} disabled={!selUser||!startMsg.trim()}>Start Conversation</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .msg-fab{position:fixed;bottom:1.25rem;right:1.25rem;z-index:9999;background:var(--accent,#F47B20);color:#fff;border:none;border-radius:50%;width:48px;height:48px;font-family:var(--font-display);font-size:0.65rem;font-weight:700;letter-spacing:0.06em;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.2s}
        .msg-fab:hover{transform:scale(1.08)}
        .fab-badge{position:absolute;top:-4px;right:-4px;background:#DC2626;color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;border:2px solid #fff}
        .msg-panel{position:fixed;bottom:80px;right:1.25rem;z-index:9998;background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.18);border:1.5px solid #E5E5E5;display:flex;flex-direction:column;overflow:hidden;min-width:280px;min-height:340px}
        .resize-handle{position:absolute;top:0;left:0;width:24px;height:24px;cursor:nw-resize;display:flex;align-items:center;justify-content:center;z-index:10;border-radius:0 0 8px 0;background:rgba(0,0,0,0.04);transition:background 0.2s}
        .resize-handle:hover{background:rgba(0,0,0,0.1)}
        .mp-header{display:flex;align-items:center;gap:0.5rem;padding:0.875rem 1rem 0.875rem 1.5rem;border-bottom:1px solid #E5E5E5;background:var(--accent,#F47B20);color:#fff;flex-shrink:0}
        .mp-title{font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;flex:1}
        .mp-new{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:5px;padding:0.2rem 0.6rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body)}
        .mp-close{background:none;border:none;color:#fff;font-size:0.875rem;font-weight:700;cursor:pointer}
        .conv-list{flex:1;overflow-y:auto}
        .conv-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;min-height:200px;color:#A3A3A3;font-size:0.875rem}
        .mp-new-lg{background:var(--accent,#F47B20);color:#fff;border:none;border-radius:6px;padding:0.6rem 1.25rem;font-family:var(--font-display);font-size:0.8rem;cursor:pointer}
        .conv-item{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;cursor:pointer;border-bottom:1px solid #F5F5F5;transition:background 0.15s}
        .conv-item:hover,.conv-item.active{background:#FFF7ED}
        .ci-avatar{width:34px;height:34px;border-radius:50%;background:#E5E5E5;color:#737373;font-family:var(--font-display);font-size:0.875rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .ci-avatar img,.ch-avatar img,.nu-avatar img{width:100%;height:100%;object-fit:cover}
        .ci-info{flex:1;min-width:0}
        .ci-name{font-size:0.825rem;font-weight:600;color:#171717;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ci-last{font-size:0.72rem;color:#A3A3A3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ci-meta{display:flex;flex-direction:column;align-items:flex-end;gap:0.25rem;flex-shrink:0}
        .ci-time{font-size:0.62rem;color:#A3A3A3}
        .ci-unread{background:var(--accent,#F47B20);color:#fff;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:0.58rem;font-weight:700}
        .chat-view{display:flex;flex-direction:column;flex:1;overflow:hidden}
        .chat-head{display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1rem;border-bottom:1px solid #E5E5E5;flex-shrink:0}
        .chat-back{background:none;border:none;color:#A3A3A3;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:var(--font-body)}
        .ch-avatar{width:28px;height:28px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.8rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .ch-name{font-size:0.825rem;font-weight:600;color:#171717;flex:1}
        .chat-msgs{flex:1;overflow-y:auto;padding:0.875rem;min-height:0}
        .chat-start{text-align:center;color:#A3A3A3;font-size:0.875rem;padding:2rem 0}
        .chat-input{display:flex;gap:0.375rem;padding:0.75rem;border-top:1px solid #E5E5E5;flex-shrink:0;position:relative;z-index:20}
        .chat-input input{flex:1;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:20px;padding:0.5rem 0.875rem;color:#171717;font-size:0.825rem;font-family:var(--font-body);outline:none}
        .chat-input input:focus{border-color:var(--accent,#F47B20);background:#fff}
        .chat-input button{background:var(--accent,#F47B20);color:#fff;border:none;border-radius:20px;padding:0.5rem 1rem;font-family:var(--font-display);font-size:0.75rem;cursor:pointer}
        .chat-input button:disabled{opacity:0.5;cursor:not-allowed}
        .pw-tip{padding:0.3rem 0.75rem 0.5rem;font-size:0.63rem;color:#A3A3A3;border-top:1px solid #F5F5F5;flex-shrink:0}
        .pw-tip code{background:#F5F5F5;padding:0 0.3rem;border-radius:3px;font-size:0.7rem;color:#555}
        .new-conv-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);display:flex;align-items:flex-start;justify-content:center;padding-top:3rem;z-index:25;border-radius:16px}
        .new-conv{background:#fff;border-radius:12px;width:92%;overflow:hidden;max-height:90%}
        .nc-header{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1rem;background:var(--accent,#F47B20);color:#fff}
        .nc-header span{font-family:var(--font-display);font-size:0.875rem}
        .nc-header button{background:none;border:none;color:#fff;font-weight:700;cursor:pointer}
        .nc-body{padding:1rem;display:flex;flex-direction:column;gap:0.75rem;overflow-y:auto}
        .nc-input{width:100%;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.65rem 0.875rem;color:#171717;font-size:0.825rem;font-family:var(--font-body);outline:none;box-sizing:border-box}
        .nc-input:focus{border-color:var(--accent,#F47B20);background:#fff}
        .nc-results{position:absolute;top:calc(100%+4px);left:0;right:0;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;z-index:50;max-height:160px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.1)}
        .nc-user{display:flex;align-items:center;gap:0.625rem;padding:0.65rem 0.875rem;cursor:pointer;border-bottom:1px solid #F5F5F5}
        .nc-user:hover,.nc-user.selected{background:#FFF7ED}
        .nu-avatar{width:28px;height:28px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.8rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .nu-name{font-size:0.8rem;font-weight:500;color:#171717}
        .nu-role{font-size:0.68rem;color:#A3A3A3;text-transform:capitalize}
        .nc-selected{background:#FFF7ED;border:1px solid rgba(244,123,32,0.3);color:#C4621A;padding:0.4rem 0.75rem;border-radius:5px;font-size:0.8rem;display:flex;align-items:center;justify-content:space-between}
        .nc-msg{width:100%;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.65rem;color:#171717;font-size:0.825rem;font-family:var(--font-body);outline:none;resize:vertical;min-height:70px;box-sizing:border-box}
        .nc-msg:focus{border-color:var(--accent,#F47B20);background:#fff}
        .nc-send{width:100%;background:var(--accent,#F47B20);color:#fff;border:none;border-radius:6px;padding:0.75rem;font-family:var(--font-display);font-size:0.85rem;letter-spacing:0.06em;cursor:pointer}
        .nc-send:disabled{opacity:0.5;cursor:not-allowed}
        @media(max-width:640px){.msg-panel{width:calc(100vw - 1.5rem)!important;right:0.75rem;bottom:80px;max-height:70vh}}
      `}</style>
    </>
  );
}





