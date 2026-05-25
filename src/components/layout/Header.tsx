'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, User, LogOut, LogIn, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-xl pt-safe">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/" className="group flex touch-target items-center gap-2.5 md:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff385c] shadow-[0_8px_20px_rgba(255,56,92,0.28)] transition-transform group-active:scale-95 md:h-10 md:w-10 md:rounded-[1.2rem]">
            <Sparkles className="h-4 w-4 text-white md:h-5 md:w-5" />
          </div>
          <span className="text-lg font-black uppercase italic tracking-tighter text-neutral-950 md:text-xl">
            Makanjom
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-950">Spin</Link>
          <Link href="/explore" className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-950">Explore</Link>
          <Link href="/articles" className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-950">Feed</Link>
          <Link href="/games" className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-950">Games</Link>
          <Link href="/creators" className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-950">Creators</Link>
          
          <div className="mx-1 h-6 w-px bg-neutral-100" />

          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
          ) : user ? (
            <div className="flex items-center gap-6">
              <Link href="/profile" className="touch-target rounded-full border-2 border-white bg-neutral-100 text-neutral-400 shadow-sm transition-all hover:border-[#ff385c]">
                <User size={18} />
              </Link>
              <button onClick={handleSignOut} className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-red-500 transition-colors">Sign Out</button>
            </div>
          ) : (
            <Link href="/login" className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-950 flex items-center gap-2">
              <LogIn size={14} /> Sign In
            </Link>
          )}
        </nav>

      </div>
    </header>
  );
}
