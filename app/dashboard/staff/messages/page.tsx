"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import { timeAgoShort, fmtFullDate } from "@/lib/timeUtils";

export default function StaffMessagesPage() {
  const [tab, setTab]      = useState<"dealer"|"mine">("dealer");
  const [perms, setPerms]  = useState<string[]>([]);
  const [dlrName, setName] = useState("Dealer");
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/staff/me").catch(() => null),
      api.get("/api/v1/staff/me/dealer").catch(() => null),
    ]).then(([sr, dr]) => {
      setPerms(sr?.data?.permissions || []);
      if (dr?.data?.companyName) setName(dr.data.companyName);
    }).finally(() => setLoad(false));
  }, []);

  const canView  = perms.includes("view_messages") || perms.includes("send_messages");
  const canReply = perms.includes("send_messages");

  if (loading) return (
    <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
      <div style={{width:"24px",height:"24px",border:"2.5px solid #E5E5E5",
        borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",
          letterSpacing:"0.05em",color:"#1A1A1A",margin:"0 0 2px"}}>Messages</h2>
        <p style={{fontSize:"12px",color:"#888",margin:0}}>
          {tab==="dealer"?`Managing ${dlrName}'s messages`:"Your personal messages"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
        {canView && (
          <button onClick={()=>setTab("dealer")}
            style={{flex:1,minWidth:"120px",padding:"9px 12px",border:`1.5px solid ${tab==="dealer"?"#F47B20":"#E5E5E5"}`,
              background:tab==="dealer"?"#F47B20":"#fff",color:tab==="dealer"?"#fff":"#525252",
              borderRadius:"8px",fontSize:"13px",cursor:"pointer",fontWeight:tab==="dealer"?700:400,
              fontFamily:"var(--font-display)",letterSpacing:"0.05em"}}>
            {dlrName} Messages
          </button>
        )}
        <button onClick={()=>setTab("mine")}
          style={{flex:1,minWidth:"120px",padding:"9px 12px",border:`1.5px solid ${tab==="mine"?"#F47B20":"#E5E5E5"}`,
            background:tab==="mine"?"#F47B20":"#fff",color:tab==="mine"?"#fff":"#525252",
            borderRadius:"8px",fontSize:"13px",cursor:"pointer",fontWeight:tab==="mine"?700:400,
            fontFamily:"var(--font-display)",letterSpacing:"0.05em"}}>
          My Messages
        </button>
      </div>

      {/* Info banner */}
      {tab==="dealer" && canView && (
        <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"7px",
          padding:"8px 12px",fontSize:"12px",color:"#1D4ED8",lineHeight:1.5}}>
          <strong>Dealer view:</strong> All messages sent to and from <strong>{dlrName}</strong> are shown.
          {!canReply&&<em> (View-only  no reply permission)</em>}
        </div>
      )}
      {tab==="mine"&&(
        <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"7px",
          padding:"8px 12px",fontSize:"12px",color:"#15803D",lineHeight:1.5}}>
          <strong>Your messages:</strong> Personal conversations with colleagues or the dealer.
        </div>
      )}

      {/* No permission */}
      {tab==="dealer" && !canView ? (
        <div style={{padding:"2rem",textAlign:"center",background:"#fff",
          border:"1.5px solid #E5E5E5",borderRadius:"10px"}}>
          <div style={{fontSize:"2rem",marginBottom:"8px"}}></div>
          <div style={{fontFamily:"var(--font-display)",color:"#DC2626",fontWeight:700}}>Permission Required</div>
          <p style={{color:"#737373",fontSize:"13px",margin:"6px 0 0"}}>
            You need "View Messages" permission.
          </p>
        </div>
      ) : (
        <ConvPanel key={tab} mode={tab} canReply={tab==="mine"||canReply} dealerName={dlrName}/>
      )}
    </div>
  );
}

//  CONVERSATION PANEL 
function ConvPanel({mode,canReply,dealerName}:{mode:"dealer"|"mine";canReply:boolean;dealerName:string}) {
  const [convs,    setConvs]   = useState<any[]>([]);
  const [active,   setActive]  = useState<any>(null);
  const [messages, setMsgs]    = useState<any[]>([]);
  const [newMsg,   setNewMsg]  = useState("");
  const [sending,  setSending] = useState(false);
  const [loading,  setLoad]    = useState(true);
  const [showNew,  setShowNew] = useState(false);
  const [uSearch,  setUS]      = useState("");
  const [uResults, setUR]      = useState<any[]>([]);
  const [selUser,  setSel]     = useState<any>(null);
  const [startMsg, setStart]   = useState("");
  const [s2,       setS2]      = useState(false);
  const [myTeam,   setTeam]    = useState<any[]>([]);
  const [myUid,    setMyUid]   = useState("");
  // Mobile: show list (false) or chat (true)
  const [showChat, setChat]    = useState(false);

  const endRef    = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval>|null>(null);
  const activeRef = useRef<any>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const ac        = "#F47B20";

  useEffect(()=>{
    try{
      const raw=localStorage.getItem("auth-storage");
      if(raw){const u=JSON.parse(raw)?.state?.user;setMyUid(u?.mongoId||u?.userId||"");}
    }catch{}
  },[]);

  const loadConvs=useCallback(async()=>{
    try{
      const ep=mode==="dealer"?"/api/v1/messages/dealer-conversations":"/api/v1/messages/conversations";
      const r=await api.get(ep);setConvs(r.data||[]);
    }catch{}finally{setLoad(false);}
  },[mode]);

  useEffect(()=>{loadConvs();const t=setInterval(loadConvs,15000);return()=>clearInterval(t);},[loadConvs]);
  useEffect(()=>{api.get("/api/v1/messages/my-team").then(r=>setTeam(r.data||[])).catch(()=>{});},[]);
  useEffect(()=>()=>{if(pollRef.current) clearInterval(pollRef.current);},[]);

  useEffect(()=>{
    if(uSearch.length<2){setUR([]);return;}
    const t=setTimeout(async()=>{
      try{const r=await api.get("/api/v1/messages/search-users",{params:{q:uSearch}});setUR(r.data||[]);}catch{}
    },300);return()=>clearTimeout(t);
  },[uSearch]);

  const loadMsgs=useCallback(async(conv:any)=>{
    try{
      const r=await api.get(`/api/v1/messages/conversation/${conv.conversationId}`);
      setMsgs(r.data||[]);
      setTimeout(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),80);
    }catch{}
  },[]);

  const openConv=(conv:any)=>{
    setActive(conv);activeRef.current=conv;loadMsgs(conv);setShowNew(false);setChat(true);
    if(pollRef.current)clearInterval(pollRef.current);
    pollRef.current=setInterval(async()=>{
      if(!activeRef.current)return;
      try{
        const r=await api.get(`/api/v1/messages/conversation/${activeRef.current.conversationId}`);
        setMsgs(prev=>{
          if(r.data.length>prev.length)setTimeout(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),50);
          return r.data||prev;
        });
      }catch{}
    },5000);
  };

  const sendMsg=async(e:React.FormEvent)=>{
    e.preventDefault();if(!newMsg.trim()||!active||sending)return;
    const text=newMsg.trim();setNewMsg("");setSending(true);
    try{await api.post(`/api/v1/messages/conversation/${active.conversationId}/send`,{message:text});await loadMsgs(active);}
    catch{}finally{setSending(false);inputRef.current?.focus();}
  };

  const startConv=async()=>{
    if(!selUser||!startMsg.trim())return;setS2(true);
    try{
      const r=await api.post("/api/v1/messages/start",{receiverId:selUser.userId,message:startMsg});
      await loadConvs();
      const cid=r.data?.conversationId;
      if(cid){const r2=await api.get("/api/v1/messages/conversations");const f=(r2.data||[]).find((c:any)=>c.conversationId===cid);if(f)openConv(f);}
      setShowNew(false);setSel(null);setUS("");setStart("");
    }catch{}finally{setS2(false);}
  };

  const goBack=()=>{setChat(false);setActive(null);activeRef.current=null;if(pollRef.current)clearInterval(pollRef.current);};

  const fmt=(iso:string)=>timeAgoShort(iso);
  const fmtFull=(iso:string)=>fmtFullDate(iso)

  const fi:React.CSSProperties={width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"9px 12px",fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"var(--font-body)"};
  const H="calc(100vh - 260px)";

  return (
    <div style={{position:"relative",height:H,minHeight:"380px",background:"#fff",
      border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",display:"flex"}}>

      {/*  CONVERSATION LIST (hidden on mobile when chat open)  */}
      <div style={{
        width:"100%",maxWidth:"280px",flexShrink:0,
        borderRight:"1px solid #E5E5E5",display:"flex",flexDirection:"column",overflowY:"auto",
        // On mobile: hide list when chat is showing
        ...(showChat||showNew?{display:"none" as const}:{}),
        // On desktop always show (media query via JS workaround)
      }} className="conv-list">
        {/* Header */}
        <div style={{padding:"10px 12px",borderBottom:"1px solid #E5E5E5",display:"flex",
          justifyContent:"space-between",alignItems:"center",background:"#FAFAFA",flexShrink:0}}>
          <span style={{fontSize:"12px",color:"#737373"}}>
            {loading?"Loading...":`${convs.length} conversation${convs.length!==1?"s":""}`}
          </span>
          <button onClick={()=>{setShowNew(true);setActive(null);activeRef.current=null;if(pollRef.current)clearInterval(pollRef.current);setChat(true);}}
            style={{background:ac,color:"#fff",border:"none",borderRadius:"6px",padding:"5px 10px",
              fontSize:"12px",cursor:"pointer",fontWeight:700,fontFamily:"var(--font-display)"}}>
            + New
          </button>
        </div>

        {loading?(
          <div style={{display:"flex",justifyContent:"center",padding:"2rem"}}>
            <div style={{width:"20px",height:"20px",border:"2px solid #E5E5E5",borderTopColor:ac,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ):convs.length===0?(
          <div style={{padding:"1.5rem",textAlign:"center",color:"#A3A3A3"}}>
            <div style={{fontSize:"2rem",marginBottom:"6px"}}></div>
            <div style={{fontSize:"12px",marginBottom:"10px"}}>No conversations</div>
            <button onClick={()=>{setShowNew(true);setChat(true);}}
              style={{background:ac,color:"#fff",border:"none",borderRadius:"6px",
                padding:"6px 12px",fontSize:"11px",cursor:"pointer",fontFamily:"var(--font-display)"}}>
              Start One
            </button>
          </div>
        ):convs.map(c=>{
          const isActive=active?.conversationId===c.conversationId;
          return(
            <div key={c.conversationId} onClick={()=>openConv(c)}
              style={{padding:"10px 12px",cursor:"pointer",borderBottom:"1px solid #F5F5F5",
                background:isActive?"#FFF7ED":"#fff",
                borderLeft:`3px solid ${isActive?ac:"transparent"}`}}
              onMouseOver={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="#FFFBF5";}}
              onMouseOut={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="#fff";}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"2px"}}>
                <span style={{fontWeight:c.unreadCount>0?700:500,fontSize:"13px",color:"#1A1A1A",
                  flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:"6px"}}>
                  {c.otherUser?.fullName||c.otherUser?.username||"Unknown"}
                </span>
                <span style={{fontSize:"10px",color:"#A3A3A3",flexShrink:0}}>{fmt(c.lastMessageAt||c.updatedAt)}</span>
              </div>
              <div style={{fontSize:"11px",color:c.unreadCount>0?ac:"#737373",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {c.lastMessage?.message||"No messages yet"}
              </div>
              {c.unreadCount>0&&<span style={{display:"inline-block",background:ac,color:"#fff",
                borderRadius:"20px",padding:"1px 6px",fontSize:"10px",fontWeight:700,marginTop:"2px"}}>
                {c.unreadCount} new
              </span>}
            </div>
          );
        })}
      </div>

      {/*  RIGHT PANEL: new conv / active chat / empty state  */}
      <div style={{
        flex:1,display:"flex",flexDirection:"column",overflow:"hidden",
        // On mobile: only show when chat or new is open
        ...(!showChat&&!showNew?{display:"none" as const}:{}),
      }} className="conv-chat">

        {/* NEW CONVERSATION */}
        {showNew&&(
          <div style={{flex:1,overflowY:"auto",minHeight:0,padding:"14px",display:"flex",flexDirection:"column",gap:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <button onClick={()=>{setShowNew(false);setChat(false);setSel(null);setUS("");setStart("");}}
                style={{background:"none",border:"none",cursor:"pointer",color:"#525252",fontSize:"18px"}}>←</button>
              <span style={{fontFamily:"var(--font-display)",fontSize:"12px",letterSpacing:"0.08em",color:ac}}>NEW CONVERSATION</span>
            </div>

            {myTeam.length>0&&!selUser&&uSearch.length<2&&(
              <div>
                <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:"#A3A3A3",marginBottom:"6px"}}>MY TEAM</div>
                {myTeam.map(u=>(
                  <div key={u.userId} onClick={()=>{setSel(u);setUS(u.fullName);setUR([]);}}
                    style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderRadius:"7px",
                      cursor:"pointer",marginBottom:"4px",background:"#F9F9F9",border:"1px solid #E5E5E5"}}
                    onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
                    onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="#F9F9F9"}>
                    <div style={{width:"30px",height:"30px",borderRadius:"50%",background:"#FFF7ED",color:ac,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,flexShrink:0}}>
                      {u.fullName?.charAt(0)||"?"}
                    </div>
                    <div>
                      <div style={{fontSize:"13px",fontWeight:600}}>{u.fullName}</div>
                      <div style={{fontSize:"11px",color:"#A3A3A3"}}>{u.position||u.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"4px"}}>Search</label>
              <input value={uSearch} onChange={e=>{setUS(e.target.value);setSel(null);}} placeholder="Name or email..." autoFocus style={fi}/>
              {uResults.length>0&&(
                <div style={{border:"1.5px solid #E5E5E5",borderRadius:"7px",marginTop:"3px",overflow:"hidden"}}>
                  {uResults.map(u=>(
                    <div key={u.userId||u._id} onClick={()=>{setSel(u);setUS(u.fullName||u.email);setUR([]);}}
                      style={{padding:"8px 10px",cursor:"pointer",borderBottom:"1px solid #F5F5F5",fontSize:"13px"}}
                      onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
                      onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                      <div style={{fontWeight:600}}>{u.fullName||u.username}</div>
                      <div style={{fontSize:"11px",color:"#A3A3A3"}}>{u.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selUser&&(
              <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"7px",
                padding:"8px 10px",fontSize:"12px",color:"#15803D",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>To: <strong>{selUser.fullName||selUser.username}</strong></span>
                <button onClick={()=>{setSel(null);setUS("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:"14px"}}>×</button>
              </div>
            )}

            <textarea value={startMsg} onChange={e=>setStart(e.target.value)} rows={3}
              placeholder="Write first message..." style={{...fi,resize:"vertical" as const,minHeight:"70px"}}/>

            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setShowNew(false);setChat(false);setSel(null);setUS("");setStart("");}}
                style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"10px",fontSize:"13px",cursor:"pointer"}}>
                Cancel
              </button>
              <button onClick={startConv} disabled={!selUser||!startMsg.trim()||s2}
                style={{flex:2,background:!selUser||!startMsg.trim()||s2?"#D4D4D4":ac,color:"#fff",border:"none",
                  borderRadius:"8px",padding:"10px",fontFamily:"var(--font-display)",fontSize:"13px",
                  cursor:!selUser?"not-allowed":"pointer",fontWeight:700}}>
                {s2?"Sending...":"SEND MESSAGE"}
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE CONVERSATION */}
        {active&&!showNew&&(
          <>
            <div style={{padding:"10px 14px",borderBottom:"1px solid #E5E5E5",background:"#FAFAFA",
              display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
              <button onClick={goBack} style={{background:"none",border:"none",cursor:"pointer",color:"#525252",fontSize:"18px",padding:0}}>←</button>
              <div style={{width:"30px",height:"30px",borderRadius:"50%",background:"#FFF7ED",color:ac,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,flexShrink:0}}>
                {active.otherUser?.fullName?.charAt(0)?.toUpperCase()||"?"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:"13px",color:"#1A1A1A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {active.otherUser?.fullName||"Unknown"}
                </div>
                <div style={{fontSize:"10px",color:"#A3A3A3"}}>{active.otherUser?.role?.replace(/_/g," ")||""}</div>
              </div>
            </div>

            <div style={{flex:1,overflowY:"auto",minHeight:0,padding:"10px",display:"flex",flexDirection:"column",gap:"3px"}}>
              {messages.length===0&&<div style={{textAlign:"center",color:"#A3A3A3",padding:"2rem",fontSize:"13px"}}>No messages yet</div>}
              {messages.map(m=>{
                // In "dealer" mode, messages sent on the dealer's behalf
                // (by this staff member OR any teammate) are stored with
                // the DEALER's id as sender, not the individual staff
                // member's id — so "is this my side of the chat" has to
                // compare against the dealer's id here, not myUid.
                // Otherwise every message the staff themselves just sent
                // would incorrectly show as if it came from the other party.
                const compareUid = mode==="dealer" ? (active.dealerUserId||myUid) : myUid;
                const isMe=m.senderId===compareUid;
                // Who actually typed this, for internal clarity (never
                // shown to the external party, only here on the team side).
                const attribution = mode==="dealer"
                  ? (m.sentByStaffId ? (m.sentByStaffId===myUid ? "You" : (m.sentByStaffName||"Staff")) : (isMe ? dealerName : ""))
                  : "";
                return(
                  <div key={m._id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:"3px"}}>
                    <div style={{maxWidth:"80%",background:isMe?ac:"#F5F5F5",color:isMe?"#fff":"#1A1A1A",
                      borderRadius:isMe?"10px 10px 0 10px":"10px 10px 10px 0",padding:"8px 11px"}}>
                      {/* Show sender name for non-self messages so staff knows who sent it */}
                      {!isMe&&<div style={{fontSize:"10px",fontWeight:700,color:"#F47B20",marginBottom:"2px",opacity:.8}}>
                        {m.senderName||""}
                      </div>}
                      <div style={{fontSize:"13px",lineHeight:1.4,wordBreak:"break-word" as const}}>{m.message}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"8px",marginTop:"2px"}}>
                        {attribution && <span style={{fontSize:"9.5px",opacity:.75,fontWeight:600,fontStyle:"italic"}}>{attribution}</span>}
                        <span style={{fontSize:"10px",opacity:.6,marginLeft:"auto"}}>{fmtFull(m.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef}/>
            </div>

            {canReply?(
              <form onSubmit={sendMsg} style={{padding:"8px 10px",borderTop:"1px solid #E5E5E5",
                display:"flex",gap:"8px",alignItems:"center",flexShrink:0,background:"#FAFAFA"}}>
                <input ref={inputRef} value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  style={{...fi,borderRadius:"22px",padding:"8px 14px",fontSize:"13px"}}/>
                <button type="submit" disabled={!newMsg.trim()||sending}
                  style={{width:"38px",height:"38px",borderRadius:"50%",flexShrink:0,
                    background:!newMsg.trim()||sending?"#E5E5E5":ac,border:"none",
                    cursor:!newMsg.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={!newMsg.trim()||sending?"#A3A3A3":"#fff"} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </form>
            ):(
              <div style={{padding:"8px 12px",background:"#FFF7ED",fontSize:"11px",
                color:"#D97706",textAlign:"center",flexShrink:0}}>
                View-only  reply permission needed
              </div>
            )}
          </>
        )}

        {/* EMPTY (desktop only - shown when no convo selected) */}
        {!active&&!showNew&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",color:"#A3A3A3",gap:"8px",padding:"1rem"}}>
            <div style={{fontSize:"2.5rem"}}></div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.1em",color:"#D4D4D4"}}>
              SELECT A CONVERSATION
            </div>
          </div>
        )}
      </div>

      {/* Desktop: show both panels side by side */}
      <style>{`
        @media (min-width: 640px) {
          .conv-list { display: flex !important; width: 260px !important; }
          .conv-chat { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
