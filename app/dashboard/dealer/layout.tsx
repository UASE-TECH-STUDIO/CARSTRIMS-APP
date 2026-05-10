"use client";
import { ReactNode } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import DealerSidebar from "@/components/layout/DealerSidebar";
import DealerTopbar from "@/components/layout/DealerTopbar";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import MessagesWidget from "@/components/shared/MessagesWidget";
import { useSidebar } from "@/hooks/useSidebar";

export default function DealerLayout({ children }: { children: ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();

  return (
    <AuthGuard allowedRoles={["DEALER_ADMIN"]}>
      <div className="dealer-shell">
        <SidebarWrapper isOpen={isOpen} onClose={close}>
          <DealerSidebar />
        </SidebarWrapper>
        <div className="dealer-main">
          <DealerTopbar onMenuToggle={toggle} isSidebarOpen={isOpen} />
          <main className="dealer-content">{children}</main>
        </div>
        <MessagesWidget accentColor="#F47B20" />
      </div>
      <style>{`
        .dealer-shell { display:flex; min-height:100vh; background:#F5F5F5; }
        .dealer-main { flex:1; margin-left:240px; display:flex; flex-direction:column; min-height:100vh; min-width:0; }
        .dealer-content { flex:1; padding:1.75rem; max-width:1400px; width:100%; }
        @media(max-width:767px) {
          .dealer-main { margin-left:0; }
          .dealer-content { padding:1rem; }
        }
      `}</style>
    </AuthGuard>
  );
}
