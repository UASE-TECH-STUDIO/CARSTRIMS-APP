"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Props {
  onClose: () => void;
}

/**
 * Universal search — one box that searches cars, dealers, and users
 * (which covers regular users, partners, and buyers, since they all
 * live in the same users collection) at once, with results grouped
 * by category and linking straight to each public profile/detail page.
 */
export default function GlobalSearchModal({ onClose }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ cars?: any[]; dealers?: any[]; users?: any[] }>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults({}); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/api/v1/public/search", { params: { q: q.trim() } });
        setResults(res.data || {});
      } catch {
        setResults({});
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  const hasAnyResults = (results.cars?.length || 0) + (results.dealers?.length || 0) + (results.users?.length || 0) > 0;

  return (
    <div className="gs-overlay" onClick={onClose}>
      <div className="gs-panel" onClick={(e) => e.stopPropagation()}>
        <div className="gs-search-row">
          <input
            ref={inputRef}
            className="gs-input"
            placeholder="Search cars, dealers, users..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && <button className="gs-clear" onClick={() => setQ("")}>×</button>}
          <button className="gs-cancel" onClick={onClose}>Cancel</button>
        </div>

        <div className="gs-body">
          {!q.trim() && (
            <div className="gs-hint">Search for a car (brand, model, year, color), a dealer, or a person by name.</div>
          )}

          {q.trim() && loading && <div className="gs-hint">Searching…</div>}

          {q.trim() && !loading && !hasAnyResults && (
            <div className="gs-hint">No results for "{q}"</div>
          )}

          {!!results.cars?.length && (
            <div className="gs-section">
              <div className="gs-section-title">Vehicles</div>
              {results.cars.map((c: any) => (
                <Link key={c.carId || c._id} href={`/cars/${c.carId}`} className="gs-row" onClick={onClose}>
                  <div className="gs-row-thumb">
                    {c.images?.[0] ? <img src={c.images[0]} alt="" /> : <span>🚗</span>}
                  </div>
                  <div className="gs-row-text">
                    <div className="gs-row-title">{c.brand} {c.model} {c.year}</div>
                    <div className="gs-row-sub">{c.color || ""}{c.color ? " · " : ""}₦{Number(c.sellingPrice || 0).toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!!results.dealers?.length && (
            <div className="gs-section">
              <div className="gs-section-title">Dealers</div>
              {results.dealers.map((d: any) => (
                <Link key={d.dealerId || d._id} href={`/dealers/${d.dealerId || d._id}`} className="gs-row" onClick={onClose}>
                  <div className="gs-row-thumb gs-row-avatar">
                    {d.logo ? <img src={d.logo} alt="" /> : <span>{d.companyName?.charAt(0) || "D"}</span>}
                  </div>
                  <div className="gs-row-text">
                    <div className="gs-row-title">{d.companyName}</div>
                    <div className="gs-row-sub">{d.city || "Dealer"}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!!results.users?.length && (
            <div className="gs-section">
              <div className="gs-section-title">People</div>
              {results.users.map((u: any) => (
                <Link key={u.userId || u._id} href={`/users/${u.userId || u._id}`} className="gs-row" onClick={onClose}>
                  <div className="gs-row-thumb gs-row-avatar">
                    {u.avatar ? <img src={u.avatar} alt="" /> : <span>{u.fullName?.charAt(0) || "?"}</span>}
                  </div>
                  <div className="gs-row-text">
                    <div className="gs-row-title">{u.fullName}</div>
                    <div className="gs-row-sub">{u.role === "DEALER_ADMIN" ? "Dealer" : u.role === "PARTNER_USER" ? "Partner" : "User"}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .gs-overlay {
          position: fixed; inset: 0; background: rgba(23,23,23,0.55); backdrop-filter: blur(4px);
          z-index: 10000; display: flex; align-items: flex-start; justify-content: center;
          padding-top: calc(env(safe-area-inset-top, 0px));
        }
        .gs-panel {
          background: #fff; width: 100%; max-width: 640px; max-height: 88vh;
          border-radius: 0 0 16px 16px; display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }
        .gs-search-row {
          display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1rem;
          border-bottom: 1.5px solid #E5E5E5; flex-shrink: 0;
        }
        .gs-input {
          flex: 1; border: 1.5px solid #E5E5E5; border-radius: 10px; padding: 0.65rem 0.875rem;
          font-size: 0.95rem; outline: none; font-family: var(--font-body, inherit); min-width: 0;
        }
        .gs-input:focus { border-color: #F47B20; }
        .gs-clear { background: #F5F5F5; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 1rem; flex-shrink: 0; }
        .gs-cancel { background: none; border: none; color: #F47B20; font-weight: 700; font-size: 0.85rem; cursor: pointer; flex-shrink: 0; white-space: nowrap; }
        .gs-body { overflow-y: auto; -webkit-overflow-scrolling: touch; min-height: 0; padding: 0.5rem 0 1rem; }
        .gs-hint { padding: 2rem 1.25rem; text-align: center; color: #A3A3A3; font-size: 0.88rem; }
        .gs-section { padding: 0.5rem 0; }
        .gs-section-title { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #A3A3A3; padding: 0.5rem 1.25rem; }
        .gs-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1.25rem; text-decoration: none; color: inherit; }
        .gs-row:hover { background: #FAFAFA; }
        .gs-row-thumb { width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #F5F5F5; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .gs-row-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .gs-row-avatar { border-radius: 50%; font-family: var(--font-display, inherit); color: #F47B20; background: #FFF7ED; font-weight: 700; }
        .gs-row-text { min-width: 0; flex: 1; }
        .gs-row-title { font-size: 0.9rem; font-weight: 600; color: #1A1A1A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gs-row-sub { font-size: 0.76rem; color: #737373; margin-top: 1px; }
      `}</style>
    </div>
  );
}
