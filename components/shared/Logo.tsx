"use client";
import Link from "next/link";

interface Props {
  size?: "sm" | "md" | "lg";
  href?: string;
  showTagline?: boolean;
  dark?: boolean;
}

export default function Logo({ size = "md", href = "/feed", showTagline = false, dark = false }: Props) {
  const sizes = {
    sm: { img: 24, font: "0.65rem", gap: "0.4rem" },
    md: { img: 32, font: "0.72rem", gap: "0.5rem" },
    lg: { img: 44, font: "0.8rem", gap: "0.625rem" },
  };
  const s = sizes[size];

  const content = (
    <div style={{display:"inline-flex",alignItems:"center",gap:s.gap,textDecoration:"none"}}>
      {/* Logo mark — orange circle with car icon + wordmark */}
      <div style={{
        width: s.img + "px",
        height: s.img + "px",
        background: "linear-gradient(135deg, #F47B20, #FF9340)",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(244,123,32,0.35)",
        overflow: "hidden",
        position: "relative",
      }}>
        <img
          src="/logo.png"
          alt="CARSTRIMS"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: "3px",
            filter: "brightness(0) invert(1)",  /* makes logo white on orange bg */
          }}
          onError={(e) => {
            /* fallback if logo.png fails */
            e.currentTarget.style.display = "none";
            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-family:Georgia,serif;font-weight:900;font-size:0.6em;color:#fff;letter-spacing:-0.05em">CS</span>';
          }}
        />
      </div>
      {/* Wordmark */}
      <div style={{display:"flex",flexDirection:"column",gap:"1px"}}>
        <span style={{
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: `clamp(0.875rem, 2vw, ${size === "lg" ? "1.3rem" : size === "md" ? "1.05rem" : "0.875rem"})`,
          fontWeight: 800,
          letterSpacing: "0.18em",
          color: dark ? "#fff" : "#1A1A1A",
          lineHeight: 1,
        }}>CARSTRIMS</span>
        {showTagline && (
          <span style={{fontSize:s.font,color:dark?"rgba(255,255,255,0.6)":"#A3A3A3",letterSpacing:"0.06em",lineHeight:1}}>
            by UASE TECH STUDIO
          </span>
        )}
      </div>
    </div>
  );

  if (!href) return content;
  return <Link href={href} style={{textDecoration:"none"}}>{content}</Link>;
}
