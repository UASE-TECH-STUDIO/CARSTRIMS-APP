"use client";
import NotificationSettings from "@/components/ui/NotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function UserProfilePage() {
  const { user } = useAuthStore();
  const [me, setMe] = useState<any>(null);
  const [form, setForm] = useState({ fullName:"", phone:"", whatsapp:"", address:"", city:"", state:"" });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [pwSaving, setPwSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showBigPic, setShowBigPic] = useState(false);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMe = async () => {
    try {
      const r = await api.get("/api/v1/auth/me");
      setMe(r.data);
      setForm({ fullName:r.data.fullName||"", phone:r.data.phone||"", whatsapp:r.data.whatsapp||"", address:r.data.address||"", city:r.data.city||"", state:r.data.state||"" });
    } catch { }
  };

  useEffect(() => { loadMe(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr(""); setMsg("");
    try {
      await api.patch("/api/v1/users/profile", form);
      setMsg("Profile updated!"); loadMe();
    } catch (err: any) { setErr(err.response?.data?.detail||"Failed"); }
    finally { setSaving(false); }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { setErr("Passwords don't match"); return; }
    setPwSaving(true); setErr(""); setMsg("");
    try {
      await api.post("/api/v1/auth/change-password", { currentPassword:pw.currentPassword, newPassword:pw.newPassword });
      setMsg("Password changed!"); setPw({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (err: any) { setErr(err.response?.data?.detail||"Failed"); }
    finally { setPwSaving(false); }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true); setErr(""); setMsg("");
    const fd = new FormData(); fd.append("file", file);
    try {
      await api.post("/api/v1/upload/profile/picture", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setMsg("Photo updated!"); loadMe();
    } catch (err: any) { setErr(err.response?.data?.detail||"Upload failed"); }
    finally { setUploading(false); }
  };

  const removePhoto = async () => {
    if (!confirm("Remove profile picture?")) return;
    try { await api.patch("/api/v1/users/profile", { profilePicture: null }); setMsg("Photo removed"); loadMe(); }
    catch { }
  };

  return (
    <div className="profile-page">
      <h2 className="page-heading">My Profile</h2>

      {msg && <div className="success">{msg}<button onClick={()=>setMsg("")} className="dis">✕</button></div>}
      {err && <div className="error">{err}<button onClick={()=>setErr("")} className="dis">✕</button></div>}

      <div className="cards">
        {/* Picture */}
        <div className="card">
          <div className="ct">PROFILE PICTURE</div>
          <div className="pic-center">
            <div className="pic-wrap">
              {me?.profilePicture
                ? <img src={me.profilePicture} alt="" className="pic-img" onClick={() => setShowBigPic(true)} />
                : <div className="pic-placeholder" onClick={() => fileRef.current?.click()}>
                    {(me?.fullName||user?.fullName||"U").charAt(0).toUpperCase()}
                  </div>
              }
              <div className="pic-overlay" onClick={() => fileRef.current?.click()}>
                {uploading?"Uploading...":"Change Photo"}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadPhoto(f); }} />
            <div className="pic-actions">
              <button className="pic-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading?"Uploading...":"📷 Upload Photo"}
              </button>
              {me?.profilePicture && (
                <>
                  <button className="pic-btn view" onClick={() => setShowBigPic(true)}>👁 View</button>
                  <button className="pic-btn remove" onClick={removePhoto}>✕ Remove</button>
                </>
              )}
            </div>
          </div>
          <div className="profile-name">{me?.fullName||"—"}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-role">Customer Account</div>
          <div className="info-list">
            <div className="info-row"><span className="il">Phone</span><span className="iv">{me?.phone||"—"}</span></div>
            <div className="info-row"><span className="il">City</span><span className="iv">{me?.city||"—"}</span></div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card wide">
          <div className="ct">PERSONAL INFORMATION</div>
          <form onSubmit={save} className="form">
            <div className="row">
              <div className="field"><label className="fl">Full Name</label><input className="fi" value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})}/></div>
              <div className="field"><label className="fl">Phone</label><input className="fi" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></div>
            </div>
            <div className="row">
              <div className="field"><label className="fl">WhatsApp</label><input className="fi" value={form.whatsapp} onChange={(e)=>setForm({...form,whatsapp:e.target.value})}/></div>
              <div className="field"><label className="fl">Address</label><input className="fi" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}/></div>
            </div>
            <div className="row">
              <div className="field"><label className="fl">City</label><input className="fi" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></div>
              <div className="field"><label className="fl">State</label><input className="fi" value={form.state} onChange={(e)=>setForm({...form,state:e.target.value})}/></div>
            </div>
            <div className="field"><label className="fl">Email (contact support to change)</label><input className="fi" value={user?.email||""} disabled style={{opacity:0.5,cursor:"not-allowed"}}/></div>
            <button type="submit" className="save-btn" disabled={saving}>{saving?"Saving...":"Save Profile"}</button>
          </form>
        </div>

        {/* Password */}
        <div className="card">
          <div className="ct">CHANGE PASSWORD</div>
          <form onSubmit={changePw} className="form">
            <div className="field"><label className="fl">Current Password</label><input type="password" className="fi" value={pw.currentPassword} onChange={(e)=>setPw({...pw,currentPassword:e.target.value})} required/></div>
            <div className="field"><label className="fl">New Password</label><input type="password" className="fi" value={pw.newPassword} onChange={(e)=>setPw({...pw,newPassword:e.target.value})} required/></div>
            <div className="field"><label className="fl">Confirm</label><input type="password" className="fi" value={pw.confirmPassword} onChange={(e)=>setPw({...pw,confirmPassword:e.target.value})} required/></div>
            <button type="submit" className="save-btn" disabled={pwSaving}>{pwSaving?"Changing...":"Change Password"}</button>
          </form>
        </div>
      </div>

      {/* Big Pic Modal */}
      {showBigPic && me?.profilePicture && (
        <div className="big-pic-overlay" onClick={() => setShowBigPic(false)}>
          <div className="big-pic-modal" onClick={(e) => e.stopPropagation()}>
            <button className="big-close" onClick={() => setShowBigPic(false)}>✕</button>
            <img src={me.profilePicture} alt="Profile" className="big-pic-img" />
            <div className="big-pic-name">{me.fullName}</div>
            <div className="big-pic-actions">
              <button className="pic-btn" onClick={() => { setShowBigPic(false); fileRef.current?.click(); }}>Change Photo</button>
              <button className="pic-btn remove" onClick={() => { setShowBigPic(false); removePhoto(); }}>Remove Photo</button>
            </div>
          </div>
        </div>
      )}

      <NotificationSettings />
      <div className="dev-footer">Powered by <strong>UASE TECH STUDIO</strong> for CARSTRIMS 2026</div>

      <style>{`
        .profile-page{display:flex;flex-direction:column;gap:1.25rem;padding-bottom:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A}
        .success{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A;padding:0.75rem 1rem;border-radius:6px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .error{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:6px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .dis{background:none;border:none;color:inherit;cursor:pointer}
        .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem}
        .card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:0.875rem}
        .card.wide{grid-column:1/-1}
        .ct{font-family:var(--font-display);font-size:0.72rem;letter-spacing:0.15em;color:#888}
        .pic-center{display:flex;flex-direction:column;align-items:center;gap:0.625rem}
        .pic-wrap{position:relative;width:80px;height:80px;border-radius:50%;overflow:hidden;cursor:pointer;border:3px solid #F47B20}
        .pic-img{width:100%;height:100%;object-fit:cover;display:block}
        .pic-placeholder{width:80px;height:80px;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:2rem;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .pic-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);color:#fff;font-size:0.65rem;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s}
        .pic-wrap:hover .pic-overlay{opacity:1}
        .pic-actions{display:flex;gap:0.4rem;flex-wrap:wrap;justify-content:center}
        .pic-btn{background:#F5F5F5;border:1px solid #DDD;border-radius:5px;padding:0.3rem 0.7rem;font-size:0.72rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s}
        .pic-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .pic-btn.view:hover{border-color:#3B8BD4;color:#3B8BD4;background:#EFF6FF}
        .pic-btn.remove:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .pic-btn:disabled{opacity:0.5;cursor:not-allowed}
        .profile-name{font-family:var(--font-display);font-size:1.1rem;color:#1A1A1A;text-align:center}
        .profile-email{font-size:0.75rem;color:#888;text-align:center}
        .profile-role{font-size:0.7rem;color:#F47B20;text-align:center;text-transform:capitalize}
        .info-list{display:flex;flex-direction:column;gap:0.4rem}
        .info-row{display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #F0F0F0}
        .info-row:last-child{border-bottom:none}
        .il{font-size:0.75rem;color:#888}
        .iv{font-size:0.825rem;color:#1A1A1A}
        .form{display:flex;flex-direction:column;gap:0.875rem}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .save-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.75rem 1.5rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;align-self:flex-start}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed}
        .big-pic-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:2000;padding:1rem}
        .big-pic-modal{background:#fff;border-radius:12px;overflow:hidden;max-width:400px;width:100%;display:flex;flex-direction:column;align-items:center;gap:1rem;padding:1.5rem}
        .big-close{position:absolute;top:1rem;right:1rem;background:rgba(0,0,0,0.5);border:none;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem}
        .big-pic-img{width:200px;height:200px;border-radius:50%;object-fit:cover;border:4px solid #F47B20}
        .big-pic-name{font-family:var(--font-display);font-size:1.3rem;color:#1A1A1A}
        .big-pic-actions{display:flex;gap:0.5rem}
        .dev-footer{text-align:center;font-size:0.7rem;color:#CCC;padding:0.5rem}
        .dev-footer strong{color:#F47B20}
        @media(max-width:640px){.row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}


