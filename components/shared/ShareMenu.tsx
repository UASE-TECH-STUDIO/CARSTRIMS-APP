"use client";
import { useToast } from "@/store/toastStore";

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

/**
 * A bottom sheet offering direct-share options, instead of relying
 * only on the generic OS share sheet (navigator.share) or a plain
 * copy-link fallback.
 *
 * Technical reality worth being upfront about, since it shapes what
 * each option actually does:
 *
 * - WhatsApp and Facebook both support genuine direct-share via a
 *   plain URL (wa.me and the Facebook sharer endpoint) - tapping
 *   these opens the app itself with the message/link already
 *   attached, a true one-tap share.
 *
 * - Instagram has no equivalent. It does not support sharing a link
 *   or pre-filled text to feed, DM, or Story via a URL at all -
 *   that only works through Instagram's own native SDK embedded
 *   directly in an app, which this is not. The Instagram option here
 *   is the honest best effort available without that SDK: copy the
 *   link, then open Instagram so the person can paste it themselves.
 *
 * - TikTok has the exact same limitation as Instagram, for the same
 *   reason (Meta and TikTok both gate rich link-sharing behind their
 *   own native SDKs, not a public URL). Same honest best effort:
 *   copy the link, open the app.
 *
 * - "WhatsApp Status" specifically has the same limitation - wa.me
 *   only opens WhatsApp's chat composer, there is no URL that opens
 *   the Status composer directly. Rather than offer a "Status"
 *   button that silently does the same thing as the WhatsApp chat
 *   button (misleading), the WhatsApp option is labeled plainly and
 *   the person can forward it to their own Status from inside
 *   WhatsApp themselves, same as they would with any other link.
 *
 * On the image/rich-preview showing up at all: every option here
 * points at the same car detail URL, which already has real Open
 * Graph tags (title, description, image) set server-side - WhatsApp,
 * Facebook, and Instagram (when pasted into a DM) all generate their
 * preview by fetching those tags from the URL, not from anything
 * this component sends directly. If WhatsApp shows a picture and
 * Facebook doesn't for the same link, that's almost always Facebook's
 * own scraper serving a stale cached scrape from before the OG tags
 * existed - their cache needs a manual refresh per URL via
 * developers.facebook.com/tools/debug, which only Facebook can do,
 * not something fixable from this app's code.
 *
 * "More" falls back to navigator.share() for every other app already
 * installed and registered as a share target (Telegram, X, SMS,
 * email, etc.) - the one thing the OS share sheet is actually good
 * at that a hand-picked list of buttons can't replace.
 */
export default function ShareMenu({ url, title, onClose }: Props) {
  const showToast = useToast();

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`, "_blank");
    onClose();
  };

  const openFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    onClose();
  };

  const openInstagram = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied — paste it into your Instagram post, Story, or DM", "success");
    } catch {
      showToast("Couldn't copy the link", "error");
    }
    // Best effort: try the app URL scheme first (works on mobile if
    // Instagram is installed), falling back to the web version.
    // There's no way to detect whether the app scheme succeeded, so
    // this fires both in sequence rather than picking one blind.
    window.location.href = "instagram://app";
    setTimeout(() => window.open("https://www.instagram.com/", "_blank"), 600);
    onClose();
  };

  const openTikTok = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied — paste it into your TikTok bio, post caption, or DM", "success");
    } catch {
      showToast("Couldn't copy the link", "error");
    }
    // Same best-effort pattern as Instagram - try the app scheme,
    // fall back to the web version a moment later.
    window.location.href = "tiktok://";
    setTimeout(() => window.open("https://www.tiktok.com/", "_blank"), 600);
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied!", "success");
    } catch {
      showToast("Couldn't copy the link", "error");
    }
    onClose();
  };

  const openMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e: any) {
        if (e?.name !== "AbortError") await copyLink();
      }
    } else {
      await copyLink();
    }
    onClose();
  };

  return (
    <div className="shm-backdrop" onClick={onClose}>
      <div className="shm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="shm-handle" />
        <div className="shm-title">Share this vehicle</div>
        <div className="shm-grid">
          <button className="shm-opt" onClick={openWhatsApp}>
            <span className="shm-icon shm-wa">W</span>
            <span>WhatsApp</span>
          </button>
          <button className="shm-opt" onClick={openFacebook}>
            <span className="shm-icon shm-fb">f</span>
            <span>Facebook</span>
          </button>
          <button className="shm-opt" onClick={openInstagram}>
            <span className="shm-icon shm-ig">IG</span>
            <span>Instagram</span>
          </button>
          <button className="shm-opt" onClick={openTikTok}>
            <span className="shm-icon shm-tt">TT</span>
            <span>TikTok</span>
          </button>
          <button className="shm-opt" onClick={copyLink}>
            <span className="shm-icon shm-copy">🔗</span>
            <span>Copy Link</span>
          </button>
          {typeof navigator !== "undefined" && !!navigator.share && (
            <button className="shm-opt" onClick={openMore}>
              <span className="shm-icon shm-more">···</span>
              <span>More</span>
            </button>
          )}
        </div>
        <button className="shm-cancel" onClick={onClose}>Cancel</button>
      </div>

      <style>{`
        .shm-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1200; display:flex; align-items:flex-end; }
        .shm-sheet { width:100%; background:#fff; border-radius:16px 16px 0 0; padding:0.75rem 1.25rem calc(1rem + var(--sab, 0px)); }
        .shm-handle { width:36px; height:4px; background:#E5E5E5; border-radius:2px; margin:0 auto 0.75rem; }
        .shm-title { font-size:0.9rem; font-weight:700; color:#1A1A1A; text-align:center; margin-bottom:1rem; }
        .shm-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:0.75rem; margin-bottom:1rem; }
        .shm-opt { display:flex; flex-direction:column; align-items:center; gap:0.4rem; background:none; border:none; cursor:pointer; font-size:0.72rem; color:#525252; font-family:var(--font-body); font-weight:600; }
        .shm-icon { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem; color:#fff; }
        .shm-wa { background:#25D366; }
        .shm-fb { background:#1877F2; }
        .shm-ig { background:linear-gradient(45deg,#F58529,#DD2A7B,#8134AF); font-size:0.7rem; }
        .shm-tt { background:#000; font-size:0.7rem; }
        .shm-copy { background:#525252; }
        .shm-more { background:#A3A3A3; }
        .shm-cancel { width:100%; padding:0.75rem; border-radius:10px; border:1.5px solid #E5E5E5; background:#F5F5F5; color:#525252; font-weight:700; font-size:0.85rem; cursor:pointer; font-family:var(--font-body); }
      `}</style>
    </div>
  );
}
