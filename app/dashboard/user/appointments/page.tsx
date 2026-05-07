"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const APT_TYPES = ["showroom_visit","test_drive","inspection","payment_meeting"];
const STATUS_COLORS: Record<string,string> = {
  pending:"#D97706", confirmed:"#16A34A", cancelled:"#DC2626", completed:"#888"
};

export default function UserAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dealerId:"", type:"showroom_visit", scheduledAt:"", notes:"" });
  const [dealerSearch, setDealerSearch] = useState("");
  const [dealerResults, setDealerResults] = useState<any[]>([]);
  const [searchingDealers, setSearchingDealers] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState<any>(null);

  const load = () => {
    api.get("/api/v1/users/appointments")
      .then((r) => setAppointments(r.data || []))
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
    e.preventDefault();
    if (!form.dealerId) { setError("Please select a dealer"); return; }
    setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/users/appointments", form);
      setShowForm(false);
      setForm({ dealerId:"", type:"showroom_visit", scheduledAt:"", notes:"" });
      setSelectedDealer(null); setDealerSearch("");
      load();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString("en-NG", {
    weekday:"short", year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"
  }) : "—";

  return (
    <div className="apts-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Appointments</h2>
          <p className="page-sub">{appointments.length} scheduled</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setError(""); }}>+ Schedule</button>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : appointments.length === 0 ? (
        <div className="empty">
          <div className="ei">📅</div>
          <h3>No appointments yet</h3>
          <p>Schedule a showroom visit, test drive, or meeting with a dealer</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Schedule Now</button>
        </div>
      ) : (
        <div className="apt-list">
          {appointments.map((a) => (
            <div key={a._id} className="apt-card" onClick={() => setShowDetail(a)}>
              <div className="apt-icon">{a.type==="test_drive"?"🚗":a.type==="payment_meeting"?"💳":a.type==="inspection"?"🔍":"🏢"}</div>
              <div className="apt-info">
                <div className="apt-type">{a.type?.replace(/_/g," ")}</div>
                <div className="apt-dealer">🏢 {a.dealerName||"—"}</div>
                <div className="apt-time">📅 {fmt(a.scheduledAt)}</div>
                {a.notes && <div className="apt-notes">{a.notes}</div>}
                <div className="apt-contacts">
                  {a.dealerPhone && <a href={`tel:${a.dealerPhone}`} className="cta" onClick={(e)=>e.stopPropagation()}>📞 Call</a>}
                  {a.dealerWhatsapp && <a href={`https://wa.me/${a.dealerWhatsapp}`} target="_blank" rel="noreferrer" className="cta" onClick={(e)=>e.stopPropagation()}>💬 WhatsApp</a>}
                </div>
              </div>
              <div className="apt-status" style={{color:STATUS_COLORS[a.status]||"#888",borderColor:(STATUS_COLORS[a.status]||"#888")+"44",background:(STATUS_COLORS[a.status]||"#888")+"11"}}>
                {a.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">SCHEDULE APPOINTMENT</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={submit} className="modal-form">
              <div className="field">
                <label className="fl">Select Dealer *</label>
                <div style={{position:"relative"}}>
                  <input className="fi" placeholder="Search dealer by name or city..."
                    value={dealerSearch}
                    onChange={(e) => { setDealerSearch(e.target.value); setSelectedDealer(null); setForm({...form,dealerId:""}); }} />
                  {searchingDealers && <div style={{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"#AAA",fontSize:"0.75rem"}}>...</div>}
                  {dealerResults.length > 0 && (
                    <div className="dealer-dropdown">
                      {dealerResults.map((d) => (
                        <div key={d._id} className="dealer-option" onClick={() => selectDealer(d)}>
                          <div className="do-logo">{d.logo?<img src={d.logo} alt=""/>:d.companyName?.charAt(0)}</div>
                          <div><div className="do-name">{d.companyName}</div><div className="do-loc">{d.city||"—"}, {d.state||"—"}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDealer && (
                  <div className="selected-dealer">✅ {selectedDealer.companyName}
                    <button type="button" onClick={() => { setSelectedDealer(null); setDealerSearch(""); setForm({...form,dealerId:""}); }} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",marginLeft:"0.5rem"}}>✕</button>
                  </div>
                )}
              </div>
              <div className="field"><label className="fl">Type</label>
                <select className="fi" value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}>
                  {APT_TYPES.map((t)=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="field"><label className="fl">Date & Time</label><input type="datetime-local" className="fi" value={form.scheduledAt} onChange={(e)=>setForm({...form,scheduledAt:e.target.value})} /></div>
              <div className="field"><label className="fl">Notes</label><textarea className="fi fi-ta" rows={3} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} placeholder="Any special notes..." /></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting||!form.dealerId}>{submitting?"Scheduling...":"Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">APPOINTMENT DETAILS</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="detail-grid">
                {[
                  ["Type", showDetail.type?.replace(/_/g," ")], ["Status", showDetail.status],
                  ["Dealer", showDetail.dealerName||"—"], ["Date", fmt(showDetail.scheduledAt)],
                ].map(([k,v]) => (
                  <div key={k as string} className="dg-item">
                    <div className="dg-label">{k}</div>
                    <div className="dg-val">{v}</div>
                  </div>
                ))}
              </div>
              {showDetail.notes && <div className="detail-desc"><div className="dd-label">Notes</div><p className="dd-text">{showDetail.notes}</p></div>}
              <div className="dealer-contacts">
                {showDetail.dealerPhone && <a href={`tel:${showDetail.dealerPhone}`} className="contact-btn">📞 {showDetail.dealerPhone}</a>}
                {showDetail.dealerWhatsapp && <a href={`https://wa.me/${showDetail.dealerWhatsapp}`} target="_blank" rel="noreferrer" className="contact-btn">💬 WhatsApp</a>}
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .apts-page{display:flex;flex-direction:column;gap:1.25rem;padding-bottom:1rem}
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
        .empty p{color:#888;font-size:0.875rem;max-width:280px;line-height:1.5}
        .apt-list{display:flex;flex-direction:column;gap:0.75rem}
        .apt-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;align-items:flex-start;gap:1rem;cursor:pointer;transition:all 0.2s}
        .apt-card:hover{border-color:#F47B20;box-shadow:0 2px 12px rgba(244,123,32,0.1)}
        .apt-icon{font-size:1.4rem;flex-shrink:0;margin-top:2px}
        .apt-info{flex:1;display:flex;flex-direction:column;gap:0.25rem}
        .apt-type{font-weight:600;font-size:0.9rem;color:#1A1A1A;text-transform:capitalize}
        .apt-dealer,.apt-time{font-size:0.78rem;color:#888}
        .apt-notes{font-size:0.75rem;color:#AAA;font-style:italic}
        .apt-contacts{display:flex;gap:0.4rem;margin-top:0.25rem}
        .cta{font-size:0.72rem;color:#16A34A;text-decoration:none;padding:0.2rem 0.5rem;border:1px solid rgba(22,163,74,0.3);border-radius:5px;background:rgba(22,163,74,0.06)}
        .apt-status{padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:capitalize;border:1px solid;flex-shrink:0;align-self:flex-start;white-space:nowrap}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.08em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:75px}
        .dealer-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid #DDD;border-radius:8px;z-index:50;max-height:200px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.12)}
        .dealer-option{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;cursor:pointer;transition:background 0.15s;border-bottom:1px solid #F0F0F0}
        .dealer-option:last-child{border-bottom:none}
        .dealer-option:hover{background:#FFF7ED}
        .do-logo{width:28px;height:28px;border-radius:5px;background:#F47B20;color:#fff;font-size:0.85rem;font-weight:700;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .do-logo img{width:100%;height:100%;object-fit:cover}
        .do-name{font-size:0.825rem;font-weight:500;color:#1A1A1A}
        .do-loc{font-size:0.72rem;color:#888}
        .selected-dealer{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A;padding:0.5rem 0.75rem;border-radius:6px;font-size:0.8rem;display:flex;align-items:center}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .dg-item{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.6rem}
        .dg-label{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.2rem}
        .dg-val{font-size:0.825rem;color:#1A1A1A;text-transform:capitalize}
        .detail-desc{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.875rem}
        .dd-label{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.4rem}
        .dd-text{font-size:0.875rem;color:#555;line-height:1.6}
        .dealer-contacts{display:flex;gap:0.5rem;flex-wrap:wrap}
        .contact-btn{display:block;background:#F5F5F5;border:1px solid #E5E5E5;border-radius:6px;padding:0.6rem 0.875rem;font-size:0.825rem;color:#555;text-decoration:none;transition:all 0.2s}
        .contact-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        @media(max-width:480px){.detail-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
