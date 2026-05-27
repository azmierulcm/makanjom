import AppShell from '@/components/layout/AppShell';
import RestaurantDetail from '@/components/RestaurantDetail';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <ErrorBoundary>
        <RestaurantDetail id={id} />
      </ErrorBoundary>
    </AppShell>
  );
}
