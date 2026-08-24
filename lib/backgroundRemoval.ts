/**
 * AI-powered client-side background removal for logos, signatures,
 * and other images uploaded across the app.
 *
 * Uses @imgly/background-removal - a real neural-network-based subject
 * segmentation model (ONNX, running via WebAssembly), the same
 * underlying technology behind most "perfect" background removal
 * tools. Runs entirely in the browser/WebView - no server cost, no
 * API key, no images ever leave the device.
 *
 * This replaces the previous approach, which only detected and
 * removed near-white pixels - it worked for a logo scanned on plain
 * white paper, but did nothing at all for anything with a real,
 * complex background (a car photo, a logo on a colored background,
 * a signature photographed on a desk), which is exactly the
 * "isn't removing anything" complaint this replaces.
 *
 * The AI model files (~40-80MB) download on first use and are cached
 * by the browser afterward - the first run on a given device will be
 * noticeably slower than every run after.
 */

export interface BgRemovalResult {
  file: File;
  previewUrl: string;
}

export interface BgRemovalProgress {
  /** 0-100, or null while still in an indeterminate phase (e.g. warming up) */
  percent: number | null;
  label: string;
}

/**
 * Removes the background from any image using real AI subject
 * segmentation. Works for logos, signatures, product photos, and
 * general images with any background - not just plain white ones.
 */
export async function removeBackgroundAI(
  file: File,
  onProgress?: (progress: BgRemovalProgress) => void
): Promise<BgRemovalResult> {
  onProgress?.({ percent: null, label: "Loading AI model…" });

  // Lazy-loaded - this library and its model files are large, so we
  // only ever pull them in when someone actually uses this feature,
  // not as part of the app's normal page-load bundle.
  const { default: removeBackground } = await import("@imgly/background-removal");

  const blob = await removeBackground(file, {
    progress: (key: string, current: number, total: number) => {
      if (!onProgress) return;
      const pct = total > 0 ? Math.round((current / total) * 100) : null;
      const label = key.includes("fetch")
        ? "Downloading AI model…"
        : "Removing background…";
      onProgress({ percent: pct, label });
    },
  });

  onProgress?.({ percent: 100, label: "Done" });

  const outFile = new File([blob], renameToPng(file.name), { type: "image/png" });
  return { file: outFile, previewUrl: URL.createObjectURL(blob) };
}

/**
 * Fallback: the original near-white-background removal approach.
 * Kept available for two cases: (1) the AI model fails to load
 * (offline first-use, restrictive network, unsupported WebView
 * configuration) and (2) documents that genuinely are just a plain
 * white-background scan, where this simpler method is instant with
 * no model download at all.
 */
export async function removeNearWhiteBackground(
  file: File,
  options: { threshold?: number; feather?: number } = {}
): Promise<BgRemovalResult> {
  const { threshold = 235, feather = 35 } = options;

  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = Math.min(r, g, b);
    if (brightness >= threshold) {
      data[i + 3] = 0;
    } else if (brightness >= threshold - feather) {
      const t = (brightness - (threshold - feather)) / feather;
      data[i + 3] = Math.round(data[i + 3] * (1 - t));
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/png")
  );

  const outFile = new File([blob], renameToPng(file.name), { type: "image/png" });
  return { file: outFile, previewUrl: URL.createObjectURL(blob) };
}

/**
 * Tries the real AI removal first; if it fails for any reason (model
 * couldn't load, unsupported environment, network issue on first
 * use), falls back to the near-white method rather than leaving the
 * person with a hard error and no result at all.
 */
export async function removeBackgroundSmart(
  file: File,
  onProgress?: (progress: BgRemovalProgress) => void
): Promise<BgRemovalResult & { usedFallback: boolean }> {
  try {
    const result = await removeBackgroundAI(file, onProgress);
    return { ...result, usedFallback: false };
  } catch (e) {
    onProgress?.({ percent: null, label: "AI model unavailable, using basic removal…" });
    const result = await removeNearWhiteBackground(file);
    return { ...result, usedFallback: true };
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = URL.createObjectURL(file);
  });
}

function renameToPng(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}-transparent.png`;
}
