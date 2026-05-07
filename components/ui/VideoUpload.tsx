"use client";
import { useState, useRef } from "react";
import api from "@/lib/api";

interface VideoUploadProps {
  endpoint: string;
  currentVideo?: string | null;
  onSuccess: (url: string) => void;
  maxSeconds?: number;
}

export default function VideoUpload({
  endpoint,
  currentVideo,
  onSuccess,
  maxSeconds = 30,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File | null) => {
    if (!file) return;

    const allowed = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowed.includes(file.type)) {
      setError("Allowed formats: MP4, MOV, WebM");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("Video too large. Max 100MB.");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded || 0) * 100) / (e.total || 1));
          setProgress(pct);
        },
      });
      onSuccess(res.data.video || res.data.url);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Video upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="video-upload">
      {currentVideo && (
        <div className="video-preview">
          <video src={currentVideo} controls className="video-player" />
          <div className="video-note">Current video · max {maxSeconds}s</div>
        </div>
      )}

      <div
        className={`video-drop ${uploading ? "uploading" : ""}`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="video-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-label">Uploading {progress}%</div>
          </div>
        ) : (
          <>
            <div className="drop-icon">🎬</div>
            <div className="drop-label">
              {currentVideo ? "Replace video" : `Upload video (max ${maxSeconds}s)`}
            </div>
            <div className="drop-hint">MP4, MOV, WebM · Max 100MB</div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        style={{ display: "none" }}
        onChange={(e) => handleUpload(e.target.files?.[0] || null)}
      />

      {error && <div className="upload-error">{error}</div>}

      <style>{`
        .video-upload { display:flex; flex-direction:column; gap:0.75rem; }
        .video-preview { border:1px solid var(--border); border-radius:8px; overflow:hidden; }
        .video-player { width:100%; max-height:200px; display:block; }
        .video-note { padding:0.4rem 0.75rem; font-size:0.72rem; color:var(--text-dim); background:var(--surface-2); }
        .video-drop { border:2px dashed var(--border); border-radius:8px; padding:1.5rem; display:flex; flex-direction:column; align-items:center; gap:0.5rem; cursor:pointer; transition:all 0.2s; text-align:center; }
        .video-drop:hover:not(.uploading) { border-color:var(--gold-dim); background:rgba(201,168,76,0.04); }
        .video-drop.uploading { pointer-events:none; }
        .drop-icon { font-size:1.5rem; }
        .drop-label { font-size:0.825rem; font-weight:500; color:var(--text); }
        .drop-hint { font-size:0.75rem; color:var(--text-muted); }
        .video-progress { width:100%; display:flex; flex-direction:column; gap:0.5rem; }
        .progress-bar { height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
        .progress-fill { height:100%; background:var(--gold); border-radius:2px; transition:width 0.3s; }
        .progress-label { font-size:0.78rem; color:var(--text-muted); text-align:center; }
        .upload-error { background:rgba(224,82,82,0.1); border:1px solid rgba(224,82,82,0.3); color:var(--error); padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; }
      `}</style>
    </div>
  );
}
