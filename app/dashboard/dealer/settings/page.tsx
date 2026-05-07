"use client";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import DealerQRCode from "@/components/ui/DealerQRCode";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);

  const [dealerForm, setDealerForm] = useState({
    description:"", phone:"", whatsapp:"", city:"", state:"",
    instagram:"", twitter:"", facebook:"", tiktok:"", youtube:"", website:"",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword:"", newPassword:"", confirmPassword:"",
  });

  const loadDealer = async () => {
    try {
      const res = await api.get("/api/v1/dealers/me");
      setDealer(res.data);
      setDealerForm({
        description: res.data.description||"",
        phone: res.data.phone||"",
        whatsapp: res.data.whatsapp||"",
        city: res.data.city||"",
        state: res.data.state||"",
        instagram: res.data.instagram||"",
        twitter: res.data.twitter||"",
        facebook: res.data.facebook||"",
        tiktok: res.data.tiktok||"",
        youtube: res.data.youtube||"",
        website: res.data.website||"",
      });
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadDealer(); }, []);

  const handleSaveDealer = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      await api.patch("/api/v1/dealers/me", dealerForm);
      setSuccess("Dealership info updated successfully!");
      loadDealer();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError("Passwords don't match"); return; }
    if (pwForm.newPassword.length < 8) { setError("Min 8 characters"); return; }
    setPwSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/api/v1/auth/change-password", {
        currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword,
      });
      setSuccess("Password changed successfully!");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (err: any) { setError(err.response?.data?.detail || "Failed"); }
    finally { setPwSaving(false); }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true); setError(""); setSuccess("");
    const fd = new FormData(); fd.append("file", file);
    try {
      await api.post("/api/v1/upload/dealer/logo", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setSuccess("Logo updated!");
      loadDealer();
    } catch (err: any) { setError(err.response?.data?.detail || "Upload failed"); }
    finally { setLogoUploading(false); }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Remove company logo?")) return;
    try {
      await api.patch("/api/v1/dealers/me", { logo: null });
      setSuccess("Logo removed");
      loadDealer();
    } catch { }
  };

  const isApproved = dealer?.status === "approved";

  if (loading) return <div className="loading"><div className="spinner" /><style>{`.loading{display:flex;align-items:center;justify-content:center;min-height:300px}.spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div className="settings-page">
      <h2 className="page-heading">Settings</h2>

      {success && <div className="success-banner">✅ {success}<button onClick={()=>setSuccess("")} className="dismiss">✕</button></div>}
      {error && <div className="error-banner">❌ {error}<button onClick={()=>setError("")} className="dismiss">✕</button></div>}

      <div className="settings-grid">
        {/* Company Logo */}
        <div className="settings-card">
          <h3 className="card-title">COMPANY LOGO</h3>
          <div className="logo-section">
            <div className="logo-display" onClick={() => logoRef.current?.click()}>
              {logoUploading ? (
                <div className="logo-uploading">Uploading...</div>
              ) : dealer?.logo ? (
                <img src={dealer.logo} alt="Logo" className="logo-img" />
              ) : (
                <div className="logo-placeholder">{dealer?.companyName?.charAt(0)||"C"}</div>
              )}
              <div className="logo-overlay">Click to change</div>
            </div>
            <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}}
              onChange={(e) => { const f=e.target.files?.[0]; if(f) handleLogoUpload(f); }} />
            {dealer?.logo && (
              <button className="remove-logo-btn" onClick={handleRemoveLogo}>Remove Logo</button>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="settings-card">
          <DealerQRCode />
        </div>

        {/* Locked Info */}
        <div className="settings-card wide">
          <div className="card-title-row">
            <h3 className="card-title">DEALERSHIP INFORMATION</h3>
            {isApproved && <div className="locked-note">🔒 Company name & address locked after approval</div>}
          </div>
          <div className="locked-fields">
            {[
              { label:"Company Name", val:dealer?.companyName },
              { label:"Owner", val:dealer?.ownerName },
              { label:"Dealer ID", val:dealer?.dealerId, mono:true },
              { label:"Status", val:dealer?.status?.replace("_"," ") },
            ].map((f) => (
              <div key={f.label} className="locked-field">
                <span className="lf-label">{f.label}</span>
                <span className={`lf-val ${f.mono?"mono":""}`}>{f.val}</span>
                {isApproved && f.label==="Company Name" && <span className="lf-lock">🔒</span>}
              </div>
            ))}
          </div>
          <form onSubmit={handleSaveDealer} className="settings-form">
            <div className="form-row">
              <div className="field"><label className="fl">Phone</label><input className="fi" value={dealerForm.phone} onChange={(e)=>setDealerForm({...dealerForm,phone:e.target.value})} /></div>
              <div className="field"><label className="fl">WhatsApp</label><input className="fi" value={dealerForm.whatsapp} onChange={(e)=>setDealerForm({...dealerForm,whatsapp:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label className="fl">City</label><input className="fi" value={dealerForm.city} onChange={(e)=>setDealerForm({...dealerForm,city:e.target.value})} /></div>
              <div className="field"><label className="fl">State</label><input className="fi" value={dealerForm.state} onChange={(e)=>setDealerForm({...dealerForm,state:e.target.value})} /></div>
            </div>
            <div className="field"><label className="fl">Description</label><textarea className="fi fi-ta" rows={3} value={dealerForm.description} onChange={(e)=>setDealerForm({...dealerForm,description:e.target.value})} /></div>

            <div className="section-divider">SOCIAL MEDIA & LINKS</div>
            <div className="form-row">
              <div className="field"><label className="fl">Instagram</label><input className="fi" placeholder="https://instagram.com/yourpage" value={dealerForm.instagram} onChange={(e)=>setDealerForm({...dealerForm,instagram:e.target.value})} /></div>
              <div className="field"><label className="fl">Twitter / X</label><input className="fi" placeholder="https://twitter.com/yourpage" value={dealerForm.twitter} onChange={(e)=>setDealerForm({...dealerForm,twitter:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label className="fl">Facebook</label><input className="fi" placeholder="https://facebook.com/yourpage" value={dealerForm.facebook} onChange={(e)=>setDealerForm({...dealerForm,facebook:e.target.value})} /></div>
              <div className="field"><label className="fl">TikTok</label><input className="fi" placeholder="https://tiktok.com/@yourpage" value={dealerForm.tiktok} onChange={(e)=>setDealerForm({...dealerForm,tiktok:e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label className="fl">YouTube</label><input className="fi" placeholder="https://youtube.com/yourchannel" value={dealerForm.youtube} onChange={(e)=>setDealerForm({...dealerForm,youtube:e.target.value})} /></div>
              <div className="field"><label className="fl">Website</label><input className="fi" placeholder="https://yourwebsite.com" value={dealerForm.website} onChange={(e)=>setDealerForm({...dealerForm,website:e.target.value})} /></div>
            </div>

            <button type="submit" className="save-btn" disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
          </form>
        </div>

        {/* Change Password */}
        <div className="settings-card">
          <h3 className="card-title">CHANGE PASSWORD</h3>
          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="field"><label className="fl">Current Password</label><input type="password" className="fi" value={pwForm.currentPassword} onChange={(e)=>setPwForm({...pwForm,currentPassword:e.target.value})} required /></div>
            <div className="field"><label className="fl">New Password</label><input type="password" className="fi" value={pwForm.newPassword} onChange={(e)=>setPwForm({...pwForm,newPassword:e.target.value})} required /></div>
            <div className="field"><label className="fl">Confirm New Password</label><input type="password" className="fi" value={pwForm.confirmPassword} onChange={(e)=>setPwForm({...pwForm,confirmPassword:e.target.value})} required /></div>
            <button type="submit" className="save-btn" disabled={pwSaving}>{pwSaving?"Changing...":"Change Password"}</button>
          </form>
        </div>

        {/* Account Info */}
        <div className="settings-card">
          <h3 className="card-title">ACCOUNT INFORMATION</h3>
          <div className="info-list">
            <div className="info-row"><span className="il">Email</span><span className="iv">{user?.email}</span></div>
            <div className="info-row"><span className="il">Role</span><span className="iv">Dealer Admin</span></div>
            <div className="info-row"><span className="il">User ID</span><span className="iv mono">{user?.userId}</span></div>
          </div>
          <p className="locked-note" style={{marginTop:"0.75rem"}}>To change email or registered company name, contact <strong>support@carstrims.com</strong></p>
        </div>
      </div>

      <style>{`
        .settings-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A}
        .success-banner{background:#FFF7ED;border:1px solid #F47B20;color:#C4621A;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .error-banner{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center;justify-content:space-between}
        .dismiss{background:none;border:none;color:inherit;cursor:pointer}
        .settings-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem}
        .settings-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.5rem;display:flex;flex-direction:column;gap:1.1rem}
        .settings-card.wide{grid-column:1/-1}
        .card-title{font-family:var(--font-display);font-size:0.78rem;letter-spacing:0.15em;color:#888}
        .card-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .locked-note{font-size:0.75rem;color:#F47B20;background:#FFF7ED;border:1px solid #F47B20;border-radius:5px;padding:0.35rem 0.75rem}
        .logo-section{display:flex;flex-direction:column;align-items:center;gap:0.75rem}
        .logo-display{width:90px;height:90px;border-radius:50%;overflow:hidden;cursor:pointer;position:relative;border:3px solid #F47B20;background:#FFF7ED;display:flex;align-items:center;justify-content:center}
        .logo-img{width:100%;height:100%;object-fit:cover;display:block}
        .logo-placeholder{font-family:var(--font-display);font-size:2rem;color:#F47B20}
        .logo-uploading{font-size:0.75rem;color:#F47B20}
        .logo-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.45);color:#fff;font-size:0.68rem;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;text-align:center}
        .logo-display:hover .logo-overlay{opacity:1}
        .remove-logo-btn{background:transparent;border:1px solid #DDD;color:#DC2626;border-radius:5px;padding:0.3rem 0.75rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
        .remove-logo-btn:hover{background:#FEF2F2;border-color:#DC2626}
        .locked-fields{display:flex;flex-direction:column;gap:0.5rem}
        .locked-field{display:flex;align-items:center;gap:0.75rem;padding:0.55rem 0.875rem;background:#FAFAFA;border-radius:6px;border:1px solid #F0F0F0}
        .lf-label{font-size:0.68rem;color:#AAA;letter-spacing:0.05em;text-transform:uppercase;min-width:100px}
        .lf-val{font-size:0.875rem;color:#1A1A1A;flex:1;text-transform:capitalize}
        .lf-val.mono{font-family:var(--font-mono);font-size:0.78rem}
        .lf-lock{font-size:0.8rem;flex-shrink:0}
        .settings-form{display:flex;flex-direction:column;gap:0.875rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.875rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .fi:focus{border-color:#F47B20;background:#fff}
        .fi-ta{resize:vertical;min-height:80px}
        .section-divider{font-size:0.68rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#AAA;padding:0.5rem 0;border-top:1px solid #E5E5E5;border-bottom:1px solid #E5E5E5;text-align:center;margin:0.25rem 0}
        .save-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.8rem 1.5rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;align-self:flex-start;transition:background 0.2s}
        .save-btn:hover{background:#FF9340}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed}
        .info-list{display:flex;flex-direction:column;gap:0.5rem}
        .info-row{display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #F0F0F0}
        .info-row:last-child{border-bottom:none}
        .il{font-size:0.78rem;color:#888}
        .iv{font-size:0.825rem;color:#1A1A1A}
        .iv.mono{font-family:var(--font-mono);font-size:0.72rem}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
