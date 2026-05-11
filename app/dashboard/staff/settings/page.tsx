"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function StaffSettingsPage() {
  const { user } = useAuthStore();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [form, setForm] = useState({ fullName:"", phone:"", whatsapp:"" });
  const [pw, setPw] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/auth/me"),
      api.get("/api/v1/staff/me"),
    ]).then(([me, staff]) => {
      setForm({ fullName:me.data.fullName||"", phone:me.data.phone||"", whatsapp:me.data.whatsapp||"" });
      setStaffInfo(staff.data);
    }).catch(()=>{});
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr(""); setMsg("");
    try {
      await api.patch("/api/v1/users/profile", form);
      setMsg("Profile updated successfully!");
    } catch (ex: any) { setErr(ex.response?.data?.detail || "Update failed"); }
    finally { setSaving(false); }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { setErr("Passwords do not match"); return; }
    if (pw.newPassword.length < 8) { setErr("Password must be at least 8 characters"); return; }
    setPwSaving(true); setErr(""); setMsg("");
    try {
      await api.post("/api/v1/auth/change-password", { currentPassword:pw.currentPassword, newPassword:pw.newPassword });
      setMsg("Password changed successfully!");
      setPw({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (ex: any) { setErr(ex.response?.data?.detail || "Password change failed"); }
    finally { setPwSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"8px",
    padding:"0.8rem 1rem", color:"#1A1A1A", fontSize:"0.9rem",
    fontFamily:"var(--font-body)", outline:"none", width:"100%",
  };
  const labelStyle: React.CSSProperties = {
    fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.1em",
    textTransform:"uppercase", color:"#525252",
  };
  const cardStyle: React.CSSProperties = {
    background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", padding:"1.5rem",
    display:"flex", flexDirection:"column", gap:"1.25rem",
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>
      <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.6rem", color:"#1A1A1A", letterSpacing:"0.04em"}}>Settings</h2>

      {msg && <div style={{background:"rgba(22,163,74,0.08)", border:"1px solid rgba(22,163,74,0.3)", color:"#16A34A", padding:"0.75rem 1rem", borderRadius:"8px", fontSize:"0.875rem"}}>{msg}</div>}
      {err && <div style={{background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#DC2626", padding:"0.75rem 1rem", borderRadius:"8px", fontSize:"0.875rem"}}>{err}</div>}

      {/* Account info */}
      <div style={cardStyle}>
        <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>ACCOUNT INFO</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"0.75rem"}}>
          {[
            {l:"Email", v:user?.email || "-"},
            {l:"Role", v:"Staff Member"},
            {l:"Staff ID", v:staffInfo?.staffId || "-"},
            {l:"Position", v:staffInfo?.position || "-"},
            {l:"Status", v:staffInfo?.status || "-"},
            {l:"Joined", v:staffInfo?.createdAt ? new Date(staffInfo.createdAt).toLocaleDateString("en-NG") : "-"},
          ].map((i) => (
            <div key={i.l} style={{background:"#F5F5F5", borderRadius:"8px", padding:"0.75rem"}}>
              <div style={{fontSize:"0.68rem", color:"#A3A3A3", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.2rem"}}>{i.l}</div>
              <div style={{fontSize:"0.875rem", color:"#1A1A1A", fontWeight:500, textTransform:"capitalize"}}>{i.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions */}
      {staffInfo?.permissions?.length > 0 && (
        <div style={cardStyle}>
          <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>YOUR PERMISSIONS</div>
          <div style={{display:"flex", flexWrap:"wrap", gap:"0.4rem"}}>
            {staffInfo.permissions.map((p: string) => (
              <span key={p} style={{background:"#FFF7ED", border:"1px solid rgba(244,123,32,0.25)", color:"#F47B20", fontSize:"0.75rem", padding:"0.25rem 0.75rem", borderRadius:"20px", textTransform:"capitalize"}}>
                {p.replace(/_/g," ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit profile */}
      <div style={cardStyle}>
        <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>EDIT PROFILE</div>
        <form onSubmit={saveProfile} style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
            <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} />
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} />
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
            <label style={labelStyle}>WhatsApp</label>
            <input style={inputStyle} value={form.whatsapp} onChange={(e)=>setForm({...form,whatsapp:e.target.value})} />
          </div>
          <button type="submit" disabled={saving} style={{background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"0.875rem 1.5rem", fontFamily:"var(--font-display)", fontSize:"0.9rem", letterSpacing:"0.08em", cursor:"pointer", alignSelf:"flex-start", opacity:saving?0.6:1}}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={cardStyle}>
        <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>CHANGE PASSWORD</div>
        <form onSubmit={changePw} style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
          {[
            {l:"Current Password", k:"currentPassword" as const, p:"Enter current password"},
            {l:"New Password", k:"newPassword" as const, p:"Minimum 8 characters"},
            {l:"Confirm New Password", k:"confirmPassword" as const, p:"Repeat new password"},
          ].map((f) => (
            <div key={f.k} style={{display:"flex", flexDirection:"column", gap:"0.4rem"}}>
              <label style={labelStyle}>{f.l}</label>
              <input type="password" style={inputStyle} placeholder={f.p} value={pw[f.k]}
                onChange={(e) => setPw({...pw, [f.k]:e.target.value})} required />
            </div>
          ))}
          <button type="submit" disabled={pwSaving} style={{background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"0.875rem 1.5rem", fontFamily:"var(--font-display)", fontSize:"0.9rem", letterSpacing:"0.08em", cursor:"pointer", alignSelf:"flex-start", opacity:pwSaving?0.6:1}}>
            {pwSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}