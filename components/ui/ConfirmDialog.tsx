"use client";
import { useConfirmStore } from "@/store/confirmStore";

/**
 * Mounted once, in the root layout - renders the active confirmation
 * request (if any) as a centered modal above everything else. Same
 * global-mount pattern as ToastContainer.tsx.
 */
export default function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request);
  const respond = useConfirmStore((s) => s.respond);

  if (!request) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99998,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.25rem",
      }}
      onClick={() => respond(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "14px", padding: "1.5rem",
          width: "100%", maxWidth: "360px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          fontFamily: "var(--font-body, inherit)",
        }}
      >
        {request.title && (
          <div style={{ fontFamily: "var(--font-display, inherit)", fontSize: "1.05rem", letterSpacing: "0.02em", color: "#1A1A1A", marginBottom: "0.5rem" }}>
            {request.title}
          </div>
        )}
        <div style={{ fontSize: "0.9rem", color: "#525252", lineHeight: 1.55, marginBottom: "1.25rem" }}>
          {request.message}
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            onClick={() => respond(false)}
            style={{
              flex: 1, background: "#F5F5F5", border: "1.5px solid #E5E5E5", borderRadius: "9px",
              padding: "0.7rem", fontSize: "0.85rem", fontWeight: 700, color: "#525252", cursor: "pointer",
            }}
          >
            {request.cancelLabel || "Cancel"}
          </button>
          <button
            onClick={() => respond(true)}
            style={{
              flex: 1, background: request.danger ? "#DC2626" : "#F47B20", border: "none", borderRadius: "9px",
              padding: "0.7rem", fontSize: "0.85rem", fontWeight: 700, color: "#fff", cursor: "pointer",
            }}
          >
            {request.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
