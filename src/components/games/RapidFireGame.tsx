'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

const QUESTIONS = [
  { q: 'Nasi Lemak is Malaysia\'s national dish',            answer: true  },
  { q: 'Teh Tarik means "pulled tea" in Malay',             answer: true  },
  { q: 'Char Kuey Teow originated from Johor',              answer: false },
  { q: 'Roti Canai is an Indian-influenced flatbread',       answer: true  },
  { q: 'Satay is traditionally served with peanut sauce',    answer: true  },
  { q: 'Durian is known as the King of Fruits',              answer: true  },
  { q: 'Nasi Goreng means "fried noodles" in Malay',        answer: false },
  { q: 'Rendang is a dry coconut milk curry',                answer: true  },
  { q: 'Bak Kut Teh is a traditional Malay dish',           answer: false },
  { q: 'Cendol contains green jelly made from rice flour',   answer: true  },
];

const TIME_PER_Q = 6;

export default function RapidFireGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [idx, setIdx]         = useState(0);
  const [score, setScore]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [picked, setPicked]   = useState<boolean | null>(null);
  const [done, setDone]       = useState(false);
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = (correct: boolean, current: number, currentScore: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const total = currentScore + (correct ? 10 : 0);
    if (current + 1 >= QUESTIONS.length) {
      if (isLoggedIn) recordGamePlayed(total);
      onPointsEarned?.(total);
      sounds?.play('reveal', 0.5);
      setDone(true);
    } else {
      setTimeout(() => {
        setIdx(i => i + 1);
        setPicked(null);
        setTimeLeft(TIME_PER_Q);
      }, 800);
    }
  };

  useEffect(() => {
    if (picked !== null || done) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setPicked(false); // time up = wrong
          haptics.light();
          advance(false, idx, score);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [idx, picked, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (answer: boolean) => {
    if (picked !== null) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPicked(answer);
    haptics.light();
    const correct = answer === QUESTIONS[idx].answer;
    if (correct) { sounds?.play('tick', 0.3); setScore(s => s + 10); }
    advance(correct, idx, correct ? score + 10 : score);
  };

  if (done) return null;

  const q = QUESTIONS[idx];
  const pct = (timeLeft / TIME_PER_Q) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
        <span>{idx + 1} / {QUESTIONS.length}</span>
        <span className="text-[#ff385c]">{score} pts</span>
      </div>

      {/* Timer bar */}
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${timeLeft <= 2 ? 'bg-red-400' : 'bg-[#ff385c]'}`}
          style={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 text-center shadow-sm min-h-[200px] flex flex-col items-center justify-center"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-neutral-950 leading-snug">{q.q}</h2>
          {picked !== null && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`mt-3 text-sm font-bold ${picked === q.answer ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {picked === q.answer ? '✅ Correct! +10 pts' : `❌ The answer was ${q.answer ? 'TRUE' : 'FALSE'}`}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => pick(true)} disabled={picked !== null}
          className="rounded-2xl bg-emerald-500 py-5 text-lg font-black text-white shadow-sm active:scale-95 disabled:opacity-50 transition">
          ✅ True
        </button>
        <button onClick={() => pick(false)} disabled={picked !== null}
          className="rounded-2xl bg-red-400 py-5 text-lg font-black text-white shadow-sm active:scale-95 disabled:opacity-50 transition">
          ❌ False
        </button>
      </div>

      <div className="flex gap-1.5 justify-center flex-wrap">
        {QUESTIONS.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? 'w-4 bg-[#ff385c]' : i === idx ? 'w-4 bg-neutral-950' : 'w-1.5 bg-neutral-200'}`} />)}
      </div>
    </div>
  );
}
