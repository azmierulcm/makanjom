import VendorDashboard from '@/components/vendor/VendorDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function VendorPage() {
  return (
    <ErrorBoundary>
      <VendorDashboard />
    </ErrorBoundary>
  );
}
