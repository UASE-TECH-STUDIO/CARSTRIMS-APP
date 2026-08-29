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
 * Renders one or more DOM elements to a PDF sized as a standard CR80
 * card (3.375in x 2.125in - the same physical dimensions as a credit
 * card and what most professional ID card printers expect), rather
 * than forcing it onto a full A4 page like renderElementToPdfBlob
 * does. Used for ID cards and any other small-format printable
 * design.
 *
 * Accepts either a single element or an array - an array of two
 * (front, back) produces a proper 2-page PDF, since a printer needs
 * both sides and most professional card printers expect either
 * separate files or a multi-page PDF, not a single combined image.
 *
 * Captured at a higher scale than the general document exporter
 * (3x instead of 2x) - cards are physically small, so print crispness
 * per square inch matters more here than it does for a full page.
 */
export async function renderElementToCardPdfBlob(elementOrElements: HTMLElement | HTMLElement[], title = "ID Card"): Promise<Blob> {
  const elements = Array.isArray(elementOrElements) ? elementOrElements : [elementOrElements];

  const CARD_WIDTH_PT = 243;  // 3.375in * 72pt/in
  const CARD_HEIGHT_PT = 153; // 2.125in * 72pt/in

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [CARD_WIDTH_PT, CARD_HEIGHT_PT] });

  for (let i = 0; i < elements.length; i++) {
    const canvas = await html2canvas(elements[i], { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage([CARD_WIDTH_PT, CARD_HEIGHT_PT], "landscape");
    pdf.addImage(imgData, "PNG", 0, 0, CARD_WIDTH_PT, CARD_HEIGHT_PT);
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

    // Same fix as renderHtmlStringToJpgBlob - resize to the real
    // content height before capture, so any template using vh/%-
    // relative CSS resolves against the actual document size rather
    // than the fixed placeholder height set above.
    const doc = iframe.contentDocument;
    if (doc?.body) {
      const fullHeight = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0);
      if (fullHeight > 0) iframe.style.height = `${fullHeight}px`;
    }

    const target = iframe.contentDocument?.body;
    if (!target) throw new Error("Nothing to export yet");
    return await renderElementToPdfBlob(target, title);
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Renders a DOM element to a JPG Blob. These two JPG functions were
 * called throughout the app (dealer cars/sales/movements/expenses/
 * reports, partner cars, admin user detail) but never actually
 * implemented here - every "Export as JPG" button in the app has been
 * silently broken since it was first wired up, throwing
 * "renderElementToJpgBlob is not a function" the moment it's clicked.
 */
export async function renderElementToJpgBlob(element: HTMLElement, quality = 0.92): Promise<Blob> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not generate image"))),
      "image/jpeg",
      quality
    );
  });
}

function canvasToJpgBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not generate image"))),
      "image/jpeg",
      quality
    );
  });
}

/**
 * Multi-page JPG splitting (item 20) - captures the element once,
 * then slices the result into one or more page-proportioned images
 * rather than either of the two bad outcomes a single flat JPG
 * otherwise forces: cutting genuinely long content off entirely (the
 * old fixed-iframe-height bug), or producing one unreasonably tall
 * single image that renders and shares poorly.
 *
 * Uses the exact same A4-proportion and "close enough to one page,
 * don't bother splitting" 1.4x threshold as renderElementToPdfBlob's
 * page splitter, so the two export formats behave consistently for
 * the same document - a report that fits one PDF page also comes
 * out as one JPG, and one that needs 3 PDF pages comes out as 3 JPGs.
 */
export async function renderElementToJpgBlobs(element: HTMLElement, quality = 0.92): Promise<Blob[]> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });

  // A4 is 210x297mm - this is the same proportion applied to
  // pixel width that renderElementToPdfBlob applies in points, so
  // "one page" means the same thing in both export paths.
  const pageHeightPx = canvas.width * (297 / 210);

  if (canvas.height <= pageHeightPx * 1.4) {
    return [await canvasToJpgBlob(canvas, quality)];
  }

  const blobs: Blob[] = [];
  let offset = 0;
  const MIN_MEANINGFUL_REMAINDER = canvas.width * 0.02; // ~one visible line, scaled to this canvas
  let safetyPages = 0;

  while (offset < canvas.height - MIN_MEANINGFUL_REMAINDER && safetyPages < 50) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offset);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image slice");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    blobs.push(await canvasToJpgBlob(sliceCanvas, quality));
    offset += pageHeightPx;
    safetyPages += 1;
  }

  return blobs;
}

/**
 * Shared setup for both HTML-string JPG export functions - creates
 * the hidden offscreen iframe, writes the HTML into it, waits for
 * images to settle, then resizes the iframe to the document's real
 * content height (the item 17/18 sizing fix) before handing back the
 * prepared body element. Caller is responsible for removing the
 * iframe from the DOM once done with it.
 */
async function prepareIframeForExport(htmlString: string): Promise<{ iframe: HTMLIFrameElement; target: HTMLElement }> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  // Starting height is just a reasonable placeholder for layout to
  // begin against - it gets corrected below to the real content
  // height before anything is captured, so this initial guess never
  // actually constrains the final image.
  iframe.style.height = "1131px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    const doc = iframe.contentDocument;
    if (!doc) { reject(new Error("Could not prepare document for image export")); return; }
    doc.open();
    doc.write(htmlString.replace(/<script>window\.onload=\(\)=>window\.print\(\)<\\\/script>/, ""));
    doc.close();

    const settle = () => {
      const imgs = Array.from(doc.images || []);
      const pending = imgs.filter((img) => !img.complete);
      if (pending.length === 0) { resolve(); return; }
      let remaining = pending.length;
      const done = () => { remaining -= 1; if (remaining <= 0) resolve(); };
      pending.forEach((img) => { img.onload = done; img.onerror = done; });
      setTimeout(resolve, 3000);
    };

    if (doc.readyState === "complete") settle();
    else iframe.onload = () => settle();
  });

  // Real fix for JPG sizing/cutoff: resize the iframe to the
  // document's actual full content height (not the fixed 1131px
  // starting guess) before capturing - otherwise any document
  // genuinely taller than one A4 page, or any template using
  // vh/%-relative sizing that resolves against the iframe's own
  // box rather than its content, would be clipped or laid out
  // against the wrong height.
  const doc = iframe.contentDocument;
  if (doc?.body) {
    const fullHeight = Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0);
    if (fullHeight > 0) iframe.style.height = `${fullHeight}px`;
  }

  const target = iframe.contentDocument?.body;
  if (!target) throw new Error("Nothing to export yet");
  return { iframe, target };
}

/**
 * Same idea as renderHtmlStringToPdfBlob, but for JPG - renders a full
 * standalone HTML document string via a hidden offscreen iframe, then
 * captures it as a single JPG image instead of assembling a PDF.
 */
export async function renderHtmlStringToJpgBlob(htmlString: string): Promise<Blob> {
  const { iframe, target } = await prepareIframeForExport(htmlString);
  try {
    return await renderElementToJpgBlob(target);
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Plural sibling of renderHtmlStringToJpgBlob (item 20) - same iframe
 * preparation, but returns one JPG per page via
 * renderElementToJpgBlobs instead of forcing everything into one
 * image.
 */
export async function renderHtmlStringToJpgBlobs(htmlString: string): Promise<Blob[]> {
  const { iframe, target } = await prepareIframeForExport(htmlString);
  try {
    return await renderElementToJpgBlobs(target);
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

/**
 * Plural sibling of downloadBlob for multi-page JPG exports (item
 * 20) - saves each page as its own numbered file. Works identically
 * on native and web since it's just downloadBlob in a loop; there's
 * no single-file-picker limitation to work around here the way
 * there is for sharing.
 */
export async function downloadBlobs(blobs: Blob[], baseFilename: string): Promise<void> {
  if (blobs.length === 1) {
    await downloadBlob(blobs[0], baseFilename);
    return;
  }
  const dotIndex = baseFilename.lastIndexOf(".");
  const stem = dotIndex >= 0 ? baseFilename.slice(0, dotIndex) : baseFilename;
  const ext = dotIndex >= 0 ? baseFilename.slice(dotIndex) : "";
  for (let i = 0; i < blobs.length; i++) {
    await downloadBlob(blobs[i], `${stem}-page${i + 1}${ext}`);
  }
}

/**
 * Plural sibling of shareBlob for multi-page JPG exports (item 20).
 * On web, the Share API genuinely supports multiple files in one
 * share sheet, so all pages go out together. Capacitor's native
 * Share plugin only ever accepts a single url, though - there's no
 * multi-file native share surface to hand every page to. Rather than
 * silently dropping every page after the first on native, this
 * shares just the first page and returns a note explaining that, so
 * the caller can tell the person honestly instead of pretending
 * every page went out.
 */
export async function shareBlobs(blobs: Blob[], baseFilename: string, title = "Share"): Promise<{ note?: string }> {
  if (blobs.length === 1) {
    await shareBlob(blobs[0], baseFilename, title);
    return {};
  }

  if (!(await isNative())) {
    const dotIndex = baseFilename.lastIndexOf(".");
    const stem = dotIndex >= 0 ? baseFilename.slice(0, dotIndex) : baseFilename;
    const ext = dotIndex >= 0 ? baseFilename.slice(dotIndex) : "";
    const files = blobs.map((b, i) => new File([b], `${stem}-page${i + 1}${ext}`, { type: b.type }));
    if (navigator.canShare && navigator.canShare({ files })) {
      await navigator.share({ title, files });
      return {};
    }
  }

  // Native, or a web browser without multi-file share support -
  // share the first page only, and say so.
  const dotIndex = baseFilename.lastIndexOf(".");
  const stem = dotIndex >= 0 ? baseFilename.slice(0, dotIndex) : baseFilename;
  const ext = dotIndex >= 0 ? baseFilename.slice(dotIndex) : "";
  await shareBlob(blobs[0], `${stem}-page1${ext}`, title);
  return { note: `This document has ${blobs.length} pages - only page 1 could be shared directly. Use Download to get all pages.` };
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
