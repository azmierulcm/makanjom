'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Maps Supabase email link types to the right post-confirm destination
const REDIRECT_MAP: Record<string, string> = {
  signup: '/profile',
  recovery: '/auth/update-password',
  invite: '/profile',
  email_change: '/profile',
  magiclink: '/profile',
};

function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as Parameters<typeof supabase.auth.verifyOtp>[0]['type'] | null;

    if (!tokenHash || !type) {
      setErrorMsg('Invalid confirmation link. Please try signing up again.');
      setStatus('error');
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }) => {
        if (error) {
          setErrorMsg(error.message.includes('expired')
            ? 'This link has expired. Please request a new one.'
            : error.message);
          setStatus('error');
          return;
        }
        setStatus('success');
        const destination = REDIRECT_MAP[type] ?? '/profile';
        // Small delay so the user sees the success state
        setTimeout(() => router.push(destination), 1800);
      });
  }, [searchParams, router]);

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

      <div className="w-full max-w-md rounded-[3rem] border border-neutral-200 bg-white p-8 shadow-2xl md:p-12">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Loader2 className="animate-spin text-[#ff385c]" size={36} />
            <h1 className="text-2xl font-black tracking-tight text-neutral-950">Verifying…</h1>
            <p className="text-sm font-medium text-neutral-500">Confirming your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950">Email confirmed!</h1>
            <p className="text-sm font-medium text-neutral-500">Taking you to your dashboard…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950">Verification failed</h1>
            <p className="text-sm font-medium leading-relaxed text-neutral-500">{errorMsg}</p>
            <div className="mt-2 flex flex-col gap-3 w-full">
              <Link
                href="/login"
                className="flex items-center justify-center rounded-full bg-neutral-950 px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-800"
              >
                Back to sign in
              </Link>
              <Link
                href="/auth/forgot-password"
                className="flex items-center justify-center rounded-full border border-neutral-200 px-6 py-4 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Request new link
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
          <Loader2 className="animate-spin text-[#ff385c]" size={32} />
        </div>
      }
    >
      <ConfirmHandler />
    </Suspense>
  );
}
