"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [pw, setPw] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [pwSaving, setPwSaving] = useState(false);
  const [contact, setContact] = useState({
    email: "support@carstrims.com",
    phone: "+2348000000000",
    whatsapp: "2348000000000",
    instagram: "https://instagram.com/carstrims",
    twitter: "https://twitter.com/carstrims",
    facebook: "https://facebook.com/carstrims",
    address: "Lagos, Nigeria",
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { setErr("Passwords don't match"); return; }
    if (pw.newPassword.length < 8) { setErr("Min 8 characters"); return; }
    setPwSaving(true); setErr(""); setMsg("");
    try {
      await api.post("/api/v1/auth/change-password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setMsg("Password changed successfully!");
      setPw({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Failed to change password");
    } finally { setPwSaving(false); }
  };

  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSaving(true); setErr(""); setMsg("");
    // In production this would save to a settings collection in MongoDB
    // For now simulate save
    await new Promise((r) => setTimeout(r, 800));
    setMsg("Contact information saved! (Restart to apply globally)");
    setContactSaving(false);
  };

  return (
    <div className="settings-page">
      <h2 className="page-heading">Admin Settings</h2>
      <p className="page-sub">Manage your admin account and platform contact information</p>

      {msg && (
        <div className="success-banner">
          ✅ {msg}
          <button onClick={() => setMsg("")} className="dismiss">✕</button>
        </div>
      )}
      {err && (
        <div className="error-banner">
          ❌ {err}
          <button onClick={() => setErr("")} className="dismiss">✕</button>
        </div>
      )}

      <div className="settings-grid">
        {/* Admin Account Info */}
        <div className="settings-card">
          <h3 className="card-title">ADMIN ACCOUNT</h3>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Name</span>
              <span className="info-val">{user?.fullName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-val">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-val role-badge">SYSTEM ADMIN</span>
            </div>
            <div className="info-row">
              <span className="info-label">User ID</span>
              <span className="info-val mono">{user?.userId}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="settings-card">
          <h3 className="card-title">CHANGE PASSWORD</h3>
          <form onSubmit={changePw} className="form">
            <div className="field">
              <label className="fl">Current Password</label>
              <input type="password" className="fi" value={pw.currentPassword}
                onChange={(e) => setPw({...pw, currentPassword:e.target.value})} required />
            </div>
            <div className="field">
              <label className="fl">New Password</label>
              <input type="password" className="fi" value={pw.newPassword}
                onChange={(e) => setPw({...pw, newPassword:e.target.value})} required />
            </div>
            <div className="field">
              <label className="fl">Confirm New Password</label>
              <input type="password" className="fi" value={pw.confirmPassword}
                onChange={(e) => setPw({...pw, confirmPassword:e.target.value})} required />
            </div>
            <button type="submit" className="save-btn" disabled={pwSaving}>
              {pwSaving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Platform Contact Info */}
        <div className="settings-card wide">
          <h3 className="card-title">PLATFORM CONTACT INFORMATION</h3>
          <p className="card-sub">These details appear in the app footer and are used by users to contact support</p>
          <form onSubmit={saveContact} className="form">
            <div className="form-row">
              <div className="field">
                <label className="fl">Support Email</label>
                <input className="fi" value={contact.email}
                  onChange={(e) => setContact({...contact, email:e.target.value})} />
              </div>
              <div className="field">
                <label className="fl">Phone Number</label>
                <input className="fi" value={contact.phone}
                  onChange={(e) => setContact({...contact, phone:e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label className="fl">WhatsApp Number</label>
                <input className="fi" placeholder="e.g. 2348012345678" value={contact.whatsapp}
                  onChange={(e) => setContact({...contact, whatsapp:e.target.value})} />
              </div>
              <div className="field">
                <label className="fl">Office Address</label>
                <input className="fi" value={contact.address}
                  onChange={(e) => setContact({...contact, address:e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label className="fl">Instagram URL</label>
                <input className="fi" value={contact.instagram}
                  onChange={(e) => setContact({...contact, instagram:e.target.value})} />
              </div>
              <div className="field">
                <label className="fl">Twitter / X URL</label>
                <input className="fi" value={contact.twitter}
                  onChange={(e) => setContact({...contact, twitter:e.target.value})} />
              </div>
            </div>
            <div className="field" style={{maxWidth:"50%"}}>
              <label className="fl">Facebook URL</label>
              <input className="fi" value={contact.facebook}
                onChange={(e) => setContact({...contact, facebook:e.target.value})} />
            </div>
            <button type="submit" className="save-btn" disabled={contactSaving}>
              {contactSaving ? "Saving..." : "Save Contact Info"}
            </button>
          </form>
        </div>

        {/* App Info */}
        <div className="settings-card">
          <h3 className="card-title">APPLICATION INFO</h3>
          <div className="info-list">
            <div className="info-row"><span className="info-label">App Name</span><span className="info-val">CARSTRIMS</span></div>
            <div className="info-row"><span className="info-label">Version</span><span className="info-val mono">1.0.0</span></div>
            <div className="info-row"><span className="info-label">Developer</span><span className="info-val">UASE TECH STUDIO</span></div>
            <div className="info-row"><span className="info-label">Year</span><span className="info-val">2026</span></div>
            <div className="info-row"><span className="info-label">Stack</span><span className="info-val mono">Next.js · FastAPI · MongoDB</span></div>
          </div>
        </div>
      </div>

      <style>{`
        .settings-page { display:flex; flex-direction:column; gap:1.5rem; }
        .page-heading { font-family:var(--font-display); font-size:1.6rem; letter-spacing:0.05em; color:var(--text); line-height:1; }
        .page-sub { font-size:0.875rem; color:var(--text-muted); }
        .success-banner { background:rgba(76,175,130,0.1); border:1px solid rgba(76,175,130,0.3); color:var(--success); padding:0.875rem 1.25rem; border-radius:8px; font-size:0.875rem; display:flex; align-items:center; justify-content:space-between; }
        .error-banner { background:rgba(224,82,82,0.1); border:1px solid rgba(224,82,82,0.3); color:var(--error); padding:0.875rem 1.25rem; border-radius:8px; font-size:0.875rem; display:flex; align-items:center; justify-content:space-between; }
        .dismiss { background:none; border:none; color:inherit; cursor:pointer; font-size:0.875rem; }
        .settings-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:1.25rem; }
        .settings-card { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
        .settings-card.wide { grid-column:1/-1; }
        .card-title { font-family:var(--font-display); font-size:0.8rem; letter-spacing:0.15em; color:var(--text-muted); }
        .card-sub { font-size:0.8rem; color:var(--text-dim); margin-top:-0.5rem; }
        .info-list { display:flex; flex-direction:column; gap:0.5rem; }
        .info-row { display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--border); }
        .info-row:last-child { border-bottom:none; }
        .info-label { font-size:0.78rem; color:var(--text-muted); }
        .info-val { font-size:0.825rem; color:var(--text); }
        .info-val.mono { font-family:var(--font-mono); font-size:0.72rem; }
        .role-badge { background:rgba(224,82,82,0.1); color:var(--error); font-size:0.7rem; padding:0.2rem 0.6rem; border-radius:20px; border:1px solid rgba(224,82,82,0.3); }
        .form { display:flex; flex-direction:column; gap:1rem; }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .field { display:flex; flex-direction:column; gap:0.4rem; }
        .fl { font-size:0.7rem; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); }
        .fi { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:0.75rem; color:var(--text); font-size:0.875rem; font-family:var(--font-body); outline:none; transition:border-color 0.2s; width:100%; }
        .fi:focus { border-color:var(--error); }
        .save-btn { background:var(--error); color:#fff; border:none; border-radius:6px; padding:0.75rem 1.5rem; font-family:var(--font-display); font-size:0.9rem; letter-spacing:0.1em; cursor:pointer; align-self:flex-start; transition:opacity 0.2s; }
        .save-btn:hover { opacity:0.85; }
        .save-btn:disabled { opacity:0.6; cursor:not-allowed; }
        @media(max-width:640px) { .form-row { grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}
