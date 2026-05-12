"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const ROLES = ["all","DEALER_ADMIN","DEALER_STAFF","PARTNER_USER","PUBLIC_USER","SYSTEM_ADMIN"];
const ROLE_COLORS: Record<string,string> = { SYSTEM_ADMIN:"#E05252",DEALER_ADMIN:"#C9A84C",DEALER_STAFF:"#1D9E75",PARTNER_USER:"#3B8BD4",PUBLIC_USER:"#888" };

const genPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = "";
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random()*chars.length)];
  return pw;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [skip, setSkip] = useState(0);
  const [resetting, setResetting] = useState<string|null>(null);
  const [resetResult, setResetResult] = useState<{userId:string;password:string;user:any}|null>(null);
  const [sendingPw, setSendingPw] = useState<string|null>(null);
  const LIMIT = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { skip, limit:LIMIT };
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;
      const res = await api.get("/api/v1/admin/users", { params });
      setUsers(res.data.users); setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter, skip]);

  const handleResetPw = async (user: any) => {
    setResetting(user._id);
    const newPassword = genPassword();
    try {
      try { await api.post(`/api/v1/admin/users/${user._id}/reset-password`, { newPassword }); }
      catch { await api.post(`/api/v1/admin/dealers/${user._id}/reset-password`, { newPassword }); }
    } catch {}
    setResetResult({ userId:user._id, password:newPassword, user });
    setResetting(null);
  };

  const sendPasswordVia = async (method: "email"|"whatsapp") => {
    if (!resetResult) return;
    setSendingPw(method);
    try {
      await api.post("/api/v1/admin/users/send-password", { userId:resetResult.userId, newPassword:resetResult.password, method });
      alert(`Password sent via ${method==="email"?"Email":"WhatsApp"} to ${resetResult.user.fullName}`);
      setResetResult(null);
    } catch (e: any) {
      const detail = (e.response?.data?.detail||"").toLowerCase();
      if (method==="email"&&(detail.includes("email")||detail.includes("invalid"))) alert("Could not send - the email address on this account may be invalid or unreachable.");
      else if (method==="whatsapp"&&(detail.includes("phone")||detail.includes("whatsapp"))) alert("Could not send - no valid WhatsApp/phone number is registered for this user.");
      else alert(`Failed to send via ${method}. Copy the password and share it manually.`);
    } finally { setSendingPw(null); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "-";

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">All Users</h2>
          <p className="page-sub">{total} registered user{total!==1?"s":""}</p>
        </div>
      </div>

      {resetResult&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.75rem",maxWidth:"480px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>PASSWORD RESET</h3>
            <p style={{fontSize:"0.875rem",color:"#737373"}}>New password generated for <strong>{resetResult.user.fullName}</strong>. Share it via:</p>
            <div style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"1rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem"}}>
              <code style={{fontFamily:"var(--font-mono)",fontSize:"1.1rem",color:"#1A1A1A",letterSpacing:"0.08em"}}>{resetResult.password}</code>
              <button onClick={()=>{navigator.clipboard.writeText(resetResult.password);alert("Copied!");}} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",whiteSpace:"nowrap"}}>Copy</button>
            </div>
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>sendPasswordVia("email")} disabled={!!sendingPw} style={{flex:1,background:"#EFF6FF",border:"1.5px solid #3B8BD4",color:"#1D4ED8",borderRadius:"8px",padding:"0.75rem",fontSize:"0.875rem",cursor:"pointer",opacity:sendingPw?"0.6":"1"}}>
                {sendingPw==="email"?"Sending...":"Send via Email"}
              </button>
              <button onClick={()=>sendPasswordVia("whatsapp")} disabled={!!sendingPw} style={{flex:1,background:"#F0FDF4",border:"1.5px solid #16A34A",color:"#15803D",borderRadius:"8px",padding:"0.75rem",fontSize:"0.875rem",cursor:"pointer",opacity:sendingPw?"0.6":"1"}}>
                {sendingPw==="whatsapp"?"Sending...":"Send via WhatsApp"}
              </button>
            </div>
            <button onClick={()=>setResetResult(null)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.75rem",fontSize:"0.875rem",cursor:"pointer"}}>Close</button>
          </div>
        </div>
      )}

      <div className="filters">
        <input className="search-input" placeholder="Search name, email, username..." value={search} onChange={(e)=>{setSearch(e.target.value);setSkip(0);}} />
        <div className="role-tabs">
          {ROLES.map((r)=>(
            <button key={r} className={`role-tab ${roleFilter===r?"active":""}`} onClick={()=>{setRoleFilter(r);setSkip(0);}}>
              {r==="all"?"All":r.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>

      {loading?(<div className="loading-state"><div className="spinner"/></div>
      ):users.length===0?(<div className="empty-state"><div className="empty-icon">&#128101;</div><h3>No users found</h3></div>
      ):(
        <div className="users-table-wrap">
          <table className="users-table">
            <thead><tr><th>User</th><th>Role</th><th>Contact</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u)=>(
                <tr key={u._id}>
                  <td><div className="user-name">{u.fullName}</div><div className="user-username">@{u.username||"-"}</div><div className="user-email">{u.email}</div></td>
                  <td><span className="role-pill" style={{color:ROLE_COLORS[u.role]||"#888",borderColor:(ROLE_COLORS[u.role]||"#888")+"44",background:(ROLE_COLORS[u.role]||"#888")+"11"}}>{u.role?.replace(/_/g," ")}</span></td>
                  <td>
                    <div className="contact-row">
                      {u.phone&&<a href={`tel:${u.phone}`} className="contact-icon">&#128222;</a>}
                      {u.email&&<a href={`mailto:${u.email}`} className="contact-icon">&#9993;</a>}
                      {(u.whatsapp||u.phone)&&<a href={`https://wa.me/${(u.whatsapp||u.phone).replace(/[^0-9]/g,"")}`} target="_blank" className="contact-icon" rel="noreferrer">&#128172;</a>}
                    </div>
                    <div className="user-phone">{u.phone||"-"}</div>
                  </td>
                  <td><span className={`status-pill ${u.status}`}>{u.status}</span></td>
                  <td className="date-cell">{fmtDate(u.createdAt)}</td>
                  <td><button className="act-btn" onClick={()=>handleResetPw(u)} disabled={resetting===u._id}>{resetting===u._id?"...":"Reset PW"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="pg-btn" onClick={()=>setSkip(Math.max(0,skip-LIMIT))} disabled={skip===0}>Prev</button>
        <span className="pg-info">{Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}</span>
        <button className="pg-btn" onClick={()=>setSkip(skip+LIMIT)} disabled={skip+LIMIT>=total}>Next</button>
      </div>

      <style>{`
        .users-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem}
        .filters{display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap}
        .search-input{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:0.65rem 1rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none;width:280px}
        .role-tabs{display:flex;gap:0.3rem;flex-wrap:wrap}
        .role-tab{background:transparent;border:1px solid var(--border);border-radius:20px;padding:0.3rem 0.75rem;color:var(--text-muted);font-size:0.72rem;cursor:pointer;font-family:var(--font-body);text-transform:capitalize}
        .role-tab.active{background:var(--error);color:#fff;border-color:var(--error)}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--error);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:2.5rem}
        .empty-state h3{font-family:var(--font-display);font-size:1.2rem;color:var(--text)}
        .users-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:10px}
        .users-table{width:100%;border-collapse:collapse;min-width:700px}
        .users-table th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);background:var(--surface-2);border-bottom:1px solid var(--border)}
        .users-table td{padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.825rem;color:var(--text);vertical-align:top}
        .users-table tr:last-child td{border-bottom:none}
        .users-table tr:hover td{background:var(--surface-2)}
        .user-name{font-weight:600;font-size:0.875rem}
        .user-username{font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono)}
        .user-email{font-size:0.75rem;color:var(--text-dim)}
        .role-pill{padding:0.2rem 0.6rem;border-radius:20px;font-size:0.68rem;font-weight:500;text-transform:capitalize;border:1px solid;white-space:nowrap}
        .contact-row{display:flex;gap:0.35rem;margin-bottom:0.2rem}
        .contact-icon{font-size:0.9rem;text-decoration:none}
        .user-phone{font-size:0.75rem;color:var(--text-muted)}
        .status-pill{padding:0.15rem 0.5rem;border-radius:20px;font-size:0.68rem;text-transform:capitalize}
        .status-pill.active{background:rgba(76,175,130,0.1);color:var(--success);border:1px solid rgba(76,175,130,0.3)}
        .status-pill.pending,.status-pill.awaiting_approval{background:rgba(244,123,32,0.1);color:#F47B20;border:1px solid rgba(244,123,32,0.3)}
        .status-pill.suspended,.status-pill.deleted{background:rgba(224,82,82,0.1);color:var(--error);border:1px solid rgba(224,82,82,0.3)}
        .date-cell{color:var(--text-muted);font-size:0.75rem;white-space:nowrap}
        .act-btn{background:transparent;border:1px solid var(--border);border-radius:5px;padding:0.3rem 0.65rem;color:var(--text-muted);font-size:0.75rem;cursor:pointer;font-family:var(--font-body);white-space:nowrap}
        .act-btn:hover{border-color:#F47B20;color:#F47B20}
        .act-btn:disabled{opacity:0.5;cursor:not-allowed}
        .pagination{display:flex;align-items:center;gap:1rem;justify-content:center}
        .pg-btn{background:var(--surface);border:1px solid var(--border);color:var(--text-muted);padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.825rem;font-family:var(--font-body)}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}
        .pg-info{font-size:0.825rem;color:var(--text-muted);font-family:var(--font-mono)}
      `}</style>
    </div>
  );
}