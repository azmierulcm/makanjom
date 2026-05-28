'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  LayoutGrid,
  BarChart3,
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
  EyeOff,
  Search,
  ChevronDown,
  ChevronUp,
  Store,
  Hash,
  MapPin,
  Star,
  UserCircle,
  Shield,
  Eye,
  Activity,
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

interface Restaurant {
  id: string;
  name: string;
  cuisine_types: string[];
  tier: 'free' | 'basic_order' | 'premium';
  address: string | null;
  is_active: boolean;
  emoji: string;
  rating: number;
  price_range: string;
  created_at: string;
  vendor_id: string;
  vendor_name?: string;
}

interface UserProfile {
  id: string;
  role: 'customer' | 'vendor' | 'admin' | 'creator';
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gamification_points: number;
  created_at: string;
  email?: string;
}

const EMPTY_FORM: ArticleForm = {
  title: '',
  content: '',
  type: 'news',
  is_published: true,
  event_date: '',
  cover_image_url: '',
};

const TIER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free:        { label: 'Starter',  color: 'text-neutral-500', bg: 'bg-neutral-100' },
  basic_order: { label: 'Order+',   color: 'text-blue-600',    bg: 'bg-blue-50' },
  premium:     { label: 'Premium',  color: 'text-[#ff385c]',   bg: 'bg-rose-50' },
};

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  customer: { label: 'Customer', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  vendor:   { label: 'Vendor',   color: 'text-blue-600',    bg: 'bg-blue-50' },
  admin:    { label: 'Admin',    color: 'text-[#ff385c]',   bg: 'bg-rose-50' },
  creator:  { label: 'Creator',  color: 'text-purple-600',  bg: 'bg-purple-50' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCMS() {
  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Data
  const [articles, setArticles] = useState<Article[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Stats
  const [vendorCount, setVendorCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [creatorCount, setCreatorCount] = useState<number>(0);
  const [restaurantCount, setRestaurantCount] = useState<number>(0);

  // Section collapse state
  const [listingsOpen, setListingsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);
  const [cmsOpen, setCmsOpen] = useState(true);

  // Search state
  const [listingSearch, setListingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [cmsSearch, setCmsSearch] = useState('');

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ArticleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMediaPanel, setShowMediaPanel] = useState(false);

  // ─── Fetch functions ────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setDataLoading(true);

    const [articlesRes, restaurantsRes, usersRes, statsRes] = await Promise.all([
      supabase.from('articles').select('*').order('created_at', { ascending: false }),
      supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
      ]),
    ]);

    if (articlesRes.data) setArticles(articlesRes.data as Article[]);

    // Map restaurants with vendor names
    const restaurantData = (restaurantsRes.data ?? []) as Restaurant[];
    const userProfiles = (usersRes.data ?? []) as UserProfile[];

    // Create a name lookup for vendors
    const vendorNameMap: Record<string, string> = {};
    for (const p of userProfiles) {
      vendorNameMap[p.id] = p.full_name ?? p.username ?? '—';
    }
    const enrichedRestaurants = restaurantData.map((r) => ({
      ...r,
      vendor_name: vendorNameMap[r.vendor_id] ?? '—',
    }));
    setRestaurants(enrichedRestaurants);
    setUsers(userProfiles);

    const [vendors, customers, creators, rests] = statsRes;
    setVendorCount(vendors.count ?? 0);
    setCustomerCount(customers.count ?? 0);
    setCreatorCount(creators.count ?? 0);
    setRestaurantCount(rests.count ?? 0);

    setDataLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setRole(profile?.role || null);
        fetchAll();
      } else {
        window.location.href = '/login?redirect=/admin';
      }
      setAuthLoading(false);
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── CMS actions ────────────────────────────────────────────────────────────

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
      fetchAll();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ─── Filtered data ──────────────────────────────────────────────────────────

  const filteredRestaurants = useMemo(() => {
    if (!listingSearch.trim()) return restaurants;
    const q = listingSearch.toLowerCase();
    return restaurants.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q) ||
      r.cuisine_types.some((c) => c.toLowerCase().includes(q)) ||
      r.tier.toLowerCase().includes(q) ||
      r.vendor_name?.toLowerCase().includes(q)
    );
  }, [restaurants, listingSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredArticles = useMemo(() => {
    if (!cmsSearch.trim()) return articles;
    const q = cmsSearch.toLowerCase();
    return articles.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
    );
  }, [articles, cmsSearch]);

  // ─── Guards ─────────────────────────────────────────────────────────────────

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
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

  const publishedCount = articles.filter((a) => a.is_published).length;
  const draftCount = articles.filter((a) => !a.is_published).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#ff385c] rounded-xl flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-neutral-900">Makanjom Admin</h1>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-neutral-400">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-500 hover:text-red-500 hover:border-red-200 transition-colors"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-8">

        {/* ── Overview stats ── */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <StatCard icon={<Store size={18} />} bg="bg-amber-50" color="text-amber-600" label="Listings" value={restaurantCount} />
          <StatCard icon={<Users size={18} />}  bg="bg-blue-50"  color="text-blue-500"  label="Customers" value={customerCount} />
          <StatCard icon={<LayoutGrid size={18} />} bg="bg-purple-50" color="text-purple-500" label="Vendors" value={vendorCount} />
          <StatCard icon={<UserCircle size={18} />} bg="bg-emerald-50" color="text-emerald-500" label="Creators" value={creatorCount} />
          <StatCard icon={<FileText size={18} />} bg="bg-rose-50" color="text-[#ff385c]" label="Published" value={publishedCount} />
          <StatCard icon={<EyeOff size={18} />}  bg="bg-neutral-50" color="text-neutral-400" label="Drafts" value={draftCount} />
        </div>

        {dataLoading ? (
          <div className="py-20 text-center">
            <Loader2 size={28} className="animate-spin text-[#ff385c] mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 1 — Listings (Restaurants)
               ═══════════════════════════════════════════════════════════════════ */}
            <CollapsibleSection
              title="Listings"
              subtitle={`${restaurants.length} restaurants`}
              icon={<Store size={18} />}
              accentBg="bg-amber-50"
              accentColor="text-amber-600"
              isOpen={listingsOpen}
              onToggle={() => setListingsOpen((v) => !v)}
              searchValue={listingSearch}
              onSearchChange={setListingSearch}
              searchPlaceholder="Search by name, location, cuisine, tier, vendor…"
            >
              {filteredRestaurants.length === 0 ? (
                <EmptyState label={listingSearch ? 'No listings match your search' : 'No restaurants found'} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <Th>#</Th>
                        <Th>Restaurant</Th>
                        <Th>Cuisine</Th>
                        <Th>Tier</Th>
                        <Th>Location</Th>
                        <Th>Rating</Th>
                        <Th>Vendor</Th>
                        <Th>Status</Th>
                        <Th>Registered</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRestaurants.map((r, idx) => {
                        const tier = TIER_LABELS[r.tier] ?? TIER_LABELS.free;
                        return (
                          <tr key={r.id} className="border-b border-neutral-50 hover:bg-amber-50/30 transition-colors">
                            <Td>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 text-[10px] font-black text-neutral-500">
                                {idx + 1}
                              </span>
                            </Td>
                            <Td>
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{r.emoji}</span>
                                <span className="font-bold text-neutral-900 truncate max-w-[200px]">{r.name}</span>
                              </div>
                            </Td>
                            <Td>
                              <div className="flex gap-1 flex-wrap">
                                {r.cuisine_types.slice(0, 2).map((c) => (
                                  <span key={c} className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-500">{c}</span>
                                ))}
                                {r.cuisine_types.length > 2 && (
                                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-400">
                                    +{r.cuisine_types.length - 2}
                                  </span>
                                )}
                              </div>
                            </Td>
                            <Td>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${tier.bg} ${tier.color}`}>
                                {tier.label}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-xs text-neutral-500 flex items-center gap-1 truncate max-w-[160px]">
                                <MapPin size={10} className="shrink-0" />
                                {r.address || '—'}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                                <Star size={10} className="fill-amber-400 text-amber-400" />
                                {Number(r.rating).toFixed(1)}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-xs text-neutral-500 truncate max-w-[120px] block">{r.vendor_name}</span>
                            </Td>
                            <Td>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                r.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                              }`}>
                                <Activity size={8} />
                                {r.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-[10px] font-bold text-neutral-400">
                                {new Date(r.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <SectionFooter total={restaurants.length} filtered={filteredRestaurants.length} searching={!!listingSearch} />
            </CollapsibleSection>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 2 — User Registrations
               ═══════════════════════════════════════════════════════════════════ */}
            <CollapsibleSection
              title="User Registrations"
              subtitle={`${users.length} users`}
              icon={<Users size={18} />}
              accentBg="bg-blue-50"
              accentColor="text-blue-600"
              isOpen={usersOpen}
              onToggle={() => setUsersOpen((v) => !v)}
              searchValue={userSearch}
              onSearchChange={setUserSearch}
              searchPlaceholder="Search by name, username, role, or ID…"
            >
              {filteredUsers.length === 0 ? (
                <EmptyState label={userSearch ? 'No users match your search' : 'No users found'} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <Th>#</Th>
                        <Th>User</Th>
                        <Th>Username</Th>
                        <Th>Role</Th>
                        <Th>Points</Th>
                        <Th>Registered</Th>
                        <Th>ID</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, idx) => {
                        const rl = ROLE_LABELS[u.role] ?? ROLE_LABELS.customer;
                        return (
                          <tr key={u.id} className="border-b border-neutral-50 hover:bg-blue-50/30 transition-colors">
                            <Td>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 text-[10px] font-black text-neutral-500">
                                {idx + 1}
                              </span>
                            </Td>
                            <Td>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <UserCircle size={16} className="text-neutral-400" />
                                  )}
                                </div>
                                <span className="font-bold text-neutral-900 truncate max-w-[180px]">
                                  {u.full_name || '—'}
                                </span>
                              </div>
                            </Td>
                            <Td>
                              <span className="text-xs text-neutral-500">@{u.username || '—'}</span>
                            </Td>
                            <Td>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${rl.bg} ${rl.color}`}>
                                {rl.label}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-xs font-bold text-neutral-700">{u.gamification_points}</span>
                            </Td>
                            <Td>
                              <span className="text-[10px] font-bold text-neutral-400">
                                {new Date(u.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-[10px] font-mono text-neutral-300 truncate max-w-[100px] block"
                                title={u.id}>
                                {u.id.slice(0, 8)}…
                              </span>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <SectionFooter total={users.length} filtered={filteredUsers.length} searching={!!userSearch} />
            </CollapsibleSection>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 3 — CMS / Articles
               ═══════════════════════════════════════════════════════════════════ */}
            <CollapsibleSection
              title="Content Management"
              subtitle={`${articles.length} articles`}
              icon={<FileText size={18} />}
              accentBg="bg-rose-50"
              accentColor="text-[#ff385c]"
              isOpen={cmsOpen}
              onToggle={() => setCmsOpen((v) => !v)}
              searchValue={cmsSearch}
              onSearchChange={setCmsSearch}
              searchPlaceholder="Search by title, type, or content…"
              headerAction={
                <button
                  onClick={openNew}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#ff385c] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#e93252] active:scale-95 transition-all shadow-sm"
                >
                  <Plus size={12} /> New Article
                </button>
              }
            >
              {filteredArticles.length === 0 ? (
                <EmptyState label={cmsSearch ? 'No articles match your search' : 'No articles yet — create the first one'} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <Th>#</Th>
                        <Th>Cover</Th>
                        <Th>Title</Th>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th>Event Date</Th>
                        <Th>Created</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((a, idx) => (
                        <tr key={a.id} className="border-b border-neutral-50 hover:bg-rose-50/30 transition-colors">
                          <Td>
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 text-[10px] font-black text-neutral-500">
                              {idx + 1}
                            </span>
                          </Td>
                          <Td>
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center">
                              {a.cover_image_url ? (
                                <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Type size={14} className="text-neutral-300" />
                              )}
                            </div>
                          </Td>
                          <Td>
                            <span className="font-bold text-neutral-900 truncate max-w-[260px] block">{a.title}</span>
                          </Td>
                          <Td>
                            <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-[10px] font-black uppercase text-neutral-500">
                              {a.type.replace('_', ' ')}
                            </span>
                          </Td>
                          <Td>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                              a.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              {a.is_published ? <><Eye size={8} /> Published</> : <><EyeOff size={8} /> Draft</>}
                            </span>
                          </Td>
                          <Td>
                            {a.event_date ? (
                              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                <Calendar size={10} />
                                {new Date(a.event_date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-300">—</span>
                            )}
                          </Td>
                          <Td>
                            <span className="text-[10px] font-bold text-neutral-400">
                              {new Date(a.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <SectionFooter total={articles.length} filtered={filteredArticles.length} searching={!!cmsSearch} />
            </CollapsibleSection>

          </div>
        )}
      </div>

      {/* ── Article Editor Modal ── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#faf9f7] flex flex-col"
          >
            {/* Toolbar */}
            <header className="px-8 h-16 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 font-black text-xs text-neutral-400 uppercase hover:text-neutral-900 transition-colors"
              >
                <ChevronLeft size={16} /> Back to dashboard
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border-2 border-neutral-100 text-xs font-black uppercase text-neutral-400 hover:border-neutral-300 hover:text-neutral-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <EyeOff size={12} />
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#ff385c] text-white text-xs font-black uppercase flex items-center gap-1.5 hover:bg-[#e93252] transition-all disabled:opacity-50"
                >
                  <Send size={12} />
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-8 py-10 max-w-3xl mx-auto w-full">
              <div className="space-y-8">
                {/* Title */}
                <input
                  type="text"
                  placeholder="Article title…"
                  className="w-full text-4xl font-black bg-transparent outline-none border-none placeholder:text-neutral-200"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                />

                {/* Type selector */}
                <div className="flex gap-3 flex-wrap">
                  {(['news', 'trend', 'training_event'] as Article['type'][]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData((f) => ({ ...f, type }))}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                        formData.type === type
                          ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg'
                          : 'border-neutral-100 text-neutral-300 hover:border-neutral-300'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Toolbar row */}
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
                  <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-red-50 border border-red-100">
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

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatCard({ icon, bg, color, label, value }: {
  icon: React.ReactNode; bg: string; color: string; label: string; value: number | string;
}) {
  return (
    <div className="bg-white px-5 py-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center ${color} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate">{label}</p>
        <p className="text-xl font-black text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, subtitle, icon, accentBg, accentColor, isOpen, onToggle, searchValue, onSearchChange, searchPlaceholder, headerAction, children }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentBg: string;
  accentColor: string;
  isOpen: boolean;
  onToggle: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={onToggle} className="flex items-center gap-3 group">
          <div className={`w-9 h-9 ${accentBg} rounded-xl flex items-center justify-center ${accentColor} shrink-0`}>
            {icon}
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black text-neutral-900 group-hover:text-neutral-700 transition-colors">{title}</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{subtitle}</p>
          </div>
          <div className="ml-2 text-neutral-300">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        <div className="flex items-center gap-3">
          {headerAction}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Search bar */}
            <div className="px-6 pb-4">
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-medium text-neutral-700 outline-none placeholder:text-neutral-300 focus:border-neutral-200 focus:bg-white transition-all"
                />
                {searchValue && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-12 text-center">
      <BarChart3 size={32} className="mx-auto mb-3 text-neutral-200" />
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-300">{label}</p>
    </div>
  );
}

function SectionFooter({ total, filtered, searching }: { total: number; filtered: number; searching: boolean }) {
  return (
    <div className="mt-4 pt-3 border-t border-neutral-50 flex items-center justify-between">
      <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
        {searching ? `${filtered} of ${total} shown` : `${total} total`}
      </p>
      <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-300">
        <Hash size={10} /> Numbered by registration order
      </div>
    </div>
  );
}

// ─── Table helper components ──────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-3 text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-3 text-sm whitespace-nowrap">
      {children}
    </td>
  );
}
