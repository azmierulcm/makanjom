'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, TrendingUp, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import type { Restaurant } from '@/lib/types';

const ACCENTS = [
  'from-rose-50 to-orange-50',
  'from-emerald-50 to-lime-50',
  'from-sky-50 to-slate-50',
  'from-amber-50 to-red-50',
  'from-yellow-50 to-orange-50',
  'from-purple-50 to-pink-50',
];

export default function TrendingStrip() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('restaurants')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(8);
        setRestaurants(data?.length ? (data as Restaurant[]) : MOCK_RESTAURANTS.slice(0, 6));
      } catch {
        setRestaurants(MOCK_RESTAURANTS.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-safe-sticky-cta sm:px-6 lg:px-8 md:pb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#ff385c]" />
          <h2 className="text-lg font-black tracking-tight text-neutral-950">Trending this week</h2>
        </div>
        <Link
          href="/explore"
          className="flex items-center gap-1 text-sm font-bold text-[#ff385c] hover:underline"
        >
          See all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto scroll-touch scroll-snap-x px-4 pb-3 sm:mx-0 sm:px-0">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="scroll-snap-start h-44 w-44 shrink-0 animate-pulse rounded-[2rem] bg-neutral-200 sm:w-52" />
            ))
          : restaurants.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="scroll-snap-start shrink-0 w-44 sm:w-52"
              >
                <Link
                  href={`/restaurants/${r.id}`}
                  className={`group block overflow-hidden rounded-[2rem] bg-gradient-to-br ${ACCENTS[i % ACCENTS.length]} border border-neutral-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
                >
                  {/* Image or emoji */}
                  <div className="relative h-28 overflow-hidden">
                    {r.images?.[0] ? (
                      <Image
                        src={r.images[0]}
                        alt={r.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 176px, 208px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl">
                        {r.emoji}
                      </div>
                    )}
                    {/* Rank badge */}
                    <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[11px] font-black text-neutral-800 shadow-sm">
                      {i + 1}
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-neutral-950">{r.name}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                      <span>{r.cuisine_types?.[0] ?? 'Local'}</span>
                      <span className="flex items-center gap-0.5 font-bold text-neutral-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {r.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
}
