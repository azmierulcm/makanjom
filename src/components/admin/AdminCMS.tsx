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
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Article {
  id: string;
  title: string;
  type: 'news' | 'trend' | 'training_event';
  created_at: string;
  content: string;
}

export default function AdminCMS() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'news' as const });

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setArticles(data as Article[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setRole(profile?.role || null);
        fetchArticles();
      } else {
        window.location.href = '/login?redirect=/admin';
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  const handleSave = async () => {
    const { error } = await supabase.from('articles').insert([{ ...formData, author_id: user?.id }]);
    if (!error) {
      setIsEditing(false);
      fetchArticles();
      setFormData({ title: '', content: '', type: 'news' });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" /></div>;

  if (role !== 'admin') return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-6 text-center">
          <div className="max-w-md">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert size={32} className="text-[#ff385c]" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 mb-4">Access Denied</h2>
              <p className="text-neutral-500 mb-8">This area is reserved for Makanjom Administrators. Please sign in with an authorized account.</p>
              <button onClick={handleSignOut} className="px-8 py-3 bg-neutral-950 text-white rounded-full font-bold text-sm">Sign Out</button>
          </div>
      </div>
  );

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-neutral-200 uppercase tracking-widest text-xs">Loading CMS Data...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      {/* Admin Header */}
      <header className="py-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <p className="text-xs font-black text-[#FF385C] uppercase tracking-[0.3em]">Aggregator Control</p>
            <button onClick={handleSignOut} className="text-[10px] font-black text-neutral-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"><LogOut size={12}/> Sign Out</button>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900">Makanjom CMS</h1>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF385C] text-white rounded-2xl font-black text-sm transition-transform active:scale-95 shadow-lg shadow-[#ff385c]/20"
        >
          <Plus size={18} /> CREATE NEW
        </button>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#ff385c]"><FileText size={20}/></div>
            <div>
                <p className="text-xs font-bold text-neutral-400">Total Articles</p>
                <p className="text-xl font-black">{articles.length}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><BarChart3 size={20}/></div>
            <div>
                <p className="text-xs font-bold text-neutral-400">Active Readers</p>
                <p className="text-xl font-black">1.2k</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500"><LayoutGrid size={20}/></div>
            <div>
                <p className="text-xs font-bold text-neutral-400">Vendor Count</p>
                <p className="text-xl font-black">48</p>
            </div>
        </div>
      </div>

      {/* Article List */}
      <div className="space-y-4">
        <h3 className="text-xl font-black px-2 mb-6">Recent Content</h3>
        {articles.map((article) => (
            <div key={article.id} className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between group hover:border-[#ff385c]/20 transition-all">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 shrink-0">
                        <Type size={20} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-neutral-900 truncate">{article.title}</h4>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{article.type} • {new Date(article.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <button className="p-3 text-neutral-300 hover:text-neutral-900 transition-colors"><MoreVertical size={20}/></button>
            </div>
        ))}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#faf9f7] flex flex-col"
            >
                <header className="px-6 h-20 border-b border-neutral-100 flex items-center justify-between">
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 font-black text-xs text-neutral-400 uppercase"><ChevronLeft size={16}/> BACK</button>
                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 rounded-full border-2 border-neutral-100 text-xs font-black uppercase text-neutral-400">Save Draft</button>
                        <button onClick={handleSave} className="px-6 py-2.5 rounded-full bg-[#ff385c] text-white text-xs font-black uppercase flex items-center gap-2">PUBLISH <Send size={14}/></button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-12 max-w-3xl mx-auto w-full">
                    <div className="space-y-12">
                        <input 
                            type="text" 
                            placeholder="Article Title..." 
                            className="w-full text-5xl font-black bg-transparent outline-none border-none placeholder:text-neutral-200"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />

                        <div className="flex gap-4">
                            {['news', 'trend', 'training_event'].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setFormData({...formData, type: type as any})}
                                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border-2 transition-all ${formData.type === type ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg' : 'border-neutral-100 text-neutral-300'}`}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-6 border-y border-neutral-50 py-6">
                            <button className="flex items-center gap-2 text-xs font-black text-neutral-400 uppercase hover:text-neutral-900 transition-colors"><ImageIcon size={18}/> Add Media</button>
                            <button className="flex items-center gap-2 text-xs font-black text-neutral-400 uppercase hover:text-neutral-900 transition-colors"><Calendar size={18}/> Set Event Date</button>
                        </div>

                        <textarea 
                            placeholder="Write your content here (Markdown supported)..."
                            className="w-full h-[400px] bg-transparent outline-none border-none text-lg text-neutral-600 font-medium leading-relaxed placeholder:text-neutral-200 resize-none"
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                        />
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
