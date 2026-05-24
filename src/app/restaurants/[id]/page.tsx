import AppShell from '@/components/layout/AppShell';
import RestaurantDetail from '@/components/RestaurantDetail';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <RestaurantDetail id={id} />
    </AppShell>
  );
}
