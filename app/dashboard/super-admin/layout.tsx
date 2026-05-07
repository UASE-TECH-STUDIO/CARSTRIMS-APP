import AuthGuard from "@/components/layout/AuthGuard";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["SYSTEM_ADMIN"]}>
      <div style={{ display:"flex", minHeight:"100vh", background:"var(--black)" }}>
        <AdminSidebar />
        <div style={{ marginLeft:"240px", flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
          <AdminTopbar />
          <main style={{ flex:1, padding:"2rem", overflowY:"auto" }}>
            {children}
          </main>
        </div>
      </div>
            <MessagesWidget accentColor="#F47B20" />
      </AuthGuard>
  );
}

