'use client';

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Sparkles, Utensils, Star, Shuffle, Heart, X, ChevronRight, SlidersHorizontal, Share2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { sounds } from '@/lib/sounds';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import { recordSpin, toggleSavedRestaurant, getGamificationState, syncFromDb } from '@/lib/gamification';
import { checkRateLimit, formatResetTime } from '@/lib/rateLimit';
import { haptics } from '@/lib/haptics';
import { getCuisineLabel } from '@/components/RestaurantCard';
import Link from 'next/link';
import type { Restaurant } from '@/lib/types';

interface SpinnerRestaurant extends Restaurant {
  accent?: string;
}

const VIBES = ["Any vibe", "Comfort food", "Something new", "Family outing", "Quick bite", "Cozy dinner", "Treat yourself"];
const PRICES = ["Any price", "RM", "RM RM", "RM RM RM", "RM RM RM RM"];
const accents = [
  "from-rose-50 to-orange-50",
  "from-emerald-50 to-lime-50",
  "from-sky-50 to-slate-50",
  "from-amber-50 to-red-50",
  "from-yellow-50 to-orange-50",
  "from-green-50 to-teal-50",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickRandomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

// Row height in px — all three slots are this tall so the stack is exactly ROW_H×3.
const ROW_H = 72;

function WinnerReel({ items, selectedIndex, spinning }: { items: string[]; selectedIndex: number; spinning: boolean }) {
  const visibleItems = useMemo(() => {
    if (items.length === 0) return ["...", "...", "..."];
    return [
      items[(selectedIndex - 1 + items.length) % items.length],
      items[selectedIndex % items.length],
      items[(selectedIndex + 1) % items.length],
    ];
  }, [items, selectedIndex]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
      {/* WINNER label */}
      <div className="border-b border-neutral-100 px-6 py-3 text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-neutral-400">Winner</p>
      </div>

      {/* Reel body — height = exactly 3 rows, no padding so math stays clean */}
      <div className="relative" style={{ height: ROW_H * 3 }}>

        {/* Middle-row selection highlight — precise position, no top-1/2 guesswork */}
        <div
          className="absolute inset-x-5 rounded-2xl bg-neutral-950/[0.05]"
          style={{ top: ROW_H, height: ROW_H }}
        />

        {/* Slot-machine gradient fades — top and bottom rows dissolve into white */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white to-transparent"
          style={{ height: ROW_H * 0.85 }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white to-transparent"
          style={{ height: ROW_H * 0.85 }}
        />

        {/* Animated strip — key on selectedIndex remounts per tick during spin */}
        <motion.div
          key={selectedIndex}
          initial={{
            y: spinning ? -ROW_H : -ROW_H * 0.35,
            opacity: 0.55,
            filter: spinning ? "blur(6px)" : "blur(3px)",
          }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            stiffness: spinning ? 480 : 280,
            damping: spinning ? 38 : 24,
            mass: 0.85,
          }}
        >
          {visibleItems.map((item, i) => (
            <div
              key={i}
              style={{ height: ROW_H }}
              className={`flex items-center justify-center px-6 text-center ${
                i === 1
                  ? "font-black text-neutral-950 text-[1.05rem] leading-tight"
                  : "font-semibold text-neutral-300 text-sm"
              }`}
            >
              {/* line-clamp-2 prevents long names from overflowing their row */}
              <span className="line-clamp-2 leading-snug">{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function FilterChips({ label, options, selected, onChange }: {
  label: string;
  options: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-neutral-400 w-16">{label}</span>
      <div className="-mx-1 flex gap-2 overflow-x-auto scroll-touch px-1 pb-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); haptics.light(); }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 min-h-[2.25rem] ${
              selected === opt
                ? 'bg-neutral-950 text-white shadow-sm'
                : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MakanjomSpinner() {
  const [restaurants, setRestaurants] = useState<SpinnerRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(() => getGamificationState().savedRestaurants);

  // Filters
  const [filterVibe, setFilterVibe] = useState("Any vibe");
  const [filterCuisine, setFilterCuisine] = useState("Any");
  const [filterPrice, setFilterPrice] = useState("Any price");
  const [showFilters, setShowFilters] = useState(false);
  const [streak, setStreak] = useState<number>(() => getGamificationState().spinStreak ?? 0);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .limit(50);

      if (fetchError) throw fetchError;
      const src = data?.length ? data : MOCK_RESTAURANTS;
      setRestaurants((src as SpinnerRestaurant[]).map((r, i) => ({
        ...r,
        accent: accents[i % accents.length],
      })));
    } catch {
      setRestaurants(MOCK_RESTAURANTS.map((r, i) => ({ ...r, accent: accents[i % accents.length] })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // Sync authoritative data from DB (cross-device support).
    // savedIds and streak are already seeded from localStorage via lazy useState.
    syncFromDb().then(() => {
      const synced = getGamificationState();
      setSavedIds(synced.savedRestaurants);
      setStreak(synced.spinStreak ?? 0);
    });
  }, []);

  // Derive unique cuisines from loaded restaurants
  const cuisineOptions = useMemo(() => {
    const seen = new Set<string>();
    restaurants.forEach((r) => r.cuisine_types?.forEach((c) => seen.add(c)));
    return ["Any", ...Array.from(seen).sort()];
  }, [restaurants]);

  // Apply filters to get the spin pool
  const pool = useMemo(() => {
    return restaurants.filter((r) => {
      const cuisineMatch =
        filterCuisine === "Any" ||
        r.cuisine_types?.some((c) => c.toLowerCase() === filterCuisine.toLowerCase());
      const priceMatch =
        filterPrice === "Any price" || r.price_range === filterPrice;
      return cuisineMatch && priceMatch;
    });
  }, [restaurants, filterCuisine, filterPrice]);

  const poolNames = useMemo(() => pool.map((r) => r.name), [pool]);
  const winner = pool[winnerIdx % (pool.length || 1)] ?? pool[0] ?? restaurants[0];

  function spin() {
    if (spinning || pool.length === 0) return;

    // Rate limit: 10 spins per minute
    const rl = checkRateLimit('spinner', 10, 60_000);
    if (!rl.allowed) {
      setError(`Too many spins! Take a breather and try again in ${formatResetTime(rl.resetInMs)}.`);
      setTimeout(() => setError(null), 4000);
      return;
    }

    haptics.medium();
    setSpinning(true);
    sounds?.play('start', 0.5);

    const totalSteps = 14;
    let step = 0;

    const executeStep = () => {
      step += 1;
      sounds?.play('tick', 0.15);
      setWinnerIdx(pickRandomIndex(pool.length));

      if (step < totalSteps) {
        setTimeout(executeStep, 80 + Math.pow(step / totalSteps, 2) * 320);
      } else {
        const finalIdx = pickRandomIndex(pool.length);
        setWinnerIdx(finalIdx);
        setTimeout(() => {
          const picked = pool[finalIdx];
          const vibe = filterVibe === "Any vibe" ? pickRandom(VIBES.slice(1)) : filterVibe;
          if (picked) {
            const newState = recordSpin(picked.id, picked.name, vibe);
            setStreak(newState.spinStreak ?? 0);
          }
          haptics.success();
          sounds?.play('reveal', 0.6);
          setSpinning(false);
          setShowSheet(true);
        }, 300);
      }
    };

    setTimeout(executeStep, 80);
  }

  function handleSaveWinner() {
    const state = toggleSavedRestaurant(winner.id);
    setSavedIds(state.savedRestaurants);
    haptics.light();
  }

  const activeFilterCount = [
    filterVibe !== "Any vibe",
    filterCuisine !== "Any",
    filterPrice !== "Any price",
  ].filter(Boolean).length;

  const isBootstrapping = loading && restaurants.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-8 md:pb-8">

      {/* Page header */}
      <header className="flex flex-col gap-4 py-4 md:flex-row md:items-end md:justify-between md:gap-5 md:py-6">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm md:px-4 md:py-2 md:text-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#ff385c] md:h-4 md:w-4" />
              Dinner decision, minus the group chat chaos
            </div>
            {streak > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
                🔥 {streak}-day streak
              </div>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl lg:text-6xl">
            Spin your next bite.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-600 md:mt-4 md:text-lg md:leading-7">
            Set your mood, pick a cuisine, and let fate choose the restaurant.
          </p>
        </div>
        <button
          onClick={spin}
          disabled={isBootstrapping || spinning || pool.length === 0}
          className="group hidden min-h-11 items-center justify-center gap-3 rounded-full bg-[#ff385c] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(255,56,92,0.25)] transition hover:-translate-y-0.5 hover:bg-[#e93252] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 md:inline-flex"
        >
          <Shuffle className={`h-5 w-5 ${spinning ? "animate-spin" : "transition group-hover:rotate-12"}`} />
          {spinning ? "Spinning..." : "Choose for me"}
        </button>
      </header>

      {/* Sticky mobile spin CTA */}
      <div className="fixed bottom-nav-offset left-0 right-0 z-40 border-t border-neutral-100 bg-[#faf9f7]/95 px-4 py-3 backdrop-blur-lg md:hidden">
        <button
          onClick={spin}
          disabled={isBootstrapping || spinning || pool.length === 0}
          className="flex w-full min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#ff385c] text-base font-bold text-white shadow-[0_12px_32px_rgba(255,56,92,0.35)] active:scale-[0.98] disabled:opacity-70"
        >
          <Shuffle className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`} />
          {isBootstrapping ? 'Loading restaurants...' : spinning ? 'Spinning...' : pool.length === 0 ? 'No matches — clear filters' : `Choose from ${pool.length} spots`}
        </button>
      </div>

      {/* Filters panel */}
      <div className="mb-4 rounded-[2rem] border border-neutral-200 bg-white/80 shadow-sm backdrop-blur">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-bold text-neutral-700">Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#ff385c] px-2 py-0.5 text-xs font-black text-white">
                {activeFilterCount}
              </span>
            )}
            <span className="text-xs text-neutral-400">
              {pool.length} spot{pool.length !== 1 ? 's' : ''} in pool
            </span>
          </div>
          <motion.div animate={{ rotate: showFilters ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="h-4 w-4 rotate-90 text-neutral-400" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-neutral-100 px-5 py-4">
                <FilterChips label="Vibe" options={VIBES} selected={filterVibe} onChange={setFilterVibe} />
                <FilterChips label="Cuisine" options={cuisineOptions} selected={filterCuisine} onChange={setFilterCuisine} />
                <FilterChips label="Price" options={PRICES} selected={filterPrice} onChange={setFilterPrice} />

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterVibe("Any vibe"); setFilterCuisine("Any"); setFilterPrice("Any price"); }}
                    className="text-xs font-semibold text-[#ff385c] hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Winner reel + result layout */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">

        {/* Left: reel + result card */}
        <div className="flex flex-col gap-4">
          {isBootstrapping ? (
            /* Skeleton — same dimensions as real content, prevents CLS */
            <>
              <div className="rounded-[2.5rem] border border-neutral-200 bg-white/60 p-3 shadow-sm h-[284px] animate-pulse" />
              <div className="rounded-[2.5rem] border border-neutral-200 bg-neutral-100 p-6 shadow-sm h-[320px] animate-pulse" />
            </>
          ) : error || (restaurants.length === 0 && !loading) ? (
            <div className="p-10 bg-white rounded-[2.5rem] border border-neutral-200 text-center max-w-lg mx-auto shadow-sm">
              <Utensils className="mx-auto mb-4 text-neutral-300" size={48} />
              <h3 className="text-xl font-bold mb-2">No restaurants found</h3>
              <p className="text-neutral-500 mb-6">{error || 'Your pool is empty.'}</p>
              <button onClick={fetchRestaurants} className="px-6 py-2 bg-[#ff385c] text-white rounded-full font-semibold">Try Again</button>
            </div>
          ) : (
          <>
          {/* Single winner reel */}
          <div className="rounded-[2.5rem] border border-neutral-200 bg-white/60 p-3 shadow-sm backdrop-blur sm:p-4">
            {pool.length === 0 ? (
              <div className="flex h-52 items-center justify-center rounded-[2rem] bg-neutral-50 text-center">
                <div>
                  <p className="font-bold text-neutral-400">No matches</p>
                  <p className="mt-1 text-sm text-neutral-300">Try adjusting your filters</p>
                </div>
              </div>
            ) : (
              <WinnerReel items={poolNames} selectedIndex={winnerIdx} spinning={spinning} />
            )}
          </div>

          {/* Result card */}
          {winner && (
            <motion.div
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
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-white text-4xl shadow-sm ring-1 ring-neutral-200">
                    {winner.emoji}
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">Tonight&apos;s pick</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
                    {winner.name}
                  </h2>
                  <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-700">
                    {getCuisineLabel(winner)} · {(winner.vibe || 'Cozy')} vibe
                    {filterVibe !== "Any vibe" ? ` · ${filterVibe}` : ''}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/restaurants/${winner.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white hover:bg-black active:scale-95"
                    >
                      View details <ChevronRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={handleSaveWinner}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition active:scale-95 ${
                        savedIds.includes(winner.id)
                          ? 'bg-[#ff385c] text-white'
                          : 'bg-white/80 text-neutral-700 ring-1 ring-neutral-200'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${savedIds.includes(winner.id) ? 'fill-white' : ''}`} />
                      {savedIds.includes(winner.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
          )}
          </>
          )}
        </div>

        {/* Right: restaurant pool */}
        <aside className="rounded-[2.5rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-400">Spin pool</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Available spots</h3>
            </div>
            <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-500">{pool.length}</div>
          </div>

          <div className="mt-5 space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {isBootstrapping ? (
              [1,2,3,4,5].map((i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-3xl bg-neutral-100" />
              ))
            ) : pool.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No restaurants match your filters.</p>
            ) : (
              pool.map((item, index) => {
                const active = index === winnerIdx % pool.length;
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
                        <span className="truncate">{getCuisineLabel(item)}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-neutral-400">{item.price_range}</span>
                  </Link>
                );
              })
            )}
          </div>
        </aside>
      </section>

      {/* Mobile Result Bottom Sheet */}
      <AnimatePresence>
        {showSheet && winner && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              className="fixed inset-0 z-[60] bg-neutral-950/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[70] overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl md:hidden"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-neutral-200" />
              </div>
              <button
                onClick={() => setShowSheet(false)}
                aria-label="Close"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
              >
                <X size={16} />
              </button>

              <div className={`relative mx-4 mt-4 overflow-hidden rounded-[2rem] bg-gradient-to-br ${winner.accent} p-6`}>
                {winner.images?.[0] && (
                  <Image src={winner.images[0]} alt={winner.name} fill className="object-cover opacity-25" />
                )}
                <p className="relative text-xs font-black uppercase tracking-[0.2em] text-neutral-500">🎰 Tonight&apos;s pick</p>
                <div className="relative mt-3 flex items-center gap-3">
                  <span className="text-4xl">{winner.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-neutral-950">{winner.name}</h2>
                    <div className="mt-1 flex items-center gap-3 text-sm text-neutral-600">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{winner.rating}
                      </span>
                      <span>{winner.price_range}</span>
                      <span>{winner.vibe}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 px-4">
                <Link
                  href={`/restaurants/${winner.id}`}
                  onClick={() => setShowSheet(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 py-4 text-sm font-black text-white"
                >
                  View venue details <ChevronRight size={16} />
                </Link>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleSaveWinner}
                    className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition active:scale-95 ${
                      savedIds.includes(winner.id) ? 'bg-[#ff385c] text-white' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <Heart size={16} className={savedIds.includes(winner.id) ? 'fill-white' : ''} />
                    {savedIds.includes(winner.id) ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/restaurants/${winner.id}`;
                      const text = `Makanjom picked ${winner.name} for me — let fate choose your next meal! 🎰`;
                      if (navigator.share) {
                        await navigator.share({ title: winner.name, text, url }).catch(() => {});
                      } else {
                        await navigator.clipboard.writeText(`${text}\n${url}`);
                      }
                      haptics.light();
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 active:scale-95"
                  >
                    <Share2 size={16} /> Share
                  </button>
                  <button
                    onClick={() => { setShowSheet(false); spin(); }}
                    disabled={spinning}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 active:scale-95 disabled:opacity-50"
                  >
                    <Shuffle size={16} /> Again
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
