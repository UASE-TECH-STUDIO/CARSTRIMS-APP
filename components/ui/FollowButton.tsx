"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Props {
  dealerId: string;
  size?: "sm" | "md";
}

export default function FollowButton({ dealerId, size = "md" }: Props) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [count, setCount]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [checked, setChecked]     = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !dealerId) return;
    api.get(`/api/v1/follows/status/${dealerId}`)
      .then(r => { setFollowing(r.data.following); setCount(r.data.followerCount||0); setChecked(true); })
      .catch(() => setChecked(true));
  }, [dealerId, isAuthenticated]);

  const toggle = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setLoading(true);
    try {
      if (following) {
        await api.delete(`/api/v1/follows/${dealerId}`);
        setFollowing(false); setCount(c=>Math.max(0,c-1));
      } else {
        await api.post(`/api/v1/follows/${dealerId}`);
        setFollowing(true); setCount(c=>c+1);
      }
    } catch {}
    setLoading(false);
  };

  if (!checked) return null;

  const isSmall = size === "sm";
  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display:"inline-flex",
        alignItems:"center",
        gap:"0.4rem",
        padding: isSmall ? "0.3rem 0.75rem" : "0.6rem 1.25rem",
        background: following ? "#1A1A1A" : "#F47B20",
        color: "#fff",
        border: "none",
        borderRadius: isSmall ? "20px" : "8px",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font-display)",
        fontSize: isSmall ? "0.72rem" : "0.825rem",
        letterSpacing: "0.06em",
        transition: "all 0.2s",
        opacity: loading ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {following ? "✓ Following" : "+ Follow"}
      {count > 0 && (
        <span style={{
          background: "rgba(255,255,255,0.25)",
          borderRadius: "20px",
          padding: "0.1rem 0.4rem",
          fontSize: "0.65rem",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
