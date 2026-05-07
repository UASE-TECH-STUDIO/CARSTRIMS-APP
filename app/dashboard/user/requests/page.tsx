"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const STATUS_COLORS: Record<string,string> = {
  pending:"#D97706", responded:"#16A34A", closed:"#888", rejected:"#DC2626"
};

const emptyForm = {
  carBrand:"", carModel:"", carYear:"", carColor:"", budget:"",
  paymentType:"full", description:"", dealerId:"",
};

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dealerSearch, setDealerSearch] = useState("");
  const [dealerResults, setDealerResults] = useState<any[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [searchingDealers, setSearchingDealers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState<any>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const load = () => {
    api.get("/api/v1/users/requests")
      .then((r) => setRequests(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (dealerSearch.length < 2) { setDealerResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingDealers(true);
      try {
        const res = await api.get("/api/v1/public/dealers", { params: { search: dealerSearch, limit: 8 } });
        setDealerResults(res.data.dealers || []);
      } catch { } finally { setSearchingDealers(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [dealerSearch]);

  const selectDealer = (d: any) => {
    setSelectedDealer(d);
    setForm({ ...form, dealerId: d._id });
    setDealerSearch(d.companyName);
    setDealerResults([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/users/requests", {
        ...form,
        carYear: form.carYear ? Number(form.carYear) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        dealerId: form.dealerId || undefined,
      });
      setShowForm(false);
      setForm(emptyForm);
      setSelectedDealer(null);
      setDealerSearch("");
      load();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const acceptRecommendation = async (reqId: string) => {
    setAcceptingId(reqId);
    try {
      await api.post(`/api/v1/users/requests/${reqId}/accept`).catch(() => {});
      load();
    } finally { setAcceptingId(null); }
  };

  const rejectRecommendation = async (reqId: string) => {
    setRejectingId(reqId);
    try {
      await api.post(`/api/v1/users/requests/${reqId}/reject`).catch(() => {});
      load();
    } finally { setRejectingId(null); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "—";

  return (
    <div className="req-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Special Requests</h2>
          <p className="page-sub">{requests.length} request{requests.length!==1?"s":""}</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setError(""); }}>+ New Request</button>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : requests.length === 0 ? (
        <div className="empty">
          <div className="ei">📩</div>
          <h3>No requests yet</h3>
          <p>Can&apos;t find the car you want? Place a request and let dealers find it for you</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Place First Request</button>
        </div>
      ) : (
        <div className="req-list">
          {requests.map((r) => (
            <div key={r._id} className="req-card" onClick={() => setShowDetail(r)}>
              <div className="req-header">
                <div>
                  <div className="req-car">{r.carBrand} {r.carModel} {r.carYear||""}</div>
                  <div className="req-id">{r.requestId}</div>
                  {r.dealerName && <div className="req-dealer">🏢 {r.dealerName}</div>}
                </div>
                <div className="req-right-top">
                  <span className="req-status" style={{color:STATUS_COLORS[r.status]||"#888",background:(STATUS_COLORS[r.status]||"#888")+"15",border:`1px solid ${(STATUS_COLORS[r.status]||"#888")}44`}}>
                    {r.status}
                  </span>
                  <div className="req-date">{fmtDate(r.createdAt)}</div>
                </div>
              </div>
              {r.budget && <div className="req-budget">Budget: ₦{Number(r.budget).toLocaleString()} · {r.paymentType}</div>}
              {r.dealerResponse && (
                <div className="dealer-response">
                  <div className="dr-label">Dealer responded:</div>
                  <div className="dr-text">{r.dealerResponse}</div>
                  {r.status === "responded" && (
                    <div className="dr-actions">
                      <button className="dr-btn accept" onClick={(e)=>{ e.stopPropagation(); acceptRecommendation(r.requestId); }} disabled={acceptingId===r.requestId}>
                        {acceptingId===r.requestId?"...":"✅ Accept"}
                      </button>
                      <button className="dr-btn reject" onClick={(e)=>{ e.stopPropagation(); rejectRecommendation(r.requestId); }} disabled={rejectingId===r.requestId}>
                        {rejectingId===r.requestId?"...":"✕ Reject / Counter"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="view-hint">Click to view details →</div>
            </div>
          ))}
        </div>
      )}

      {/* NEW REQUEST MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">PLACE SPECIAL REQUEST</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={submit} className="modal-form">
              <div className="form-row">
                <div className="field"><label className="fl">Brand *</label><input className="fi" placeholder="Toyota" value={form.carBrand} onChange={(e)=>setForm({...form,carBrand:e.target.value})} required /></div>
                <div className="field"><label className="fl">Model *</label><input className="fi" placeholder="Camry" value={form.carModel} onChange={(e)=>setForm({...form,carModel:e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Year</label><input type="number" className="fi" placeholder="2020" value={form.carYear} onChange={(e)=>setForm({...form,carYear:e.target.value})} /></div>
                <div className="field"><label className="fl">Color</label><input className="fi" placeholder="Black" value={form.carColor} onChange={(e)=>setForm({...form,carColor:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Budget (₦)</label><input type="number" className="fi" value={form.budget} onChange={(e)=>setForm({...form,budget:e.target.value})} /></div>
                <div className="field"><label className="fl">Payment</label>
                  <select className="fi" value={form.paymentType} onChange={(e)=>setForm({...form,paymentType:e.target.value})}>
                    <option value="full">Full Payment</option>
                    <option value="installment">Installment</option>
                  </select>
                </div>
              </div>
              <div className="field"><label className="fl">Description / Requirements</label><textarea className="fi fi-ta" rows={3} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="Specific trim, features, year range..." /></div>

              <div className="field">
                <label className="fl">Specific Dealer (optional — search or leave blank to send to all)</label>
                <div className="dealer-search-wrap">
                  <input className="fi" placeholder="Search dealer by name or city..."
                    value={dealerSearch}
                    onChange={(e) => { setDealerSearch(e.target.value); setSelectedDealer(null); setForm({...form, dealerId:""}); }} />
                  {searchingDealers && <div className="ds-loading">...</div>}
                  {dealerResults.length > 0 && (
                    <div className="dealer-dropdown">
                      {dealerResults.map((d) => (
                        <div key={d._id} className="dealer-option" onClick={() => selectDealer(d)}>
                          <div className="do-logo">{d.logo?<img src={d.logo} alt=""/>:d.companyName?.charAt(0)}</div>
                          <div>
                            <div className="do-name">{d.companyName}</div>
                            <div className="do-loc">{d.city||"—"}, {d.state||"—"} · {d.dealerId}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDealer && (
                  <div className="selected-dealer">
                    ✅ {selectedDealer.companyName} — {selectedDealer.city||"—"}
                    <button type="button" onClick={() => { setSelectedDealer(null); setDealerSearch(""); setForm({...form,dealerId:""}); }} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",marginLeft:"0.5rem"}}>✕</button>
                  </div>
                )}
                {!selectedDealer && <p className="dealer-note">Leave blank to broadcast to all dealers</p>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Sending...":"Submit Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{showDetail.carBrand} {showDetail.carModel} — {showDetail.requestId}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="detail-grid">
                {[
                  ["Brand", showDetail.carBrand], ["Model", showDetail.carModel],
                  ["Year", showDetail.carYear||"Any"], ["Color", showDetail.carColor||"Any"],
                  ["Budget", showDetail.budget ? `₦${Number(showDetail.budget).toLocaleString()}` : "Flexible"],
                  ["Payment", showDetail.paymentType], ["Status", showDetail.status],
                  ["Dealer", showDetail.dealerName||"All dealers"],
                ].map(([k,v]) => (
                  <div key={k as string} className="dg-item">
                    <div className="dg-label">{k}</div>
                    <div className="dg-val">{v}</div>
                  </div>
                ))}
              </div>
              {showDetail.description && (
                <div className="detail-desc">
                  <div className="dd-label">Your requirements:</div>
                  <p className="dd-text">{showDetail.description}</p>
                </div>
              )}
              {showDetail.dealerResponse && (
                <div className="dealer-response" style={{margin:0}}>
                  <div className="dr-label">Dealer&apos;s Response:</div>
                  <div className="dr-text">{showDetail.dealerResponse}</div>
                  {showDetail.status === "responded" && (
                    <div className="dr-actions">
                      <button className="dr-btn accept" onClick={() => { acceptRecommendation(showDetail.requestId); setShowDetail(null); }}>✅ Accept Offer</button>
                      <button className="dr-btn reject" onClick={() => { rejectRecommendation(showDetail.requestId); setShowDetail(null); }}>✕ Decline</button>
                    </div>
                  )}
                </div>
              )}
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .req-page{display:flex;flex-direction:column;gap:1.25rem;padding-bottom:1rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#fff}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem;max-width:300px;line-height:1.5}
        .req-list{display:flex;flex-direction:column;gap:0.875rem}
        .req-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem;cursor:pointer;transition:all 0.2s}
        .req-card:hover{border-color:#F47B20;box-shadow:0 2px 12px rgba(244,123,32,0.1)}
        .req-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .req-car{font-weight:700;font-size:0.95rem;color:#1A1A1A}
        .req-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .req-dealer{font-size:0.75rem;color:#888;margin-top:0.15rem}
        .req-right-top{display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem;flex-shrink:0}
        .req-status{padding:0.2rem 0.65rem;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize}
        .req-date{font-size:0.68rem;color:#AAA;font-family:var(--font-mono)}
        .req-budget{font-size:0.78rem;color:#888}
        .dealer-response{background:#FFF7ED;border:1px solid #F47B20;border-radius:8px;padding:0.875rem}
        .dr-label{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:#F47B20;margin-bottom:0.3rem;font-weight:600}
        .dr-text{font-size:0.825rem;color:#555;line-height:1.4}
        .dr-actions{display:flex;gap:0.5rem;margin-top:0.75rem}
        .dr-btn{border:none;border-radius:5px;padding:0.4rem 0.875rem;font-size:0.78rem;cursor:pointer;font-family:var(--font-body);font-weight:500;transition:opacity 0.2s}
        .dr-btn:disabled{opacity:0.6;cursor:not-allowed}
        .dr-btn.accept{background:#F0FDF4;color:#16A34A;border:1px solid rgba(22,163,74,0.3)}
        .dr-btn.reject{background:#FEF2F2;color:#DC2626;border:1px solid rgba(220,38,38,0.3)}
        .view-hint{font-size:0.7rem;color:#AAA;text-align:right}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.08em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:75px}
        .dealer-search-wrap{position:relative}
        .ds-loading{position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);font-size:0.75rem;color:#AAA}
        .dealer-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid #DDD;border-radius:8px;z-index:50;max-height:200px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.15)}
        .dealer-option{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;cursor:pointer;transition:background 0.15s;border-bottom:1px solid #F0F0F0}
        .dealer-option:last-child{border-bottom:none}
        .dealer-option:hover{background:#FFF7ED}
        .do-logo{width:28px;height:28px;border-radius:5px;background:#F47B20;color:#fff;font-size:0.85rem;font-weight:700;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .do-logo img{width:100%;height:100%;object-fit:cover}
        .do-name{font-size:0.825rem;font-weight:500;color:#1A1A1A}
        .do-loc{font-size:0.72rem;color:#888}
        .selected-dealer{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A;padding:0.5rem 0.75rem;border-radius:6px;font-size:0.8rem;display:flex;align-items:center}
        .dealer-note{font-size:0.7rem;color:#AAA;font-style:italic}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .dg-item{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.6rem}
        .dg-label{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.2rem}
        .dg-val{font-size:0.825rem;color:#1A1A1A;text-transform:capitalize}
        .detail-desc{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.875rem}
        .dd-label{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.4rem}
        .dd-text{font-size:0.875rem;color:#555;line-height:1.6}
        @media(max-width:480px){.form-row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
