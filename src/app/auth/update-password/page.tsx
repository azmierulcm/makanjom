'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Sparkles, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exchange the one-time code from the email link for a live session
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      // No code — maybe the user navigated here directly
      setExchanging(false);
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) setError('This link is invalid or has expired. Please request a new one.');
      })
      .finally(() => setExchanging(false));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      // Give the user a moment to read the success state then redirect
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-rose-100/40 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-amber-100/40 blur-[120px]" />
      </div>

      <Link href="/" className="mb-12 group flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] shadow-lg shadow-[#ff385c]/20 transition-transform group-hover:scale-105">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-black uppercase italic tracking-tighter text-neutral-950">
          Makanjom
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[3rem] border border-neutral-200 bg-white p-8 shadow-2xl md:p-12"
      >
        {/* Exchanging code state */}
        {exchanging && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Loader2 className="animate-spin text-[#ff385c]" size={36} />
            <p className="text-sm font-semibold text-neutral-500">Verifying your link…</p>
          </div>
        )}

        {/* Success state */}
        {!exchanging && done && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950">Password updated!</h1>
            <p className="text-sm font-medium text-neutral-500">
              Redirecting you to sign in…
            </p>
          </div>
        )}

        {/* Error — invalid / expired link */}
        {!exchanging && !done && error && !password && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950">Link expired</h1>
            <p className="text-sm font-medium leading-relaxed text-neutral-500">{error}</p>
            <Link
              href="/auth/forgot-password"
              className="mt-2 rounded-full bg-neutral-950 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-800"
            >
              Request new link
            </Link>
          </div>
        )}

        {/* Update password form */}
        {!exchanging && !done && !(error && !password) && (
          <>
            <div className="mb-8 flex flex-col items-center text-center">
              <h1 className="text-3xl font-black tracking-tight text-neutral-950">Set new password</h1>
              <p className="mt-2 text-sm font-medium text-neutral-500">
                Choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 transition-colors group-focus-within:text-[#ff385c]">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[1.5rem] border border-neutral-100 bg-neutral-50 py-4 pl-14 pr-6 text-sm font-bold outline-none transition-all focus:border-[#ff385c]/30 focus:bg-white"
                  placeholder="New password (min. 8 characters)"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 transition-colors group-focus-within:text-[#ff385c]">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-[1.5rem] border border-neutral-100 bg-neutral-50 py-4 pl-14 pr-6 text-sm font-bold outline-none transition-all focus:border-[#ff385c]/30 focus:bg-white"
                  placeholder="Confirm new password"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-neutral-800 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Update password'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
          <Loader2 className="animate-spin text-[#ff385c]" size={32} />
        </div>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  );
}
