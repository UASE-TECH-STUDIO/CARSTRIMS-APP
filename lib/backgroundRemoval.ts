/**
 * Client-side background removal for logos and signatures.
 *
 * This is NOT full AI-based subject segmentation (that needs either a
 * paid API or a server-side ML model, neither of which this app has
 * set up) — it's a targeted, zero-cost approach for the actual use
 * case: logos and signatures are almost always uploaded on a plain
 * white or near-white background (a scan, a photo of paper, a logo
 * exported with a white canvas). This detects pixels close to that
 * background color and makes them transparent, with edge feathering
 * so the result doesn't look jagged/cut-out.
 *
 * Works well for: white-background logos, black-ink signatures on
 * white paper. Does NOT work for: photos with complex/non-white
 * backgrounds, logos that are themselves white/very light colored
 * (those would get removed too) — which is why this is offered as an
 * optional, previewable step, not applied automatically.
 */

export interface BgRemovalResult {
  file: File;
  previewUrl: string;
}

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
    // How close this pixel is to white, on a 0 (not white at all) to
    // 255 (pure white) scale, using the darkest channel as the
    // limiting factor so colored-but-light pixels aren't over-removed.
    const brightness = Math.min(r, g, b);
    if (brightness >= threshold) {
      data[i + 3] = 0; // fully transparent
    } else if (brightness >= threshold - feather) {
      // Feathered edge: smoothly ramp alpha down instead of a hard
      // cutoff, so the boundary doesn't look jagged.
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
