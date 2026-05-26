'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, TrendingUp, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MOCK_ARTICLES } from '@/lib/mock-data';
import type { Article } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; gradient: string }> = {
  news:           { label: 'News',   icon: Newspaper,   color: 'text-blue-700',   bg: 'bg-blue-100',   gradient: 'from-blue-50 to-sky-50' },
  trend:          { label: 'Trend',  icon: TrendingUp,  color: 'text-[#ff385c]',  bg: 'bg-rose-100',   gradient: 'from-rose-50 to-orange-50' },
  training_event: { label: 'Event',  icon: Calendar,    color: 'text-emerald-700', bg: 'bg-emerald-100', gradient: 'from-emerald-50 to-teal-50' },
};

const TABS = [
  { key: 'all',            label: 'All' },
  { key: 'trend',          label: 'Trends' },
  { key: 'news',           label: 'News' },
  { key: 'training_event', label: 'Events' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ---------------------------------------------------------------------------
// Hero article card
// ---------------------------------------------------------------------------
function HeroCard({ article }: { article: Article }) {
  const meta = TYPE_META[article.type] ?? TYPE_META.news;
  const Icon = meta.icon;
  const eventDate = article.event_date ? new Date(article.event_date) : null;

  return (
    <article className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${meta.gradient} border border-neutral-200 shadow-sm`}>
      {/* Event date badge */}
      {eventDate && (
        <div className="absolute right-6 top-6 flex flex-col items-center rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-sm ring-1 ring-neutral-200/70 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
            {eventDate.toLocaleDateString('en-MY', { month: 'short' })}
          </span>
          <span className="text-2xl font-black leading-none text-neutral-950">
            {eventDate.getDate()}
          </span>
        </div>
      )}

      <div className="p-7 sm:p-9">
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-widest ${meta.bg} ${meta.color}`}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl leading-snug">
          {article.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-base leading-relaxed text-neutral-600">
          {article.content}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            {article.profiles?.username ? (
              <Link href={`/creators/${article.profiles.username}`} className="font-bold text-[#ff385c] hover:underline">
                @{article.profiles.username}
              </Link>
            ) : (
              <span className="font-semibold">Makanjom Editorial</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {readingTime(article.content)}
            </span>
            <time>{relativeTime(article.created_at)}</time>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-neutral-950">
            Read more <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Regular article card
// ---------------------------------------------------------------------------
function ArticleCard({ article, index }: { article: Article; index: number }) {
  const meta = TYPE_META[article.type] ?? TYPE_META.news;
  const Icon = meta.icon;
  const [expanded, setExpanded] = useState(false);
  const eventDate = article.event_date ? new Date(article.event_date) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-[2rem] border border-neutral-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Colour strip by type */}
      <div className={`h-1 w-full bg-gradient-to-r ${meta.gradient.replace('from-', 'from-').replace('to-', 'to-')}`} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${meta.bg} ${meta.color}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </div>

          {/* Event date pill */}
          {eventDate && (
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.bg} ${meta.color}`}>
              <Calendar className="h-3 w-3" />
              {eventDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>

        <h2 className="text-lg font-black tracking-tight text-neutral-950 leading-snug">
          {article.title}
        </h2>

        <div className="mt-3">
          <p className={`text-sm leading-relaxed text-neutral-600 ${expanded ? '' : 'line-clamp-3'}`}>
            {article.content}
          </p>
          {article.content.split(' ').length > 30 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs font-bold text-[#ff385c] hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-50 pt-4 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            {article.profiles?.username ? (
              <Link href={`/creators/${article.profiles.username}`} className="font-bold text-[#ff385c] hover:underline">
                @{article.profiles.username}
              </Link>
            ) : (
              <span className="font-semibold text-neutral-500">Makanjom Editorial</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {readingTime(article.content)}
            </span>
          </div>
          <time>{relativeTime(article.created_at)}</time>
        </div>
      </div>
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ArticlesFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, profiles(full_name, username, avatar_url)')
          .order('created_at', { ascending: false });
        setArticles(error || !data?.length ? MOCK_ARTICLES : (data as Article[]));
      } catch {
        setArticles(MOCK_ARTICLES);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() =>
    activeTab === 'all' ? articles : articles.filter((a) => a.type === activeTab),
    [articles, activeTab]
  );

  const hero = filtered[0];
  const rest = filtered.slice(1);

  // Tab counts
  const counts = useMemo(() => ({
    all:            articles.length,
    trend:          articles.filter(a => a.type === 'trend').length,
    news:           articles.filter(a => a.type === 'news').length,
    training_event: articles.filter(a => a.type === 'training_event').length,
  }), [articles]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#ff385c]" />
          Malaysia food scene
        </div>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950 sm:text-4xl">Food feed</h1>
        <p className="mt-2 text-neutral-600">Trends, news, and events from across Malaysia.</p>
      </header>

      {/* Category tabs */}
      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto scroll-touch px-4 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition active:scale-95 min-h-11 ${
              activeTab === tab.key
                ? 'bg-neutral-950 text-white shadow-sm'
                : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-[2.5rem] bg-neutral-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-[2rem] bg-neutral-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-neutral-950">No articles yet</p>
          <p className="mt-2 text-sm text-neutral-500">Check back soon for {activeTab === 'all' ? 'content' : activeTab.replace('_', ' ')}.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {hero && <HeroCard article={hero} />}
          {rest.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
