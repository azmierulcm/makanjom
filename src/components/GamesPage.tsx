'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Gamepad2, Zap, Brain, Grid3x3, ChevronRight, ArrowLeft, Trophy } from 'lucide-react';
import FoodTriviaGame from '@/components/games/FoodTriviaGame';
import MemoryMatchGame from '@/components/games/MemoryMatchGame';
import { getGamificationState } from '@/lib/gamification';

type GameId = 'trivia' | 'memory';

const GAMES = [
  {
    id: 'trivia' as GameId,
    title: 'Food Trivia',
    description: 'Test your Malaysian food knowledge. Answer 5 questions and earn up to 150 points.',
    icon: Brain,
    difficulty: 2,
    maxPoints: 150,
    estimatedTime: '2 min',
    gradient: 'from-blue-50 to-indigo-50',
    accent: 'text-indigo-600',
    accentBg: 'bg-indigo-100',
    relatedCuisine: 'Malay',
    relatedLabel: 'Malaysian cuisine',
  },
  {
    id: 'memory' as GameId,
    title: 'Memory Match',
    description: 'Flip food emoji cards to find matching pairs. Race against yourself for bonus points.',
    icon: Grid3x3,
    difficulty: 3,
    maxPoints: 200,
    estimatedTime: '3 min',
    gradient: 'from-emerald-50 to-teal-50',
    accent: 'text-emerald-700',
    accentBg: 'bg-emerald-100',
    relatedCuisine: 'Cafe',
    relatedLabel: 'Café spots',
  },
] as const;

function DifficultyDots({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((d) => (
        <div
          key={d}
          className={`h-2 w-2 rounded-full transition ${d <= level ? color.replace('text-', 'bg-') : 'bg-neutral-200'}`}
        />
      ))}
    </div>
  );
}

function GameCard({ game, onSelect }: { game: typeof GAMES[number]; onSelect: () => void }) {
  const Icon = game.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`w-full text-left rounded-[2.5rem] border border-neutral-200 bg-gradient-to-br ${game.gradient} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-7`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${game.accentBg}`}>
          <Icon className={`h-7 w-7 ${game.accent}`} />
        </div>
        <ChevronRight className="mt-1 h-5 w-5 text-neutral-300" />
      </div>

      <h3 className="mt-5 text-xl font-black tracking-tight text-neutral-950">{game.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{game.description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-500">
        <div className="flex items-center gap-2">
          <span>Difficulty</span>
          <DifficultyDots level={game.difficulty} color={game.accent} />
        </div>
        <span>⏱ {game.estimatedTime}</span>
        <span className={`rounded-full px-2.5 py-1 font-bold ${game.accentBg} ${game.accent}`}>
          Up to {game.maxPoints} pts
        </span>
      </div>
    </motion.button>
  );
}

// Post-game result card with restaurant tie-in
function PostGameCard({
  game,
  pointsEarned,
  onPlayAgain,
  onBack,
}: {
  game: typeof GAMES[number];
  pointsEarned: number;
  onPlayAgain: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5"
    >
      {/* Score summary */}
      <div className={`rounded-[2.5rem] border border-neutral-200 bg-gradient-to-br ${game.gradient} p-8 text-center shadow-sm`}>
        <Trophy className={`mx-auto h-12 w-12 ${game.accent}`} />
        <h3 className="mt-4 text-2xl font-black tracking-tight text-neutral-950">Great game!</h3>
        <p className={`mt-2 text-4xl font-black ${game.accent}`}>+{pointsEarned} pts</p>
        <p className="mt-2 text-sm text-neutral-500">Added to your total</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white active:scale-95"
          >
            Play again
          </button>
          <button
            onClick={onBack}
            className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-neutral-700 active:scale-95"
          >
            Browse games
          </button>
        </div>
      </div>

      {/* Restaurant tie-in */}
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">
          You just played {game.title} — now eat!
        </p>
        <h4 className="text-lg font-bold text-neutral-950">
          Discover {game.relatedLabel} near you
        </h4>
        <p className="mt-1 text-sm text-neutral-500">
          Put that {game.id === 'trivia' ? 'knowledge' : 'memory'} to use and visit a spot in person.
        </p>
        <Link
          href={`/explore?cuisine=${encodeURIComponent(game.relatedCuisine)}`}
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold ${game.accentBg} ${game.accent} active:scale-95`}
        >
          Explore {game.relatedCuisine} spots <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function GamesPage() {
  const [points, setPoints] = useState(0);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [lastPointsEarned, setLastPointsEarned] = useState<number | null>(null);

  useEffect(() => {
    setPoints(getGamificationState().points);
  }, []);

  const activeGameMeta = GAMES.find((g) => g.id === activeGame);

  const handlePointsEarned = (earned: number) => {
    setPoints((p) => p + earned);
    setLastPointsEarned(earned);
  };

  const handlePlayAgain = () => {
    setLastPointsEarned(null);
    // Re-mount game by briefly unsetting
    const current = activeGame;
    setActiveGame(null);
    setTimeout(() => setActiveGame(current), 50);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="mb-8">
        {activeGame ? (
          <button
            onClick={() => { setActiveGame(null); setLastPointsEarned(null); }}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" /> All games
          </button>
        ) : null}

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">
          <Gamepad2 className="h-4 w-4 text-[#ff385c]" />
          Mini-games
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-950">
            {activeGame && activeGameMeta ? activeGameMeta.title : 'Play & earn points'}
          </h1>
          <div className="flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-sm font-black text-white shrink-0">
            <Zap className="h-4 w-4 fill-[#ff385c] text-[#ff385c]" />
            {points} pts
          </div>
        </div>
        {!activeGame && (
          <p className="mt-2 text-neutral-600">
            Beat decision fatigue with fun food games. Earn points to level up your foodie rank.
          </p>
        )}
      </header>

      <AnimatePresence mode="wait">
        {/* Game selector */}
        {!activeGame && (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-5 sm:grid-cols-2"
          >
            {GAMES.map((game) => (
              <GameCard key={game.id} game={game} onSelect={() => { setActiveGame(game.id); setLastPointsEarned(null); }} />
            ))}
          </motion.div>
        )}

        {/* Active game — post-game screen */}
        {activeGame && activeGameMeta && lastPointsEarned !== null && (
          <motion.div key="post-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PostGameCard
              game={activeGameMeta}
              pointsEarned={lastPointsEarned}
              onPlayAgain={handlePlayAgain}
              onBack={() => { setActiveGame(null); setLastPointsEarned(null); }}
            />
          </motion.div>
        )}

        {/* Active game — playing */}
        {activeGame && lastPointsEarned === null && (
          <motion.div key={`game-${activeGame}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {activeGame === 'trivia' ? (
              <FoodTriviaGame onPointsEarned={handlePointsEarned} />
            ) : (
              <MemoryMatchGame onPointsEarned={handlePointsEarned} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
