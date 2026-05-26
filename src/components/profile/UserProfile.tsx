'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Zap,
  Heart,
  History,
  Gamepad2,
  Pencil,
  X,
  Check,
  LogOut,
  Loader2,
  User,
  AtSign,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getGamificationState, getLevel } from '@/lib/gamification';

interface Profile {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gamification_points: number;
  badges: { id: string; name: string }[];
}

interface EditForm {
  full_name: string;
  username: string;
  avatar_url: string;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [localPoints, setLocalPoints] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({ full_name: '', username: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email ?? null);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data as Profile);
        setForm({
          full_name: data.full_name ?? '',
          username: data.username ?? '',
          avatar_url: data.avatar_url ?? '',
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    const state = getGamificationState();
    setLocalPoints(state.points);
    setSpinCount(state.spinHistory.length);
    setSavedCount(state.savedRestaurants.length);
    setBadgeCount(state.badges.length);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const username = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || null;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim() || null,
        username,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq('id', user.id);

    if (error) {
      setSaveError(
        error.message.includes('unique') || error.message.includes('profiles_username_key')
          ? 'That username is already taken.'
          : error.message
      );
      setSaving(false);
      return;
    }

    setSaveSuccess(true);
    setEditing(false);
    await fetchProfile();
    setSaving(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const openEdit = () => {
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
    setForm({
      full_name: profile?.full_name ?? '',
      username: profile?.username ?? '',
      avatar_url: profile?.avatar_url ?? '',
    });
  };

  const totalPoints = (profile?.gamification_points ?? 0) + localPoints;
  const level = getLevel(totalPoints);
  const displayName = profile?.full_name ?? profile?.username ?? 'Food Explorer';
  const initials = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff385c]/20 border-t-[#ff385c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Profile Header */}
      <section className="border-b border-neutral-100 bg-white px-6 py-10 md:rounded-b-[4rem] md:py-14 md:shadow-sm">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 md:flex-row md:gap-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-36 w-36 rounded-[3rem] bg-neutral-100 p-1.5 shadow-xl shadow-[#ff385c]/10 md:h-44 md:w-44">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[2.7rem] bg-white">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-neutral-200">{initials}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-4 border-white bg-white shadow-lg">
              <Zap className="fill-[#ff385c] text-[#ff385c]" size={20} />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter text-neutral-900 md:text-5xl">
                {displayName}
              </h2>
              {profile?.username && (
                <p className="mt-1 text-sm font-bold text-neutral-400">@{profile.username}</p>
              )}
              {email && (
                <p className="mt-0.5 text-xs text-neutral-400 font-medium">{email}</p>
              )}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-white">
              <ShieldCheck size={13} className="text-[#ff385c]" /> {level.title}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mx-auto mt-8 flex max-w-2xl gap-3">
          <button
            onClick={openEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3.5 text-xs font-black uppercase tracking-widest text-neutral-700 transition-all active:scale-95 hover:bg-neutral-200"
          >
            <Pencil size={14} /> Edit Profile
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-xs font-black uppercase tracking-widest text-neutral-500 transition-all active:scale-95 hover:border-red-200 hover:text-red-500"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </section>

      <main className="mx-auto mt-8 max-w-2xl space-y-6 px-6">
        {/* Edit Panel */}
        <AnimatePresence>
          {editing && (
            <motion.div
              key="edit-panel"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-[2.5rem] border border-[#ff385c]/20 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight text-neutral-950">Edit Profile</h3>
                  <button
                    onClick={cancelEdit}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <Field
                    icon={<User size={16} />}
                    label="Full Name"
                    type="text"
                    value={form.full_name}
                    placeholder="Your display name"
                    onChange={(v) => setForm(f => ({ ...f, full_name: v }))}
                  />
                  <Field
                    icon={<AtSign size={16} />}
                    label="Username"
                    type="text"
                    value={form.username}
                    placeholder="e.g. foodlover99"
                    hint="Lowercase letters, numbers, underscores only."
                    onChange={(v) => setForm(f => ({ ...f, username: v }))}
                  />
                  <Field
                    icon={<ImageIcon size={16} />}
                    label="Avatar URL"
                    type="url"
                    value={form.avatar_url}
                    placeholder="https://..."
                    hint="Paste a direct image link."
                    onChange={(v) => setForm(f => ({ ...f, avatar_url: v }))}
                  />
                </div>

                {saveError && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
                    <AlertCircle size={15} className="shrink-0" />
                    {saveError}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-950 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <><Check size={15} /> Save Changes</>
                    )}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-500 transition-all active:scale-95 hover:border-neutral-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success toast */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-xs font-bold text-emerald-700"
            >
              <Check size={15} className="shrink-0 text-emerald-500" />
              Profile updated successfully!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats — 2×2 grid */}
        <section className="grid grid-cols-2 gap-4">
          <StatBox label="Points"  value={totalPoints} color="text-[#ff385c]" />
          <StatBox label="Badges"  value={badgeCount}  color="text-amber-500" />
          <StatBox label="Spins"   value={spinCount}   color="text-sky-500" />
          <StatBox label="Saves"   value={savedCount}  color="text-emerald-500" />
        </section>

        {/* Rank Progress */}
        <section className="rounded-[3rem] border border-neutral-100 bg-white p-8 shadow-sm md:p-10">
          <div className="mb-6 flex items-end justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-[#ff385c]" />
              <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Rank Progress</p>
            </div>
            <p className="text-sm font-bold text-neutral-950">{level.next}</p>
          </div>
          <div className="mb-6 h-5 w-full overflow-hidden rounded-full bg-neutral-50 p-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${level.progress}%` }}
              transition={{ duration: 1.8, ease: 'circOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#ff385c] to-[#ffb347] shadow-[0_0_15px_rgba(255,56,92,0.4)]"
            />
          </div>
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            {level.remaining > 0
              ? `Earn ${level.remaining} more points to level up`
              : 'Maximum rank achieved!'}
          </p>
        </section>

        {/* Navigation Links */}
        <section className="overflow-hidden rounded-[3rem] border border-neutral-100 bg-white shadow-sm">
          <MenuLink icon={<Heart size={20} />} label="Saved Destinations" count={savedCount} href="/profile/saved" />
          <MenuLink icon={<History size={20} />} label="Spin History" count={spinCount} href="/profile/history" />
          <MenuLink icon={<Award size={20} />} label="Achievement Gallery" href="/badges" />
          <MenuLink icon={<Gamepad2 size={20} />} label="Mini-Games" href="/games" last />
        </section>
      </main>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  placeholder,
  hint,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block px-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-[#ff385c] transition-colors">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 py-3.5 pl-10 pr-4 text-sm font-bold text-neutral-900 outline-none transition-all focus:border-[#ff385c]/30 focus:bg-white"
        />
      </div>
      {hint && (
        <p className="mt-1.5 px-1 text-[10px] font-medium text-neutral-400">{hint}</p>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-[3rem] border border-neutral-100 bg-white p-8 text-center shadow-sm">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{label}</p>
      <p className={`text-4xl font-black tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function MenuLink({
  icon,
  label,
  count,
  href,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  href: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-between p-7 transition-colors hover:bg-neutral-50 ${!last ? 'border-b border-neutral-50' : ''}`}
    >
      <div className="flex items-center gap-5">
        <div className="text-neutral-400">{icon}</div>
        <span className="font-bold tracking-tight text-neutral-900">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {count !== undefined && (
          <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-black text-neutral-300">
            {count}
          </span>
        )}
        <ChevronRight size={18} className="text-neutral-200" />
      </div>
    </Link>
  );
}
