import AdminCMS from '@/components/admin/AdminCMS';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <ErrorBoundary>
      <AdminCMS />
    </ErrorBoundary>
  );
}
