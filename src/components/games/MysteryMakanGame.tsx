'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

const MYSTERIES = [
  {
    answer: 'Nasi Lemak', emoji: '🍛',
    clues: [
      'I am often eaten for breakfast in Malaysia',
      'I am served with coconut-infused rice and spicy sambal',
      'I come with anchovies, peanuts, cucumber, and a boiled egg',
    ],
    options: ['Nasi Lemak', 'Nasi Goreng', 'Nasi Campur', 'Nasi Kerabu'],
  },
  {
    answer: 'Teh Tarik', emoji: '🧋',
    clues: [
      'I am Malaysia\'s most beloved hot drink',
      'I am made by pouring between two containers to create froth',
      'My name in Malay literally means "pulled tea"',
    ],
    options: ['Kopi O', 'Teh Tarik', 'Bandung', 'Milo Ais'],
  },
  {
    answer: 'Cendol', emoji: '🍧',
    clues: [
      'I am a popular Malaysian dessert served cold',
      'I contain shaved ice, green jelly, and coconut milk',
      'My sweetness comes from dark palm sugar called gula melaka',
    ],
    options: ['Ice Kacang', 'Cendol', 'Bubur Cha Cha', 'Ais Batu Campur'],
  },
  {
    answer: 'Satay', emoji: '🍡',
    clues: [
      'I am a popular street food found at night markets',
      'I am marinated meat threaded onto bamboo skewers',
      'I am always grilled over charcoal and served with peanut sauce',
    ],
    options: ['Otak-Otak', 'Keropok Lekor', 'Satay', 'Lok Lok'],
  },
  {
    answer: 'Rendang', emoji: '🍖',
    clues: [
      'I am a rich, dry curry cooked for hours',
      'I am made with coconut milk, lemongrass, and aromatic spices',
      'I am traditionally prepared for Hari Raya celebrations',
    ],
    options: ['Kari Ayam', 'Masak Lemak', 'Gulai', 'Rendang'],
  },
];

// Points by which clue the correct answer was given
const PTS_BY_CLUE = [40, 25, 15];

export default function MysteryMakanGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [idx, setIdx]           = useState(0);
  const [clueIdx, setClueIdx]   = useState(0);
  const [score, setScore]       = useState(0);
  const [picked, setPicked]     = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const mystery = MYSTERIES[idx];

  const revealClue = () => {
    if (clueIdx < mystery.clues.length - 1) {
      setClueIdx(c => c + 1);
      haptics.light();
    }
  };

  const pick = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    haptics.light();
    const correct = opt === mystery.answer;
    const pts = correct ? PTS_BY_CLUE[clueIdx] ?? 10 : 0;
    if (correct) { sounds?.play('tick', 0.3); setScore(s => s + pts); }

    setTimeout(() => {
      if (idx + 1 >= MYSTERIES.length) {
        const total = score + pts;
        if (isLoggedIn) recordGamePlayed(total);
        onPointsEarned?.(total);
        sounds?.play('reveal', 0.5);
        setDone(true);
      } else {
        setIdx(i => i + 1);
        setClueIdx(0);
        setPicked(null);
      }
    }, 1200);
  };

  if (done) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
        <span>Mystery {idx + 1} / {MYSTERIES.length}</span>
        <span className="text-[#ff385c]">{score} pts</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="rounded-[2.5rem] border border-neutral-200 bg-white p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">🕵️ Mystery dish</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${clueIdx === 0 ? 'bg-amber-100 text-amber-700' : clueIdx === 1 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
              +{PTS_BY_CLUE[clueIdx]} pts if correct
            </span>
          </div>

          {mystery.clues.slice(0, clueIdx + 1).map((clue, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 rounded-2xl bg-neutral-50 p-4"
            >
              <span className="text-xs font-black text-neutral-400 shrink-0 pt-0.5">#{i + 1}</span>
              <p className="text-sm font-semibold text-neutral-800 leading-relaxed">{clue}</p>
            </motion.div>
          ))}

          {clueIdx < mystery.clues.length - 1 && picked === null && (
            <button onClick={revealClue}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 active:scale-95 transition"
            >
              <Eye className="h-4 w-4" /> Reveal next clue (−{PTS_BY_CLUE[clueIdx] - PTS_BY_CLUE[clueIdx + 1]} pts)
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        {mystery.options.map(opt => {
          const isCorrect = opt === mystery.answer;
          const isPicked  = opt === picked;
          let cls = 'rounded-2xl border-2 py-3.5 text-sm font-bold transition active:scale-95 ';
          if (picked === null)  cls += 'border-neutral-200 text-neutral-700 hover:border-neutral-400';
          else if (isCorrect)   cls += 'border-emerald-400 bg-emerald-50 text-emerald-700';
          else if (isPicked)    cls += 'border-red-300 bg-red-50 text-red-600';
          else                  cls += 'border-neutral-100 text-neutral-300';
          return <button key={opt} onClick={() => pick(opt)} disabled={picked !== null} className={cls}>{opt}</button>;
        })}
      </div>

      <div className="flex gap-1.5 justify-center">
        {MYSTERIES.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? 'w-5 bg-[#ff385c]' : i === idx ? 'w-5 bg-neutral-950' : 'w-1.5 bg-neutral-200'}`} />)}
      </div>
    </div>
  );
}
