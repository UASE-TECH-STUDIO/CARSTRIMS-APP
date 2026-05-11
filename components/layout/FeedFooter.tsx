"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface Props {
  onScan: () => void;
}

export default function FeedFooter({ onScan }: Props) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const myDash = user?.role === "SYSTEM_ADMIN" ? "/dashboard/super-admin"
    : user?.role === "DEALER_ADMIN" ? "/dashboard/dealer"
    : user?.role === "PARTNER_USER" ? "/dashboard/partner"
    : user?.role === "DEALER_STAFF" ? "/dashboard/staff"
    : "/dashboard/user";

  return (
    <div className="feed-footer">
      {/* Info panel - toggleable */}
      {expanded && (
        <div className="footer-info">
          <div className="fi-inner">
            <div className="fi-col">
              <div className="fi-head">CARSTRIMS</div>
              <div className="fi-text">Nigeria&apos;s premier car dealer platform. Connect with verified dealers, browse thousands of vehicles and track every deal.</div>
            </div>
            <div className="fi-col">
              <div className="fi-head">CONTACT</div>
              <div className="fi-links">
                <a href="mailto:support@carstrims.com" className="fi-link">support@carstrims.com</a>
                <a href="tel:+2348000000000" className="fi-link">+234 800 000 0000</a>
                <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="fi-link">WhatsApp</a>
              </div>
            </div>
            <div className="fi-col">
              <div className="fi-head">FOLLOW US</div>
              <div className="fi-links">
                <a href="#" className="fi-link fi-social">Instagram</a>
                <a href="#" className="fi-link fi-social">Twitter / X</a>
                <a href="#" className="fi-link fi-social">Facebook</a>
                <a href="#" className="fi-link fi-social">YouTube</a>
              </div>
            </div>
            <div className="fi-col">
              <div className="fi-head">PLATFORM</div>
              <div className="fi-links">
                <Link href="/auth/register" className="fi-link">Register Free</Link>
                <Link href="/auth/login" className="fi-link">Login</Link>
                <span className="fi-link fi-dev">Built by UASE TECH STUDIO</span>
              </div>
            </div>
          </div>
          <div className="fi-copy">© 2026 CARSTRIMS · Powered by UASE TECH STUDIO</div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <Link href="/feed" className="bn-item active">
          <div className="bn-icon">HOME</div>
          <span className="bn-label">Feed</span>
        </Link>

        <button className="bn-item" onClick={onScan}>
          <div className="bn-icon qr">QR</div>
          <span className="bn-label">Scan</span>
        </button>

        <Link href={isAuthenticated ? myDash : "/auth/login"} className="bn-item">
          <div className="bn-icon">ACCT</div>
          <span className="bn-label">{isAuthenticated ? "Dashboard" : "Login"}</span>
        </Link>

        {isAuthenticated && (
          <button className="bn-item" onClick={() => { logout(); router.push("/auth/login"); }}>
            <div className="bn-icon out">OUT</div>
            <span className="bn-label">Logout</span>
          </button>
        )}

        <button className="bn-item" onClick={() => setExpanded(!expanded)}>
          <div className="bn-icon info">{expanded ? "?" : "?"}</div>
          <span className="bn-label">{expanded ? "Less" : "Info"}</span>
        </button>
      </div>

      <style>{`
        .feed-footer {
          position: sticky; bottom: 0; z-index: 100;
          background: #fff; border-top: 1.5px solid #E5E5E5;
        }

        /* Info panel */
        .footer-info {
          background: #1A1A1A; border-top: 1.5px solid #E5E5E5;
          padding: 1.5rem 1.25rem 1rem;
        }
        .fi-inner {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.5rem; max-width: 1200px; margin: 0 auto 1rem;
        }
        .fi-col { display: flex; flex-direction: column; gap: 0.625rem; }
        .fi-head {
          font-family: var(--font-display); font-size: 0.7rem;
          letter-spacing: 0.15em; color: #F47B20;
        }
        .fi-text { font-size: 0.75rem; color: #737373; line-height: 1.5; }
        .fi-links { display: flex; flex-direction: column; gap: 0.35rem; }
        .fi-link {
          font-size: 0.78rem; color: #A3A3A3; text-decoration: none;
          transition: color 0.2s; cursor: pointer;
        }
        .fi-link:hover { color: #F47B20; }
        .fi-social { display: inline-flex; align-items: center; gap: 0.3rem; }
        .fi-dev { font-size: 0.7rem; color: #525252; font-style: italic; cursor: default; }
        .fi-dev:hover { color: #F47B20; }
        .fi-copy {
          text-align: center; font-size: 0.68rem; color: #525252;
          padding-top: 1rem; border-top: 1px solid #2A2A2A;
          max-width: 1200px; margin: 0 auto;
        }

        /* Bottom Nav */
        .bottom-nav {
          display: flex; align-items: center; justify-content: space-around;
          height: 60px; background: #fff;
        }
        .bn-item {
          display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
          text-decoration: none; background: none; border: none; cursor: pointer;
          font-family: var(--font-body); color: #A3A3A3; min-width: 56px;
          transition: color 0.2s; padding: 0.5rem 0.25rem;
        }
        .bn-item:hover, .bn-item.active { color: #F47B20; }
        .bn-icon {
          font-size: 0.55rem; font-weight: 800; letter-spacing: 0.08em;
          color: #A3A3A3; background: #F5F5F5; border: 1.5px solid #E5E5E5;
          border-radius: 8px; padding: 0.35rem 0.5rem; transition: all 0.2s;
          min-width: 36px; text-align: center;
        }
        .bn-item:hover .bn-icon, .bn-item.active .bn-icon {
          background: #FFF7ED; border-color: #F47B20; color: #F47B20;
        }
        .bn-icon.qr {
          background: #F47B20; border-color: #F47B20; color: #fff;
          border-radius: 50%; width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          margin-top: -10px;
          box-shadow: 0 4px 12px rgba(244,123,32,0.35);
          font-size: 0.65rem;
        }
        .bn-item:hover .bn-icon.qr { background: #FF9340; border-color: #FF9340; color: #fff; }
        .bn-icon.out:hover, .bn-item:hover .bn-icon.out { background: #FEF2F2; border-color: #DC2626; color: #DC2626; }
        .bn-icon.info { font-size: 0.7rem; }
        .bn-label { font-size: 0.56rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; }

        @media (max-width: 480px) {
          .fi-inner { grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
