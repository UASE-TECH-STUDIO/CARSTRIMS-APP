"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const STREAM_TYPES = ["rtsp", "hls", "ip", "nvr", "cloud"];

interface Camera {
  _id: string;
  cameraId: string;
  cameraName: string;
  cameraLocation: string;
  streamUrl: string;
  streamType: string;
  status: string;
  lastOnline?: string;
  provider?: string;
}

const emptyForm = {
  cameraName: "", cameraLocation: "", streamUrl: "",
  streamType: "rtsp", provider: "",
};

export default function CCTVPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pinging, setPinging] = useState<string | null>(null);

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/cctv/");
      setCameras(res.data.cameras);
      setStats({ total: res.data.total, online: res.data.online, offline: res.data.offline });
      if (res.data.cameras.length > 0 && !activeCamera) {
        setActiveCamera(res.data.cameras[0]);
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCameras(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await api.post("/api/v1/cctv/", form);
      setShowAdd(false);
      setForm(emptyForm);
      fetchCameras();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add camera");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (cameraId: string) => {
    if (!confirm("Remove this camera?")) return;
    try {
      await api.delete(`/api/v1/cctv/${cameraId}`);
      if (activeCamera?.cameraId === cameraId) setActiveCamera(null);
      fetchCameras();
    } catch (err: any) { alert(err.response?.data?.detail || "Failed"); }
  };

  const handlePing = async (cameraId: string) => {
    setPinging(cameraId);
    try {
      await api.post(`/api/v1/cctv/${cameraId}/ping`);
      fetchCameras();
    } catch { } finally { setPinging(null); }
  };

  const fmtTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("en-NG") : "Never";

  return (
    <div className="cctv-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">CCTV Monitoring</h2>
          <p className="page-sub">
            {stats.total} camera{stats.total !== 1 ? "s" : ""} ·{" "}
            <span style={{ color: "var(--success)" }}>{stats.online} online</span> ·{" "}
            <span style={{ color: "var(--text-dim)" }}>{stats.offline} offline</span>
          </p>
        </div>
        <button className="btn-gold" onClick={() => { setShowAdd(true); setError(""); }}>
          + Add Camera
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : cameras.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📹</div>
          <h3>No cameras connected</h3>
          <p>Add your first CCTV camera stream</p>
          <button className="btn-gold" onClick={() => setShowAdd(true)}>Add Camera</button>
        </div>
      ) : (
        <div className="cctv-layout">
          {/* Main viewer */}
          <div className="cctv-main">
            {activeCamera ? (
              <div className="stream-viewer">
                <div className="stream-header">
                  <div className="stream-info">
                    <span className="stream-name">{activeCamera.cameraName}</span>
                    <span className="stream-loc">📍 {activeCamera.cameraLocation}</span>
                  </div>
                  <div className={`stream-status ${activeCamera.status}`}>
                    ● {activeCamera.status}
                  </div>
                </div>
                <div className="stream-body">
                  {activeCamera.streamType === "hls" ? (
                    <video
                      src={activeCamera.streamUrl}
                      controls
                      className="stream-video"
                      onError={() => {}}
                    />
                  ) : (
                    <div className="stream-placeholder">
                      <div className="stream-placeholder-icon">📹</div>
                      <div className="stream-placeholder-text">
                        {activeCamera.streamType.toUpperCase()} Stream
                      </div>
                      <div className="stream-url">{activeCamera.streamUrl}</div>
                      <p className="stream-note">
                        RTSP streams require a media server or VLC integration.
                        Use HLS streams for direct browser playback.
                      </p>
                    </div>
                  )}
                </div>
                <div className="stream-footer">
                  <span className="stream-type-badge">{activeCamera.streamType.toUpperCase()}</span>
                  <span className="stream-last">Last online: {fmtTime(activeCamera.lastOnline)}</span>
                </div>
              </div>
            ) : (
              <div className="no-active">Select a camera to view</div>
            )}
          </div>

          {/* Camera list */}
          <div className="camera-list">
            <div className="camera-list-header">CAMERAS</div>
            {cameras.map((cam) => (
              <div
                key={cam._id}
                className={`camera-item ${activeCamera?.cameraId === cam.cameraId ? "active" : ""}`}
                onClick={() => setActiveCamera(cam)}
              >
                <div className="cam-preview">📹</div>
                <div className="cam-info">
                  <div className="cam-name">{cam.cameraName}</div>
                  <div className="cam-loc">{cam.cameraLocation}</div>
                  <div className="cam-type">{cam.streamType.toUpperCase()}</div>
                </div>
                <div className="cam-right">
                  <div className={`cam-dot ${cam.status}`} />
                  <div className="cam-actions">
                    <button
                      className="cam-btn"
                      onClick={(e) => { e.stopPropagation(); handlePing(cam.cameraId); }}
                      disabled={pinging === cam.cameraId}
                    >
                      {pinging === cam.cameraId ? "..." : "Ping"}
                    </button>
                    <button
                      className="cam-btn danger"
                      onClick={(e) => { e.stopPropagation(); handleDelete(cam.cameraId); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD CAMERA MODAL */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">ADD CAMERA</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleAdd} className="cam-form">
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Camera Name *</label>
                  <input className="field-input" placeholder="Main Gate"
                    value={form.cameraName} onChange={(e) => setForm({ ...form, cameraName: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="field-label">Location *</label>
                  <input className="field-input" placeholder="Front Entrance"
                    value={form.cameraLocation} onChange={(e) => setForm({ ...form, cameraLocation: e.target.value })} required />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Stream URL *</label>
                <input className="field-input" placeholder="rtsp://... or https://..."
                  value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label">Stream Type</label>
                  <select className="field-input" value={form.streamType}
                    onChange={(e) => setForm({ ...form, streamType: e.target.value })}>
                    {STREAM_TYPES.map((t) => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Provider (optional)</label>
                  <input className="field-input" placeholder="Hikvision, Dahua..."
                    value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Camera"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .cctv-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:var(--text);line-height:1}
        .page-sub{font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem}
        .btn-gold{background:var(--gold);color:var(--black);border:none;border-radius:6px;padding:0.7rem 1.25rem;font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.1em;cursor:pointer;transition:background 0.2s;white-space:nowrap}
        .btn-gold:hover{background:var(--gold-light)}
        .btn-outline{background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:6px;padding:0.7rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer}
        .btn-outline:hover{border-color:var(--gold-dim);color:var(--text)}
        .loading-state{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;min-height:300px;text-align:center;border:1px dashed var(--border);border-radius:12px;padding:3rem}
        .empty-icon{font-size:3rem}
        .empty-state h3{font-family:var(--font-display);font-size:1.3rem;color:var(--text);letter-spacing:0.05em}
        .empty-state p{color:var(--text-muted);font-size:0.875rem}
        .cctv-layout{display:grid;grid-template-columns:1fr 280px;gap:1rem;min-height:500px}
        .cctv-main{display:flex;flex-direction:column;gap:0}
        .stream-viewer{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
        .stream-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--border);background:var(--surface-2)}
        .stream-info{display:flex;flex-direction:column;gap:0.2rem}
        .stream-name{font-weight:600;font-size:0.95rem;color:var(--text)}
        .stream-loc{font-size:0.78rem;color:var(--text-muted)}
        .stream-status{font-size:0.75rem;text-transform:capitalize}
        .stream-status.online{color:var(--success)}
        .stream-status.offline{color:var(--text-dim)}
        .stream-body{flex:1;min-height:300px;background:#000;display:flex;align-items:center;justify-content:center}
        .stream-video{width:100%;height:100%;max-height:400px;object-fit:contain}
        .stream-placeholder{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:2rem;text-align:center}
        .stream-placeholder-icon{font-size:3rem;opacity:0.4}
        .stream-placeholder-text{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:var(--text-muted)}
        .stream-url{font-family:var(--font-mono);font-size:0.72rem;color:var(--text-dim);word-break:break-all;max-width:400px}
        .stream-note{font-size:0.75rem;color:var(--text-dim);max-width:360px;line-height:1.5}
        .stream-footer{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1.25rem;border-top:1px solid var(--border);background:var(--surface-2)}
        .stream-type-badge{background:var(--surface-3);border:1px solid var(--border);color:var(--text-muted);padding:0.2rem 0.5rem;border-radius:4px;font-family:var(--font-mono);font-size:0.7rem}
        .stream-last{font-size:0.72rem;color:var(--text-dim);font-family:var(--font-mono)}
        .no-active{display:flex;align-items:center;justify-content:center;height:300px;color:var(--text-dim);font-size:0.875rem;border:1px solid var(--border);border-radius:10px}
        .camera-list{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
        .camera-list-header{padding:0.875rem 1rem;font-family:var(--font-display);font-size:0.75rem;letter-spacing:0.15em;color:var(--text-muted);border-bottom:1px solid var(--border);background:var(--surface-2)}
        .camera-item{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s}
        .camera-item:last-child{border-bottom:none}
        .camera-item:hover{background:var(--surface-2)}
        .camera-item.active{background:rgba(201,168,76,0.06);border-left:3px solid var(--gold)}
        .cam-preview{font-size:1.1rem;flex-shrink:0}
        .cam-info{flex:1;display:flex;flex-direction:column;gap:0.15rem;overflow:hidden}
        .cam-name{font-size:0.825rem;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cam-loc{font-size:0.72rem;color:var(--text-muted)}
        .cam-type{font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim)}
        .cam-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;flex-shrink:0}
        .cam-dot{width:8px;height:8px;border-radius:50%}
        .cam-dot.online{background:var(--success)}
        .cam-dot.offline{background:var(--text-dim)}
        .cam-actions{display:flex;gap:0.3rem}
        .cam-btn{background:var(--surface-2);border:1px solid var(--border);border-radius:4px;padding:0.2rem 0.45rem;font-size:0.68rem;color:var(--text-muted);cursor:pointer;transition:all 0.2s;font-family:var(--font-body)}
        .cam-btn:hover{border-color:var(--gold-dim);color:var(--text)}
        .cam-btn.danger:hover{border-color:var(--error);color:var(--error)}
        .cam-btn:disabled{opacity:0.5;cursor:not-allowed}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
        .modal{background:var(--surface);border:1px solid var(--border);border-radius:12px;width:100%;max-width:520px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)}
        .modal-title{font-family:var(--font-display);font-size:1.1rem;letter-spacing:0.1em;color:var(--text)}
        .modal-close{background:none;border:none;color:var(--text-muted);font-size:1rem;cursor:pointer}
        .form-error{margin:0.75rem 1.5rem 0;background:rgba(224,82,82,0.1);border:1px solid rgba(224,82,82,0.3);color:var(--error);padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .cam-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .field-label{font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted)}
        .field-input{background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:0.7rem 0.875rem;color:var(--text);font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%}
        .field-input:focus{border-color:var(--gold)}
        .form-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid var(--border);margin-top:0.25rem}
        @media(max-width:768px){.cctv-layout{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
