"use client";
import { useEffect, useState, useRef, useCallback } from "react";
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
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [startMsg, setStartMsg] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  const loadConvs = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/messages/conversations");
      setConversations(res.data || []);
    } catch { } finally { setLoadingConvs(false); }
  }, []);

  useEffect(() => { loadConvs(); }, []);

  const loadMessages = useCallback(async (conv: any) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/api/v1/messages/conversation/${conv.conversationId}`);
      setMessages(res.data || []);
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { } finally { setLoadingMsgs(false); }
  }, []);

  const openConv = (conv: any) => {
    setActiveConv(conv);
    loadMessages(conv);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(conv), 5000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);
    try {
      const res = await api.post(`/api/v1/messages/conversation/${activeConv.conversationId}/send`, {
        receiverId: activeConv.otherUser?.userId,
        message: newMsg,
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMsg("");
      loadConvs();
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch { } finally { setSending(false); }
  };

  useEffect(() => {
    if (userSearch.length < 2) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/api/v1/messages/search-users", { params: { q: userSearch } });
        setUserResults(res.data || []);
      } catch { } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const startConversation = async (receiver: any) => {
    if (!startMsg.trim()) return;
    try {
      const res = await api.post("/api/v1/messages/start", {
        receiverId: receiver.userId,
        message: startMsg,
      });
      setShowNewChat(false);
      setUserSearch(""); setUserResults([]); setStartMsg("");
      await loadConvs();
      // Open the new conversation
      const convRes = await api.get("/api/v1/messages/conversations");
      const convs = convRes.data || [];
      setConversations(convs);
      const newConv = convs.find((c: any) => c.conversationId === res.data.conversationId);
      if (newConv) openConv(newConv);
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
  };

  const fmtTime = (iso: string) => {
    if (!iso) return "";
    const d = Date.now() - new Date(iso).getTime();
    const m = Math.floor(d/60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m/60)}h`;
    return new Date(iso).toLocaleDateString("en-NG", {day:"numeric",month:"short"});
  };

  const ROLE_COLORS: Record<string,string> = {
    DEALER_ADMIN:"#F47B20", DEALER_STAFF:"#1D9E75", PARTNER_USER:"#3B8BD4",
    SYSTEM_ADMIN:"#DC2626", PUBLIC_USER:"#888",
  };

  return (
    <div className="messages-page">
      <div className="msgs-shell">
        {/* Conversations List */}
        <div className={`conv-panel ${activeConv ? "hidden-mobile" : ""}`}>
          <div className="conv-header">
            <h2 className="conv-title">Messages</h2>
            <button className="new-chat-btn" onClick={() => setShowNewChat(true)}>+ New</button>
          </div>

          {loadingConvs ? <div className="conv-loading"><div className="spinner" /></div>
          : conversations.length === 0 ? (
            <div className="conv-empty">
              <span style={{fontSize:"2.5rem"}}>💬</span>
              <p>No conversations yet</p>
              <button className="new-chat-btn-lg" onClick={() => setShowNewChat(true)}>Start a conversation</button>
            </div>
          ) : (
            <div className="conv-list">
              {conversations.map((conv) => (
                <div key={conv._id} className={`conv-item ${activeConv?.conversationId === conv.conversationId ? "active" : ""}`}
                  onClick={() => openConv(conv)}>
                  <div className="conv-avatar">
                    {conv.otherUser?.profilePicture
                      ? <img src={conv.otherUser.profilePicture} alt="" />
                      : conv.otherUser?.fullName?.charAt(0) || "?"
                    }
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">{conv.otherUser?.fullName || "Unknown"}</div>
                    <div className="conv-role" style={{color:ROLE_COLORS[conv.otherUser?.role]||"#888"}}>
                      {conv.otherUser?.role?.replace(/_/g," ")}
                    </div>
                    <div className="conv-last">{conv.lastMessage}</div>
                  </div>
                  <div className="conv-meta">
                    <div className="conv-time">{fmtTime(conv.lastMessageAt)}</div>
                    {conv.unreadCount > 0 && <div className="conv-unread">{conv.unreadCount}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className={`chat-panel ${!activeConv ? "hidden-mobile" : ""}`}>
          {!activeConv ? (
            <div className="chat-empty">
              <span style={{fontSize:"3rem"}}>💬</span>
              <p>Select a conversation or start a new one</p>
              <button className="new-chat-btn-lg" onClick={() => setShowNewChat(true)}>New Conversation</button>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <button className="back-btn" onClick={() => { setActiveConv(null); if(pollRef.current) clearInterval(pollRef.current); }}>← Back</button>
                <div className="chat-avatar">
                  {activeConv.otherUser?.profilePicture
                    ? <img src={activeConv.otherUser.profilePicture} alt="" />
                    : activeConv.otherUser?.fullName?.charAt(0)||"?"
                  }
                </div>
                <div>
                  <div className="chat-name">{activeConv.otherUser?.fullName||"Unknown"}</div>
                  <div className="chat-role" style={{color:ROLE_COLORS[activeConv.otherUser?.role]||"#888"}}>
                    {activeConv.otherUser?.role?.replace(/_/g," ")}
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {loadingMsgs ? <div style={{display:"flex",justifyContent:"center",padding:"2rem"}}><div className="spinner" /></div>
                : messages.length === 0 ? <div className="chat-start">Say hello 👋</div>
                : messages.map((m) => {
                  const isMe = m.senderId === uid || m.senderId === user?.userId;
                  return (
                    <div key={m._id} className={`msg-row ${isMe ? "me" : "them"}`}>
                      <div className={`msg-bubble ${isMe ? "me" : "them"}`}>
                        <div className="msg-text">{m.message}</div>
                        <div className="msg-time">{fmtTime(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgsEndRef} />
              </div>

              <form className="chat-input-row" onSubmit={sendMessage}>
                <input className="chat-input" placeholder="Type a message..."
                  value={newMsg} onChange={(e) => setNewMsg(e.target.value)} />
                <button type="submit" className="chat-send" disabled={sending||!newMsg.trim()}>
                  {sending ? "..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* NEW CONVERSATION MODAL */}
      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">NEW CONVERSATION</h3>
              <button className="modal-close" onClick={() => setShowNewChat(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="fl">Search users (name, email or username)</label>
                <div style={{position:"relative"}}>
                  <input className="fi" placeholder="Search..." value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)} autoFocus />
                  {searching && <div style={{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",fontSize:"0.75rem",color:"#AAA"}}>...</div>}
                  {userResults.length > 0 && (
                    <div className="user-dropdown">
                      {userResults.map((u) => (
                        <div key={u.userId} className="user-option">
                          <div className="uo-avatar">{u.profilePicture?<img src={u.profilePicture} alt=""/>:u.fullName?.charAt(0)||"?"}</div>
                          <div className="uo-info">
                            <div className="uo-name">{u.fullName}</div>
                            <div className="uo-role" style={{color:ROLE_COLORS[u.role]||"#888"}}>{u.role?.replace(/_/g," ")} · {u.email}</div>
                          </div>
                          <button className="select-user-btn" onClick={() => {
                            setUserSearch(u.fullName);
                            setUserResults([]);
                            // Store selected user
                            (window as any).__selectedMsgUser = u;
                          }}>Select</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="field">
                <label className="fl">Message *</label>
                <textarea className="fi fi-ta" rows={3} placeholder="Write your first message..." value={startMsg}
                  onChange={(e) => setStartMsg(e.target.value)} />
              </div>
              <button className="send-start-btn"
                onClick={() => {
                  const selected = (window as any).__selectedMsgUser;
                  if (!selected) { alert("Please select a user first"); return; }
                  startConversation(selected);
                }}
                disabled={!startMsg.trim()}>
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .messages-page{height:calc(100vh - 130px);display:flex;flex-direction:column}
        .msgs-shell{display:grid;grid-template-columns:300px 1fr;flex:1;border:1.5px solid #E5E5E5;border-radius:12px;overflow:hidden;background:#fff}
        .conv-panel{display:flex;flex-direction:column;border-right:1.5px solid #E5E5E5;height:100%;overflow:hidden}
        .conv-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #E5E5E5;flex-shrink:0}
        .conv-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.08em;color:#1A1A1A}
        .new-chat-btn{background:#F47B20;color:#fff;border:none;border-radius:5px;padding:0.35rem 0.75rem;font-size:0.8rem;cursor:pointer;font-family:var(--font-body)}
        .conv-loading{display:flex;align-items:center;justify-content:center;flex:1}
        .spinner{width:24px;height:24px;border:2px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .conv-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;flex:1;padding:2rem;text-align:center;color:#888;font-size:0.875rem}
        .conv-list{flex:1;overflow-y:auto}
        .conv-item{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1.25rem;cursor:pointer;transition:background 0.15s;border-bottom:1px solid #F5F5F5}
        .conv-item:hover,.conv-item.active{background:#FFF7ED}
        .conv-avatar{width:38px;height:38px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .conv-avatar img{width:100%;height:100%;object-fit:cover}
        .conv-info{flex:1;min-width:0}
        .conv-name{font-weight:600;font-size:0.875rem;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .conv-role{font-size:0.65rem;text-transform:capitalize;margin-bottom:0.1rem}
        .conv-last{font-size:0.75rem;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .conv-meta{display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem;flex-shrink:0}
        .conv-time{font-size:0.65rem;color:#AAA}
        .conv-unread{background:#F47B20;color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700}
        .chat-panel{display:flex;flex-direction:column;height:100%;overflow:hidden}
        .chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:1rem;color:#888}
        .new-chat-btn-lg{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;cursor:pointer}
        .chat-header{display:flex;align-items:center;gap:0.875rem;padding:0.875rem 1.25rem;border-bottom:1px solid #E5E5E5;flex-shrink:0}
        .back-btn{background:none;border:none;color:#AAA;font-size:0.875rem;cursor:pointer;font-family:var(--font-body);margin-right:0.25rem}
        .chat-avatar{width:36px;height:36px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1rem;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .chat-avatar img{width:100%;height:100%;object-fit:cover}
        .chat-name{font-weight:600;font-size:0.9rem;color:#1A1A1A}
        .chat-role{font-size:0.68rem;text-transform:capitalize}
        .chat-messages{flex:1;overflow-y:auto;padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem}
        .chat-start{text-align:center;color:#AAA;font-size:0.875rem;padding:2rem}
        .msg-row{display:flex}
        .msg-row.me{justify-content:flex-end}
        .msg-row.them{justify-content:flex-start}
        .msg-bubble{max-width:70%;padding:0.65rem 0.875rem;border-radius:12px;display:flex;flex-direction:column;gap:0.2rem}
        .msg-bubble.me{background:#F47B20;color:#fff;border-radius:12px 12px 0 12px}
        .msg-bubble.them{background:#F5F5F5;color:#1A1A1A;border-radius:12px 12px 12px 0}
        .msg-text{font-size:0.875rem;line-height:1.4;word-break:break-word}
        .msg-time{font-size:0.6rem;opacity:0.7;text-align:right}
        .chat-input-row{display:flex;gap:0.5rem;padding:0.875rem 1.25rem;border-top:1px solid #E5E5E5;flex-shrink:0}
        .chat-input{flex:1;background:#F5F5F5;border:1.5px solid #DDD;border-radius:22px;padding:0.65rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s}
        .chat-input:focus{border-color:#F47B20;background:#fff}
        .chat-send{background:#F47B20;color:#fff;border:none;border-radius:22px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.8rem;cursor:pointer;white-space:nowrap}
        .chat-send:disabled{opacity:0.5;cursor:not-allowed}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .modal-body{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:80px}
        .user-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid #DDD;border-radius:8px;z-index:50;max-height:200px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.12)}
        .user-option{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;border-bottom:1px solid #F0F0F0;transition:background 0.15s}
        .user-option:last-child{border-bottom:none}
        .user-option:hover{background:#FFF7ED}
        .uo-avatar{width:32px;height:32px;border-radius:50%;background:#F47B20;color:#fff;font-size:0.875rem;font-weight:700;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .uo-avatar img{width:100%;height:100%;object-fit:cover}
        .uo-info{flex:1;min-width:0}
        .uo-name{font-size:0.875rem;font-weight:500;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .uo-role{font-size:0.7rem;text-transform:capitalize}
        .select-user-btn{background:#F47B20;color:#fff;border:none;border-radius:4px;padding:0.25rem 0.65rem;font-size:0.72rem;cursor:pointer;flex-shrink:0}
        .send-start-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.875rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.08em;cursor:pointer;width:100%}
        .send-start-btn:disabled{opacity:0.5;cursor:not-allowed}
        @media(max-width:640px){
          .msgs-shell{grid-template-columns:1fr}
          .hidden-mobile{display:none}
          .back-btn{display:block}
        }
        @media(min-width:641px){.back-btn{display:none}}
      `}</style>
    </div>
  );
}
