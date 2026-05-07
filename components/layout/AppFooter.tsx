"use client";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span className="footer-brand">◈ CARSTRIMS</span>
        <div className="footer-links">
          <a href="mailto:support@carstrims.com" className="fl">✉ support@carstrims.com</a>
          <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="fl">💬 WhatsApp</a>
          <a href="tel:+2348000000000" className="fl">📞 +234 800 000 0000</a>
          <a href="#" className="fl">Instagram</a>
          <a href="#" className="fl">Twitter</a>
          <a href="#" className="fl">Facebook</a>
        </div>
        <span className="footer-dev">Built by <strong>UASE TECH STUDIO</strong> · 2026</span>
      </div>
      <style>{`
        .app-footer{background:#fff;border-top:1.5px solid #E5E5E5;padding:0.875rem 1.5rem;font-family:var(--font-body)}
        .footer-inner{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;justify-content:space-between;max-width:1400px;margin:0 auto}
        .footer-brand{font-family:var(--font-display);font-size:0.9rem;letter-spacing:0.15em;color:#F47B20;flex-shrink:0}
        .footer-links{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;flex:1;justify-content:center}
        .fl{font-size:0.75rem;color:#737373;text-decoration:none;transition:color 0.2s;white-space:nowrap}
        .fl:hover{color:#F47B20}
        .footer-dev{font-size:0.7rem;color:#A3A3A3;white-space:nowrap;flex-shrink:0}
        .footer-dev strong{color:#F47B20}
        @media(max-width:768px){.footer-inner{flex-direction:column;gap:0.75rem;text-align:center}.footer-links{gap:0.75rem}}
      `}</style>
    </footer>
  );
}
