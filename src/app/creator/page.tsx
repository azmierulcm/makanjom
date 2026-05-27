import AppShell from '@/components/layout/AppShell';
import CreatorDashboard from '@/components/creator/CreatorDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function CreatorHubPage() {
  return (
    <AppShell>
      <ErrorBoundary>
        <CreatorDashboard />
      </ErrorBoundary>
    </AppShell>
  );
}
