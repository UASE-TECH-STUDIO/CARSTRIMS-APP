"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const ALL_PERMISSIONS = [
  { key:"view_inventory",label:"View Inventory" },{ key:"add_cars",label:"Add Cars" },
  { key:"edit_cars",label:"Edit Cars" },{ key:"delete_cars",label:"Delete Cars" },
  { key:"view_sales",label:"View Sales" },{ key:"record_sales",label:"Record Sales" },
  { key:"view_staff",label:"View Staff" },{ key:"create_staff",label:"Create Staff" },
  { key:"view_partners",label:"View Partners" },{ key:"manage_partners",label:"Manage Partners" },
  { key:"view_cctv",label:"View CCTV" },{ key:"view_movements",label:"View Movements" },
  { key:"manage_movements",label:"Manage Movements" },{ key:"view_reports",label:"View Reports" },
];

const emptyForm = {
  fullName:"", username:"", email:"", phone:"", whatsapp:"",
  address:"", position:"", password:"Staff@1234", permissions:[] as string[],
};

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showPerms, setShowPerms] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ fullName:"", phone:"", whatsapp:"", address:"", position:"" });
  const [perms, setPerms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params: any = { skip:0, limit:50 };
      if (search) params.search = search;
      const res = await api.get("/api/v1/staff/", { params });
      setStaff(res.data.staff);
      setTotal(res.data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, [search]);

  const togglePerm = (key: string, list: string[], setList: (l: string[]) => void) =>
    setList(list.includes(key) ? list.filter((p) => p !== key) : [...list, key]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const res = await api.post("/api/v1/staff/", form);
      setSuccessMsg(`Staff created! Temp password: ${res.data.tempPassword}`);
      setShowAdd(false); setForm(emptyForm); fetchStaff();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.patch(`/api/v1/staff/${showEdit.staffId}`, editForm);
      setShowEdit(null); fetchStaff();
    } catch { } finally { setSubmitting(false); }
  };

  const handleUpdatePerms = async () => {
    if (!showPerms) return; setSubmitting(true);
    try {
      await api.patch(`/api/v1/staff/${showPerms.staffId}/permissions`, { permissions: perms });
      setShowPerms(null); fetchStaff();
    } catch { } finally { setSubmitting(false); }
  };

  const handleToggleSuspend = async (staffId: string) => {
    try { await api.post(`/api/v1/staff/${staffId}/toggle-suspend`); fetchStaff(); }
    catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm("Remove this staff member?")) return;
    try { await api.delete(`/api/v1/staff/${staffId}`); fetchStaff(); }
    catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="staff-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Staff Management</h2>
          <p className="page-sub">{total} team member{total!==1?"s":""}</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAdd(true); setError(""); setSuccessMsg(""); }}>+ Add Staff</button>
      </div>

      {successMsg && (
        <div className="success-banner">{successMsg}<button onClick={() => setSuccessMsg("")} className="dismiss">✕</button></div>
      )}

      <div className="filters">
        <input className="search-input" placeholder="Search name, email, position..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div>
      : staff.length === 0 ? (
        <div className="empty"><div className="ei">👥</div><h3>No staff yet</h3><p>Add your first team member</p></div>
      ) : (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr><th>Name</th><th>Position</th><th>Contact</th><th>Permissions</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id}>
                  <td>
                    <button className="staff-name-btn" onClick={() => setShowDetail(s)}>{s.fullName}</button>
                    <div className="staff-id">{s.staffId}</div>
                  </td>
                  <td><span className="pos-badge">{s.position}</span></td>
                  <td>
                    <div className="contact-email">{s.email}</div>
                    <div className="contact-phone">{s.phone}</div>
                  </td>
                  <td>
                    <button className="perms-btn" onClick={() => { setShowPerms(s); setPerms(s.permissions||[]); }}>
                      {s.permissions?.length||0} permissions
                    </button>
                  </td>
                  <td><span className={`status-pill ${s.status}`}>{s.status}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="act-sm" onClick={() => { setShowEdit(s); setEditForm({ fullName:s.fullName, phone:s.phone||"", whatsapp:s.whatsapp||"", address:s.address||"", position:s.position }); }}>Edit</button>
                      <button className="act-sm" onClick={() => handleToggleSuspend(s.staffId)}>
                        {s.status==="suspended"?"Activate":"Suspend"}
                      </button>
                      <button className="act-sm danger" onClick={() => handleDelete(s.staffId)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD STAFF */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">ADD STAFF MEMBER</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleAddStaff} className="modal-form">
              <div className="form-row">
                <div className="field"><label className="fl">Full Name *</label><input className="fi" value={form.fullName} onChange={(e) => setForm({...form,fullName:e.target.value})} required /></div>
                <div className="field"><label className="fl">Username *</label><input className="fi" value={form.username} onChange={(e) => setForm({...form,username:e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Email *</label><input type="email" className="fi" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} required /></div>
                <div className="field"><label className="fl">Phone *</label><input className="fi" value={form.phone} onChange={(e) => setForm({...form,phone:e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Position *</label><input className="fi" placeholder="Sales Manager" value={form.position} onChange={(e) => setForm({...form,position:e.target.value})} required /></div>
                <div className="field"><label className="fl">Temp Password</label><input className="fi" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} /></div>
              </div>
              <div className="field">
                <label className="fl">Permissions</label>
                <div className="perms-grid">
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p.key} className="perm-item">
                      <input type="checkbox" checked={form.permissions.includes(p.key)}
                        onChange={() => togglePerm(p.key,form.permissions,(l)=>setForm({...form,permissions:l}))} />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Creating...":"Create Staff"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">EDIT STAFF — {showEdit.fullName}</h3>
              <button className="modal-close" onClick={() => setShowEdit(null)}>✕</button>
            </div>
            <form onSubmit={handleEditStaff} className="modal-form">
              <div className="form-row">
                <div className="field"><label className="fl">Full Name</label><input className="fi" value={editForm.fullName} onChange={(e) => setEditForm({...editForm,fullName:e.target.value})} /></div>
                <div className="field"><label className="fl">Position</label><input className="fi" value={editForm.position} onChange={(e) => setEditForm({...editForm,position:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Phone</label><input className="fi" value={editForm.phone} onChange={(e) => setEditForm({...editForm,phone:e.target.value})} /></div>
                <div className="field"><label className="fl">WhatsApp</label><input className="fi" value={editForm.whatsapp} onChange={(e) => setEditForm({...editForm,whatsapp:e.target.value})} /></div>
              </div>
              <div className="field"><label className="fl">Address</label><input className="fi" value={editForm.address} onChange={(e) => setEditForm({...editForm,address:e.target.value})} /></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowEdit(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Saving...":"Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMISSIONS */}
      {showPerms && (
        <div className="modal-overlay" onClick={() => setShowPerms(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">PERMISSIONS — {showPerms.fullName}</h3>
              <button className="modal-close" onClick={() => setShowPerms(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="perms-grid">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.key} className="perm-item">
                    <input type="checkbox" checked={perms.includes(p.key)}
                      onChange={() => togglePerm(p.key,perms,setPerms)} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowPerms(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleUpdatePerms} disabled={submitting}>{submitting?"Saving...":"Save Permissions"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAFF DETAIL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">STAFF DETAILS</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="detail-avatar">{showDetail.fullName?.charAt(0).toUpperCase()}</div>
              {[
                { label:"Full Name", val:showDetail.fullName },
                { label:"Staff ID", val:showDetail.staffId },
                { label:"Position", val:showDetail.position },
                { label:"Email", val:showDetail.email },
                { label:"Phone", val:showDetail.phone||"—" },
                { label:"WhatsApp", val:showDetail.whatsapp||"—" },
                { label:"Address", val:showDetail.address||"—" },
                { label:"Status", val:showDetail.status },
              ].map((row) => (
                <div key={row.label} className="detail-row">
                  <span className="dr-label">{row.label}</span>
                  <span className="dr-val">{row.val}</span>
                </div>
              ))}
              <div className="detail-perms">
                <div className="dp-title">Permissions ({showDetail.permissions?.length||0})</div>
                <div className="dp-list">
                  {showDetail.permissions?.length>0
                    ? showDetail.permissions.map((p: string) => <span key={p} className="dp-chip">{p.replace(/_/g," ")}</span>)
                    : <span className="dp-none">No permissions assigned</span>
                  }
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => { setShowDetail(null); setShowEdit(showDetail); setEditForm({ fullName:showDetail.fullName, phone:showDetail.phone||"", whatsapp:showDetail.whatsapp||"", address:showDetail.address||"", position:showDetail.position }); }}>Edit Details</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .staff-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap}
        .btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer}
        .btn-outline:hover{border-color:#F47B20;color:#F47B20}
        .success-banner{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .dismiss{background:none;border:none;color:inherit;cursor:pointer;font-size:0.875rem}
        .filters{display:flex;gap:1rem}
        .search-input{background:#fff;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:300px}
        .search-input:focus{border-color:#F47B20}
        .search-input::placeholder{color:#CCC}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}
        .empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}
        .empty p{color:#888;font-size:0.875rem}
        .staff-table-wrap{overflow-x:auto;border:1.5px solid #E5E5E5;border-radius:10px;background:#fff}
        .staff-table{width:100%;border-collapse:collapse;min-width:750px}
        .staff-table th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888;background:#FAFAFA;border-bottom:1.5px solid #E5E5E5}
        .staff-table td{padding:0.875rem 1rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem;color:#1A1A1A;vertical-align:middle}
        .staff-table tr:last-child td{border-bottom:none}
        .staff-table tr:hover td{background:#FFFAF5}
        .staff-name-btn{background:none;border:none;font-weight:600;font-size:0.875rem;color:#F47B20;cursor:pointer;text-align:left;font-family:var(--font-body);padding:0;transition:opacity 0.2s}
        .staff-name-btn:hover{opacity:0.7;text-decoration:underline}
        .staff-id{font-family:var(--font-mono);font-size:0.68rem;color:#AAA;margin-top:0.1rem}
        .pos-badge{background:#FFF7ED;color:#F47B20;border:1px solid #F47B20;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.72rem;font-weight:500}
        .contact-email{font-size:0.82rem;color:#1A1A1A}
        .contact-phone{font-size:0.75rem;color:#888;margin-top:0.1rem}
        .perms-btn{background:#F5F5F5;border:1px solid #DDD;border-radius:5px;padding:0.3rem 0.7rem;color:#666;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
        .perms-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .status-pill{padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:500;text-transform:capitalize}
        .status-pill.active{background:#F0FDF4;color:#16A34A;border:1px solid rgba(22,163,74,0.3)}
        .status-pill.suspended{background:#FEF2F2;color:#DC2626;border:1px solid rgba(220,38,38,0.3)}
        .action-row{display:flex;gap:0.3rem;flex-wrap:wrap}
        .act-sm{background:#F5F5F5;border:1px solid #DDD;border-radius:4px;padding:0.25rem 0.6rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s}
        .act-sm:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .act-sm.danger:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-sm{max-width:460px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .perms-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
        .perm-item{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;border:1px solid #E5E5E5;border-radius:6px;cursor:pointer;font-size:0.8rem;color:#555;transition:all 0.15s}
        .perm-item:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .perm-item input{accent-color:#F47B20;cursor:pointer}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        .detail-avatar{width:56px;height:56px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:1.5rem;display:flex;align-items:center;justify-content:center;margin:0 auto}
        .detail-row{display:flex;align-items:center;gap:1rem;padding:0.5rem 0;border-bottom:1px solid #F0F0F0}
        .detail-row:last-of-type{border-bottom:none}
        .dr-label{font-size:0.72rem;color:#AAA;text-transform:uppercase;letter-spacing:0.06em;min-width:90px}
        .dr-val{font-size:0.825rem;color:#1A1A1A;flex:1}
        .detail-perms{background:#FAFAFA;border:1px solid #E5E5E5;border-radius:8px;padding:0.875rem}
        .dp-title{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:0.5rem}
        .dp-list{display:flex;flex-wrap:wrap;gap:0.35rem}
        .dp-chip{background:#FFF7ED;border:1px solid #F47B20;color:#F47B20;font-size:0.68rem;padding:0.15rem 0.5rem;border-radius:20px;text-transform:capitalize}
        .dp-none{font-size:0.825rem;color:#AAA}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
