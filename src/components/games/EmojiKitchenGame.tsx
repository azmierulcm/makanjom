'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

const ROUNDS = [
  { clues: ['🍚', '🥥', '🥜'], answer: 'Nasi Lemak',       options: ['Nasi Lemak', 'Nasi Goreng', 'Nasi Campur', 'Nasi Kerabu'] },
  { clues: ['🍜', '🌶️', '🍤'], answer: 'Assam Laksa',      options: ['Mee Goreng', 'Assam Laksa', 'Curry Mee', 'Char Kuey Teow'] },
  { clues: ['🍡', '🥜', '🔥'], answer: 'Satay',             options: ['Sate Kajang', 'Satay', 'Keropok Lekor', 'Otak-Otak'] },
  { clues: ['🧊', '🫙', '🌿'], answer: 'Cendol',            options: ['Ice Kacang', 'Cendol', 'Ais Batu Campur', 'Bubur Cha Cha'] },
  { clues: ['🥩', '🥛', '🌿'], answer: 'Rendang',           options: ['Rendang', 'Kari Ayam', 'Gulai', 'Masak Lemak'] },
];

export default function EmojiKitchenGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [idx, setIdx]       = useState(0);
  const [score, setScore]   = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone]     = useState(false);

  const round = ROUNDS[idx];

  const pick = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    haptics.light();
    const correct = opt === round.answer;
    if (correct) { sounds?.play('tick', 0.3); setScore(s => s + 30); }

    setTimeout(() => {
      if (idx + 1 >= ROUNDS.length) {
        const total = score + (correct ? 30 : 0);
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
        <span>{idx + 1} / {ROUNDS.length}</span>
        <span className="text-[#ff385c]">{score} pts</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 text-center shadow-sm"
        >
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">What dish do these clues describe?</p>
          <div className="flex justify-center gap-4 text-5xl mb-6">
            {round.clues.map((e, i) => <span key={i}>{e}</span>)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {round.options.map(opt => {
              const isCorrect = opt === round.answer;
              const isPicked  = opt === picked;
              let cls = 'rounded-2xl border-2 py-3.5 text-sm font-bold transition active:scale-95 ';
              if (picked === null)  cls += 'border-neutral-200 text-neutral-700 hover:border-neutral-400';
              else if (isCorrect)   cls += 'border-emerald-400 bg-emerald-50 text-emerald-700';
              else if (isPicked)    cls += 'border-red-300 bg-red-50 text-red-600';
              else                  cls += 'border-neutral-100 text-neutral-300';
              return <button key={opt} onClick={() => pick(opt)} disabled={picked !== null} className={cls}>{opt}</button>;
            })}
          </div>
          {picked !== null && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`mt-4 text-sm font-bold ${picked === round.answer ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {picked === round.answer ? '🎉 Correct! +30 pts' : `❌ It was ${round.answer}`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-1.5 justify-center">
        {ROUNDS.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? 'w-5 bg-[#ff385c]' : i === idx ? 'w-5 bg-neutral-950' : 'w-1.5 bg-neutral-200'}`} />)}
      </div>
    </div>
  );
}
