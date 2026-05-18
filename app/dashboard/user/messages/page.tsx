"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const uid = user?.userId;
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [startMsg, setStartMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const activeConvRef = useRef<any>(null);
  const messagesRef = useRef<any[]>([]);

  // Keep refs in sync
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const loadConvs = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const res = await api.get("/api/v1/messages/conversations");
      setConversations(res.data || []);
    } catch { } finally { if (!silent) setLoadingConvs(false); }
  }, []);

  useEffect(() => { loadConvs(); }, []);

  // Silent background poll for conversation list
  useEffect(() => {
    const t = setInterval(() => loadConvs(true), 15000);
    return () => clearInterval(t);
  }, [loadConvs]);

  const loadMessages = useCallback(async (conv: any, silent = false) => {
    if (!silent) {
      // Only show loading on first open, not on refresh
    }
    try {
      const res = await api.get(`/api/v1/messages/conversation/${conv.conversationId}`);
      const newMsgs = res.data || [];
      // Only update if there are actually new messages (silent)
      if (silent) {
        if (newMsgs.length !== messagesRef.current.length) {
          setMessages(newMsgs);
          // Scroll only if user is near bottom
          const el = msgsEndRef.current?.parentElement;
          if (el) {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (nearBottom) setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
          }
        }
      } else {
        setMessages(newMsgs);
        setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
      }
    } catch { }
  }, []);

  const openConv = useCallback((conv: any) => {
    setActiveConv(conv);
    loadMessages(conv, false);
    if (pollRef.current) clearInterval(pollRef.current);
    // Silent poll every 5s for new messages in active conversation
    pollRef.current = setInterval(() => {
      if (activeConvRef.current) loadMessages(activeConvRef.current, true);
    }, 5000);
    // Update unread
    setConversations((p) => p.map((c) =>
      c.conversationId === conv.conversationId ? {...c, unreadCount:0} : c
    ));
  }, [loadMessages]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);
    const msgText = newMsg;
    setNewMsg(""); // Clear immediately for better UX
    try {
      const res = await api.post(
        `/api/v1/messages/conversation/${activeConv.conversationId}/send`,
        { receiverId: activeConv.otherUser?.userId, message: msgText }
      );
      setMessages((p) => [...p, res.data]);
      loadConvs(true);
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    } catch { setNewMsg(msgText); } // Restore if failed
    finally { setSending(false); }
  };

  useEffect(() => {
    if (userSearch.length < 2) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/api/v1/messages/search-users", { params:{q:userSearch} });
        setUserResults(res.data || []);
      } catch { }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const startConversation = async () => {
    if (!selectedUser || !startMsg.trim()) return;
    try {
      const res = await api.post("/api/v1/messages/start", {
        receiverId: selectedUser.userId,
        message: startMsg,
      });
      setShowNewChat(false);
      setUserSearch(""); setSelectedUser(null); setStartMsg(""); setUserResults([]);
      await loadConvs(true);
      setConversations((prev) => {
        const found = prev.find((c: any) => c.conversationId === res.data.conversationId);
        if (found) { setTimeout(() => openConv(found), 100); }
        return prev;
      });
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
  };

  const fmtTime = (iso: string) => {
    if (!iso) return "";
    const d = Date.now() - new Date(iso).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return new Date(iso).toLocaleDateString("en-NG", {day:"numeric",month:"short"});
  };

  const ROLE_COLORS: Record<string,string> = {
    DEALER_ADMIN:"#F47B20", DEALER_STAFF:"#737373",
    PARTNER_USER:"#525252", SYSTEM_ADMIN:"#DC2626", PUBLIC_USER:"#A3A3A3",
  };

  return (
    <div className="msgs-page">
      <div className="msgs-shell">
        {/* LEFT: Conversations */}
        <div className={`conv-panel ${activeConv ? "mobile-hidden" : ""}`}>
          <div className="cp-header">
            <h2 className="cp-title">Messages</h2>
            <button className="new-btn" onClick={() => setShowNewChat(true)}>+ New</button>
          </div>
          {loadingConvs ? (
            <div className="cp-loading"><div className="spinner" /></div>
          ) : conversations.length === 0 ? (
            <div className="cp-empty">
              <p>No conversations yet</p>
              <button className="new-btn-lg" onClick={() => setShowNewChat(true)}>Start chatting</button>
            </div>
          ) : (
            <div className="conv-list">
              {conversations.map((conv) => (
                <div key={conv._id}
                  className={`conv-item ${activeConv?.conversationId === conv.conversationId ? "active" : ""}`}
                  onClick={() => openConv(conv)}>
                  <div className="ci-av">
                    {conv.otherUser?.profilePicture
                      ? <img src={conv.otherUser.profilePicture} alt="" />
                      : conv.otherUser?.fullName?.charAt(0) || "?"
                    }
                  </div>
                  <div className="ci-body">
                    <div className="ci-name">{conv.otherUser?.fullName || "User"}</div>
                    <div className="ci-role" style={{color:ROLE_COLORS[conv.otherUser?.role]||"#A3A3A3"}}>
                      {conv.otherUser?.role?.replace(/_/g," ")}
                    </div>
                    <div className="ci-last">{conv.lastMessage}</div>
                  </div>
                  <div className="ci-meta">
                    <span className="ci-time">{fmtTime(conv.lastMessageAt)}</span>
                    {conv.unreadCount > 0 && <span className="ci-unread">{conv.unreadCount}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Chat */}
        <div className={`chat-panel ${!activeConv ? "mobile-hidden" : ""}`}>
          {!activeConv ? (
            <div className="chat-empty">
              <p>Select a conversation or start a new one</p>
              <button className="new-btn-lg" onClick={() => setShowNewChat(true)}>New Conversation</button>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <button className="back-btn" onClick={() => { setActiveConv(null); if(pollRef.current) clearInterval(pollRef.current); }}>
                  ? Back
                </button>
                <div className="ch-av">
                  {activeConv.otherUser?.profilePicture
                    ? <img src={activeConv.otherUser.profilePicture} alt="" />
                    : activeConv.otherUser?.fullName?.charAt(0) || "?"
                  }
                </div>
                <div>
                  <div className="ch-name">{activeConv.otherUser?.fullName || "User"}</div>
                  <div className="ch-role" style={{color:ROLE_COLORS[activeConv.otherUser?.role]||"#A3A3A3"}}>
                    {activeConv.otherUser?.role?.replace(/_/g," ")}
                  </div>
                </div>
              </div>

              <div className="chat-msgs">
                {messages.length === 0 ? (
                  <div className="chat-start">Say hello!</div>
                ) : messages.map((m) => {
                  const isMe = m.senderId === uid;
                  return (
                    <div key={m._id || m.messageId} className={`msg-row ${isMe ? "me" : "them"}`}>
                      <div className={`msg-bubble ${isMe ? "me" : "them"}`}>
                        <div className="msg-text">{m.message}</div>
                        <div className="msg-time">{fmtTime(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgsEndRef} />
              </div>

              <form className="chat-input" onSubmit={sendMessage}>
                <input
                  className="msg-input"
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="send-btn" disabled={sending || !newMsg.trim()}>
                  {sending ? "..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* NEW CHAT MODAL */}
      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">NEW CONVERSATION</h3>
              <button className="modal-x" onClick={() => setShowNewChat(false)}>?</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="fl">Search users (name, email or username)</label>
                <div style={{position:"relative"}}>
                  <input className="fi" placeholder="Search..." value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setSelectedUser(null); }} autoFocus />
                  {userResults.length > 0 && (
                    <div className="user-drop">
                      {userResults.map((u) => (
                        <div key={u.userId} className="user-opt"
                          onClick={() => { setSelectedUser(u); setUserSearch(u.fullName); setUserResults([]); }}>
                          <div className="uo-av">{u.profilePicture?<img src={u.profilePicture} alt=""/>:u.fullName?.charAt(0)||"?"}</div>
                          <div className="uo-info">
                            <div className="uo-name">{u.fullName}</div>
                            <div className="uo-meta">{u.role?.replace(/_/g," ")} Â· {u.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className="sel-user">
                    Selected: <strong>{selectedUser.fullName}</strong>
                    <button onClick={() => { setSelectedUser(null); setUserSearch(""); }} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",marginLeft:"0.5rem"}}>?</button>
                  </div>
                )}
              </div>
              <div className="field">
                <label className="fl">Message *</label>
                <textarea className="fi fi-ta" rows={3} placeholder="Write your first message..."
                  value={startMsg} onChange={(e) => setStartMsg(e.target.value)} />
              </div>
              <button className="start-btn" onClick={startConversation}
                disabled={!selectedUser || !startMsg.trim()}>
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .msgs-page{height:calc(100vh - 140px);display:flex;flex-direction:column}
        .msgs-shell{display:grid;grid-template-columns:300px 1fr;flex:1;border:1.5px solid #E5E5E5;border-radius:12px;overflow:hidden;background:#fff;min-height:0}
        .conv-panel{display:flex;flex-direction:column;border-right:1.5px solid #E5E5E5;overflow:hidden}
        .cp-header{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1rem;border-bottom:1px solid #E5E5E5;flex-shrink:0}
        .cp-title{font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.08em;color:#1A1A1A}
        .new-btn{background:#F47B20;color:#fff;border:none;border-radius:5px;padding:0.3rem 0.75rem;font-size:0.78rem;cursor:pointer;font-family:var(--font-body)}
        .cp-loading{display:flex;align-items:center;justify-content:center;flex:1}
        .spinner{width:24px;height:24px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;flex:1;color:#A3A3A3;font-size:0.875rem;text-align:center;padding:1.5rem}
        .new-btn-lg{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.6rem 1.25rem;font-family:var(--font-display);font-size:0.82rem;cursor:pointer}
        .conv-list{flex:1;overflow-y:auto}
        .conv-item{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;cursor:pointer;border-bottom:1px solid #F5F5F5;transition:background 0.15s}
        .conv-item:hover,.conv-item.active{background:#FFF7ED}
        .ci-av{width:36px;height:36px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:0.95rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .ci-av img{width:100%;height:100%;object-fit:cover}
        .ci-body{flex:1;min-width:0}
        .ci-name{font-size:0.85rem;font-weight:600;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ci-role{font-size:0.65rem;text-transform:capitalize;margin-bottom:0.1rem}
        .ci-last{font-size:0.75rem;color:#A3A3A3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ci-meta{display:flex;flex-direction:column;align-items:flex-end;gap:0.25rem;flex-shrink:0}
        .ci-time{font-size:0.62rem;color:#A3A3A3}
        .ci-unread{background:#F47B20;color:#fff;border-radius:50%;width:17px;height:17px;display:flex;align-items:center;justify-content:center;font-size:0.58rem;font-weight:700}
        .chat-panel{display:flex;flex-direction:column;overflow:hidden}
        .chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:1rem;color:#A3A3A3;text-align:center}
        .chat-header{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1.25rem;border-bottom:1px solid #E5E5E5;flex-shrink:0}
        .back-btn{background:none;border:none;color:#A3A3A3;font-size:0.8rem;cursor:pointer;font-family:var(--font-body);font-weight:600}
        .ch-av{width:34px;height:34px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:0.9rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .ch-av img{width:100%;height:100%;object-fit:cover}
        .ch-name{font-weight:600;font-size:0.9rem;color:#1A1A1A}
        .ch-role{font-size:0.65rem;text-transform:capitalize}
        .chat-msgs{flex:1;overflow-y:auto;padding:1.25rem;display:flex;flex-direction:column;gap:0.625rem}
        .chat-start{text-align:center;color:#A3A3A3;font-size:0.875rem}
        .msg-row{display:flex}
        .msg-row.me{justify-content:flex-end}
        .msg-row.them{justify-content:flex-start}
        .msg-bubble{max-width:72%;padding:0.625rem 0.875rem;border-radius:12px;display:flex;flex-direction:column;gap:0.15rem}
        .msg-bubble.me{background:#F47B20;color:#fff;border-radius:12px 12px 0 12px}
        .msg-bubble.them{background:#F5F5F5;color:#1A1A1A;border-radius:12px 12px 12px 0}
        .msg-text{font-size:0.875rem;line-height:1.45;word-break:break-word}
        .msg-time{font-size:0.58rem;opacity:0.65;text-align:right}
        .chat-input{display:flex;gap:0.5rem;padding:0.875rem 1.25rem;border-top:1px solid #E5E5E5;flex-shrink:0}
        .msg-input{flex:1;background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:22px;padding:0.65rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s}
        .msg-input:focus{border-color:#F47B20;background:#fff}
        .msg-input::placeholder{color:#A3A3A3}
        .send-btn{background:#F47B20;color:#fff;border:none;border-radius:22px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.78rem;cursor:pointer;white-space:nowrap;letter-spacing:0.04em}
        .send-btn:disabled{opacity:0.5;cursor:not-allowed}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-head{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-x{background:none;border:none;color:#A3A3A3;font-size:1rem;cursor:pointer}
        .modal-body{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#737373}
        .fi{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:80px}
        .user-drop{position:absolute;top:calc(100%+4px);left:0;right:0;background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;z-index:50;max-height:200px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.12)}
        .user-opt{display:flex;align-items:center;gap:0.625rem;padding:0.75rem 1rem;cursor:pointer;border-bottom:1px solid #F5F5F5;transition:background 0.15s}
        .user-opt:hover{background:#FFF7ED}
        .uo-av{width:30px;height:30px;border-radius:50%;background:#F47B20;color:#fff;font-size:0.85rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .uo-av img{width:100%;height:100%;object-fit:cover}
        .uo-name{font-size:0.85rem;font-weight:500;color:#1A1A1A}
        .uo-meta{font-size:0.7rem;color:#A3A3A3;text-transform:capitalize}
        .sel-user{background:#FFF7ED;border:1px solid rgba(244,123,32,0.3);color:#C4621A;padding:0.45rem 0.75rem;border-radius:6px;font-size:0.78rem;display:flex;align-items:center}
        .start-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.875rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.08em;cursor:pointer;width:100%}
        .start-btn:disabled{opacity:0.5;cursor:not-allowed}
        @media(max-width:640px){
          .msgs-shell{grid-template-columns:1fr}
          .mobile-hidden{display:none}
          .back-btn{display:block}
          .msgs-page{height:calc(100vh - 160px)}
        }
        @media(min-width:641px){.back-btn{display:none}}
      `}</style>
    </div>
  );
}

