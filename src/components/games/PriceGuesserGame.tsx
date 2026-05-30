'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from 'lucide-react';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

const DISHES = [
  { name: 'Nasi Lemak',       emoji: '🍛', answer: 8,   options: [5, 8, 15, 25]    },
  { name: 'Teh Tarik',        emoji: '🧋', answer: 3,   options: [1, 3, 6, 10]     },
  { name: 'Char Kuey Teow',   emoji: '🍜', answer: 10,  options: [6, 10, 18, 28]   },
  { name: 'Banana Leaf Rice', emoji: '🍌', answer: 14,  options: [8, 14, 22, 35]   },
  { name: 'A5 Wagyu Set',     emoji: '🥩', answer: 180, options: [80, 120, 180, 280] },
];

export default function PriceGuesserGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [idx, setIdx]           = useState(0);
  const [score, setScore]       = useState(0);
  const [picked, setPicked]     = useState<number | null>(null);
  const [done, setDone]         = useState(false);

  const dish = DISHES[idx];

  const pick = (price: number) => {
    if (picked !== null) return;
    setPicked(price);
    haptics.light();
    const correct = price === dish.answer;
    if (correct) { sounds?.play('tick', 0.3); setScore(s => s + 25); }
    else sounds?.play('tick', 0.1);

    setTimeout(() => {
      if (idx + 1 >= DISHES.length) {
        const total = score + (correct ? 25 : 0);
        if (isLoggedIn) recordGamePlayed(total);
        onPointsEarned?.(total);
        sounds?.play('reveal', 0.5);
        setDone(true);
      } else {
        setIdx(i => i + 1);
        setPicked(null);
      }
    }, 1100);
  };

  if (done) return null; // parent shows post-game card

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
        <span>{idx + 1} / {DISHES.length}</span>
        <span className="text-[#ff385c]">{score} pts</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 text-center shadow-sm"
        >
          <div className="text-7xl">{dish.emoji}</div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-neutral-950">{dish.name}</h2>
          <p className="mt-1 text-sm text-neutral-400">What&apos;s the typical price per person?</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {dish.options.map(price => {
              const isCorrect = price === dish.answer;
              const isPicked  = price === picked;
              let cls = 'rounded-2xl border-2 py-3.5 text-base font-black transition active:scale-95 ';
              if (picked === null)       cls += 'border-neutral-200 text-neutral-700 hover:border-neutral-400';
              else if (isCorrect)        cls += 'border-emerald-400 bg-emerald-50 text-emerald-700';
              else if (isPicked)         cls += 'border-red-300 bg-red-50 text-red-600';
              else                       cls += 'border-neutral-100 text-neutral-300';
              return (
                <button key={price} onClick={() => pick(price)} disabled={picked !== null} className={cls}>
                  RM {price}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`mt-4 text-sm font-bold ${picked === dish.answer ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {picked === dish.answer ? '🎉 Correct! +25 pts' : `❌ It was RM ${dish.answer}`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-1.5 justify-center">
        {DISHES.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? 'w-5 bg-[#ff385c]' : i === idx ? 'w-5 bg-neutral-950' : 'w-1.5 bg-neutral-200'}`} />)}
      </div>
    </div>
  );
}
