'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, LogOut, User, MapPin, Utensils, FileText, Eye,
  Plus, X, Save, Loader2, Check, AlertCircle, ImageIcon,
  AtSign, Star, Users, Zap, Pencil, ChevronDown, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Tab = 'profile' | 'content' | 'preview';
type ArticleType = 'news' | 'trend' | 'training_event';

interface ProfileRow {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gamification_points: number;
}

interface CreatorRow {
  id: string;
  bio: string | null;
  expertise_areas: string[];
  expertise_cuisines: string[];
  is_local_expert: boolean;
  review_count: number;
  follower_count: number;
}

interface Article {
  id: string;
  title: string;
  content: string;
  type: ArticleType;
  event_date: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<ArticleType, string> = {
  news: 'News',
  trend: 'Trend',
  training_event: 'Event',
};

const TYPE_COLORS: Record<ArticleType, string> = {
  news: 'bg-blue-50 text-blue-700 border-blue-100',
  trend: 'bg-rose-50 text-rose-700 border-rose-100',
  training_event: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function CreatorDashboard() {
  const [tab, setTab] = useState<Tab>('profile');
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [creator, setCreator] = useState<CreatorRow | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '', username: '', avatar_url: '', bio: '',
  });
  const [areaInput, setAreaInput] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [cuisineInput, setCuisineInput] = useState('');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [articleForm, setArticleForm] = useState<{ title: string; content: string; type: ArticleType; event_date: string }>({
    title: '', content: '', type: 'trend', event_date: '',
  });
  const [articleSaving, setArticleSaving] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const loadData = async (uid: string) => {
    const [{ data: profileData }, { data: creatorData }, { data: articlesData }] = await Promise.all([
      supabase.from('profiles').select('full_name, username, avatar_url, gamification_points').eq('id', uid).single(),
      supabase.from('creator_profiles').select('*').eq('profile_id', uid).single(),
      supabase.from('articles').select('*').eq('author_id', uid).order('created_at', { ascending: false }),
    ]);

    if (profileData) {
      setProfile(profileData as ProfileRow);
      setProfileForm(f => ({
        ...f,
        full_name: profileData.full_name ?? '',
        username: profileData.username ?? '',
        avatar_url: profileData.avatar_url ?? '',
      }));
    }

    if (creatorData) {
      setCreator(creatorData as CreatorRow);
      setProfileForm(f => ({ ...f, bio: creatorData.bio ?? '' }));
      setAreas(creatorData.expertise_areas ?? []);
      setCuisines(creatorData.expertise_cuisines ?? []);
    }

    if (articlesData) setArticles(articlesData as Article[]);
    setArticlesLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        window.location.href = '/login?redirect=/creator';
        return;
      }
      setUserId(user.id);
      setAuthLoading(false);

      // Ensure profile role is 'creator' — fixes accounts created while trigger was broken
      await supabase.from('profiles').upsert(
        { id: user.id, role: 'creator' },
        { onConflict: 'id' }
      );

      loadData(user.id);
    });
  }, []);

  // ─── Profile save ─────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!userId) return;
    setProfileSaving(true);
    setProfileError(null);

    const username = profileForm.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || null;

    const [profileResult, creatorResult] = await Promise.all([
      supabase.from('profiles').update({
        full_name: profileForm.full_name.trim() || null,
        username,
        avatar_url: profileForm.avatar_url.trim() || null,
      }).eq('id', userId),

      supabase.from('creator_profiles').upsert({
        profile_id: userId,
        bio: profileForm.bio.trim() || null,
        expertise_areas: areas,
        expertise_cuisines: cuisines,
      }, { onConflict: 'profile_id' }),
    ]);

    const err = profileResult.error || creatorResult.error;
    if (err) {
      setProfileError(
        err.message.includes('unique') || err.message.includes('username')
          ? 'That username is already taken.'
          : err.message
      );
    } else {
      setProfileSuccess(true);
      loadData(userId);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileSaving(false);
  };

  // ─── Article publish ──────────────────────────────────────────────────────

  const publishArticle = async () => {
    if (!userId || !articleForm.title.trim() || !articleForm.content.trim()) return;
    setArticleSaving(true);
    setArticleError(null);

    const { error } = await supabase.from('articles').insert({
      author_id: userId,
      title: articleForm.title.trim(),
      content: articleForm.content.trim(),
      type: articleForm.type,
      event_date: articleForm.type === 'training_event' && articleForm.event_date ? articleForm.event_date : null,
    });

    if (error) {
      setArticleError(error.message);
    } else {
      setComposing(false);
      setArticleForm({ title: '', content: '', type: 'trend', event_date: '' });
      if (userId) {
        const { data } = await supabase.from('articles').select('*').eq('author_id', userId).order('created_at', { ascending: false });
        if (data) setArticles(data as Article[]);
      }
    }
    setArticleSaving(false);
  };

  const deleteArticle = async (id: string) => {
    await supabase.from('articles').delete().eq('id', id);
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // ─── Chip helpers ─────────────────────────────────────────────────────────

  const addChip = (value: string, list: string[], setter: (v: string[]) => void, inputSetter: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setter([...list, trimmed]);
    inputSetter('');
  };

  const removeChip = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.filter(i => i !== item));
  };

  // ─── Render guards ────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="w-8 h-8 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.full_name ?? profile?.username ?? 'Creator';
  const initials = displayName.charAt(0).toUpperCase();

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-32">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 px-5 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-full border border-rose-100">
              <Award size={13} className="text-[#ff385c]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff385c]">Creator Hub</span>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-[#ff385c] to-orange-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-[#ff385c]/20 shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-[1.2rem]" />
                : initials}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-950">{displayName}</h1>
              {profile?.username && (
                <p className="text-sm text-neutral-400 font-medium">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatChip icon={<FileText size={13} />} label="Articles" value={articles.length} />
            <StatChip icon={<Users size={13} />} label="Followers" value={creator?.follower_count ?? 0} />
            <StatChip icon={<Zap size={13} />} label="Points" value={profile?.gamification_points ?? 0} />
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-100 px-5">
        <div className="max-w-2xl mx-auto flex gap-1">
          {(['profile', 'content', 'preview'] as Tab[]).map((t) => {
            const icons = { profile: <User size={14} />, content: <FileText size={14} />, preview: <Eye size={14} /> };
            const labels = { profile: 'Profile', content: 'Content', preview: 'Preview' };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  tab === t ? 'border-[#ff385c] text-[#ff385c]' : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {icons[t]} {labels[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-5 mt-6">
        <AnimatePresence mode="wait">
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              <ProfileTab
                form={profileForm}
                setForm={setProfileForm}
                areas={areas}
                areaInput={areaInput}
                setAreaInput={setAreaInput}
                onAddArea={() => addChip(areaInput, areas, setAreas, setAreaInput)}
                onRemoveArea={(a) => removeChip(a, areas, setAreas)}
                cuisines={cuisines}
                cuisineInput={cuisineInput}
                setCuisineInput={setCuisineInput}
                onAddCuisine={() => addChip(cuisineInput, cuisines, setCuisines, setCuisineInput)}
                onRemoveCuisine={(c) => removeChip(c, cuisines, setCuisines)}
                onSave={saveProfile}
                saving={profileSaving}
                error={profileError}
                success={profileSuccess}
                isLocalExpert={creator?.is_local_expert ?? false}
              />
            </motion.div>
          )}

          {tab === 'content' && (
            <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              <ContentTab
                articles={articles}
                loading={articlesLoading}
                composing={composing}
                setComposing={setComposing}
                form={articleForm}
                setForm={setArticleForm}
                onPublish={publishArticle}
                saving={articleSaving}
                error={articleError}
                onDelete={deleteArticle}
              />
            </motion.div>
          )}

          {tab === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              <PreviewTab
                displayName={displayName}
                username={profile?.username ?? null}
                avatarUrl={profile?.avatar_url ?? null}
                bio={profileForm.bio}
                areas={areas}
                cuisines={cuisines}
                points={profile?.gamification_points ?? 0}
                reviewCount={creator?.review_count ?? 0}
                followerCount={creator?.follower_count ?? 0}
                isLocalExpert={creator?.is_local_expert ?? false}
                articles={articles}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

type ProfileForm = { full_name: string; username: string; avatar_url: string; bio: string };

function ProfileTab({
  form, setForm,
  areas, areaInput, setAreaInput, onAddArea, onRemoveArea,
  cuisines, cuisineInput, setCuisineInput, onAddCuisine, onRemoveCuisine,
  onSave, saving, error, success, isLocalExpert,
}: {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  areas: string[]; areaInput: string; setAreaInput: (v: string) => void;
  onAddArea: () => void; onRemoveArea: (a: string) => void;
  cuisines: string[]; cuisineInput: string; setCuisineInput: (v: string) => void;
  onAddCuisine: () => void; onRemoveCuisine: (c: string) => void;
  onSave: () => void; saving: boolean; error: string | null; success: boolean;
  isLocalExpert: boolean;
}) {
  return (
    <div className="space-y-5 pb-8">
      {isLocalExpert && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
          <Star size={15} className="text-amber-500 fill-amber-400 shrink-0" />
          <p className="text-xs font-bold text-amber-800">Local Expert — your reviews carry extra weight on the platform.</p>
        </div>
      )}

      {/* Identity */}
      <Card title="Identity" icon={<User size={15} />}>
        <Field label="Full Name" icon={<User size={14} />} value={form.full_name} placeholder="Your display name"
          onChange={v => setForm(f => ({ ...f, full_name: v }))} />
        <Field label="Username" icon={<AtSign size={14} />} value={form.username} placeholder="e.g. foodlover99"
          hint="Lowercase letters, numbers, underscores only."
          onChange={v => setForm(f => ({ ...f, username: v }))} />
        <Field label="Avatar URL" icon={<ImageIcon size={14} />} value={form.avatar_url} placeholder="https://..."
          hint="Paste a direct image link."
          onChange={v => setForm(f => ({ ...f, avatar_url: v }))} />
      </Card>

      {/* Bio */}
      <Card title="Bio" icon={<Pencil size={15} />}>
        <label>
          <span className="block mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">About you</span>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={4}
            maxLength={300}
            placeholder="Tell the community about your food journey…"
            className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-900 outline-none resize-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
          />
          <p className="mt-1 text-right text-[10px] font-medium text-neutral-300">{form.bio.length}/300</p>
        </label>
      </Card>

      {/* Expertise areas */}
      <Card title="Neighborhoods" icon={<MapPin size={15} />}>
        <ChipInput
          chips={areas}
          inputValue={areaInput}
          onInputChange={setAreaInput}
          onAdd={onAddArea}
          onRemove={onRemoveArea}
          placeholder="Add a neighborhood…"
        />
      </Card>

      {/* Expertise cuisines */}
      <Card title="Cuisines" icon={<Utensils size={15} />}>
        <ChipInput
          chips={cuisines}
          inputValue={cuisineInput}
          onInputChange={setCuisineInput}
          onAdd={onAddCuisine}
          onRemove={onRemoveCuisine}
          placeholder="Add a cuisine…"
        />
      </Card>

      {/* Feedback */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
            <Check size={14} className="shrink-0" /> Profile saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 bg-neutral-950 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-neutral-800 disabled:opacity-50"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Save Changes</>}
      </button>
    </div>
  );
}

// ─── Content Tab ──────────────────────────────────────────────────────────────

type ArticleForm = { title: string; content: string; type: ArticleType; event_date: string };

function ContentTab({
  articles, loading, composing, setComposing, form, setForm,
  onPublish, saving, error, onDelete,
}: {
  articles: Article[]; loading: boolean;
  composing: boolean; setComposing: (v: boolean) => void;
  form: ArticleForm;
  setForm: React.Dispatch<React.SetStateAction<ArticleForm>>;
  onPublish: () => void; saving: boolean; error: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-5 pb-8">
      {/* Compose */}
      {!composing ? (
        <button
          onClick={() => setComposing(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-neutral-200 rounded-[2rem] text-xs font-black uppercase tracking-widest text-neutral-400 hover:border-[#ff385c]/40 hover:text-[#ff385c] hover:bg-rose-50/30 transition-all"
        >
          <Plus size={15} strokeWidth={3} /> Write New Article
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card title="New Article" icon={<Pencil size={15} />}>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  placeholder="Your article headline…"
                  className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-900 outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">Type</label>
                <div className="flex gap-2">
                  {(['trend', 'news', 'training_event'] as ArticleType[]).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        form.type === t ? TYPE_COLORS[t] : 'border-neutral-100 bg-neutral-50 text-neutral-400'
                      }`}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'training_event' && (
                <div>
                  <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">Event Date</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-900 outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={6}
                  maxLength={5000}
                  placeholder="Share your food knowledge with the community…"
                  className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-900 outline-none resize-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
                />
                <p className="mt-1 text-right text-[10px] font-medium text-neutral-300">{form.content.length}/5000</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onPublish} disabled={saving || !form.title.trim() || !form.content.trim()}
                  className="flex flex-1 items-center justify-center gap-2 py-4 bg-[#ff385c] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-[#ff385c]/20 active:scale-95 transition-all hover:bg-[#e93252] disabled:opacity-40">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Publish</>}
                </button>
                <button onClick={() => { setComposing(false); setForm({ title: '', content: '', type: 'trend', event_date: '' }); }}
                  className="px-6 py-4 border border-neutral-200 rounded-full text-xs font-black uppercase tracking-widest text-neutral-500 hover:border-neutral-300 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Articles list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-[2rem] animate-pulse border border-neutral-100" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-white rounded-[1.5rem] border border-neutral-100 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-neutral-200" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-neutral-300">No articles published yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-[2rem] border border-neutral-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className={`inline-block mb-2 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${TYPE_COLORS[article.type]}`}>
                    {TYPE_LABELS[article.type]}
                  </span>
                  <h3 className="font-bold text-sm text-neutral-950 leading-snug line-clamp-2">{article.title}</h3>
                  <p className="mt-1.5 text-xs text-neutral-400 line-clamp-2 font-medium leading-relaxed">{article.content}</p>
                  <p className="mt-2 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                    {new Date(article.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => onDelete(article.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-50 hover:bg-red-50 text-neutral-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preview Tab ──────────────────────────────────────────────────────────────

function PreviewTab({
  displayName, username, avatarUrl, bio, areas, cuisines,
  points, reviewCount, followerCount, isLocalExpert, articles,
}: {
  displayName: string; username: string | null; avatarUrl: string | null;
  bio: string; areas: string[]; cuisines: string[];
  points: number; reviewCount: number; followerCount: number;
  isLocalExpert: boolean; articles: Article[];
}) {
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="pb-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">
        This is how your public profile appears to other users
      </p>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm">
        {/* Hero */}
        <div className="px-6 pt-8 pb-6 border-b border-neutral-50">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-[#ff385c] to-orange-400 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-[#ff385c]/20 shrink-0 overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-neutral-950">{displayName}</h2>
                {isLocalExpert && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-700">
                    <Star size={9} className="fill-amber-400" /> Local Expert
                  </span>
                )}
              </div>
              {username && <p className="text-sm text-neutral-400 font-medium">@{username}</p>}
              {bio && <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{bio}</p>}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <MiniStat label="Reviews" value={reviewCount} />
            <MiniStat label="Followers" value={followerCount} />
            <MiniStat label="Points" value={points} />
          </div>
        </div>

        {/* Expertise */}
        {(areas.length > 0 || cuisines.length > 0) && (
          <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-neutral-50">
            {areas.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                  <MapPin size={9} /> Neighborhoods
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {areas.map(a => (
                    <span key={a} className="px-2.5 py-1 bg-neutral-50 border border-neutral-100 rounded-full text-xs font-semibold text-neutral-700">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {cuisines.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                  <Utensils size={9} /> Cuisines
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cuisines.map(c => (
                    <span key={c} className="px-2.5 py-1 bg-neutral-50 border border-neutral-100 rounded-full text-xs font-semibold text-neutral-700">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Articles preview */}
        <div className="px-6 py-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1">
            <FileText size={9} /> Published — {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>
          {articles.length === 0 ? (
            <p className="text-xs text-neutral-300 font-medium">Nothing published yet.</p>
          ) : (
            <div className="space-y-2">
              {articles.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2">
                  <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${TYPE_COLORS[a.type]}`}>
                    {TYPE_LABELS[a.type]}
                  </span>
                  <p className="text-sm font-bold text-neutral-900 line-clamp-1">{a.title}</p>
                </div>
              ))}
              {articles.length > 3 && (
                <p className="text-xs text-neutral-400 font-medium">+{articles.length - 3} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[#ff385c]">{icon}</span>
        <h3 className="text-sm font-black tracking-tight text-neutral-950">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, icon, value, placeholder, hint, onChange }: {
  label: string; icon: React.ReactNode; value: string;
  placeholder: string; hint?: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-[#ff385c] transition-colors">
          {icon}
        </div>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 py-3.5 pl-10 pr-4 text-sm font-bold text-neutral-900 outline-none transition-all focus:border-[#ff385c]/30 focus:bg-white" />
      </div>
      {hint && <p className="mt-1.5 px-1 text-[10px] font-medium text-neutral-400">{hint}</p>}
    </div>
  );
}

function ChipInput({ chips, inputValue, onInputChange, onAdd, onRemove, placeholder }: {
  chips: string[]; inputValue: string; onInputChange: (v: string) => void;
  onAdd: () => void; onRemove: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map(chip => (
          <span key={chip} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-bold text-neutral-700">
            {chip}
            <button onClick={() => onRemove(chip)} className="text-neutral-300 hover:text-red-400 transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-900 outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
        />
        <button onClick={onAdd}
          className="px-4 py-3 bg-[#ff385c] text-white rounded-2xl text-xs font-black hover:bg-[#e93252] active:scale-95 transition-all shadow-sm shadow-[#ff385c]/20">
          <Plus size={15} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex-1 bg-[#faf9f7] rounded-2xl px-3 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">{icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black text-neutral-950">{value > 999 ? (value / 1000).toFixed(1) + 'k' : value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 bg-neutral-50 rounded-xl px-3 py-2 text-center">
      <p className="text-base font-black text-neutral-950">{value > 999 ? (value / 1000).toFixed(1) + 'k' : value}</p>
      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}
