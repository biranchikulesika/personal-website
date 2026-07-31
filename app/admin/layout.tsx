import { AdminAuthGuard } from './AdminAuthGuard';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      {children}
    </AdminAuthGuard>
  );
}
