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

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // A small margin all round makes the result look like an actual
  // printed document rather than a browser screenshot pasted onto a
  // page, and gives page breaks (when they do happen) some breathing
  // room instead of cutting content right at the edge.
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const naturalImgHeight = (canvas.height * usableWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  if (naturalImgHeight <= usableHeight * 1.4) {
    // Content is one page's worth, or reasonably close (the common
    // case for receipts/invoices/proformas — usually just a little
    // taller than A4 at full width because of a signature block or
    // footer). Rather than spilling that overflow onto an almost-
    // entirely-blank second page, shrink the whole document so it
    // fits cleanly on exactly one page. 1.4x (rather than a stricter
    // 1.15x) was chosen after seeing a real invoice sample spill into
    // an awkward split at the old threshold — the shrink is a much
    // better trade-off than a near-empty trailing page.
    const scale = Math.min(1, usableHeight / naturalImgHeight);
    const drawWidth = usableWidth * scale;
    const drawHeight = naturalImgHeight * scale;
    const xOffset = margin + (usableWidth - drawWidth) / 2; // center horizontally if shrunk
    pdf.addImage(imgData, "PNG", xOffset, margin, drawWidth, drawHeight);
  } else {
    // Genuinely multi-page content (e.g. a long itemized report) —
    // split across as many pages as needed, each with the same margin.
    let heightLeft = naturalImgHeight;
    let position = margin;
    pdf.addImage(imgData, "PNG", margin, position, usableWidth, naturalImgHeight);
    heightLeft -= usableHeight;

    // Minimum meaningful remainder before spawning another page - a
    // real bug this fixes: the previous "> 0" check meant even a
    // fraction-of-a-point floating-point remainder (nowhere near a
    // single visible line of text) would trigger a whole extra page,
    // which then rendered as a totally blank trailing page in every
    // PDF export in the app. 12pt is roughly one line of body text -
    // genuinely not worth a whole page below that.
    const MIN_MEANINGFUL_REMAINDER = 12;
    let safetyPages = 0;
    while (heightLeft > MIN_MEANINGFUL_REMAINDER && safetyPages < 50) {
      position = margin - (naturalImgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, naturalImgHeight);
      heightLeft -= usableHeight;
      safetyPages += 1;
    }
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
