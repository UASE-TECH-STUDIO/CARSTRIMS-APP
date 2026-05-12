"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Props { accentColor?: string; }

const genPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = "";
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random()*chars.length)];
  return pw;
};

export default function MessagesWidget({ accentColor = "#F47B20" }: Props) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [startMsg, setStartMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [unread, setUnread] = useState(0);
  const isSuperAdmin = user?.role === "SYSTEM_ADMIN";

  const loadConvs = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/messages/conversations");
      const convs = res.data || [];
      setConversations(convs);
      setUnread(convs.reduce((acc: number, c: any) => acc+(c.unreadCount||0), 0));
    } catch {}
  }, []);

  useEffect(() => {
    if (open) loadConvs();
    const t = setInterval(() => { if (!open) loadConvs(); }, 10000);
    return () => clearInterval(t);
  }, [open, loadConvs]);

  const loadMessages = useCallback(async (conv: any) => {
    try {
      const res = await api.get(`/api/v1/messages/conversation/${conv.conversationId}`);
      setMessages(res.data || []);
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    } catch {}
  }, []);

  const openConv = (conv: any) => {
    setActiveConv(conv);
    loadMessages(conv);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/messages/conversation/${conv.conversationId}`);
        const msgs = res.data || [];
        setMessages((prev) => { if (msgs.length > prev.length) setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50); return msgs; });
      } catch {}
    }, 5000);
    setConversations((p) => p.map((c) => c.conversationId===conv.conversationId?{...c,unreadCount:0}:c));
    setUnread((u) => Math.max(0, u-(conv.unreadCount||0)));
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handlePasswordCommand = async (conv: any) => {
    if (!isSuperAdmin) return;
    setSending(true);
    try {
      const newPassword = genPassword();
      const otherUserId = conv.otherUser?.userId;
      let saved = false;
      try { await api.post(`/api/v1/admin/users/${otherUserId}/reset-password`, { newPassword }); saved=true; } catch {}
      if (!saved) { try { await api.post(`/api/v1/admin/dealers/${otherUserId}/reset-password`, { newPassword }); saved=true; } catch {} }
      const responseMsg = `Your account password has been reset.\n\nNew Password: ${newPassword}\n\nPlease log in with this password and change it immediately from your Settings.`;
      const res = await api.post(`/api/v1/messages/conversation/${conv.conversationId}/send`, { receiverId:otherUserId, message:responseMsg });
      setMessages((p) => [...p, res.data]);
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    } catch (err: any) { alert("Failed to process !password: "+(err.response?.data?.detail||err.message)); }
    finally { setSending(false); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()||!activeConv) return;
    if (newMsg.trim().toLowerCase()==="!password"&&isSuperAdmin) { setNewMsg(""); await handlePasswordCommand(activeConv); return; }
    setSending(true);
    try {
      const res = await api.post(`/api/v1/messages/conversation/${activeConv.conversationId}/send`, { receiverId:activeConv.otherUser?.userId, message:newMsg });
      setMessages((p) => [...p, res.data]); setNewMsg("");
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    } catch {} finally { setSending(false); }
  };

  useEffect(() => {
    if (userSearch.length<2) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      try { const res = await api.get("/api/v1/messages/search-users",{params:{q:userSearch}}); setUserResults(res.data||[]); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const startConversation = async () => {
    if (!selectedUser||!startMsg.trim()) return;
    try {
      const res = await api.post("/api/v1/messages/start",{receiverId:selectedUser.userId,message:startMsg});
      setShowNew(false); setUserSearch(""); setSelectedUser(null); setStartMsg(""); setUserResults([]);
      await loadConvs();
      const conv = conversations.find((c) => c.conversationId===res.data.conversationId);
      if (conv) openConv(conv);
    } catch (err: any) { alert(err.response?.data?.detail||"Failed to start conversation"); }
  };

  const uid = user?.userId;
  const fmtTime = (iso: string) => { const d=Date.now()-new Date(iso).getTime(); const m=Math.floor(d/60000); return m<1?"now":m<60?`${m}m`:m<1440?`${Math.floor(m/60)}h`:new Date(iso).toLocaleDateString(); };

  return (
    <>
      <button className="msg-fab" onClick={()=>setOpen(!open)} style={{"--accent":accentColor} as any}>
        {open?"X":"MSG"}
        {unread>0&&!open&&<span className="fab-badge">{unread}</span>}
      </button>

      {open&&(
        <div className="msg-panel" style={{"--accent":accentColor} as any}>
          <div className="mp-header">
            <span className="mp-title">Messages</span>
            <button className="mp-new" onClick={()=>setShowNew(true)}>+ New</button>
            <button className="mp-close" onClick={()=>{setOpen(false);setActiveConv(null);}}>X</button>
          </div>

          {!activeConv?(
            <div className="conv-list">
              {conversations.length===0?(
                <div className="conv-empty"><p>No conversations</p><button className="mp-new-lg" onClick={()=>setShowNew(true)}>Start a conversation</button></div>
              ):conversations.map((conv)=>(
                <div key={conv._id} className="conv-item" onClick={()=>openConv(conv)}>
                  <div className="ci-avatar">{conv.otherUser?.profilePicture?<img src={conv.otherUser.profilePicture} alt=""/>:conv.otherUser?.fullName?.charAt(0)||"?"}</div>
                  <div className="ci-info"><div className="ci-name">{conv.otherUser?.fullName||"User"}</div><div className="ci-last">{conv.lastMessage}</div></div>
                  <div className="ci-meta"><div className="ci-time">{fmtTime(conv.lastMessageAt)}</div>{conv.unreadCount>0&&<div className="ci-unread">{conv.unreadCount}</div>}</div>
                </div>
              ))}
            </div>
          ):(
            <div className="chat-view">
              <div className="chat-head">
                <button className="chat-back" onClick={()=>{setActiveConv(null);if(pollRef.current)clearInterval(pollRef.current);}}>back</button>
                <div className="ch-avatar">{activeConv.otherUser?.profilePicture?<img src={activeConv.otherUser.profilePicture} alt=""/>:activeConv.otherUser?.fullName?.charAt(0)||"?"}</div>
                <div className="ch-name">{activeConv.otherUser?.fullName}</div>
              </div>
              <div className="chat-msgs">
                {messages.map((m)=>{
                  const isMe=m.senderId===uid;
                  return (
                    <div key={m._id} className={`msg-row ${isMe?"me":"them"}`}>
                      <div className={`msg-bubble ${isMe?"me":"them"}`}>
                        <div className="msg-text" style={{whiteSpace:"pre-wrap"}}>{m.message}</div>
                        <div className="msg-time">{fmtTime(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgsEndRef}/>
              </div>
              <form className="chat-input" onSubmit={sendMessage}>
                <input placeholder={isSuperAdmin?"Type or !password to reset...":"Type a message..."} value={newMsg} onChange={(e)=>setNewMsg(e.target.value)}/>
                <button type="submit" disabled={sending||!newMsg.trim()}>Send</button>
              </form>
              {isSuperAdmin&&(
                <div style={{padding:"0.3rem 0.75rem 0.5rem",fontSize:"0.65rem",color:"#A3A3A3",borderTop:"1px solid #F5F5F5"}}>
                  Tip: type <code style={{background:"#F5F5F5",padding:"0 0.3rem",borderRadius:"3px"}}>!password</code> to reset this user password and send it here
                </div>
              )}
            </div>
          )}

          {showNew&&(
            <div className="new-conv-overlay" onClick={()=>setShowNew(false)}>
              <div className="new-conv" onClick={(e)=>e.stopPropagation()}>
                <div className="nc-header"><span>New Conversation</span><button onClick={()=>setShowNew(false)}>X</button></div>
                <div className="nc-body">
                  <div className="nc-search-wrap">
                    <input className="nc-input" placeholder="Search by name or email..." value={userSearch} onChange={(e)=>setUserSearch(e.target.value)} autoFocus/>
                    {userResults.length>0&&(
                      <div className="nc-results">
                        {userResults.map((u)=>(
                          <div key={u.userId} className={`nc-user ${selectedUser?.userId===u.userId?"selected":""}`} onClick={()=>{setSelectedUser(u);setUserSearch(u.fullName);setUserResults([]);}}>
                            <div className="nu-avatar">{u.profilePicture?<img src={u.profilePicture} alt=""/>:u.fullName?.charAt(0)||"?"}</div>
                            <div className="nu-info"><div className="nu-name">{u.fullName}</div><div className="nu-role">{u.role?.replace(/_/g," ")} - {u.email}</div></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedUser&&<div className="nc-selected">Selected: {selectedUser.fullName}</div>}
                  <textarea className="nc-msg" placeholder="Write your first message..." value={startMsg} onChange={(e)=>setStartMsg(e.target.value)} rows={3}/>
                  <button className="nc-send" onClick={startConversation} disabled={!selectedUser||!startMsg.trim()}>Start Conversation</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .msg-fab{position:fixed;bottom:80px;right:1.25rem;z-index:9999;background:var(--accent,#F47B20);color:#fff;border:none;border-radius:50%;width:48px;height:48px;font-family:var(--font-display);font-size:0.65rem;font-weight:700;letter-spacing:0.06em;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.2s}
        .msg-fab:hover{transform:scale(1.08)}
        .fab-badge{position:absolute;top:-4px;right:-4px;background:#DC2626;color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;border:2px solid #fff}
        .msg-panel{position:fixed;bottom:140px;right:1.25rem;z-index:9998;width:320px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.18);border:1.5px solid #E5E5E5;display:flex;flex-direction:column;overflow:hidden}
        .mp-header{display:flex;align-items:center;gap:0.5rem;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;background:var(--accent,#F47B20);color:#fff;flex-shrink:0}
        .mp-title{font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;flex:1}
        .mp-new{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:5px;padding:0.2rem 0.6rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body)}
        .mp-close{background:none;border:none;color:#fff;font-size:0.875rem;font-weight:700;cursor:pointer}
        .conv-list{flex:1;overflow-y:auto}
        .conv-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;min-height:200px;color:#A3A3A3;font-size:0.875rem}
        .mp-new-lg{background:var(--accent,#F47B20);color:#fff;border:none;border-radius:6px;padding:0.6rem 1.25rem;font-family:var(--font-display);font-size:0.8rem;cursor:pointer}
        .conv-item{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;cursor:pointer;border-bottom:1px solid #F5F5F5;transition:background 0.15s}
        .conv-item:hover{background:#FFF7ED}
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
        .chat-msgs{flex:1;overflow-y:auto;padding:0.875rem;display:flex;flex-direction:column;gap:0.5rem;min-height:0}
        .msg-row{display:flex}
        .msg-row.me{justify-content:flex-end}
        .msg-bubble{max-width:85%;padding:0.5rem 0.75rem;border-radius:10px;display:flex;flex-direction:column;gap:0.15rem}
        .msg-bubble.me{background:var(--accent,#F47B20);color:#fff;border-radius:10px 10px 0 10px}
        .msg-bubble.them{background:#F5F5F5;color:#171717;border-radius:10px 10px 10px 0}
        .msg-text{font-size:0.825rem;line-height:1.5;word-break:break-word}
        .msg-time{font-size:0.58rem;opacity:0.65;text-align:right}
        .chat-input{display:flex;gap:0.375rem;padding:0.75rem;border-top:1px solid #E5E5E5;flex-shrink:0}
        .chat-input input{flex:1;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:20px;padding:0.5rem 0.875rem;color:#171717;font-size:0.825rem;font-family:var(--font-body);outline:none}
        .chat-input input:focus{border-color:var(--accent,#F47B20);background:#fff}
        .chat-input button{background:var(--accent,#F47B20);color:#fff;border:none;border-radius:20px;padding:0.5rem 1rem;font-family:var(--font-display);font-size:0.75rem;cursor:pointer;white-space:nowrap}
        .chat-input button:disabled{opacity:0.5;cursor:not-allowed}
        .new-conv-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:10;border-radius:16px}
        .new-conv{background:#fff;border-radius:12px;width:90%;overflow:hidden}
        .nc-header{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1rem;background:var(--accent,#F47B20);color:#fff}
        .nc-header span{font-family:var(--font-display);font-size:0.875rem}
        .nc-header button{background:none;border:none;color:#fff;font-weight:700;cursor:pointer}
        .nc-body{padding:1rem;display:flex;flex-direction:column;gap:0.75rem}
        .nc-search-wrap{position:relative}
        .nc-input{width:100%;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.65rem 0.875rem;color:#171717;font-size:0.825rem;font-family:var(--font-body);outline:none}
        .nc-input:focus{border-color:var(--accent,#F47B20);background:#fff}
        .nc-results{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;z-index:50;max-height:160px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.1)}
        .nc-user{display:flex;align-items:center;gap:0.625rem;padding:0.65rem 0.875rem;cursor:pointer;border-bottom:1px solid #F5F5F5}
        .nc-user:hover,.nc-user.selected{background:#FFF7ED}
        .nu-avatar{width:28px;height:28px;border-radius:50%;background:#E5E5E5;color:#737373;font-size:0.8rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .nu-name{font-size:0.8rem;font-weight:500;color:#171717}
        .nu-role{font-size:0.68rem;color:#A3A3A3;text-transform:capitalize}
        .nc-selected{background:#FFF7ED;border:1px solid rgba(244,123,32,0.3);color:#C4621A;padding:0.4rem 0.75rem;border-radius:5px;font-size:0.78rem}
        .nc-msg{width:100%;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.65rem;color:#171717;font-size:0.825rem;font-family:var(--font-body);outline:none;resize:none}
        .nc-msg:focus{border-color:var(--accent,#F47B20);background:#fff}
        .nc-send{width:100%;background:var(--accent,#F47B20);color:#fff;border:none;border-radius:6px;padding:0.75rem;font-family:var(--font-display);font-size:0.85rem;letter-spacing:0.06em;cursor:pointer}
        .nc-send:disabled{opacity:0.5;cursor:not-allowed}
        @media(max-width:640px){.msg-panel{width:calc(100vw - 2rem);right:1rem;bottom:160px}}
      `}</style>
    </>
  );
}