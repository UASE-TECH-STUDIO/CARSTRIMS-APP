"use client";
import { useState, useEffect } from "react";
import { removeBackgroundSmart, BgRemovalProgress } from "@/lib/backgroundRemoval";

interface Props {
  file: File;
  onConfirm: (file: File) => void;
  onCancel: () => void;
  label?: string;
}

/**
 * Shown right after picking a logo/signature file, before it's
 * actually uploaded — offers an optional "Remove White Background"
 * step with a live before/after preview (checkered pattern shows
 * through the transparent parts), so the person can see the result
 * and decide whether to use it or keep the original.
 */
export default function BackgroundRemovalPreview({ file, onConfirm, onCancel, label = "Image" }: Props) {
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<BgRemovalProgress | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleRemoveBackground = async () => {
    setProcessing(true);
    setError("");
    setProgress(null);
    try {
      const result = await removeBackgroundSmart(file, setProgress);
      setProcessedUrl(result.previewUrl);
      setProcessedFile(result.file);
      setUsedFallback(result.usedFallback);
    } catch (e: any) {
      setError(e?.message || "Couldn't process this image");
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="bgr-overlay" onClick={onCancel}>
      <div className="bgr-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="bgr-title">{label}</h3>
        <p className="bgr-hint">
          Uses AI to detect and remove the background automatically — works with any photo, not just plain white backgrounds. The first time may take a little longer while the model loads.
        </p>

        <div className="bgr-preview-row">
          <div className="bgr-preview-col">
            <div className="bgr-label">Original</div>
            <div className="bgr-preview-box">
              {originalUrl && <img src={originalUrl} alt="Original" />}
            </div>
          </div>
          <div className="bgr-preview-col">
            <div className="bgr-label">Background Removed</div>
            <div className="bgr-preview-box bgr-checkered">
              {processing ? (
                <div className="bgr-progress">
                  <div className="bgr-spinner" />
                  {progress && (
                    <span className="bgr-progress-label">
                      {progress.label}{progress.percent != null ? ` ${progress.percent}%` : ""}
                    </span>
                  )}
                </div>
              ) : processedUrl ? (
                <img src={processedUrl} alt="Background removed" />
              ) : (
                <span className="bgr-placeholder">Tap "Remove Background" to preview</span>
              )}
            </div>
          </div>
        </div>

        {error && <div className="bgr-error">{error}</div>}
        {usedFallback && !error && (
          <div className="bgr-notice">
            AI background removal wasn't available right now, so a simpler method was used instead — it works best on plain white backgrounds. Try again for AI-quality results on any background.
          </div>
        )}

        <div className="bgr-actions">
          {!processedFile ? (
            <button className="bgr-btn bgr-btn-primary" onClick={handleRemoveBackground} disabled={processing}>
              {processing ? "Processing…" : "Remove Background"}
            </button>
          ) : (
            <button className="bgr-btn bgr-btn-primary" onClick={() => onConfirm(processedFile)}>
              Use This Version
            </button>
          )}
          <button className="bgr-btn bgr-btn-secondary" onClick={() => onConfirm(file)}>
            Use Original
          </button>
          <button className="bgr-btn bgr-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <style jsx>{`
          .bgr-overlay { position: fixed; inset: 0; background: rgba(23,23,23,0.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
          .bgr-panel { background: #fff; border-radius: 16px; padding: 1.5rem; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
          .bgr-title { font-family: var(--font-display, inherit); font-size: 1.1rem; letter-spacing: 0.04em; color: #1A1A1A; margin: 0 0 0.4rem; }
          .bgr-hint { font-size: 0.8rem; color: #737373; line-height: 1.5; margin: 0 0 1.25rem; }
          .bgr-preview-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
          .bgr-preview-col { flex: 1; min-width: 0; }
          .bgr-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #A3A3A3; margin-bottom: 0.4rem; }
          .bgr-preview-box { aspect-ratio: 1; border: 1.5px solid #E5E5E5; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #FAFAFA; }
          .bgr-preview-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
          .bgr-checkered { background-image: linear-gradient(45deg,#E5E5E5 25%,transparent 25%),linear-gradient(-45deg,#E5E5E5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E5E5 75%),linear-gradient(-45deg,transparent 75%,#E5E5E5 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0px; }
          .bgr-placeholder { font-size: 0.72rem; color: #A3A3A3; text-align: center; padding: 1rem; }
          .bgr-spinner { width: 24px; height: 24px; border: 2.5px solid #E5E5E5; border-top-color: #F47B20; border-radius: 50%; animation: bgr-spin 0.8s linear infinite; }
          @keyframes bgr-spin { to { transform: rotate(360deg); } }
          .bgr-progress { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
          .bgr-progress-label { font-size: 0.68rem; color: #A3A3A3; text-align: center; padding: 0 0.5rem; }
          .bgr-notice { background: #FFF7ED; color: #C4621A; border: 1px solid rgba(244,123,32,0.3); border-radius: 8px; padding: 0.6rem 0.875rem; font-size: 0.78rem; line-height: 1.5; margin-bottom: 1rem; }
          .bgr-error { background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 8px; padding: 0.6rem 0.875rem; font-size: 0.8rem; margin-bottom: 1rem; }
          .bgr-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
          .bgr-btn { flex: 1; min-width: 120px; border: none; border-radius: 8px; padding: 0.7rem 1rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: var(--font-body, inherit); }
          .bgr-btn-primary { background: #F47B20; color: #fff; }
          .bgr-btn-secondary { background: #F5F5F5; color: #525252; border: 1.5px solid #E5E5E5; }
          .bgr-btn-cancel { background: none; color: #A3A3A3; flex: 0 0 auto; min-width: auto; padding: 0.7rem 1rem; }
        `}</style>
      </div>
    </div>
  );
}
