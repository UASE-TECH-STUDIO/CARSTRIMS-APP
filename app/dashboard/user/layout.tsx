import MessagesWidget from "@/components/shared/MessagesWidget";
"use client";
import { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import NotificationBell from "@/components/ui/NotificationBell";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [me, setMe] = useState<any>(null);
  const [showScan, setShowScan] = useState(false);
  const [scanInput, setScanInput] = useState("");

  useEffect(() => {
    api.get("/api/v1/auth/me")
      .then((r) => setMe(r.data))
      .catch(() => {});
  }, []);

  const isActive = (href: string) => pathname === href;

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const input = scanInput.trim();
    // Accept DLR-XXXXXXXX or full URL
    if (input.startsWith("DLR-") || input.startsWith("dlr-")) {
      router.push(`/dealers/${input.toUpperCase()}`);
    } else if (input.includes("/dealers/")) {
      const id = input.split("/dealers/")[1]?.split(/[?#]/)[0];
      if (id) router.push(`/dealers/${id}`);
    } else {
      // Try as dealer ID
      router.push(`/dealers/${input}`);
    }
    setShowScan(false);
    setScanInput("");
  };

  const handleCameraQR = async () => {
    // Use the browser's BarcodeDetector or fallback to jsQR
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem";
      const closeBtn = document.createElement("button");
      closeBtn.innerText = "âœ• Close Camera";
      closeBtn.style.cssText = "background:#F47B20;color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-size:1rem;cursor:pointer;margin-top:1rem";
      closeBtn.onclick = () => {
        stream.getTracks().forEach((t) => t.stop());
        document.body.removeChild(overlay);
      };
      video.style.cssText = "width:90vw;max-width:400px;border-radius:12px;border:3px solid #F47B20";
      const label = document.createElement("p");
      label.innerText = "Point camera at dealer QR code";
      label.style.cssText = "color:#fff;font-size:1rem";
      overlay.appendChild(label);
      overlay.appendChild(video);
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);

      // Try BarcodeDetector
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) {
              const raw = codes[0].rawValue;
              stream.getTracks().forEach((t) => t.stop());
              document.body.removeChild(overlay);
              // Parse URL
              if (raw.includes("/dealers/")) {
                const id = raw.split("/dealers/")[1]?.split(/[?#]/)[0];
                if (id) router.push(`/dealers/${id}`);
              } else {
                setScanInput(raw);
                setShowScan(true);
              }
              return;
            }
          } catch { }
          requestAnimationFrame(scan);
        };
        video.onloadedmetadata = () => requestAnimationFrame(scan);
      }
    } catch {
      // Camera not available - show manual input
      setShowScan(true);
    }
  };

  return (
    <AuthGuard allowedRoles={["PUBLIC_USER"]}>
      <div className="user-shell">
        {/* Topbar */}
        <header className="user-topbar">
          <Link href="/feed" className="topbar-brand">â—ˆ CARSTRIMS</Link>
          <div className="topbar-right">
            <span className="greeting">{getGreeting()}, <strong>{me?.fullName?.split(" ")[0]||"User"}</strong></span>
            <NotificationBell />
            <button
              className="avatar-btn"
              onClick={() => router.push("/dashboard/user/profile")}
              title="My Profile"
            >
              {me?.profilePicture
                ? <img src={me.profilePicture} alt="" className="avatar-img" />
                : <span className="avatar-letter">{(me?.fullName||user?.fullName||"U").charAt(0).toUpperCase()}</span>
              }
            </button>
            <button className="logout-topbar-btn" onClick={() => { logout(); router.push("/login"); }} title="Sign Out">
              â†©
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="user-content">{children}</main>

        {/* Footer */}
        <footer className="user-footer">
          <div className="uf-inner">
            <span>Â© 2026 CARSTRIMS</span>
            <span className="uf-dev">Developed by <strong>UASE TECH STUDIO</strong></span>
          </div>
        </footer>

        {/* Bottom Nav */}
        <nav className="bottom-nav">
          <Link href="/feed" className={`bni ${isActive("/feed")?"active":""}`}>
            <span className="bni-icon">ðŸ </span>
            <span className="bni-label">Feed</span>
          </Link>
          <Link href="/dashboard/user/favorites" className={`bni ${pathname.includes("favorites")?"active":""}`}>
            <span className="bni-icon">â¤ï¸</span>
            <span className="bni-label">Saved</span>
          </Link>
          <button className="bni qr-center" onClick={handleCameraQR}>
            <div className="qr-circle">
              <span style={{fontSize:"1.1rem"}}>ðŸ“·</span>
            </div>
            <span className="bni-label">Scan QR</span>
          </button>
          <Link href="/dashboard/user/messages" className={`bni ${pathname.includes("messages")?"active":""}`}>
            <span className="bni-icon">ðŸ’¬</span>
            <span className="bni-label">Messages</span>
          </Link>
          <Link href="/dashboard/user/profile" className={`bni ${pathname.includes("profile")?"active":""}`}>
            <div className="bni-avatar">
              {me?.profilePicture
                ? <img src={me.profilePicture} alt="" className="bni-pic" />
                : <span>{(me?.fullName||"U").charAt(0).toUpperCase()}</span>
              }
            </div>
            <span className="bni-label">Profile</span>
          </Link>
        </nav>

        {/* QR Scan Manual Entry Modal */}
        {showScan && (
          <div className="scan-overlay" onClick={() => setShowScan(false)}>
            <div className="scan-modal" onClick={(e) => e.stopPropagation()}>
              <div className="scan-header">
                <h3 className="scan-title">SCAN / ENTER DEALER ID</h3>
                <button className="scan-close" onClick={() => setShowScan(false)}>âœ•</button>
              </div>
              <div className="scan-body">
                <div className="scan-icon-big">ðŸ“·</div>
                <p className="scan-desc">Enter a Dealer ID or paste a dealer link</p>
                <input
                  className="scan-input"
                  placeholder="e.g. DLR-XXXXXXXX"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  autoFocus
                />
                <button className="scan-go" onClick={handleScan} disabled={!scanInput.trim()}>
                  Go to Dealer Page â†’
                </button>
                <button className="scan-camera-btn" onClick={handleCameraQR}>
                  ðŸ“· Open Camera to Scan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .user-shell{min-height:100vh;background:#F5F5F5;display:flex;flex-direction:column}
        .user-topbar{height:56px;background:#fff;border-bottom:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;position:sticky;top:0;z-index:100;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        .topbar-brand{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.18em;color:#F47B20;text-decoration:none;flex-shrink:0}
        .topbar-right{display:flex;align-items:center;gap:0.625rem}
        .greeting{font-size:0.8rem;color:#888;white-space:nowrap}
        .greeting strong{color:#F47B20}
        .avatar-btn{width:32px;height:32px;border-radius:50%;border:2px solid #F47B20;background:#FFF7ED;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;transition:transform 0.2s}
        .avatar-btn:hover{transform:scale(1.08)}
        .avatar-img{width:100%;height:100%;object-fit:cover;display:block}
        .avatar-letter{font-family:var(--font-display);font-size:0.9rem;color:#F47B20}
        .logout-topbar-btn{background:none;border:1px solid #E5E5E5;border-radius:6px;color:#AAA;font-size:0.9rem;cursor:pointer;padding:0.3rem 0.5rem;transition:all 0.2s;line-height:1}
        .logout-topbar-btn:hover{color:#DC2626;border-color:#FCA5A5;background:#FEF2F2}
        .user-content{flex:1;padding:1.25rem;max-width:900px;width:100%;margin:0 auto;padding-bottom:120px}
        .user-footer{background:#fff;border-top:1px solid #E5E5E5;padding:0.875rem 1.25rem;text-align:center}
        .uf-inner{display:flex;align-items:center;justify-content:center;gap:1.5rem;font-size:0.7rem;color:#CCC;flex-wrap:wrap}
        .uf-dev strong{color:#F47B20}
        .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:68px;background:#fff;border-top:1.5px solid #E5E5E5;display:flex;align-items:center;justify-content:space-around;z-index:100;padding-bottom:env(safe-area-inset-bottom,0)}
        .bni{display:flex;flex-direction:column;align-items:center;gap:0.15rem;text-decoration:none;color:#AAA;background:none;border:none;cursor:pointer;padding:0.5rem;min-width:52px;transition:color 0.2s;font-family:var(--font-body)}
        .bni:hover,.bni.active{color:#F47B20}
        .bni-icon{font-size:1.15rem}
        .bni-label{font-size:0.58rem;letter-spacing:0.03em}
        .qr-circle{width:46px;height:46px;background:#F47B20;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:-14px;box-shadow:0 4px 12px rgba(244,123,32,0.35)}
        .bni-avatar{width:26px;height:26px;border-radius:50%;background:#F47B20;color:#fff;font-family:var(--font-display);font-size:0.75rem;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid #F47B20}
        .bni-pic{width:100%;height:100%;object-fit:cover}
        .scan-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .scan-modal{background:#fff;border-radius:16px;width:100%;max-width:380px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
        .scan-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5}
        .scan-title{font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;color:#1A1A1A}
        .scan-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .scan-body{padding:1.5rem;display:flex;flex-direction:column;align-items:center;gap:1rem}
        .scan-icon-big{font-size:3rem}
        .scan-desc{font-size:0.875rem;color:#888;text-align:center}
        .scan-input{width:100%;background:#F5F5F5;border:1.5px solid #DDD;border-radius:8px;padding:0.875rem 1rem;color:#1A1A1A;font-size:0.95rem;font-family:var(--font-mono);outline:none;transition:border-color 0.2s;text-align:center;letter-spacing:0.1em}
        .scan-input:focus{border-color:#F47B20;background:#fff}
        .scan-input::placeholder{font-family:var(--font-body);letter-spacing:0;color:#CCC;font-size:0.875rem}
        .scan-go{width:100%;background:#F47B20;color:#fff;border:none;border-radius:8px;padding:0.875rem;font-family:var(--font-display);font-size:0.95rem;letter-spacing:0.08em;cursor:pointer;transition:opacity 0.2s}
        .scan-go:hover{opacity:0.85}
        .scan-go:disabled{opacity:0.5;cursor:not-allowed}
        .scan-camera-btn{width:100%;background:#F5F5F5;border:1.5px solid #DDD;color:#666;border-radius:8px;padding:0.75rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s}
        .scan-camera-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        @media(max-width:480px){.greeting{display:none}}
      `}</style>
    </AuthGuard>
  );
}



