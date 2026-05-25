import AppShell from '@/components/layout/AppShell';
import MakanjomSpinner from '@/components/MakanjomSpinner';
import TrendingStrip from '@/components/TrendingStrip';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <AppShell>
      <div className="py-8 sm:py-12">
        <ErrorBoundary>
          <MakanjomSpinner />
        </ErrorBoundary>
      </div>
      <ErrorBoundary>
        <TrendingStrip />
      </ErrorBoundary>
    </AppShell>
  );
}
