"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function StaffSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ carBrand:"", carModel:"", carYear:"", sellingPrice:"", purchasePrice:"", buyerName:"", buyerPhone:"", paymentMethod:"cash", notes:"" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => setPerms(r.data.permissions||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (perms.includes("view_sales") || perms.includes("record_sales")) {
      setLoading(true);
      api.get("/api/v1/inventory/sales", { params:{ skip:0, limit:50 } })
        .then((r) => { setSales(r.data.sales||[]); setTotal(r.data.total||0); })
        .catch(()=>{})
        .finally(()=>setLoading(false));
    } else { setLoading(false); }
  }, [perms]);

  const handleManualSale = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/inventory/sales/manual", {
        ...form,
        carYear: form.carYear ? Number(form.carYear) : undefined,
        sellingPrice: Number(form.sellingPrice),
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : 0,
      });
      setShowManual(false); setForm({ carBrand:"", carModel:"", carYear:"", sellingPrice:"", purchasePrice:"", buyerName:"", buyerPhone:"", paymentMethod:"cash", notes:"" });
      api.get("/api/v1/inventory/sales", { params:{ skip:0, limit:50 } }).then((r)=>{ setSales(r.data.sales||[]); setTotal(r.data.total||0); });
    } catch (err: any) { setError(err.response?.data?.detail||"Failed"); }
    finally { setSubmitting(false); }
  };

  const canView = perms.includes("view_sales");
  const canRecord = perms.includes("record_sales");
  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "—";

  if (!canView && !canRecord) return (
    <div className="denied">
      <div className="di">🔒</div>
      <h3>Access Restricted</h3>
      <p>You need <strong>view_sales</strong> or <strong>record_sales</strong> permission.</p>
      <style>{`.denied{display:flex;flex-direction:column;align-items:center;gap:1rem;padding:4rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}.di{font-size:3rem}.denied h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}.denied p{color:#888;font-size:0.875rem;max-width:320px;line-height:1.6}.denied strong{color:#1D9E75}`}</style>
    </div>
  );

  return (
    <div className="sales-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Sales Log</h2>
          <p className="page-sub">{total} transaction{total!==1?"s":""}</p>
        </div>
        {canRecord && <button className="btn-primary" onClick={()=>{ setShowManual(true); setError(""); }}>+ Record Sale</button>}
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : !canView && canRecord ? (
        <div className="record-only-note">You can record sales. View permission needed to see all records.</div>
      ) : sales.length === 0 ? (
        <div className="empty"><div className="ei">💰</div><h3>No sales yet</h3></div>
      ) : (
        <div className="table-wrap">
          <table className="t">
            <thead><tr><th>TXN ID</th><th>Car</th><th>Price</th><th>Buyer</th><th>Payment</th><th>Date</th></tr></thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id}>
                  <td className="mono">{s.transactionId}</td>
                  <td>{s.carBrand} {s.carModel} {s.carYear||""}</td>
                  <td className="price">{fmt(s.sellingPrice)}</td>
                  <td>{s.buyerName||"—"}</td>
                  <td className="pay">{s.paymentMethod?.replace("_"," ")}</td>
                  <td className="date">{fmtDate(s.soldAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showManual && (
        <div className="modal-overlay" onClick={()=>setShowManual(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">RECORD MANUAL SALE</h3><button className="modal-close" onClick={()=>setShowManual(false)}>✕</button></div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleManualSale} className="modal-form">
              <div className="form-row">
                <div className="field"><label className="fl">Brand *</label><input className="fi" value={form.carBrand} onChange={(e)=>setForm({...form,carBrand:e.target.value})} required/></div>
                <div className="field"><label className="fl">Model *</label><input className="fi" value={form.carModel} onChange={(e)=>setForm({...form,carModel:e.target.value})} required/></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Selling Price (₦) *</label><input type="number" className="fi" value={form.sellingPrice} onChange={(e)=>setForm({...form,sellingPrice:e.target.value})} required/></div>
                <div className="field"><label className="fl">Purchase Price (₦)</label><input type="number" className="fi" value={form.purchasePrice} onChange={(e)=>setForm({...form,purchasePrice:e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Buyer Name</label><input className="fi" value={form.buyerName} onChange={(e)=>setForm({...form,buyerName:e.target.value})}/></div>
                <div className="field"><label className="fl">Buyer Phone</label><input className="fi" value={form.buyerPhone} onChange={(e)=>setForm({...form,buyerPhone:e.target.value})}/></div>
              </div>
              <div className="field"><label className="fl">Payment Method</label>
                <select className="fi" value={form.paymentMethod} onChange={(e)=>setForm({...form,paymentMethod:e.target.value})}>
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option><option value="installment">Installment</option>
                </select>
              </div>
              <div className="field"><label className="fl">Notes</label><textarea className="fi fi-ta" rows={2} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={()=>setShowManual(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Recording...":"Record Sale"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .sales-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-primary{background:#1D9E75;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .record-only-note{background:#F0FDF4;border:1px solid #1D9E75;color:#166534;padding:1rem;border-radius:8px;font-size:0.875rem}
        .table-wrap{overflow-x:auto;border:1.5px solid #E5E5E5;border-radius:10px;background:#fff}
        .t{width:100%;border-collapse:collapse;min-width:600px}
        .t th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888;background:#FAFAFA;border-bottom:1.5px solid #E5E5E5}
        .t td{padding:0.875rem 1rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem;color:#1A1A1A}
        .t tr:last-child td{border-bottom:none}
        .t tr:hover td{background:#F0FDF4}
        .mono{font-family:var(--font-mono);font-size:0.72rem;color:#AAA}
        .price{font-weight:600;color:#1D9E75}
        .pay{text-transform:capitalize;font-size:0.78rem}
        .date{color:#AAA;font-size:0.75rem}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.875rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#1D9E75;background:#fff}
        .fi-ta{resize:vertical;min-height:70px}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
      `}</style>
    </div>
  );
}
