"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

type DocType = "receipt" | "invoice" | "proforma";

interface Props {
  transactionId: string;
  onClose: () => void;
}

export default function InvoiceGenerator({
  transactionId,
  onClose,
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<DocType>("receipt");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get(`/api/v1/inventory/sales/${transactionId}/receipt`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [transactionId]);

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

  const fmtDate = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  const LABELS: Record<DocType, string> = {
    receipt: "RECEIPT",
    invoice: "INVOICE",
    proforma: "PROFORMA INVOICE",
  };

  const openPrintWindow = (extraStyle = "") => {
    if (!printRef.current || !data) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CARSTRIMS ${LABELS[docType]}</title>
        <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#1A1A1A;max-width:700px;margin:0 auto}@media print{@page{margin:1cm}.no-print{display:none!important}}
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 24px;
            color: #1A1A1A;
            background: #fff;
            max-width: 700px;
            margin-inline: auto;
          }

          @media print {
            body {
              padding: 12px;
            }

            @page {
              margin: 1cm;
            }

            .no-print {
              display: none !important;
            }
          }

          ${extraStyle}
        </style>
      </head>
      <body>
        ${printRef.current.innerHTML}
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        <\/script>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:none;left:-9999px";
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
    };
    iframe.src = url;
  };

  const handlePDF = () => {
    openPrintWindow();
  };

  const handleJPG = () => {
    openPrintWindow(`body{padding:8px}`);

    setTimeout(() => {
      alert(
        "In the print dialog:\n1. Choose 'Save as PDF'.\n2. Use screenshot/snipping tool for JPG."
      );
    }, 800);
  };

  const handleShare = async () => {
    if (!data) return;

    const text = `
${LABELS[docType]}
${data.dealer?.name || "CARSTRIMS"}

${data.car?.brand} ${data.car?.model} ${data.car?.year}

Price: ${fmt(data.financials?.sellingPrice)}

Ref: ${transactionId}

Buyer: ${data.buyer?.name || "—"}

Date: ${fmtDate(data.issuedAt)}
`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `CARSTRIMS ${LABELS[docType]}`,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Document copied!");
      }
    } catch {}
  };

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid #E5E5E5",
              borderTopColor: "#F47B20",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1rem",
            }}
          />

          <style>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>

          <p
            style={{
              color: "#737373",
              margin: 0,
              fontSize: "0.875rem",
            }}
          >
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const d = data;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* CONTROLS */}
        <div
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #E5E5E5",
            flexWrap: "wrap",
            background: "#FAFAFA",
          }}
        >
          {(["receipt", "invoice", "proforma"] as DocType[]).map((t) => (
            <button
              key={t}
              onClick={() => setDocType(t)}
              style={{
                padding: "0.45rem 0.875rem",
                borderRadius: "6px",
                border: "1.5px solid",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                background: docType === t ? "#F47B20" : "#fff",
                color: docType === t ? "#fff" : "#525252",
                borderColor: docType === t ? "#F47B20" : "#E5E5E5",
              }}
            >
              {t === "proforma" ? "Proforma Invoice" : t === "invoice" ? "Invoice" : "Receipt"}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <button
            onClick={handlePDF}
            style={{
              background: "#1A1A1A",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 0.875rem",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🖨 Print / PDF
          </button>

          <button
            onClick={handleJPG}
            style={{
              background: "#EFF6FF",
              color: "#3B8BD4",
              border: "1.5px solid #BFDBFE",
              borderRadius: "8px",
              padding: "0.5rem 0.875rem",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🖼 JPG
          </button>

          <button
            onClick={handleShare}
            style={{
              background: "#F0FDF4",
              color: "#16A34A",
              border: "1.5px solid #86EFAC",
              borderRadius: "8px",
              padding: "0.5rem 0.875rem",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ↗ Share
          </button>

          <button
            onClick={onClose}
            style={{
              background: "#F5F5F5",
              border: "1.5px solid #E5E5E5",
              color: "#525252",
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* DOCUMENT */}
        <div
          ref={printRef}
          style={{
            padding: "2rem",
            background: "#fff",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div
            style={{
              borderBottom: "3px solid #F47B20",
              paddingBottom: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <h1
              style={{
                margin: 0,
                color: "#F47B20",
                fontSize: "2rem",
              }}
            >
              {LABELS[docType]}
            </h1>

            <p style={{ marginTop: "0.5rem", color: "#737373" }}>
              Ref: #{d.receiptNumber}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Buyer:</strong> {d.buyer?.name || "Cash Buyer"}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Vehicle:</strong>{" "}
            {d.car?.brand} {d.car?.model} {d.car?.year}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Amount:</strong>{" "}
            <span style={{ color: "#F47B20", fontWeight: 700 }}>
              {fmt(d.financials?.sellingPrice)}
            </span>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Date:</strong> {fmtDate(d.issuedAt)}
          </div>

          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: "1px solid #E5E5E5",
              fontSize: "0.8rem",
              color: "#737373",
            }}
          >
            Powered by CARSTRIMS — UASE TECH STUDIO
          </div>
        </div>
      </div>
    </div>
  );
}
