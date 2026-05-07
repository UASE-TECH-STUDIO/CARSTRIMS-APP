"use client";
import { useState, useRef } from "react";
import api from "@/lib/api";

interface DocumentUploadProps {
  endpoint: string;
  onSuccess: (url: string) => void;
  label?: string;
  currentUrl?: string;
}

export default function DocumentUpload({
  endpoint,
  onSuccess,
  label = "Upload Document",
  currentUrl,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess(res.data.idCardUrl || res.data.url);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="doc-upload">
      {currentUrl && (
        <div className="doc-preview">
          {currentUrl.endsWith(".pdf") ? (
            <a href={currentUrl} target="_blank" rel="noreferrer" className="doc-link">
              📄 View uploaded document
            </a>
          ) : (
            <img src={currentUrl} alt="Uploaded ID" className="doc-img" />
          )}
        </div>
      )}

      <div
        className={`doc-drop ${uploading ? "uploading" : ""}`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="doc-spinner" />
        ) : (
          <>
            <span className="doc-icon">📎</span>
            <span className="doc-label">{currentUrl ? "Replace document" : label}</span>
            <span className="doc-hint">JPG, PNG, or PDF · Max 10MB</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => handleUpload(e.target.files?.[0] || null)}
      />

      {error && <div className="upload-error">{error}</div>}

      <style>{`
        .doc-upload { display:flex; flex-direction:column; gap:0.5rem; }
        .doc-preview { border:1px solid var(--border); border-radius:6px; overflow:hidden; }
        .doc-img { width:100%; max-height:150px; object-fit:cover; display:block; }
        .doc-link { display:block; padding:0.75rem; font-size:0.825rem; color:var(--gold); text-decoration:none; background:var(--surface-2); }
        .doc-link:hover { text-decoration:underline; }
        .doc-drop { border:2px dashed var(--border); border-radius:6px; padding:1rem; display:flex; flex-direction:column; align-items:center; gap:0.35rem; cursor:pointer; transition:all 0.2s; text-align:center; }
        .doc-drop:hover:not(.uploading) { border-color:var(--gold-dim); background:rgba(201,168,76,0.04); }
        .doc-drop.uploading { pointer-events:none; opacity:0.7; }
        .doc-icon { font-size:1.2rem; }
        .doc-label { font-size:0.8rem; font-weight:500; color:var(--text); }
        .doc-hint { font-size:0.72rem; color:var(--text-muted); }
        .doc-spinner { width:20px; height:20px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .upload-error { font-size:0.78rem; color:var(--error); }
      `}</style>
    </div>
  );
}
