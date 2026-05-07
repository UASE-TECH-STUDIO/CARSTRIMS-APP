"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

const STATUS_COLORS: Record<string,string> = {
  available:"#16A34A", sold:"#888", reserved:"#D97706",
  out_for_inspection:"#3B8BD4", in_repair:"#DC2626",
};

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Other"];
const CONDITIONS = ["brand_new","foreign_used","locally_used"];
const TRANSMISSIONS = ["automatic","manual","semi-automatic"];
const FUELS = ["petrol","diesel","electric","hybrid","gas"];

const emptyForm: any = {
  brand:"",model:"",year:new Date().getFullYear(),color:"",condition:"foreign_used",
  transmission:"automatic",fuelType:"petrol",mileage:"",engineType:"",vin:"",
  sellingPrice:"",purchasePrice:"",promoPrice:"",description:"",
  city:"",state:"",images:[],video:"",status:"available",
};

export default function CarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [showSell, setShowSell] = useState<any>(null);
  const [showDelete, setShowDelete] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [sellForm, setSellForm] = useState({ buyerName:"", buyerPhone:"", paymentMethod:"cash", sellingPrice:"" });
  const [deleteReason, setDeleteReason] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);
  const LIMIT = 20;

  const fetchCars = async () => {
    setLoading(true);
    try {
      const params: any = { skip, limit: LIMIT };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/api/v1/cars/", { params });
      setCars(res.data.cars);
      setTotal(res.data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCars(); }, [statusFilter, search, skip]);

  const uploadImages = async (files: FileList) => {
    setImgUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file);
      try {
        const res = await api.post("/api/v1/upload/car/image", fd, {
          headers: {"Content-Type":"multipart/form-data"},
        });
        uploaded.push(res.data.url);
      } catch { }
    }
    setImgUploading(false);
    return uploaded;
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.post("/api/v1/cars/", {
        ...form,
        year: Number(form.year),
        mileage: form.mileage ? Number(form.mileage) : undefined,
        sellingPrice: Number(form.sellingPrice),
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        promoPrice: form.promoPrice ? Number(form.promoPrice) : undefined,
      });
      setShowAdd(false); setForm(emptyForm); fetchCars();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleEditCar = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await api.patch(`/api/v1/cars/${showEdit.carId}`, {
        ...showEdit,
        year: Number(showEdit.year),
        sellingPrice: Number(showEdit.sellingPrice),
        purchasePrice: showEdit.purchasePrice ? Number(showEdit.purchasePrice) : undefined,
        promoPrice: showEdit.promoPrice ? Number(showEdit.promoPrice) : undefined,
      });
      setShowEdit(null); fetchCars();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleSellCar = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post(`/api/v1/cars/${showSell.carId}/sold`, {
        ...sellForm,
        sellingPrice: Number(sellForm.sellingPrice) || showSell.sellingPrice,
      });
      setShowSell(null); fetchCars();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!showDelete) return; setSubmitting(true);
    try {
      await api.delete(`/api/v1/cars/${showDelete.carId}?reason=${encodeURIComponent(deleteReason)}`);
      setShowDelete(null); setDeleteReason(""); fetchCars();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleImgUpload = async (files: FileList, target: "form"|"edit") => {
    const urls = await uploadImages(files);
    if (target === "form") setForm((f: any) => ({ ...f, images: [...(f.images||[]), ...urls] }));
    else setShowEdit((f: any) => ({ ...f, images: [...(f.images||[]), ...urls] }));
  };

  const removeImg = (idx: number, target: "form"|"edit") => {
    if (target === "form") setForm((f: any) => ({ ...f, images: f.images.filter((_: any, i: number) => i!==idx) }));
    else setShowEdit((f: any) => ({ ...f, images: f.images.filter((_: any, i: number) => i!==idx) }));
  };

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;

  const CarForm = ({ data, setData, onSubmit, title, onClose }: any) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-section">BASIC INFO</div>
          <div className="form-row-3">
            <div className="field"><label className="fl">Brand *</label>
              <select className="fi" value={data.brand} onChange={(e) => setData({...data,brand:e.target.value})} required>
                <option value="">Select brand</option>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="field"><label className="fl">Model *</label><input className="fi" placeholder="Camry" value={data.model} onChange={(e) => setData({...data,model:e.target.value})} required /></div>
            <div className="field"><label className="fl">Year *</label><input type="number" className="fi" value={data.year} onChange={(e) => setData({...data,year:e.target.value})} required /></div>
          </div>
          <div className="form-row-3">
            <div className="field"><label className="fl">Color</label><input className="fi" value={data.color} onChange={(e) => setData({...data,color:e.target.value})} /></div>
            <div className="field"><label className="fl">Condition</label>
              <select className="fi" value={data.condition} onChange={(e) => setData({...data,condition:e.target.value})}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div className="field"><label className="fl">Status</label>
              <select className="fi" value={data.status} onChange={(e) => setData({...data,status:e.target.value})}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="in_repair">In Repair</option>
              </select>
            </div>
          </div>
          <div className="form-section">SPECS</div>
          <div className="form-row-3">
            <div className="field"><label className="fl">Transmission</label>
              <select className="fi" value={data.transmission} onChange={(e) => setData({...data,transmission:e.target.value})}>
                {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field"><label className="fl">Fuel Type</label>
              <select className="fi" value={data.fuelType} onChange={(e) => setData({...data,fuelType:e.target.value})}>
                {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="field"><label className="fl">Mileage (km)</label><input type="number" className="fi" value={data.mileage} onChange={(e) => setData({...data,mileage:e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label className="fl">Engine Type</label><input className="fi" placeholder="2.5L V6" value={data.engineType} onChange={(e) => setData({...data,engineType:e.target.value})} /></div>
            <div className="field"><label className="fl">VIN</label><input className="fi" value={data.vin} onChange={(e) => setData({...data,vin:e.target.value})} /></div>
          </div>
          <div className="form-section">PRICING</div>
          <div className="form-row-3">
            <div className="field"><label className="fl">Selling Price (₦) *</label><input type="number" className="fi" value={data.sellingPrice} onChange={(e) => setData({...data,sellingPrice:e.target.value})} required /></div>
            <div className="field"><label className="fl">Purchase Price (₦)</label><input type="number" className="fi" value={data.purchasePrice} onChange={(e) => setData({...data,purchasePrice:e.target.value})} /></div>
            <div className="field"><label className="fl">Promo Price (₦)</label><input type="number" className="fi" value={data.promoPrice} onChange={(e) => setData({...data,promoPrice:e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label className="fl">City</label><input className="fi" value={data.city} onChange={(e) => setData({...data,city:e.target.value})} /></div>
            <div className="field"><label className="fl">State</label><input className="fi" value={data.state} onChange={(e) => setData({...data,state:e.target.value})} /></div>
          </div>
          <div className="field"><label className="fl">Description</label><textarea className="fi fi-ta" rows={3} value={data.description} onChange={(e) => setData({...data,description:e.target.value})} /></div>
          <div className="form-section">MEDIA</div>
          <div className="media-upload">
            <div className="img-grid">
              {(data.images||[]).map((url: string, i: number) => (
                <div key={i} className="img-thumb">
                  <img src={url} alt="" />
                  <button type="button" className="rm-img" onClick={() => removeImg(i, title.includes("Edit") ? "edit" : "form")}>✕</button>
                </div>
              ))}
              {(data.images||[]).length < 6 && (
                <button type="button" className="add-img-btn" onClick={() => imgRef.current?.click()}>
                  {imgUploading ? "⏳" : "📷"} Add Photo
                </button>
              )}
            </div>
            <input ref={imgRef} type="file" accept="image/*" multiple style={{display:"none"}}
              onChange={(e) => { if(e.target.files) handleImgUpload(e.target.files, title.includes("Edit") ? "edit" : "form"); }} />
            <p className="media-note">Max 6 photos · JPG, PNG, WebP</p>
          </div>
          {data.sellingPrice && data.purchasePrice && (
            <div className="profit-preview">
              Est. profit: <strong>₦{(Number(data.sellingPrice)-Number(data.purchasePrice)).toLocaleString()}</strong>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting||imgUploading}>
              {submitting ? "Saving..." : title.includes("Edit") ? "Save Changes" : "Add Car"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="cars-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Cars & Inventory</h2>
          <p className="page-sub">{total} vehicle{total!==1?"s":""}</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAdd(true); setForm(emptyForm); setError(""); }}>
          + Add Car
        </button>
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search brand, model, Car ID..." value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
        <div className="status-tabs">
          {["all","available","sold","reserved","out_for_inspection","in_repair"].map((s) => (
            <button key={s} className={`stab ${statusFilter===s?"active":""}`}
              onClick={() => { setStatusFilter(s); setSkip(0); }}>
              {s==="all"?"All":s.replace(/_/g," ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : cars.length === 0 ? (
        <div className="empty"><div className="ei">🚗</div><h3>No cars found</h3><p>Add your first car listing</p></div>
      ) : (
        <>
          <div className="cars-grid">
            {cars.map((car) => (
              <div key={car._id} className="car-card">
                {/* Image Slideshow */}
                <div className="car-img-wrap">
                  {car.images?.length > 0
                    ? <img src={car.images[imgIdx % car.images.length]} alt="" />
                    : <div className="car-ph">🚗</div>
                  }
                  {car.images?.length > 1 && (
                    <>
                      <button className="slide-btn prev" onClick={() => setImgIdx(i => Math.max(0,i-1))}>‹</button>
                      <button className="slide-btn next" onClick={() => setImgIdx(i => i+1)}>›</button>
                      <div className="img-dots">
                        {car.images.slice(0,5).map((_: any, i: number) => (
                          <div key={i} className={`dot ${i === imgIdx % car.images.length ? "active" : ""}`} />
                        ))}
                      </div>
                    </>
                  )}
                  <div className="car-badge" style={{background:STATUS_COLORS[car.status]||"#888"}}>
                    {car.status.replace(/_/g," ")}
                  </div>
                  {car.promoPrice && car.promoPrice < car.sellingPrice && (
                    <div className="promo-tag">PROMO</div>
                  )}
                </div>

                <div className="car-body">
                  <div className="car-id">{car.carId}</div>
                  <div className="car-title">{car.brand} {car.model} {car.year}</div>
                  <div className="car-meta">{car.color} · {car.transmission} · {car.fuelType}</div>
                  {car.mileage && <div className="car-mileage">{car.mileage.toLocaleString()} km</div>}
                  <div className="price-row">
                    <span className="car-price">{fmt(car.sellingPrice)}</span>
                    {car.promoPrice && car.promoPrice < car.sellingPrice && (
                      <span className="promo-price">{fmt(car.promoPrice)}</span>
                    )}
                  </div>
                  {car.purchasePrice && (
                    <div className="profit-est">Est. profit: {fmt(car.sellingPrice - car.purchasePrice)}</div>
                  )}
                </div>

                <div className="car-actions">
                  <button className="ca-btn" onClick={() => setShowDetail(car)}>View</button>
                  <button className="ca-btn" onClick={() => { setShowEdit({...car}); setError(""); }}>Edit</button>
                  {car.status === "available" && (
                    <button className="ca-btn sell" onClick={() => {
                      setShowSell(car);
                      setSellForm({ buyerName:"", buyerPhone:"", paymentMethod:"cash", sellingPrice:String(car.sellingPrice) });
                    }}>Mark Sold</button>
                  )}
                  <button className="ca-btn delete" onClick={() => { setShowDelete(car); setDeleteReason(""); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="pagination">
            <button className="pg-btn" onClick={() => setSkip(Math.max(0,skip-LIMIT))} disabled={skip===0}>← Prev</button>
            <span className="pg-info">{Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}</span>
            <button className="pg-btn" onClick={() => setSkip(skip+LIMIT)} disabled={skip+LIMIT>=total}>Next →</button>
          </div>
        </>
      )}

      {showAdd && <CarForm data={form} setData={setForm} onSubmit={handleAddCar} title="ADD NEW CAR" onClose={() => setShowAdd(false)} />}
      {showEdit && <CarForm data={showEdit} setData={setShowEdit} onSubmit={handleEditCar} title="EDIT CAR" onClose={() => setShowEdit(null)} />}

      {/* CAR DETAIL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{showDetail.brand} {showDetail.model} · {showDetail.carId}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-form">
              {showDetail.images?.length > 0 && (
                <div className="detail-gallery">
                  {showDetail.images.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="gallery-img" />
                  ))}
                </div>
              )}
              <div className="detail-grid">
                {[
                  ["Car ID", showDetail.carId], ["Brand", showDetail.brand], ["Model", showDetail.model],
                  ["Year", showDetail.year], ["Color", showDetail.color], ["Condition", showDetail.condition?.replace(/_/g," ")],
                  ["Transmission", showDetail.transmission], ["Fuel", showDetail.fuelType],
                  ["Mileage", showDetail.mileage ? `${showDetail.mileage.toLocaleString()} km` : "—"],
                  ["Engine", showDetail.engineType||"—"], ["VIN", showDetail.vin||"—"],
                  ["Status", showDetail.status?.replace(/_/g," ")],
                  ["Selling Price", fmt(showDetail.sellingPrice)],
                  ["Purchase Price", showDetail.purchasePrice ? fmt(showDetail.purchasePrice) : "—"],
                  ["Promo Price", showDetail.promoPrice ? fmt(showDetail.promoPrice) : "—"],
                  ["Location", showDetail.city ? `${showDetail.city}, ${showDetail.state}` : "—"],
                  ["Views", showDetail.viewCount||0], ["Likes", showDetail.likeCount||0],
                ].map(([k,v]) => (
                  <div key={k as string} className="dg-item">
                    <div className="dg-label">{k}</div>
                    <div className="dg-val">{v}</div>
                  </div>
                ))}
              </div>
              {showDetail.description && (
                <div className="detail-desc">
                  <div className="dd-label">Description</div>
                  <p className="dd-text">{showDetail.description}</p>
                </div>
              )}
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowDetail(null)}>Close</button>
                <button className="btn-primary" onClick={() => { setShowDetail(null); setShowEdit({...showDetail}); }}>Edit This Car</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARK AS SOLD */}
      {showSell && (
        <div className="modal-overlay" onClick={() => setShowSell(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">MARK AS SOLD — {showSell.brand} {showSell.model}</h3>
              <button className="modal-close" onClick={() => setShowSell(null)}>✕</button>
            </div>
            <form onSubmit={handleSellCar} className="modal-form">
              <div className="field"><label className="fl">Final Selling Price (₦) *</label><input type="number" className="fi" value={sellForm.sellingPrice} onChange={(e) => setSellForm({...sellForm,sellingPrice:e.target.value})} required /></div>
              <div className="field"><label className="fl">Buyer Name</label><input className="fi" value={sellForm.buyerName} onChange={(e) => setSellForm({...sellForm,buyerName:e.target.value})} /></div>
              <div className="field"><label className="fl">Buyer Phone</label><input className="fi" value={sellForm.buyerPhone} onChange={(e) => setSellForm({...sellForm,buyerPhone:e.target.value})} /></div>
              <div className="field"><label className="fl">Payment Method</label>
                <select className="fi" value={sellForm.paymentMethod} onChange={(e) => setSellForm({...sellForm,paymentMethod:e.target.value})}>
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option><option value="installment">Installment</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowSell(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Processing...":"Confirm Sale"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">DELETE CAR</h3>
              <button className="modal-close" onClick={() => setShowDelete(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="delete-warn">
                You are about to delete <strong>{showDelete.brand} {showDelete.model} ({showDelete.carId})</strong>.
                This action is logged but cannot be undone.
              </div>
              <div className="field">
                <label className="fl">Reason for Deletion *</label>
                <textarea className="fi fi-ta" rows={3} placeholder="Why are you deleting this listing?"
                  value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} required />
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowDelete(null)}>Cancel</button>
                <button className="btn-delete" onClick={handleDelete} disabled={!deleteReason.trim()||submitting}>
                  {submitting?"Deleting...":"Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cars-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:background 0.2s}
        .btn-primary:hover{background:#FF9340}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s}
        .btn-outline:hover{border-color:#F47B20;color:#F47B20}
        .btn-delete{background:#DC2626;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;cursor:pointer;transition:opacity 0.2s}
        .btn-delete:hover{opacity:0.85}
        .btn-delete:disabled{opacity:0.5;cursor:not-allowed}
        .filters{display:flex;flex-direction:column;gap:0.75rem}
        .search-input{background:#fff;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;max-width:380px}
        .search-input:focus{border-color:#F47B20}
        .search-input::placeholder{color:#CCC}
        .status-tabs{display:flex;gap:0.3rem;flex-wrap:wrap}
        .stab{background:transparent;border:1.5px solid #DDD;border-radius:20px;padding:0.3rem 0.875rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);color:#888;transition:all 0.2s;text-transform:capitalize}
        .stab:hover{border-color:#F47B20;color:#F47B20}
        .stab.active{background:#F47B20;color:#fff;border-color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .cars-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}
        .car-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.2s}
        .car-card:hover{border-color:#F47B20;box-shadow:0 4px 16px rgba(244,123,32,0.1)}
        .car-img-wrap{height:165px;background:#F5F5F5;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
        .car-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
        .car-card:hover .car-img-wrap img{transform:scale(1.03)}
        .car-ph{font-size:3rem;opacity:0.2}
        .slide-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.45);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;z-index:2}
        .slide-btn.prev{left:6px}
        .slide-btn.next{right:6px}
        .img-dots{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);display:flex;gap:4px}
        .dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.5)}
        .dot.active{background:#fff}
        .car-badge{position:absolute;top:0.5rem;left:0.5rem;padding:0.18rem 0.55rem;border-radius:20px;font-size:0.6rem;font-weight:600;text-transform:capitalize;color:#fff}
        .promo-tag{position:absolute;top:0.5rem;right:0.5rem;background:#DC2626;color:#fff;padding:0.18rem 0.5rem;border-radius:4px;font-size:0.6rem;font-weight:700;letter-spacing:0.08em}
        .car-body{padding:0.875rem;display:flex;flex-direction:column;gap:0.25rem;flex:1}
        .car-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .car-title{font-weight:700;font-size:0.9rem;color:#1A1A1A}
        .car-meta{font-size:0.7rem;color:#888;text-transform:capitalize}
        .car-mileage{font-size:0.7rem;color:#AAA}
        .price-row{display:flex;align-items:baseline;gap:0.5rem;margin-top:0.25rem}
        .car-price{font-family:var(--font-display);font-size:1.1rem;color:#F47B20;letter-spacing:0.03em}
        .promo-price{font-size:0.78rem;color:#16A34A}
        .profit-est{font-size:0.68rem;color:#16A34A}
        .car-actions{display:flex;gap:0.35rem;padding:0.75rem;border-top:1px solid #F0F0F0;flex-wrap:wrap}
        .ca-btn{flex:1;background:#F5F5F5;border:1px solid #DDD;border-radius:5px;padding:0.35rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s;text-align:center;white-space:nowrap}
        .ca-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .ca-btn.sell{background:#FFF7ED;border-color:#F47B20;color:#F47B20}
        .ca-btn.sell:hover{background:#F47B20;color:#fff}
        .ca-btn.delete:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .pagination{display:flex;align-items:center;gap:1rem;justify-content:center}
        .pg-btn{background:#fff;border:1.5px solid #DDD;color:#666;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.825rem;font-family:var(--font-body);transition:all 0.2s}
        .pg-btn:hover:not(:disabled){border-color:#F47B20;color:#F47B20}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}
        .pg-info{font-size:0.825rem;color:#888;font-family:var(--font-mono)}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-sm{max-width:440px}
        .modal-xl{max-width:720px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.875rem}
        .form-section{font-size:0.68rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#AAA;padding:0.5rem 0;border-bottom:1px solid #E5E5E5}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:70px}
        .media-upload{display:flex;flex-direction:column;gap:0.5rem}
        .img-grid{display:flex;gap:0.5rem;flex-wrap:wrap}
        .img-thumb{position:relative;width:70px;height:52px;border-radius:5px;overflow:hidden;border:1.5px solid #DDD}
        .img-thumb img{width:100%;height:100%;object-fit:cover}
        .rm-img{position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);border:none;color:#fff;width:16px;height:16px;border-radius:50%;font-size:0.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .add-img-btn{width:70px;height:52px;background:#F5F5F5;border:1.5px dashed #DDD;border-radius:5px;cursor:pointer;font-size:0.68rem;color:#888;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:all 0.2s}
        .add-img-btn:hover{border-color:#F47B20;color:#F47B20}
        .media-note{font-size:0.68rem;color:#CCC}
        .profit-preview{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:0.65rem 1rem;font-size:0.825rem;color:#166534}
        .profit-preview strong{font-family:var(--font-display)}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        .detail-gallery{display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem}
        .gallery-img{height:140px;min-width:200px;border-radius:6px;object-fit:cover;flex-shrink:0}
        .detail-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.5rem}
        .dg-item{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.6rem}
        .dg-label{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:#AAA;margin-bottom:0.2rem}
        .dg-val{font-size:0.825rem;color:#1A1A1A;text-transform:capitalize}
        .detail-desc{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.875rem}
        .dd-label{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:#AAA;margin-bottom:0.4rem}
        .dd-text{font-size:0.875rem;color:#555;line-height:1.6}
        .delete-warn{background:#FEF2F2;border:1px solid #FCA5A5;color:#7F1D1D;padding:0.875rem;border-radius:6px;font-size:0.875rem;line-height:1.5}
        .delete-warn strong{color:#DC2626}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}.form-row-3{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
}
