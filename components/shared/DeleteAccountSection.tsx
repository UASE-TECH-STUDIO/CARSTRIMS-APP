"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/toastStore";

/**
 * Self-service "Delete My Account" section (item 13) - shared across
 * every role's settings/profile page rather than rebuilt five times.
 *
 * Deliberately its own dedicated password-confirmation form rather
 * than reusing the generic prompt dialog (usePrompt) - that dialog's
 * input is a plain textarea, not styled or masked as a password
 * field, which isn't appropriate for entering a real password.
 *
 * Always calls the soft-delete endpoint (DELETE /api/v1/users/me) -
 * no data is ever removed by this flow. The account is simply
 * blocked from logging back in, same as an admin-initiated deletion.
 * Logs the person out and sends them to the login page immediately
 * on success, since their session is no longer valid either way.
 */
export default function DeleteAccountSection() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const showToast = useToast();

  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = password.length > 0 && confirmText.trim().toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await api.delete("/api/v1/users/me", { data: { password } });
      showToast("Account deleted", "success");
      logout();
      router.replace("/login");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Couldn't delete account — check your password and try again", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="das-wrap">
      <div className="das-header">
        <div>
          <div className="das-title">Delete Account</div>
          <p className="das-sub">Permanently blocks your account from logging in. This can't be undone by you — contact support if you change your mind.</p>
        </div>
        {!expanded && (
          <button className="das-open-btn" onClick={() => setExpanded(true)}>Delete My Account</button>
        )}
      </div>

      {expanded && (
        <div className="das-form">
          <label className="das-label">Enter your password to confirm</label>
          <input
            type="password"
            className="das-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your current password"
            autoComplete="current-password"
          />
          <label className="das-label">Type DELETE to confirm</label>
          <input
            type="text"
            className="das-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
          <div className="das-actions">
            <button className="das-cancel" onClick={() => { setExpanded(false); setPassword(""); setConfirmText(""); }} disabled={busy}>
              Cancel
            </button>
            <button className="das-confirm" onClick={handleDelete} disabled={!canSubmit || busy}>
              {busy ? "Deleting…" : "Permanently Delete My Account"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .das-wrap { border: 1.5px solid #FECACA; border-radius: 12px; padding: 1.25rem; background: #FEF2F2; margin-top: 1.5rem; }
        .das-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .das-title { font-weight: 700; font-size: 0.95rem; color: #991B1B; }
        .das-sub { font-size: 0.78rem; color: #B91C1C; margin-top: 0.3rem; max-width: 420px; line-height: 1.5; }
        .das-open-btn { background: #DC2626; color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.1rem; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .das-form { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .das-label { font-size: 0.75rem; font-weight: 700; color: #991B1B; margin-top: 0.5rem; }
        .das-input { border: 1.5px solid #FCA5A5; border-radius: 8px; padding: 0.6rem 0.8rem; font-size: 0.85rem; outline: none; background: #fff; }
        .das-input:focus { border-color: #DC2626; }
        .das-actions { display: flex; gap: 0.6rem; margin-top: 0.75rem; }
        .das-cancel { flex: 1; padding: 0.7rem; border-radius: 8px; border: 1.5px solid #E5E5E5; background: #fff; color: #525252; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
        .das-confirm { flex: 2; padding: 0.7rem; border-radius: 8px; border: none; background: #DC2626; color: #fff; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
        .das-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
