"use client";
import { useState, useRef, useCallback } from "react";
import api from "@/lib/api";

interface ImageUploadProps {
  endpoint: string;
  currentImages?: string[];
  maxImages?: number;
  onSuccess: (images: string[]) => void;
  label?: string;
  single?: boolean;
}

export default function ImageUpload({
  endpoint,
  currentImages = [],
  maxImages = 6,
  onSuccess,
  label = "Upload Images",
  single = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (currentImages.length + files.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      setError("");

      try {
        const formData = new FormData();
        if (single) {
          formData.append("file", files[0]);
        } else {
          Array.from(files).forEach((f) => formData.append("files", f));
        }

        const res = await api.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newImages =
          res.data.images ||
          (res.data.url ? [res.data.url] : null) ||
          (res.data.logo ? [res.data.logo] : null) ||
          (res.data.profilePicture ? [res.data.profilePicture] : null) ||
          (res.data.banner ? [res.data.banner] : null) ||
          [];

        onSuccess(
          Array.isArray(newImages) ? newImages : [...currentImages, newImages]
        );
      } catch (err: any) {
        setError(err.response?.data?.detail || "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [endpoint, currentImages, maxImages, onSuccess, single]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="img-upload">
      {/* Preview grid */}
      {currentImages.length > 0 && (
        <div className="img-preview-grid">
          {currentImages.map((url, i) => (
            <div key={i} className="img-preview">
              <img src={url} alt={`Upload ${i + 1}`} />
              <span className="img-index">{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {(!single || currentImages.length === 0) &&
        currentImages.length < maxImages && (
          <div
            className={`drop-zone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            {uploading ? (
              <div className="upload-spinner" />
            ) : (
              <>
                <div className="drop-icon">📷</div>
                <div className="drop-label">{label}</div>
                <div className="drop-hint">
                  {single
                    ? "Click or drag to upload"
                    : `Click or drag · ${currentImages.length}/${maxImages} uploaded`}
                </div>
              </>
            )}
          </div>
        )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={!single}
        style={{ display: "none" }}
        onChange={(e) => handleUpload(e.target.files)}
      />

      {error && <div className="upload-error">{error}</div>}

      <style>{`
        .img-upload { display:flex; flex-direction:column; gap:0.75rem; }
        .img-preview-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(80px,1fr)); gap:0.5rem; }
        .img-preview { position:relative; aspect-ratio:1; border-radius:6px; overflow:hidden; border:1px solid var(--border); }
        .img-preview img { width:100%; height:100%; object-fit:cover; }
        .img-index { position:absolute; bottom:4px; right:4px; background:rgba(0,0,0,0.6); color:#fff; font-size:0.65rem; padding:1px 5px; border-radius:3px; font-family:var(--font-mono); }
        .drop-zone { border:2px dashed var(--border); border-radius:8px; padding:1.5rem; display:flex; flex-direction:column; align-items:center; gap:0.5rem; cursor:pointer; transition:all 0.2s; text-align:center; }
        .drop-zone:hover { border-color:var(--gold-dim); background:rgba(201,168,76,0.04); }
        .drop-zone.drag-over { border-color:var(--gold); background:rgba(201,168,76,0.08); }
        .drop-zone.uploading { pointer-events:none; opacity:0.7; }
        .drop-icon { font-size:1.5rem; }
        .drop-label { font-size:0.825rem; font-weight:500; color:var(--text); }
        .drop-hint { font-size:0.75rem; color:var(--text-muted); }
        .upload-spinner { width:24px; height:24px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .upload-error { background:rgba(224,82,82,0.1); border:1px solid rgba(224,82,82,0.3); color:var(--error); padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; }
      `}</style>
    </div>
  );
}
