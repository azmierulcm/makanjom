'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MOCK_CREATORS, MOCK_ARTICLES } from '@/lib/mock-data';
import { MapPin, Star, Users, Award, FileText, Loader2 } from 'lucide-react';
import type { CreatorProfile, Article } from '@/lib/types';

type ArticleRow = Pick<Article, 'id' | 'title' | 'content' | 'type' | 'created_at'>;

export default function CreatorPublicProfile({ username }: { username: string }) {
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCreator = async () => {
      setLoading(true);
      try {
        // 1. Resolve username → profile id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (profile?.id) {
          // 2. Fetch creator profile + nested profile row
          const { data: creatorData } = await supabase
            .from('creator_profiles')
            .select('*, profiles(*)')
            .eq('profile_id', profile.id)
            .maybeSingle();

          // 3. Fetch their articles
          const { data: articleData } = await supabase
            .from('articles')
            .select('id, title, content, type, created_at')
            .eq('author_id', profile.id)
            .order('created_at', { ascending: false });

          if (creatorData) {
            setCreator(creatorData as unknown as CreatorProfile);
            setArticles((articleData ?? []) as ArticleRow[]);
            return;
          }
        }
      } catch {
        // Fall through to mock data
      }

      // Fallback: check mock data (covers seed creators during development)
      const mockCreator = MOCK_CREATORS.find((c) => c.profiles?.username === username);
      if (mockCreator) {
        setCreator(mockCreator);
        setArticles(MOCK_ARTICLES.filter((a) => a.profiles?.username === username));
      } else {
        setNotFound(true);
      }
    };

    fetchCreator().finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#ff385c]" size={32} />
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl mb-4">🍽️</p>
        <h1 className="text-2xl font-bold text-neutral-950">Creator not found</h1>
        <p className="mt-2 text-neutral-500 text-sm">This profile doesn&apos;t exist or has been removed.</p>
        <Link href="/creators" className="mt-6 inline-block rounded-full bg-[#ff385c] px-6 py-3 text-sm font-bold text-white">
          Browse creators
        </Link>
      </div>
    );
  }

  return <CreatorProfileView creator={creator} articles={articles} />;
}

export function CreatorProfileView({
  creator,
  articles,
  editable = false,
}: {
  creator: CreatorProfile;
  articles: { id: string; title: string; content: string; type: string; created_at: string }[];
  editable?: boolean;
}) {
  const profile = creator.profiles;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#ff385c] to-orange-400 text-4xl font-black text-white shadow-lg">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-3xl font-bold text-neutral-950">{profile?.full_name}</h1>
              {creator.is_local_expert && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-800">
                  <Award className="h-3.5 w-3.5" /> Local Expert
                </span>
              )}
            </div>
            <p className="mt-1 text-neutral-400">@{profile?.username}</p>
            {creator.bio && <p className="mt-4 text-neutral-600 leading-relaxed">{creator.bio}</p>}

            <div className="mt-6 flex flex-wrap justify-center gap-4 sm:justify-start">
              <Stat icon={<Star className="h-4 w-4" />} label="Reviews" value={creator.review_count} />
              <Stat icon={<Users className="h-4 w-4" />} label="Followers" value={creator.follower_count} />
              <Stat icon={<Award className="h-4 w-4" />} label="Points" value={profile?.gamification_points ?? 0} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <ExpertiseBlock title="Neighborhoods" items={creator.expertise_areas} icon={<MapPin className="h-4 w-4" />} />
          <ExpertiseBlock title="Cuisines" items={creator.expertise_cuisines} icon={<Star className="h-4 w-4" />} />
        </div>

        {editable && (
          <Link
            href="/creator"
            className="mt-6 inline-flex rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-black"
          >
            Edit profile in dashboard
          </Link>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <FileText className="h-5 w-5 text-[#ff385c]" /> Published content
        </h2>
        {articles.length === 0 ? (
          <p className="text-neutral-500">No articles yet.</p>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href="/articles"
                className="block rounded-2xl border border-neutral-100 bg-white p-5 transition hover:border-[#ff385c]/20 hover:shadow-sm"
              >
                <span className="text-xs font-black uppercase tracking-wider text-[#ff385c]">{article.type}</span>
                <h3 className="mt-1 font-bold text-neutral-950">{article.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{article.content}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-2">
      <span className="text-[#ff385c]">{icon}</span>
      <div>
        <p className="text-lg font-bold text-neutral-950">{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</p>
        <p className="text-xs font-semibold text-neutral-400">{label}</p>
      </div>
    </div>
  );
}

function ExpertiseBlock({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-5">
      <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400">
        {icon} {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
