import AuthGuard from "@/components/auth/AuthGuard";
import DashboardShell from "@/components/dashboard/layout/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}