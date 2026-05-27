import AppShell from '@/components/layout/AppShell';
import GamesPage from '@/components/GamesPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Games() {
  return (
    <AppShell>
      <ErrorBoundary>
        <GamesPage />
      </ErrorBoundary>
    </AppShell>
  );
}
