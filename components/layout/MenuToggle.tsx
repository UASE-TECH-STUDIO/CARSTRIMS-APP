"use client";

interface Props {
  isOpen: boolean;
  onClick: () => void;
  accentColor?: string;
}

export default function MenuToggle({ isOpen, onClick, accentColor = "#F47B20" }: Props) {
  return (
    <button
      className="menu-toggle"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <span className={`bar ${isOpen ? "open" : ""}`} />
      <span className={`bar mid ${isOpen ? "open" : ""}`} />
      <span className={`bar ${isOpen ? "open" : ""}`} />

      <style>{`
        .menu-toggle {
          display: none;
          flex-direction: column;
          gap: 5px;
          padding: 8px;
          background: none;
          border: 1.5px solid #E5E5E5;
          border-radius: 8px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .bar {
          display: block;
          width: 18px;
          height: 2px;
          background: #525252;
          border-radius: 2px;
          transition: all 0.25s ease;
          transform-origin: center;
        }
        .bar.open:first-child { transform: translateY(7px) rotate(45deg); }
        .bar.mid.open { opacity: 0; transform: scaleX(0); }
        .bar.open:last-child { transform: translateY(-7px) rotate(-45deg); }
        @media (max-width: 767px) {
          .menu-toggle { display: flex; }
        }
      `}</style>
    </button>
  );
}
