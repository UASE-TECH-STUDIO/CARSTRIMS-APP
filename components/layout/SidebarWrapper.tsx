"use client";
import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  accentColor?: string;
}

export default function SidebarWrapper({ isOpen, onClose, children, accentColor = "#F47B20" }: Props) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { onClose(); }, [pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-slide ${isOpen ? "open" : ""}`}>
        {children}
      </div>

      <style>{`
        .sidebar-overlay {
          display: none;
        }
        @media (max-width: 767px) {
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            z-index: 99;
            backdrop-filter: blur(2px);
          }
          .sidebar-slide {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }
          .sidebar-slide.open {
            transform: translateX(0);
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.2);
          }
        }
        @media (min-width: 768px) {
          .sidebar-slide {
            position: fixed !important;
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
}
