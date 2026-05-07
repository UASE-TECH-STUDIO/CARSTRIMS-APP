"use client";
import { ReactNode } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import DealerSidebar from "@/components/layout/DealerSidebar";
import DealerTopbar from "@/components/layout/DealerTopbar";
import MessagesWidget from "@/components/shared/MessagesWidget";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["DEALER_ADMIN"]}>
      <div className="dealer-shell">
        <DealerSidebar />
        <div className="dealer-main">
          <DealerTopbar />
          <main className="dealer-content">{children}</main>
        </div>
      </div>
      <style>{`
        .dealer-shell {
          display: flex;
          min-height: 100vh;
          background: #F5F5F5;
        }
        .dealer-main {
          flex: 1;
          margin-left: 240px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
        }
        .dealer-content {
          flex: 1;
          padding: 1.75rem;
          max-width: 1400px;
          width: 100%;
        }
        @media (max-width: 768px) {
          .dealer-main { margin-left: 200px; }
          .dealer-content { padding: 1.25rem; }
        }
        @media (max-width: 640px) {
          .dealer-shell { flex-direction: column; }
          .dealer-main { margin-left: 0; }
          .dealer-content { padding: 1rem; }
        }
      `}</style>
            <MessagesWidget accentColor="#F47B20" />
      </AuthGuard>
  );
}

