'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Award,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Zap,
  Heart,
  History,
  Gamepad2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getGamificationState, getLevel } from '@/lib/gamification';

interface Profile {
  full_name: string;
  avatar_url: string;
  gamification_points: number;
  badges: { id: string; name: string }[];
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [localPoints, setLocalPoints] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    const state = getGamificationState();
    setLocalPoints(state.points);
    setSpinCount(state.spinHistory.length);
    setSavedCount(state.savedRestaurants.length);
    setBadgeCount(state.badges.length);
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').limit(1).single();
    if (data) setProfile(data as Profile);
    setLoading(false);
  };

  const totalPoints = (profile?.gamification_points ?? 0) + localPoints;
  const level = getLevel(totalPoints);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff385c]/20 border-t-[#ff385c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32 md:bg-[#faf9f7]">
      <section className="border-b border-neutral-100 bg-white px-6 py-12 md:rounded-b-[4rem] md:py-16 md:shadow-sm">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 md:flex-row md:gap-12">
          <div className="relative">
            <div className="h-40 w-40 rounded-[3.5rem] bg-neutral-100 p-1.5 shadow-2xl shadow-[#ff385c]/10 md:h-48 md:w-48">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[3.2rem] bg-white">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-6xl font-black text-neutral-200">
                    {profile?.full_name?.charAt(0) ?? 'F'}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-xl">
              <Zap className="fill-[#ff385c] text-[#ff385c]" size={24} />
            </div>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter text-neutral-900 md:text-5xl">
                {profile?.full_name ?? 'Food Explorer'}
              </h2>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-white">
                <ShieldCheck size={14} className="text-[#ff385c]" /> {level.title}
              </div>
            </div>
            <p className="max-w-sm font-medium leading-relaxed text-neutral-500">
              Discovering the best local bites across Malaysia. Spin, review, and play to level up.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto mt-12 max-w-2xl space-y-12 px-6">
        <section className="grid grid-cols-2 gap-4">
          <StatBox label="Points" value={totalPoints} color="text-[#ff385c]" />
          <StatBox label="Badges" value={badgeCount} color="text-amber-500" />
        </section>

        <section className="rounded-[3rem] border border-neutral-100 bg-white p-8 shadow-sm md:p-10">
          <div className="mb-6 flex items-end justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-[#ff385c]" />
              <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Rank Progress</p>
            </div>
            <p className="text-sm font-bold text-neutral-950">{level.next}</p>
          </div>
          <div className="mb-6 h-5 w-full overflow-hidden rounded-full bg-neutral-50 p-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${level.progress}%` }}
              transition={{ duration: 1.8, ease: 'circOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#ff385c] to-[#ffb347] shadow-[0_0_15px_rgba(255,56,92,0.4)]"
            />
          </div>
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            {level.remaining > 0
              ? `Earn ${level.remaining} more points to level up`
              : 'Maximum rank achieved!'}
          </p>
        </section>

        <section className="overflow-hidden rounded-[3rem] border border-neutral-100 bg-white shadow-sm">
          <MenuLink icon={<Heart size={20} />} label="Saved Destinations" count={savedCount} href="/explore" />
          <MenuLink icon={<History size={20} />} label="Spin History" count={spinCount} href="/" />
          <MenuLink icon={<Award size={20} />} label="Achievement Gallery" href="/badges" />
          <MenuLink icon={<Gamepad2 size={20} />} label="Mini-Games" href="/games" last />
        </section>
      </main>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-[3rem] border border-neutral-100 bg-white p-8 text-center shadow-sm">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{label}</p>
      <p className={`text-4xl font-black tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function MenuLink({
  icon,
  label,
  count,
  href,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  href: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-between p-7 transition-colors hover:bg-neutral-50 ${!last ? 'border-b border-neutral-50' : ''}`}
    >
      <div className="flex items-center gap-5">
        <div className="text-neutral-400">{icon}</div>
        <span className="font-bold tracking-tight text-neutral-900">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {count !== undefined && (
          <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-black text-neutral-300">{count}</span>
        )}
        <ChevronRight size={18} className="text-neutral-200" />
      </div>
    </Link>
  );
}
