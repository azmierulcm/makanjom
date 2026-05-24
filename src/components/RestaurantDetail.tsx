'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  MapPin, Star, Heart, Tag, Utensils, ChevronLeft, Sparkles,
} from 'lucide-react';
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/explore" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950">
        <ChevronLeft className="h-4 w-4" /> Back to explore
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">{restaurant.name}</h1>
        <p className="mt-1 text-sm font-medium text-neutral-500">{images.length} items</p>
      </header>

      {/* Hero Gallery */}
      <section className="overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white shadow-sm">
        <div className="relative">
          {images.length === 5 ? (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-2">
              <div className="col-span-1 row-span-1 aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:h-[400px]">
                <img src={images[0]} alt={restaurant.name} className="h-full w-full object-cover" />
              </div>
              <div className="hidden grid-cols-2 grid-rows-2 gap-1 sm:col-span-2 sm:grid sm:gap-2">
                {images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-square h-[calc(200px-0.25rem)]">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              {/* Mobile fallback for other 4 images */}
              <div className="grid grid-cols-2 gap-1 sm:hidden">
                {images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-square">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-2">
              <div className="col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto sm:h-72">
                <img src={images[0]} alt={restaurant.name} className="h-full w-full object-cover" />
              </div>
              {images.slice(1, 3).map((img, i) => (
                <div key={i} className="hidden aspect-square sm:block sm:h-[calc(9rem-0.25rem)]">
                  <img src={img} alt="" className="h-full w-full object-cover" />
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
        </div>
      </section>

      {/* Facilities */}
      {restaurant.facilities && restaurant.facilities.length > 0 && (
        <section className="mt-8 border-b border-neutral-100 pb-8">
          <h2 className="mb-6 text-xl font-bold text-neutral-950">Facilities & Amenities</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {restaurant.facilities.map((facility) => {
              const Icon = (Icons[facility.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.HelpCircle;
              return (
                <div key={facility.id} className="group rounded-[2rem] border border-neutral-100 bg-white p-6 transition-all hover:border-[#ff385c]/20 hover:shadow-md">
                  <div className="flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-900 ring-1 ring-neutral-200 transition-colors group-hover:bg-[#ff385c]/5 group-hover:text-[#ff385c] group-hover:ring-[#ff385c]/20">
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-950">{facility.name}</h3>
                      <p className="mt-1 text-base text-neutral-500 leading-relaxed">{facility.description}</p>
                    </div>
                  </div>
                  {facility.photo_url && (
                    <div className="mt-6 overflow-hidden rounded-2xl">
                      <img 
                        src={facility.photo_url} 
                        alt={facility.name} 
                        className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                  )}
                </div>
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
                const isExpanded = expandedCategories[category] !== false; // Default to expanded
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
                      <Icons.ChevronDown
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
                              <div key={item.id} className="flex items-center justify-between py-4 border-b border-neutral-50 last:border-0">
                                <div className="min-w-0 pr-4">
                                  <p className="font-bold text-neutral-950 truncate">{item.name}</p>
                                  {item.description && <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{item.description}</p>}
                                </div>
                                <p className="shrink-0 text-lg font-bold text-[#ff385c]">RM {item.price.toFixed(2)}</p>
                              </div>
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
            <ReviewForm restaurantId={id} restaurantName={restaurant.name} onSuccess={fetchData} />
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.length === 0 ? (
              <p className="col-span-full text-neutral-500">No photos uploaded yet.</p>
            ) : (
              images.map((img, i) => (
                <img key={i} src={img} alt="" className="aspect-square rounded-2xl object-cover" />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
