'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';
import { ChevronLeft, Shuffle, Clock } from 'lucide-react';
import { getGamificationState } from '@/lib/gamification';
import type { SpinRecord } from '@/lib/types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

export default function SpinHistoryPage() {
  const [history, setHistory] = useState<SpinRecord[]>([]);

  useEffect(() => {
    setHistory(getGamificationState().spinHistory);
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950"
        >
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>

        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
            <Shuffle className="h-3.5 w-3.5 text-[#ff385c]" />
            Spin history
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950 sm:text-4xl">
            Your spin history
          </h1>
          <p className="mt-2 text-neutral-500">Every restaurant fate has chosen for you.</p>
        </header>

        {history.length === 0 ? (
          <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-12 text-center shadow-sm">
            <Shuffle className="mx-auto mb-4 h-10 w-10 text-neutral-200" />
            <p className="text-lg font-semibold text-neutral-950">No spins yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Head to the home page and let fate pick your next meal.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff385c] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#e93252]"
            >
              <Shuffle className="h-4 w-4" /> Spin now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record, i) => (
              <Link
                key={record.id}
                href={`/restaurants/${record.restaurant_id}`}
                className="flex items-center gap-4 rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 text-xl font-bold text-[#ff385c]">
                  #{history.length - i}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-neutral-950">{record.restaurant_name}</p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    Craving: <span className="font-medium text-neutral-700">{record.craving}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-neutral-400">
                  <Clock className="h-3.5 w-3.5" />
                  {relativeTime(record.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
