'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Sparkles, Clock, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import RestaurantCard from '@/components/RestaurantCard';
import type { Restaurant } from '@/lib/types';

const CUISINE_FILTERS = ['All', 'Malay', 'Indian', 'Cafe', 'Japanese', 'Dessert', 'Mamak', 'Penang'];
const PRICE_FILTERS = ['Any', '< RM 10', 'RM 10–20', 'RM 20–50', 'RM 50+'];

type SortKey = 'rating' | 'newest' | 'az';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'rating',  label: 'Top rated' },
  { key: 'newest',  label: 'Newest' },
  { key: 'az',      label: 'A – Z' },
];

function isRestaurantOpenNow(restaurant: Restaurant): boolean {
  const hours = restaurant.business_hours;
  if (!hours) return false;
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const value = hours[DAY_NAMES[now.getDay()]];
  if (!value || value.toLowerCase() === 'closed') return false;
  const match = value.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const open = parseInt(match[1]) * 60 + parseInt(match[2]);
  const close = parseInt(match[3]) * 60 + parseInt(match[4]);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= open && cur < close;
}

export default function ExplorePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [price, setPrice] = useState('Any');
  const [openNow, setOpenNow] = useState(false);
  const [sort, setSort] = useState<SortKey>('rating');
  const [showSort, setShowSort] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRestaurants = async (searchTerm: string, cuisineFilter: string, priceFilter: string, sortKey: SortKey) => {
    setLoading(true);
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true);

      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      if (cuisineFilter !== 'All') query = query.contains('cuisine_types', [cuisineFilter]);
      if (priceFilter !== 'Any') query = query.eq('price_range', priceFilter);

      // Server-side sort
      if (sortKey === 'rating') query = query.order('rating', { ascending: false });
      else if (sortKey === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortKey === 'az') query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error || !data?.length) {
        const mock = MOCK_RESTAURANTS.filter((r) => {
          const matchSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchCuisine = cuisineFilter === 'All' || r.cuisine_types?.some((c) => c.toLowerCase().includes(cuisineFilter.toLowerCase()));
          const matchPrice = priceFilter === 'Any' || r.price_range === priceFilter;
          return matchSearch && matchCuisine && matchPrice;
        });
        setRestaurants(mock);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchRestaurants(search, cuisine, price, sort),
      search ? 300 : 0
    );
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, cuisine, price, sort]);

  // Only open-now filtering remains client-side (time-based logic)
  const filtered = useMemo(() => {
    if (!openNow) return restaurants;
    return restaurants.filter((r) => !r.business_hours || isRestaurantOpenNow(r));
  }, [restaurants, openNow]);

  const activeFilterCount = [openNow, price !== 'Any', cuisine !== 'All', sort !== 'rating'].filter(Boolean).length;

  const clearAll = () => { setCuisine('All'); setPrice('Any'); setOpenNow(false); };

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

      {/* Search + Sort row */}
      <div className="mb-3 flex gap-3">
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

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort((v) => !v)}
            className="flex min-h-11 items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-600 shadow-sm hover:bg-neutral-50 active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{SORT_OPTIONS.find((s) => s.key === sort)?.label}</span>
            <ChevronDown className={`h-4 w-4 transition ${showSort ? 'rotate-180' : ''}`} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSort(opt.key); setShowSort(false); }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition hover:bg-neutral-50 ${
                    sort === opt.key ? 'text-[#ff385c]' : 'text-neutral-700'
                  }`}
                >
                  {opt.label}
                  {sort === opt.key && <div className="h-2 w-2 rounded-full bg-[#ff385c]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter chips row */}
      <div className="mb-6 -mx-4 flex items-center gap-2 overflow-x-auto scroll-touch px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {/* Open Now */}
        <button
          onClick={() => setOpenNow((v) => !v)}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 min-h-11 ${
            openNow ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" /> Open now
        </button>

        {/* Divider */}
        <div className="h-6 w-px shrink-0 bg-neutral-200" />

        {/* Cuisine */}
        {CUISINE_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => setCuisine(c)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 min-h-11 ${
              cuisine === c ? 'bg-[#ff385c] text-white shadow-sm' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {c}
          </button>
        ))}

        {/* Divider */}
        <div className="h-6 w-px shrink-0 bg-neutral-200" />

        {/* Price */}
        {PRICE_FILTERS.map((p) => (
          <button
            key={p}
            onClick={() => setPrice(p)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 min-h-11 ${
              price === p ? 'bg-neutral-950 text-white shadow-sm' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {p}
          </button>
        ))}

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <>
            <div className="h-6 w-px shrink-0 bg-neutral-200" />
            <button
              onClick={clearAll}
              className="shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200 bg-white hover:bg-neutral-50 active:scale-95 min-h-11"
            >
              <X className="h-3.5 w-3.5" /> Clear ({activeFilterCount})
            </button>
          </>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mb-5 text-sm font-medium text-neutral-400">
          {filtered.length} venue{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Grid */}
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
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="mt-4 rounded-full bg-[#ff385c] px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              Clear all filters
            </button>
          )}
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
