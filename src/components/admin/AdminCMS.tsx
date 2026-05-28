'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  LayoutGrid,
  BarChart3,
  MoreVertical,
  Send,
  X,
  Type,
  ImageIcon,
  Calendar,
  ChevronLeft,
  LogOut,
  ShieldAlert,
  Users,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';
import ImageUpload from '@/components/ImageUpload';
import type { User } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  type: 'news' | 'trend' | 'training_event';
  created_at: string;
  content: string;
  is_published: boolean;
  cover_image_url: string | null;
  event_date: string | null;
}

interface ArticleForm {
  title: string;
  content: string;
  type: Article['type'];
  is_published: boolean;
  event_date: string;
  cover_image_url: string;
}

const EMPTY_FORM: ArticleForm = {
  title: '',
  content: '',
  type: 'news',
  is_published: true,
  event_date: '',
  cover_image_url: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCMS() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArticleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMediaPanel, setShowMediaPanel] = useState(false);

  // Real stats
  const [vendorCount, setVendorCount] = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setArticles(data as Article[]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [{ count: vendors }, { count: customers }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    ]);
    if (vendors !== null) setVendorCount(vendors);
    if (customers !== null) setCustomerCount(customers);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setRole(profile?.role || null);
        fetchArticles();
        fetchStats();
      } else {
        window.location.href = '/login?redirect=/admin';
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  const openNew = () => {
    setFormData(EMPTY_FORM);
    setSaveError(null);
    setShowMediaPanel(false);
    setIsEditing(true);
  };

  const handleSave = async (publish: boolean) => {
    const title = sanitizeText(formData.title);
    const content = sanitizeText(formData.content);
    if (!title || title.length > 200) { setSaveError('Title is required (max 200 chars).'); return; }
    if (!content || content.length > 10000) { setSaveError('Content is required (max 10,000 chars).'); return; }

    setSaving(true);
    setSaveError(null);

    const payload = {
      title,
      content,
      type: formData.type,
      is_published: publish,
      cover_image_url: formData.cover_image_url || null,
      event_date: formData.type === 'training_event' && formData.event_date ? formData.event_date : null,
      author_id: user?.id,
    };

    const { error } = await supabase.from('articles').insert([payload]);
    if (error) {
      setSaveError(error.message);
    } else {
      setIsEditing(false);
      setFormData(EMPTY_FORM);
      fetchArticles();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" />
    </div>
  );

  if (role !== 'admin') return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} className="text-[#ff385c]" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 mb-4">Access Denied</h2>
        <p className="text-neutral-500 mb-8">This area is reserved for Makanjom Administrators.</p>
        <button onClick={handleSignOut} className="px-8 py-3 bg-neutral-950 text-white rounded-full font-bold text-sm">Sign Out</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="p-20 text-center">
      <Loader2 size={28} className="animate-spin text-[#ff385c] mx-auto" />
    </div>
  );

  const publishedCount = articles.filter((a) => a.is_published).length;
  const draftCount = articles.filter((a) => !a.is_published).length;

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      {/* Admin Header */}
      <header className="py-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <p className="text-xs font-black text-[#FF385C] uppercase tracking-[0.3em]">Aggregator Control</p>
            <button
              onClick={handleSignOut}
              className="text-[10px] font-black text-neutral-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900">Makanjom CMS</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF385C] text-white rounded-2xl font-black text-sm transition-transform active:scale-95 shadow-lg shadow-[#ff385c]/20"
        >
          <Plus size={18} /> CREATE NEW
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatCard
          icon={<FileText size={20} />}
          bg="bg-rose-50" color="text-[#ff385c]"
          label="Published"
          value={publishedCount}
        />
        <StatCard
          icon={<EyeOff size={20} />}
          bg="bg-neutral-50" color="text-neutral-400"
          label="Drafts"
          value={draftCount}
        />
        <StatCard
          icon={<Users size={20} />}
          bg="bg-blue-50" color="text-blue-500"
          label="Customers"
          value={customerCount ?? '—'}
        />
        <StatCard
          icon={<LayoutGrid size={20} />}
          bg="bg-amber-50" color="text-amber-500"
          label="Vendors"
          value={vendorCount ?? '—'}
        />
      </div>

      {/* Article List */}
      <div className="space-y-4">
        <h3 className="text-xl font-black px-2 mb-6">All Articles</h3>
        {articles.length === 0 && (
          <div className="py-20 text-center text-neutral-300">
            <BarChart3 size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold uppercase text-xs tracking-widest">No articles yet — create the first one.</p>
          </div>
        )}
        {articles.map((article) => (
          <div
            key={article.id}
            className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between group hover:border-[#ff385c]/20 transition-all"
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 shrink-0 overflow-hidden">
                {article.cover_image_url
                  ? <img src={article.cover_image_url} alt="" className="w-full h-full object-cover" />
                  : <Type size={20} />}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-neutral-900 truncate">{article.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    {article.type.replace('_', ' ')} · {new Date(article.created_at).toLocaleDateString()}
                  </p>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    article.is_published
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {article.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
            <button className="p-3 text-neutral-300 hover:text-neutral-900 transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Editor Modal ── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#faf9f7] flex flex-col"
          >
            {/* Toolbar */}
            <header className="px-6 h-16 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 font-black text-xs text-neutral-400 uppercase hover:text-neutral-900 transition-colors"
              >
                <ChevronLeft size={16} /> BACK
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-full border-2 border-neutral-100 text-xs font-black uppercase text-neutral-400 hover:border-neutral-300 hover:text-neutral-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <EyeOff size={12} />
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-full bg-[#ff385c] text-white text-xs font-black uppercase flex items-center gap-1.5 hover:bg-[#e93252] transition-all disabled:opacity-50"
                >
                  <Send size={12} />
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-10 max-w-3xl mx-auto w-full">
              <div className="space-y-8">

                {/* Title */}
                <input
                  type="text"
                  placeholder="Article Title…"
                  className="w-full text-4xl md:text-5xl font-black bg-transparent outline-none border-none placeholder:text-neutral-200"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                />

                {/* Type selector */}
                <div className="flex gap-3 flex-wrap">
                  {(['news', 'trend', 'training_event'] as Article['type'][]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData((f) => ({ ...f, type }))}
                      className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border-2 transition-all ${
                        formData.type === type
                          ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg'
                          : 'border-neutral-100 text-neutral-300 hover:border-neutral-300'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Toolbar row: Add Media + Set Event Date */}
                <div className="flex items-center gap-6 border-y border-neutral-100 py-5">
                  <button
                    onClick={() => setShowMediaPanel((v) => !v)}
                    className={`flex items-center gap-2 text-xs font-black uppercase transition-colors ${
                      showMediaPanel || formData.cover_image_url
                        ? 'text-[#ff385c]'
                        : 'text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    <ImageIcon size={16} />
                    {formData.cover_image_url ? 'Cover added ✓' : 'Add Cover Image'}
                  </button>

                  {formData.type === 'training_event' && (
                    <label className="flex items-center gap-2 text-xs font-black uppercase text-neutral-400">
                      <Calendar size={16} className="text-amber-500" />
                      <span className="text-amber-600">Event Date</span>
                      <input
                        type="date"
                        value={formData.event_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData((f) => ({ ...f, event_date: e.target.value }))}
                        className="ml-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 outline-none focus:border-amber-400 cursor-pointer"
                      />
                    </label>
                  )}
                </div>

                {/* Media panel */}
                <AnimatePresence>
                  {showMediaPanel && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                          Cover Image
                        </label>
                        <ImageUpload
                          value={formData.cover_image_url}
                          onChange={(url) => {
                            setFormData((f) => ({ ...f, cover_image_url: url }));
                            if (!url) setShowMediaPanel(false);
                          }}
                          folder="article-covers"
                          label="Upload cover image"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {saveError && (
                  <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-red-50 border border-red-100">
                    <p className="text-xs font-bold text-red-600">{saveError}</p>
                    <button onClick={() => setSaveError(null)}>
                      <X size={14} className="text-red-400" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <textarea
                  placeholder="Write your content here (Markdown supported)…"
                  className="w-full h-[400px] bg-transparent outline-none border-none text-lg text-neutral-600 font-medium leading-relaxed placeholder:text-neutral-200 resize-none"
                  value={formData.content}
                  onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon, bg, color, label, value,
}: {
  icon: React.ReactNode;
  bg: string;
  color: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white p-5 rounded-[2.5rem] border border-neutral-100 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate">{label}</p>
        <p className="text-xl font-black text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
