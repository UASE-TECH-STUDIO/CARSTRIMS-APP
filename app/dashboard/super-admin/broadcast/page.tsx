"use client";
import { useState } from "react";
import api from "@/lib/api";

const ROLE_OPTIONS = [
  { value:"all", label:"All Users", icon:"👥" },
  { value:"DEALER_ADMIN", label:"Dealers Only", icon:"🏢" },
  { value:"DEALER_STAFF", label:"Staff Only", icon:"👤" },
  { value:"PARTNER_USER", label:"Partners Only", icon:"🤝" },
  { value:"PUBLIC_USER", label:"Public Users Only", icon:"🌐" },
];

export default function BroadcastPage() {
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetRole: "all",
    type: "announcement",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setErr("Title and message are required");
      return;
    }
    setSending(true); setErr("");
    try {
      const res = await api.post("/api/v1/admin/broadcast", form);
      setResult(res.data);
      setHistory((prev) => [{
        ...form,
        sentAt: new Date().toISOString(),
        sentTo: res.data.sentTo || 0,
      }, ...prev]);
      setForm({ title:"", message:"", targetRole:"all", type:"announcement" });
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Failed to send message");
    } finally { setSending(false); }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-NG");

  return (
    <div className="broadcast-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Broadcast Messages</h2>
          <p className="page-sub">Send announcements, updates, or notices to all or specific users</p>
        </div>
      </div>

      {result && (
        <div className="success-banner">
          ✅ Message sent to {result.sentTo || "all"} users!
          <button onClick={() => setResult(null)} className="dismiss">✕</button>
        </div>
      )}
      {err && (
        <div className="error-banner">❌ {err}<button onClick={() => setErr("")} className="dismiss">✕</button>
        </div>
      )}

      <div className="broadcast-grid">
        {/* Compose */}
        <div className="compose-card">
          <h3 className="card-title">COMPOSE MESSAGE</h3>
          <form onSubmit={handleSend} className="compose-form">
            <div className="field">
              <label className="fl">Target Audience</label>
              <div className="role-selector">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`role-option ${form.targetRole === r.value ? "active" : ""}`}
                    onClick={() => setForm({...form, targetRole:r.value})}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="fl">Message Type</label>
              <div className="type-row">
                {["announcement","warning","update","promotion"].map((t) => (
                  <button key={t} type="button"
                    className={`type-btn ${form.type === t ? "active" : ""}`}
                    onClick={() => setForm({...form, type:t})}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="fl">Title *</label>
              <input className="fi" placeholder="e.g. Platform Maintenance Notice"
                value={form.title} onChange={(e) => setForm({...form, title:e.target.value})} required />
            </div>
            <div className="field">
              <label className="fl">Message *</label>
              <textarea className="fi fi-ta" rows={6}
                placeholder="Write your message here. Be clear and concise."
                value={form.message} onChange={(e) => setForm({...form, message:e.target.value})} required />
              <div className="char-count">{form.message.length} / 1000 characters</div>
            </div>
            <div className="preview-box">
              <div className="preview-label">PREVIEW</div>
              <div className="preview-title">{form.title || "Message title..."}</div>
              <div className="preview-msg">{form.message || "Your message will appear here..."}</div>
              <div className="preview-footer">
                To: {ROLE_OPTIONS.find((r) => r.value === form.targetRole)?.label} ·
                Type: {form.type}
              </div>
            </div>
            <button type="submit" className="send-btn" disabled={sending}>
              {sending ? "Sending..." : `Send to ${ROLE_OPTIONS.find((r) => r.value === form.targetRole)?.label}`}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="history-card">
          <h3 className="card-title">SENT MESSAGES</h3>
          {history.length === 0 ? (
            <div className="empty-history">
              <span>📭</span>
              <p>No messages sent yet in this session</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  <div className="hi-top">
                    <span className={`hi-type ${h.type}`}>{h.type}</span>
                    <span className="hi-target">→ {ROLE_OPTIONS.find((r) => r.value === h.targetRole)?.label}</span>
                  </div>
                  <div className="hi-title">{h.title}</div>
                  <div className="hi-msg">{h.message.slice(0, 80)}{h.message.length > 80 ? "..." : ""}</div>
                  <div className="hi-time">{fmtDate(h.sentAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .broadcast-page { display:flex; flex-direction:column; gap:1.5rem; }
        .page-header { display:flex; align-items:flex-start; justify-content:space-between; }
        .page-heading { font-family:var(--font-display); font-size:1.6rem; letter-spacing:0.05em; color:var(--text); line-height:1; }
        .page-sub { font-size:0.875rem; color:var(--text-muted); margin-top:0.3rem; }
        .success-banner { background:rgba(76,175,130,0.1); border:1px solid rgba(76,175,130,0.3); color:var(--success); padding:0.875rem 1.25rem; border-radius:8px; font-size:0.875rem; display:flex; align-items:center; justify-content:space-between; }
        .error-banner { background:rgba(224,82,82,0.1); border:1px solid rgba(224,82,82,0.3); color:var(--error); padding:0.875rem 1.25rem; border-radius:8px; font-size:0.875rem; display:flex; align-items:center; justify-content:space-between; }
        .dismiss { background:none; border:none; color:inherit; cursor:pointer; }
        .broadcast-grid { display:grid; grid-template-columns:1fr 320px; gap:1.25rem; }
        .compose-card, .history-card { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
        .card-title { font-family:var(--font-display); font-size:0.78rem; letter-spacing:0.15em; color:var(--text-muted); }
        .compose-form { display:flex; flex-direction:column; gap:1.25rem; }
        .field { display:flex; flex-direction:column; gap:0.4rem; }
        .fl { font-size:0.7rem; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); }
        .role-selector { display:flex; flex-direction:column; gap:0.4rem; }
        .role-option { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0.875rem; background:var(--surface-2); border:1px solid var(--border); border-radius:6px; cursor:pointer; font-family:var(--font-body); font-size:0.825rem; color:var(--text-muted); transition:all 0.2s; text-align:left; }
        .role-option:hover { border-color:var(--gold-dim); color:var(--text); }
        .role-option.active { border-color:var(--error); background:rgba(224,82,82,0.06); color:var(--text); }
        .type-row { display:flex; gap:0.4rem; flex-wrap:wrap; }
        .type-btn { background:transparent; border:1px solid var(--border); border-radius:20px; padding:0.3rem 0.875rem; font-size:0.75rem; cursor:pointer; color:var(--text-muted); font-family:var(--font-body); text-transform:capitalize; transition:all 0.2s; }
        .type-btn:hover { border-color:var(--gold-dim); color:var(--text); }
        .type-btn.active { background:var(--error); color:#fff; border-color:var(--error); }
        .fi { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:0.75rem; color:var(--text); font-size:0.875rem; font-family:var(--font-body); outline:none; transition:border-color 0.2s; width:100%; }
        .fi:focus { border-color:var(--error); }
        .fi-ta { resize:vertical; min-height:120px; }
        .char-count { font-size:0.68rem; color:var(--text-dim); text-align:right; }
        .preview-box { background:var(--surface-2); border:1px solid var(--border); border-left:3px solid var(--gold); border-radius:6px; padding:1rem; display:flex; flex-direction:column; gap:0.4rem; }
        .preview-label { font-size:0.65rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-dim); margin-bottom:0.2rem; }
        .preview-title { font-weight:600; font-size:0.9rem; color:var(--text); }
        .preview-msg { font-size:0.8rem; color:var(--text-muted); line-height:1.5; }
        .preview-footer { font-size:0.72rem; color:var(--text-dim); margin-top:0.25rem; text-transform:capitalize; }
        .send-btn { background:var(--error); color:#fff; border:none; border-radius:6px; padding:0.875rem; font-family:var(--font-display); font-size:0.9rem; letter-spacing:0.1em; cursor:pointer; transition:opacity 0.2s; }
        .send-btn:hover { opacity:0.85; }
        .send-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .empty-history { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:2rem; text-align:center; color:var(--text-muted); font-size:0.875rem; }
        .empty-history span { font-size:2rem; }
        .history-list { display:flex; flex-direction:column; gap:0.75rem; }
        .history-item { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:0.875rem; display:flex; flex-direction:column; gap:0.3rem; }
        .hi-top { display:flex; align-items:center; gap:0.5rem; }
        .hi-type { font-size:0.68rem; font-weight:600; text-transform:capitalize; padding:0.15rem 0.5rem; border-radius:20px; background:rgba(224,82,82,0.1); color:var(--error); border:1px solid rgba(224,82,82,0.2); }
        .hi-type.announcement { background:rgba(201,168,76,0.1); color:var(--gold); border-color:var(--gold-dim); }
        .hi-type.warning { background:rgba(224,82,82,0.1); color:var(--error); border-color:rgba(224,82,82,0.2); }
        .hi-type.update { background:rgba(59,139,212,0.1); color:#3B8BD4; border-color:rgba(59,139,212,0.2); }
        .hi-target { font-size:0.72rem; color:var(--text-dim); }
        .hi-title { font-weight:600; font-size:0.875rem; color:var(--text); }
        .hi-msg { font-size:0.78rem; color:var(--text-muted); line-height:1.4; }
        .hi-time { font-size:0.68rem; color:var(--text-dim); font-family:var(--font-mono); }
        @media(max-width:900px) { .broadcast-grid { grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}
