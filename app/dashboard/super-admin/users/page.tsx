"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const ROLES = ["all","DEALER_ADMIN","DEALER_STAFF","PARTNER_USER","PUBLIC_USER","SYSTEM_ADMIN"];
const ROLE_COLORS: Record<string,string> = {
  SYSTEM_ADMIN:"#E05252", DEALER_ADMIN:"#C9A84C", DEALER_STAFF:"#1D9E75",
  PARTNER_USER:"#3B8BD4", PUBLIC_USER:"#888",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [skip, setSkip] = useState(0);
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<any>(null);
  const LIMIT = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { skip, limit: LIMIT };
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;
      const res = await api.get("/api/v1/admin/users", { params });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter, skip]);

  const handleResetPw = async (userId: string) => {
    setResetting(userId);
    try {
      const res = await api.post(`/api/v1/admin/dealers/${userId}/reset-password`);
      setResetResult(res.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed");
    } finally { setResetting(null); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "—";

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">All Users</h2>
          <p className="page-sub">{total} registered user{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {resetResult && (
        <div className="reset-banner">
          ✅ Password reset! New password: <strong>{resetResult.newPassword}</strong>
          <button onClick={() => setResetResult(null)} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",marginLeft:"1rem"}}>✕</button>
        </div>
      )}

      <div className="filters">
        <input className="search-input" placeholder="Search name, email, username..."
          value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
        <div className="role-tabs">
          {ROLES.map((r) => (
            <button key={r} className={`role-tab ${roleFilter === r ? "active" : ""}`}
              onClick={() => { setRoleFilter(r); setSkip(0); }}>
              {r === "all" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👥</div><h3>No users found</h3></div>
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Contact</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-name">{u.fullName}</div>
                    <div className="user-username">@{u.username || "—"}</div>
                    <div className="user-email">{u.email}</div>
                  </td>
                  <td>
                    <span className="role-pill" style={{color: ROLE_COLORS[u.role]||"#888", borderColor:(ROLE_COLORS[u.role]||"#888")+"44", background:(ROLE_COLORS[u.role]||"#888")+"11"}}>
                      {u.role?.replace(/_/g," ")}
                    </span>
                  </td>
                  <td>
                    <div className="contact-row">
                      {u.phone && <a href={`tel:${u.phone}`} className="contact-icon">📞</a>}
                      {u.email && <a href={`mailto:${u.email}`} className="contact-icon">✉️</a>}
                    </div>
                    <div className="user-phone">{u.phone || "—"}</div>
                  </td>
                  <td><span className={`status-pill ${u.status}`}>{u.status}</span></td>
                  <td className="date-cell">{fmtDate(u.createdAt)}</td>
                  <td>
                    <button className="act-btn" onClick={() => handleResetPw(u._id)} disabled={resetting === u._id}>
                      {resetting === u._id ? "..." : "🔑 Reset PW"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="pg-btn" onClick={() => setSkip(Math.max(0, skip-LIMIT))} disabled={skip===0}>← Prev</button>
        <span className="pg-info">{Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}</span>
        <button className="pg-btn" onClick={() => setSkip(skip+LIMIT)} disabled={skip+LIMIT>=total}>Next →</button>
      </div>

      <style>{`
        .users-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem}
        .reset-banner{background:rgba(76,175,130,0.1);border:1px solid rgba(76,175,130,0.3);color:var(--success);padding:0.875rem 1.25rem;border-radius:8px;font-size:0.875rem;display:flex;align-items:center}
        .filters{display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap}
        .search-input{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:0.65rem 1rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:280px}
        .search-input:focus{border-color:var(--error)}
        .search-input::placeholder{color:var(--text-dim)}
        .role-tabs{display:flex;gap:0.3rem;flex-wrap:wrap}
        .role-tab{background:transparent;border:1px solid var(--border);border-radius:20px;padding:0.3rem 0.75rem;color:var(--text-muted);font-size:0.72rem;cursor:pointer;transition:all 0.2s;font-family:var(--font-body);text-transform:capitalize}
        .role-tab:hover{border-color:rgba(224,82,82,0.3);color:var(--text)}
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
        .status-pill.suspended,.status-pill.deleted{background:rgba(224,82,82,0.1);color:var(--error);border:1px solid rgba(224,82,82,0.3)}
        .date-cell{color:var(--text-muted);font-size:0.75rem;white-space:nowrap}
        .act-btn{background:transparent;border:1px solid var(--border);border-radius:5px;padding:0.3rem 0.65rem;color:var(--text-muted);font-size:0.75rem;cursor:pointer;transition:all 0.2s;font-family:var(--font-body);white-space:nowrap}
        .act-btn:hover{border-color:var(--gold-dim);color:var(--text)}
        .act-btn:disabled{opacity:0.5;cursor:not-allowed}
        .pagination{display:flex;align-items:center;gap:1rem;justify-content:center}
        .pg-btn{background:var(--surface);border:1px solid var(--border);color:var(--text-muted);padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.825rem;font-family:var(--font-body);transition:all 0.2s}
        .pg-btn:hover:not(:disabled){border-color:var(--error);color:var(--text)}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}
        .pg-info{font-size:0.825rem;color:var(--text-muted);font-family:var(--font-mono)}
      `}</style>
    </div>
  );
}
