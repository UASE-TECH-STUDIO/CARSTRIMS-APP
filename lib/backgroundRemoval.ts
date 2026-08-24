/**
 * Client-side background removal for logos, signatures, and other
 * images uploaded across the app.
 *
 * Detects and removes near-white pixels with a feathered edge - works
 * well for a logo or signature scanned/photographed on plain white
 * paper, which is the common case across the app's upload flows.
 *
 * A real AI-based subject segmentation approach (@imgly/background-
 * removal, via onnxruntime-web) was tried here and reverted - it
 * ships pre-built .mjs bundles that use import.meta in a way Next.js's
 * webpack/Terser build cannot compile, confirmed across multiple
 * different bundled backend files (CPU, WASM, WebGPU), not just one -
 * a systemic packaging incompatibility rather than a single
 * fixable spot. A targeted webpack workaround was attempted first and
 * didn't resolve it, so reverting to this proven, working method was
 * the right call rather than continuing to fight bundler
 * configuration for a dependency that isn't Next.js-compatible out of
 * the box.
 */

export interface BgRemovalResult {
  file: File;
  previewUrl: string;
}

/**
 * Removes near-white background pixels, with a feathered edge so the
 * cutout doesn't look harshly cut out. Best suited to plain
 * white-background scans/photos - won't do anything useful for a
 * photo with a real, complex background.
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
