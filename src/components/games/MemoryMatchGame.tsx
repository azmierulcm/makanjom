'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { recordGamePlayed } from '@/lib/gamification';
import { sounds } from '@/lib/sounds';

const PAIRS = ['🍛', '🍜', '🍣', '🍧', '🫓', '☕'];

export default function MemoryMatchGame({ onPointsEarned }: { onPointsEarned?: (pts: number) => void }) {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const init = useCallback(() => {
    const deck = [...PAIRS, ...PAIRS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setWon(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const flip = (index: number) => {
    if (won || flipped.length >= 2 || cards[index].flipped || cards[index].matched) return;

    sounds?.play('tick', 0.15);
    const next = [...cards];
    next[index] = { ...next[index], flipped: true };
    setCards(next);
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (next[a].emoji === next[b].emoji) {
        next[a] = { ...next[a], matched: true };
        next[b] = { ...next[b], matched: true };
        setCards([...next]);
        setFlipped([]);
        sounds?.play('reveal', 0.3);
        if (next.every((c) => c.matched)) {
          const pts = Math.max(30, 100 - moves * 5);
          recordGamePlayed(pts);
          onPointsEarned?.(pts);
          setWon(true);
        }
      } else {
        setTimeout(() => {
          next[a] = { ...next[a], flipped: false };
          next[b] = { ...next[b], flipped: false };
          setCards([...next]);
          setFlipped([]);
        }, 700);
      }
    }
  };

  return (
    <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex justify-between text-sm font-bold text-neutral-500">
        <span>Moves: {moves}</span>
        {won && <span className="text-[#ff385c]">You won! +points</span>}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <motion.button
            key={card.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => flip(i)}
            className={`flex aspect-square items-center justify-center rounded-2xl text-3xl transition ${
              card.flipped || card.matched
                ? 'bg-[#fff4f6] ring-2 ring-[#ff385c]/20'
                : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
          >
            {(card.flipped || card.matched) ? card.emoji : <Zap className="h-6 w-6 text-neutral-300" />}
          </motion.button>
        ))}
      </div>
      {won && (
        <button onClick={init} className="mt-4 w-full rounded-full bg-[#ff385c] py-3 font-bold text-white">
          Play again
        </button>
      )}
    </div>
  );
}
