import AppShell from '@/components/layout/AppShell';
import ExplorePage from '@/components/ExplorePage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function Explore() {
  return (
    <AppShell>
      <ErrorBoundary>
        <ExplorePage />
      </ErrorBoundary>
    </AppShell>
  );
}
