import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

/**
 * Real, working PDF/Excel generation + native download + native share —
 * replacing the old window.open() + window.print() approach, which
 * silently does nothing inside a Capacitor WebView (no popup support,
 * no OS print handler configured). This works the same way on web,
 * Android, and iOS.
 *
 * Capacitor's Filesystem/Share plugins are loaded dynamically so this
 * file works fine in a plain web build too — on web, we fall back to a
 * normal <a download> link and the Web Share API.
 */

async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Renders a DOM element to a single-page-per-screenful PDF Blob. */
export async function renderElementToPdfBlob(element: HTMLElement, title = "Document"): Promise<Blob> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.setProperties({ title });
  return pdf.output("blob");
}

/**
 * Renders a full standalone HTML document string (e.g. the detailed
 * invoice/receipt templates already built with window.print() in mind)
 * into a real PDF, via a hidden offscreen iframe. This means existing,
 * carefully-designed HTML templates don't need to be rewritten or
 * duplicated as JSX — they get converted into an actual downloadable/
 * shareable PDF file exactly as they already look.
 */
export async function renderHtmlStringToPdfBlob(htmlString: string, title = "Document"): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "1131px"; // ~A4 ratio at this width
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      const doc = iframe.contentDocument;
      if (!doc) { reject(new Error("Could not prepare document for PDF")); return; }
      doc.open();
      // Strip the auto-print script — we're rendering to canvas, not printing.
      doc.write(htmlString.replace(/<script>window\.onload=\(\)=>window\.print\(\)<\\\/script>/, ""));
      doc.close();

      const settle = () => {
        // Give images inside the iframe a moment to finish loading.
        const imgs = Array.from(doc.images || []);
        const pending = imgs.filter((img) => !img.complete);
        if (pending.length === 0) { resolve(); return; }
        let remaining = pending.length;
        const done = () => { remaining -= 1; if (remaining <= 0) resolve(); };
        pending.forEach((img) => { img.onload = done; img.onerror = done; });
        setTimeout(resolve, 3000); // safety timeout either way
      };

      if (doc.readyState === "complete") settle();
      else iframe.onload = () => settle();
    });

    const target = iframe.contentDocument?.body;
    if (!target) throw new Error("Nothing to export yet");
    return await renderElementToPdfBlob(target, title);
  } finally {
    document.body.removeChild(iframe);
  }
}
export function rowsToExcelBlob(rows: Record<string, any>[], sheetName = "Sheet1"): Blob {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Saves a file to the device and, on native platforms, opens it
 * immediately so the user sees "downloaded" happen (matching the
 * one-tap expectation) rather than it silently landing in a folder.
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  if (await isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { FileOpener } = await importFileOpenerSafely();
    const base64Data = await blobToBase64(blob);
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });
    if (FileOpener) {
      try {
        await FileOpener.open({ filePath: result.uri, contentType: blob.type });
      } catch {
        // Opening isn't critical — the file is already saved either way.
      }
    }
    return;
  }

  // Web fallback: plain browser download.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Opens the native share sheet with the actual file attached (not just text). */
export async function shareBlob(blob: Blob, filename: string, title = "Share"): Promise<void> {
  if (await isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const base64Data = await blobToBase64(blob);
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({ title, url: result.uri });
    return;
  }

  // Web fallback: Web Share API with an actual file, if the browser supports it.
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return;
  }

  // Last-resort fallback: just download it, since there's no share surface available.
  await downloadBlob(blob, filename);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Filesystem.writeFile wants raw base64, not the data: URL prefix.
      resolve(result.split(",")[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// @capacitor/file-opener isn't in package.json (optional nicety, not a
// hard requirement) — load it defensively so its absence never breaks
// the core download/share flow.
async function importFileOpenerSafely(): Promise<{ FileOpener: any }> {
  try {
    const mod = await import(/* webpackIgnore: true */ "@capacitor-community/file-opener" as any);
    return { FileOpener: (mod as any).FileOpener };
  } catch {
    return { FileOpener: null };
  }
}
