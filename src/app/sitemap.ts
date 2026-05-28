import type { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://makanjom.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/explore`,     lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/articles`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/creators`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/games`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/login`,       lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    const supabase = await createSupabaseServerClient();

    // Dynamic restaurant pages
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, updated_at')
      .eq('is_active', true);

    const restaurantRoutes: MetadataRoute.Sitemap = (restaurants ?? []).map((r) => ({
      url: `${BASE_URL}/restaurants/${r.id}`,
      lastModified: r.updated_at ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));

    // Dynamic creator pages
    const { data: creators } = await supabase
      .from('profiles')
      .select('username, updated_at')
      .eq('role', 'creator')
      .not('username', 'is', null);

    const creatorRoutes: MetadataRoute.Sitemap = (creators ?? []).map((c) => ({
      url: `${BASE_URL}/creators/${c.username}`,
      lastModified: c.updated_at ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...restaurantRoutes, ...creatorRoutes];
  } catch {
    // If DB is unavailable, return just static routes
    return staticRoutes;
  }
}
