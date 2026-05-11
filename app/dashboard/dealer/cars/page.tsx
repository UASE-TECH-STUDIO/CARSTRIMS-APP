"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Other"];
const CONDITIONS = ["brand_new","foreign_used","locally_used"];
const TRANSMISSIONS = ["automatic","manual","semi-automatic"];
const FUELS = ["petrol","diesel","electric","hybrid","gas"];
const STATUS_COLORS: Record<string,string> = { available:"#16A34A", sold:"#737373", reserved:"#D97706", out_for_inspection:"#525252", in_repair:"#DC2626" };

function emptyForm() {
  return {
    brand:"", model:"", year:String(new Date().getFullYear()),
    color:"", condition:"foreign_used", transmission:"automatic",
    fuelType:"petrol", mileage:"", engineType:"", vin:"",
    sellingPrice:"", purchasePrice:"", promoPrice:"",
    description:"", city:"", state:"", status:"available",
  };
}

// Controlled input that doesn't lose focus
function Field({ label, value, onChange, type="text", placeholder="" }: any) {
  return (
    <div className="field">
      <label className="fl">{label}</label>
      <input
        type={type}
        className="fi"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="field">
      <label className="fl">{label}</label>
      <select className="fi" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o: any) => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o.replace(/_/g," ") : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const LIMIT = 20;

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [showSell, setShowSell] = useState<any>(null);
  const [showDelete, setShowDelete] = useState<any>(null);

  // Form state managed separately to prevent re-renders
  const formRef = useRef(emptyForm());
  const [formVersion, setFormVersion] = useState(0); // force re-render when needed
  const editFormRef = useRef<any>({});

  // Image/video state
  const [addImages, setAddImages] = useState<string[]>([]);
  const [addVideo, setAddVideo] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVideo, setEditVideo] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [vidUploading, setVidUploading] = useState(false);

  const [sellForm, setSellForm] = useState({ buyerName:"", buyerPhone:"", paymentMethod:"cash", sellingPrice:"" });
  const [deleteReason, setDeleteReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const editImgRef = useRef<HTMLInputElement>(null);
  const editVidRef = useRef<HTMLInputElement>(null);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const params: any = { skip, limit: LIMIT };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/api/v1/cars/", { params });
      setCars(res.data.cars || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCars(); }, [statusFilter, search, skip]);

  const uploadImages = async (files: FileList): Promise<string[]> => {
    setImgUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (urls.length >= 10) break;
      const fd = new FormData(); fd.append("file", file);
      try {
        const res = await api.post("/api/v1/upload/car/image", fd, { headers: {"Content-Type":"multipart/form-data"} });
        if (res.data.url) urls.push(res.data.url);
      } catch { }
    }
    setImgUploading(false);
    return urls;
  };

  const uploadVideo = async (file: File): Promise<string> => {
    setVidUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await api.post("/api/v1/upload/car/video", fd, { headers: {"Content-Type":"multipart/form-data"} });
      setVidUploading(false);
      return res.data.url || "";
    } catch { setVidUploading(false); return ""; }
  };

  const handleAddSubmit = async () => {
    setSubmitting(true); setError("");
    const f = formRef.current;
    try {
      await api.post("/api/v1/cars/", {
        ...f,
        year: Number(f.year),
        mileage: f.mileage ? Number(f.mileage) : undefined,
        sellingPrice: Number(f.sellingPrice),
        purchasePrice: f.purchasePrice ? Number(f.purchasePrice) : undefined,
        promoPrice: f.promoPrice ? Number(f.promoPrice) : undefined,
        images: addImages,
        video: addVideo || undefined,
      });
      setShowAdd(false);
      formRef.current = emptyForm();
      setAddImages([]); setAddVideo("");
      setFormVersion((v) => v + 1);
      fetchCars();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to add car"); }
    finally { setSubmitting(false); }
  };

  const handleEditSubmit = async () => {
    if (!showEdit) return;
    setSubmitting(true); setError("");
    const f = editFormRef.current;
    try {
      await api.patch(`/api/v1/cars/${showEdit.carId}`, {
        ...f,
        year: Number(f.year),
        sellingPrice: Number(f.sellingPrice),
        purchasePrice: f.purchasePrice ? Number(f.purchasePrice) : undefined,
        promoPrice: f.promoPrice ? Number(f.promoPrice) : undefined,
        images: editImages,
        video: editVideo || undefined,
      });
      setShowEdit(null);
      fetchCars();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to update car"); }
    finally { setSubmitting(false); }
  };

  const handleSell = async () => {
    if (!showSell) return; setSubmitting(true);
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
    if (!showDelete || !deleteReason.trim()) return; setSubmitting(true);
    try {
      await api.delete(`/api/v1/cars/${showDelete.carId}?reason=${encodeURIComponent(deleteReason)}`);
      setShowDelete(null); setDeleteReason(""); fetchCars();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const openEdit = (car: any) => {
    editFormRef.current = { ...car };
    setEditImages(car.images || []);
    setEditVideo(car.video || "");
    setShowEdit(car);
    setError("");
  };

  const fmt = (n: number) => `N${(n||0).toLocaleString()}`;

  // ADD form field updater
  const setAddField = (key: string) => (val: string) => {
    formRef.current = { ...formRef.current, [key]: val };
  };

  // EDIT form field updater
  const setEditField = (key: string) => (val: string) => {
    editFormRef.current = { ...editFormRef.current, [key]: val };
  };

  return (
    <div className="cars-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Cars and Inventory</h2>
          <p className="page-sub">{total} vehicle{total !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary" onClick={() => { formRef.current = emptyForm(); setAddImages([]); setAddVideo(""); setError(""); setShowAdd(true); }}>
          Add Car
        </button>
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search brand, model, Car ID..."
          value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
        <div className="status-tabs">
          {["all","available","sold","reserved","out_for_inspection","in_repair"].map((s) => (
            <button key={s} className={`stab ${statusFilter === s ? "active" : ""}`}
              onClick={() => { setStatusFilter(s); setSkip(0); }}>
              {s === "all" ? "All" : s.replace(/_/g," ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : cars.length === 0 ? (
        <div className="empty"><div className="ei">No cars found</div><p>Add your first car listing</p></div>
      ) : (
        <>
          <div className="cars-grid">
            {cars.map((car) => (
              <div key={car._id} className="car-card">
                <div className="car-img-wrap" onClick={() => setShowDetail(car)}>
                  {car.images?.[0]
                    ? <img src={car.images[0]} alt="" />
                    : <div className="car-ph">No Image</div>
                  }
                  <div className="car-status-tag" style={{background:STATUS_COLORS[car.status]||"#737373"}}>
                    {car.status.replace(/_/g," ")}
                  </div>
                  {car.images?.length > 1 && (
                    <div className="img-count">{car.images.length} photos</div>
                  )}
                </div>
                <div className="car-body">
                  <div className="car-id">{car.carId}</div>
                  <div className="car-title">{car.brand} {car.model} {car.year}</div>
                  <div className="car-meta">{car.color} · {car.transmission} · {car.fuelType}</div>
                  {car.mileage && <div className="car-mileage">{car.mileage.toLocaleString()} km</div>}
                  <div className="price-row">
                    <span className="car-price">{fmt(car.sellingPrice)}</span>
                    {car.purchasePrice && <span className="car-profit">+{fmt(car.sellingPrice - car.purchasePrice)}</span>}
                  </div>
                </div>
                <div className="car-actions">
                  <button className="ca-sm" onClick={() => setShowDetail(car)}>View</button>
                  <button className="ca-sm" onClick={() => openEdit(car)}>Edit</button>
                  {car.status === "available" && (
                    <button className="ca-sm sell" onClick={() => { setShowSell(car); setSellForm({ buyerName:"", buyerPhone:"", paymentMethod:"cash", sellingPrice:String(car.sellingPrice) }); }}>
                      Sold
                    </button>
                  )}
                  <button className="ca-sm del" onClick={() => { setShowDelete(car); setDeleteReason(""); }}>Del</button>
                </div>
              </div>
            ))}
          </div>
          <div className="pagination">
            <button className="pg-btn" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - LIMIT))}>Prev</button>
            <span className="pg-info">{Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}</span>
            <button className="pg-btn" disabled={skip + LIMIT >= total} onClick={() => setSkip(skip + LIMIT)}>Next</button>
          </div>
        </>
      )}

      {/* ADD CAR MODAL */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">ADD NEW CAR</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>X</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-form">
              <div className="form-section">BASIC INFO</div>
              <div className="form-row-3">
                <div className="field"><label className="fl">Brand</label>
                  <select className="fi" defaultValue={formRef.current.brand} onChange={(e) => setAddField("brand")(e.target.value)}>
                    <option value="">Select brand</option>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="field"><label className="fl">Model *</label><input className="fi" placeholder="Camry" defaultValue={formRef.current.model} onChange={(e) => setAddField("model")(e.target.value)} /></div>
                <div className="field"><label className="fl">Year</label><input type="number" className="fi" defaultValue={formRef.current.year} onChange={(e) => setAddField("year")(e.target.value)} /></div>
              </div>
              <div className="form-row-3">
                <div className="field"><label className="fl">Color</label><input className="fi" defaultValue={formRef.current.color} onChange={(e) => setAddField("color")(e.target.value)} /></div>
                <div className="field"><label className="fl">Condition</label>
                  <select className="fi" defaultValue={formRef.current.condition} onChange={(e) => setAddField("condition")(e.target.value)}>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div className="field"><label className="fl">Status</label>
                  <select className="fi" defaultValue={formRef.current.status} onChange={(e) => setAddField("status")(e.target.value)}>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="in_repair">In Repair</option>
                  </select>
                </div>
              </div>
              <div className="form-section">SPECS</div>
              <div className="form-row-3">
                <div className="field"><label className="fl">Transmission</label>
                  <select className="fi" defaultValue={formRef.current.transmission} onChange={(e) => setAddField("transmission")(e.target.value)}>
                    {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label className="fl">Fuel Type</label>
                  <select className="fi" defaultValue={formRef.current.fuelType} onChange={(e) => setAddField("fuelType")(e.target.value)}>
                    {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="field"><label className="fl">Mileage (km)</label><input type="number" className="fi" defaultValue={formRef.current.mileage} onChange={(e) => setAddField("mileage")(e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Engine Type</label><input className="fi" placeholder="2.5L V6" defaultValue={formRef.current.engineType} onChange={(e) => setAddField("engineType")(e.target.value)} /></div>
                <div className="field"><label className="fl">VIN</label><input className="fi" defaultValue={formRef.current.vin} onChange={(e) => setAddField("vin")(e.target.value)} /></div>
              </div>
              <div className="form-section">PRICING</div>
              <div className="form-row-3">
                <div className="field"><label className="fl">Selling Price (N) *</label><input type="number" className="fi" defaultValue={formRef.current.sellingPrice} onChange={(e) => setAddField("sellingPrice")(e.target.value)} /></div>
                <div className="field"><label className="fl">Purchase Price (N)</label><input type="number" className="fi" defaultValue={formRef.current.purchasePrice} onChange={(e) => setAddField("purchasePrice")(e.target.value)} /></div>
                <div className="field"><label className="fl">Promo Price (N)</label><input type="number" className="fi" defaultValue={formRef.current.promoPrice} onChange={(e) => setAddField("promoPrice")(e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">City</label><input className="fi" defaultValue={formRef.current.city} onChange={(e) => setAddField("city")(e.target.value)} /></div>
                <div className="field"><label className="fl">State</label><input className="fi" defaultValue={formRef.current.state} onChange={(e) => setAddField("state")(e.target.value)} /></div>
              </div>
              <div className="field"><label className="fl">Description</label><textarea className="fi fi-ta" rows={3} defaultValue={formRef.current.description} onChange={(e) => setAddField("description")(e.target.value)} /></div>

              <div className="form-section">PHOTOS (max 10)</div>
              <div className="media-section">
                <div className="img-grid">
                  {addImages.map((url, i) => (
                    <div key={i} className="img-thumb">
                      <img src={url} alt="" />
                      <button type="button" className="rm-img" onClick={() => setAddImages((p) => p.filter((_, j) => j !== i))}>X</button>
                    </div>
                  ))}
                  {addImages.length < 10 && (
                    <button type="button" className="add-img-btn"
                      onClick={() => imgRef.current?.click()}
                      disabled={imgUploading}>
                      {imgUploading ? "Uploading..." : `+ Photo (${addImages.length}/10)`}
                    </button>
                  )}
                </div>
                <input ref={imgRef} type="file" accept="image/*" multiple style={{display:"none"}}
                  onChange={async (e) => {
                    if (!e.target.files) return;
                    const urls = await uploadImages(e.target.files);
                    setAddImages((p) => [...p, ...urls].slice(0, 10));
                    e.target.value = "";
                  }} />
              </div>

              <div className="form-section">VIDEO (max 30 seconds)</div>
              <div className="media-section">
                {addVideo ? (
                  <div className="video-preview">
                    <video src={addVideo} controls className="vid-prev" />
                    <button type="button" className="rm-vid" onClick={() => setAddVideo("")}>Remove Video</button>
                  </div>
                ) : (
                  <button type="button" className="add-img-btn"
                    onClick={() => vidRef.current?.click()}
                    disabled={vidUploading}>
                    {vidUploading ? "Uploading video..." : "+ Upload Video (30s max)"}
                  </button>
                )}
                <input ref={vidRef} type="file" accept="video/*" style={{display:"none"}}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadVideo(file);
                    if (url) setAddVideo(url);
                    e.target.value = "";
                  }} />
                <p className="media-note">MP4, MOV, AVI · max 30 seconds · max 50MB</p>
              </div>

              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddSubmit} disabled={submitting || imgUploading || vidUploading}>
                  {submitting ? "Adding..." : "Add Car"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CAR MODAL */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(null)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">EDIT — {showEdit.carId}</h3>
              <button className="modal-close" onClick={() => setShowEdit(null)}>X</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-form">
              <div className="form-section">BASIC INFO</div>
              <div className="form-row-3">
                <div className="field"><label className="fl">Brand</label>
                  <select className="fi" defaultValue={showEdit.brand} onChange={(e) => setEditField("brand")(e.target.value)}>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="field"><label className="fl">Model</label><input className="fi" defaultValue={showEdit.model} onChange={(e) => setEditField("model")(e.target.value)} /></div>
                <div className="field"><label className="fl">Year</label><input type="number" className="fi" defaultValue={showEdit.year} onChange={(e) => setEditField("year")(e.target.value)} /></div>
              </div>
              <div className="form-row-3">
                <div className="field"><label className="fl">Color</label><input className="fi" defaultValue={showEdit.color} onChange={(e) => setEditField("color")(e.target.value)} /></div>
                <div className="field"><label className="fl">Condition</label>
                  <select className="fi" defaultValue={showEdit.condition} onChange={(e) => setEditField("condition")(e.target.value)}>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div className="field"><label className="fl">Status</label>
                  <select className="fi" defaultValue={showEdit.status} onChange={(e) => setEditField("status")(e.target.value)}>
                    {["available","reserved","in_repair","out_for_inspection"].map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-section">PRICING</div>
              <div className="form-row-3">
                <div className="field"><label className="fl">Selling Price (N)</label><input type="number" className="fi" defaultValue={showEdit.sellingPrice} onChange={(e) => setEditField("sellingPrice")(e.target.value)} /></div>
                <div className="field"><label className="fl">Purchase Price (N)</label><input type="number" className="fi" defaultValue={showEdit.purchasePrice} onChange={(e) => setEditField("purchasePrice")(e.target.value)} /></div>
                <div className="field"><label className="fl">Promo Price (N)</label><input type="number" className="fi" defaultValue={showEdit.promoPrice} onChange={(e) => setEditField("promoPrice")(e.target.value)} /></div>
              </div>
              <div className="field"><label className="fl">Description</label><textarea className="fi fi-ta" rows={3} defaultValue={showEdit.description} onChange={(e) => setEditField("description")(e.target.value)} /></div>

              <div className="form-section">PHOTOS ({editImages.length}/10)</div>
              <div className="media-section">
                <div className="img-grid">
                  {editImages.map((url, i) => (
                    <div key={i} className="img-thumb">
                      <img src={url} alt="" />
                      <button type="button" className="rm-img" onClick={() => setEditImages((p) => p.filter((_, j) => j !== i))}>X</button>
                    </div>
                  ))}
                  {editImages.length < 10 && (
                    <button type="button" className="add-img-btn" onClick={() => editImgRef.current?.click()} disabled={imgUploading}>
                      {imgUploading ? "Uploading..." : `+ Add Photo`}
                    </button>
                  )}
                </div>
                <input ref={editImgRef} type="file" accept="image/*" multiple style={{display:"none"}}
                  onChange={async (e) => {
                    if (!e.target.files) return;
                    const urls = await uploadImages(e.target.files);
                    setEditImages((p) => [...p, ...urls].slice(0, 10));
                    e.target.value = "";
                  }} />
              </div>

              <div className="form-section">VIDEO</div>
              <div className="media-section">
                {editVideo ? (
                  <div className="video-preview">
                    <video src={editVideo} controls className="vid-prev" />
                    <button type="button" className="rm-vid" onClick={() => setEditVideo("")}>Remove Video</button>
                  </div>
                ) : (
                  <button type="button" className="add-img-btn" onClick={() => editVidRef.current?.click()} disabled={vidUploading}>
                    {vidUploading ? "Uploading..." : "+ Upload Video (30s max)"}
                  </button>
                )}
                <input ref={editVidRef} type="file" accept="video/*" style={{display:"none"}}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadVideo(file);
                    if (url) setEditVideo(url);
                    e.target.value = "";
                  }} />
              </div>

              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowEdit(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleEditSubmit} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{showDetail.brand} {showDetail.model} — {showDetail.carId}</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>X</button>
            </div>
            <div className="modal-form">
              {showDetail.images?.length > 0 && (
                <div className="detail-gallery">
                  {showDetail.images.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="gallery-img" />
                  ))}
                </div>
              )}
              {showDetail.video && (
                <video src={showDetail.video} controls className="vid-prev" />
              )}
              <div className="detail-grid">
                {[
                  ["Car ID", showDetail.carId], ["Brand", showDetail.brand],
                  ["Model", showDetail.model], ["Year", showDetail.year],
                  ["Color", showDetail.color], ["Status", showDetail.status?.replace(/_/g," ")],
                  ["Condition", showDetail.condition?.replace(/_/g," ")],
                  ["Transmission", showDetail.transmission], ["Fuel", showDetail.fuelType],
                  ["Mileage", showDetail.mileage ? `${showDetail.mileage.toLocaleString()} km` : "—"],
                  ["Engine", showDetail.engineType||"—"], ["VIN", showDetail.vin||"—"],
                  ["Selling Price", fmt(showDetail.sellingPrice)],
                  ["Purchase Price", showDetail.purchasePrice ? fmt(showDetail.purchasePrice) : "—"],
                  ["Views", showDetail.viewCount||0], ["Likes", showDetail.likeCount||0],
                ].map(([k,v]) => (
                  <div key={k as string} className="dg-item">
                    <div className="dg-label">{k}</div>
                    <div className="dg-val">{v}</div>
                  </div>
                ))}
              </div>
              {showDetail.description && (
                <div className="detail-desc"><div className="dd-label">Description</div><p>{showDetail.description}</p></div>
              )}
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowDetail(null)}>Close</button>
                <button className="btn-primary" onClick={() => { setShowDetail(null); openEdit(showDetail); }}>Edit Car</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARK SOLD */}
      {showSell && (
        <div className="modal-overlay" onClick={() => setShowSell(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">MARK AS SOLD — {showSell.brand} {showSell.model}</h3>
              <button className="modal-close" onClick={() => setShowSell(null)}>X</button>
            </div>
            <div className="modal-form">
              <div className="field"><label className="fl">Final Selling Price (N)</label><input type="number" className="fi" value={sellForm.sellingPrice} onChange={(e) => setSellForm({...sellForm,sellingPrice:e.target.value})} /></div>
              <div className="field"><label className="fl">Buyer Name</label><input className="fi" value={sellForm.buyerName} onChange={(e) => setSellForm({...sellForm,buyerName:e.target.value})} /></div>
              <div className="field"><label className="fl">Buyer Phone</label><input className="fi" value={sellForm.buyerPhone} onChange={(e) => setSellForm({...sellForm,buyerPhone:e.target.value})} /></div>
              <div className="field"><label className="fl">Payment</label>
                <select className="fi" value={sellForm.paymentMethod} onChange={(e) => setSellForm({...sellForm,paymentMethod:e.target.value})}>
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option><option value="installment">Installment</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowSell(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleSell} disabled={submitting}>{submitting?"Processing...":"Confirm Sale"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">DELETE CAR</h3>
              <button className="modal-close" onClick={() => setShowDelete(null)}>X</button>
            </div>
            <div className="modal-form">
              <div className="delete-warn">
                Deleting <strong>{showDelete.brand} {showDelete.model} ({showDelete.carId})</strong>.
                This is logged and cannot be undone.
              </div>
              <div className="field"><label className="fl">Reason *</label>
                <textarea className="fi fi-ta" rows={3} placeholder="Reason for deletion..."
                  value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
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
        .btn-delete{background:#DC2626;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;cursor:pointer}
        .btn-delete:disabled{opacity:0.5;cursor:not-allowed}
        .filters{display:flex;flex-direction:column;gap:0.75rem}
        .search-input{background:#fff;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;max-width:380px;width:100%}
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
        .ei{font-size:1.1rem;font-weight:700;color:#AAA;letter-spacing:0.1em}
        .empty p{color:#888;font-size:0.875rem}
        .cars-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem}
        .car-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.2s}
        .car-card:hover{border-color:#F47B20;box-shadow:0 4px 16px rgba(244,123,32,0.1)}
        .car-img-wrap{height:160px;background:#F5F5F5;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .car-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
        .car-card:hover .car-img-wrap img{transform:scale(1.03)}
        .car-ph{font-size:0.75rem;font-weight:700;color:#CCC;letter-spacing:0.1em}
        .car-status-tag{position:absolute;top:0.5rem;left:0.5rem;padding:0.18rem 0.55rem;border-radius:20px;font-size:0.6rem;font-weight:600;text-transform:capitalize;color:#fff}
        .img-count{position:absolute;bottom:0.5rem;right:0.5rem;background:rgba(0,0,0,0.55);color:#fff;padding:0.18rem 0.5rem;border-radius:4px;font-size:0.65rem}
        .car-body{padding:0.875rem;display:flex;flex-direction:column;gap:0.25rem;flex:1}
        .car-id{font-family:var(--font-mono);font-size:0.65rem;color:#AAA}
        .car-title{font-weight:700;font-size:0.9rem;color:#1A1A1A}
        .car-meta{font-size:0.7rem;color:#888;text-transform:capitalize}
        .car-mileage{font-size:0.7rem;color:#AAA}
        .price-row{display:flex;align-items:baseline;gap:0.5rem;margin-top:0.25rem}
        .car-price{font-family:var(--font-display);font-size:1.1rem;color:#F47B20}
        .car-profit{font-size:0.72rem;color:#16A34A;font-weight:600}
        .car-actions{display:flex;gap:0.3rem;padding:0.75rem;border-top:1px solid #F0F0F0;flex-wrap:wrap}
        .ca-sm{flex:1;background:#F5F5F5;border:1px solid #DDD;border-radius:5px;padding:0.35rem;font-size:0.7rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s;text-align:center;min-width:36px}
        .ca-sm:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .ca-sm.sell{background:#FFF7ED;border-color:#F47B20;color:#F47B20}
        .ca-sm.sell:hover{background:#F47B20;color:#fff}
        .ca-sm.del:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .pagination{display:flex;align-items:center;gap:1rem;justify-content:center;padding:1rem}
        .pg-btn{background:#fff;border:1.5px solid #DDD;color:#666;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.825rem;font-family:var(--font-body);transition:all 0.2s}
        .pg-btn:hover:not(:disabled){border-color:#F47B20;color:#F47B20}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}
        .pg-info{font-size:0.825rem;color:#888;font-family:var(--font-mono)}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem;overflow-y:auto}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15);margin:auto}
        .modal-xl{max-width:720px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.08em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:0.875rem;font-weight:700;cursor:pointer;font-family:var(--font-body)}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F
.form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.875rem}
        .form-section{font-size:0.65rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#F47B20;padding-bottom:0.35rem;border-bottom:1.5px solid #FFF7ED;margin-top:0.25rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.67rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#737373}
        .fi{background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:75px}
        .media-section{display:flex;flex-direction:column;gap:0.75rem}
        .img-grid{display:flex;flex-wrap:wrap;gap:0.5rem;align-items:flex-start}
        .img-thumb{position:relative;width:80px;height:70px;border-radius:6px;overflow:hidden;border:1.5px solid #E5E5E5;flex-shrink:0}
        .img-thumb img{width:100%;height:100%;object-fit:cover}
        .rm-img{position:absolute;top:2px;right:2px;background:rgba(220,38,38,0.85);color:#fff;border:none;border-radius:3px;width:18px;height:18px;cursor:pointer;font-size:0.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:var(--font-body)}
        .add-img-btn{background:#F5F5F5;border:1.5px dashed #D4D4D4;border-radius:6px;padding:0.75rem 1rem;color:#737373;font-size:0.78rem;cursor:pointer;transition:all 0.2s;font-family:var(--font-body);white-space:nowrap}
        .add-img-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .add-img-btn:disabled{opacity:0.5;cursor:not-allowed}
        .video-preview{display:flex;flex-direction:column;gap:0.5rem}
        .vid-prev{width:100%;max-height:180px;border-radius:8px;border:1.5px solid #E5E5E5;object-fit:cover}
        .rm-vid{background:transparent;border:1.5px solid #DC2626;color:#DC2626;border-radius:5px;padding:0.35rem 0.875rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
        .rm-vid:hover{background:#DC2626;color:#fff}
        .media-note{font-size:0.68rem;color:#A3A3A3;font-style:italic}
        .detail-gallery{display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem}
        .gallery-img{height:140px;min-width:200px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid #E5E5E5}
        .detail-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.5rem}
        .dg-item{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.6rem}
        .dg-label{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.2rem}
        .dg-val{font-size:0.825rem;color:#1A1A1A;text-transform:capitalize;font-weight:500}
        .detail-desc{background:#FAFAFA;border:1px solid #F0F0F0;border-radius:6px;padding:0.875rem}
        .dd-label{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.06em;color:#AAA;margin-bottom:0.4rem;font-weight:600}
        .detail-desc p{font-size:0.875rem;color:#555;line-height:1.6}
        .delete-warn{background:#FEF2F2;border:1px solid #FCA5A5;color:#7F1D1D;padding:0.875rem;border-radius:8px;font-size:0.875rem;line-height:1.5}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.75rem;border-top:1px solid #E5E5E5}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}.form-row-3{grid-template-columns:1fr 1fr}.cars-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:400px){.form-row-3{grid-template-columns:1fr}.cars-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
