'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Heart, Tag, Utensils, ChevronLeft, Sparkles, X, ChevronRight, Plus, Clock, Share2,
  ChevronDown, HelpCircle,
  Wifi, ParkingCircle, Baby, Music, Wind, Coffee, Tv, Accessibility, Dog,
} from 'lucide-react';

// Constrained icon map for facility icons stored in the DB.
// Avoids bundling all 400+ lucide icons via `import * as Icons`.
type LucideIconComponent = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
const FACILITY_ICON_MAP: Record<string, LucideIconComponent> = {
  Wifi, ParkingCircle, Baby, Music, Wind,
  Utensils, Coffee, Tv, Accessibility, Dog,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseHours(value: string): { open: number; close: number } | null {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return {
    open: parseInt(match[1]) * 60 + parseInt(match[2]),
    close: parseInt(match[3]) * 60 + parseInt(match[4]),
  };
}

function isOpenNow(hours: Record<string, string>): boolean {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const value = hours[dayName];
  if (!value || value.toLowerCase() === 'closed') return false;
  const parsed = parseHours(value);
  if (!parsed) return false;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  return currentMins >= parsed.open && currentMins < parsed.close;
}

function BusinessHours({ hours }: { hours: Record<string, string> }) {
  const today = new Date().getDay();
  const open = isOpenNow(hours);

  return (
    <div className="mt-5 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-neutral-400" />
        <span className="text-sm font-bold text-neutral-700">Hours</span>
        <span
          className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            open ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
          }`}
        >
          {open ? 'Open now' : 'Closed'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {DAY_NAMES.map((day, i) => {
          const value = hours[day] ?? '—';
          const isToday = i === today;
          return (
            <div key={day} className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs ${isToday ? 'bg-white font-bold text-neutral-950 shadow-sm ring-1 ring-neutral-200' : 'text-neutral-500'}`}>
              <span>{DAY_SHORT[i]}</span>
              <span className={value.toLowerCase() === 'closed' ? 'text-neutral-300' : ''}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { supabase } from '@/lib/supabase';
import {
  getMockRestaurant, getMockMenus, getMockPromotions, getMockReviews,
} from '@/lib/mock-data';
import ReviewForm from '@/components/ReviewForm';
import { getGamificationState, toggleSavedRestaurant } from '@/lib/gamification';
import { normalizeMenuItems } from '@/lib/menus';
import type { Restaurant, MenuItem, Promotion, Review } from '@/lib/types';

export default function RestaurantDetail({ id }: { id: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'photos'>('menu');
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rData } = await supabase.from('restaurants').select('*').eq('id', id).single();
      const { data: mData } = await supabase.from('menus').select('*').eq('restaurant_id', id);
      const { data: pData } = await supabase.from('promotions').select('*').eq('restaurant_id', id).eq('is_active', true);
      const { data: revData } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url, username)').eq('restaurant_id', id).order('created_at', { ascending: false });

      setRestaurant(rData ? (rData as Restaurant) : getMockRestaurant(id) ?? null);
      setMenus(mData?.length ? normalizeMenuItems(mData as Record<string, unknown>[]) : getMockMenus(id));
      setPromotions(pData?.length ? (pData as Promotion[]) : getMockPromotions(id));
      setReviews(revData?.length ? (revData as Review[]) : getMockReviews(id));
    } catch {
      setRestaurant(getMockRestaurant(id) ?? null);
      setMenus(getMockMenus(id));
      setPromotions(getMockPromotions(id));
      setReviews(getMockReviews(id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSaved(getGamificationState().savedRestaurants.includes(id));
  }, [id]);

  useEffect(() => {
    const firstCategory = menus.find((m) => m.category)?.category ?? (menus.length > 0 ? 'Other' : null);
    if (firstCategory) {
      setExpandedCategories({ [firstCategory]: true });
    }
  }, [menus]);

  const handleSave = () => {
    const state = toggleSavedRestaurant(id);
    setSaved(state.savedRestaurants.includes(id));
  };

  const menuByCategory = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    menus.forEach((item) => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menus]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff385c]/20 border-t-[#ff385c]" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Restaurant not found</h1>
        <Link href="/explore" className="mt-4 inline-block text-[#ff385c] font-semibold">Back to explore</Link>
      </div>
    );
  }

  const images = restaurant.images?.length ? restaurant.images : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-safe-sticky-cta sm:px-6 md:pb-8">
      <Link href="/explore" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950">
        <ChevronLeft className="h-4 w-4" /> Back to explore
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950 sm:text-4xl">{restaurant.name}</h1>
          {images.length > 0 && (
            <p className="mt-1 text-sm font-medium text-neutral-500">{images.length} photo{images.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {restaurant.business_hours && (
          <span className={`mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isOpenNow(restaurant.business_hours) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {isOpenNow(restaurant.business_hours) ? 'Open now' : 'Closed'}
          </span>
        )}
      </header>

      {/* Hero Gallery */}
      <section className="overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white shadow-sm">
        <div className="relative">
          {images.length === 5 ? (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-2">
              <div className="relative col-span-1 row-span-1 aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:h-[400px]">
                <Image src={images[0]} alt={restaurant.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" priority />
              </div>
              <div className="hidden grid-cols-2 grid-rows-2 gap-1 sm:col-span-2 sm:grid sm:gap-2">
                {images.slice(1, 5).map((img, i) => (
                  <div key={i} className="relative aspect-square h-[calc(200px-0.25rem)]">
                    <Image src={img} alt="" fill className="object-cover" sizes="25vw" />
                  </div>
                ))}
              </div>
              {/* Mobile fallback for other 4 images */}
              <div className="grid grid-cols-2 gap-1 sm:hidden">
                {images.slice(1, 5).map((img, i) => (
                  <div key={i} className="relative aspect-square">
                    <Image src={img} alt="" fill className="object-cover" sizes="50vw" />
                  </div>
                ))}
              </div>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-2">
              <div className="relative col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto sm:h-72">
                <Image src={images[0]} alt={restaurant.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" priority />
              </div>
              {images.slice(1, 3).map((img, i) => (
                <div key={i} className="relative hidden aspect-square sm:block sm:h-[calc(9rem-0.25rem)]">
                  <Image src={img} alt="" fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 text-8xl sm:h-64">
              {restaurant.emoji}
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                {restaurant.cuisine_types?.map((c) => (
                  <span key={c} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">{c}</span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {restaurant.rating}</span>
                <span className="flex items-center gap-1.5"><Utensils className="h-4 w-4" /> {restaurant.price_range}</span>
                <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> {restaurant.vibe} vibe</span>
              </div>
              {restaurant.address && (
                <p className="mt-3 flex items-start gap-2 text-neutral-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {restaurant.address}
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                saved ? 'bg-[#ff385c] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Heart className={`h-4 w-4 ${saved ? 'fill-white' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>

          {restaurant.description && (
            <p className="mt-6 text-base leading-relaxed text-neutral-700">{restaurant.description}</p>
          )}

          {restaurant.business_hours && Object.keys(restaurant.business_hours).length > 0 && (
            <BusinessHours hours={restaurant.business_hours} />
          )}
        </div>
      </section>

      {/* Facilities */}
      {restaurant.facilities && restaurant.facilities.length > 0 && (
        <section className="mt-8 border-b border-neutral-100 pb-12">
          <header className="mb-6 sm:mb-8">
            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-4xl text-neutral-900">
              What this restaurant offers
            </h2>
          </header>

          <div className="grid grid-cols-2 gap-x-4 sm:gap-x-10">
            {restaurant.facilities.map((facility) => {
              const Icon = (FACILITY_ICON_MAP[facility.icon] ?? HelpCircle) as LucideIconComponent;

              return (
                <article
                  key={facility.id}
                  className="group flex min-h-[64px] items-center gap-3 py-3 sm:min-h-[88px] sm:gap-5 sm:py-5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-900 ring-1 ring-neutral-100 transition duration-200 group-hover:bg-neutral-900 group-hover:text-white sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icon strokeWidth={1.8} className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <p className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-neutral-800 sm:text-[18px]">
                    {facility.name}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-4 text-lg font-bold text-neutral-950">Current offers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {promotions.map((promo) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 rounded-2xl border border-[#ff385c]/20 bg-[#fff4f6] p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff385c] text-white">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#ff385c]">{promo.discount_label}</span>
                  <h3 className="font-bold text-neutral-950">{promo.title}</h3>
                  {promo.description && <p className="mt-1 text-sm text-neutral-600">{promo.description}</p>}
                  {promo.valid_until && (
                    <p className="mt-2 text-xs font-semibold text-neutral-400">Valid until {promo.valid_until}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <section className="mt-8">
        <div className="mb-6 flex gap-2 border-b border-neutral-200">
          {(['menu', 'reviews', 'photos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-bold capitalize transition ${
                activeTab === tab
                  ? 'border-b-2 border-[#ff385c] text-[#ff385c]'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'menu' && (
          <div className="space-y-4">
            {Object.keys(menuByCategory).length === 0 ? (
              <p className="text-neutral-500">Menu coming soon.</p>
            ) : (
              Object.entries(menuByCategory).map(([category, items]) => {
                const isExpanded = !!expandedCategories[category]; // Default to collapsed
                return (
                  <div key={category} className="overflow-hidden rounded-[2rem] border border-neutral-100 bg-white shadow-sm">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center justify-between p-6 text-left transition hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-[#ff385c]" />
                        <h3 className="text-lg font-bold text-neutral-950">{category}</h3>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-black uppercase text-neutral-400">
                          {items.length} items
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-neutral-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="space-y-3 border-t border-neutral-50 p-6 pt-0">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="flex w-full items-center justify-between py-4 border-b border-neutral-50 last:border-0 text-left transition hover:bg-neutral-50/50 -mx-6 px-6"
                              >
                                <div className="min-w-0 pr-4">
                                  <p className="font-bold text-neutral-950 truncate">{item.name}</p>
                                  {item.description && <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{item.description}</p>}
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="shrink-0 text-lg font-bold text-[#ff385c]">RM {item.price.toFixed(2)}</p>
                                  {item.image_url && (
                                    <Image src={item.image_url} alt={item.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-neutral-500">No reviews yet. Be the first!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-neutral-100 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 font-bold text-neutral-500">
                        {review.profiles?.full_name?.charAt(0) ?? '?'}
                      </div>
                      <div>
                        <p className="font-bold">{review.profiles?.full_name ?? 'Anonymous'}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="mt-3 text-neutral-700">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
            <div id="review-form">
              <ReviewForm restaurantId={id} restaurantName={restaurant.name} onSuccess={fetchData} />
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.length === 0 ? (
              <p className="col-span-full text-neutral-500">No photos uploaded yet.</p>
            ) : (
              images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <MenuItemModal
            item={selectedItem}
            restaurantName={restaurant.name}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Sticky mobile bottom bar — Save / Share / Reserve */}
      <div
        className="fixed bottom-nav-offset left-0 right-0 z-60 border-t border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {/* Save */}
          <button
            onClick={handleSave}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition active:scale-95 ${
              saved ? 'bg-[#ff385c] text-white shadow-sm' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-white' : ''}`} />
            {saved ? 'Saved' : 'Save'}
          </button>

          {/* Share */}
          <button
            onClick={async () => {
              if (navigator.share) {
                await navigator.share({ title: restaurant.name, text: `Check out ${restaurant.name} on Makanjom!`, url: window.location.href });
              } else {
                await navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 transition active:scale-95"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>

          {/* Review */}
          <button
            onClick={() => {
              setActiveTab('reviews');
              setTimeout(() => {
                document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-950 py-3.5 text-sm font-bold text-white transition active:scale-95"
          >
            <Star className="h-4 w-4" /> Review
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItemModal({ item, restaurantName, onClose }: { item: MenuItem; restaurantName: string; onClose: () => void }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [photos, setPhotos] = useState<string[]>(item.images || (item.image_url ? [item.image_url] : []));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && photos.length < 3) {
      const url = URL.createObjectURL(file);
      setPhotos([...photos, url]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        {/* Photo Section */}
        <div className="relative aspect-[4/3] bg-neutral-100">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            {photos.length > 0 ? (
              <motion.img
                key={photos[currentPhoto]}
                src={photos[currentPhoto]}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-neutral-400">
                <Utensils size={48} strokeWidth={1} />
                <p className="mt-2 text-sm font-medium">No photos yet</p>
              </div>
            )}
          </AnimatePresence>

          {photos.length > 1 && (
            <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length); }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-neutral-950 shadow-lg backdrop-blur-sm transition hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPhoto((prev) => (prev + 1) % photos.length); }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-neutral-950 shadow-lg backdrop-blur-sm transition hover:bg-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Indicator & Upload Button Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    i === currentPhoto ? "w-4 bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
            
            {photos.length < 3 && (
              <label className="group flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-xs font-black uppercase tracking-widest text-neutral-950 shadow-lg backdrop-blur-sm transition hover:bg-white cursor-pointer active:scale-95">
                <Plus size={14} strokeWidth={3} />
                <span>Add Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-neutral-950">{item.name}</h2>
              <p className="mt-1 text-sm font-bold text-[#ff385c] uppercase tracking-[0.1em]">{item.category}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-neutral-950">RM {item.price.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">per portion</p>
            </div>
          </div>

          <p className="mt-4 text-base leading-relaxed text-neutral-600">
            {item.description || "Freshly prepared with premium ingredients. Our chef's special selection for today's menu."}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Hi! I'd like to enquire about "${item.name}" (RM ${item.price.toFixed(2)}) at ${restaurantName}. Is it available?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,211,102,0.25)] transition hover:bg-[#1ebe5a] active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enquire on WhatsApp
            </a>
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white py-3.5 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50 active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
