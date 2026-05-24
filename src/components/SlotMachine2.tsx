'use client';

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Utensils, Star, Shuffle, Loader2, Trophy, Coins } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { sounds } from '@/lib/sounds';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import { recordGamePlayed } from '@/lib/gamification';
import { haptics } from '@/lib/haptics';
import { getCuisineLabel } from '@/components/RestaurantCard';
import Link from 'next/link';
import type { Restaurant } from '@/lib/types';

interface SpinnerRestaurant extends Restaurant {
  accent?: string;
}

const prizePool = ["Discount 10%", "Free Drink", "Free Dessert", "RM 5 Voucher", "Double Points", "Next Time!"];
const accents = [
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-indigo-400 to-purple-500",
  "from-emerald-400 to-teal-500"
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
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-neutral-800 bg-neutral-900 shadow-2xl h-full group">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10" />
      <div className="absolute inset-x-2 top-1/2 h-16 -translate-y-1/2 rounded-xl bg-white/5 border border-white/10 z-0" />
      
      <div className="relative z-20 border-b border-white/5 bg-black/20 px-5 py-3 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 group-hover:text-[#ff385c] transition-colors">{title}</p>
      </div>

      <div className="relative h-48 px-4 py-6 z-20">
        <motion.div
          key={`${selectedIndex}-${spinning}`}
          initial={{ y: spinning ? -120 : -64, opacity: 0.5, filter: "blur(4px)" }}
          animate={{ y: -64, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.5 }}
          className="space-y-4"
        >
          {visibleItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className={`flex h-16 items-center justify-center rounded-xl px-4 text-center text-lg font-black transition-all ${
                index === 1 ? "text-white scale-110" : "text-neutral-700 scale-90"
              }`}
            >
              <span className="truncate drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default function SlotMachine2() {
  const [restaurants, setRestaurants] = useState<SpinnerRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState({ prize: 0, cuisine: 0, restaurant: 0 });
  const [showWinner, setShowWinner] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .limit(10);

      const pool = (data?.length ? data : MOCK_RESTAURANTS) as SpinnerRestaurant[];
      setRestaurants(pool.map((r, i) => ({
        ...r,
        accent: accents[i % accents.length],
      })));
    } catch {
      setRestaurants(MOCK_RESTAURANTS.map((r, i) => ({
        ...r,
        accent: accents[i % accents.length],
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const cuisines = useMemo(() => restaurants.map((r) => getCuisineLabel(r)), [restaurants]);
  const names = useMemo(() => restaurants.map(r => r.name), [restaurants]);
  const winner = restaurants[selected.restaurant % (restaurants.length || 1)] || restaurants[0];
  const winPrize = prizePool[selected.prize % prizePool.length];

  function spin() {
    if (spinning || restaurants.length === 0) return;

    haptics.heavy();
    setSpinning(true);
    setShowWinner(false);
    sounds?.play('start', 0.5);

    const totalSteps = 20;
    let step = 0;
    
    const executeStep = () => {
      step += 1;
      sounds?.play('tick', 0.1);

      setSelected({
        prize: pickRandomIndex(prizePool.length),
        cuisine: pickRandomIndex(cuisines.length),
        restaurant: pickRandomIndex(restaurants.length),
      });

      if (step < totalSteps) {
        const nextDelay = 50 + (Math.pow(step / totalSteps, 2) * 250);
        setTimeout(executeStep, nextDelay);
      } else {
        const finalRestIdx = pickRandomIndex(restaurants.length);
        const finalPrizeIdx = pickRandomIndex(prizePool.length);
        
        setSelected({
          prize: finalPrizeIdx,
          cuisine: finalRestIdx,
          restaurant: finalRestIdx,
        });

        setTimeout(() => {
          recordGamePlayed(50, true);
          haptics.success();
          sounds?.play('reveal', 0.8);
          setSpinning(false);
          setShowWinner(true);
        }, 400);
      }
    };

    setTimeout(executeStep, 50);
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 w-full gap-4">
      <Loader2 className="animate-spin text-[#FF385C]" size={48} />
      <p className="text-neutral-500 font-black uppercase tracking-widest text-xs">Calibrating Slots...</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="text-center mb-12">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border-2 border-neutral-900 bg-neutral-950 px-6 py-2.5 text-sm font-black text-white shadow-2xl">
          <Coins className="h-5 w-5 text-yellow-400" />
          <span className="tracking-[0.1em] uppercase">Makanjom Rewards Spin</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-neutral-900 sm:text-7xl">
          Vegas Edition.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg font-medium text-neutral-500 leading-relaxed">
          The stakes are higher. Spin the secondary reels to win exclusive dining vouchers and loyalty multipliers.
        </p>
      </header>

      <div className="relative mb-12">
        {/* Glow Effects */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#ff385c]/20 to-purple-500/20 blur-3xl opacity-50 -z-10" />
        
        <section className="grid gap-6 rounded-[3.5rem] border-8 border-neutral-900 bg-neutral-950 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.4)] md:grid-cols-3">
          <Reel title="Special Reward" items={prizePool} selectedIndex={selected.prize} spinning={spinning} />
          <Reel title="Cuisine Type" items={cuisines} selectedIndex={selected.cuisine} spinning={spinning} />
          <Reel title="Venue Partner" items={names} selectedIndex={selected.restaurant} spinning={spinning} />
        </section>

        {/* Big Spin Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={spin}
            disabled={spinning}
            className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-neutral-950 p-1 shadow-2xl transition hover:scale-110 active:scale-90 disabled:opacity-50"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-[#ff385c] to-purple-600 rounded-full blur-xl opacity-40 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-neutral-900 border-4 border-white/10 group-hover:border-[#ff385c]/40">
              <Shuffle className={`h-8 w-8 text-white ${spinning ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`} />
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="max-w-4xl mx-auto"
          >
            <div className={`overflow-hidden rounded-[3rem] border-4 border-neutral-950 bg-gradient-to-br ${winner.accent} p-10 shadow-2xl relative`}>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Trophy size={120} className="text-black" />
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[2.5rem] bg-white text-5xl shadow-2xl ring-4 ring-neutral-950">
                  {winner.emoji}
                </div>
                
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-neutral-950 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    <Sparkles size={12} className="text-[#ff385c]" /> Big Win Unlocked
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-neutral-950 tracking-tighter mb-2">
                    {winPrize}
                  </h2>
                  <p className="text-xl font-bold text-neutral-800/60 mb-8 uppercase tracking-tight">
                    at {winner.name}
                  </p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <Link
                      href={`/restaurants/${winner.id}`}
                      className="inline-flex items-center gap-3 rounded-2xl bg-neutral-950 px-8 py-4 text-sm font-black text-white hover:bg-black shadow-xl active:scale-95"
                    >
                      Redeem Reward
                    </Link>
                    <button
                      onClick={spin}
                      className="inline-flex items-center gap-3 rounded-2xl bg-white/40 backdrop-blur-md border-2 border-neutral-950/5 px-8 py-4 text-sm font-black text-neutral-950 hover:bg-white/60 active:scale-95"
                    >
                      Spin Again
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 border-t-2 border-neutral-950/5 pt-8">
                 <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Rating</p>
                    <p className="text-xl font-black text-neutral-950">{winner.rating} <Star size={14} className="inline fill-current" /></p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Price</p>
                    <p className="text-xl font-black text-neutral-950">{winner.price_range}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Vibe</p>
                    <p className="text-xl font-black text-neutral-950">{winner.vibe}</p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
