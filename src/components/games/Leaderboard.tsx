'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLevel } from '@/lib/gamification';

interface LeaderEntry {
  id: string;
  full_name: string | null;
  username: string | null;
  gamification_points: number;
}

const RANK_ICONS = [
  <Crown key={1} className="h-4 w-4 text-amber-400" />,
  <Medal key={2} className="h-4 w-4 text-neutral-400" />,
  <Medal key={3} className="h-4 w-4 text-amber-600" />,
];

const RANK_BG = ['bg-amber-50 border-amber-200', 'bg-neutral-50 border-neutral-200', 'bg-orange-50 border-orange-200'];

export default function Leaderboard({ currentUserId }: { currentUserId?: string }) {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank]   = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, gamification_points')
        .order('gamification_points', { ascending: false })
        .limit(10);

      const list = (data ?? []) as LeaderEntry[];
      setEntries(list);

      if (currentUserId) {
        const rank = list.findIndex(e => e.id === currentUserId);
        if (rank !== -1) setMyRank(rank + 1);
        else {
          // User not in top 10 — fetch their rank
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('gamification_points', list[list.length - 1]?.gamification_points ?? 0);
          if (count !== null) setMyRank(count + 1);
        }
      }
      setLoading(false);
    };
    load();
  }, [currentUserId]);

  const displayName = (e: LeaderEntry) =>
    e.username ? `@${e.username}` : e.full_name ?? 'Anonymous Foodie';

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-12 text-center">
        <Trophy className="mx-auto h-12 w-12 text-neutral-200" />
        <p className="mt-4 font-bold text-neutral-400">No scores yet — be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {/* 2nd */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-[2rem] border border-neutral-200 bg-neutral-50 p-4 text-center"
          >
            <Medal className="mx-auto h-6 w-6 text-neutral-400" />
            <p className="mt-2 text-xs font-black text-neutral-500 truncate">{displayName(entries[1])}</p>
            <p className="text-sm font-black text-neutral-950">{entries[1].gamification_points.toLocaleString()}</p>
            <p className="text-[10px] text-neutral-400">{getLevel(entries[1].gamification_points).title}</p>
          </motion.div>
          {/* 1st */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-amber-200 bg-amber-50 p-4 text-center shadow-sm"
          >
            <Crown className="mx-auto h-7 w-7 text-amber-400" />
            <p className="mt-2 text-xs font-black text-amber-700 truncate">{displayName(entries[0])}</p>
            <p className="text-base font-black text-neutral-950">{entries[0].gamification_points.toLocaleString()}</p>
            <p className="text-[10px] text-amber-600">{getLevel(entries[0].gamification_points).title}</p>
          </motion.div>
          {/* 3rd */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-[2rem] border border-orange-200 bg-orange-50 p-4 text-center"
          >
            <Medal className="mx-auto h-6 w-6 text-orange-400" />
            <p className="mt-2 text-xs font-black text-orange-700 truncate">{displayName(entries[2])}</p>
            <p className="text-sm font-black text-neutral-950">{entries[2].gamification_points.toLocaleString()}</p>
            <p className="text-[10px] text-orange-600">{getLevel(entries[2].gamification_points).title}</p>
          </motion.div>
        </div>
      )}

      {/* Ranks 4–10 */}
      <div className="space-y-2">
        {entries.slice(3).map((entry, i) => {
          const rank = i + 4;
          const isMe = entry.id === currentUserId;
          return (
            <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${isMe ? 'border-[#ff385c]/30 bg-[#fff4f6]' : 'border-neutral-100 bg-white'}`}
            >
              <span className="w-6 text-center text-sm font-black text-neutral-400">{rank}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${isMe ? 'text-[#ff385c]' : 'text-neutral-950'}`}>{displayName(entry)}{isMe && ' (you)'}</p>
                <p className="text-xs text-neutral-400">{getLevel(entry.gamification_points).title}</p>
              </div>
              <span className="text-sm font-black text-neutral-700">{entry.gamification_points.toLocaleString()} pts</span>
            </motion.div>
          );
        })}
      </div>

      {/* Your rank if outside top 10 */}
      {currentUserId && myRank !== null && myRank > 10 && (
        <div className="rounded-2xl border border-[#ff385c]/20 bg-[#fff4f6] p-4 text-center">
          <p className="text-sm text-neutral-600">You are ranked <span className="font-black text-[#ff385c]">#{myRank}</span> overall</p>
          <p className="text-xs text-neutral-400 mt-0.5">Keep playing to climb the board!</p>
        </div>
      )}
    </div>
  );
}
