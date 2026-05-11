"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Step = "email" | "options" | "sent";

interface RecoveryOption {
  type: "whatsapp" | "email" | "admin_message";
  label: string;
  masked: string;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<RecoveryOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<RecoveryOption | null>(null);
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  // Step 1: Submit email to get recovery options
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/forgot-password/options", { email });
      setOptions(res.data.options || []);
      setStep("options");
    } catch (err: any) {
      // Always show options step (security - don't reveal if email exists)
      // Show generic options
      setOptions([
        { type: "admin_message", label: "Contact Support", masked: "Send a request to CARSTRIMS admin" },
      ]);
      setStep("options");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send reset via selected method
  const handleSend = async () => {
    if (!selectedOption) return;
    setSending(true);
    setError("");
    try {
      await api.post("/api/v1/auth/forgot-password/send", {
        email,
        method: selectedOption.type,
      });
      setSentMessage(
        selectedOption.type === "whatsapp"
          ? "A recovery code has been sent to your registered WhatsApp number."
          : selectedOption.type === "email"
          ? "A recovery link has been sent to your registered email address."
          : "Your request has been sent to the CARSTRIMS admin. You will be contacted shortly via your registered contact."
      );
      setStep("sent");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const ICONS: Record<string, string> = {
    whatsapp: "Ã°Å¸â€™Â¬",
    email: "Ã¢Å“â€°Ã¯Â¸Â",
    admin_message: "Ã°Å¸â€ºÂ¡Ã¯Â¸Â",
  };

  return (
    <div className="fp-root">
      <div className="fp-card">
        <div className="fp-brand">Ã¢â€”Ë† CARSTRIMS</div>
        <h2 className="fp-title">Account Recovery</h2>

        {step === "email" && (
          <>
            <p className="fp-sub">
              Enter the email address linked to your account. We will show you
              secure ways to recover your access.
            </p>
            {error && <div className="fp-err">{error}</div>}
            <form onSubmit={handleEmailSubmit} className="fp-form">
              <div className="field">
                <label className="fl">Email Address</label>
                <input
                  type="email"
                  className="fi"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? "Looking up account..." : "FIND MY ACCOUNT"}
              </button>
            </form>
          </>
        )}

        {step === "options" && (
          <>
            <p className="fp-sub">
              Choose how you want to recover access to your account. Only methods
              linked to your registered account are shown.
            </p>
            {error && <div className="fp-err">{error}</div>}
            <div className="options-list">
              {options.map((opt) => (
                <button
                  key={opt.type}
                  className={`option-card ${selectedOption?.type === opt.type ? "selected" : ""}`}
                  onClick={() => setSelectedOption(opt)}
                >
                  <span className="opt-icon">{ICONS[opt.type]}</span>
                  <div className="opt-body">
                    <div className="opt-label">{opt.label}</div>
                    <div className="opt-masked">{opt.masked}</div>
                  </div>
                  {selectedOption?.type === opt.type && (
                    <span className="opt-check">Ã¢Å“â€œ</span>
                  )}
                </button>
              ))}
            </div>
            <div className="security-note">
              Ã°Å¸â€â€™ For your security, recovery can only be sent to contacts
              registered on your account. No one else can reset your password.
            </div>
            <button
              className="fp-btn"
              onClick={handleSend}
              disabled={!selectedOption || sending}
            >
              {sending ? "Sending..." : "SEND RECOVERY"}
            </button>
            <button className="back-link" onClick={() => setStep("email")}>
              Ã¢â€ Â Use a different email
            </button>
          </>
        )}

        {step === "sent" && (
          <>
            <div className="sent-box">
              <div className="sent-icon">Ã¢Å“â€¦</div>
              <div className="sent-msg">{sentMessage}</div>
              {selectedOption?.type === "admin_message" && (
                <div className="admin-note">
                  The admin will verify your identity before resetting your
                  password. This process is secure and protects your account.
                </div>
              )}
            </div>
            <Link href="/login" className="fp-btn" style={{ textAlign: "center", display: "block", textDecoration: "none" }}>
              BACK TO LOGIN
            </Link>
          </>
        )}

        <Link href="/login" className="back-login">
          Ã¢â€ Â Back to login
        </Link>
      </div>

      <style>{`
        .fp-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #E5E5E5 0%, #F5F5F5 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: var(--font-body);
        }
        .fp-card {
          width: 100%;
          max-width: 440px;
          background: #fff;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .fp-brand {
          font-family: var(--font-display);
          font-size: 1.2rem;
          letter-spacing: 0.2em;
          color: #F47B20;
        }
        .fp-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          letter-spacing: 0.04em;
          color: #1A1A1A;
          margin-top: -0.5rem;
        }
        .fp-sub { font-size: 0.875rem; color: #737373; line-height: 1.6; }
        .fp-err {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
        }
        .fp-form { display: flex; flex-direction: column; gap: 1rem; }
        .field { display: flex; flex-direction: column; gap: 0.4rem; }
        .fl { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #525252; }
        .fi {
          background: #F5F5F5;
          border: 1.5px solid #E5E5E5;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          color: #1A1A1A;
          font-size: 0.95rem;
          font-family: var(--font-body);
          outline: none;
          transition: all 0.2s;
          width: 100%;
        }
        .fi:focus { border-color: #F47B20; background: #fff; box-shadow: 0 0 0 3px rgba(244,123,32,0.1); }
        .fi::placeholder { color: #A3A3A3; }
        .fp-btn {
          background: #F47B20;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 1rem;
          font-family: var(--font-display);
          font-size: 0.95rem;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: background 0.2s;
        }
        .fp-btn:hover { background: #FF9340; }
        .fp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .options-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .option-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: #F5F5F5;
          border: 1.5px solid #E5E5E5;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-family: var(--font-body);
          width: 100%;
        }
        .option-card:hover { border-color: #F47B20; background: #FFF7ED; }
        .option-card.selected { border-color: #F47B20; background: #FFF7ED; box-shadow: 0 0 0 3px rgba(244,123,32,0.12); }
        .opt-icon { font-size: 1.4rem; flex-shrink: 0; }
        .opt-body { flex: 1; }
        .opt-label { font-size: 0.9rem; font-weight: 600; color: #1A1A1A; }
        .opt-masked { font-size: 0.75rem; color: #737373; margin-top: 0.2rem; }
        .opt-check { color: #F47B20; font-weight: 700; font-size: 1.1rem; }
        .security-note {
          background: #F5F5F5;
          border: 1px solid #E5E5E5;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          font-size: 0.78rem;
          color: #525252;
          line-height: 1.5;
        }
        .back-link {
          background: none;
          border: none;
          color: #A3A3A3;
          font-size: 0.78rem;
          cursor: pointer;
          font-family: var(--font-body);
          text-align: center;
        }
        .back-link:hover { color: #F47B20; }
        .sent-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: #FFF7ED;
          border: 1px solid rgba(244,123,32,0.3);
          border-radius: 12px;
          text-align: center;
        }
        .sent-icon { font-size: 2.5rem; }
        .sent-msg { font-size: 0.9rem; color: #525252; line-height: 1.6; }
        .admin-note {
          font-size: 0.78rem;
          color: #C4621A;
          background: rgba(244,123,32,0.08);
          border-radius: 6px;
          padding: 0.75rem;
          line-height: 1.5;
        }
        .back-login {
          font-size: 0.78rem;
          color: #A3A3A3;
          text-decoration: none;
          text-align: center;
          display: block;
          transition: color 0.2s;
        }
        .back-login:hover { color: #F47B20; }
        @media(max-width:480px) { .fp-card { padding: 1.5rem; } }
      `}</style>
    </div>
  );
}