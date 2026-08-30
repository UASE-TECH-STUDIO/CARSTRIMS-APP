"use client";
import Link from "next/link";

/**
 * Design Studio (Business Documents) - muted per request, not deleted.
 * See id-cards/page.tsx for the full explanation - same situation
 * here. Full implementation preserved at page.tsx.bak-designstudio.
 */
export default function BusinessDocsMuted() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", textAlign: "center", gap: "0.75rem", padding: "2rem" }}>
      <div style={{ fontSize: "2rem" }}>🎨</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#1A1A1A" }}>Design Studio - Coming Back Soon</h2>
      <p style={{ fontSize: "0.85rem", color: "#737373", maxWidth: "360px", lineHeight: 1.6 }}>
        ID Cards, Business Documents, and Marketing Materials are being rebuilt as their own dedicated app for a richer set of business and professional documents. This section will return once that's ready.
      </p>
      <Link href="/dashboard/dealer" style={{ marginTop: "0.5rem", color: "#F47B20", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}>
        Back to Overview
      </Link>
    </div>
  );
}
