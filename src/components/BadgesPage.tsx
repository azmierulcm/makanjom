'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';
import { DEFAULT_BADGES, getGamificationState, getBadgeProgress } from '@/lib/gamification';
import { haptics } from '@/lib/haptics';
import type { BadgeProgress } from '@/lib/gamification';

// ---------------------------------------------------------------------------
// Tiny confetti burst — no external dependency
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = ['#ff385c', '#ffb347', '#ffd700', '#4ade80', '#60a5fa', '#f472b6'];

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const pieces = Array.from({ length: 28 }, (_, i) => i);

  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {pieces.map((i) => {
        const angle = (i / pieces.length) * 360;
        const dist = 80 + Math.random() * 120;
        const dx = Math.cos((angle * Math.PI) / 180) * dist;
        const dy = Math.sin((angle * Math.PI) / 180) * dist - 60;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 6 + Math.random() * 8;
        const rotate = Math.random() * 360;

        return (
          <motion.div
            key={i}
            initial={{ x: '50vw', y: '40vh', opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x: `calc(50vw + ${dx}px)`, y: `calc(40vh + ${dy}px)`, opacity: 0, scale: 0.4, rotate }}
            transition={{ duration: 0.9 + Math.random() * 0.5, ease: 'easeOut' }}
            style={{ width: size, height: size, borderRadius: Math.random() > 0.5 ? '50%' : '2px', background: color, position: 'absolute' }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge newly-unlocked toast
// ---------------------------------------------------------------------------
function UnlockToast({ badge, onDone }: { badge: { name: string; icon: string }; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="fixed left-1/2 top-6 z-[210] -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-neutral-950 px-5 py-3.5 shadow-2xl"
    >
      <span className="text-2xl">{badge.icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-amber-400">Badge unlocked!</p>
        <p className="text-sm font-bold text-white">{badge.name}</p>
      </div>
      <Sparkles className="h-4 w-4 text-amber-400" />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main BadgesPage
// ---------------------------------------------------------------------------
export default function BadgesPage() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, BadgeProgress>>({});
  const [newlyUnlocked, setNewlyUnlocked] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevUnlockedRef = useRef<string[]>([]);

  useEffect(() => {
    const state = getGamificationState();
    const ids = state.badges.map((b) => b.id);
    const prev = prevUnlockedRef.current;

    // Detect freshly unlocked badges (not in prev snapshot)
    const fresh = ids.filter((id) => !prev.includes(id));
    if (fresh.length > 0) {
      const badge = DEFAULT_BADGES.find((b) => b.id === fresh[0]);
      if (badge) {
        setNewlyUnlocked(badge);
        setShowConfetti(true);
        haptics.success();
      }
    }
    prevUnlockedRef.current = ids;
    setUnlocked(ids);
    setProgress(getBadgeProgress(state));
  }, []);

  const sorted = [...DEFAULT_BADGES].sort((a, b) => {
    return (unlocked.includes(a.id) ? 0 : 1) - (unlocked.includes(b.id) ? 0 : 1);
  });

  const unlockedCount = unlocked.length;

  return (
    <>
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <ConfettiBurst onDone={() => setShowConfetti(false)} />
        )}
      </AnimatePresence>

      {/* Unlock toast */}
      <AnimatePresence>
        {newlyUnlocked && (
          <UnlockToast badge={newlyUnlocked} onDone={() => setNewlyUnlocked(null)} />
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#ff385c]" />
            Achievements
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950 sm:text-4xl">Achievement gallery</h1>
          <p className="mt-2 text-neutral-600">
            Collect badges by spinning, reviewing, exploring, and playing mini-games.
          </p>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-500">
              {unlockedCount} of {DEFAULT_BADGES.length} unlocked
            </p>
            <p className="text-sm font-bold text-[#ff385c]">
              {Math.round((unlockedCount / DEFAULT_BADGES.length) * 100)}%
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / DEFAULT_BADGES.length) * 100}%` }}
              transition={{ duration: 1.2, ease: 'circOut' }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#ff385c]"
            />
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((badge, i) => {
            const isUnlocked = unlocked.includes(badge.id);
            const prog = progress[badge.id];
            const pct = prog ? (prog.current / prog.total) * 100 : 0;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-[2rem] border p-6 transition ${
                  isUnlocked
                    ? 'border-amber-200 bg-amber-50/50 shadow-sm'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Badge icon — dimmed when locked, full when unlocked */}
                  <div
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl transition ${
                      isUnlocked
                        ? 'bg-white shadow-sm ring-1 ring-amber-200'
                        : 'bg-neutral-100 grayscale opacity-40'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold ${isUnlocked ? 'text-neutral-950' : 'text-neutral-400'}`}>
                        {badge.name}
                      </p>
                      {isUnlocked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Award className="h-2.5 w-2.5" /> Unlocked
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${isUnlocked ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      {badge.description}
                    </p>

                    {/* Progress bar for locked multi-step badges */}
                    {!isUnlocked && prog && prog.total > 1 && (
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-neutral-400">
                          <span>Progress</span>
                          <span>{prog.current} / {prog.total}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: i * 0.05 }}
                            className="h-full rounded-full bg-[#ff385c]/40"
                          />
                        </div>
                      </div>
                    )}

                    {!isUnlocked && prog && prog.total === 1 && prog.current === 0 && (
                      <p className="mt-2 text-[11px] font-medium text-neutral-300">Not yet earned</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
