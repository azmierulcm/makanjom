import type { Metadata } from 'next';
import AppShell from '@/components/layout/AppShell';
import RestaurantDetail from '@/components/RestaurantDetail';
import ErrorBoundary from '@/components/ErrorBoundary';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMockRestaurant } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  // Try live DB first, fall back to mock for seed data
  let name = 'Restaurant';
  let description = 'Discover this restaurant on Makanjom — Malaysia\'s ultimate food discovery app.';
  let image: string | undefined;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('restaurants')
      .select('name, vibe, cuisine_types, price_range, images')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      name = data.name;
      const cuisine = data.cuisine_types?.[0] ?? 'Local';
      description = `${data.vibe ?? 'Great food'} · ${cuisine} · ${data.price_range ?? ''} — Discover ${name} on Makanjom.`;
      image = data.images?.[0];
    } else {
      const mock = getMockRestaurant(id);
      if (mock) {
        name = mock.name;
        description = `${mock.vibe ?? 'Great food'} · ${mock.cuisine_types?.[0] ?? 'Local'} — Discover ${name} on Makanjom.`;
      }
    }
  } catch {
    // Non-fatal — fall back to generic metadata
  }

  return {
    title: `${name} — Makanjom`,
    description,
    openGraph: {
      title: `${name} — Makanjom`,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: name }] } : {}),
      type: 'website',
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${name} — Makanjom`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

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
