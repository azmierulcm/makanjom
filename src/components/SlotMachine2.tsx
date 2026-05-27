"use client";

import React, { useMemo, useRef, useState, useEffect, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  Clock3,
  Shuffle,
  Sparkles,
  Volume2,
  VolumeX,
  Utensils,
  Trophy,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import type { Restaurant } from '@/lib/types';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import { getCuisineLabel } from '@/components/RestaurantCard';
import Link from 'next/link';

interface RouletteRestaurant extends Restaurant {
  reason?: string;
}

const cravings = ["Comfort", "Something new", "Family-friendly", "Fast", "Spicy", "Chill"];
const vibes = ["Low effort", "Crowd pleaser", "Nearby", "Treat night", "No queue", "Cosy"];

function classNames(...items: (string | boolean | undefined)[]) {
  return items.filter(Boolean).join(" ");
}

interface PlayOptions {
  frequency?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  start?: number;
  slideTo?: number;
  gap?: number;
}

function useSlotSounds() {
  const audioRef = useRef<AudioContext | null>(null);

  const getAudio = () => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      audioRef.current = new AudioContextClass();
    }
    return audioRef.current;
  };

  const playTone = ({
    frequency = 520,
    duration = 0.06,
    type = "sine" as OscillatorType,
    gain = 0.075,
    start = 0,
    slideTo,
  }: {
    frequency?: number;
    duration?: number;
    type?: OscillatorType;
    gain?: number;
    start?: number;
    slideTo?: number;
  }) => {
    const audio = getAudio();
    if (!audio) return;

    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    const filter = audio.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime + start);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + start + duration);
    }

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4200, audio.currentTime + start);
    filter.Q.setValueAtTime(0.7, audio.currentTime + start);

    volume.gain.setValueAtTime(0.0001, audio.currentTime + start);
    volume.gain.exponentialRampToValueAtTime(gain, audio.currentTime + start + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + duration);

    oscillator.connect(filter);
    filter.connect(volume);
    volume.connect(audio.destination);
    oscillator.start(audio.currentTime + start);
    oscillator.stop(audio.currentTime + start + duration + 0.03);
  };

  const playNoise = ({ duration = 0.035, gain = 0.04, start = 0 }) => {
    const audio = getAudio();
    if (!audio) return;

    const bufferSize = audio.sampleRate * duration;
    const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const volume = audio.createGain();

    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, audio.currentTime + start);
    filter.Q.setValueAtTime(4, audio.currentTime + start);

    volume.gain.setValueAtTime(gain, audio.currentTime + start);
    volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + duration);

    source.connect(filter);
    filter.connect(volume);
    volume.connect(audio.destination);
    source.start(audio.currentTime + start);
    source.stop(audio.currentTime + start + duration);
  };

  const playChord = (notes: number[], options: PlayOptions = {}) => {
    notes.forEach((note) => {
      playTone({
        frequency: note,
        duration: options.duration ?? 0.16,
        type: options.type ?? "sine",
        gain: options.gain ?? 0.04,
        start: options.start ?? 0,
        slideTo: options.slideTo,
      });
    });
  };

  const playArp = (notes: number[], options: PlayOptions = {}) => {
    notes.forEach((note, index) => {
      playTone({
        frequency: note,
        duration: options.duration ?? 0.07,
        type: options.type ?? "triangle",
        gain: options.gain ?? 0.052,
        start: (options.start ?? 0) + index * (options.gap ?? 0.055),
        slideTo: options.slideTo ? note * options.slideTo : undefined,
      });
    });
  };

  const tick = () => {
    const notes = [587.33, 659.25, 739.99, 880, 987.77];
    const note = notes[Math.floor(Math.random() * notes.length)];
    playTone({ frequency: note, duration: 0.032, type: "triangle", gain: 0.034, slideTo: note * 1.06 });
    playTone({ frequency: note * 2, duration: 0.02, type: "sine", gain: 0.019, start: 0.012 });
  };

  const win = () => {
    playNoise({ duration: 0.03, gain: 0.038 });
    playTone({ frequency: 220, duration: 0.045, type: "triangle", gain: 0.034, slideTo: 330 });
    playArp([659.25, 783.99, 987.77], { start: 0.09, duration: 0.075, gap: 0.07, gain: 0.06, type: "sine", slideTo: 1.02 });
    setTimeout(() => {
      playChord([1046.5, 1318.51, 1567.98], { duration: 0.22, gain: 0.034, type: "triangle" });
      playTone({ frequency: 2093, duration: 0.16, type: "sine", gain: 0.03, start: 0.02, slideTo: 2349.32 });
    }, 330);
  };

  const softClick = () => {
    playNoise({ duration: 0.018, gain: 0.024 });
    playTone({ frequency: 493.88, duration: 0.038, type: "triangle", gain: 0.038, slideTo: 659.25, start: 0.012 });
    playTone({ frequency: 987.77, duration: 0.024, type: "sine", gain: 0.019, start: 0.038 });
  };

  return { tick, win, softClick };
}

function Reel({ label, items, value, spinning, delay = 0 }: { label: string, items: string[], value: string, spinning: boolean, delay?: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (spinning) {
      interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * items.length);
        setDisplayValue(items[randomIndex] || '...');
      }, 100);
    } else {
      setDisplayValue(value);
    }
    return () => clearInterval(interval);
  }, [spinning, value, items]);

  return (
    <div className="rounded-[1.45rem] border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">{label}</p>
        <div className={classNames("h-2 w-2 rounded-full", spinning ? "animate-pulse bg-rose-500" : "bg-emerald-400")} />
      </div>

      <div className="relative h-16 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 shadow-inner">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={spinning ? `${label}-spin-${displayValue}` : value}
            initial={{ y: spinning ? -24 : 16, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 22, opacity: 0, filter: "blur(6px)" }}
            transition={{ delay, type: "spring", stiffness: 460, damping: 32 }}
            className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-extrabold text-zinc-950"
          >
            {displayValue}
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>, label: string, value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-sm font-black text-zinc-950">{value}</p>
    </div>
  );
}

export default function SlotMachine2() {
  const [restaurantPool, setRestaurantPool] = useState<RouletteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState<RouletteRestaurant | null>(null);
  const [craving, setCraving] = useState("Something new");
  const [cuisine, setCuisine] = useState("Mamak");
  const [vibe, setVibe] = useState("Nearby");
  const [spinning, setSpinning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [spinCount, setSpinCount] = useState(0);
  const { tick, win, softClick } = useSlotSounds();

  const fetchPool = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      const pool = (data?.length ? data : MOCK_RESTAURANTS) as RouletteRestaurant[];
      const mapped = pool.map(r => ({
        ...r,
        distance: r.distance || `${(Math.random() * 15 + 2).toFixed(0)} min`,
        reason: r.description || "A top-tier pick for your dinner tonight.",
      }));
      setRestaurantPool(mapped);
      setWinner(mapped[Math.floor(Math.random() * mapped.length)]);
    } catch {
      const mapped = MOCK_RESTAURANTS.map(r => ({
        ...r,
        distance: `${(Math.random() * 15 + 2).toFixed(0)} min`,
        reason: r.description || "Iconic and comforting.",
      }));
      setRestaurantPool(mapped);
      setWinner(mapped[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  const cuisinesList = useMemo(() => restaurantPool.map(r => getCuisineLabel(r)), [restaurantPool]);
  const winnerIndex = useMemo(() => restaurantPool.findIndex((item) => item.id === winner?.id), [winner, restaurantPool]);

  const spin = () => {
    if (spinning || restaurantPool.length === 0) return;
    setSpinning(true);
    setSpinCount((current) => current + 1);

    const totalTicks = 18;
    for (let i = 0; i < totalTicks; i++) {
      setTimeout(() => {
        const poolIndex = Math.floor(Math.random() * restaurantPool.length);
        const next = restaurantPool[poolIndex];
        setWinner(next);
        setCraving(cravings[Math.floor(Math.random() * cravings.length)]);
        setCuisine(getCuisineLabel(next));
        setVibe(vibes[Math.floor(Math.random() * vibes.length)]);
        if (soundOn) tick();
      }, i * 70 + i * i * 2.2);
    }

    setTimeout(() => {
      const final = restaurantPool[Math.floor(Math.random() * restaurantPool.length)];
      setWinner(final);
      setCraving(final.rating > 4.6 ? "Comfort" : "Something new");
      setCuisine(getCuisineLabel(final));
      setVibe(vibes[Math.floor(Math.random() * vibes.length)]);
      setSpinning(false);
      if (soundOn) win();
    }, 1850);
  };

  const nudge = () => {
    if (restaurantPool.length === 0) return;
    const nextIndex = (winnerIndex + 1) % restaurantPool.length;
    const next = restaurantPool[nextIndex];
    setWinner(next);
    setCuisine(getCuisineLabel(next));
    setCraving(cravings[pickRandomIndex(cravings.length)]);
    if (soundOn) softClick();
  };

  function pickRandomIndex(length: number) {
    return Math.floor(Math.random() * length);
  }

  if (loading && restaurantPool.length === 0) return (
    <div className="flex flex-col items-center justify-center p-32 w-full gap-4 bg-[#f7f5f2] min-h-screen">
      <Loader2 className="animate-spin text-[#FF385C]" size={40} />
      <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Warming the reels...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-4 py-5 font-[Inter,ui-sans-serif,system-ui] text-zinc-950 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="rounded-[2rem] border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600">
              <Sparkles className="h-3.5 w-3.5" /> Dinner roulette
            </div>
            <button
              onClick={() => setSoundOn((current) => !current)}
              className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm transition active:scale-95"
              aria-label="Toggle sound"
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[2.65rem] font-black leading-[0.9] tracking-[-0.07em] sm:text-5xl">
                Spin your<br />next bite.
              </h1>
              <p className="mt-3 max-w-[19rem] text-sm leading-6 text-zinc-500">
                Three tiny reels, one dinner answer. Less group chat fog, more makan.
              </p>
            </div>
            <motion.div
              animate={spinning ? { rotate: [0, -8, 8, -8, 0], scale: [1, 1.08, 1] } : { rotate: 0 }}
              transition={{ repeat: spinning ? Infinity : 0, duration: 0.55 }}
              className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.4rem] bg-zinc-950 text-3xl shadow-lg"
            >
              {winner?.emoji || '🍽️'}
            </motion.div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-2.5">
          <Reel label="Craving" items={cravings} value={craving} spinning={spinning} />
          <div className="grid grid-cols-2 gap-2.5">
            <Reel label="Cuisine" items={cuisinesList} value={cuisine} spinning={spinning} delay={0.04} />
            <Reel label="Vibe" items={vibes} value={vibe} spinning={spinning} delay={0.08} />
          </div>
        </section>

        <AnimatePresence mode="wait">
          {winner && (
            <motion.section
              key={winner.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4 shadow-sm"
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-200/35 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-emerald-200/45 blur-2xl" />

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-zinc-100">
                    {winner.emoji}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.26em] text-emerald-700">
                      <Trophy className="h-3.5 w-3.5" /> Tonight's pick
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-tight tracking-[-0.05em]">{winner.name}</h2>
                  </div>
                </div>
              </div>

              <p className="relative mt-3 text-sm leading-6 text-zinc-600 line-clamp-2">{winner.reason}</p>

              <div className="relative mt-4 grid grid-cols-3 gap-2">
                <MiniStat icon={Clock3} label="Drive" value={winner.distance || '10 min'} />
                <MiniStat icon={Star} label="Rating" value={winner.rating} />
                <MiniStat icon={Utensils} label="Price" value={winner.price_range} />
              </div>

              <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={spin}
                  disabled={spinning}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,56,92,0.28)] transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Shuffle className={classNames("h-4 w-4", spinning && "animate-spin")} />
                  {spinning ? "Choosing..." : "Choose for me"}
                </motion.button>
                <Link
                  href={`/restaurants/${winner.id}`}
                  className="grid h-14 w-14 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm transition active:scale-95"
                  aria-label="View restaurant details"
                >
                  <Utensils className="h-4 w-4" />
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Live options</p>
              <h3 className="mt-1 text-lg font-black tracking-[-0.03em]">Restaurant pool</h3>
            </div>
            <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-500">{restaurantPool.length}</div>
          </div>

          <div className="space-y-2">
            {restaurantPool.map((item, index) => {
              const active = item.id === winner?.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setWinner(item);
                    setCuisine(getCuisineLabel(item));
                    setCraving(item.rating > 4.6 ? "Comfort" : "Something new");
                    if (soundOn) softClick();
                  }}
                  className={classNames(
                    "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition active:scale-[0.99]",
                    active ? "border-rose-200 bg-rose-50" : "border-zinc-100 bg-white hover:bg-zinc-50"
                  )}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-xl">{item.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-zinc-950">{item.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="h-3 w-3" /> {getCuisineLabel(item)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-600">{item.distance}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-zinc-400">#{index + 1}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex justify-center gap-4 py-2">
            <button
              onClick={nudge}
              disabled={spinning}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <RotateCcw size={12} /> Nudge destiny
            </button>
        </div>

        <p className="pb-3 text-center text-xs text-zinc-400">
          Spins today: <span className="font-black text-zinc-600">{spinCount}</span> · Linked to your Supabase kitchen.
        </p>
      </div>
    </main>
  );
}
