"use client";
import { useEffect, useState } from "react";

const DISMISS_KEY = "carstrims_search_hint_dismissed";

/**
 * A small arrow-pointing hint next to the search icon, encouraging
 * people (especially new or less tech-confident users) to actually
 * discover that they can type or say what they want and get taken
 * straight there — same spirit as the feed page's own arrow hints
 * pointing at its search box.
 *
 * Shows once, dismissible, and stays dismissed (localStorage, not
 * just for the current session) once someone closes it or actually
 * uses the search - no reason to keep nagging someone who already
 * knows about it.
 */
export default function SearchHint({ onUseSearch }: { onUseSearch?: () => void }) {
  const [dismissed, setDismissed] = useState(true); // default hidden until we check localStorage, avoids a flash

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  if (dismissed) return null;

  return (
    <div className="sh-wrap">
      <div className="sh-arrow">↑</div>
      <div className="sh-bubble">
        <button className="sh-close" onClick={dismiss} aria-label="Dismiss">✕</button>
        <div className="sh-text">
          <strong>New here? Confused?</strong> Tap here and tell us what you want — we'll take you straight there.
        </div>
        <button
          className="sh-try"
          onClick={() => { dismiss(); onUseSearch?.(); }}
        >
          Try it now
        </button>
      </div>
      <style jsx>{`
        .sh-wrap {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 45;
          display: flex; flex-direction: column; align-items: flex-end;
        }
        .sh-arrow {
          color: #F47B20; font-size: 1.1rem; line-height: 1; margin-right: 14px;
          animation: sh-bounce 1.2s ease-in-out infinite;
        }
        @keyframes sh-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .sh-bubble {
          background: #1A1A1A; color: #fff; border-radius: 12px; padding: 0.75rem 0.875rem;
          max-width: 240px; box-shadow: 0 12px 28px rgba(0,0,0,0.25); position: relative;
        }
        .sh-close {
          position: absolute; top: 6px; right: 8px; background: none; border: none;
          color: rgba(255,255,255,0.6); cursor: pointer; font-size: 0.75rem; padding: 0.2rem;
        }
        .sh-text { font-size: 0.78rem; line-height: 1.5; padding-right: 1rem; }
        .sh-text strong { color: #FDBA74; }
        .sh-try {
          margin-top: 0.5rem; background: #F47B20; color: #fff; border: none; border-radius: 7px;
          padding: 0.4rem 0.75rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;
          font-family: var(--font-display, inherit); letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
