"use client";

import React, { useMemo, useState } from "react";
import { RotateCcw, Shuffle, Sparkles, Utensils } from "lucide-react";

const reels = [
  {
    label: "Craving",
    options: ["Something new", "Comfort food", "Quick bite", "Family-friendly", "Spicy", "Dessert"],
  },
  {
    label: "Cuisine",
    options: ["Malay", "Mamak", "Thai", "Japanese", "Western", "Noodles"],
  },
  {
    label: "Winner",
    options: ["Warung Pak Din", "Village Park", "Penang Road Cendol", "Line Clear", "Sushi Zanmai", "Burger Lab"],
  },
];

function randomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function SlotMachine2() {
  const initialPick = useMemo(() => reels.map((reel) => randomItem(reel.options)), []);
  const [selected, setSelected] = useState(initialPick);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    let rounds = 0;
    const interval = window.setInterval(() => {
      setSelected(reels.map((reel) => randomItem(reel.options)));
      rounds += 1;

      if (rounds > 11) {
        window.clearInterval(interval);
        setSelected(reels.map((reel) => randomItem(reel.options)));
        setIsSpinning(false);
      }
    }, 80);
  };

  const reset = () => setSelected(reels.map((reel) => reel.options[0]));

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-3 py-3 font-sans text-neutral-950 flex items-center justify-center">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[390px] flex-col rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex-1 space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-neutral-600 shadow-sm">
              <Sparkles className="h-3 w-3 shrink-0 text-[#ff385c]" />
              <span className="truncate">Dinner picker</span>
            </div>

            <button
              onClick={reset}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm active:scale-95"
              aria-label="Reset reels"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-[#faf9f7] p-4">
            <h1 className="text-[2.45rem] font-black leading-[0.9] tracking-[-0.075em] text-neutral-950">
              Spin your next bite.
            </h1>
            <p className="mt-3 max-w-[18rem] text-[13px] leading-5 text-neutral-500">
              Three reels, one winner. Tap once and let dinner choose itself.
            </p>
          </div>

          <div className="space-y-2 rounded-[1.5rem] border border-neutral-200 bg-[#fbfaf8] p-2">
            {reels.map((reel, reelIndex) => {
              const currentIndex = reel.options.indexOf(selected[reelIndex]);
              const above = reel.options[(currentIndex - 1 + reel.options.length) % reel.options.length];
              const below = reel.options[(currentIndex + 1) % reel.options.length];

              return (
                <div
                  key={reel.label}
                  className="grid grid-cols-[5.1rem_1fr] items-stretch overflow-hidden rounded-[1.1rem] border border-neutral-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.045)]"
                >
                  <div className="flex flex-col justify-between border-r border-neutral-100 bg-white px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-neutral-400">
                      {reel.label}
                    </p>
                    {reelIndex === 2 ? (
                      <div className="mt-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-[#ff385c]">
                        <Utensils className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <p className="mt-3 text-[10px] font-semibold text-neutral-300">reel {reelIndex + 1}</p>
                    )}
                  </div>

                  <div className="relative px-2 py-2">
                    <div className="pointer-events-none absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white shadow-[0_8px_16px_rgba(15,23,42,0.06)]" />

                    <div className="relative grid h-[5.9rem] grid-rows-3 items-center text-center">
                      <p className="truncate px-3 text-xs font-semibold text-neutral-300">{above}</p>
                      <p
                        className={`truncate px-3 text-[15px] font-black tracking-[-0.02em] text-neutral-950 transition-all duration-150 ${
                          isSpinning ? "scale-95 blur-[1px]" : "scale-100 blur-0"
                        }`}
                      >
                        {selected[reelIndex]}
                      </p>
                      <p className="truncate px-3 text-xs font-semibold text-neutral-300">{below}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-[1.35rem] bg-rose-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Tonight says</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-black tracking-[-0.04em] text-neutral-950">{selected[2]}</p>
                <p className="truncate text-xs font-medium text-neutral-500">
                  {selected[0]} · {selected[1]}
                </p>
              </div>
              <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#ff385c] shadow-sm min-[360px]:grid">
                <Utensils className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-neutral-100 bg-white/90 p-3 backdrop-blur-xl">
          <button
            onClick={spin}
            disabled={isSpinning}
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-[#ff385c] px-5 py-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,56,92,0.3)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Shuffle className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
            {isSpinning ? "Spinning..." : "Choose for me"}
          </button>
        </div>
      </section>
    </main>
  );
}
