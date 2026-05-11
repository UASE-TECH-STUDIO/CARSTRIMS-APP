import AuthGuard from "@/components/layout/AuthGuard";
import StaffShell from "@/components/layout/StaffShell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["DEALER_STAFF"]}>
      <StaffShell>{children}</StaffShell>
    </AuthGuard>
  );
}