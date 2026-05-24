'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MOCK_ARTICLES } from '@/lib/mock-data';
import type { Article } from '@/lib/types';

export default function ArticlesFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-950">Food feed</h1>
        <p className="mt-2 text-neutral-600">Trends, news, and creator content from across Malaysia.</p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-neutral-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <article key={article.id} className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <span className="text-xs font-black uppercase tracking-wider text-[#ff385c]">{article.type.replace('_', ' ')}</span>
              <h2 className="mt-2 text-xl font-bold text-neutral-950">{article.title}</h2>
              <p className="mt-3 text-neutral-600 leading-relaxed">{article.content}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                {article.profiles?.username ? (
                  <Link href={`/creators/${article.profiles.username}`} className="font-semibold text-[#ff385c] hover:underline">
                    @{article.profiles.username}
                  </Link>
                ) : (
                  <span className="text-neutral-400">Makanjom Editorial</span>
                )}
                <time className="text-neutral-400">{new Date(article.created_at).toLocaleDateString()}</time>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
