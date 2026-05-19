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

const emptyForm = { carId:"", category:"repairs", amount:"", description:"" };

export default function ExpensesPage() {
  const [expenses, setExpenses]   = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [catTotals, setCatTotals] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd]     = useState(false);
  const [showEdit, setShowEdit]   = useState<any>(null);
  const [form, setForm]           = useState(emptyForm);
  const [editForm, setEditForm]   = useState({ ...emptyForm, editReason:"" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  // Car search
  const [carSearch, setCarSearch]     = useState("");
  const [carResults, setCarResults]   = useState<any[]>([]);
  const [showCarDrop, setShowCarDrop] = useState(false);
  const [editCarSearch, setEditCarSearch] = useState("");

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (catFilter !== "all") params.category = catFilter;
      const res = await api.get("/api/v1/inventory/expenses", { params });
      const data = res.data.expenses || res.data || [];
      setExpenses(data);
      setTotal(data.reduce((acc: number, e: any) => acc + (e.amount || 0), 0));
      const totals: Record<string, number> = {};
      data.forEach((e: any) => { totals[e.category] = (totals[e.category] || 0) + (e.amount || 0); });
      setCatTotals(Object.entries(totals).map(([cat, amt]) => ({ category: cat, total: amt })).sort((a, b) => b.total - a.total));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, [catFilter]);

  // Car search effect
  useEffect(() => {
    if (carSearch.length < 1) { setCarResults([]); setShowCarDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/api/v1/cars/", { params: { search: carSearch, limit: 20 } });
        setCarResults(r.data?.cars || []); setShowCarDrop(true);
      } catch { setCarResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [carSearch]);

  const selectCar = (car: any, isEdit = false) => {
    if (isEdit) {
      setEditForm(f => ({ ...f, carId: car.carId }));
      setEditCarSearch(`${car.brand} ${car.model} ${car.year} — ${car.carId}`);
    } else {
      setForm(f => ({ ...f, carId: car.carId }));
      setCarSearch(`${car.brand} ${car.model} ${car.year} — ${car.carId}`);
    }
    setCarResults([]); setShowCarDrop(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/inventory/expenses", {
        ...form, amount: Number(form.amount),
      });
      setShowAdd(false); setForm(emptyForm); setCarSearch(""); setSuccess("Expense added!"); fetchExpenses();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to add expense"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.patch(`/api/v1/inventory/expenses/${showEdit._id || showEdit.expenseId}`, {
        ...editForm, amount: Number(editForm.amount),
      });
      setShowEdit(null); setSuccess("Expense updated!"); fetchExpenses();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to update"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try { await api.delete(`/api/v1/inventory/expenses/${id}`); setSuccess("Expense deleted"); fetchExpenses(); }
    catch (err: any) { setError(err.response?.data?.detail || "Delete failed"); }
  };

  const exportCSV = () => {
    const rows = [
      ["Date","Car ID","Category","Amount","Description"],
      ...expenses.map(e => [
        e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "",
        e.carId || "", e.category, e.amount, e.description || "",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `expenses-${Date.now()}.csv`; a.click();
  };

  const fmt = (n: number) => `NGN ${(n || 0).toLocaleString()}`;
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "-";

  const CarSearch = ({ value, onChange, onSelect, placeholder }: { value:string; onChange:(v:string)=>void; onSelect:(c:any)=>void; placeholder?:string }) => (
    <div style={{position:"relative"}}>
      <input className="fi" placeholder={placeholder||"Search car by brand, model or ID..."} value={value} onChange={e=>onChange(e.target.value)}/>
      {carResults.length>0&&showCarDrop&&(
        <div style={{position:"absolute",top:"calc(100%+2px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",zIndex:50,maxHeight:"180px",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}>
          <button style={{display:"block",width:"100%",textAlign:"left",padding:"0.45rem 0.875rem",background:"none",border:"none",borderBottom:"1px solid #F5F5F5",color:"#A3A3A3",fontSize:"0.72rem",cursor:"pointer"}} onClick={()=>{onChange("");setCarResults([]);setShowCarDrop(false);}}>Clear — no car linked</button>
          {carResults.map((c:any)=>(
            <button key={c.carId} onClick={()=>onSelect(c)}
              style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.55rem 0.875rem",background:"none",border:"none",borderBottom:"1px solid #F5F5F5",cursor:"pointer",width:"100%",textAlign:"left"}}
              onMouseOver={e=>(e.currentTarget as HTMLElement).style.background="#FFF7ED"}
              onMouseOut={e=>(e.currentTarget as HTMLElement).style.background=""}>
              {c.images?.[0]&&<img src={c.images[0]} alt="" style={{width:"36px",height:"28px",objectFit:"cover",borderRadius:"4px",flexShrink:0}}/>}
              <div>
                <div style={{fontSize:"0.825rem",fontWeight:600,color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                <div style={{fontSize:"0.68rem",color:"#A3A3A3",fontFamily:"monospace"}}>{c.carId}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="exp-page">
      {success&&<div className="exp-success" onClick={()=>setSuccess("")}>{success} ✕</div>}

      <div className="exp-header">
        <div>
          <h2 className="exp-heading">Expenses</h2>
          <p className="exp-sub">Total: <strong>{fmt(total)}</strong></p>
        </div>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <button className="btn-outline" onClick={exportCSV}>Export CSV</button>
          <button className="btn-primary" onClick={()=>{setShowAdd(true);setForm(emptyForm);setCarSearch("");setError("");}}>+ Add Expense</button>
        </div>
      </div>

      {/* Category summary */}
      {catTotals.length>0&&(
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          {catTotals.slice(0,6).map(c=>(
            <div key={c.category} style={{background:"#fff",border:`1.5px solid ${CAT_COLORS[c.category]||"#E5E5E5"}22`,borderRadius:"8px",padding:"0.625rem 0.875rem",display:"flex",flexDirection:"column",gap:"0.2rem"}}>
              <div style={{fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.08em",color:CAT_COLORS[c.category]||"#888"}}>{c.category.replace(/_/g," ")}</div>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:CAT_COLORS[c.category]||"#888"}}>{fmt(c.total)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
        <select className="cat-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {loading?<div className="exp-loading"><div className="spinner"/></div>
      :expenses.length===0?<div className="exp-empty"><div style={{fontSize:"2rem"}}>📋</div><p>No expenses recorded yet</p></div>
      :(
        <div className="exp-table-wrap">
          <table className="exp-table">
            <thead>
              <tr><th>Date</th><th>Car ID</th><th>Category</th><th>Amount</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {expenses.map(e=>(
                <tr key={e._id||e.expenseId}>
                  <td className="td-date">{fmtDate(e.createdAt)}</td>
                  <td><span style={{fontFamily:"monospace",fontSize:"0.72rem",color:"#A3A3A3"}}>{e.carId||"-"}</span></td>
                  <td><span style={{background:(CAT_COLORS[e.category]||"#888")+"18",color:CAT_COLORS[e.category]||"#888",border:`1px solid ${(CAT_COLORS[e.category]||"#888")}44`,padding:"0.18rem 0.55rem",borderRadius:"20px",fontSize:"0.68rem",fontWeight:600,textTransform:"capitalize" as const}}>{e.category?.replace(/_/g," ")}</span></td>
                  <td style={{fontWeight:700,color:"#1A1A1A"}}>{fmt(e.amount)}</td>
                  <td style={{fontSize:"0.825rem",color:"#525252",maxWidth:"200px"}}>{e.description||"-"}</td>
                  <td>
                    <div style={{display:"flex",gap:"0.3rem"}}>
                      <button className="act-btn" onClick={()=>{setShowEdit(e);setEditForm({carId:e.carId||"",category:e.category,amount:String(e.amount),description:e.description||"",editReason:""});setEditCarSearch(e.carId?`${e.carId}`:"");setError("");}}>Edit</button>
                      <button className="act-btn del" onClick={()=>handleDelete(e._id||e.expenseId)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD MODAL */}
      {showAdd&&(
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><h3 className="modal-title">ADD EXPENSE</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>X</button></div>
            {error&&<div className="modal-err">{error}</div>}
            <form onSubmit={handleAdd} className="modal-form">
              <div className="field">
                <label className="fl">Link to Car (optional — search by brand, model or ID)</label>
                <CarSearch value={carSearch} onChange={v=>{setCarSearch(v);if(!v)setForm(f=>({...f,carId:""}));}} onSelect={c=>selectCar(c)} />
                {form.carId&&<div style={{fontSize:"0.7rem",color:"#16A34A",marginTop:"0.2rem",fontWeight:600}}>Linked: {form.carId}</div>}
              </div>
              <div className="field"><label className="fl">Category *</label>
                <select className="fi" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="field"><label className="fl">Amount (NGN) *</label><input type="number" className="fi" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></div>
              <div className="field"><label className="fl">Description</label><textarea className="fi" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What was this expense for?" style={{resize:"vertical" as const}}/></div>
              <div className="modal-ftr">
                <button type="button" className="btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Adding...":"Add Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit&&(
        <div className="modal-overlay" onClick={()=>setShowEdit(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><h3 className="modal-title">EDIT EXPENSE</h3><button className="modal-close" onClick={()=>setShowEdit(null)}>X</button></div>
            {error&&<div className="modal-err">{error}</div>}
            <form onSubmit={handleEdit} className="modal-form">
              <div className="field">
                <label className="fl">Car (change link or leave)</label>
                <CarSearch value={editCarSearch} onChange={v=>{setEditCarSearch(v);if(!v)setEditForm(f=>({...f,carId:""}));}} onSelect={c=>selectCar(c,true)} />
                {editForm.carId&&<div style={{fontSize:"0.7rem",color:"#16A34A",marginTop:"0.2rem",fontWeight:600}}>Linked: {editForm.carId}</div>}
              </div>
              <div className="field"><label className="fl">Category *</label>
                <select className="fi" value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div className="field"><label className="fl">Amount (NGN) *</label><input type="number" className="fi" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:e.target.value})} required/></div>
              <div className="field"><label className="fl">Description</label><textarea className="fi" rows={3} value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} style={{resize:"vertical" as const}}/></div>
              <div className="field"><label className="fl">Reason for Edit *</label><input className="fi" value={editForm.editReason} onChange={e=>setEditForm({...editForm,editReason:e.target.value})} required placeholder="Why are you editing this?"/></div>
              <div className="modal-ftr">
                <button type="button" className="btn-outline" onClick={()=>setShowEdit(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Saving...":"Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .exp-page{display:flex;flex-direction:column;gap:1.25rem;font-family:var(--font-body)}
        .exp-success{background:#F0FDF4;border:1px solid #86EFAC;color:#15803D;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem;cursor:pointer;font-weight:500}
        .exp-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .exp-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .exp-sub{font-size:0.825rem;color:#737373;margin-top:0.3rem}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:background 0.2s}
        .btn-primary:hover{background:#FF9340}.btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-size:0.875rem;cursor:pointer;font-family:var(--font-body);white-space:nowrap;transition:all 0.2s}
        .btn-outline:hover{border-color:#F47B20;color:#F47B20}
        .cat-select{background:#fff;border:1.5px solid #E5E5E5;border-radius:8px;padding:0.625rem 0.875rem;font-size:0.875rem;font-family:var(--font-body);outline:none;cursor:pointer;color:#1A1A1A}
        .exp-loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .exp-empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem 1rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA;color:#737373}
        .exp-table-wrap{overflow-x:auto;border:1.5px solid #E5E5E5;border-radius:10px;background:#fff}
        .exp-table{width:100%;border-collapse:collapse;min-width:600px}
        .exp-table th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888;background:#FAFAFA;border-bottom:1.5px solid #E5E5E5}
        .exp-table td{padding:0.875rem 1rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem;color:#1A1A1A;vertical-align:middle}
        .exp-table tr:last-child td{border-bottom:none}
        .exp-table tr:hover td{background:#FFFAF5}
        .td-date{font-size:0.78rem;color:#888;white-space:nowrap}
        .act-btn{background:#F5F5F5;border:1px solid #DDD;border-radius:4px;padding:0.25rem 0.6rem;font-size:0.72rem;cursor:pointer;color:#666;transition:all 0.2s;white-space:nowrap}
        .act-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .act-btn.del:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal-box{background:#fff;border-radius:12px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-hdr{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .modal-err{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem;position:relative}
        .fl{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%;box-sizing:border-box}
        .fi:focus{border-color:#F47B20;background:#fff}
        .modal-ftr{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5;margin-top:0.5rem}
        @media(max-width:640px){.exp-table{min-width:500px}}
      `}</style>
    </div>
  );
}
