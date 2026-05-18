import Link from "next/link";
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

const STATUSES = ["all","awaiting_approval","approved","suspended","rejected","deleted"];
const STATUS_COLORS: Record<string, string> = {
  approved:"#4CAF82", awaiting_approval:"#C9A84C",
  suspended:"#E05252", rejected:"#888", deleted:"#555",
};

export default function AdminDealersPage() {
  const searchParams = useSearchParams();
  const [dealers, setDealers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [selected, setSelected] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{ type: string; dealer: any } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const LIMIT = 15;

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const params: any = { skip, limit: LIMIT };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/api/v1/admin/dealers", { params });
      setDealers(res.data.dealers);
      setTotal(res.data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchDealers(); }, [search, statusFilter, skip]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const id = actionModal.dealer._id;
      if (actionModal.type === "approve") await api.post(`/api/v1/admin/dealers/${id}/approve`);
      else if (actionModal.type === "reject") await api.post(`/api/v1/admin/dealers/${id}/reject`, { reason: actionNote });
      else if (actionModal.type === "suspend") await api.post(`/api/v1/admin/dealers/${id}/suspend`, { note: actionNote });
      else if (actionModal.type === "warn") await api.post(`/api/v1/admin/dealers/${id}/warn`, { note: actionNote });
      else if (actionModal.type === "delete") await api.delete(`/api/v1/admin/dealers/${id}`);
      else if (actionModal.type === "reset") await api.post(`/api/v1/admin/dealers/${actionModal.dealer.userId}/reset-password`);
      setActionModal(null);
      setActionNote("");
      fetchDealers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed");
    } finally { setActionLoading(false); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "—";

  return (
    <div className="dealers-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Dealer Management</h2>
          <p className="page-sub">{total} dealer{total !== 1 ? "s" : ""} total</p>
        </div>
        <a href="/dashboard/super-admin/create-dealer" className="btn-red">+ Create Dealer</a>
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search name, email, ID..."
          value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
        <div className="status-tabs">
          {STATUSES.map((s) => (
            <button key={s} className={`status-tab ${statusFilter === s ? "active" : ""}`}
              onClick={() => { setStatusFilter(s); setSkip(0); }}>
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : dealers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No dealers found</h3>
        </div>
      ) : (
        <div className="dealers-table-wrap">
          <table className="dealers-table">
            <thead>
              <tr>
                <th>Company</th><th>Owner</th><th>Contact</th>
                <th>Cars</th><th>Sold</th><th>Staff</th>
                <th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dealers.map((d) => (
                <tr key={d._id}>
                  <td>
                    <Link href={`/dashboard/super-admin/dealers/${d._id}`} style={{fontWeight:600,color:"#F47B20",textDecoration:"none",fontSize:"0.875rem"}} onMouseOver={e=>e.currentTarget.style.textDecoration="underline"} onMouseOut={e=>e.currentTarget.style.textDecoration="none"}>{d.companyName}</Link>
                    <div className="co-id">{d.dealerId}</div>
                  </td>
                  <td>
                    <div className="owner-name">{d.ownerName}</div>
                    <div className="owner-email">{d.email}</div>
                  </td>
                  <td>
                    <div className="contact-row">
                      <a href={`tel:${d.phone}`} className="contact-btn" title="Call">📞</a>
                      <a href={`mailto:${d.email}`} className="contact-btn" title="Email">✉️</a>
                      {d.whatsapp && <a href={`https://wa.me/${d.whatsapp}`} target="_blank" rel="noreferrer" className="contact-btn" title="WhatsApp">💬</a>}
                    </div>
                  </td>
                  <td className="num-cell">{d.carCount || 0}</td>
                  <td className="num-cell">{d.soldCount || 0}</td>
                  <td className="num-cell">{d.staffCount || 0}</td>
                  <td>
                    <span className="status-pill" style={{ color: STATUS_COLORS[d.status] || "#888", borderColor: (STATUS_COLORS[d.status] || "#888") + "44", background: (STATUS_COLORS[d.status] || "#888") + "11" }}>
                      {d.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="date-cell">{fmtDate(d.createdAt)}</td>
                  <td>
                    <div className="action-menu">
                      {d.status === "awaiting_approval" && (
                        <button className="act-btn approve" onClick={() => setActionModal({ type:"approve", dealer:d })}>✅ Approve</button>
                      )}
                      {d.status === "awaiting_approval" && (
                        <button className="act-btn reject" onClick={() => { setActionModal({ type:"reject", dealer:d }); setActionNote(""); }}>❌ Reject</button>
                      )}
                      {d.status === "approved" && (
                        <button className="act-btn suspend" onClick={() => { setActionModal({ type:"suspend", dealer:d }); setActionNote(""); }}>⛔ Suspend</button>
                      )}
                      {(d.status === "suspended" || d.status === "rejected") && (
                        <button className="act-btn approve" onClick={() => setActionModal({ type:"approve", dealer:d })}>↩ Reactivate</button>
                      )}
                      <button className="act-btn warn" onClick={() => { setActionModal({ type:"warn", dealer:d }); setActionNote(""); }}>⚠️ Warn</button>
                      <button className="act-btn reset" onClick={() => setActionModal({ type:"reset", dealer:d })}>🔑 Reset PW</button>
                      <button className="act-btn delete" onClick={() => setActionModal({ type:"delete", dealer:d })}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="pg-btn" onClick={() => setSkip(Math.max(0, skip - LIMIT))} disabled={skip === 0}>← Prev</button>
        <span className="pg-info">{Math.floor(skip / LIMIT) + 1} / {Math.max(1, Math.ceil(total / LIMIT))}</span>
        <button className="pg-btn" onClick={() => setSkip(skip + LIMIT)} disabled={skip + LIMIT >= total}>Next →</button>
      </div>

      {/* ACTION MODAL */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {actionModal.type === "approve" ? "✅ Approve Dealer" :
                 actionModal.type === "reject" ? "❌ Reject Dealer" :
                 actionModal.type === "suspend" ? "⛔ Suspend Dealer" :
                 actionModal.type === "warn" ? "⚠️ Send Warning" :
                 actionModal.type === "reset" ? "🔑 Reset Password" :
                 "🗑 Delete Dealer"}
              </h3>
              <button className="modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="action-dealer-info">
                <strong>{actionModal.dealer.companyName}</strong>
                <span>{actionModal.dealer.ownerName} · {actionModal.dealer.email}</span>
              </div>

              {["reject","suspend","warn"].includes(actionModal.type) && (
                <div className="field">
                  <label className="field-label">
                    {actionModal.type === "warn" ? "Warning message" : "Reason"}
                  </label>
                  <textarea className="field-input field-textarea" rows={3}
                    placeholder={actionModal.type === "warn" ? "Write your warning message..." : "Reason for this action..."}
                    value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
                </div>
              )}

              {actionModal.type === "delete" && (
                <div className="danger-confirm">
                  ⚠️ This will permanently mark the account as deleted. This action cannot be undone.
                </div>
              )}

              {actionModal.type === "reset" && (
                <div className="info-confirm">
                  A new password will be generated and shown to you. Share it with the dealer.
                </div>
              )}

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setActionModal(null)}>Cancel</button>
                <button
                  className={`btn-confirm ${actionModal.type === "delete" ? "danger" : actionModal.type === "approve" ? "success" : ""}`}
                  onClick={handleAction} disabled={actionLoading}>
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dealers-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem}
        .btn-red{background:var(--error);color:#fff;border:none;border-radius:6px;padding:0.7rem 1.25rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;text-decoration:none;white-space:nowrap;transition:opacity 0.2s}
        .btn-red:hover{opacity:0.85}
        .filters{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
        .search-input{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:0.65rem 1rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:280px}
        .search-input:focus{border-color:var(--error)}
        .search-input::placeholder{color:var(--text-dim)}
        .status-tabs{display:flex;gap:0.35rem;flex-wrap:wrap}
        .status-tab{background:transparent;border:1px solid var(--border);border-radius:20px;padding:0.35rem 0.875rem;color:var(--text-muted);font-size:0.75rem;cursor:pointer;transition:all 0.2s;text-transform:capitalize;font-family:var(--font-body)}
        .status-tab:hover{border-color:rgba(224,82,82,0.4);color:var(--text)}
        .status-tab.active{background:var(--error);color:#fff;border-color:var(--error)}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--error);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:2.5rem}
        .empty-state h3{font-family:var(--font-display);font-size:1.2rem;color:var(--text)}
        .dealers-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:10px}
        .dealers-table{width:100%;border-collapse:collapse;min-width:900px}
        .dealers-table th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);background:var(--surface-2);border-bottom:1px solid var(--border)}
        .dealers-table td{padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.825rem;color:var(--text);vertical-align:top}
        .dealers-table tr:last-child td{border-bottom:none}
        .dealers-table tr:hover td{background:var(--surface-2)}
        .co-name{font-weight:600;font-size:0.875rem}
        .co-id{font-family:var(--font-mono);font-size:0.68rem;color:var(--text-dim)}
        .owner-name{font-weight:500}
        .owner-email{font-size:0.75rem;color:var(--text-muted)}
        .contact-row{display:flex;gap:0.35rem}
        .contact-btn{font-size:0.9rem;text-decoration:none;padding:3px;border-radius:4px;transition:background 0.2s;cursor:pointer}
        .contact-btn:hover{background:var(--surface-2)}
        .num-cell{text-align:center;font-family:var(--font-mono)}
        .status-pill{padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:500;text-transform:capitalize;border:1px solid;white-space:nowrap}
        .date-cell{color:var(--text-muted);font-size:0.75rem;white-space:nowrap}
        .action-menu{display:flex;flex-direction:column;gap:0.3rem;min-width:100px}
        .act-btn{background:transparent;border:1px solid var(--border);border-radius:4px;padding:0.25rem 0.5rem;font-size:0.72rem;cursor:pointer;transition:all 0.2s;text-align:left;font-family:var(--font-body);color:var(--text-muted);white-space:nowrap}
        .act-btn:hover{color:var(--text);border-color:var(--border-light)}
        .act-btn.approve:hover{border-color:var(--success);color:var(--success)}
        .act-btn.reject:hover,.act-btn.delete:hover{border-color:var(--error);color:var(--error)}
        .act-btn.suspend:hover{border-color:#E05252;color:#E05252}
        .act-btn.warn:hover{border-color:var(--gold);color:var(--gold)}
        .pagination{display:flex;align-items:center;gap:1rem;justify-content:center}
        .pg-btn{background:var(--surface);border:1px solid var(--border);color:var(--text-muted);padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.825rem;font-family:var(--font-body);transition:all 0.2s}
        .pg-btn:hover:not(:disabled){border-color:var(--error);color:var(--text)}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}
        .pg-info{font-size:0.825rem;color:var(--text-muted);font-family:var(--font-mono)}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:var(--surface);border:1px solid var(--border);border-radius:12px;width:100%;max-width:480px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.08em;color:var(--text)}
        .modal-close{background:none;border:none;color:var(--text-muted);font-size:1rem;cursor:pointer}
        .modal-body{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .action-dealer-info{display:flex;flex-direction:column;gap:0.25rem;padding:0.75rem;background:var(--surface-2);border-radius:6px}
        .action-dealer-info strong{font-size:0.9rem;color:var(--text)}
        .action-dealer-info span{font-size:0.78rem;color:var(--text-muted)}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .field-label{font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
        .field-input{background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:0.7rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .field-input:focus{border-color:var(--error)}
        .field-textarea{resize:vertical;min-height:80px}
        .danger-confirm{background:rgba(224,82,82,0.08);border:1px solid rgba(224,82,82,0.3);color:var(--error);padding:0.75rem;border-radius:6px;font-size:0.825rem}
        .info-confirm{background:rgba(201,168,76,0.08);border:1px solid var(--gold-dim);color:var(--gold);padding:0.75rem;border-radius:6px;font-size:0.825rem}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end}
        .btn-cancel{background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:6px;padding:0.65rem 1.25rem;font-size:0.875rem;cursor:pointer;font-family:var(--font-body)}
        .btn-confirm{background:var(--gold);color:var(--black);border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.08em;cursor:pointer;transition:opacity 0.2s}
        .btn-confirm:hover{opacity:0.85}
        .btn-confirm.danger{background:var(--error);color:#fff}
        .btn-confirm.success{background:var(--success);color:#fff}
        .btn-confirm:disabled{opacity:0.6;cursor:not-allowed}
      `}</style>
    </div>
  );
}

