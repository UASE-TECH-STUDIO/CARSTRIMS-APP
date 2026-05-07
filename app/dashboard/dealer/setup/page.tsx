"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import ImageUpload from "@/components/ui/ImageUpload";

const STEPS = [
  { num: 1, label: "Company Info" },
  { num: 2, label: "First Car" },
  { num: 3, label: "First Staff" },
  { num: 4, label: "CCTV Setup" },
  { num: 5, label: "Awaiting Approval" },
];

const PERMISSIONS = [
  "view_inventory","add_cars","edit_cars","view_sales","record_sales",
  "view_staff","view_partners","view_cctv","view_movements","view_reports",
];

export default function DealerSetupPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [carId, setCarId] = useState<string | null>(null);

  const [companyForm, setCompanyForm] = useState({
    companyName: "", phone: "", whatsapp: "",
    address: "", city: "", state: "", country: "Nigeria", description: "",
  });

  const [carForm, setCarForm] = useState({
    brand: "", model: "", year: new Date().getFullYear(), color: "",
    mileage: "", transmission: "automatic", fuelType: "petrol",
    condition: "used", description: "", state: "", city: "",
    purchasePrice: "", sellingPrice: "",
  });

  const [staffForm, setStaffForm] = useState({
    fullName: "", username: "", email: "", phone: "",
    position: "Manager", password: "Staff@1234",
    permissions: ["view_inventory","view_sales","add_cars"],
  });

  const [cctvForm, setCctvForm] = useState({
    cameraName: "", cameraLocation: "", streamUrl: "", streamType: "rtsp",
  });

  const togglePerm = (p: string) => {
    setStaffForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/v1/dealers/setup", {
        ...companyForm,
        logo: logoUrl || undefined,
      });
      setDealerId(res.data._id || res.data.dealerId);
      setStep(2);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes("already exists")) {
        setStep(2);
      } else {
        setError(err.response?.data?.detail || "Failed to save company info");
      }
    } finally { setLoading(false); }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/v1/cars/", {
        ...carForm,
        year: Number(carForm.year),
        mileage: carForm.mileage ? Number(carForm.mileage) : null,
        purchasePrice: Number(carForm.purchasePrice),
        sellingPrice: Number(carForm.sellingPrice),
      });
      setCarId(res.data.carId);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add car");
    } finally { setLoading(false); }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.post("/api/v1/staff/", staffForm);
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create staff");
    } finally { setLoading(false); }
  };

  const handleStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (cctvForm.cameraName && cctvForm.streamUrl) {
        await api.post("/api/v1/cctv/", cctvForm);
      }
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save CCTV");
    } finally { setLoading(false); }
  };

  const skipCCTV = () => setStep(5);

  const goToDashboard = () => router.push("/dashboard/dealer");

  return (
    <div className="setup-page">
      {/* Progress */}
      <div className="setup-header">
        <div className="setup-brand">◈ CARTRACK SETUP</div>
        <div className="step-track">
          {STEPS.map((s, i) => (
            <div key={s.num} className="step-item">
              <div className={`step-circle ${step > s.num ? "done" : step === s.num ? "active" : ""}`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <div className={`step-name ${step === s.num ? "active" : ""}`}>{s.label}</div>
              {i < STEPS.length - 1 && <div className={`step-line ${step > s.num ? "done" : ""}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="setup-body">
        {error && <div className="setup-error">{error}</div>}

        {/* STEP 1 — Company Info */}
        {step === 1 && (
          <div className="setup-card">
            <h2 className="setup-title">Company Information</h2>
            <p className="setup-sub">Tell us about your dealership</p>
            <form onSubmit={handleStep1} className="setup-form">
              <div className="field">
                <label className="field-label">Company Logo</label>
                <ImageUpload
                  endpoint="/api/v1/upload/dealer/logo"
                  currentImages={logoUrl ? [logoUrl] : []}
                  maxImages={1}
                  single
                  onSuccess={(imgs) => setLogoUrl(imgs[0] || "")}
                  label="Upload Company Logo"
                />
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Company Name *</label>
                  <input className="field-input" value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="field-label">Phone *</label>
                  <input className="field-input" value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">WhatsApp</label>
                  <input className="field-input" value={companyForm.whatsapp}
                    onChange={(e) => setCompanyForm({ ...companyForm, whatsapp: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Country</label>
                  <input className="field-input" value={companyForm.country}
                    onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Address *</label>
                <input className="field-input" value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">City</label>
                  <input className="field-input" value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">State</label>
                  <input className="field-input" value={companyForm.state}
                    onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Description</label>
                <textarea className="field-input field-textarea" rows={3} value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} />
              </div>
              <button type="submit" className="btn-next" disabled={loading}>
                {loading ? "Saving..." : "Continue →"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 — First Car */}
        {step === 2 && (
          <div className="setup-card">
            <h2 className="setup-title">Add Your First Vehicle</h2>
            <p className="setup-sub">List your first car on the platform</p>
            <form onSubmit={handleStep2} className="setup-form">
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Brand *</label>
                  <input className="field-input" placeholder="Toyota" value={carForm.brand}
                    onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="field-label">Model *</label>
                  <input className="field-input" placeholder="Camry" value={carForm.model}
                    onChange={(e) => setCarForm({ ...carForm, model: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Year *</label>
                  <input type="number" className="field-input" value={carForm.year}
                    onChange={(e) => setCarForm({ ...carForm, year: Number(e.target.value) })} required />
                </div>
                <div className="field">
                  <label className="field-label">Color *</label>
                  <input className="field-input" placeholder="Black" value={carForm.color}
                    onChange={(e) => setCarForm({ ...carForm, color: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Purchase Price (₦) *</label>
                  <input type="number" className="field-input" value={carForm.purchasePrice}
                    onChange={(e) => setCarForm({ ...carForm, purchasePrice: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="field-label">Selling Price (₦) *</label>
                  <input type="number" className="field-input" value={carForm.sellingPrice}
                    onChange={(e) => setCarForm({ ...carForm, sellingPrice: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Transmission</label>
                  <select className="field-input" value={carForm.transmission}
                    onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}>
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Condition</label>
                  <select className="field-input" value={carForm.condition}
                    onChange={(e) => setCarForm({ ...carForm, condition: e.target.value })}>
                    <option value="used">Used</option>
                    <option value="new">New</option>
                    <option value="foreign_used">Foreign Used</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">City</label>
                  <input className="field-input" value={carForm.city}
                    onChange={(e) => setCarForm({ ...carForm, city: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">State</label>
                  <input className="field-input" value={carForm.state}
                    onChange={(e) => setCarForm({ ...carForm, state: e.target.value })} />
                </div>
              </div>
              <div className="step-btns">
                <button type="button" className="btn-back" onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn-next" disabled={loading}>
                  {loading ? "Adding..." : "Add Car & Continue →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3 — First Staff */}
        {step === 3 && (
          <div className="setup-card">
            <h2 className="setup-title">Create First Staff Account</h2>
            <p className="setup-sub">Add your first team member with access permissions</p>
            <form onSubmit={handleStep3} className="setup-form">
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Full Name *</label>
                  <input className="field-input" value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="field-label">Username *</label>
                  <input className="field-input" value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Email *</label>
                  <input type="email" className="field-input" value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="field-label">Phone *</label>
                  <input className="field-input" value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Position</label>
                  <input className="field-input" value={staffForm.position}
                    onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Temp Password</label>
                  <input className="field-input" value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Permissions</label>
                <div className="perms-grid">
                  {PERMISSIONS.map((p) => (
                    <label key={p} className="perm-item">
                      <input type="checkbox" checked={staffForm.permissions.includes(p)}
                        onChange={() => togglePerm(p)} />
                      <span>{p.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="step-btns">
                <button type="button" className="btn-back" onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="btn-next" disabled={loading}>
                  {loading ? "Creating..." : "Create Staff & Continue →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4 — CCTV */}
        {step === 4 && (
          <div className="setup-card">
            <h2 className="setup-title">CCTV Setup</h2>
            <p className="setup-sub">Connect your security cameras (optional — can be done later)</p>
            <form onSubmit={handleStep4} className="setup-form">
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Camera Name</label>
                  <input className="field-input" placeholder="Main Gate"
                    value={cctvForm.cameraName}
                    onChange={(e) => setCctvForm({ ...cctvForm, cameraName: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Location</label>
                  <input className="field-input" placeholder="Front Entrance"
                    value={cctvForm.cameraLocation}
                    onChange={(e) => setCctvForm({ ...cctvForm, cameraLocation: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Stream URL</label>
                <input className="field-input" placeholder="rtsp://... or https://..."
                  value={cctvForm.streamUrl}
                  onChange={(e) => setCctvForm({ ...cctvForm, streamUrl: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">Stream Type</label>
                <select className="field-input" value={cctvForm.streamType}
                  onChange={(e) => setCctvForm({ ...cctvForm, streamType: e.target.value })}>
                  <option value="rtsp">RTSP</option>
                  <option value="hls">HLS</option>
                  <option value="ip">IP Camera</option>
                </select>
              </div>
              <div className="step-btns">
                <button type="button" className="btn-back" onClick={() => setStep(3)}>← Back</button>
                <button type="button" className="btn-skip" onClick={skipCCTV}>Skip for now</button>
                <button type="submit" className="btn-next" disabled={loading}>
                  {loading ? "Saving..." : "Save & Continue →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 5 — Pending Approval */}
        {step === 5 && (
          <div className="setup-card pending-card">
            <div className="pending-icon">⏳</div>
            <h2 className="setup-title">Setup Complete!</h2>
            <p className="setup-sub">
              Your account is under review by our team. You will receive full dashboard
              access once approved. This usually takes a few hours.
            </p>
            <div className="pending-checklist">
              <div className="check-item">✅ Company information saved</div>
              <div className="check-item">✅ First vehicle listed</div>
              <div className="check-item">✅ Staff account created</div>
              <div className="check-item">⏳ Awaiting admin approval</div>
            </div>
            <button className="btn-next" onClick={goToDashboard}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        .setup-page { min-height:100vh; background:var(--black); font-family:var(--font-body); }
        .setup-header { padding:1.5rem 2rem; border-bottom:1px solid var(--border); background:var(--surface); display:flex; flex-direction:column; gap:1.5rem; }
        .setup-brand { font-family:var(--font-display); font-size:1.1rem; letter-spacing:0.2em; color:var(--gold); }
        .step-track { display:flex; align-items:center; gap:0; overflow-x:auto; }
        .step-item { display:flex; align-items:center; gap:0; }
        .step-circle { width:32px; height:32px; border-radius:50%; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.8rem; color:var(--text-dim); background:var(--surface-2); flex-shrink:0; transition:all 0.3s; font-weight:600; }
        .step-circle.active { border-color:var(--gold); color:var(--gold); background:rgba(201,168,76,0.1); }
        .step-circle.done { border-color:var(--success); color:var(--success); background:rgba(76,175,130,0.1); }
        .step-name { font-size:0.72rem; color:var(--text-dim); margin-left:0.5rem; white-space:nowrap; }
        .step-name.active { color:var(--gold); }
        .step-line { width:40px; height:2px; background:var(--border); margin:0 0.5rem; flex-shrink:0; transition:background 0.3s; }
        .step-line.done { background:var(--success); }
        .setup-body { max-width:640px; margin:3rem auto; padding:0 1.5rem; }
        .setup-error { background:rgba(224,82,82,0.1); border:1px solid rgba(224,82,82,0.3); color:var(--error); padding:0.75rem 1rem; border-radius:8px; font-size:0.875rem; margin-bottom:1rem; }
        .setup-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:2rem; }
        .setup-title { font-family:var(--font-display); font-size:1.8rem; letter-spacing:0.05em; color:var(--text); margin-bottom:0.35rem; }
        .setup-sub { font-size:0.875rem; color:var(--text-muted); margin-bottom:1.5rem; }
        .setup-form { display:flex; flex-direction:column; gap:1rem; }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .field { display:flex; flex-direction:column; gap:0.4rem; }
        .field-label { font-size:0.7rem; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); }
        .field-input { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:0.75rem 1rem; color:var(--text); font-size:0.9rem; font-family:var(--font-body); outline:none; transition:border-color 0.2s; width:100%; }
        .field-input:focus { border-color:var(--gold); }
        .field-textarea { resize:vertical; min-height:80px; }
        .perms-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; }
        .perm-item { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; border:1px solid var(--border); border-radius:6px; cursor:pointer; font-size:0.8rem; color:var(--text-muted); text-transform:capitalize; }
        .perm-item:hover { border-color:var(--gold-dim); color:var(--text); }
        .perm-item input { accent-color:var(--gold); cursor:pointer; }
        .step-btns { display:flex; gap:0.75rem; margin-top:0.5rem; }
        .btn-next { flex:1; background:var(--gold); color:var(--black); border:none; border-radius:6px; padding:0.9rem; font-family:var(--font-display); font-size:1rem; letter-spacing:0.1em; cursor:pointer; transition:background 0.2s; }
        .btn-next:hover { background:var(--gold-light); }
        .btn-next:disabled { opacity:0.6; cursor:not-allowed; }
        .btn-back { background:transparent; color:var(--text-muted); border:1px solid var(--border); border-radius:6px; padding:0.9rem 1.25rem; font-family:var(--font-body); font-size:0.875rem; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .btn-back:hover { border-color:var(--gold-dim); color:var(--text); }
        .btn-skip { background:transparent; color:var(--text-dim); border:1px solid var(--border); border-radius:6px; padding:0.9rem 1.25rem; font-size:0.875rem; cursor:pointer; white-space:nowrap; font-family:var(--font-body); }
        .btn-skip:hover { color:var(--text-muted); }
        .pending-card { text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .pending-icon { font-size:3.5rem; }
        .pending-checklist { display:flex; flex-direction:column; gap:0.5rem; text-align:left; width:100%; background:var(--surface-2); border-radius:8px; padding:1rem; }
        .check-item { font-size:0.875rem; color:var(--text-muted); }
        @media(max-width:640px) { .form-row { grid-template-columns:1fr; } .step-name { display:none; } }
      `}</style>
    </div>
  );
}
