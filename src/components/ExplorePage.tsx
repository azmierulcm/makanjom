'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import RestaurantCard from '@/components/RestaurantCard';
import type { Restaurant } from '@/lib/types';

const CUISINE_FILTERS = ['All', 'Malay', 'Indian', 'Cafe', 'Japanese', 'Dessert', 'Mamak', 'Penang'];

export default function ExplorePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error || !data?.length) {
        setRestaurants(MOCK_RESTAURANTS);
      } else {
        setRestaurants(data as Restaurant[]);
      }
    } catch {
      setRestaurants(MOCK_RESTAURANTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine_types?.some((c) => c.toLowerCase().includes(search.toLowerCase()));
      const matchesCuisine =
        cuisine === 'All' || r.cuisine_types?.some((c) => c.toLowerCase().includes(cuisine.toLowerCase()));
      return matchesSearch && matchesCuisine;
    });
  }, [restaurants, search, cuisine]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 sm:mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm sm:mb-4 sm:px-4 sm:py-2 sm:text-sm">
          <Sparkles className="h-4 w-4 text-[#ff385c]" />
          Malaysia&apos;s ultimate dining guide
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl">
          Explore venues
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 sm:mt-4 sm:text-lg">
          Premier restaurants, hidden cafes, menus, and offers — everything you need to decide where to eat.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-11 rounded-2xl border border-neutral-200 bg-white py-3.5 pl-12 pr-4 text-base text-neutral-950 shadow-sm outline-none focus:border-[#ff385c]/40 focus:ring-2 focus:ring-[#ff385c]/10"
          />
        </div>
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto scroll-touch scroll-snap-x px-4 pb-1 sm:mx-0 sm:px-0">
          <SlidersHorizontal className="hidden h-4 w-4 shrink-0 text-neutral-400 sm:block" />
          {CUISINE_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setCuisine(c)}
              className={`scroll-snap-start shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 min-h-11 ${
                cuisine === c
                  ? 'bg-[#ff385c] text-white shadow-sm'
                  : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-[2rem] bg-neutral-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-neutral-950">No venues found</p>
          <p className="mt-2 text-neutral-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((restaurant, i) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
