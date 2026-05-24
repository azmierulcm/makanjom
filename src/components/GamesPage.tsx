'use client';

import { useEffect, useState } from 'react';
import { Gamepad2, Zap } from 'lucide-react';
import FoodTriviaGame from '@/components/games/FoodTriviaGame';
import MemoryMatchGame from '@/components/games/MemoryMatchGame';
import { getGamificationState } from '@/lib/gamification';

export default function GamesPage() {
  const [points, setPoints] = useState(0);
  const [activeGame, setActiveGame] = useState<'trivia' | 'memory'>('trivia');

  useEffect(() => {
    setPoints(getGamificationState().points);
  }, []);

  const refreshPoints = (earned: number) => {
    setPoints((p) => p + earned);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">
          <Gamepad2 className="h-4 w-4 text-[#ff385c]" />
          Mini-games
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-950">Play & earn points</h1>
        <p className="mt-2 text-neutral-600">
          Beat decision fatigue with fun mini-games. Earn reward points to level up your foodie rank.
        </p>
        <p className="mt-4 flex items-center gap-2 text-lg font-bold text-[#ff385c]">
          <Zap className="h-5 w-5 fill-[#ff385c]" /> {points} total points
        </p>
      </header>

      <div className="mb-6 flex gap-2">
        {(['trivia', 'memory'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setActiveGame(g)}
            className={`rounded-full px-5 py-2 text-sm font-bold capitalize ${
              activeGame === g ? 'bg-[#ff385c] text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200'
            }`}
          >
            {g === 'trivia' ? 'Food Trivia' : 'Memory Match'}
          </button>
        ))}
      </div>

      {activeGame === 'trivia' ? (
        <FoodTriviaGame onPointsEarned={refreshPoints} />
      ) : (
        <MemoryMatchGame onPointsEarned={refreshPoints} />
      )}
    </div>
  );
}
