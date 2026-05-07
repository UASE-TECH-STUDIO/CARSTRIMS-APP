"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const ALL_PERMISSIONS = [
  "view_inventory","add_cars","edit_cars","delete_cars",
  "view_sales","record_sales","view_staff","create_staff",
  "view_partners","manage_partners","view_cctv","view_movements",
  "manage_movements","view_reports",
];

export default function StaffStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ fullName:"", username:"", email:"", password:"Staff@1234", phone:"", position:"", permissions:[] as string[] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => setPerms(r.data.permissions||[])).catch(()=>{});
  }, []);

  const fetchStaff = () => {
    api.get("/api/v1/staff/", { params:{ limit:50 } })
      .then((r) => setStaff(r.data.staff||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };

  useEffect(() => {
    if (perms.includes("view_staff")) fetchStaff();
    else setLoading(false);
  }, [perms]);

  const togglePerm = (key: string) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const res = await api.post("/api/v1/staff/", form);
      setSuccess(`Staff created! Temp password: ${res.data.tempPassword}`);
      setShowAdd(false); setForm({ fullName:"", username:"", email:"", password:"Staff@1234", phone:"", position:"", permissions:[] });
      fetchStaff();
    } catch (err: any) { setError(err.response?.data?.detail||"Failed"); }
    finally { setSubmitting(false); }
  };

  const canView = perms.includes("view_staff");
  const canCreate = perms.includes("create_staff");

  if (!canView && !canCreate) return (
    <div style={{padding:"3rem",textAlign:"center",color:"#888"}}>
      <div style={{fontSize:"3rem"}}>🔒</div>
      <h3 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Access Restricted</h3>
      <p>You need <strong style={{color:"#1D9E75"}}>view_staff</strong> permission.</p>
    </div>
  );

  return (
    <div className="staff-mgmt">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Staff Members</h2>
          <p className="page-sub">{staff.length} member{staff.length!==1?"s":""}</p>
        </div>
        {canCreate && <button className="btn-primary" onClick={()=>{ setShowAdd(true); setError(""); }}>+ Add Staff</button>}
      </div>

      {success && <div className="success-banner">{success}<button onClick={()=>setSuccess("")} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",marginLeft:"1rem"}}>✕</button></div>}

      {loading ? <div className="loading"><div className="spinner" /></div>
      : staff.length === 0 ? (
        <div className="empty"><div className="ei">👥</div><h3>No staff found</h3></div>
      ) : (
        <div className="staff-table-wrap">
          <table className="t">
            <thead><tr><th>Name</th><th>Position</th><th>Staff ID</th><th>Email</th><th>Permissions</th><th>Status</th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id}>
                  <td className="bold">{s.fullName}</td>
                  <td><span className="pos-badge">{s.position}</span></td>
                  <td className="mono">{s.staffId}</td>
                  <td className="small">{s.email}</td>
                  <td><span className="perm-count">{s.permissions?.length||0} permissions</span></td>
                  <td><span className={`status ${s.status}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">ADD STAFF MEMBER</h3><button className="modal-close" onClick={()=>setShowAdd(false)}>✕</button></div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleAdd} className="modal-form">
              <div className="form-row">
                <div className="field"><label className="fl">Full Name *</label><input className="fi" value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} required /></div>
                <div className="field"><label className="fl">Username *</label><input className="fi" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Email *</label><input type="email" className="fi" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required /></div>
                <div className="field"><label className="fl">Phone</label><input className="fi" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Position *</label><input className="fi" value={form.position} onChange={(e)=>setForm({...form,position:e.target.value})} required /></div>
                <div className="field"><label className="fl">Temp Password</label><input className="fi" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} /></div>
              </div>
              <div className="field">
                <label className="fl">Permissions</label>
                <div className="perms-grid">
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p} className="perm-item">
                      <input type="checkbox" checked={form.permissions.includes(p)} onChange={()=>togglePerm(p)} />
                      <span>{p.replace(/_/g," ")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Creating...":"Create Staff"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .staff-mgmt{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-primary{background:#1D9E75;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer}
        .success-banner{background:#F0FDF4;border:1px solid #1D9E75;color:#166534;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .staff-table-wrap{overflow-x:auto;border:1.5px solid #E5E5E5;border-radius:10px;background:#fff}
        .t{width:100%;border-collapse:collapse;min-width:600px}
        .t th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888;background:#FAFAFA;border-bottom:1.5px solid #E5E5E5}
        .t td{padding:0.875rem 1rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem;color:#1A1A1A;vertical-align:middle}
        .t tr:last-child td{border-bottom:none}
        .t tr:hover td{background:#F0FDF4}
        .bold{font-weight:600}
        .mono{font-family:var(--font-mono);font-size:0.72rem;color:#AAA}
        .small{font-size:0.78rem;color:#888}
        .pos-badge{background:#F0FDF4;color:#1D9E75;border:1px solid rgba(29,158,117,0.3);padding:0.2rem 0.6rem;border-radius:20px;font-size:0.72rem}
        .perm-count{font-size:0.78rem;color:#888}
        .status{font-size:0.72rem;font-weight:500;text-transform:capitalize}
        .status.active{color:#1D9E75}
        .status.suspended{color:#DC2626}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#1D9E75;background:#fff}
        .perms-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.4rem}
        .perm-item{display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.65rem;border:1px solid #E5E5E5;border-radius:5px;cursor:pointer;font-size:0.78rem;color:#555;transition:all 0.15s}
        .perm-item:hover{border-color:#1D9E75;background:#F0FDF4}
        .perm-item input{accent-color:#1D9E75;cursor:pointer}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
