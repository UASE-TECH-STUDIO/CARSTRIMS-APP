"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CreateDealerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", phone: "",
    companyName: "", address: "", city: "", state: "", country: "Nigeria",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/v1/admin/dealers/create", form);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create dealer");
    } finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="create-page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2 className="success-title">DEALER CREATED SUCCESSFULLY</h2>
          <div className="credentials">
            <div className="cred-row"><span className="cred-label">Company</span><span className="cred-val">{form.companyName}</span></div>
            <div className="cred-row"><span className="cred-label">Email</span><span className="cred-val">{result.email}</span></div>
            <div className="cred-row"><span className="cred-label">Dealer ID</span><span className="cred-val mono">{result.dealerId}</span></div>
            <div className="cred-row">
              <span className="cred-label">Temp Password</span>
              <span className="cred-val pw">{result.tempPassword}</span>
            </div>
          </div>
          <p className="success-note">Share these credentials with the dealer. They can log in and start using their dashboard immediately.</p>
          <div className="success-btns">
            <button className="btn-outline" onClick={() => { setResult(null); setForm({ fullName:"",username:"",email:"",phone:"",companyName:"",address:"",city:"",state:"",country:"Nigeria" }); }}>
              Create Another
            </button>
            <button className="btn-red" onClick={() => router.push("/dashboard/super-admin/dealers")}>View All Dealers</button>
          </div>
        </div>
        <style>{sharedStyles}</style>
      </div>
    );
  }

  return (
    <div className="create-page">
      <div className="page-header">
        <h2 className="page-heading">Create Dealer Account</h2>
        <p className="page-sub">Create a dealer account directly — they receive full approved access immediately</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="create-card">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-section">
            <div className="section-label">OWNER DETAILS</div>
            <div className="form-row">
              <div className="field">
                <label className="field-label">Full Name *</label>
                <input className="field-input" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">Username *</label>
                <input className="field-input" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label className="field-label">Email *</label>
                <input type="email" className="field-input" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">Phone</label>
                <input className="field-input" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-label">COMPANY DETAILS</div>
            <div className="field">
              <label className="field-label">Company Name *</label>
              <input className="field-input" value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            </div>
            <div className="field">
              <label className="field-label">Address</label>
              <input className="field-input" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="field">
                <label className="field-label">City</label>
                <input className="field-input" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="field">
                <label className="field-label">State</label>
                <input className="field-input" value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="admin-note">
            ℹ️ A temporary password will be auto-generated. The dealer account will be pre-approved and ready to use immediately.
          </div>

          <div className="form-footer">
            <button type="button" className="btn-outline" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn-red" disabled={loading}>
              {loading ? "Creating..." : "Create & Approve Dealer"}
            </button>
          </div>
        </form>
      </div>

      <style>{sharedStyles}</style>
    </div>
  );
}

const sharedStyles = `
  .create-page{display:flex;flex-direction:column;gap:1.5rem;max-width:680px}
  .page-header{display:flex;flex-direction:column;gap:0.3rem}
  .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
  .page-sub{font-size:0.875rem;color:var(--text-muted)}
  .error-banner{background:rgba(224,82,82,0.1);border:1px solid rgba(224,82,82,0.3);color:var(--error);padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem}
  .create-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.75rem}
  .create-form{display:flex;flex-direction:column;gap:1.5rem}
  .form-section{display:flex;flex-direction:column;gap:0.875rem}
  .section-label{font-size:0.7rem;font-weight:600;letter-spacing:0.15em;color:var(--text-muted);text-transform:uppercase;padding-bottom:0.25rem;border-bottom:1px solid var(--border)}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  .field{display:flex;flex-direction:column;gap:0.4rem}
  .field-label{font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
  .field-input{background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:0.75rem;color:var(--text);font-size:0.9rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
  .field-input:focus{border-color:var(--error)}
  .admin-note{background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:6px;padding:0.875rem;font-size:0.825rem;color:var(--gold)}
  .form-footer{display:flex;gap:0.75rem;justify-content:flex-end}
  .btn-red{background:var(--error);color:#fff;border:none;border-radius:6px;padding:0.75rem 1.5rem;font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.1em;cursor:pointer;transition:opacity 0.2s}
  .btn-red:hover{opacity:0.85}
  .btn-red:disabled{opacity:0.6;cursor:not-allowed}
  .btn-outline{background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:6px;padding:0.75rem 1.5rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s}
  .btn-outline:hover{border-color:var(--error);color:var(--text)}
  .success-card{background:var(--surface);border:1px solid rgba(76,175,130,0.3);border-radius:12px;padding:2.5rem;display:flex;flex-direction:column;align-items:center;gap:1.25rem;text-align:center}
  .success-icon{font-size:3rem}
  .success-title{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.08em;color:var(--success)}
  .credentials{width:100%;background:var(--surface-2);border-radius:8px;overflow:hidden;border:1px solid var(--border)}
  .cred-row{display:flex;align-items:center;gap:1rem;padding:0.75rem 1rem;border-bottom:1px solid var(--border)}
  .cred-row:last-child{border-bottom:none}
  .cred-label{font-size:0.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;min-width:100px}
  .cred-val{font-size:0.875rem;color:var(--text);flex:1;text-align:left}
  .cred-val.mono{font-family:var(--font-mono);font-size:0.8rem}
  .cred-val.pw{font-family:var(--font-mono);font-size:0.875rem;color:var(--success);font-weight:600;background:rgba(76,175,130,0.1);padding:2px 8px;border-radius:4px}
  .success-note{font-size:0.825rem;color:var(--text-muted);max-width:400px;line-height:1.6}
  .success-btns{display:flex;gap:0.75rem}
`;
