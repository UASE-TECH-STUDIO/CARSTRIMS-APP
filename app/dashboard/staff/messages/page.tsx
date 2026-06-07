"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";

export default function StaffMessagesPage() {
  const [tab,      setTab]      = useState<"dealer"|"mine">("dealer");
  const [perms,    setPerms]    = useState<string[]>([]);
  const [dlrName,  setDlrName]  = useState("Dealer");
  const [dlrUid,   setDlrUid]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/staff/me").catch(() => null),
      api.get("/api/v1/staff/me/dealer").catch(() => null),
    ]).then(([staffRes, dlrRes]) => {
      setPerms(staffRes?.data?.permissions || []);
      if (dlrRes?.data?.companyName) setDlrName(dlrRes.data.companyName);
      if (dlrRes?.data?.userId) setDlrUid(dlrRes.data.userId);
    }).finally(() => setLoading(false));
  }, []);

  const canViewDealer = perms.includes("view_messages") || perms.includes("send_messages");
  const canReply      = perms.includes("send_messages");

  if (loading) return (
    <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",margin:"0 0 4px"}}>
          Messages
        </h2>
        <p style={{fontSize:"13px",color:"#888",margin:0}}>
          {tab==="dealer" ? `Managing ${dlrName}'s conversations` : "Your personal messages"}
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:"0",borderBottom:"2px solid #E5E5E5"}}>
        {canViewDealer && (
          <button onClick={()=>setTab("dealer")}
            style={{padding:"10px 20px",border:"none",background:"none",
              fontFamily:"var(--font-display)",fontSize:"13px",letterSpacing:"0.06em",
              cursor:"pointer",color:tab==="dealer"?"#F47B20":"#737373",
              borderBottom:tab==="dealer"?"2.5px solid #F47B20":"2.5px solid transparent",
              fontWeight:tab==="dealer"?700:400,marginBottom:"-2px"}}>
            {dlrName} Messages
          </button>
        )}
        <button onClick={()=>setTab("mine")}
          style={{padding:"10px 20px",border:"none",background:"none",
            fontFamily:"var(--font-display)",fontSize:"13px",letterSpacing:"0.06em",
            cursor:"pointer",color:tab==="mine"?"#F47B20":"#737373",
            borderBottom:tab==="mine"?"2.5px solid #F47B20":"2.5px solid transparent",
            fontWeight:tab==="mine"?700:400,marginBottom:"-2px"}}>
          My Messages
        </button>
      </div>

      {/* Banner */}
      {tab==="dealer" && canViewDealer && (
        <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",
          padding:"10px 14px",fontSize:"13px",color:"#1D4ED8",lineHeight:1.5}}>
          <strong>Dealer view:</strong> You are viewing and replying as <strong>{dlrName}</strong>.
          Customers see the dealer name. {!canReply && <em>(You have view-only access)</em>}
        </div>
      )}
      {tab==="mine" && (
        <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",
          padding:"10px 14px",fontSize:"13px",color:"#15803D",lineHeight:1.5}}>
          <strong>Your messages:</strong> Personal conversations with colleagues, dealer, or anyone.
        </div>
      )}

      {/* Content */}
      {tab==="dealer" && !canViewDealer ? (
        <div style={{padding:"3rem",textAlign:"center",background:"#fff",
          border:"1.5px solid #E5E5E5",borderRadius:"12px"}}>
          <div style={{fontSize:"2rem",marginBottom:"12px"}}></div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#DC2626",fontWeight:700}}>
            Permission Required
          </div>
          <p style={{color:"#737373",marginTop:"8px",fontSize:"14px"}}>
            You need "View Messages" permission to access dealer conversations.
          </p>
        </div>
      ) : (
        <ConversationPanel
          key={tab}
          mode={tab}
          canReply={tab==="mine" || canReply}
          dlrName={dlrName}
        />
      )}
    </div>
  );
}

//  Reusable conversation panel 
function ConversationPanel({ mode, canReply, dlrName }: {
  mode: "dealer"|"mine"; canReply: boolean; dlrName: string;
}) {
  const [convs,       setConvs]       = useState<any[]>([]);
  const [active,      setActive]      = useState<any>(null);
  const [messages,    setMessages]    = useState<any[]>([]);
  const [newMsg,      setNewMsg]      = useState("");
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showNew,     setShowNew]     = useState(false);
  const [userSearch,  setUserSearch]  = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selUser,     setSelUser]     = useState<any>(null);
  const [startMsg,    setStartMsg]    = useState("");
  const [myTeam,      setMyTeam]      = useState<any[]>([]);
  const [myUid,       setMyUid]       = useState("");
  const [s2,          setS2]          = useState(false);

  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const activeRef  = useRef<any>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Get current user ID
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth-storage");
      if (raw) {
        const u = JSON.parse(raw)?.state?.user;
        setMyUid(u?.mongoId || u?.userId || "");
      }
    } catch {}
  }, []);

  const loadConvs = useCallback(async () => {
    try {
      const endpoint = mode === "dealer"
        ? "/api/v1/messages/dealer-conversations"
        : "/api/v1/messages/conversations";
      const r = await api.get(endpoint);
      setConvs(r.data || []);
    } catch {} finally { setLoading(false); }
  }, [mode]);

  useEffect(() => {
    loadConvs();
    const t = setInterval(loadConvs, 15000);
    return () => clearInterval(t);
  }, [loadConvs]);

  useEffect(() => {
    api.get("/api/v1/messages/my-team").then(r => setMyTeam(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (userSearch.length < 2) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/api/v1/messages/search-users", { params: { q: userSearch } });
        setUserResults(r.data || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const loadMessages = useCallback(async (conv: any) => {
    try {
      const r = await api.get(`/api/v1/messages/conversation/${conv.conversationId}`);
      setMessages(r.data || []);
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch {}
  }, []);

  const openConv = useCallback((conv: any) => {
    setActive(conv); activeRef.current = conv;
    loadMessages(conv); setShowNew(false);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (!activeRef.current) return;
      try {
        const r = await api.get(`/api/v1/messages/conversation/${activeRef.current.conversationId}`);
        setMessages(prev => {
          if (r.data.length > prev.length)
            setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          return r.data || prev;
        });
      } catch {}
    }, 5000);
  }, [loadMessages]);

  const sendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !active || sending) return;
    const text = newMsg.trim(); setNewMsg(""); setSending(true);
    try {
      await api.post(`/api/v1/messages/conversation/${active.conversationId}/send`, { message: text });
      await loadMessages(active);
    } catch {} finally { setSending(false); inputRef.current?.focus(); }
  };

  const startConversation = async () => {
    if (!selUser || !startMsg.trim()) return;
    setS2(true);
    try {
      const r = await api.post("/api/v1/messages/start", { receiverId: selUser.userId, message: startMsg });
      await loadConvs();
      const convId = r.data?.conversationId;
      if (convId) {
        const r2 = await api.get("/api/v1/messages/conversations");
        const found = (r2.data || []).find((c: any) => c.conversationId === convId);
        if (found) openConv(found);
      }
      setShowNew(false); setSelUser(null); setUserSearch(""); setStartMsg("");
    } catch {} finally { setS2(false); }
  };

  const fmtTime = (iso: string) => {
    if (!iso) return "";
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "now"; if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m/60)}h`;
    return new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short"});
  };

  const fmtFull = (iso: string) => iso
    ? new Date(iso).toLocaleString("en-NG",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})
    : "";

  const accent = "#F47B20";
  const panel: React.CSSProperties = {
    display:"flex", flexDirection:"column", height:"calc(100vh - 220px)",
    minHeight:"420px", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", overflow:"hidden",
  };
  const fi: React.CSSProperties = {
    width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5",
    borderRadius:"8px", padding:"10px 14px", fontSize:"14px", outline:"none",
    boxSizing:"border-box", fontFamily:"var(--font-body)",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0", ...panel }}>
      {/* Top bar */}
      <div style={{padding:"10px 14px",borderBottom:"1px solid #E5E5E5",display:"flex",
        alignItems:"center",justifyContent:"space-between",background:"#FAFAFA",flexShrink:0}}>
        <div style={{fontSize:"12px",color:"#737373"}}>
          {loading ? "Loading..." : `${convs.length} conversation${convs.length!==1?"s":""}`}
        </div>
        <button onClick={()=>{setShowNew(true);setActive(null);activeRef.current=null;if(pollRef.current)clearInterval(pollRef.current);}}
          style={{background:accent,color:"#fff",border:"none",borderRadius:"7px",
            padding:"6px 14px",fontSize:"12px",cursor:"pointer",fontWeight:700,
            fontFamily:"var(--font-display)",letterSpacing:"0.06em"}}>
          + New
        </button>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* Conversation list */}
        <div style={{width:"260px",flexShrink:0,borderRight:"1px solid #E5E5E5",overflowY:"auto"}}>
          {loading ? (
            <div style={{display:"flex",justifyContent:"center",padding:"2rem"}}>
              <div style={{width:"20px",height:"20px",border:"2px solid #E5E5E5",borderTopColor:accent,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : convs.length === 0 ? (
            <div style={{padding:"1.5rem",textAlign:"center",color:"#A3A3A3"}}>
              <div style={{fontSize:"2rem",marginBottom:"8px"}}></div>
              <div style={{fontSize:"13px",marginBottom:"12px"}}>No conversations yet</div>
              <button onClick={()=>setShowNew(true)}
                style={{background:accent,color:"#fff",border:"none",borderRadius:"7px",
                  padding:"7px 14px",fontSize:"12px",cursor:"pointer",fontFamily:"var(--font-display)"}}>
                Start One
              </button>
            </div>
          ) : convs.map(c => {
            const isActive = active?.conversationId === c.conversationId;
            return (
              <div key={c.conversationId||c._id} onClick={()=>openConv(c)}
                style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #F5F5F5",
                  background:isActive?"#FFF7ED":"#fff",
                  borderLeft:`3px solid ${isActive?accent:"transparent"}`}}
                onMouseOver={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="#FFFBF5";}}
                onMouseOut={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="#fff";}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                  <div style={{fontWeight:c.unreadCount>0?700:500,fontSize:"13px",color:"#1A1A1A",
                    flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:"6px"}}>
                    {c.otherUser?.fullName || c.otherUser?.username || "Unknown"}
                  </div>
                  <div style={{fontSize:"10px",color:"#A3A3A3",flexShrink:0}}>{fmtTime(c.lastMessageAt||c.updatedAt)}</div>
                </div>
                <div style={{fontSize:"11px",color:c.unreadCount>0?"#F47B20":"#737373",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {c.lastMessage?.message || "No messages yet"}
                </div>
                {c.unreadCount > 0 && (
                  <span style={{display:"inline-block",background:"#F47B20",color:"#fff",
                    borderRadius:"20px",padding:"1px 6px",fontSize:"10px",fontWeight:700,marginTop:"3px"}}>
                    {c.unreadCount} new
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* New conversation panel */}
          {showNew && (
            <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"12px",letterSpacing:"0.08em",color:accent}}>
                NEW CONVERSATION
              </div>
              {myTeam.length > 0 && !selUser && userSearch.length < 2 && (
                <div>
                  <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:"#A3A3A3",marginBottom:"6px"}}>
                    MY TEAM
                  </div>
                  {myTeam.map(u => (
                    <div key={u.userId} onClick={()=>{setSelUser(u);setUserSearch(u.fullName);setUserResults([]);}}
                      style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px",borderRadius:"8px",
                        cursor:"pointer",marginBottom:"4px",background:"#F9F9F9",border:"1px solid #E5E5E5"}}
                      onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
                      onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="#F9F9F9"}>
                      <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#FFF7ED",
                        color:accent,display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:"13px",fontWeight:700,flexShrink:0}}>
                        {u.fullName?.charAt(0)||"?"}
                      </div>
                      <div>
                        <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A1A"}}>{u.fullName}</div>
                        <div style={{fontSize:"11px",color:"#A3A3A3"}}>{u.position||u.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,
                  color:"#525252",display:"block",marginBottom:"5px"}}>Search user</label>
                <input value={userSearch} onChange={e=>{setUserSearch(e.target.value);setSelUser(null);}}
                  placeholder="Name or email..." autoFocus style={fi}/>
                {userResults.length > 0 && (
                  <div style={{border:"1.5px solid #E5E5E5",borderRadius:"8px",marginTop:"4px",overflow:"hidden"}}>
                    {userResults.map(u => (
                      <div key={u.userId||u._id}
                        onClick={()=>{setSelUser(u);setUserSearch(u.fullName||u.email);setUserResults([]);}}
                        style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid #F5F5F5",fontSize:"13px"}}
                        onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
                        onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                        <div style={{fontWeight:600}}>{u.fullName||u.username}</div>
                        <div style={{fontSize:"11px",color:"#A3A3A3"}}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selUser && (
                <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"7px",
                  padding:"8px 12px",fontSize:"13px",color:"#15803D",display:"flex",
                  justifyContent:"space-between",alignItems:"center"}}>
                  <span>To: <strong>{selUser.fullName||selUser.username}</strong></span>
                  <button onClick={()=>{setSelUser(null);setUserSearch("");}}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:"16px"}}></button>
                </div>
              )}
              <div>
                <label style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,
                  color:"#525252",display:"block",marginBottom:"5px"}}>Message</label>
                <textarea value={startMsg} onChange={e=>setStartMsg(e.target.value)} rows={3}
                  placeholder="Write first message..."
                  style={{...fi,resize:"vertical" as const,minHeight:"70px"}}/>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{setShowNew(false);setSelUser(null);setUserSearch("");setStartMsg("");}}
                  style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",
                    borderRadius:"8px",padding:"10px",fontSize:"13px",cursor:"pointer"}}>
                  Cancel
                </button>
                <button onClick={startConversation} disabled={!selUser||!startMsg.trim()||s2}
                  style={{flex:2,background:!selUser||!startMsg.trim()||s2?"#D4D4D4":accent,
                    color:"#fff",border:"none",borderRadius:"8px",padding:"10px",
                    fontFamily:"var(--font-display)",fontSize:"13px",cursor:!selUser?"not-allowed":"pointer",fontWeight:700}}>
                  {s2?"Sending...":"SEND MESSAGE"}
                </button>
              </div>
            </div>
          )}

          {/* Active conversation */}
          {active && !showNew && (
            <>
              <div style={{padding:"10px 16px",borderBottom:"1px solid #E5E5E5",
                background:"#FAFAFA",display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
                <button onClick={()=>{setActive(null);activeRef.current=null;if(pollRef.current)clearInterval(pollRef.current);}}
                  style={{background:"none",border:"none",cursor:"pointer",color:"#525252",fontSize:"16px",padding:0}}></button>
                <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#FFF7ED",
                  color:accent,display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"13px",fontWeight:700,flexShrink:0}}>
                  {active.otherUser?.fullName?.charAt(0)?.toUpperCase()||"?"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:"13px",color:"#1A1A1A"}}>{active.otherUser?.fullName||"Unknown"}</div>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:"4px"}}>
                {messages.length === 0 && (
                  <div style={{textAlign:"center",color:"#A3A3A3",padding:"2rem",fontSize:"13px"}}>
                    No messages yet  say hello!
                  </div>
                )}
                {messages.map(m => {
                  const isMe = m.senderId === myUid;
                  return (
                    <div key={m._id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:"4px"}}>
                      <div style={{maxWidth:"80%",background:isMe?accent:"#F5F5F5",
                        color:isMe?"#fff":"#1A1A1A",borderRadius:isMe?"10px 10px 0 10px":"10px 10px 10px 0",
                        padding:"8px 12px"}}>
                        <div style={{fontSize:"13px",lineHeight:1.4,wordBreak:"break-word" as const}}>{m.message}</div>
                        <div style={{fontSize:"10px",opacity:.6,textAlign:"right" as const,marginTop:"2px"}}>{fmtFull(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgsEndRef}/>
              </div>
              {canReply ? (
                <form onSubmit={sendMsg} style={{padding:"10px 12px",borderTop:"1px solid #E5E5E5",
                  display:"flex",gap:"8px",alignItems:"center",flexShrink:0,background:"#FAFAFA"}}>
                  <input ref={inputRef} value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                    placeholder="Type a message..." style={{...fi,borderRadius:"22px"}}/>
                  <button type="submit" disabled={!newMsg.trim()||sending}
                    style={{width:"40px",height:"40px",borderRadius:"50%",flexShrink:0,
                      background:!newMsg.trim()||sending?"#E5E5E5":accent,
                      border:"none",cursor:!newMsg.trim()?"not-allowed":"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke={!newMsg.trim()||sending?"#A3A3A3":"#fff"} strokeWidth="2.5"
                      strokeLinecap="round">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                    </svg>
                  </button>
                </form>
              ) : (
                <div style={{padding:"10px 14px",background:"#FFF7ED",fontSize:"12px",
                  color:"#D97706",textAlign:"center",flexShrink:0}}>
                  View-only mode  you need Send Messages permission to reply
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!active && !showNew && (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",color:"#A3A3A3",gap:"10px"}}>
              <div style={{fontSize:"2.5rem"}}></div>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",
                letterSpacing:"0.1em",color:"#D4D4D4"}}>SELECT A CONVERSATION</div>
              <p style={{fontSize:"12px",textAlign:"center",maxWidth:"200px",lineHeight:1.5}}>
                Pick from the left or start a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
