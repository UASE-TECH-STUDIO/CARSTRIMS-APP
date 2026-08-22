"use client";
import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

/**
 * A dropdown built entirely in React - no native <select> element at
 * all. Built specifically to eliminate a recurring, hard-to-pin-down
 * "white screen" bug that kept happening on native <select> dropdowns
 * inside the app (state, year, and other filter fields specifically),
 * even after fixing every other hypothesized cause (the
 * EdgeSwipeNavigation transform-wrapping issue, target=_blank forcing
 * reloads). Android's WebView has known, long-standing quirks
 * rendering native OS-level select pickers in certain contexts
 * (nested inside scrollable/absolutely-positioned containers
 * especially), and rather than keep chasing the exact trigger,
 * removing the native picker from the equation entirely removes the
 * whole category of bug.
 *
 * Styled to look and behave like a normal select (same visual
 * language as the app's existing .ffd-select class) so it drops in
 * as a direct replacement without needing surrounding layout changes.
 */
export default function CustomSelect({ value, onChange, options, placeholder = "Select…", className }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={wrapRef} className={`cs-wrap ${className || ""}`}>
      <button
        type="button"
        className="cs-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "cs-value" : "cs-placeholder"}>{selected ? selected.label : placeholder}</span>
        <span className={`cs-arrow ${open ? "cs-arrow-open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="cs-menu">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`cs-option ${opt.value === value ? "cs-option-selected" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <style jsx>{`
        .cs-wrap { position: relative; width: 100%; }
        .cs-trigger {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          border: 1.5px solid #E5E5E5; border-radius: 8px; padding: 0.75rem 0.85rem;
          font-size: 0.95rem; background: #fff; color: #1A1A1A; min-height: 46px;
          cursor: pointer; font-family: var(--font-body, inherit); text-align: left;
        }
        .cs-trigger:focus { outline: none; border-color: #F47B20; }
        .cs-placeholder { color: #A3A3A3; }
        .cs-value { color: #1A1A1A; }
        .cs-arrow { color: #A3A3A3; font-size: 0.8rem; margin-left: 0.5rem; flex-shrink: 0; transition: transform 0.15s; }
        .cs-arrow-open { transform: rotate(180deg); }
        .cs-menu {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 60;
          background: #fff; border: 1.5px solid #E5E5E5; border-radius: 10px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.15); max-height: 240px; overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .cs-option {
          display: block; width: 100%; text-align: left; padding: 0.7rem 0.85rem;
          background: none; border: none; border-bottom: 1px solid #F5F5F5;
          font-size: 0.9rem; color: #1A1A1A; cursor: pointer; font-family: var(--font-body, inherit);
        }
        .cs-option:last-child { border-bottom: none; }
        .cs-option:hover { background: #FFF7ED; }
        .cs-option-selected { background: #FFF3E6; color: #F47B20; font-weight: 600; }
      `}</style>
    </div>
  );
}
