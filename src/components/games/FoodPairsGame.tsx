'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

const PAIRS = [
  { dish: 'Assam Laksa',    emoji: '🍜', state: 'Penang'            },
  { dish: 'Nasi Kerabu',    emoji: '🍚', state: 'Kelantan'          },
  { dish: 'Rendang',        emoji: '🍖', state: 'Negeri Sembilan'   },
  { dish: 'Laksa Johor',    emoji: '🌊', state: 'Johor'             },
  { dish: 'Manuk Pansuh',   emoji: '🎋', state: 'Sarawak'           },
  { dish: 'Hinava',         emoji: '🐟', state: 'Sabah'             },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function FoodPairsGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [states]            = useState(() => shuffle(PAIRS.map(p => p.state)));
  const [selectedDish, setSelectedDish] = useState<number | null>(null);
  const [matched, setMatched]           = useState<Set<number>>(new Set());
  const [wrong, setWrong]               = useState<{ dish: number; state: string } | null>(null);
  const [score, setScore]               = useState(0);
  const [done, setDone]                 = useState(false);

  const pickDish = (idx: number) => {
    if (matched.has(idx) || done) return;
    setSelectedDish(idx);
    setWrong(null);
    haptics.light();
  };

  const pickState = (state: string) => {
    if (selectedDish === null || done) return;
    const correct = PAIRS[selectedDish].state === state;
    if (correct) {
      sounds?.play('tick', 0.3);
      haptics.success();
      const newMatched = new Set(matched);
      newMatched.add(selectedDish);
      setMatched(newMatched);
      setSelectedDish(null);
      const newScore = score + 20;
      setScore(newScore);
      if (newMatched.size === PAIRS.length) {
        if (isLoggedIn) recordGamePlayed(newScore);
        onPointsEarned?.(newScore);
        sounds?.play('reveal', 0.5);
        setDone(true);
      }
    } else {
      haptics.light();
      setWrong({ dish: selectedDish, state });
      setTimeout(() => { setWrong(null); setSelectedDish(null); }, 800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
        <span>{matched.size} / {PAIRS.length} matched</span>
        <span className="text-[#ff385c]">{score} pts</span>
      </div>
      <p className="text-sm text-neutral-500 text-center">Match each dish to its Malaysian state of origin</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left: dishes */}
        <div className="space-y-2">
          {PAIRS.map((pair, i) => {
            const isMatched  = matched.has(i);
            const isSelected = selectedDish === i;
            const isWrong    = wrong?.dish === i;
            return (
              <motion.button key={pair.dish} onClick={() => pickDish(i)} whileTap={{ scale: 0.97 }}
                className={`w-full rounded-2xl border-2 p-3 text-left transition
                  ${isMatched  ? 'border-emerald-400 bg-emerald-50'
                  : isWrong    ? 'border-red-300 bg-red-50'
                  : isSelected ? 'border-[#ff385c] bg-rose-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-400'}`}
              >
                <span className="text-xl">{pair.emoji}</span>
                <p className={`text-xs font-bold mt-1 leading-tight ${isMatched ? 'text-emerald-700' : 'text-neutral-800'}`}>{pair.dish}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Right: states */}
        <div className="space-y-2">
          {states.map((state) => {
            const isMatched = PAIRS.some((p, i) => p.state === state && matched.has(i));
            const isWrong   = wrong?.state === state;
            return (
              <motion.button key={state} onClick={() => pickState(state)} whileTap={{ scale: 0.97 }}
                className={`w-full rounded-2xl border-2 p-3 text-left transition min-h-[64px]
                  ${isMatched  ? 'border-emerald-400 bg-emerald-50'
                  : isWrong    ? 'border-red-300 bg-red-50'
                  : selectedDish !== null ? 'border-neutral-300 bg-white hover:border-[#ff385c] hover:bg-rose-50'
                  : 'border-neutral-200 bg-white opacity-60'}`}
              >
                <p className={`text-xs font-bold leading-tight ${isMatched ? 'text-emerald-700' : 'text-neutral-800'}`}>{state}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedDish !== null && !done && (
        <p className="text-center text-xs font-semibold text-[#ff385c] animate-pulse">
          Now pick a state for <strong>{PAIRS[selectedDish].dish}</strong>
        </p>
      )}
    </div>
  );
}
