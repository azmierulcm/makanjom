'use client';

import { useState, useEffect } from 'react';
import { Save, User, MapPin, Utensils, Award, LogOut, ShieldAlert } from 'lucide-react';
import { MOCK_CREATORS } from '@/lib/mock-data';
import { CreatorProfileView } from './CreatorPublicProfile';
import { supabase } from '@/lib/supabase';
import type { CreatorProfile } from '@/lib/types';

export default function CreatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [areas, setAreas] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [saved, setSaved] = useState(false);
  const [realCreator, setRealCreator] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setRole(profile?.role || null);

        const { data: creatorData } = await supabase.from('creator_profiles').select('*, profiles(*)').eq('profile_id', user.id).single();
        if (creatorData) {
            setRealCreator(creatorData as CreatorProfile);
            setBio(creatorData.bio ?? '');
            setAreas(creatorData.expertise_areas?.join(', ') ?? '');
            setCuisines(creatorData.expertise_cuisines?.join(', ') ?? '');
        } else {
            setBio(MOCK_CREATORS[0].bio ?? '');
            setAreas(MOCK_CREATORS[0].expertise_areas.join(', '));
            setCuisines(MOCK_CREATORS[0].expertise_cuisines.join(', '));
        }
      } else {
        window.location.href = '/login?redirect=/creator';
      }
      setAuthLoading(false);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const creator = {
    ...MOCK_CREATORS[0],
    id: realCreator?.id || MOCK_CREATORS[0].id,
    bio,
    expertise_areas: areas.split(',').map((s) => s.trim()).filter(Boolean),
    expertise_cuisines: cuisines.split(',').map((s) => s.trim()).filter(Boolean),
  };

  const handleSave = async () => {
    if (!user) return;
    setSaved(true);

    await supabase.from('creator_profiles').upsert({
        profile_id: user.id,
        bio,
        expertise_areas: creator.expertise_areas,
        expertise_cuisines: creator.expertise_cuisines
    });

    setTimeout(() => setSaved(false), 2000);
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" /></div>;

  if (role !== 'creator' && role !== 'admin') return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-6 text-center">
          <div className="max-w-md">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert size={32} className="text-[#ff385c]" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 mb-4">Creator Status Required</h2>
              <p className="text-neutral-500 mb-8">This dashboard is for registered Makanjom Creators. Please update your profile role to access these tools.</p>
              <button onClick={handleSignOut} className="px-8 py-3 bg-neutral-950 text-white rounded-full font-bold text-sm">Sign Out</button>
          </div>
      </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <div className="mb-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#ff385c]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#ff385c]">Creator Hub</span>
          </div>
          <button onClick={handleSignOut} className="text-[10px] font-black text-neutral-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"><LogOut size={12}/> Sign Out</button>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-950">Your dashboard</h1>
        <p className="mt-2 text-neutral-600">Curate your profile, showcase your expertise, and drive the platform&apos;s content.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <section className="space-y-6 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold text-neutral-950">
            <User className="h-5 w-5" /> Edit profile
          </h2>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-neutral-200 p-4 text-sm focus:border-[#ff385c]/40 focus:outline-none focus:ring-2 focus:ring-[#ff385c]/10"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
              <MapPin className="h-3 w-3" /> Expertise areas
            </span>
            <input
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
              placeholder="Bangsar, TTDI, KLCC"
              className="mt-2 w-full rounded-2xl border border-neutral-200 p-4 text-sm focus:border-[#ff385c]/40 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
              <Utensils className="h-3 w-3" /> Expertise cuisines
            </span>
            <input
              value={cuisines}
              onChange={(e) => setCuisines(e.target.value)}
              placeholder="Malay, Mamak, Cafe"
              className="mt-2 w-full rounded-2xl border border-neutral-200 p-4 text-sm focus:border-[#ff385c]/40 focus:outline-none"
            />
          </label>

          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] py-3 font-bold text-white hover:bg-[#e93252]"
          >
            <Save className="h-4 w-4" />
            {saved ? 'Saved!' : 'Save changes'}
          </button>

          <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
            <p className="text-xs font-black uppercase text-amber-700">Local Expert status</p>
            <p className="mt-1 text-sm text-amber-900">
              You&apos;re verified for {creator.expertise_areas.length} neighborhoods. Keep reviewing to grow your reach.
            </p>
          </div>
        </section>

        <div>
          <p className="mb-4 text-sm font-semibold text-neutral-400 uppercase tracking-wider">Profile preview</p>
          <CreatorProfileView creator={creator} articles={[]} editable />
        </div>
      </div>
    </div>
  );
}
