"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useMessagesStore } from "@/store/messagesStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { timeAgoShort, fmtFullDate } from "@/lib/timeUtils";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { openConvId, openCarContext, clearOpen } = useMessagesStore();
  const { user } = useAuthStore();
  const uid = user?.mongoId || user?.userId;

  const [convs,       setConvs]       = useState<any[]>([]);
  const [activeConv,  setActiveConv]  = useState<any>(null);
  const [messages,    setMessages]    = useState<any[]>([]);
  const [newMsg,      setNewMsg]      = useState("");
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showNew,     setShowNew]     = useState(false);
  const [userSearch,  setUserSearch]  = useState("");
  const [showChat,    setShowChat]    = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [myTeam,      setMyTeam]      = useState<any[]>([]);
  const [selUser,     setSelUser]     = useState<any>(null);
  const [startMsg,    setStartMsg]    = useState("");
  const [sending2,    setSending2]    = useState(false);

  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const activeRef  = useRef<any>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const loadConvs = useCallback(async () => {
    try {
      const r = await api.get("/api/v1/messages/conversations");
      setConvs(r.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConvs(); const t = setInterval(loadConvs, 10000); return () => clearInterval(t); }, [loadConvs]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  useEffect(() => {
    api.get("/api/v1/messages/my-team").then(r => setMyTeam(r.data || [])).catch(() => {});
  }, []);

  // User search for new conversation
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
    setActiveConv(conv); activeRef.current = conv;
    loadMessages(conv);
    setShowNew(false);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (!activeRef.current) return;
      try {
        const r = await api.get(`/api/v1/messages/conversation/${activeRef.current.conversationId}`);
        const msgs = r.data || [];
        setMessages(prev => {
          if (msgs.length > prev.length) setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          return msgs;
        });
      } catch {}
    }, 5000);
  }, [loadMessages]);

  // Auto-open from store trigger
  useEffect(() => {
    if (!openConvId) return;
    const convId = openConvId; clearOpen();
    loadConvs().then(() => {
      setConvs(prev => {
        const found = prev.find(c => c.conversationId === convId);
        if (found) openConv(found);
        return prev;
      });
    });
  }, [openConvId]);

  // Auto-open from URL ?conv=
  useEffect(() => {
    const convId = searchParams.get("conv");
    if (!convId) return;
    setTimeout(async () => {
      const r = await api.get("/api/v1/messages/conversations").catch(() => null);
      if (!r) return;
      setConvs(r.data || []);
      const found = (r.data || []).find((c: any) => c.conversationId === convId);
      if (found) openConv(found);
    }, 400);
  }, []);

  const sendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv || sending) return;
    const text = newMsg.trim(); setNewMsg(""); setSending(true);
    try {
      await api.post(`/api/v1/messages/conversation/${activeConv.conversationId}/send`, { message: text });
      await loadMessages(activeConv);
    } catch {} finally { setSending(false); inputRef.current?.focus(); }
  };

  const startConversation = async () => {
    if (!selUser || !startMsg.trim()) return;
    setSending2(true);
    try {
      const r = await api.post("/api/v1/messages/start", { receiverId: selUser.userId, message: startMsg });
      await loadConvs();
      const convId = r.data?.conversationId;
      if (convId) {
        const r2 = await api.get("/api/v1/messages/conversations");
        setConvs(r2.data || []);
        const found = (r2.data || []).find((c: any) => c.conversationId === convId);
        if (found) openConv(found);
      }
      setShowNew(false); setSelUser(null); setUserSearch(""); setStartMsg("");
    } catch {} finally { setSending2(false); }
  };

  const fmtTime = (iso: string) => timeAgoShort(iso);

  const fmtFull = (iso: string) => fmtFullDate(iso);

  // Shared styles
  const accent = "#F47B20";
  const panel: React.CSSProperties = { display:"flex", flexDirection:"column", height:"calc(100vh - 200px)", minHeight:"400px", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", overflow:"hidden" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", letterSpacing:"0.05em", color:"#1A1A1A", margin:"0 0 4px" }}>Messages</h2>
          <p style={{ fontSize:"13px", color:"#888", margin:0 }}>{convs.length} conversation{convs.length!==1?"s":""}</p>
        </div>
        <button onClick={() => { setShowNew(true); setActiveConv(null); activeRef.current=null; if(pollRef.current)clearInterval(pollRef.current); }}
          style={{ background:accent, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 18px", fontFamily:"var(--font-display)", fontSize:"13px", letterSpacing:"0.08em", cursor:"pointer", fontWeight:700 }}>
          + New Message
        </button>
      </div>

      <div style={{ display:"flex", gap:"0", ...panel }}>

        {/* LEFT: conversation list */}
        <div style={{ width:"300px", flexShrink:0, borderRight:"1.5px solid #E5E5E5", display:"flex", flexDirection:"column", overflowY:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"2rem" }}>
              <div style={{ width:"24px", height:"24px", border:"2.5px solid #E5E5E5", borderTopColor:accent, borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : convs.length === 0 ? (
            <div style={{ padding:"2rem", textAlign:"center", color:"#A3A3A3" }}>
              <div style={{ fontSize:"2rem", marginBottom:"8px" }}></div>
              <div style={{ fontSize:"14px", marginBottom:"16px" }}>No conversations yet</div>
              <button onClick={() => setShowNew(true)} style={{ background:accent, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 18px", fontFamily:"var(--font-display)", fontSize:"13px", cursor:"pointer" }}>
                Start a Conversation
              </button>
            </div>
          ) : (
            convs.map(c => {
              const isActive = activeConv?.conversationId === c.conversationId;
              return (
                <div key={c.conversationId||c._id} onClick={() => openConv(c)}
                  style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #F5F5F5",
                    background:isActive?"#FFF7ED":"#fff", borderLeft:`3px solid ${isActive?accent:"transparent"}`,
                    transition:"all .15s" }}
                  onMouseOver={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="#FFFBF5";}}
                  onMouseOut={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="#fff";}}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"3px" }}>
                    <div style={{ fontWeight: c.unreadCount > 0 ? 700 : 500, fontSize:"13px", color:"#1A1A1A", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:"8px" }}>
                      {c.otherUser?.fullName || c.otherUser?.username || "Unknown"}
                    </div>
                    <div style={{ fontSize:"10px", color:"#A3A3A3", flexShrink:0 }}>{fmtTime(c.lastMessageAt || c.updatedAt)}</div>
                  </div>
                  <div style={{ fontSize:"11px", color: c.unreadCount > 0 ? "#F47B20" : "#737373", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c.lastMessage?.message || "No messages yet"}
                  </div>
                  {c.unreadCount > 0 && (
                    <span style={{ display:"inline-block", background:"#F47B20", color:"#fff", borderRadius:"20px", padding:"1px 7px", fontSize:"10px", fontWeight:700, marginTop:"4px" }}>
                      {c.unreadCount} new
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT: active conversation or new message */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* NEW MESSAGE PANEL */}
          {showNew && (
            <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column", padding:"20px", gap:"16px", overflowY:"auto" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"13px", letterSpacing:"0.08em", color:"#F47B20" }}>NEW CONVERSATION</div>

              {/* My Team quick access */}
              {myTeam.length > 0 && !selUser && userSearch.length < 2 && (
                <div>
                  <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", color:"#A3A3A3", marginBottom:"8px" }}>MY TEAM</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                    {myTeam.map(u => (
                      <div key={u.userId} onClick={() => { setSelUser(u); setUserSearch(u.fullName); setUserResults([]); }}
                        style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 12px", borderRadius:"8px", cursor:"pointer", background:"#F9F9F9", border:"1px solid #E5E5E5" }}
                        onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
                        onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="#F9F9F9"}>
                        <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:"#FFF7ED", color:accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:700, flexShrink:0 }}>
                          {u.fullName?.charAt(0)||"?"}
                        </div>
                        <div>
                          <div style={{ fontSize:"13px", fontWeight:600, color:"#1A1A1A" }}>{u.fullName}</div>
                          <div style={{ fontSize:"11px", color:"#A3A3A3" }}>{u.position || u.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div>
                <label style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"6px" }}>Search by name or email</label>
                <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setSelUser(null); }}
                  placeholder="Type name or email..." autoFocus
                  style={{ width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"10px 14px", fontSize:"14px", outline:"none", boxSizing:"border-box" }}/>
                {userResults.length > 0 && (
                  <div style={{ border:"1.5px solid #E5E5E5", borderRadius:"8px", marginTop:"4px", overflow:"hidden" }}>
                    {userResults.map(u => (
                      <div key={u.userId||u._id} onClick={() => { setSelUser(u); setUserSearch(u.fullName||u.username||u.email); setUserResults([]); }}
                        style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #F5F5F5", fontSize:"13px" }}
                        onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
                        onMouseOut={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                        <div style={{ fontWeight:600 }}>{u.fullName||u.username}</div>
                        <div style={{ fontSize:"11px", color:"#A3A3A3" }}>{u.email}  {u.role?.replace(/_/g," ")}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selUser && (
                <div style={{ background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:"#15803D", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>Sending to: <strong>{selUser.fullName||selUser.username}</strong></span>
                  <button onClick={() => { setSelUser(null); setUserSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#DC2626", fontSize:"16px" }}>×</button>
                </div>
              )}

              <div>
                <label style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#525252", display:"block", marginBottom:"6px" }}>Message</label>
                <textarea value={startMsg} onChange={e => setStartMsg(e.target.value)} rows={4}
                  placeholder="Write your first message..."
                  style={{ width:"100%", background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"10px 14px", fontSize:"14px", outline:"none", resize:"vertical" as const, boxSizing:"border-box", fontFamily:"var(--font-body)" }}/>
              </div>

              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => { setShowNew(false); setSelUser(null); setUserSearch(""); setStartMsg(""); }}
                  style={{ flex:1, background:"#F5F5F5", border:"1.5px solid #E5E5E5", color:"#525252", borderRadius:"9px", padding:"11px", fontSize:"14px", cursor:"pointer" }}>
                  Cancel
                </button>
                <button onClick={startConversation} disabled={!selUser||!startMsg.trim()||sending2}
                  style={{ flex:2, background:!selUser||!startMsg.trim()||sending2?"#D4D4D4":accent, color:"#fff", border:"none", borderRadius:"9px", padding:"11px", fontFamily:"var(--font-display)", fontSize:"13px", cursor:!selUser||!startMsg.trim()||sending2?"not-allowed":"pointer", fontWeight:700 }}>
                  {sending2 ? "Sending..." : "SEND MESSAGE"}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE CONVERSATION */}
          {activeConv && !showNew && (
            <>
              {/* Conv header */}
              <div style={{ padding:"14px 20px", borderBottom:"1.5px solid #E5E5E5", background:"#FAFAFA", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
                <button onClick={() => { setActiveConv(null); activeRef.current=null; if(pollRef.current)clearInterval(pollRef.current); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#525252", fontSize:"18px", lineHeight:1, padding:"0" }}>←</button>
                <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:"#FFF7ED", color:accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", fontWeight:700, flexShrink:0 }}>
                  {activeConv.otherUser?.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:"14px", color:"#1A1A1A" }}>{activeConv.otherUser?.fullName || "Unknown"}</div>
                  <div style={{ fontSize:"11px", color:"#A3A3A3" }}>{activeConv.otherUser?.role?.replace(/_/g," ") || ""}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, minHeight:0, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"4px" }}>
                {messages.length === 0 && <div style={{ textAlign:"center", color:"#A3A3A3", padding:"2rem", fontSize:"14px" }}>No messages yet. Say hello!</div>}
                {messages.map(m => {
                  const isMe = m.senderId === uid;
                  // If a staff member sent this on our behalf, show who —
                  // the customer/other party only ever sees "the dealer",
                  // but the dealer themselves should know which teammate
                  // actually typed it.
                  const attribution = isMe
                    ? (m.sentByStaffId ? (m.sentByStaffName || "Staff") : "You")
                    : "";
                  return (
                    <div key={m._id} style={{ display:"flex", justifyContent:isMe?"flex-end":"flex-start", marginBottom:"6px" }}>
                      <div style={{ maxWidth:"82%", background:isMe?accent:"#F5F5F5", color:isMe?"#fff":"#1A1A1A",
                        borderRadius:isMe?"10px 10px 0 10px":"10px 10px 10px 0", padding:"9px 13px" }}>
                        <div style={{ fontSize:"13px", lineHeight:1.5, wordBreak:"break-word" as const }}>{m.message}</div>
                        {m.imageUrl && <img src={m.imageUrl} alt="" style={{ maxWidth:"200px", borderRadius:"6px", marginTop:"6px", display:"block" }}/>}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px", marginTop:"3px" }}>
                          {attribution && <span style={{ fontSize:"9.5px", opacity:.75, fontWeight:600, fontStyle:"italic" }}>{attribution}</span>}
                          <span style={{ fontSize:"10px", opacity:.6, marginLeft:"auto" }}>{fmtFull(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgsEndRef}/>
              </div>

              {/* Send input */}
              <form onSubmit={sendMsg} style={{ padding:"12px 16px", borderTop:"1.5px solid #E5E5E5", display:"flex", gap:"10px", alignItems:"center", flexShrink:0, background:"#FAFAFA" }}>
                <input ref={inputRef} value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex:1, background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"22px", padding:"10px 16px", fontSize:"14px", outline:"none", fontFamily:"var(--font-body)" }}/>
                <button type="submit" disabled={!newMsg.trim()||sending}
                  style={{ width:"44px", height:"44px", borderRadius:"50%", background:!newMsg.trim()||sending?"#E5E5E5":accent, border:"none", cursor:!newMsg.trim()||sending?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background .2s" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={!newMsg.trim()||sending?"#A3A3A3":"#fff"} strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                </button>
              </form>
            </>
          )}

          {/* EMPTY STATE */}
          {!activeConv && !showNew && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px", color:"#A3A3A3" }}>
              <div style={{ fontSize:"3rem" }}></div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem", letterSpacing:"0.1em", color:"#D4D4D4" }}>SELECT A CONVERSATION</div>
              <p style={{ fontSize:"13px", textAlign:"center", maxWidth:"260px", lineHeight:1.6 }}>Pick a conversation from the left, or start a new one</p>
              <button onClick={() => setShowNew(true)}
                style={{ background:accent, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 20px", fontFamily:"var(--font-display)", fontSize:"13px", cursor:"pointer", fontWeight:700 }}>
                + New Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
