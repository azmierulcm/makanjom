'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

const WORDS = [
  { word: 'LAKSA',   emoji: '🍜', options: ['LAKSA', 'SATAY', 'ROJAK', 'KUIH']    },
  { word: 'SATAY',   emoji: '🍡', options: ['SAMBAL', 'SATAY', 'CENDOL', 'RENDANG'] },
  { word: 'ROJAK',   emoji: '🥗', options: ['ROJAK', 'LAKSA', 'KEROPOK', 'SATAY']  },
  { word: 'RENDANG', emoji: '🍖', options: ['RENDING', 'RENDANG', 'SAMBAL', 'LEMAK'] },
  { word: 'CENDOL',  emoji: '🍧', options: ['CENDOL', 'KETUPAT', 'ROJAK', 'LEMANG'] },
];

function scramble(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? scramble(word) : result;
}

export default function FoodScrambleGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [idx, setIdx]       = useState(0);
  const [score, setScore]   = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone]     = useState(false);

  const item = WORDS[idx];
  const scrambled = useMemo(() => scramble(item.word), [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    haptics.light();
    const correct = opt === item.word;
    if (correct) { sounds?.play('tick', 0.3); setScore(s => s + 25); }

    setTimeout(() => {
      if (idx + 1 >= WORDS.length) {
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

  if (done) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
        <span>{idx + 1} / {WORDS.length}</span>
        <span className="text-[#ff385c]">{score} pts</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 text-center shadow-sm"
        >
          <div className="text-6xl mb-2">{item.emoji}</div>
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">Unscramble this food</p>
          <div className="flex justify-center gap-2 flex-wrap mb-2">
            {scrambled.split('').map((ch, i) => (
              <span key={i} className="inline-flex h-11 w-9 items-center justify-center rounded-xl bg-neutral-100 text-lg font-black text-neutral-950">
                {ch}
              </span>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {item.options.map(opt => {
              const isCorrect = opt === item.word;
              const isPicked  = opt === picked;
              let cls = 'rounded-2xl border-2 py-3.5 text-sm font-black tracking-wide transition active:scale-95 ';
              if (picked === null)  cls += 'border-neutral-200 text-neutral-700 hover:border-neutral-400';
              else if (isCorrect)   cls += 'border-emerald-400 bg-emerald-50 text-emerald-700';
              else if (isPicked)    cls += 'border-red-300 bg-red-50 text-red-600';
              else                  cls += 'border-neutral-100 text-neutral-300';
              return <button key={opt} onClick={() => pick(opt)} disabled={picked !== null} className={cls}>{opt}</button>;
            })}
          </div>
          {picked !== null && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`mt-4 text-sm font-bold ${picked === item.word ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {picked === item.word ? '🎉 Correct! +25 pts' : `❌ It was ${item.word}`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-1.5 justify-center">
        {WORDS.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? 'w-5 bg-[#ff385c]' : i === idx ? 'w-5 bg-neutral-950' : 'w-1.5 bg-neutral-200'}`} />)}
      </div>
    </div>
  );
}
