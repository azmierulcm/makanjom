'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Sparkles, ArrowRight, ChefHat, User, ShieldCheck, Mail, Lock, Loader2, Store } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [role, setRole] = useState<'customer' | 'vendor' | 'creator'>('customer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectParam = searchParams.get('redirect');

    const getRoleDashboard = (role: string) => {
        const map: Record<string, string> = {
            admin: '/admin',
            vendor: '/vendor',
            creator: '/creator',
            customer: '/profile',
        };
        return map[role] ?? '/profile';
    };

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                const role = profile?.role ?? session.user.user_metadata?.role ?? 'customer';
                router.push(getRoleDashboard(role));
            }
        };
        checkSession();
    }, [router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signin') {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                const { data: { user: authedUser } } = await supabase.auth.getUser();
                if (authedUser) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', authedUser.id)
                        .single();
                    const role = profile?.role ?? authedUser.user_metadata?.role ?? 'customer';
                    router.push(redirectParam ?? getRoleDashboard(role));
                }
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { role, full_name: email.split('@')[0] }
                    }
                });
                if (signUpError) throw signUpError;
                if (data.session) {
                    // Email confirmation disabled — session created immediately, redirect to dashboard
                    router.push(getRoleDashboard(role));
                } else if (data.user) {
                    // Email confirmation required
                    setError("Account created! Check your email to verify, then sign in.");
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-rose-100/40 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[120px]" />
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
                className="w-full max-w-md bg-white p-8 md:p-12 rounded-[3rem] border border-neutral-200 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="flex gap-2 p-1 bg-neutral-100 rounded-full mb-8">
                        <button 
                            onClick={() => setMode('signin')}
                            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'signin' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => setMode('signup')}
                            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'signup' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                        >
                            Register
                        </button>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-neutral-950">
                        {mode === 'signin' ? 'Welcome back' : 'Start your journey'}
                    </h1>
                    <p className="text-neutral-500 text-sm mt-2 font-medium">
                        {mode === 'signin' ? 'Access your Makanjom dashboard' : 'Join the biggest food discovery platform'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="space-y-2 mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 text-left mb-3">I am a…</p>
                            {([
                                { value: 'customer', icon: <User size={18} />, label: 'Food Explorer', desc: 'Discover restaurants, spin for picks, earn badges' },
                                { value: 'vendor',   icon: <Store size={18} />, label: 'Restaurant Owner', desc: 'Manage your listing, orders & reservations' },
                                { value: 'creator',  icon: <ChefHat size={18} />, label: 'Content Creator', desc: 'Build your food brand and publish reviews' },
                            ] as const).map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${role === r.value ? 'border-[#ff385c] bg-rose-50' : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200'}`}
                                >
                                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${role === r.value ? 'bg-[#ff385c] text-white' : 'bg-white text-neutral-400'}`}>
                                        {r.icon}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-widest ${role === r.value ? 'text-[#ff385c]' : 'text-neutral-700'}`}>{r.label}</p>
                                        <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{r.desc}</p>
                                    </div>
                                    <div className={`ml-auto shrink-0 w-4 h-4 rounded-full border-2 transition-all ${role === r.value ? 'border-[#ff385c] bg-[#ff385c]' : 'border-neutral-200'}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-[#ff385c] transition-colors">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-sm font-bold outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all" 
                            placeholder="Email address"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-[#ff385c] transition-colors">
                            <Lock size={18} />
                        </div>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-sm font-bold outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all" 
                            placeholder="Password"
                        />
                    </div>

                    {error && (
                        <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed border ${error.includes('Success') ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-5 bg-neutral-950 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : (
                            <>
                                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-neutral-50 text-center">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        <ShieldCheck size={14} /> Secured by Makanjom Auth
                    </div>
                </div>
            </motion.div>

            <p className="mt-8 text-neutral-400 text-xs font-medium max-w-xs text-center leading-relaxed">
                By continuing, you agree to Makanjom&apos;s Terms of Service and Privacy Policy.
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#faf9f7]"><Loader2 className="animate-spin text-[#ff385c]" size={32} /></div>}>
            <LoginForm />
        </Suspense>
    );
}
