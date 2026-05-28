'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Gamepad2 } from 'lucide-react';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';
import { checkRateLimit, formatResetTime } from '@/lib/rateLimit';

const TRIVIA = [
  { q: 'What is the national dish often called Malaysia\'s breakfast?', options: ['Nasi Lemak', 'Roti Canai', 'Laksa', 'Char Kuey Teow'], answer: 0 },
  { q: 'Which state is famous for Penang Assam Laksa?', options: ['Selangor', 'Penang', 'Johor', 'Sabah'], answer: 1 },
  { q: 'Teh tarik is best known for being:', options: ['Iced coffee', 'Pulled milk tea', 'Herbal drink', 'Coconut water'], answer: 1 },
  { q: 'Banana leaf rice is most associated with which cuisine?', options: ['Chinese', 'Indian', 'Malay', 'Western'], answer: 1 },
  { q: 'What does "makan" mean in Malay?', options: ['Drink', 'Eat', 'Cook', 'Share'], answer: 1 },
];

export default function FoodTriviaGame({ onPointsEarned, isLoggedIn = false }: { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);

  const question = TRIVIA[current];

  const pickAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    sounds?.play('tick', 0.2);

    const correct = idx === question.answer;
    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      if (current + 1 >= TRIVIA.length) {
        const finalScore = score + (correct ? 1 : 0);
        const perfect = finalScore === TRIVIA.length;
        const pts = finalScore * 20 + (perfect ? 50 : 0);
        if (isLoggedIn) recordGamePlayed(pts, perfect);
        onPointsEarned?.(pts);
        sounds?.play('reveal', 0.5);
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setShowResult(false);
      }
    }, 1200);
  };

  if (finished) {
    const finalScore = score;
    const perfect = finalScore === TRIVIA.length;
    const earnedPts = finalScore * 20 + (perfect ? 50 : 0);
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-[2rem] border border-neutral-200 bg-white p-8 text-center"
      >
        <Trophy className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-4 text-2xl font-bold">Game over!</h3>
        <p className="mt-2 text-neutral-600">
          You scored {finalScore}/{TRIVIA.length}.{' '}
          {isLoggedIn
            ? <>Earned <strong>{earnedPts} points</strong>{perfect ? ' (+ 50 perfect bonus! 🧠)' : ''}!</>
            : <>You would earn <strong>{earnedPts} points</strong> — sign in to save them!</>}
        </p>
        {rateLimitMsg && (
          <p className="mt-4 text-sm font-medium text-orange-600">{rateLimitMsg}</p>
        )}
        <button
          onClick={() => {
            // Rate limit: 5 game sessions per 10 minutes
            const rl = checkRateLimit('trivia', 5, 10 * 60_000);
            if (!rl.allowed) {
              setRateLimitMsg(`Too many games! Try again in ${formatResetTime(rl.resetInMs)}.`);
              return;
            }
            setRateLimitMsg(null);
            setCurrent(0);
            setScore(0);
            setSelected(null);
            setFinished(false);
            setShowResult(false);
          }}
          className="mt-6 rounded-full bg-[#ff385c] px-6 py-3 font-bold text-white"
        >
          Play again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-neutral-400">
          <Gamepad2 className="h-4 w-4" /> Question {current + 1}/{TRIVIA.length}
        </span>
        <span className="flex items-center gap-1 text-sm font-bold text-[#ff385c]">
          <Zap className="h-4 w-4" /> Score: {score}
        </span>
      </div>

      <h3 className="text-xl font-bold text-neutral-950">{question.q}</h3>

      <div className="mt-6 space-y-3">
        <AnimatePresence mode="wait">
          {question.options.map((opt, idx) => {
            let style = 'border-neutral-200 hover:border-[#ff385c]/30 hover:bg-[#fff4f6]';
            if (showResult && selected === idx) {
              style = idx === question.answer
                ? 'border-green-400 bg-green-50 text-green-900'
                : 'border-red-300 bg-red-50 text-red-900';
            } else if (showResult && idx === question.answer) {
              style = 'border-green-400 bg-green-50';
            }

            return (
              <motion.button
                key={`${current}-${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => pickAnswer(idx)}
                disabled={selected !== null}
                className={`w-full rounded-2xl border-2 p-4 text-left font-semibold transition ${style}`}
              >
                {opt}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
