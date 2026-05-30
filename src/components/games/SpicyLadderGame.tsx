'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

// Ordered mildest → spiciest (index = correct rank 0–4)
const DISHES_ORDERED = [
  { name: 'Teh Tarik',     emoji: '🧋', hint: 'Pulled milk tea' },
  { name: 'Nasi Lemak',    emoji: '🍛', hint: 'Coconut rice & sambal' },
  { name: 'Curry Mee',     emoji: '🍜', hint: 'Coconut curry broth' },
  { name: 'Assam Laksa',   emoji: '🌶️', hint: 'Sour & spicy fish broth' },
  { name: 'Cili Padi Sambal', emoji: '🔥', hint: 'Bird\'s eye chili paste' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SpicyLadderGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [dishes] = useState(() => shuffle(DISHES_ORDERED.map((d, i) => ({ ...d, correctRank: i }))));
  const [order, setOrder]   = useState<number[]>([]); // correctRank values in picked order
  const [done, setDone]     = useState(false);
  const [result, setResult] = useState<{ pts: number; correct: number } | null>(null);

  const pick = (correctRank: number) => {
    if (order.includes(correctRank) || done) return;
    haptics.light();
    sounds?.play('tick', 0.2);
    const next = [...order, correctRank];
    setOrder(next);
    if (next.length === DISHES_ORDERED.length) {
      // Score: 15 pts per dish in exactly correct position
      const correct = next.filter((rank, idx) => rank === idx).length;
      const pts = correct * 15;
      setResult({ pts, correct });
      if (isLoggedIn) recordGamePlayed(pts);
      onPointsEarned?.(pts);
      sounds?.play('reveal', 0.5);
      setDone(true);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">Rank mildest → spiciest</p>
        <p className="text-sm text-neutral-500">Tap the dishes in order from least to most spicy</p>

        <div className="mt-5 space-y-3">
          {dishes.map((dish) => {
            const pickedPos = order.indexOf(dish.correctRank);
            const isPicked  = pickedPos !== -1;
            const isCorrect = done && pickedPos === dish.correctRank;
            const isWrong   = done && isPicked && pickedPos !== dish.correctRank;
            return (
              <motion.button
                key={dish.name}
                onClick={() => pick(dish.correctRank)}
                disabled={isPicked}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition
                  ${isCorrect ? 'border-emerald-400 bg-emerald-50'
                  : isWrong   ? 'border-red-300 bg-red-50'
                  : isPicked  ? 'border-neutral-300 bg-neutral-50 opacity-70'
                  : 'border-neutral-200 bg-white hover:border-neutral-400 active:scale-95'}`}
              >
                <span className="text-3xl">{dish.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${isPicked ? 'text-neutral-500' : 'text-neutral-950'}`}>{dish.name}</p>
                  <p className="text-xs text-neutral-400">{dish.hint}</p>
                </div>
                {isPicked && (
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white
                    ${isCorrect ? 'bg-emerald-500' : isWrong ? 'bg-red-400' : 'bg-neutral-400'}`}>
                    {pickedPos + 1}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {done && result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-neutral-200 bg-neutral-50 p-5 text-center"
        >
          <p className="text-2xl font-black text-neutral-950">{result.correct}/5 correct</p>
          <p className="text-sm text-neutral-500 mt-1">Correct order: Teh Tarik → Nasi Lemak → Curry Mee → Assam Laksa → Cili Padi Sambal</p>
        </motion.div>
      )}

      {!done && (
        <p className="text-center text-xs text-neutral-400">
          {order.length} / {DISHES_ORDERED.length} ranked
        </p>
      )}
    </div>
  );
}
