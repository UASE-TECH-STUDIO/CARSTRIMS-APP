"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ApprovalsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/admin/dealers", {
        params: { status: "awaiting_approval", limit: 50 }
      });
      setPending(res.data.dealers);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id + "_approve");
    try {
      await api.post(`/api/v1/admin/dealers/${id}/approve`);
      fetchPending();
    } catch { } finally { setProcessing(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    setProcessing(id + "_reject");
    try {
      await api.post(`/api/v1/admin/dealers/${id}/reject`, { reason: reason || "" });
      fetchPending();
    } catch { } finally { setProcessing(null); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleString("en-NG") : "—";

  return (
    <div className="approvals-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Approval Queue</h2>
          <p className="page-sub">{pending.length} dealer{pending.length !== 1 ? "s" : ""} awaiting review</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : pending.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>All clear!</h3>
          <p>No dealers waiting for approval</p>
        </div>
      ) : (
        <div className="approval-list">
          {pending.map((d) => (
            <div key={d._id} className="approval-card">
              <div className="approval-left">
                {d.logo
                  ? <img src={d.logo} alt="Logo" className="approval-logo" />
                  : <div className="approval-logo-placeholder">{d.companyName?.charAt(0)}</div>
                }
                <div className="approval-info">
                  <div className="approval-company">{d.companyName}</div>
                  <div className="approval-owner">{d.ownerName}</div>
                  <div className="approval-meta">
                    <span>📧 {d.email}</span>
                    <span>📞 {d.phone}</span>
                  </div>
                  <div className="approval-meta">
                    <span>📍 {d.city || "—"}, {d.state || "—"}</span>
                    <span>🕐 {fmtDate(d.createdAt)}</span>
                  </div>
                  <div className="approval-id">{d.dealerId}</div>
                </div>
              </div>
              <div className="approval-right">
                <div className="approval-contacts">
                  <a href={`mailto:${d.email}`} className="contact-pill">✉️ Email</a>
                  <a href={`tel:${d.phone}`} className="contact-pill">📞 Call</a>
                  {d.whatsapp && (
                    <a href={`https://wa.me/${d.whatsapp}`} target="_blank" rel="noreferrer" className="contact-pill">💬 WhatsApp</a>
                  )}
                </div>
                <div className="approval-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(d._id)}
                    disabled={!!processing}>
                    {processing === d._id + "_approve" ? "Approving..." : "✅ Approve"}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(d._id)}
                    disabled={!!processing}>
                    {processing === d._id + "_reject" ? "Rejecting..." : "❌ Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .approvals-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--error);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:4rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:3rem}
        .empty-state h3{font-family:var(--font-display);font-size:1.3rem;color:var(--text)}
        .empty-state p{color:var(--text-muted);font-size:0.875rem}
        .approval-list{display:flex;flex-direction:column;gap:1rem}
        .approval-card{background:var(--surface);border:1px solid var(--gold-dim);border-radius:12px;padding:1.5rem;display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
        .approval-left{display:flex;align-items:flex-start;gap:1rem;flex:1}
        .approval-logo{width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid var(--border);flex-shrink:0}
        .approval-logo-placeholder{width:56px;height:56px;border-radius:8px;background:var(--gold-dim);color:var(--black);font-family:var(--font-display);font-size:1.5rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .approval-info{display:flex;flex-direction:column;gap:0.3rem}
        .approval-company{font-weight:700;font-size:1rem;color:var(--text)}
        .approval-owner{font-size:0.875rem;color:var(--text-muted)}
        .approval-meta{display:flex;gap:1rem;flex-wrap:wrap}
        .approval-meta span{font-size:0.78rem;color:var(--text-dim)}
        .approval-id{font-family:var(--font-mono);font-size:0.72rem;color:var(--text-dim);margin-top:0.2rem}
        .approval-right{display:flex;flex-direction:column;gap:0.75rem;align-items:flex-end;flex-shrink:0}
        .approval-contacts{display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:flex-end}
        .contact-pill{background:var(--surface-2);border:1px solid var(--border);border-radius:20px;padding:0.3rem 0.75rem;font-size:0.75rem;color:var(--text-muted);text-decoration:none;transition:all 0.2s;white-space:nowrap}
        .contact-pill:hover{border-color:var(--gold-dim);color:var(--text)}
        .approval-actions{display:flex;gap:0.5rem}
        .btn-approve{background:rgba(76,175,130,0.1);border:1px solid rgba(76,175,130,0.4);color:var(--success);border-radius:6px;padding:0.6rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.05em;cursor:pointer;transition:all 0.2s}
        .btn-approve:hover{background:rgba(76,175,130,0.2)}
        .btn-approve:disabled{opacity:0.5;cursor:not-allowed}
        .btn-reject{background:rgba(224,82,82,0.08);border:1px solid rgba(224,82,82,0.3);color:var(--error);border-radius:6px;padding:0.6rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.05em;cursor:pointer;transition:all 0.2s}
        .btn-reject:hover{background:rgba(224,82,82,0.15)}
        .btn-reject:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>
    </div>
  );
}
