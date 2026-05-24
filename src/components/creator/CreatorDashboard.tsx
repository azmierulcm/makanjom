'use client';

import { useState } from 'react';
import { Save, User, MapPin, Utensils, Award } from 'lucide-react';
import { MOCK_CREATORS } from '@/lib/mock-data';
import { CreatorProfileView } from './CreatorPublicProfile';

export default function CreatorDashboard() {
  const [bio, setBio] = useState(MOCK_CREATORS[0].bio ?? '');
  const [areas, setAreas] = useState(MOCK_CREATORS[0].expertise_areas.join(', '));
  const [cuisines, setCuisines] = useState(MOCK_CREATORS[0].expertise_cuisines.join(', '));
  const [saved, setSaved] = useState(false);

  const creator = {
    ...MOCK_CREATORS[0],
    bio,
    expertise_areas: areas.split(',').map((s) => s.trim()).filter(Boolean),
    expertise_cuisines: cuisines.split(',').map((s) => s.trim()).filter(Boolean),
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          <Award className="h-5 w-5 text-[#ff385c]" />
          <span className="text-xs font-black uppercase tracking-widest text-[#ff385c]">Creator Hub</span>
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
