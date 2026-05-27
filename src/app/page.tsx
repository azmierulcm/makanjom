import AppShell from '@/components/layout/AppShell';
import MakanjomSpinner from '@/components/MakanjomSpinner';
import TrendingStrip from '@/components/TrendingStrip';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <AppShell>
      <div className="pt-8 sm:pt-12">
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
