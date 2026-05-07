"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const STATUS_COLORS: Record<string,string> = {
  pending:"#D97706", responded:"#16A34A", closed:"#888",
};

export default function DealerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/users/requests/dealer");
      setRequests(res.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responding || !responseText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/users/requests/${responding.requestId}/respond`, {
        response: responseText,
        progressNote: responseText,
      });
      setResponding(null);
      setResponseText("");
      load();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed");
    } finally { setSubmitting(false); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "—";

  return (
    <div className="req-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Customer Requests</h2>
          <p className="page-sub">{requests.length} request{requests.length!==1?"s":""} received</p>
        </div>
        <button className="refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : requests.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📩</div>
          <h3>No requests yet</h3>
          <p>Customer car requests will appear here when buyers submit them</p>
        </div>
      ) : (
        <div className="req-list">
          {requests.map((r) => (
            <div key={r._id} className="req-card">
              <div className="req-header">
                <div>
                  <div className="req-id">{r.requestId}</div>
                  <div className="req-car">{r.carBrand} {r.carModel} {r.carYear || ""} {r.carColor ? `· ${r.carColor}` : ""}</div>
                </div>
                <span className="req-status" style={{color:STATUS_COLORS[r.status]||"#888",borderColor:(STATUS_COLORS[r.status]||"#888")+"44",background:(STATUS_COLORS[r.status]||"#888")+"11"}}>
                  {r.status}
                </span>
              </div>
              <div className="req-details">
                <div className="req-row">
                  <span className="req-label">From</span>
                  <span className="req-val">{r.userName || "Unknown"} · {r.userPhone || "—"}</span>
                </div>
                {r.budget && <div className="req-row"><span className="req-label">Budget</span><span className="req-val">₦{Number(r.budget).toLocaleString()}</span></div>}
                {r.paymentType && <div className="req-row"><span className="req-label">Payment</span><span className="req-val">{r.paymentType}</span></div>}
                {r.description && <div className="req-row"><span className="req-label">Note</span><span className="req-val">{r.description}</span></div>}
                <div className="req-row"><span className="req-label">Date</span><span className="req-val">{fmtDate(r.createdAt)}</span></div>
              </div>
              {r.dealerResponse && (
                <div className="my-response">
                  <div className="mr-label">Your response:</div>
                  <div className="mr-text">{r.dealerResponse}</div>
                </div>
              )}
              {r.status === "pending" && (
                <button className="respond-btn" onClick={() => { setResponding(r); setResponseText(""); }}>
                  Reply to Customer
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {responding && (
        <div className="modal-overlay" onClick={() => setResponding(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">RESPOND TO REQUEST</h3>
              <button className="modal-close" onClick={() => setResponding(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="req-info">
                <strong>{responding.carBrand} {responding.carModel}</strong> — from {responding.userName}
              </div>
              <form onSubmit={handleRespond}>
                <div className="field">
                  <label className="fl">Your Response *</label>
                  <textarea className="fi fi-ta" rows={4}
                    placeholder="Tell the customer what you can offer, pricing, availability..."
                    value={responseText} onChange={(e) => setResponseText(e.target.value)} required />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setResponding(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Sending..." : "Send Response"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .req-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .refresh-btn{background:#fff;border:1.5px solid #E5E5E5;color:#666;border-radius:6px;padding:0.6rem 1rem;font-size:0.825rem;cursor:pointer;transition:all 0.2s;font-family:var(--font-body)}
        .refresh-btn:hover{border-color:#F47B20;color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .empty-icon{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem;max-width:320px}
        .req-list{display:flex;flex-direction:column;gap:1rem}
        .req-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:0.875rem;transition:border-color 0.2s}
        .req-card:hover{border-color:#F47B20}
        .req-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .req-id{font-family:var(--font-mono);font-size:0.7rem;color:#AAA;margin-bottom:0.2rem}
        .req-car{font-weight:700;font-size:0.95rem;color:#1A1A1A}
        .req-status{padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize;border:1px solid}
        .req-details{display:flex;flex-direction:column;gap:0.35rem}
        .req-row{display:flex;gap:0.75rem}
        .req-label{font-size:0.72rem;color:#AAA;text-transform:uppercase;letter-spacing:0.06em;min-width:70px;padding-top:1px}
        .req-val{font-size:0.825rem;color:#555}
        .my-response{background:#FFF7ED;border:1px solid #F47B20;border-radius:6px;padding:0.75rem}
        .mr-label{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:#F47B20;margin-bottom:0.25rem}
        .mr-text{font-size:0.825rem;color:#555}
        .respond-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.06em;cursor:pointer;transition:background 0.2s;align-self:flex-start}
        .respond-btn:hover{background:#FF9340}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .modal-body{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .req-info{background:#F5F5F5;padding:0.75rem;border-radius:6px;font-size:0.875rem;color:#666}
        .req-info strong{color:#1A1A1A}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.75rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:100px}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.75rem;border-top:1px solid #E5E5E5;margin-top:0.5rem}
        .btn-cancel{background:transparent;color:#888;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-size:0.875rem;cursor:pointer;font-family:var(--font-body)}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.5rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.06em;cursor:pointer}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
      `}</style>
    </div>
  );
}
