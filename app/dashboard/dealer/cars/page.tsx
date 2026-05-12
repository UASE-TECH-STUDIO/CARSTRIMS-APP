"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Volvo","Porsche","Other"];
const CONDITIONS = ["foreign used","brand new","locally used"];
const STATUSES = ["available","sold","reserved","out_for_inspection","in_repair","on_promotion"];
const FUEL_TYPES = ["petrol","diesel","electric","hybrid","gas"];
const TRANS = ["automatic","manual","semi-automatic"];

interface Car {
  _id: string; carId: string; brand: string; model: string; year: number;
  color: string; condition: string; status: string;
  sellingPrice: number; purchasePrice?: number; promoPrice?: number;
  mileage?: number; fuelType?: string; transmission?: string;
  engineType?: string; vin?: string; description?: string;
  city?: string; state?: string; images?: string[]; video?: string;
}

  })();
  const res = await fetch(
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + endpoint,
    {
      method: "POST",
      body: fd,
      headers: { Authorization: "Bearer " + token },
    }
  );
  if (!res.ok) throw new Error("Upload failed: " + res.status);
  const data = await res.json();
  return data.url || data.secure_url || data.imageUrl || data.videoUrl || "";
}

const emptyForm = () => ({
  brand: "Toyota", model: "", year: new Date().getFullYear(), color: "",
  condition: "foreign used", status: "available", sellingPrice: "",
  purchasePrice: "", promoPrice: "", mileage: "", fuelType: "petrol",
  transmission: "automatic", engineType: "", vin: "", description: "",
  city: "", state: "",
});

export default function DealerCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editCar, setEditCar] = useState<Car | null>(null);
  const formRef = useRef(emptyForm());
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, forceUpdate] = useState(0);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 30 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const r = await api.get("/api/v1/cars/", { params });
      setCars(r.data.cars || []);
      setTotal(r.data.total || 0);
    } catch (_) {} finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    formRef.current = emptyForm();
    setImages([]); setVideo(""); setErr("");
    setModal("add"); setEditCar(null);
    forceUpdate(n => n + 1);
  };

  const openEdit = (car: Car) => {
    formRef.current = {
      brand: car.brand || "Toyota", model: car.model || "",
      year: car.year || new Date().getFullYear(), color: car.color || "",
      condition: car.condition || "foreign used", status: car.status || "available",
      sellingPrice: String(car.sellingPrice || ""), purchasePrice: String(car.purchasePrice || ""),
      promoPrice: String(car.promoPrice || ""), mileage: String(car.mileage || ""),
      fuelType: car.fuelType || "petrol", transmission: car.transmission || "automatic",
      engineType: car.engineType || "", vin: car.vin || "",
      description: car.description || "", city: car.city || "", state: car.state || "",
    };
    setImages(car.images || []); setVideo(car.video || ""); setErr("");
    setEditCar(car); setModal("edit");
    forceUpdate(n => n + 1);
  };

  const closeModal = () => { setModal(null); setEditCar(null); setErr(""); };

  const set = (k: string, v: any) => {
    (formRef.current as any)[k] = v;
  };

  const handleImgFiles = async (files: FileList) => {
    if (images.length + files.length > 10) { setErr("Maximum 10 photos allowed"); return; }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress("Uploading photo " + (i + 1) + " of " + files.length + "...");
        const url = await uploadToCloudinary(files[i]);
        urls.push(url);
      }
      setImages(prev => [...prev, ...urls]);
      setErr("");
    } catch (_) { setErr("Photo upload failed. Please try again."); }
    finally {
      setUploading(false); setUploadProgress("");
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  };

  const handleVideoFile = async (file: File) => {
    const checkDuration = (): Promise<number> => new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
      v.src = URL.createObjectURL(file);
    });
    try {
      const duration = await checkDuration();
      if (duration > 31) { setErr("Video must be 30 seconds or less"); return; }
    } catch (_) {}
    if (file.size > 50 * 1024 * 1024) { setErr("Video must be under 50MB"); return; }
    setUploading(true); setUploadProgress("Uploading video...");
    try {
      const url = await uploadToCloudinary(file);
      setVideo(url); setErr("");
    } catch (_) { setErr("Video upload failed. Please try again."); }
    finally {
      setUploading(false); setUploadProgress("");
      if (vidInputRef.current) vidInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));
  const removeVideo = () => setVideo("");

  const handleSave = async () => {
    const f = formRef.current;
    if (!f.model.trim()) { setErr("Car model is required"); return; }
    if (!f.sellingPrice) { setErr("Selling price is required"); return; }
    setSaving(true); setErr("");
    try {
      const payload = {
        ...f,
        year: Number(f.year),
        sellingPrice: Number(f.sellingPrice),
        purchasePrice: Number(f.purchasePrice) || 0,
        promoPrice: Number(f.promoPrice) || 0,
        mileage: Number(f.mileage) || 0,
        images,
        video: video || undefined,
      };
      if (modal === "add") {
        await api.post("/api/v1/cars/", payload);
      } else if (editCar) {
        await api.patch("/api/v1/cars/" + editCar.carId, payload);
      }
      await load();
      closeModal();
    } catch (ex: any) {
      setErr(ex.response?.data?.detail || "Save failed. Please try again.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (carId: string) => {
    if (!confirm("Delete this car permanently?")) return;
    try { await api.delete("/api/v1/cars/" + carId); await load(); }
    catch (_) { alert("Delete failed"); }
  };

  const STATUS_COLORS: Record<string, string> = {
    available: "#16A34A", sold: "#737373", reserved: "#F47B20",
    out_for_inspection: "#2563EB", in_repair: "#DC2626", on_promotion: "#7C3AED",
  };

  const fi: React.CSSProperties = {
    background: "#F5F5F5", border: "1.5px solid #E5E5E5", borderRadius: "8px",
    padding: "0.8rem 0.875rem", color: "#1A1A1A", fontSize: "0.875rem",
    fontFamily: "var(--font-body)", outline: "none", width: "100%", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#525252", display: "block", marginBottom: "0.35rem",
  };

  const fd = formRef.current;
  const modalKey = modal + (editCar?._id || "new");

  return (
    <div className="cars-page">
      <div className="cp-header">
        <div>
          <h2 className="cp-title">Inventory</h2>
          <p className="cp-sub">{total} vehicles</p>
        </div>
        <button className="cp-add-btn" onClick={openAdd}>+ Add Car</button>
      </div>

      <div className="cp-filters">
        <input className="cp-search" placeholder="Search brand, model, ID..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="cp-status-tabs">
          {["all","available","sold","reserved","out_for_inspection","in_repair"].map((s) => (
            <button key={s} className={"cp-stab" + (statusFilter === s ? " active" : "")}
              onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="cp-loading"><div className="cp-spinner" /></div>
      ) : cars.length === 0 ? (
        <div className="cp-empty">
          <div style={{ fontSize: "0.875rem", color: "#737373" }}>No cars found. Add your first car to get started.</div>
          <button className="cp-add-btn" onClick={openAdd}>+ Add First Car</button>
        </div>
      ) : (
        <div className="cp-grid">
          {cars.map((c) => (
            <div key={c._id} className="cp-card">
              <div className="cp-img-wrap">
                {c.images?.[0]
                  ? <img src={c.images[0]} alt="" className="cp-img" />
                  : <div className="cp-img-ph">No Photo</div>}
                <div className="cp-status-badge" style={{ background: STATUS_COLORS[c.status] || "#737373" }}>
                  {c.status?.replace(/_/g, " ")}
                </div>
                <div className="cp-img-count">{(c.images || []).length}/10</div>
              </div>
              <div className="cp-card-body">
                <div className="cp-car-name">{c.brand} {c.model} {c.year}</div>
                <div className="cp-car-id">{c.carId}</div>
                <div className="cp-car-meta">{c.color} · {c.transmission} · {c.fuelType}</div>
                <div className="cp-car-price">NGN {(c.sellingPrice || 0).toLocaleString()}</div>
                <div className="cp-card-actions">
                  <button className="cp-edit-btn" onClick={() => openEdit(c)}>Edit</button>
                  <button className="cp-del-btn" onClick={() => handleDelete(c.carId)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-hdr">
              <h3 className="modal-ttl">
                {modal === "add" ? "Add New Car" : "Edit — " + (editCar?.carId || "")}
              </h3>
              <button className="modal-x" onClick={closeModal}>X</button>
            </div>

            {err && <div className="modal-err">{err}</div>}
            {uploading && <div className="modal-progress">{uploadProgress}</div>}

            <div className="modal-body">

              <div className="modal-section-title">BASIC INFO</div>
              <div className="modal-grid2">
                <div>
                  <label style={lbl}>Brand *</label>
                  <select style={fi} key={"brand-" + modalKey} defaultValue={fd.brand}
                    onChange={(e) => set("brand", e.target.value)}>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Model *</label>
                  <input style={fi} placeholder="e.g. Camry"
                    key={"model-" + modalKey} defaultValue={fd.model}
                    onChange={(e) => set("model", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Year *</label>
                  <input type="number" style={fi} min="1990" max="2030"
                    key={"year-" + modalKey} defaultValue={fd.year}
                    onChange={(e) => set("year", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Color *</label>
                  <input style={fi} placeholder="e.g. Black"
                    key={"color-" + modalKey} defaultValue={fd.color}
                    onChange={(e) => set("color", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Condition</label>
                  <select style={fi} key={"cond-" + modalKey} defaultValue={fd.condition}
                    onChange={(e) => set("condition", e.target.value)}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select style={fi} key={"status-" + modalKey} defaultValue={fd.status}
                    onChange={(e) => set("status", e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="modal-section-title">LOCATION</div>
              <div className="modal-grid2">
                <div>
                  <label style={lbl}>City</label>
                  <input style={fi} placeholder="e.g. Abuja"
                    key={"city-" + modalKey} defaultValue={fd.city}
                    onChange={(e) => set("city", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>State</label>
                  <input style={fi} placeholder="e.g. FCT"
                    key={"state-" + modalKey} defaultValue={fd.state}
                    onChange={(e) => set("state", e.target.value)} />
                </div>
              </div>

              <div className="modal-section-title">SPECIFICATIONS</div>
              <div className="modal-grid2">
                <div>
                  <label style={lbl}>Fuel Type</label>
                  <select style={fi} key={"fuel-" + modalKey} defaultValue={fd.fuelType}
                    onChange={(e) => set("fuelType", e.target.value)}>
                    {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Transmission</label>
                  <select style={fi} key={"trans-" + modalKey} defaultValue={fd.transmission}
                    onChange={(e) => set("transmission", e.target.value)}>
                    {TRANS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Mileage (km)</label>
                  <input type="number" style={fi} placeholder="0"
                    key={"mileage-" + modalKey} defaultValue={fd.mileage}
                    onChange={(e) => set("mileage", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Engine Type</label>
                  <input style={fi} placeholder="e.g. V6 3.5L"
                    key={"engine-" + modalKey} defaultValue={fd.engineType}
                    onChange={(e) => set("engineType", e.target.value)} />
                </div>
                <div className="modal-col2">
                  <label style={lbl}>VIN / Chassis Number</label>
                  <input style={fi} placeholder="Optional"
                    key={"vin-" + modalKey} defaultValue={fd.vin}
                    onChange={(e) => set("vin", e.target.value)} />
                </div>
              </div>

              <div className="modal-section-title">PRICING (NGN)</div>
              <div className="modal-grid3">
                <div>
                  <label style={lbl}>Selling Price *</label>
                  <input type="number" style={fi} placeholder="0"
                    key={"sell-" + modalKey} defaultValue={fd.sellingPrice}
                    onChange={(e) => set("sellingPrice", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Purchase Price</label>
                  <input type="number" style={fi} placeholder="0"
                    key={"purch-" + modalKey} defaultValue={fd.purchasePrice}
                    onChange={(e) => set("purchasePrice", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Promo Price</label>
                  <input type="number" style={fi} placeholder="0"
                    key={"promo-" + modalKey} defaultValue={fd.promoPrice}
                    onChange={(e) => set("promoPrice", e.target.value)} />
                </div>
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea style={{ ...fi, minHeight: "80px", resize: "vertical" }}
                  placeholder="Describe this vehicle..."
                  key={"desc-" + modalKey} defaultValue={fd.description}
                  onChange={(e) => set("description", e.target.value)} />
              </div>

              <div className="modal-section-title">PHOTOS ({images.length}/10) — first photo is the main display image</div>
              <div className="media-grid">
                {images.map((url, idx) => (
                  <div key={idx} className="media-thumb">
                    <img src={url} alt="" className="media-thumb-img" />
                    <button className="media-remove" onClick={() => removeImage(idx)} title="Remove">X</button>
                    {idx === 0 && <div className="media-main-badge">MAIN</div>}
                  </div>
                ))}
                {images.length < 10 && (
                  <button className="media-add-btn"
                    onClick={() => imgInputRef.current?.click()} disabled={uploading}>
                    {uploading && uploadProgress.includes("photo") ? "Uploading..." : "+ Add Photo"}
                  </button>
                )}
              </div>
              <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                multiple style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.length) handleImgFiles(e.target.files); }} />
              <p className="media-hint">Max 10 photos. JPG, PNG, WebP accepted.</p>

              <div className="modal-section-title">VIDEO (optional — max 30 seconds, 50MB)</div>
              {video ? (
                <div className="video-preview">
                  <video src={video} controls className="video-player" />
                  <button className="media-remove-video" onClick={removeVideo}>Remove Video</button>
                </div>
              ) : (
                <button className="media-add-btn media-video-btn"
                  onClick={() => vidInputRef.current?.click()} disabled={uploading}>
                  {uploading && uploadProgress.includes("video") ? "Uploading video..." : "Upload Video (max 30s)"}
                </button>
              )}
              <input ref={vidInputRef} type="file"
                accept="video/mp4,video/quicktime,video/avi,video/webm"
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.[0]) handleVideoFile(e.target.files[0]); }} />

            </div>

            <div className="modal-footer">
              <button className="modal-cancel" onClick={closeModal}>Cancel</button>
              <button className="modal-save" onClick={handleSave} disabled={saving || uploading}>
                {saving ? "Saving..." : modal === "add" ? "ADD CAR" : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cars-page { display:flex; flex-direction:column; gap:1.25rem; }
        .cp-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .cp-title { font-family:var(--font-display); font-size:1.6rem; color:#1A1A1A; letter-spacing:0.04em; line-height:1; }
        .cp-sub { font-size:0.8rem; color:#737373; margin-top:0.25rem; }
        .cp-add-btn { background:#F47B20; color:#fff; border:none; border-radius:8px; padding:0.7rem 1.25rem; font-family:var(--font-display); font-size:0.875rem; letter-spacing:0.08em; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:background 0.2s; }
        .cp-add-btn:hover { background:#FF9340; }
        .cp-filters { display:flex; flex-direction:column; gap:0.75rem; }
        .cp-search { background:#fff; border:1.5px solid #E5E5E5; border-radius:8px; padding:0.7rem 1rem; color:#1A1A1A; font-size:0.875rem; font-family:var(--font-body); outline:none; width:100%; box-sizing:border-box; transition:border-color 0.2s; }
        .cp-search:focus { border-color:#F47B20; }
        .cp-status-tabs { display:flex; gap:0.35rem; flex-wrap:wrap; }
        .cp-stab { background:#fff; border:1.5px solid #E5E5E5; border-radius:20px; padding:0.3rem 0.875rem; color:#737373; font-size:0.75rem; cursor:pointer; font-family:var(--font-body); transition:all 0.15s; text-transform:capitalize; white-space:nowrap; }
        .cp-stab:hover { border-color:#F47B20; color:#F47B20; }
        .cp-stab.active { background:#F47B20; color:#fff; border-color:#F47B20; }
        .cp-loading { display:flex; align-items:center; justify-content:center; padding:3rem; }
        .cp-spinner { width:28px; height:28px; border:2.5px solid #E5E5E5; border-top-color:#F47B20; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .cp-empty { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:3rem; background:#fff; border:1.5px solid #E5E5E5; border-radius:12px; text-align:center; }
        .cp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1rem; }
        .cp-card { background:#fff; border:1.5px solid #E5E5E5; border-radius:12px; overflow:hidden; transition:border-color 0.2s; }
        .cp-card:hover { border-color:#F47B20; }
        .cp-img-wrap { height:160px; background:#F5F5F5; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .cp-img { width:100%; height:100%; object-fit:cover; }
        .cp-img-ph { font-size:0.8rem; color:#A3A3A3; font-weight:600; }
        .cp-status-badge { position:absolute; top:0.5rem; left:0.5rem; color:#fff; font-size:0.62rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:20px; text-transform:capitalize; }
        .cp-img-count { position:absolute; bottom:0.5rem; right:0.5rem; background:rgba(0,0,0,0.5); color:#fff; font-size:0.62rem; padding:0.15rem 0.5rem; border-radius:4px; }
        .cp-card-body { padding:0.875rem; display:flex; flex-direction:column; gap:0.3rem; }
        .cp-car-name { font-weight:700; font-size:0.9rem; color:#1A1A1A; }
        .cp-car-id { font-size:0.68rem; color:#A3A3A3; font-family:monospace; }
        .cp-car-meta { font-size:0.72rem; color:#737373; text-transform:capitalize; }
        .cp-car-price { font-family:var(--font-display); font-size:1.1rem; color:#F47B20; margin-top:0.2rem; font-weight:700; }
        .cp-card-actions { display:flex; gap:0.5rem; margin-top:0.5rem; padding-top:0.625rem; border-top:1px solid #F5F5F5; }
        .cp-edit-btn { flex:1; background:#FFF7ED; border:1.5px solid rgba(244,123,32,0.3); color:#F47B20; border-radius:6px; padding:0.5rem; font-size:0.78rem; cursor:pointer; font-family:var(--font-body); transition:all 0.2s; }
        .cp-edit-btn:hover { background:#F47B20; color:#fff; }
        .cp-del-btn { background:#FEF2F2; border:1.5px solid rgba(220,38,38,0.2); color:#DC2626; border-radius:6px; padding:0.5rem 0.75rem; font-size:0.78rem; cursor:pointer; font-family:var(--font-body); transition:all 0.2s; }
        .cp-del-btn:hover { background:#DC2626; color:#fff; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:flex-start; justify-content:center; z-index:1000; padding:1rem; overflow-y:auto; }
        .modal-box { background:#fff; border-radius:16px; width:100%; max-width:680px; margin:auto; display:flex; flex-direction:column; max-height:90vh; overflow:hidden; box-shadow:0 16px 48px rgba(0,0,0,0.2); }
        .modal-hdr { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1.5px solid #F5F5F5; flex-shrink:0; }
        .modal-ttl { font-family:var(--font-display); font-size:1.2rem; letter-spacing:0.06em; color:#1A1A1A; }
        .modal-x { background:#F5F5F5; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:0.875rem; color:#737373; display:flex; align-items:center; justify-content:center; }
        .modal-x:hover { background:#E5E5E5; }
        .modal-err { margin:0.75rem 1.5rem 0; padding:0.75rem 1rem; background:#FEF2F2; border:1px solid #FCA5A5; color:#DC2626; border-radius:8px; font-size:0.825rem; flex-shrink:0; }
        .modal-progress { margin:0.75rem 1.5rem 0; padding:0.75rem 1rem; background:#FFF7ED; border:1px solid rgba(244,123,32,0.3); color:#F47B20; border-radius:8px; font-size:0.825rem; flex-shrink:0; }
        .modal-body { padding:1.5rem; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:1.25rem; }
        .modal-section-title { font-family:var(--font-display); font-size:0.68rem; letter-spacing:0.15em; color:#A3A3A3; border-bottom:1px solid #F5F5F5; padding-bottom:0.5rem; }
        .modal-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .modal-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; }
        .modal-col2 { grid-column:span 2; }
        .modal-footer { display:flex; gap:0.75rem; padding:1.25rem 1.5rem; border-top:1.5px solid #F5F5F5; flex-shrink:0; background:#FAFAFA; }
        .modal-cancel { background:#fff; border:1.5px solid #E5E5E5; color:#525252; border-radius:8px; padding:0.875rem 1.5rem; font-family:var(--font-body); font-size:0.875rem; cursor:pointer; }
        .modal-save { flex:1; background:#F47B20; color:#fff; border:none; border-radius:8px; padding:0.875rem; font-family:var(--font-display); font-size:0.95rem; letter-spacing:0.08em; cursor:pointer; transition:background 0.2s; }
        .modal-save:hover { background:#FF9340; }
        .modal-save:disabled { opacity:0.6; cursor:not-allowed; }
        .media-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(90px,1fr)); gap:0.625rem; }
        .media-thumb { position:relative; aspect-ratio:4/3; border-radius:8px; overflow:hidden; border:1.5px solid #E5E5E5; }
        .media-thumb-img { width:100%; height:100%; object-fit:cover; display:block; }
        .media-remove { position:absolute; top:3px; right:3px; background:rgba(220,38,38,0.85); color:#fff; border:none; border-radius:50%; width:22px; height:22px; font-size:0.65rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:700; }
        .media-remove:hover { background:#DC2626; }
        .media-main-badge { position:absolute; bottom:3px; left:3px; background:#F47B20; color:#fff; font-size:0.52rem; font-weight:800; padding:0.1rem 0.35rem; border-radius:3px; letter-spacing:0.06em; }
        .media-add-btn { aspect-ratio:4/3; background:#F5F5F5; border:1.5px dashed #D4D4D4; border-radius:8px; color:#737373; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:var(--font-body); transition:all 0.2s; text-align:center; padding:0.5rem; }
        .media-add-btn:hover:not(:disabled) { border-color:#F47B20; color:#F47B20; background:#FFF7ED; }
        .media-add-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .media-video-btn { aspect-ratio:unset; padding:1.25rem; width:100%; }
        .media-hint { font-size:0.72rem; color:#A3A3A3; margin-top:0.25rem; }
        .video-preview { display:flex; flex-direction:column; gap:0.75rem; }
        .video-player { width:100%; max-height:220px; border-radius:8px; background:#000; }
        .media-remove-video { background:none; border:1.5px solid #FCA5A5; color:#DC2626; border-radius:6px; padding:0.5rem 1rem; font-size:0.8rem; cursor:pointer; font-family:var(--font-body); align-self:flex-start; transition:all 0.2s; }
        .media-remove-video:hover { background:#DC2626; color:#fff; border-color:#DC2626; }
        @media(max-width:768px) {
          .modal-overlay { padding:0; align-items:flex-end; }
          .modal-box { border-radius:20px 20px 0 0; max-height:92vh; }
          .modal-grid2 { grid-template-columns:1fr; }
          .modal-grid3 { grid-template-columns:1fr 1fr; }
          .modal-col2 { grid-column:span 1; }
          .cp-grid { grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); }
        }
        @media(max-width:480px) {
          .modal-body { padding:1rem; }
          .modal-hdr, .modal-footer { padding:1rem; }
          .cp-grid { grid-template-columns:1fr 1fr; }
          .cp-status-tabs { gap:0.25rem; }
          .cp-stab { padding:0.25rem 0.6rem; font-size:0.68rem; }
          .media-grid { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>
    </div>
  );
}
