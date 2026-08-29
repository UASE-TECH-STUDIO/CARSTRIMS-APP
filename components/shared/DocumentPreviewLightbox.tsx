"use client";
import { useState } from "react";
import ZoomableImage from "@/components/ui/ZoomableImage";
import { renderElementToJpgBlob } from "@/lib/documentExport";

interface Props {
  /** Ref (or array of refs, for front+back documents) to the exact
   * same live DOM element(s) already used for download/share -
   * guarantees the fullscreen preview is pixel-identical to what
   * actually gets exported, since it's generated from the very same
   * capture function and element, not a separately maintained
   * preview path that could drift out of sync. */
  getElements: () => (HTMLElement | null)[];
  children: React.ReactNode;
}

/**
 * "Tap to view fullscreen + zoom before printing" (real gap reported:
 * the small inline preview on Design Studio pages was cramped, had
 * no way to view it larger, and no way to zoom in to actually check
 * fine print/detail before committing to a download or share).
 *
 * Wraps whatever's passed as children (the small on-page preview) in
 * a clickable area; tapping it captures the real export element(s)
 * on demand and opens the result in the same pinch/double-tap-zoom
 * lightbox already used for car photos, one page at a time with
 * simple prev/next if there's a back side.
 */
export default function DocumentPreviewLightbox({ getElements, children }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const elements = getElements().filter((el): el is HTMLElement => !!el);
      if (elements.length === 0) return;
      const urls = await Promise.all(
        elements.map(async (el) => {
          const blob = await renderElementToJpgBlob(el, 0.95);
          return URL.createObjectURL(blob);
        })
      );
      setPages(urls);
      setPageIndex(0);
      setOpen(true);
    } catch {
      // Silently do nothing on failure - the small inline preview is
      // still visible, so the person hasn't lost anything by tapping.
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    pages.forEach((url) => URL.revokeObjectURL(url));
    setPages([]);
    setOpen(false);
  };

  return (
    <>
      <div onClick={handleOpen} style={{ cursor: "zoom-in", position: "relative" }}>
        {children}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: loading ? "rgba(255,255,255,0.6)" : "transparent", pointerEvents: "none",
        }}>
          {loading && <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F47B20" }}>Loading preview…</div>}
        </div>
        {!loading && (
          <div style={{
            position: "absolute", bottom: "6px", right: "6px", background: "rgba(26,26,26,0.75)", color: "#fff",
            fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "20px", pointerEvents: "none",
          }}>
            Tap to view full size
          </div>
        )}
      </div>

      {open && pages.length > 0 && (
        <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={handleClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.3rem", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", zIndex: 1 }}>×</button>
          {pages.length > 1 && (
            <div style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: "0.85rem", fontWeight: 700 }}>
              {pageIndex === 0 ? "Front" : "Back"} ({pageIndex + 1} / {pages.length})
            </div>
          )}
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
            <ZoomableImage
              src={pages[pageIndex]}
              alt=""
              onSwipeLeft={() => pages.length > 1 && setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
              onSwipeRight={() => pages.length > 1 && setPageIndex((i) => Math.max(0, i - 1))}
            />
          </div>
          {pages.length > 1 && (
            <div style={{ position: "absolute", bottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
              {pages.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setPageIndex(i); }} style={{
                  width: "8px", height: "8px", borderRadius: "50%", border: "none", cursor: "pointer",
                  background: i === pageIndex ? "#F47B20" : "rgba(255,255,255,0.4)",
                }} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
