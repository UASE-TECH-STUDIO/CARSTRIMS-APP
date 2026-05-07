"use client";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function PartnerSettingsPage() {
  const { user } = useAuthStore();
  const [me, setMe] = useState<any>(null);
  const [form, setForm] = useState({ fullName:"", phone:"", whatsapp:"", address:"", city:"", state:"" });
  const [pw, setPw] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMe = async () => {
    try {
      const r = await api.get("/api/v1/auth/me");
      setMe(r.data);
      setForm({
        fullName: r.data.fullName||"", phone: r.data.phone||"",
        whatsapp: r.data.whatsapp||"", address: r.data.address||"",
        city: r.data.city||"", state: r.data.state||"",
      });
    } catch { }
  };

  useEffect(() => { loadMe(); }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr(""); setMsg("");
    try {
      await api.patch("/api/v1/users/profile", form);
      setMsg("Profile updated!"); loadMe();
    } catch (err: any) { setErr(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { setErr("Passwords don't match"); return; }
    setPwSaving(true); setErr(""); setMsg("");
    try {
      await api.post("/api/v1/auth/change-password", { currentPassword:pw.currentPassword, newPassword:pw.newPassword });
      setMsg("Password changed!"); setPw({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (err: any) { setErr(err.response?.data?.detail || "Failed"); }
    finally { setPwSaving(false); }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true); setErr(""); setMsg("");
    const fd = new FormData(); fd.append("file", file);
    try {
      await api.post("/api/v1/upload/profile/picture", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setMsg("Profile photo updated!"); loadMe();
    } catch (err: any) { setErr(err.response?.data?.detail || "Upload failed"); }
    finally { setUploading(false); }
  };

  const removePhoto = async () => {
    if (!confirm("Remove profile picture?")) return;
    try {
      await api.patch("/api/v1/users/profile", { profilePicture: null });
      setMsg("Photo removed"); loadMe();
    } catch { }
  };

  return (
    <div className="settings">
      <h2 className="page-heading">My Settings</h2>
      <p className="page-sub">Manage your partner account</p>

      {msg && <div className="success-banner">✅ {msg}<button onClick={()=>setMsg("")} className="dismiss">✕</button></div>}
      {err && <div className="error-banner">❌ {err}<button onClick={()=>setErr("")} className="dismiss">✕</button></div>}

      <div className="settings-grid">
        {/* Photo + Info */}
        <div className="settings-card">
          <div className="card-title">PROFILE PHOTO</div>
          <div className="photo-section">
            <div className="photo-wrap" onClick={() => fileRef.current?.click()}>
              {me?.profilePicture
                ? <img src={me.profilePicture} alt="" className="photo-img" />
                : <div className="photo-placeholder">{user?.fullName?.charAt(0).toUpperCase()||"P"}</div>
              }
              <div className="photo-overlay">{uploading?"Uploading...":"Change Photo"}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadPhoto(f); }} />
            {me?.profilePicture && (
              <button className="remove-photo-btn" onClick={removePhoto}>Remove</button>
            )}
          </div>
          <div className="info-name">{me?.fullName||"—"}</div>
          <div className="info-role">Partner Account</div>
          <div className="info-email">{user?.email}</div>

          <div className="info-list">
            <div className="info-row"><span className="il">User ID</span><span className="iv mono">{user?.userId?.slice(-8)||"—"}</span></div>
            <div className="info-row"><span className="il">Role</span><span className="iv">Partner</span></div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="settings-card wide">
          <div className="card-title">PERSONAL INFORMATION</div>
          <form onSubmit={saveProfile} className="form">
            <div className="form-row">
              <div className="field"><label className="fl">Full Name</label><input className="fi" value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} /></div>
              <div className="field"><label className="fl">Phone</label><input className="fi" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label className="fl">WhatsApp</label><input className="fi" value={form.whatsapp} onChange={(e)=>setForm({...form,whatsapp:e.target.value})} /></div>
              <div className="field"><label className="fl">Address</label><input className="fi" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label className="fl">City</label><input className="fi" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} /></div>
              <div className="field"><label className="fl">State</label><input className="fi" value={form.state} onChange={(e)=>setForm({...form,state:e.target.value})} /></div>
            </div>
            <button type="submit" className="save-btn" disabled={saving}>{saving?"Saving...":"Save Profile"}</button>
          </form>
        </div>

        {/* Password */}
        <div className="settings-card">
          <div className="card-title">CHANGE PASSWORD</div>
          <form onSubmit={changePw} className="form">
            <div className="field"><label className="fl">Current Password</label><input type="password" className="fi" value={pw.currentPassword} onChange={(e)=>setPw({...pw,currentPassword:e.target.value})} required /></div>
            <div className="field"><label className="fl">New Password</label><input type="password" className="fi" value={pw.newPassword} onChange={(e)=>setPw({...pw,newPassword:e.target.value})} required /></div>
            <div className="field"><label className="fl">Confirm</label><input type="password" className="fi" value={pw.confirmPassword} onChange={(e)=>setPw({...pw,confirmPassword:e.target.value})} required /></div>
            <button type="submit" className="save-btn" disabled={pwSaving}>{pwSaving?"Changing...":"Change Password"}</button>
          </form>
        </div>
      </div>

      <div className="dev-footer">Powered by <strong>UASE TECH STUDIO</strong> for CARSTRIMS 2026</div>

      <style>{`
        .settings{display:flex;flex-direction:column;gap:1.5rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A}
        .page-sub{font-size:0.875rem;color:#888}
        .success-banner{background:#EFF6FF;border:1px solid #3B8BD4;color:#1D4ED8;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .error-banner{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .dismiss{background:none;border:none;color:inherit;cursor:pointer}
        .settings-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem}
        .settings-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
        .settings-card.wide{grid-column:1/-1}
        .card-title{font-family:var(--font-display);font-size:0.75rem;letter-spacing:0.15em;color:#888}
        .photo-section{display:flex;flex-direction:column;align-items:center;gap:0.625rem}
        .photo-wrap{position:relative;width:80px;height:80px;border-radius:50%;overflow:hidden;cursor:pointer;border:3px solid #3B8BD4}
        .photo-img{width:100%;height:100%;object-fit:cover;display:block}
        .photo-placeholder{width:80px;height:80px;background:#3B8BD4;color:#fff;font-family:var(--font-display);font-size:2rem;display:flex;align-items:center;justify-content:center}
        .photo-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);color:#fff;font-size:0.65rem;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s}
        .photo-wrap:hover .photo-overlay{opacity:1}
        .remove-photo-btn{background:transparent;border:1px solid #DDD;color:#DC2626;border-radius:5px;padding:0.25rem 0.75rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body)}
        .info-name{font-family:var(--font-display);font-size:1.1rem;color:#1A1A1A;text-align:center}
        .info-role{font-size:0.78rem;color:#3B8BD4;text-align:center}
        .info-email{font-size:0.75rem;color:#888;text-align:center}
        .info-list{display:flex;flex-direction:column;gap:0.4rem;margin-top:0.5rem}
        .info-row{display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #F0F0F0}
        .info-row:last-child{border-bottom:none}
        .il{font-size:0.75rem;color:#888}
        .iv{font-size:0.825rem;color:#1A1A1A}
        .iv.mono{font-family:var(--font-mono);font-size:0.72rem}
        .form{display:flex;flex-direction:column;gap:0.875rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#3B8BD4;background:#fff}
        .save-btn{background:#3B8BD4;color:#fff;border:none;border-radius:6px;padding:0.75rem 1.5rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;align-self:flex-start;transition:opacity 0.2s}
        .save-btn:hover{opacity:0.85}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed}
        .dev-footer{text-align:center;font-size:0.7rem;color:#CCC;padding:1rem}
        .dev-footer strong{color:#3B8BD4}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
