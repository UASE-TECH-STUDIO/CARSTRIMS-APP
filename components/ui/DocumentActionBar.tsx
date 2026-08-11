"use client";
import { useState } from "react";
import { renderElementToPdfBlob, rowsToExcelBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

interface Props {
  /** Returns the DOM element to render into the PDF, at the moment the button is clicked. */
  getElement: () => HTMLElement | null;
  /** Filename without extension. */
  filename: string;
  title?: string;
  /** If provided, Download shows a PDF/Excel choice instead of going straight to PDF. */
  excelRows?: Record<string, any>[];
  onCancel?: () => void;
}

/**
 * Real, working Download + Share buttons for receipts/invoices/reports —
 * replaces the old window.open()+window.print() pattern, which silently
 * does nothing inside the Android/iOS app (no popup support, no OS print
 * handler). One tap generates an actual PDF (or Excel, where offered)
 * and either saves it straight to the device or opens the native share
 * sheet with the real file attached.
 */
export default function DocumentActionBar({ getElement, filename, title, excelRows, onCancel }: Props) {
  const [busy, setBusy] = useState<"" | "download" | "share">("");
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const showToast = useToast();

  const doDownload = async (format: "pdf" | "excel" = "pdf") => {
    setShowFormatPicker(false);
    setBusy("download");
    try {
      if (format === "excel" && excelRows) {
        const blob = rowsToExcelBlob(excelRows, filename);
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const el = getElement();
        if (!el) throw new Error("Nothing to download yet");
        const blob = await renderElementToPdfBlob(el, title || filename);
        await downloadBlob(blob, `${filename}.pdf`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Download failed", "error");
    } finally {
      setBusy("");
    }
  };

  const doShare = async () => {
    setBusy("share");
    try {
      const el = getElement();
      if (!el) throw new Error("Nothing to share yet");
      const blob = await renderElementToPdfBlob(el, title || filename);
      await shareBlob(blob, `${filename}.pdf`, title || filename);
    } catch (e: any) {
      showToast(e?.message || "Share failed", "error");
    } finally {
      setBusy("");
    }
  };

  const btnBase: React.CSSProperties = {
    borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.82rem",
    fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body, inherit)",
    display: "flex", alignItems: "center", gap: "0.4rem", border: "none",
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const, alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          disabled={busy !== ""}
          onClick={() => (excelRows ? setShowFormatPicker((v) => !v) : doDownload("pdf"))}
          style={{ ...btnBase, background: "#F47B20", color: "#fff", opacity: busy ? 0.7 : 1 }}
        >
          {busy === "download" ? "Downloading…" : "Download"}
        </button>
        {showFormatPicker && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
            background: "#fff", border: "1.5px solid #E5E5E5", borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: "140px",
          }}>
            <button type="button" onClick={() => doDownload("pdf")}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.9rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
              as PDF
            </button>
            <button type="button" onClick={() => doDownload("excel")}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.9rem", background: "none", border: "none", borderTop: "1px solid #F5F5F5", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
              as Excel
            </button>
          </div>
        )}
      </div>

      <button type="button" disabled={busy !== ""} onClick={doShare}
        style={{ ...btnBase, background: "#F5F5F5", border: "1.5px solid #E5E5E5", color: "#404040", opacity: busy ? 0.7 : 1 }}>
        {busy === "share" ? "Sharing…" : "Share"}
      </button>

      {onCancel && (
        <button type="button" onClick={onCancel}
          style={{ ...btnBase, background: "#F5F5F5", border: "1.5px solid #E5E5E5", color: "#737373", marginLeft: "auto" }}>
          Cancel
        </button>
      )}
    </div>
  );
}
