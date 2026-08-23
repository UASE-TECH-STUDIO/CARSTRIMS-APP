"use client";
import { useState, useEffect, useRef } from "react";
import { usePromptStore } from "@/store/promptStore";

/**
 * Mounted once, in the root layout - renders the active text-input
 * request (if any) as a centered modal above everything else. Same
 * global-mount pattern as ConfirmDialog.tsx and ToastContainer.tsx.
 */
export default function PromptDialog() {
  const request = usePromptStore((s) => s.request);
  const respond = usePromptStore((s) => s.respond);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (request) {
      setValue(request.defaultValue || "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [request]);

  if (!request) return null;

  const submit = () => respond(value.trim() || null);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99998,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.25rem",
      }}
      onClick={() => respond(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "14px", padding: "1.5rem",
          width: "100%", maxWidth: "380px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          fontFamily: "var(--font-body, inherit)",
        }}
      >
        <div style={{ fontSize: "0.9rem", color: "#525252", lineHeight: 1.5, marginBottom: "0.75rem" }}>
          {request.message}
        </div>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={request.placeholder}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            if (e.key === "Escape") respond(null);
          }}
          style={{
            width: "100%", border: "1.5px solid #E5E5E5", borderRadius: "9px",
            padding: "0.7rem 0.85rem", fontSize: "0.9rem", fontFamily: "var(--font-body, inherit)",
            resize: "vertical", boxSizing: "border-box", marginBottom: "1.25rem", outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            onClick={() => respond(null)}
            style={{
              flex: 1, background: "#F5F5F5", border: "1.5px solid #E5E5E5", borderRadius: "9px",
              padding: "0.7rem", fontSize: "0.85rem", fontWeight: 700, color: "#525252", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              flex: 1, background: "#F47B20", border: "none", borderRadius: "9px",
              padding: "0.7rem", fontSize: "0.85rem", fontWeight: 700, color: "#fff", cursor: "pointer",
            }}
          >
            {request.confirmLabel || "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
