'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Sparkles, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/auth/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
        {sent ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950">Check your inbox</h1>
            <p className="text-sm font-medium leading-relaxed text-neutral-500">
              We sent a password reset link to <span className="font-bold text-neutral-700">{email}</span>.
              It expires in 1 hour.
            </p>
            <p className="text-xs text-neutral-400">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setError(null); }}
                className="font-bold text-[#ff385c] hover:underline"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center text-center">
              <h1 className="text-3xl font-black tracking-tight text-neutral-950">Forgot password?</h1>
              <p className="mt-2 text-sm font-medium text-neutral-500">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 transition-colors group-focus-within:text-[#ff385c]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[1.5rem] border border-neutral-100 bg-neutral-50 py-4 pl-14 pr-6 text-sm font-bold outline-none transition-all focus:border-[#ff385c]/30 focus:bg-white"
                  placeholder="Email address"
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
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send reset link'}
              </button>
            </form>

            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
