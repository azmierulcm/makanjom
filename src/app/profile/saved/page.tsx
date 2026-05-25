'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';
import { ChevronLeft, Heart, MapPin, Star } from 'lucide-react';
import { getGamificationState } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import type { Restaurant } from '@/lib/types';

export default function SavedPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { savedRestaurants } = getGamificationState();

    if (savedRestaurants.length === 0) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('restaurants')
          .select('*')
          .in('id', savedRestaurants);

        const dbResults: Restaurant[] = data ?? [];
        const dbIds = new Set(dbResults.map((r) => r.id));
        const mockFallbacks = MOCK_RESTAURANTS.filter(
          (r) => savedRestaurants.includes(r.id) && !dbIds.has(r.id)
        );
        const ordered = savedRestaurants
          .map((id) => [...dbResults, ...mockFallbacks].find((r) => r.id === id))
          .filter(Boolean) as Restaurant[];
        setRestaurants(ordered);
      } catch {
        setRestaurants(MOCK_RESTAURANTS.filter((r) => savedRestaurants.includes(r.id)));
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950"
        >
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>

        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
            <Heart className="h-3.5 w-3.5 text-[#ff385c]" />
            Saved
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
            Saved destinations
          </h1>
          <p className="mt-2 text-neutral-500">Restaurants you&apos;ve bookmarked for later.</p>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[2rem] bg-neutral-200" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-12 text-center shadow-sm">
            <Heart className="mx-auto mb-4 h-10 w-10 text-neutral-200" />
            <p className="text-lg font-semibold text-neutral-950">Nothing saved yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Tap the heart on any restaurant to save it here.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff385c] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#e93252]"
            >
              Explore restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="flex items-center gap-4 rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 text-3xl">
                  {r.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-neutral-950">{r.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {r.cuisine_types?.[0] ?? 'Local'}
                    </span>
                    <span>{r.price_range}</span>
                  </div>
                </div>
                <Heart className="h-5 w-5 shrink-0 fill-[#ff385c] text-[#ff385c]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
