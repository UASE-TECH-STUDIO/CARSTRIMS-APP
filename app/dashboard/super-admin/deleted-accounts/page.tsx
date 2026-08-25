"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/store/toastStore";
import { useConfirm } from "@/store/confirmStore";
import { usePrompt } from "@/store/promptStore";
import { parseServerDate } from "@/lib/timeUtils";

function fmtDate(iso: string) {
  if (!iso) return "";
  return parseServerDate(iso)?.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) || "";
}

/**
 * Item 14: deleted-account history stays visible to Super Admin, who
 * decides whether to permanently wipe it - whether at the account
 * owner's own request or their own judgment. Nothing here happens
 * automatically or on any kind of timer - every wipe is a deliberate,
 * individually-confirmed Super Admin action.
 *
 * Shows both deleted users and deleted dealer organizations, since
 * they're two different collections. A dealer's entry always shows
 * its own "Wipe" action (removes the dealer org, every car it
 * listed, staff, expenses, and sales - the same cascade the existing
 * admin user-delete already performs for a DEALER_ADMIN), calling
 * DELETE /admin/users/{userId}?cascade=true using the dealer's own
 * userId - no new backend endpoint needed for this, the existing one
 * already handles it correctly per role.
 */
export default function DeletedAccountsPage() {
  const showToast = useToast();
  const askConfirm = useConfirm();
  const askPrompt = usePrompt();
  const [tab, setTab] = useState<"users" | "dealers">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wipingId, setWipingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ur, dr] = await Promise.all([
        api.get("/api/v1/admin/users", { params: { status: "deleted", limit: 200 } }),
        api.get("/api/v1/admin/dealers", { params: { status: "deleted", limit: 200 } }),
      ]);
      setUsers(ur.data.users || []);
      setDealers(dr.data.dealers || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleWipe = async (userId: string, label: string) => {
    if (!(await askConfirm({
      message: `Permanently wipe all data for "${label}"? This removes their account and everything tied to it (listings, staff, records) - it cannot be undone.`,
      danger: true,
    }))) return;
    const typed = await askPrompt({ message: `Type WIPE to confirm permanently deleting "${label}"'s data.` });
    if (!typed || typed.trim().toUpperCase() !== "WIPE") {
      if (typed) showToast("Not confirmed — nothing was wiped", "error");
      return;
    }
    setWipingId(userId);
    try {
      await api.delete(`/api/v1/admin/users/${userId}`, { params: { cascade: true } });
      showToast("Data permanently wiped", "success");
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Wipe failed", "error");
    } finally {
      setWipingId(null);
    }
  };

  return (
    <div className="dap">
      <div className="page-header">
        <div>
          <h1 className="page-heading">Deleted Accounts</h1>
          <p className="page-sub">Accounts that have deleted themselves or been removed by an admin. Their history stays here until you choose to permanently wipe it.</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
          Users ({users.length})
        </button>
        <button className={`tab ${tab === "dealers" ? "active" : ""}`} onClick={() => setTab("dealers")}>
          Dealers ({dealers.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : tab === "users" ? (
        users.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🗑️</div><h3>No deleted users</h3></div>
        ) : (
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Deleted</th><th></th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.fullName || "—"}</td>
                    <td>{u.email || "—"}</td>
                    <td className="role-cell">{(u.role || "").replace(/_/g, " ")}</td>
                    <td className="date-cell">{fmtDate(u.updatedAt)}</td>
                    <td>
                      <button className="wipe-btn" disabled={wipingId === u._id} onClick={() => handleWipe(u._id, u.fullName || u.email)}>
                        {wipingId === u._id ? "Wiping…" : "Permanently Wipe"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : dealers.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🗑️</div><h3>No deleted dealers</h3></div>
      ) : (
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr><th>Company</th><th>Owner Email</th><th>Cars Listed</th><th>Deleted</th><th></th></tr>
            </thead>
            <tbody>
              {dealers.map((d) => (
                <tr key={d._id}>
                  <td>{d.companyName || "—"}</td>
                  <td>{d.ownerEmail || d.email || "—"}</td>
                  <td>{d.carCount ?? "—"}</td>
                  <td className="date-cell">{fmtDate(d.updatedAt)}</td>
                  <td>
                    {d.userId ? (
                      <button className="wipe-btn" disabled={wipingId === d.userId} onClick={() => handleWipe(d.userId, d.companyName)}>
                        {wipingId === d.userId ? "Wiping…" : "Permanently Wipe"}
                      </button>
                    ) : (
                      <span className="no-owner">No linked account</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .dap{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.4rem;max-width:520px;line-height:1.5}
        .tabs{display:flex;gap:0.5rem}
        .tab{background:transparent;border:1px solid var(--border);border-radius:20px;padding:0.45rem 1rem;color:var(--text-muted);font-size:0.8rem;cursor:pointer;transition:all 0.2s;font-family:var(--font-body)}
        .tab:hover{border-color:rgba(224,82,82,0.4);color:var(--text)}
        .tab.active{background:var(--error);color:#fff;border-color:var(--error)}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--error);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem;text-align:center;border:1px dashed var(--border);border-radius:12px}
        .empty-icon{font-size:2.5rem}
        .empty-state h3{font-family:var(--font-display);font-size:1.2rem;color:var(--text)}
        .table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:10px}
        .dtable{width:100%;border-collapse:collapse;min-width:700px}
        .dtable th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);background:var(--surface-2);border-bottom:1px solid var(--border)}
        .dtable td{padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.825rem;color:var(--text);vertical-align:middle}
        .dtable tr:last-child td{border-bottom:none}
        .role-cell{text-transform:capitalize;color:var(--text-muted)}
        .date-cell{color:var(--text-muted);font-size:0.75rem;white-space:nowrap}
        .wipe-btn{background:#FEF2F2;border:1.5px solid #FCA5A5;color:#DC2626;border-radius:6px;padding:0.4rem 0.8rem;font-size:0.72rem;font-weight:700;cursor:pointer;white-space:nowrap}
        .wipe-btn:disabled{opacity:0.5;cursor:not-allowed}
        .no-owner{font-size:0.72rem;color:var(--text-muted);font-style:italic}
      `}</style>
    </div>
  );
}
