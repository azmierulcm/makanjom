'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Gamepad2, Zap, Brain, Grid3x3, ChevronRight, ArrowLeft,
  Trophy, Shuffle, LogIn, Tag, AlignJustify, Flame, Ham,
  MapPin, Eye, BarChart3, Volume2, VolumeX,
} from 'lucide-react';
import { gameBgm, type BgmTheme } from '@/lib/gameBgm';
import FoodTriviaGame    from '@/components/games/FoodTriviaGame';
import MemoryMatchGame   from '@/components/games/MemoryMatchGame';
import PriceGuesserGame  from '@/components/games/PriceGuesserGame';
import FoodScrambleGame  from '@/components/games/FoodScrambleGame';
import RapidFireGame     from '@/components/games/RapidFireGame';
import EmojiKitchenGame  from '@/components/games/EmojiKitchenGame';
import SpicyLadderGame   from '@/components/games/SpicyLadderGame';
import FoodPairsGame     from '@/components/games/FoodPairsGame';
import MysteryMakanGame  from '@/components/games/MysteryMakanGame';
import Leaderboard       from '@/components/games/Leaderboard';
import { getGamificationState } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';

type GameId = 'trivia' | 'memory' | 'price' | 'scramble' | 'rapidfire' | 'emoji' | 'spicy' | 'pairs' | 'mystery';
type Tab = 'play' | 'leaderboard';

type GameProps = { onPointsEarned?: (pts: number) => void; isLoggedIn?: boolean };
const GAME_COMPONENTS: Record<GameId, React.ComponentType<GameProps>> = {
  trivia:    FoodTriviaGame,
  memory:    MemoryMatchGame,
  price:     PriceGuesserGame,
  scramble:  FoodScrambleGame,
  rapidfire: RapidFireGame,
  emoji:     EmojiKitchenGame,
  spicy:     SpicyLadderGame,
  pairs:     FoodPairsGame,
  mystery:   MysteryMakanGame,
};

const GAMES = [
  {
    id: 'trivia' as GameId,
    title: 'Food Trivia',
    description: 'Test your Malaysian food knowledge across 5 questions.',
    icon: Brain,
    difficulty: 2, maxPoints: 150, estimatedTime: '2 min',
    gradient: 'from-blue-50 to-indigo-50', accent: 'text-indigo-600', accentBg: 'bg-indigo-100',
    relatedCuisine: 'Malay', relatedLabel: 'Malaysian cuisine',
  },
  {
    id: 'memory' as GameId,
    title: 'Memory Match',
    description: 'Flip food emoji cards and find all matching pairs.',
    icon: Grid3x3,
    difficulty: 3, maxPoints: 200, estimatedTime: '3 min',
    gradient: 'from-emerald-50 to-teal-50', accent: 'text-emerald-700', accentBg: 'bg-emerald-100',
    relatedCuisine: 'Cafe', relatedLabel: 'Café spots',
  },
  {
    id: 'price' as GameId,
    title: 'Price Guesser',
    description: 'Guess the price of 5 popular Malaysian dishes.',
    icon: Tag,
    difficulty: 2, maxPoints: 125, estimatedTime: '2 min',
    gradient: 'from-yellow-50 to-amber-50', accent: 'text-amber-600', accentBg: 'bg-amber-100',
    relatedCuisine: 'Malay', relatedLabel: 'affordable eats',
  },
  {
    id: 'scramble' as GameId,
    title: 'Food Scramble',
    description: 'Unscramble the letters to reveal the hidden dish.',
    icon: AlignJustify,
    difficulty: 2, maxPoints: 125, estimatedTime: '2 min',
    gradient: 'from-purple-50 to-violet-50', accent: 'text-violet-600', accentBg: 'bg-violet-100',
    relatedCuisine: 'Malay', relatedLabel: 'Malaysian classics',
  },
  {
    id: 'rapidfire' as GameId,
    title: 'Rapid Fire',
    description: '10 true/false food facts — you have 6 seconds each. Go!',
    icon: Zap,
    difficulty: 3, maxPoints: 100, estimatedTime: '1 min',
    gradient: 'from-red-50 to-rose-50', accent: 'text-rose-600', accentBg: 'bg-rose-100',
    relatedCuisine: 'Mamak', relatedLabel: 'late-night eats',
  },
  {
    id: 'emoji' as GameId,
    title: 'Emoji Kitchen',
    description: 'Three food emojis are your only clues — name the dish!',
    icon: Ham,
    difficulty: 2, maxPoints: 150, estimatedTime: '2 min',
    gradient: 'from-pink-50 to-fuchsia-50', accent: 'text-fuchsia-600', accentBg: 'bg-fuchsia-100',
    relatedCuisine: 'Chinese', relatedLabel: 'Chinese spots',
  },
  {
    id: 'spicy' as GameId,
    title: 'Spicy Ladder',
    description: 'Rank 5 dishes from mildest to spiciest. Think you know your heat?',
    icon: Flame,
    difficulty: 3, maxPoints: 75, estimatedTime: '1 min',
    gradient: 'from-orange-50 to-red-50', accent: 'text-orange-600', accentBg: 'bg-orange-100',
    relatedCuisine: 'Indian', relatedLabel: 'spicy bites',
  },
  {
    id: 'pairs' as GameId,
    title: 'Food Pairs',
    description: 'Match each iconic Malaysian dish to its state of origin.',
    icon: MapPin,
    difficulty: 3, maxPoints: 120, estimatedTime: '2 min',
    gradient: 'from-sky-50 to-cyan-50', accent: 'text-sky-600', accentBg: 'bg-sky-100',
    relatedCuisine: 'Penang', relatedLabel: 'Penang cuisine',
  },
  {
    id: 'mystery' as GameId,
    title: 'Mystery Makan',
    description: 'Use progressive clues to identify the secret Malaysian dish.',
    icon: Eye,
    difficulty: 3, maxPoints: 200, estimatedTime: '3 min',
    gradient: 'from-slate-50 to-gray-100', accent: 'text-slate-700', accentBg: 'bg-slate-100',
    relatedCuisine: 'Malay', relatedLabel: 'classic dishes',
  },
] as const;

function DifficultyDots({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((d) => (
        <div key={d} className={`h-2 w-2 rounded-full transition ${d <= level ? color.replace('text-', 'bg-') : 'bg-neutral-200'}`} />
      ))}
    </div>
  );
}

function GameCard({ game, onSelect }: { game: typeof GAMES[number]; onSelect: () => void }) {
  const Icon = game.icon;
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onSelect}
      className={`w-full text-left rounded-[2.5rem] border border-neutral-200 bg-gradient-to-br ${game.gradient} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${game.accentBg}`}>
          <Icon className={`h-7 w-7 ${game.accent}`} />
        </div>
        <ChevronRight className="mt-1 h-5 w-5 text-neutral-300" />
      </div>
      <h2 className="mt-5 text-xl font-black tracking-tight text-neutral-950">{game.title}</h2>
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

function PostGameCard({
  game, pointsEarned, isLoggedIn, onPlayAgain, onBack,
}: {
  game: typeof GAMES[number]; pointsEarned: number; isLoggedIn: boolean;
  onPlayAgain: () => void; onBack: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
      <div className={`rounded-[2.5rem] border border-neutral-200 bg-gradient-to-br ${game.gradient} p-8 text-center shadow-sm`}>
        <Trophy className={`mx-auto h-12 w-12 ${game.accent}`} />
        <h2 className="mt-4 text-2xl font-black tracking-tight text-neutral-950">Great game!</h2>
        <p className={`mt-2 text-4xl font-black ${game.accent}`}>+{pointsEarned} pts</p>
        {isLoggedIn ? (
          <p className="mt-2 text-sm text-neutral-500">Added to your total</p>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="text-sm text-neutral-500">Sign in to save your points</p>
            <Link href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-bold text-white active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in to save
            </Link>
          </div>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={onPlayAgain} className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white active:scale-95">
            Play again
          </button>
          <button onClick={onBack} className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-neutral-700 active:scale-95">
            Browse games
          </button>
        </div>
      </div>
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">
          You just played {game.title} — now eat!
        </p>
        <h3 className="text-lg font-bold text-neutral-950">Discover {game.relatedLabel} near you</h3>
        <Link href={`/explore?cuisine=${encodeURIComponent(game.relatedCuisine)}`}
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold ${game.accentBg} ${game.accent} active:scale-95`}
        >
          Explore {game.relatedCuisine} spots <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function GamesPage() {
  const [tab, setTab]           = useState<Tab>('play');
  const [points, setPoints]     = useState(0);
  const [userId, setUserId]     = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [lastPointsEarned, setLastPointsEarned] = useState<number | null>(null);
  const [muted, setMuted]       = useState(() => gameBgm?.getMuted() ?? false);

  // Theme per game
  const GAME_THEMES: Record<GameId, BgmTheme> = {
    trivia:    'arcade',
    memory:    'arcade',
    price:     'market',
    scramble:  'arcade',
    rapidfire: 'rapid',
    emoji:     'market',
    spicy:     'market',
    pairs:     'market',
    mystery:   'mystery',
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    gameBgm?.setMuted(next);
  };

  // Start BGM when a game begins; stop on post-game or back
  useEffect(() => {
    if (activeGame && lastPointsEarned === null) {
      gameBgm?.start(GAME_THEMES[activeGame]);
    } else {
      gameBgm?.stop();
    }
    return () => { gameBgm?.stop(); };
  }, [activeGame, lastPointsEarned]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.id);
        setPoints(getGamificationState().points);
      }
    });
  }, []);

  const activeGameMeta = GAMES.find((g) => g.id === activeGame);

  const handlePointsEarned = (earned: number) => {
    if (isLoggedIn) setPoints((p) => p + earned);
    setLastPointsEarned(earned);
  };

  const handlePlayAgain = () => {
    setLastPointsEarned(null);
    const current = activeGame;
    setActiveGame(null);
    setTimeout(() => setActiveGame(current), 50);
  };

  const ActiveGameComponent = activeGame ? GAME_COMPONENTS[activeGame] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="mb-6">
        {activeGame && (
          <button onClick={() => { setActiveGame(null); setLastPointsEarned(null); }}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" /> All games
          </button>
        )}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
          <Gamepad2 className="h-4 w-4 text-[#ff385c]" /> Mini-games
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950 sm:text-4xl">
            {activeGame && activeGameMeta ? activeGameMeta.title : 'Play & earn points'}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {/* Mute toggle — always visible */}
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute music' : 'Mute music'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:border-neutral-400 hover:text-neutral-800 active:scale-95"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-sm font-black text-white">
                <Zap className="h-4 w-4 fill-[#ff385c] text-[#ff385c]" /> {points} pts
              </div>
            ) : (
              <Link href="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 shadow-sm hover:border-[#ff385c] hover:text-[#ff385c] transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in to earn pts
              </Link>
            )}
          </div>
        </div>
        {!activeGame && (
          <p className="mt-2 text-neutral-600">Beat decision fatigue with fun food games. Earn points to climb the leaderboard.</p>
        )}
      </header>

      {/* Tab bar — only shown on the game selector screen */}
      {!activeGame && (
        <div className="mb-6 flex gap-1 rounded-2xl bg-neutral-100 p-1">
          <button onClick={() => setTab('play')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'play' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}
          >
            <Gamepad2 className="h-4 w-4" /> Play
          </button>
          <button onClick={() => setTab('leaderboard')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'leaderboard' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}
          >
            <BarChart3 className="h-4 w-4" /> Leaderboard
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Leaderboard */}
        {!activeGame && tab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Leaderboard currentUserId={userId} />
          </motion.div>
        )}

        {/* Game selector */}
        {!activeGame && tab === 'play' && (
          <motion.div key="selector" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid gap-5 sm:grid-cols-2">
              {GAMES.map((game) => (
                <GameCard key={game.id} game={game} onSelect={() => { setActiveGame(game.id); setLastPointsEarned(null); }} />
              ))}

              {/* SlotMachine2 — standalone page */}
              <Link href="/games/slotmachine2"
                className="group block rounded-[2rem] border border-neutral-200 bg-gradient-to-br from-rose-50 to-pink-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
                    <Shuffle className="h-6 w-6 text-[#ff385c]" />
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-neutral-400 ring-1 ring-neutral-200">Bonus</span>
                </div>
                <h2 className="text-lg font-black text-neutral-950">Slot Machine v2</h2>
                <p className="mt-1 text-sm font-medium text-neutral-500">An alternative spin experience — 3 reels, faster pace.</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-black text-[#ff385c]">
                  Play now <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Post-game screen */}
        {activeGame && activeGameMeta && lastPointsEarned !== null && (
          <motion.div key="post-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PostGameCard
              game={activeGameMeta}
              pointsEarned={lastPointsEarned}
              isLoggedIn={isLoggedIn}
              onPlayAgain={handlePlayAgain}
              onBack={() => { setActiveGame(null); setLastPointsEarned(null); }}
            />
          </motion.div>
        )}

        {/* Active game — playing */}
        {activeGame && ActiveGameComponent && lastPointsEarned === null && (
          <motion.div key={`game-${activeGame}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ActiveGameComponent onPointsEarned={handlePointsEarned} isLoggedIn={isLoggedIn} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
