'use client';

import { useEffect, useState } from 'react';
import { Award, Lock } from 'lucide-react';
import { DEFAULT_BADGES, getGamificationState } from '@/lib/gamification';

export default function BadgesPage() {
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    const state = getGamificationState();
    setUnlocked(state.badges.map((b) => b.id));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-950">Achievement gallery</h1>
        <p className="mt-2 text-neutral-600">Collect badges by spinning, reviewing, exploring, and playing mini-games.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEFAULT_BADGES.map((badge) => {
          const isUnlocked = unlocked.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`flex items-center gap-4 rounded-[2rem] border p-6 transition ${
                isUnlocked
                  ? 'border-amber-200 bg-amber-50/50'
                  : 'border-neutral-200 bg-white opacity-60'
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
                isUnlocked ? 'bg-white shadow-sm' : 'bg-neutral-100 grayscale'
              }`}>
                {isUnlocked ? badge.icon : <Lock className="h-6 w-6 text-neutral-400" />}
              </div>
              <div>
                <p className="font-bold text-neutral-950">{badge.name}</p>
                <p className="text-sm text-neutral-500">{badge.description}</p>
                {isUnlocked && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Award className="h-3 w-3" /> Unlocked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
