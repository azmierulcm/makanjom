'use client';

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Sparkles, Utensils, Star, Shuffle, Clock3, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { sounds } from '@/lib/sounds';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import { recordSpin } from '@/lib/gamification';
import { haptics } from '@/lib/haptics';
import { getCuisineLabel } from '@/components/RestaurantCard';
import Link from 'next/link';
import type { Restaurant } from '@/lib/types';

interface SpinnerRestaurant extends Restaurant {
  distance?: string;
  accent?: string;
}

const cravings = ["Comfort", "Something new", "Family-friendly", "Quick bite", "Cozy dinner", "Treat meal"];
const accents = [
  "from-rose-50 to-orange-50",
  "from-emerald-50 to-lime-50",
  "from-sky-50 to-slate-50",
  "from-amber-50 to-red-50",
  "from-yellow-50 to-orange-50",
  "from-green-50 to-teal-50"
];

function pickRandomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function Reel({
  title,
  items,
  selectedIndex,
  spinning,
}: {
  title: string;
  items: string[];
  selectedIndex: number;
  spinning: boolean;
}) {
  const visibleItems = useMemo(() => {
    if (items.length === 0) return ["...", "...", "..."];
    const selected = items[selectedIndex % items.length];
    const before = items[(selectedIndex - 1 + items.length) % items.length];
    const after = items[(selectedIndex + 1) % items.length];
    return [before, selected, after];
  }, [items, selectedIndex]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm h-full">
      <div className="absolute inset-x-4 top-1/2 h-14 -translate-y-1/2 rounded-2xl bg-neutral-950/[0.035]" />
      <div className="border-b border-neutral-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">{title}</p>
      </div>

      <div className="relative h-44 px-4 py-4">
        <motion.div
          key={`${selectedIndex}-${spinning}`}
          initial={{ y: spinning ? -118 : -54, opacity: 0.7, filter: "blur(3px)" }}
          animate={{ y: -54, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 90, damping: 15, mass: 0.8 }}
          className="space-y-3"
        >
          {visibleItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className={`flex h-14 items-center justify-center rounded-2xl px-4 text-center text-sm font-semibold transition-all ${
                index === 1 ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200" : "text-neutral-300"
              }`}
            >
              <span className="truncate">{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default function MakanjomSpinner() {
  const [restaurants, setRestaurants] = useState<SpinnerRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState({ craving: 0, cuisine: 0, restaurant: 0 });
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      if (fetchError) throw fetchError;
      if (data?.length) {
        const mapped = data.map((r, i) => ({
          ...(r as SpinnerRestaurant),
          distance: `${(Math.random() * 15 + 2).toFixed(0)} min`,
          accent: accents[i % accents.length],
        }));
        setRestaurants(mapped);
        setSelected((prev) => ({ ...prev, restaurant: 0, cuisine: 0 }));
      } else {
        setRestaurants(MOCK_RESTAURANTS.map((r, i) => ({
          ...r,
          distance: `${(Math.random() * 15 + 2).toFixed(0)} min`,
          accent: accents[i % accents.length],
        })));
      }
    } catch {
      setRestaurants(MOCK_RESTAURANTS.map((r, i) => ({
        ...r,
        distance: `${(Math.random() * 15 + 2).toFixed(0)} min`,
        accent: accents[i % accents.length],
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const cuisines = useMemo(() => restaurants.map((r) => getCuisineLabel(r)), [restaurants]);
  const names = useMemo(() => restaurants.map(r => r.name), [restaurants]);
  const winner = restaurants[selected.restaurant % (restaurants.length || 1)] || restaurants[0];

  function spin() {
    if (spinning || restaurants.length === 0) return;

    haptics.medium();
    setSpinning(true);
    sounds?.play('start', 0.5);

    const totalSteps = 15;
    let step = 0;
    
    const executeStep = () => {
      step += 1;
      sounds?.play('tick', 0.15);

      setSelected({
        craving: pickRandomIndex(cravings.length),
        cuisine: pickRandomIndex(cuisines.length),
        restaurant: pickRandomIndex(restaurants.length),
      });

      if (step < totalSteps) {
        const nextDelay = 100 + (Math.pow(step / totalSteps, 2) * 300);
        setTimeout(executeStep, nextDelay);
      } else {
        const finalIdx = pickRandomIndex(restaurants.length);
        const cravingIdx = pickRandomIndex(cravings.length);
        setSelected({
          craving: cravingIdx,
          cuisine: finalIdx,
          restaurant: finalIdx,
        });

        setTimeout(() => {
          const picked = restaurants[finalIdx];
          if (picked) {
            recordSpin(picked.id, picked.name, cravings[cravingIdx]);
          }
          haptics.success();
          sounds?.play('reveal', 0.6);
          setSpinning(false);
        }, 300);
      }
    };

    setTimeout(executeStep, 100);
  }

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 w-full gap-4">
        <Loader2 className="animate-spin text-[#FF385C]" size={40} />
        <p className="text-neutral-400 font-medium">Gathering nearby spots...</p>
      </div>
    );
  }

  if (error || (restaurants.length === 0 && !loading)) {
      return (
          <div className="p-10 bg-white rounded-[2.5rem] border border-neutral-200 text-center max-w-lg mx-auto shadow-sm">
              <Utensils className="mx-auto mb-4 text-neutral-300" size={48} />
              <h3 className="text-xl font-bold mb-2">No restaurants found</h3>
              <p className="text-neutral-500 mb-6">{error || 'Your pool is empty.'}</p>
              <button onClick={fetchRestaurants} className="px-6 py-2 bg-[#ff385c] text-white rounded-full font-semibold">Try Again</button>
          </div>
      );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-safe-sticky-cta sm:px-6 lg:px-8 md:pb-8">
        <header className="flex flex-col gap-4 py-4 md:flex-row md:items-end md:justify-between md:gap-5 md:py-6">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm md:mb-4 md:px-4 md:py-2 md:text-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#ff385c] md:h-4 md:w-4" />
              Dinner decision, minus the group chat chaos
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl lg:text-6xl">
              Spin your next bite.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-600 md:mt-4 md:text-lg md:leading-7">
              Three reels, one winner — tap spin when you&apos;re ready to let fate pick dinner.
            </p>
          </div>

          <button
            onClick={spin}
            disabled={spinning}
            className="group hidden min-h-11 items-center justify-center gap-3 rounded-full bg-[#ff385c] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(255,56,92,0.25)] transition hover:-translate-y-0.5 hover:bg-[#e93252] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 md:inline-flex"
          >
            <Shuffle className={`h-5 w-5 ${spinning ? "animate-spin" : "transition group-hover:rotate-12"}`} />
            {spinning ? "Spinning..." : "Choose for me"}
          </button>
        </header>

        <div className="fixed bottom-nav-offset left-0 right-0 z-40 border-t border-neutral-100 bg-[#faf9f7]/95 px-4 py-3 backdrop-blur-lg md:hidden">
          <button
            onClick={spin}
            disabled={spinning}
            className="flex w-full min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#ff385c] text-base font-bold text-white shadow-[0_12px_32px_rgba(255,56,92,0.35)] active:scale-[0.98] disabled:opacity-70"
          >
            <Shuffle className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`} />
            {spinning ? 'Spinning...' : 'Choose for me'}
          </button>
        </div>

        <section className="grid gap-4 rounded-[2.5rem] border border-neutral-200 bg-white/60 p-3 shadow-sm backdrop-blur md:grid-cols-3 md:p-4">
          <Reel title="Craving" items={cravings} selectedIndex={selected.craving} spinning={spinning} />
          <Reel title="Cuisine" items={cuisines} selectedIndex={selected.cuisine} spinning={spinning} />
          <Reel title="Winner" items={names} selectedIndex={selected.restaurant} spinning={spinning} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            layout
            className={`relative overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-gradient-to-br ${winner.accent} p-6 shadow-sm sm:p-8`}
          >
            <div className="absolute right-6 top-6 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-neutral-200/70">
              Result
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={winner.name}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-white text-4xl shadow-sm ring-1 ring-neutral-200">
                  {winner.emoji}
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">Tonight&apos;s pick</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
                  {winner.name}
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-700">
                  {getCuisineLabel(winner)} with a {(winner.vibe || 'Cozy').toLowerCase()} vibe. Close enough to be easy, special enough to feel chosen.
                </p>

                <Link
                  href={`/restaurants/${winner.id}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white hover:bg-black"
                >
                  View venue details
                </Link>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white/75 p-4 shadow-sm ring-1 ring-neutral-200/70">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                      <Clock3 className="h-4 w-4" /> Distance
                    </div>
                    <p className="mt-2 text-xl font-semibold">{winner.distance}</p>
                  </div>
                  <div className="rounded-3xl bg-white/75 p-4 shadow-sm ring-1 ring-neutral-200/70">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                      <Star className="h-4 w-4" /> Rating
                    </div>
                    <p className="mt-2 text-xl font-semibold">{winner.rating}</p>
                  </div>
                  <div className="rounded-3xl bg-white/75 p-4 shadow-sm ring-1 ring-neutral-200/70">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                      <Utensils className="h-4 w-4" /> Price
                    </div>
                    <p className="mt-2 text-xl font-semibold">{winner.price_range}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <aside className="rounded-[2.5rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-400">Nearby options</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Restaurant pool</h3>
              </div>
              <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-500">{restaurants.length}</div>
            </div>

            <div className="mt-5 space-y-3">
              {restaurants.map((item) => {
                const index = restaurants.indexOf(item);
                const active = index === selected.restaurant;
                return (
                  <Link
                    key={item.id}
                    href={`/restaurants/${item.id}`}
                    className={`flex items-center gap-4 rounded-3xl border p-3 transition ${
                      active ? 'border-[#ff385c]/30 bg-[#fff4f6]' : 'border-neutral-100 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
                      {item.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-neutral-950">{item.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{getCuisineLabel(item)}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-neutral-500">{item.distance}</div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>
    </div>
  );
}
