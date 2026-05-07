interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, icon, sub, accent }: StatCardProps) {
  return (
    <div className={`stat-card ${accent ? "accent" : ""}`}>
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}

      <style>{`
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: border-color 0.2s;
          cursor: default;
        }
        .stat-card:hover { border-color: var(--border-light); }
        .stat-card.accent { border-color: var(--gold-dim); background: rgba(201,168,76,0.04); }
        .stat-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .stat-icon { font-size: 1rem; }
        .stat-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 2rem;
          letter-spacing: 0.03em;
          color: var(--text);
          line-height: 1;
        }
        .stat-card.accent .stat-value { color: var(--gold); }
        .stat-sub { font-size: 0.75rem; color: var(--text-dim); }
      `}</style>
    </div>
  );
}
