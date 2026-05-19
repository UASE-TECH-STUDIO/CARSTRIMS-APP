"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const CATEGORIES = [
  "repairs","maintenance","fuel","insurance","registration",
  "cleaning","staff_salary","marketing","utilities","transport","miscellaneous",
];

const CAT_COLORS: Record<string,string> = {
  repairs:"#DC2626", maintenance:"#D97706", fuel:"#F47B20",
  insurance:"#3B8BD4", registration:"#7B68EE", cleaning:"#16A34A",
  staff_salary:"#888", marketing:"#E91E8C", utilities:"#00BCD4",
  transport:"#FF9800", miscellaneous:"#9E9E9E",
};

const emptyForm = { carId:"", category:"repairs", amount:"", description:"", editReason:"" };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [catTotals, setCatTotals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchExpenses = async () => {
    setLoading(true);
  const [carSearch, setCarSearch]     = useState("");
  const [carResults, setCarResults]   = useState<any[]>([]);
  const [showCarDrop, setShowCarDrop] = useState(false);

  // Search cars for expense linking
  const searchCars = async (q: string) => {
    if (q.length < 1) { setCarResults([]); return; }
    try {
      const r = await api.get("/api/v1/cars/", { params: { search: q, limit: 20 } });
      setCarResults(r.data?.cars || []); setShowCarDrop(true);
    } catch { setCarResults([]); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchCars(carSearch), 300);
    return () => clearTimeout(t);
  }, [carSearch]);

  const selectCar = (car: any) => {
    setForm({ ...form, carId: car.carId });
    setCarSearch(`${car.brand} ${car.model} ${car.year} — ${car.carId}`);
    setShowCarDrop(false); setCarResults([]);
  };

    try {
      const params: any = { limit: 100 };
      if (catFilter !== "all") params.category = catFilter;
      const res = await api.get("/api/v1/inventory/expenses", { params });
      const data = res.data.expenses || res.data || [];
      setExpenses(data);
      setTotal(data.reduce((acc: number, e: any) => acc + (e.amount || 0), 0));

      // Build category totals
      const totals: Record<string, number> = {};
      data.forEach((e: any) => {
        totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
      });
      setCatTotals(
        Object.entries(totals)
          .map(([cat, amt]) => ({ category: cat, total: amt }))
          .sort((a, b) => b.total - a.total)
      );
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, [catFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/inventory/expenses", {
        ...form,
        amount: Number(form.amount),
        carId: form.carId || undefined,
      });
      setShowAdd(false); setForm(emptyForm); setSuccess("Expense added!"); fetchExpenses();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.patch(`/api/v1/inventory/expenses/${showEdit.expenseId || showEdit._id}`, {
        amount: Number(editForm.amount),
        category: editForm.category,
        description: editForm.description,
        editReason: editForm.editReason,
      });
      setShowEdit(null); setSuccess("Expense updated!"); fetchExpenses();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (expense: any) => {
    if (!confirm(`Delete ₦${expense.amount?.toLocaleString()} ${expense.category} expense?`)) return;
    try {
      await api.delete(`/api/v1/inventory/expenses/${expense.expenseId || expense._id}`);
      setSuccess("Expense deleted"); fetchExpenses();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
  };

  const exportCSV = () => {
    const filtered = catFilter === "all" ? expenses : expenses.filter((e) => e.category === catFilter);
    const rows = [
      ["Expense ID","Car ID","Category","Amount","Description","Date","Edited"],
      ...filtered.map((e) => [
        e.expenseId||e._id, e.carId||"—", e.category,
        e.amount, e.description||"",
        e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-NG") : "",
        e.editHistory?.length > 0 ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `expenses-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const filtered = catFilter === "all" ? expenses : expenses.filter((e) => e.category === catFilter);
    const html = `
      <html><head><title>Expenses Report</title>
      <style>body{font-family:sans-serif;padding:2rem;color:#1A1A1A}
      h1{font-size:1.5rem;margin-bottom:0.5rem}
      .meta{color:#888;font-size:0.875rem;margin-bottom:1.5rem}
      table{width:100%;border-collapse:collapse}
      th{background:#F47B20;color:#fff;padding:0.6rem 0.875rem;text-align:left;font-size:0.8rem}
      td{padding:0.6rem 0.875rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem}
      tr:nth-child(even) td{background:#FFF7ED}
      .total{font-weight:700;color:#F47B20}
      </style></head>
      <body>
        <h1>Expense Report — CARSTRIMS</h1>
        <div class="meta">Category: ${catFilter === "all" ? "All" : catFilter} · Total: ₦${total.toLocaleString()} · ${filtered.length} records</div>
        <table>
          <thead><tr><th>Car ID</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead>
          <tbody>
            ${filtered.map((e) => `
              <tr>
                <td>${e.carId||"—"}</td>
                <td>${e.category}</td>
                <td>₦${(e.amount||0).toLocaleString()}</td>
                <td>${e.description||""}</td>
                <td>${e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-NG") : "—"}</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot><tr><td colspan="2"><strong>TOTAL</strong></td><td class="total">₦${total.toLocaleString()}</td><td colspan="2"></td></tr></tfoot>
        </table>
        <div style="margin-top:2rem;font-size:0.75rem;color:#888">Generated by CARSTRIMS · UASE TECH STUDIO · ${new Date().toLocaleString("en-NG")}</div>
      </body></html>
    `;
    const win = window.open("","_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "—";
  const maxCat = catTotals.length > 0 ? catTotals[0].total : 1;

  return (
    <div className="exp-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Expenses</h2>
          <p className="page-sub">{expenses.length} record{expenses.length!==1?"s":""} · Total: <strong>{fmt(total)}</strong></p>
        </div>
        <div className="hbtns">
          <button className="btn-outline" onClick={exportCSV}>CSV</button>
          <button className="btn-outline" onClick={exportPDF}>PDF</button>
          <button className="btn-primary" onClick={() => { setShowAdd(true); setError(""); }}>+ Add Expense</button>
        </div>
      </div>

      {success && <div className="success-banner">✅ {success}<button onClick={() => setSuccess("")} className="dismiss">✕</button></div>}

      {/* Category Breakdown Bars */}
      {catTotals.length > 0 && (
        <div className="breakdown-card">
          <div className="bc-title">EXPENSE BREAKDOWN BY CATEGORY</div>
          <div className="bc-bars">
            {catTotals.map((c) => (
              <div key={c.category} className="bc-row">
                <div className="bc-label">{c.category.replace(/_/g," ")}</div>
                <div className="bc-bar-wrap">
                  <div className="bc-bar" style={{
                    width: `${(c.total/maxCat)*100}%`,
                    background: CAT_COLORS[c.category] || "#888",
                  }} />
                </div>
                <div className="bc-val">{fmt(c.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="cat-tabs">
        <button className={`ctab ${catFilter==="all"?"active":""}`} onClick={() => setCatFilter("all")}>All</button>
        {catTotals.map((c) => (
          <button key={c.category} className={`ctab ${catFilter===c.category?"active":""}`}
            onClick={() => setCatFilter(catFilter===c.category?"all":c.category)}>
            {c.category.replace(/_/g," ")}
          </button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : expenses.length === 0 ? (
        <div className="empty"><div className="ei">📋</div><h3>No expenses yet</h3><p>Track expenses per car or general dealership expenses</p></div>
      ) : (
        <div className="exp-table-wrap">
          <table className="exp-table">
            <thead>
              <tr><th>ID</th><th>Car</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {expenses
                .filter((e) => catFilter === "all" || e.category === catFilter)
                .map((e) => (
                  <tr key={e._id}>
                    <td className="mono">{(e.expenseId||e._id)?.slice(-8)}</td>
                    <td>{e.carId || <span className="na">General</span>}</td>
                    <td>
                      <span className="cat-badge" style={{
                        background: (CAT_COLORS[e.category]||"#888")+"18",
                        color: CAT_COLORS[e.category]||"#888",
                        border: `1px solid ${(CAT_COLORS[e.category]||"#888")}44`,
                      }}>
                        {e.category?.replace(/_/g," ")}
                      </span>
                    </td>
                    <td className="amount-cell">{fmt(e.amount)}</td>
                    <td className="desc-cell">{e.description||"—"}</td>
                    <td className="date-cell">{fmtDate(e.createdAt)}</td>
                    <td>
                      <div className="row-acts">
                        <button className="act-sm" onClick={() => {
                          setShowEdit(e);
                          setEditForm({ carId:e.carId||"", category:e.category, amount:String(e.amount), description:e.description||"", editReason:"" });
                          setError("");
                        }}>Edit</button>
                        <button className="act-sm danger" onClick={() => handleDelete(e)}>Delete</button>
                        {e.editHistory?.length > 0 && (
                          <span className="edited-tag">edited</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">ADD EXPENSE</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleAdd} className="modal-form">
              <div className="field">
                <label className="fl">Category *</label>
                <select className="fi" value={form.category} onChange={(e) => setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="fl">Amount (₦) *</label>
                <input type="number" className="fi" placeholder="0" value={form.amount}
                  onChange={(e) => setForm({...form,amount:e.target.value})} required />
              </div>
              <div className="field">
                <label className="fl">Car ID (optional — link to specific car)</label>
                <input className="fi" placeholder="CAR-XXXXXXXX or leave blank for general" value={form.carId}
                  onChange={(e) => setForm({...form,carId:e.target.value})} />
              </div>
              <div className="field">
                <label className="fl">Description</label>
                <textarea className="fi fi-ta" rows={2} value={form.description}
                  onChange={(e) => setForm({...form,description:e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Adding...":"Add Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">EDIT EXPENSE</h3>
              <button className="modal-close" onClick={() => setShowEdit(null)}>✕</button>
            </div>
            {showEdit.editHistory?.length > 0 && (
              <div className="edit-history-note">
                Previously edited {showEdit.editHistory.length}× — last reason: {showEdit.editHistory[showEdit.editHistory.length-1]?.reason || "—"}
              </div>
            )}
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleEdit} className="modal-form">
              <div className="field">
                <label className="fl">Category</label>
                <select className="fi" value={editForm.category} onChange={(e) => setEditForm({...editForm,category:e.target.value})}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="fl">Amount (₦)</label>
                <input type="number" className="fi" value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm,amount:e.target.value})} />
              </div>
              <div className="field">
                <label className="fl">Description</label>
                <textarea className="fi fi-ta" rows={2} value={editForm.description}
                  onChange={(e) => setEditForm({...editForm,description:e.target.value})} />
              </div>
              <div className="field">
                <label className="fl">Reason for Edit *</label>
                <input className="fi" placeholder="Why are you editing?" value={editForm.editReason}
                  onChange={(e) => setEditForm({...editForm,editReason:e.target.value})} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowEdit(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Saving...":"Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .exp-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .hbtns{display:flex;gap:0.4rem;flex-wrap:wrap}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:background 0.2s}
        .btn-primary:hover{background:#FF9340}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .btn-outline:hover{border-color:#F47B20;color:#F47B20}
        .success-banner{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .dismiss{background:none;border:none;color:inherit;cursor:pointer}
        .breakdown-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem}
        .bc-title{font-size:0.7rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin-bottom:1rem}
        .bc-bars{display:flex;flex-direction:column;gap:0.6rem}
        .bc-row{display:flex;align-items:center;gap:0.875rem}
        .bc-label{font-size:0.78rem;color:#555;text-transform:capitalize;min-width:110px}
        .bc-bar-wrap{flex:1;background:#F0F0F0;height:8px;border-radius:4px;overflow:hidden}
        .bc-bar{height:100%;border-radius:4px;transition:width 0.5s ease}
        .bc-val{font-size:0.78rem;color:#888;min-width:90px;text-align:right}
        .cat-tabs{display:flex;gap:0.3rem;flex-wrap:wrap}
        .ctab{background:transparent;border:1.5px solid #DDD;border-radius:20px;padding:0.3rem 0.875rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);color:#888;transition:all 0.2s;text-transform:capitalize;white-space:nowrap}
        .ctab:hover{border-color:#F47B20;color:#F47B20}
        .ctab.active{background:#F47B20;color:#fff;border-color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .exp-table-wrap{overflow-x:auto;border:1.5px solid #E5E5E5;border-radius:10px;background:#fff}
        .exp-table{width:100%;border-collapse:collapse;min-width:700px}
        .exp-table th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888;background:#FAFAFA;border-bottom:1.5px solid #E5E5E5}
        .exp-table td{padding:0.875rem 1rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem;color:#1A1A1A;vertical-align:middle}
        .exp-table tr:last-child td{border-bottom:none}
        .exp-table tr:hover td{background:#FFFAF5}
        .mono{font-family:var(--font-mono);font-size:0.72rem;color:#AAA}
        .na{color:#CCC;font-style:italic}
        .cat-badge{padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:500;text-transform:capitalize;display:inline-block}
        .amount-cell{font-weight:600;color:#1A1A1A}
        .desc-cell{color:#888;font-size:0.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .date-cell{color:#AAA;font-size:0.75rem;white-space:nowrap}
        .row-acts{display:flex;align-items:center;gap:0.3rem}
        .act-sm{background:#F5F5F5;border:1px solid #DDD;border-radius:4px;padding:0.25rem 0.6rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s;white-space:nowrap}
        .act-sm:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .act-sm.danger:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .edited-tag{font-size:0.62rem;background:#FFF7ED;color:#F47B20;border:1px solid #F47B20;padding:0.1rem 0.4rem;border-radius:3px}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .edit-history-note{padding:0.5rem 1.5rem;background:#FFF7ED;font-size:0.75rem;color:#C4621A;border-bottom:1px solid #F47B20}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:70px}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        @media(max-width:640px){.bc-label{min-width:80px}.bc-val{min-width:70px}}
      `}</style>
    </div>
  );
}

