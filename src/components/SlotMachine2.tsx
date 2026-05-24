"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Shuffle, Sparkles, Utensils, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { recordSpin } from '@/lib/gamification';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import { getCuisineLabel } from '@/components/RestaurantCard';
import Link from 'next/link';
import type { Restaurant } from '@/lib/types';

const cravings = ["Something new", "Comfort food", "Quick bite", "Family-friendly", "Spicy", "Dessert"];

function pickRandomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function Reel({
  label,
  items,
  selectedIndex,
  spinning,
  showIcon = false
}: {
  label: string;
  items: string[];
  selectedIndex: number;
  spinning: boolean;
  showIcon?: boolean;
}) {
  const visibleItems = useMemo(() => {
    if (items.length === 0) return ["...", "...", "..."];
    const selected = items[selectedIndex % items.length];
    const before = items[(selectedIndex - 1 + items.length) % items.length];
    const after = items[(selectedIndex + 1) % items.length];
    return [before, selected, after];
  }, [items, selectedIndex]);

  return (
    <div className="grid grid-cols-[5.1rem_1fr] items-stretch overflow-hidden rounded-[1.1rem] border border-neutral-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col justify-between border-r border-neutral-100 bg-white px-3 py-3">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-neutral-400">
          {label}
        </p>
        {showIcon ? (
          <div className="mt-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-[#ff385c]">
            <Utensils className="h-3.5 w-3.5" />
          </div>
        ) : (
          <p className="mt-3 text-[10px] font-semibold text-neutral-300">reel</p>
        )}
      </div>

      <div className="relative px-2 py-2 overflow-hidden h-[5.9rem]">
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white shadow-[0_8px_16px_rgba(15,23,42,0.06)] z-10" />

        <motion.div
          key={`${selectedIndex}-${spinning}`}
          initial={{ y: spinning ? -80 : -34, opacity: 0.7, filter: "blur(2px)" }}
          animate={{ y: -34, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 100, damping: 18, mass: 0.8 }}
          className="relative z-0 space-y-1"
        >
          {visibleItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className={`flex h-8 items-center justify-center px-3 text-center transition-all ${
                index === 1 ? "text-[15px] font-black text-neutral-950" : "text-xs font-semibold text-neutral-300"
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

export default function SlotMachine2() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState({ craving: 0, cuisine: 0, restaurant: 0 });
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      if (data?.length) {
        setRestaurants(data as Restaurant[]);
      } else {
        setRestaurants(MOCK_RESTAURANTS);
      }
    } catch {
      setRestaurants(MOCK_RESTAURANTS);
    } finally {
      setLoading(false);
    }
  };

  const cuisines = useMemo(() => restaurants.map((r) => getCuisineLabel(r)), [restaurants]);
  const names = useMemo(() => restaurants.map(r => r.name), [restaurants]);
  const winner = restaurants[selected.restaurant % (restaurants.length || 1)] || restaurants[0];

  function spin() {
    if (spinning || restaurants.length === 0) return;

    haptics.medium();
    setSpinning(true);
    setHasSpun(false);
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
        // Logarithmic easing for that "slowing down" feel
        const nextDelay = 80 + (Math.pow(step / totalSteps, 2) * 350);
        setTimeout(executeStep, nextDelay);
      } else {
        const finalRestIdx = pickRandomIndex(restaurants.length);
        const finalCravIdx = pickRandomIndex(cravings.length);
        
        setSelected({
          craving: finalCravIdx,
          cuisine: finalRestIdx,
          restaurant: finalRestIdx,
        });

        setTimeout(() => {
          const picked = restaurants[finalRestIdx];
          if (picked) {
            recordSpin(picked.id, picked.name, cravings[finalCravIdx]);
          }
          haptics.success();
          sounds?.play('reveal', 0.6);
          setSpinning(false);
          setHasSpun(true);
        }, 400);
      }
    };

    setTimeout(executeStep, 100);
  }

  const reset = () => {
    setSelected({ craving: 0, cuisine: 0, restaurant: 0 });
    setHasSpun(false);
  };

  if (loading && restaurants.length === 0) return (
    <div className="flex flex-col items-center justify-center p-32 w-full gap-4 bg-[#f7f5f2] min-h-screen">
      <Loader2 className="animate-spin text-[#FF385C]" size={40} />
      <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Loading Kitchen...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-3 py-3 font-sans text-neutral-950 flex items-center justify-center">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[390px] flex-col rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="flex-1 space-y-3 p-3 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-neutral-600 shadow-sm">
              <Sparkles className="h-3 w-3 shrink-0 text-[#ff385c]" />
              <span className="truncate">Decision slot v2</span>
            </div>

            <button
              onClick={reset}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm active:scale-95 transition-transform"
              aria-label="Reset reels"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-[#faf9f7] p-4">
            <h1 className="text-[2.45rem] font-black leading-[0.9] tracking-[-0.075em] text-neutral-950 italic">
              Spin your next bite.
            </h1>
            <p className="mt-3 max-w-[18rem] text-[13px] leading-5 text-neutral-500">
              Three synchronized reels, one winner. Let the crystal chime decide.
            </p>
          </div>

          <div className="space-y-2 rounded-[1.5rem] border border-neutral-200 bg-[#fbfaf8] p-2">
            <Reel label="Craving" items={cravings} selectedIndex={selected.craving} spinning={spinning} />
            <Reel label="Cuisine" items={cuisines} selectedIndex={selected.cuisine} spinning={spinning} />
            <Reel label="Winner" items={names} selectedIndex={selected.restaurant} spinning={spinning} showIcon />
          </div>

          <AnimatePresence mode="wait">
            {hasSpun && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-[1.35rem] bg-rose-50 px-4 py-3 border border-rose-100"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Tonight says</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black tracking-[-0.04em] text-neutral-950">{winner.name}</p>
                    <p className="truncate text-xs font-medium text-neutral-500">
                      {cravings[selected.craving]} · {getCuisineLabel(winner)}
                    </p>
                  </div>
                  <Link 
                    href={`/restaurants/${winner.id}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ff385c] text-white shadow-lg active:scale-90 transition-transform"
                  >
                    <Utensils className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-neutral-100 bg-white/90 p-3 backdrop-blur-xl z-20">
          <button
            onClick={spin}
            disabled={spinning}
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-[#ff385c] px-5 py-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,56,92,0.3)] transition hover:-translate-y-0.5 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Shuffle className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
            {spinning ? "Spinning..." : "Choose for me"}
          </button>
        </div>
      </section>
    </main>
  );
}
