"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const STATUS_COLORS: Record<string,string> = {
  available:"#1D9E75", sold:"#888", reserved:"#D97706",
  out_for_inspection:"#3B8BD4", in_repair:"#DC2626",
};

export default function StaffInventoryPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState({
    brand:"", model:"", year:new Date().getFullYear(), color:"",
    condition:"foreign_used", transmission:"automatic", fuelType:"petrol",
    mileage:"", sellingPrice:"", purchasePrice:"", description:"", status:"available",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/staff/me")
      .then((r) => setPerms(r.data.permissions || []))
      .catch(() => {});
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const params: any = { skip:0, limit:50 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/api/v1/cars/", { params });
      setCars(res.data.cars || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { if (perms.length > 0 || !loading) fetchCars(); }, [search, statusFilter, perms]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/cars/", {
        ...form,
        year: Number(form.year),
        sellingPrice: Number(form.sellingPrice),
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
      });
      setShowAdd(false); fetchCars();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (carId: string) => {
    const reason = prompt("Reason for deletion?");
    if (!reason) return;
    try {
      await api.delete(`/api/v1/cars/${carId}?reason=${encodeURIComponent(reason)}`);
      fetchCars();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
  };

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;

  const canView = perms.includes("view_inventory");
  const canAdd = perms.includes("add_cars");
  const canEdit = perms.includes("edit_cars");
  const canDelete = perms.includes("delete_cars");

  if (!canView) return (
    <div className="denied">
      <div className="denied-icon">🔒</div>
      <h3>Access Restricted</h3>
      <p>You need the <strong>view_inventory</strong> permission to see this section. Contact your dealer admin.</p>
      <style>{`.denied{display:flex;flex-direction:column;align-items:center;gap:1rem;padding:4rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}.denied-icon{font-size:3rem}.denied h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}.denied p{color:#888;font-size:0.875rem;max-width:360px;line-height:1.6}.denied strong{color:#1D9E75}`}</style>
    </div>
  );

  return (
    <div className="inventory">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Cars & Inventory</h2>
          <p className="page-sub">{total} vehicle{total!==1?"s":""}</p>
        </div>
        {canAdd && (
          <button className="btn-primary" onClick={() => { setShowAdd(true); setError(""); }}>+ Add Car</button>
        )}
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search brand, model, Car ID..." value={search}
          onChange={(e) => { setSearch(e.target.value); }} />
        <div className="status-tabs">
          {["all","available","sold","reserved","out_for_inspection"].map((s) => (
            <button key={s} className={`stab ${statusFilter===s?"active":""}`} onClick={() => setStatusFilter(s)}>
              {s==="all"?"All":s.replace(/_/g," ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : cars.length === 0 ? (
        <div className="empty"><div className="ei">🚗</div><h3>No cars found</h3></div>
      ) : (
        <div className="cars-grid">
          {cars.map((car) => (
            <div key={car._id} className="car-card">
              <div className="car-img-wrap">
                {car.images?.[0]
                  ? <img src={car.images[0]} alt="" />
                  : <div className="car-ph">🚗</div>
                }
                <div className="car-badge" style={{background:STATUS_COLORS[car.status]||"#888"}}>
                  {car.status.replace(/_/g," ")}
                </div>
              </div>
              <div className="car-body">
                <div className="car-id">{car.carId}</div>
                <div className="car-title">{car.brand} {car.model} {car.year}</div>
                <div className="car-meta">{car.color} · {car.transmission}</div>
                <div className="car-price">{fmt(car.sellingPrice)}</div>
              </div>
              <div className="car-actions">
                <button className="ca-btn" onClick={() => setShowDetail(car)}>View</button>
                {canDelete && car.status !== "sold" && (
                  <button className="ca-btn danger" onClick={() => handleDelete(car.carId)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD CAR MODAL */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">ADD NEW CAR</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleAdd} className="modal-form">
              <div className="form-row">
                <div className="field"><label className="fl">Brand *</label><input className="fi" value={form.brand} onChange={(e) => setForm({...form,brand:e.target.value})} required /></div>
                <div className="field"><label className="fl">Model *</label><input className="fi" value={form.model} onChange={(e) => setForm({...form,model:e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Year</label><input type="number" className="fi" value={form.year} onChange={(e) => setForm({...form,year:e.target.value as any})} /></div>
                <div className="field"><label className="fl">Color</label><input className="fi" value={form.color} onChange={(e) => setForm({...form,color:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Selling Price (₦) *</label><input type="number" className="fi" value={form.sellingPrice} onChange={(e) => setForm({...form,sellingPrice:e.target.value})} required /></div>
                <div className="field"><label className="fl">Purchase Price (₦)</label><input type="number" className="fi" value={form.purchasePrice} onChange={(e) => setForm({...form,purchasePrice:e.target.value})} /></div>
              </div>
              <div className="field"><label className="fl">Description</label><textarea className="fi fi-ta" rows={2} value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} /></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Adding...":"Add Car"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAR DETAIL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{showDetail.brand} {showDetail.model} · {showDetail.carId}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-form">
              {showDetail.images?.length > 0 && (
                <div className="img-gallery">
                  {showDetail.images.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="gallery-img" />
                  ))}
                </div>
              )}
              <div className="detail-grid">
                {[
                  ["Car ID", showDetail.carId], ["Brand", showDetail.brand],
                  ["Model", showDetail.model], ["Year", showDetail.year],
                  ["Color", showDetail.color], ["Status", showDetail.status?.replace(/_/g," ")],
                  ["Transmission", showDetail.transmission], ["Fuel", showDetail.fuelType],
                  ["Mileage", showDetail.mileage ? `${showDetail.mileage.toLocaleString()} km` : "—"],
                  ["Selling Price", fmt(showDetail.sellingPrice)],
                  ["Location", showDetail.city ? `${showDetail.city}, ${showDetail.state}` : "—"],
                ].map(([k,v]) => (
                  <div key={k as string} className="dg-item">
                    <div className="dg-label">{k}</div>
                    <div className="dg-val">{v}</div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .inventory{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-primary{background:#1D9E75;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:background 0.2s}
        .btn-primary:hover{background:#16A34A}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s}
        .btn-outline:hover{border-color:#1D9E75;color:#1D9E75}
        .filters{display:flex;flex-direction:column;gap:0.75rem}
        .search-input{background:#fff;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;max-width:380px}
        .search-input:focus{border-color:#1D9E75}
        .search-input::placeholder{color:#CCC}
        .status-tabs{display:flex;gap:0.3rem;flex-wrap:wrap}
        .stab{background:transparent;border:1.5px solid #DDD;border-radius:20px;padding:0.3rem 0.875rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);color:#888;transition:all 0.2s;text-transform:capitalize}
        .stab:hover{border-color:#1D9E75;color:#1D9E75}
        .stab.active{background:#1D9E75;color:#fff;border-color:#1D9E75}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .cars-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
        .car-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.2s}
        .car-card:hover{border-color:#1D9E75;box-shadow:0 4px 16px rgba(29,158,117,0.1)}
        .car-img-wrap{height:150px;background:#F5F5F5;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
        .car-img-wrap img{width:100%;height:100%;object-fit:cover}
        .car-ph{font-size:2.5rem;opacity:0.2}
        .car-badge{position:absolute;top:0.5rem;left:0.5rem;padding:0.18rem 0.55rem;border-radius:20px;font-size:0.6rem;font-weight:600;text-transform:capitalize;color:#fff}
        .car-body{padding:0.875rem;display:flex;flex-direction:column;gap:0.25rem;flex:1}
        .car-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .car-title{font-weight:700;font-size:0.9rem;color:#1A1A1A}
        .car-meta{font-size:0.7rem;color:#888;text-transform:capitalize}
        .car-price{font-family:var(--font-display);font-size:1.1rem;color:#1D9E75;margin-top:0.25rem}
        .car-actions{display:flex;gap:0.35rem;padding:0.75rem;border-top:1px solid #F0F0F0}
        .ca-btn{flex:1;background:#F5F5F5;border:1px solid #DDD;border-radius:5px;padding:0.35rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s;text-align:center}
        .ca-btn:hover{border-color:#1D9E75;color:#1D9E75;background:#F0FDF4}
        .ca-btn.danger:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
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
        .img-gallery{display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem}
        .gallery-img{height:130px;min-width:190px;border-radius:6px;object-fit:cover;flex-shrink:0}
        .detail-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.5rem}
        .dg-item{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.6rem}
        .dg-label{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.2rem}
        .dg-val{font-size:0.825rem;color:#1A1A1A;text-transform:capitalize}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
