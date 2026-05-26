'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Award, MapPin, Users, Star, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MOCK_CREATORS } from '@/lib/mock-data';
import type { CreatorProfile } from '@/lib/types';

export default function CreatorsDirectory() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*, profiles(*)')
        .eq('is_local_expert', true)
        .order('review_count', { ascending: false });

      setCreators(error || !data?.length ? MOCK_CREATORS : (data as CreatorProfile[]));
    } catch {
      setCreators(MOCK_CREATORS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#ff385c]" />
          Local Experts
        </div>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950 sm:text-4xl md:text-5xl">
          Meet the creators
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          Top-tier reviewers and active influencers curating Malaysia&apos;s best dining content. Unlock Local Expert status by building your reputation.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-[2rem] bg-neutral-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator, i) => (
            <CreatorCard key={creator.id} creator={creator} index={i} />
          ))}
        </div>
      )}

      <div className="mt-12 rounded-[2rem] border border-neutral-200 bg-white p-8 text-center">
        <Award className="mx-auto h-10 w-10 text-[#ff385c]" />
        <h2 className="mt-4 text-2xl font-bold">Want to become a Local Expert?</h2>
        <p className="mt-2 text-neutral-600">Post reviews, build your audience, and unlock the creator dashboard.</p>
        <Link href="/creator" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff385c] px-6 py-3 font-bold text-white shadow-lg hover:bg-[#e93252]">
          Creator Dashboard <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function CreatorCard({ creator, index }: { creator: CreatorProfile; index: number }) {
  const profile = creator.profiles;
  const username = profile?.username ?? 'creator';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        href={`/creators/${username}`}
        className="group block overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff385c]/10 to-orange-50 text-2xl font-black text-[#ff385c]">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold text-neutral-950">{profile?.full_name}</h3>
              {creator.is_local_expert && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                  Local Expert
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400">@{username}</p>
          </div>
        </div>

        {creator.bio && (
          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-neutral-600">{creator.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {creator.expertise_areas.slice(0, 3).map((area) => (
            <span key={area} className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-600">
              <MapPin className="h-3 w-3" /> {area}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-4 border-t border-neutral-100 pt-4 text-sm font-semibold text-neutral-500">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {creator.review_count} reviews</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {creator.follower_count.toLocaleString()}</span>
        </div>
      </Link>
    </motion.div>
  );
}
