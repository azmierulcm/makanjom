'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
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
  Pencil,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Check,
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
  description: string | null;
  cuisine_types: string[];
  tier: 'free' | 'basic_order' | 'premium';
  address: string | null;
  is_active: boolean;
  emoji: string;
  vibe: string;
  rating: number;
  price_range: string;
  created_at: string;
  vendor_id: string;
  vendor_name?: string;
  jomoda_slug: string | null;
}

interface RestaurantEditForm {
  name: string;
  description: string;
  cuisine_types: string;
  tier: 'free' | 'basic_order' | 'premium';
  address: string;
  is_active: boolean;
  emoji: string;
  vibe: string;
  price_range: string;
  rating: string;
  jomoda_slug: string;
}

interface UserProfile {
  id: string;
  role: 'customer' | 'vendor' | 'admin' | 'creator';
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gamification_points: number;
  created_at: string;
}

interface UserEditForm {
  full_name: string;
  username: string;
  role: 'customer' | 'vendor' | 'admin' | 'creator';
  gamification_points: string;
}

interface DeleteConfirm {
  type: 'restaurant' | 'article';
  id: string;
  label: string;
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

  // Article editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArticleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMediaPanel, setShowMediaPanel] = useState(false);

  // Restaurant edit modal
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [restForm, setRestForm] = useState<RestaurantEditForm | null>(null);
  const [restSaving, setRestSaving] = useState(false);
  const [restError, setRestError] = useState<string | null>(null);

  // User edit modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState<UserEditForm | null>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

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

    const restaurantData = (restaurantsRes.data ?? []) as Restaurant[];
    const userProfiles = (usersRes.data ?? []) as UserProfile[];

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

  // ─── Article actions ────────────────────────────────────────────────────────

  const openNewArticle = () => {
    setFormData(EMPTY_FORM);
    setEditingArticleId(null);
    setSaveError(null);
    setShowMediaPanel(false);
    setIsEditing(true);
  };

  const openEditArticle = (article: Article) => {
    setFormData({
      title: article.title,
      content: article.content,
      type: article.type,
      is_published: article.is_published,
      event_date: article.event_date ?? '',
      cover_image_url: article.cover_image_url ?? '',
    });
    setEditingArticleId(article.id);
    setSaveError(null);
    setShowMediaPanel(false);
    setIsEditing(true);
  };

  const handleArticleSave = async (publish: boolean) => {
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
    };

    let error;
    if (editingArticleId) {
      ({ error } = await supabase.from('articles').update(payload).eq('id', editingArticleId));
    } else {
      ({ error } = await supabase.from('articles').insert([{ ...payload, author_id: user?.id }]));
    }

    if (error) {
      setSaveError(error.message);
    } else {
      setIsEditing(false);
      setFormData(EMPTY_FORM);
      setEditingArticleId(null);
      showToast(editingArticleId ? 'Article updated' : 'Article created');
      fetchAll();
    }
    setSaving(false);
  };

  const toggleArticlePublish = async (article: Article) => {
    const { error } = await supabase
      .from('articles')
      .update({ is_published: !article.is_published })
      .eq('id', article.id);
    if (!error) {
      showToast(article.is_published ? 'Moved to draft' : 'Published');
      fetchAll();
    }
  };

  // ─── Restaurant actions ─────────────────────────────────────────────────────

  const openEditRestaurant = (r: Restaurant) => {
    setEditingRestaurant(r);
    setRestForm({
      name: r.name,
      description: r.description ?? '',
      cuisine_types: r.cuisine_types.join(', '),
      tier: r.tier,
      address: r.address ?? '',
      is_active: r.is_active,
      emoji: r.emoji,
      vibe: r.vibe ?? '',
      price_range: r.price_range,
      rating: String(r.rating),
      jomoda_slug: r.jomoda_slug ?? '',
    });
    setRestError(null);
  };

  const handleRestaurantSave = async () => {
    if (!editingRestaurant || !restForm) return;
    const name = sanitizeText(restForm.name);
    if (!name) { setRestError('Name is required.'); return; }

    setRestSaving(true);
    setRestError(null);

    const { error } = await supabase
      .from('restaurants')
      .update({
        name,
        description: sanitizeText(restForm.description) || null,
        cuisine_types: restForm.cuisine_types.split(',').map((s) => s.trim()).filter(Boolean),
        tier: restForm.tier,
        address: sanitizeText(restForm.address) || null,
        is_active: restForm.is_active,
        emoji: restForm.emoji,
        vibe: sanitizeText(restForm.vibe) || 'Cozy',
        price_range: restForm.price_range,
        rating: Math.min(5, Math.max(0, parseFloat(restForm.rating) || 4.5)),
        jomoda_slug: restForm.jomoda_slug.trim() || null,
      })
      .eq('id', editingRestaurant.id);

    if (error) {
      setRestError(error.message);
    } else {
      setEditingRestaurant(null);
      setRestForm(null);
      showToast('Restaurant updated');
      fetchAll();
    }
    setRestSaving(false);
  };

  const toggleRestaurantActive = async (r: Restaurant) => {
    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: !r.is_active })
      .eq('id', r.id);
    if (!error) {
      showToast(r.is_active ? 'Listing deactivated' : 'Listing activated');
      fetchAll();
    }
  };

  // ─── User actions ───────────────────────────────────────────────────────────

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setUserForm({
      full_name: u.full_name ?? '',
      username: u.username ?? '',
      role: u.role,
      gamification_points: String(u.gamification_points),
    });
    setUserError(null);
  };

  const handleUserSave = async () => {
    if (!editingUser || !userForm) return;

    setUserSaving(true);
    setUserError(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: sanitizeText(userForm.full_name) || null,
        username: sanitizeText(userForm.username) || null,
        role: userForm.role,
        gamification_points: Math.max(0, parseInt(userForm.gamification_points) || 0),
      })
      .eq('id', editingUser.id);

    if (error) {
      setUserError(error.message);
    } else {
      setEditingUser(null);
      setUserForm(null);
      showToast('User updated');
      fetchAll();
    }
    setUserSaving(false);
  };

  // ─── Delete actions ─────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);

    const table = deleteConfirm.type === 'restaurant' ? 'restaurants' : 'articles';
    const { error } = await supabase.from(table).delete().eq('id', deleteConfirm.id);

    if (!error) {
      showToast(`${deleteConfirm.type === 'restaurant' ? 'Restaurant' : 'Article'} deleted`);
      fetchAll();
    }
    setDeleting(false);
    setDeleteConfirm(null);
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
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Super Access · Control Panel</p>
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
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRestaurants.map((r, idx) => {
                        const tier = TIER_LABELS[r.tier] ?? TIER_LABELS.free;
                        return (
                          <tr key={r.id} className="border-b border-neutral-50 hover:bg-amber-50/30 transition-colors group">
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
                              <button
                                onClick={() => toggleRestaurantActive(r)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                                  r.is_active
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-500 hover:bg-red-100'
                                }`}
                                title={r.is_active ? 'Click to deactivate' : 'Click to activate'}
                              >
                                {r.is_active ? <ToggleRight size={10} /> : <ToggleLeft size={10} />}
                                {r.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </Td>
                            <Td>
                              <span className="text-[10px] font-bold text-neutral-400">
                                {new Date(r.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </Td>
                            <Td>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditRestaurant(r)}
                                  className="p-1.5 rounded-lg hover:bg-amber-100 text-neutral-400 hover:text-amber-700 transition-colors"
                                  title="Edit restaurant"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'restaurant', id: r.id, label: r.name })}
                                  className="p-1.5 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-600 transition-colors"
                                  title="Delete restaurant"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
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
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, idx) => {
                        const rl = ROLE_LABELS[u.role] ?? ROLE_LABELS.customer;
                        return (
                          <tr key={u.id} className="border-b border-neutral-50 hover:bg-blue-50/30 transition-colors group">
                            <Td>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 text-[10px] font-black text-neutral-500">
                                {idx + 1}
                              </span>
                            </Td>
                            <Td>
                              <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                                  {u.avatar_url ? (
                                    <Image src={u.avatar_url} alt="" fill className="object-cover" />
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
                              <span className="text-[10px] font-mono text-neutral-300 truncate max-w-[100px] block" title={u.id}>
                                {u.id.slice(0, 8)}…
                              </span>
                            </Td>
                            <Td>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditUser(u)}
                                  className="p-1.5 rounded-lg hover:bg-blue-100 text-neutral-400 hover:text-blue-700 transition-colors"
                                  title="Edit user"
                                >
                                  <Pencil size={12} />
                                </button>
                              </div>
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
                  onClick={openNewArticle}
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
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((a, idx) => (
                        <tr key={a.id} className="border-b border-neutral-50 hover:bg-rose-50/30 transition-colors group">
                          <Td>
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 text-[10px] font-black text-neutral-500">
                              {idx + 1}
                            </span>
                          </Td>
                          <Td>
                            <div className="relative w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center">
                              {a.cover_image_url ? (
                                <Image src={a.cover_image_url} alt="" fill className="object-cover" />
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
                            <button
                              onClick={() => toggleArticlePublish(a)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                                a.is_published
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                              }`}
                              title={a.is_published ? 'Click to unpublish' : 'Click to publish'}
                            >
                              {a.is_published ? <><Eye size={8} /> Published</> : <><EyeOff size={8} /> Draft</>}
                            </button>
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
                          <Td>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditArticle(a)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-neutral-400 hover:text-[#ff385c] transition-colors"
                                title="Edit article"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'article', id: a.id, label: a.title })}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-600 transition-colors"
                                title="Delete article"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
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

      {/* ══════════════════════════════════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════════════════════════════════ */}

      {/* ── Article Editor ── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#faf9f7] flex flex-col"
          >
            <header className="px-8 h-16 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
              <button
                onClick={() => { setIsEditing(false); setEditingArticleId(null); }}
                className="flex items-center gap-2 font-black text-xs text-neutral-400 uppercase hover:text-neutral-900 transition-colors"
              >
                <ChevronLeft size={16} /> Back to dashboard
              </button>
              <div className="flex items-center gap-3">
                {editingArticleId && (
                  <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Editing</span>
                )}
                <button
                  onClick={() => handleArticleSave(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border-2 border-neutral-100 text-xs font-black uppercase text-neutral-400 hover:border-neutral-300 hover:text-neutral-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <EyeOff size={12} />
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleArticleSave(true)}
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
                <input
                  type="text"
                  placeholder="Article title…"
                  className="w-full text-4xl font-black bg-transparent outline-none border-none placeholder:text-neutral-200"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                />

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
                        onChange={(e) => setFormData((f) => ({ ...f, event_date: e.target.value }))}
                        className="ml-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 outline-none focus:border-amber-400 cursor-pointer"
                      />
                    </label>
                  )}
                </div>

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

                {saveError && (
                  <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-xs font-bold text-red-600">{saveError}</p>
                    <button onClick={() => setSaveError(null)}><X size={14} className="text-red-400" /></button>
                  </div>
                )}

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

      {/* ── Restaurant Edit Modal ── */}
      <AnimatePresence>
        {editingRestaurant && restForm && (
          <ModalBackdrop onClose={() => { setEditingRestaurant(null); setRestForm(null); }}>
            <ModalPanel title={`Edit: ${editingRestaurant.name}`} subtitle={`ID: ${editingRestaurant.id.slice(0, 8)}…`}>
              <div className="space-y-5">
                <div className="grid grid-cols-[60px_1fr] gap-4">
                  <FieldGroup label="Emoji">
                    <input
                      type="text"
                      value={restForm.emoji}
                      onChange={(e) => setRestForm((f) => f && ({ ...f, emoji: e.target.value }))}
                      className="admin-input text-center text-2xl"
                      maxLength={4}
                    />
                  </FieldGroup>
                  <FieldGroup label="Restaurant Name">
                    <input
                      type="text"
                      value={restForm.name}
                      onChange={(e) => setRestForm((f) => f && ({ ...f, name: e.target.value }))}
                      className="admin-input"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup label="Description">
                  <textarea
                    value={restForm.description}
                    onChange={(e) => setRestForm((f) => f && ({ ...f, description: e.target.value }))}
                    className="admin-input h-20 resize-none"
                  />
                </FieldGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Cuisine Types (comma-separated)">
                    <input
                      type="text"
                      value={restForm.cuisine_types}
                      onChange={(e) => setRestForm((f) => f && ({ ...f, cuisine_types: e.target.value }))}
                      className="admin-input"
                      placeholder="Malay, Chinese, Indian"
                    />
                  </FieldGroup>
                  <FieldGroup label="Tier">
                    <select
                      value={restForm.tier}
                      onChange={(e) => setRestForm((f) => f && ({ ...f, tier: e.target.value as Restaurant['tier'] }))}
                      className="admin-input"
                    >
                      <option value="free">Starter (Free)</option>
                      <option value="basic_order">Order+ (RM99)</option>
                      <option value="premium">Premium (RM199)</option>
                    </select>
                  </FieldGroup>
                </div>

                <FieldGroup label="Address">
                  <input
                    type="text"
                    value={restForm.address}
                    onChange={(e) => setRestForm((f) => f && ({ ...f, address: e.target.value }))}
                    className="admin-input"
                  />
                </FieldGroup>

                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="Rating (0–5)">
                    <input
                      type="number"
                      value={restForm.rating}
                      onChange={(e) => setRestForm((f) => f && ({ ...f, rating: e.target.value }))}
                      className="admin-input"
                      step="0.1"
                      min="0"
                      max="5"
                    />
                  </FieldGroup>
                  <FieldGroup label="Price Range">
                    <select
                      value={restForm.price_range}
                      onChange={(e) => setRestForm((f) => f && ({ ...f, price_range: e.target.value }))}
                      className="admin-input"
                    >
                      <option value="< RM 10">&lt; RM 10 (Budget)</option>
                      <option value="RM 10–20">RM 10–20 (Moderate)</option>
                      <option value="RM 20–50">RM 20–50 (Pricey)</option>
                      <option value="RM 50+">RM 50+ (Fine Dining)</option>
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Vibe">
                    <input
                      type="text"
                      value={restForm.vibe}
                      onChange={(e) => setRestForm((f) => f && ({ ...f, vibe: e.target.value }))}
                      className="admin-input"
                      placeholder="Cozy, Vibrant, etc."
                    />
                  </FieldGroup>
                </div>

                <FieldGroup label="Jomoda Store Slug (optional)">
                  <input
                    type="text"
                    value={restForm.jomoda_slug}
                    onChange={(e) => setRestForm((f) => f && ({ ...f, jomoda_slug: e.target.value.trim().toLowerCase() }))}
                    className="admin-input"
                    placeholder="e.g. pelita-nasi-kandar"
                  />
                  {restForm.jomoda_slug
                    ? <p className="mt-1 text-xs text-emerald-600 font-semibold">→ jomoda.my/{restForm.jomoda_slug}</p>
                    : <p className="mt-1 text-xs text-neutral-400">Leave blank if this restaurant has no Jomoda store</p>
                  }
                </FieldGroup>

                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => setRestForm((f) => f && ({ ...f, is_active: !f.is_active }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${restForm.is_active ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${restForm.is_active ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  <span className="text-xs font-bold text-neutral-700">
                    {restForm.is_active ? 'Active — visible to public' : 'Inactive — hidden from public'}
                  </span>
                </div>

                {restError && (
                  <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600">{restError}</div>
                )}
              </div>

              <ModalFooter
                saving={restSaving}
                onSave={handleRestaurantSave}
                onCancel={() => { setEditingRestaurant(null); setRestForm(null); }}
              />
            </ModalPanel>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      {/* ── User Edit Modal ── */}
      <AnimatePresence>
        {editingUser && userForm && (
          <ModalBackdrop onClose={() => { setEditingUser(null); setUserForm(null); }}>
            <ModalPanel
              title={`Edit: ${editingUser.full_name || 'User'}`}
              subtitle={`ID: ${editingUser.id.slice(0, 8)}… · Joined ${new Date(editingUser.created_at).toLocaleDateString('en-MY')}`}
            >
              <div className="space-y-5">
                <FieldGroup label="Full Name">
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm((f) => f && ({ ...f, full_name: e.target.value }))}
                    className="admin-input"
                  />
                </FieldGroup>

                <FieldGroup label="Username">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">@</span>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm((f) => f && ({ ...f, username: e.target.value }))}
                      className="admin-input pl-7"
                    />
                  </div>
                </FieldGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Role">
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm((f) => f && ({ ...f, role: e.target.value as UserProfile['role'] }))}
                      className="admin-input"
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                    {userForm.role === 'admin' && (
                      <p className="text-[10px] font-bold text-[#ff385c] mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> Grants full system access
                      </p>
                    )}
                  </FieldGroup>

                  <FieldGroup label="Gamification Points">
                    <input
                      type="number"
                      value={userForm.gamification_points}
                      onChange={(e) => setUserForm((f) => f && ({ ...f, gamification_points: e.target.value }))}
                      className="admin-input"
                      min="0"
                    />
                  </FieldGroup>
                </div>

                {userError && (
                  <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600">{userError}</div>
                )}
              </div>

              <ModalFooter
                saving={userSaving}
                onSave={handleUserSave}
                onCancel={() => { setEditingUser(null); setUserForm(null); }}
              />
            </ModalPanel>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <ModalBackdrop onClose={() => setDeleteConfirm(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-neutral-100 p-8 w-full max-w-md text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-neutral-900 mb-2">Delete {deleteConfirm.type}?</h3>
              <p className="text-sm text-neutral-500 mb-1">
                This will permanently delete:
              </p>
              <p className="text-sm font-bold text-neutral-900 mb-6 truncate px-4">
                &ldquo;{deleteConfirm.label}&rdquo;
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2.5 rounded-xl border border-neutral-200 text-xs font-black uppercase text-neutral-500 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-xs font-black uppercase hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      {/* ── Toast notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 text-white text-sm font-bold shadow-xl"
          >
            <Check size={14} className="text-emerald-400" />
            {toast}
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

// ─── Modal components ─────────────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </motion.div>
  );
}

function ModalPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="bg-white rounded-2xl shadow-2xl border border-neutral-100 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
    >
      <div className="px-8 py-6 border-b border-neutral-100">
        <h3 className="text-lg font-black text-neutral-900">{title}</h3>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{subtitle}</p>
      </div>
      <div className="px-8 py-6">
        {children}
      </div>
    </motion.div>
  );
}

function ModalFooter({ saving, onSave, onCancel }: { saving: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-100">
      <button
        onClick={onCancel}
        className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-black uppercase text-neutral-500 hover:bg-neutral-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-black uppercase flex items-center gap-1.5 hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────

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
