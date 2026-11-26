import { AdminAuthGuard } from "./admin-auth-guard";

// Skip instant navigation validation for the authenticated admin dashboard segment.
export const instant = false;

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
