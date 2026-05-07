"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function HydrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage
    if (_hasHydrated) {
      setIsHydrated(true);
    }
  }, [_hasHydrated]);

  if (!isHydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--black)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "2px solid #2A2A2A",
            borderTopColor: "#C9A84C",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
