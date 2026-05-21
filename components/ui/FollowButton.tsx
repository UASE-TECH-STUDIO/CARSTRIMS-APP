"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Props {
  dealerId: string;
  dealerName?: string;
  size?: "sm" | "md";
  onCountChange?: (n: number) => void;
}

export default function FollowButton({ dealerId, dealerName, size = "md", onCountChange }: Props) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [count, setCount]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [checked, setChecked]     = useState(false);
  const [toast, setToast]         = useState("");

  useEffect(() => {
    if (!isAuthenticated || !dealerId) { setChecked(true); return; }
    api.get(`/api/v1/follows/status/${dealerId}`)
      .then(r => { setFollowing(r.data.following); setCount(r.data.followerCount||0); setChecked(true); })
      .catch(() => setChecked(true));
  }, [dealerId, isAuthenticated]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const toggle = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setLoading(true);
    try {
      if (following) {
        const r = await api.delete(`/api/v1/follows/${dealerId}`);
        const newCount = r.data?.followerCount ?? Math.max(0, count - 1);
        setFollowing(false); setCount(newCount);
        onCountChange?.(newCount);
        showToast("Unfollowed");
      } else {
        const r = await api.post(`/api/v1/follows/${dealerId}`);
        const newCount = r.data?.followerCount ?? count + 1;
        setFollowing(true); setCount(newCount);
        onCountChange?.(newCount);
        showToast(`Following ${dealerName||"this dealer"}. You will receive notifications when they post new vehicles.`);
      }
    } catch {}
    setLoading(false);
  };

  if (!checked) return null;

  const isSmall = size === "sm";
  return (
    <div style={{position:"relative",display:"inline-flex",flexDirection:"column",gap:"0.5rem"}}>
      {toast && (
        <div style={{
          position:"fixed",bottom:"5rem",left:"50%",transform:"translateX(-50%)",
          background:"#1A1A1A",color:"#fff",borderRadius:"10px",padding:"0.75rem 1.25rem",
          fontSize:"0.82rem",fontWeight:500,zIndex:99999,maxWidth:"320px",textAlign:"center",
          boxShadow:"0 8px 24px rgba(0,0,0,0.25)",lineHeight:1.5,
          animation:"fadeInUp 0.25s ease",
        }}>
          <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
          {toast}
        </div>
      )}
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          display:"inline-flex",alignItems:"center",gap:"0.4rem",whiteSpace:"nowrap",
          padding: isSmall ? "0.35rem 0.875rem" : "0.625rem 1.25rem",
          background: following ? "#F5F5F5" : "#F47B20",
          color: following ? "#525252" : "#fff",
          border: following ? "1.5px solid #E5E5E5" : "none",
          borderRadius: isSmall ? "20px" : "8px",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-display)",
          fontSize: isSmall ? "0.72rem" : "0.82rem",
          letterSpacing: "0.06em",
          transition: "all 0.2s",
          opacity: loading ? 0.6 : 1,
          fontWeight: 700,
        }}
      >
        {loading ? "..." : following ? "Following" : "+ Follow"}
        {count > 0 && (
          <span style={{
            background: following ? "#E5E5E5" : "rgba(255,255,255,0.25)",
            borderRadius:"20px",padding:"0.1rem 0.4rem",fontSize:"0.65rem",
          }}>
            {count}
          </span>
        )}
      </button>
    </div>
  );
}