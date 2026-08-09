"use client";
import { useToastStore } from "@/store/toastStore";

/**
 * Mounted once, in the root layout. Renders above everything (z-index
 * 99999) at the top of the viewport, respecting the safe area on iOS,
 * so it's visible no matter which page or how far scrolled the user is.
 */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(0.75rem + env(safe-area-inset-top, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "min(92vw, 440px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: "auto",
            background:
              t.type === "error" ? "#DC2626" : t.type === "success" ? "#16A34A" : "#1A1A1A",
            color: "#fff",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            fontFamily: "var(--font-body, inherit)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            animation: "toast-drop-in 0.25s ease",
          }}
        >
          <span style={{ lineHeight: 1.4 }}>{t.message}</span>
          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1.1rem",
              lineHeight: 1,
              flexShrink: 0,
              opacity: 0.85,
              padding: "0.15rem",
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes toast-drop-in {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
