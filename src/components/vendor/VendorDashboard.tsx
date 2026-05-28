'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import {
  ChevronRight, Package, Clock3, Store, LayoutGrid,
  Plus, Utensils, ChevronDown, ChevronUp, X, LogOut, Lock, Pencil, Check,
  Wifi, ParkingCircle, Baby, Music, Wind, Coffee, Tv, Accessibility, Dog, Crown,
} from 'lucide-react';
import VendorUpgrade from '@/components/vendor/VendorUpgrade';
import ImageUpload from '@/components/ImageUpload';

// Explicit map of the amenity icons offered in the icon picker.
// Using a constrained map instead of `import * as Icons` avoids bundling all 400+ lucide icons.
type LucideIconComponent = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
const AMENITY_ICON_MAP: Record<string, LucideIconComponent> = {
  Wifi, ParkingCircle, Baby, Music, Wind,
  Utensils, Coffee, Tv, Accessibility, Dog,
};
import { normalizeMenuItem } from '@/lib/menus';
import type { MenuItem, Facility } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  items: Record<string, unknown>;
  total_price: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
}

interface Booking {
  id: string;
  guest_count: number;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  emoji: string;
  price_range: string;
  vibe: string;
  address: string | null;
  facilities: Facility[];
  tier: 'free' | 'basic_order' | 'premium';
}

interface EditForm {
  name: string;
  price: string;
  description: string;
  is_available: boolean;
  image_url: string;
}

interface AddItemForm {
  name: string;
  price: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type OrderStatus = Order['status'];

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: 'Accept & Prepare',
  preparing: 'Mark Ready',
  ready: 'Mark Collected',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-orange-50 text-orange-600 border-orange-100',
  accepted: 'bg-blue-50 text-blue-600 border-blue-100',
  preparing: 'bg-purple-50 text-purple-600 border-purple-100',
  ready: 'bg-green-50 text-green-600 border-green-100',
  completed: 'bg-neutral-50 text-neutral-600 border-neutral-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
};

const AMENITY_ICONS = [
  'Wifi', 'ParkingCircle', 'Baby', 'Music', 'Wind',
  'Utensils', 'Coffee', 'Tv', 'Accessibility', 'Dog',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings' | 'listing' | 'upgrade'>('orders');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchRestaurantAndData = useCallback(async (userId: string) => {
    setLoading(true);
    const { data: restData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('vendor_id', userId)
      .limit(1)
      .single();

    if (restData) {
      setRestaurant(restData as Restaurant);

      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restData.id)
        .order('created_at', { ascending: false });
      if (orderData) setOrders(orderData as Order[]);

      if (restData.tier === 'premium') {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*')
          .eq('restaurant_id', restData.id)
          .order('booking_date', { ascending: true });
        if (bookingData) setBookings(bookingData as Booking[]);
      }
    }
    setLoading(false);
  }, []);

  // Real-time order subscription scoped to this vendor's restaurant
  useEffect(() => {
    if (!restaurant) return;

    const channel = supabase
      .channel(`vendor-orders-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurant]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      if (user) fetchRestaurantAndData(user.id);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        if (session?.user) fetchRestaurantAndData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRestaurant(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [fetchRestaurantAndData]);

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) alert('Failed to update order: ' + error.message);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);
    if (error) {
      alert('Failed to update booking: ' + error.message);
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b))
      );
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="w-8 h-8 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login?redirect=/vendor';
    return null;
  }

  const userRole = (user.user_metadata?.role as string) ?? '';
  if (userRole && userRole !== 'vendor') {
    const destinations: Record<string, string> = { admin: '/admin', creator: '/creator', customer: '/profile' };
    if (typeof window !== 'undefined') window.location.href = destinations[userRole] ?? '/profile';
    return null;
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" />
        <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Opening Kitchen...</p>
      </div>
    </div>
  );

  if (!restaurant) return (
    <VendorOnboarding
      userId={user.id}
      onCreated={() => fetchRestaurantAndData(user.id)}
      onSignOut={handleSignOut}
    />
  );

  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-[#faf9f7] px-4 md:px-8 pb-32">
      <header className="py-6 md:py-12 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full shadow-sm">
              <Store size={14} className="text-[#ff385c]" />
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Vendor Hub</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
          <h1 className="text-3xl md:text-6xl font-semibold tracking-tight text-neutral-950 leading-tight">
            {restaurant.name}
          </h1>
          <p className="text-base md:text-lg text-neutral-500 font-medium">
            Manage your restaurant workflow with ease.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <StatCard label="Active Orders" value={activeOrders.length} icon={<Package size={18} />} />
          <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-neutral-200 shadow-sm flex flex-col justify-between min-w-[120px]">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tier</p>
            <span className="mt-2 text-xs md:text-sm font-black text-[#ff385c] uppercase">{restaurant.tier}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-4 md:mt-8">
        <div className="flex gap-2 p-1.5 bg-neutral-200/50 rounded-full mb-10 w-fit overflow-x-auto scrollbar-hide">
          {(['orders', 'bookings', 'listing', 'upgrade'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 md:px-8 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab ? 'bg-white shadow-md text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'upgrade' && <Crown size={13} className={activeTab === tab ? 'text-[#ff385c]' : 'text-neutral-400'} />}
              {tab === 'listing' ? 'Store Front' : tab === 'bookings' ? 'Reservations' : tab === 'upgrade' ? 'Upgrade' : 'Orders'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.section
              key="orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onUpdate={updateOrderStatus} />
                ))
              ) : (
                <div className="col-span-full"><EmptyState message="The order queue is empty." /></div>
              )}
            </motion.section>
          ) : activeTab === 'bookings' ? (
            <motion.section
              key="bookings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {restaurant.tier !== 'premium' ? (
                <div className="col-span-full">
                  <UpgradeGating tier="Premium" message="Allow customers to reserve tables directly through Makanjom." />
                </div>
              ) : bookings.length > 0 ? (
                bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onUpdate={updateBookingStatus} />
                ))
              ) : (
                <div className="col-span-full"><EmptyState message="No reservations booked yet." /></div>
              )}
            </motion.section>
          ) : activeTab === 'listing' ? (
            <motion.section
              key="listing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ListingManager
                restaurant={restaurant}
                onRestaurantUpdate={() => fetchRestaurantAndData(user.id)}
              />
            </motion.section>
          ) : (
            <motion.section
              key="upgrade"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <VendorUpgrade
                currentTier={restaurant.tier}
                restaurant={{ name: restaurant.name }}
                user={user}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Vendor Onboarding ────────────────────────────────────────────────────────

const CUISINE_OPTIONS = [
  'Malaysian', 'Chinese', 'Indian', 'Western', 'Japanese',
  'Korean', 'Thai', 'Italian', 'Middle Eastern', 'Fusion',
];

const EMOJI_OPTIONS = ['🍽️','🍜','🍛','🍣','🥩','🍔','🌮','🥗','🍕','🧆','🫕','🍱'];

function VendorOnboarding({
  userId,
  onCreated,
  onSignOut,
}: {
  userId: string;
  onCreated: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [emoji, setEmoji] = useState('🍽️');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCuisine = (c: string) =>
    setSelectedCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter your restaurant name.'); return; }
    setSaving(true);
    setError(null);

    // Ensure the profile row exists — it may be missing if the trigger
    // failed during registration. Upsert so it's idempotent.
    const { data: { user } } = await supabase.auth.getUser();
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      role: 'vendor',
      full_name: user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? null,
    }, { onConflict: 'id' });

    if (profileError) {
      setError('Failed to set up your account profile: ' + profileError.message);
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from('restaurants').insert({
      vendor_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      cuisine_types: selectedCuisines,
      emoji,
      tier: 'free',
    });
    if (dbError) {
      setError(dbError.message);
      setSaving(false);
    } else {
      onCreated();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6 text-4xl">
            {emoji}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full shadow-sm mb-4">
            <Store size={12} className="text-[#ff385c]" />
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">New Venue</span>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950">Set up your restaurant</h1>
          <p className="mt-2 text-neutral-500 text-sm">Tell us about your venue — you can edit everything later.</p>
        </div>

        <div className="bg-white rounded-[3rem] border border-neutral-100 shadow-sm p-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Warung Mak Jom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">
              Short Description
            </label>
            <textarea
              placeholder="What makes your restaurant special?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-5 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-medium outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 px-1">
              Restaurant Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center border-2 transition-all ${
                    emoji === e
                      ? 'border-[#ff385c] bg-rose-50 shadow-sm'
                      : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine types */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 px-1">
              Cuisine Types
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                    selectedCuisines.includes(c)
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-100 bg-neutral-50 text-neutral-500 hover:border-neutral-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-xs font-bold text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="w-full py-5 bg-[#ff385c] text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#ff385c]/20 hover:bg-[#e93252] transition-all disabled:opacity-50 active:scale-95"
          >
            {saving ? 'Creating your venue…' : 'Create Restaurant →'}
          </button>
        </div>

        <button
          onClick={onSignOut}
          className="mt-6 w-full text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Shared Modal Wrapper ─────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative w-full max-w-xl bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-200 shadow-sm min-w-[140px]">
      <div className="text-[#ff385c] mb-3">{icon}</div>
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-semibold mt-1 tracking-tight">{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const nextStatus = STATUS_NEXT[order.status];
  const nextAction = nextStatus ? STATUS_ACTION[order.status] : null;

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    await onUpdate(order.id, nextStatus);
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdating(true);
    await onUpdate(order.id, 'cancelled');
    setUpdating(false);
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white p-6 md:p-8 rounded-[3rem] border border-neutral-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${STATUS_COLORS[order.status]}`}>
            {order.status}
          </div>
          <p className="text-[10px] font-bold text-neutral-300">#{order.id.slice(0, 6)}</p>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight mb-2">
          RM {(order.total_price ?? 0).toFixed(2)}
        </h3>
        <p className="text-neutral-500 font-medium text-sm">
          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {nextAction && (
        <div className="mt-8 flex gap-2">
          <button
            onClick={handleAdvance}
            disabled={updating}
            className="flex-1 flex items-center justify-between p-4 bg-neutral-950 text-white rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            <span className="text-xs font-bold uppercase tracking-widest">
              {updating ? 'Updating…' : nextAction}
            </span>
            <ChevronRight size={18} />
          </button>
          <button
            onClick={handleCancel}
            disabled={updating}
            className="px-4 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function BookingCard({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  const handleConfirm = async () => {
    setUpdating(true);
    await onUpdate(booking.id, 'confirmed');
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this reservation?')) return;
    setUpdating(true);
    await onUpdate(booking.id, 'cancelled');
    setUpdating(false);
  };

  const statusBadge: Record<Booking['status'], string> = {
    pending: 'bg-orange-50 text-orange-600',
    confirmed: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-neutral-50 rounded-[1.5rem] flex items-center justify-center text-2xl font-bold text-neutral-800">
            {booking.guest_count}
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">{booking.booking_time}</h3>
            <p className="text-sm text-neutral-500 font-medium">
              {new Date(booking.booking_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusBadge[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={updating}
            className="flex-1 py-3 bg-neutral-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            {updating ? 'Saving…' : 'Confirm'}
          </button>
          <button
            onClick={handleCancel}
            disabled={updating}
            className="px-4 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ListingManager ───────────────────────────────────────────────────────────

const PRICE_RANGES = ['RM', 'RM RM', 'RM RM RM', 'RM RM RM RM'];
const VIBE_OPTIONS = ['Cozy', 'Casual', 'Fine Dining', 'Cafe', 'Street Food', 'Family', 'Romantic', 'Trendy'];

function ListingManager({
  restaurant,
  onRestaurantUpdate,
}: {
  restaurant: Restaurant;
  onRestaurantUpdate: () => void;
}) {
  const restaurantId = restaurant.id;

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [facilities, setFacilities] = useState<Facility[]>(restaurant.facilities ?? []);

  // Restaurant info editing
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    name: restaurant.name,
    description: restaurant.description ?? '',
    address: restaurant.address ?? '',
    price_range: restaurant.price_range ?? 'RM RM',
    vibe: restaurant.vibe ?? 'Cozy',
    cuisine_types: restaurant.cuisine_types ?? [] as string[],
    emoji: restaurant.emoji ?? '🍽️',
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Edit item modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', price: '', description: '', is_available: true, image_url: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Add item modal
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [addItemForm, setAddItemForm] = useState<AddItemForm>({ name: '', price: '', description: '' });
  const [savingAdd, setSavingAdd] = useState(false);

  // New category modal
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Add amenity modal
  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityIcon, setNewAmenityIcon] = useState('Utensils');
  const [savingAmenity, setSavingAmenity] = useState(false);

  const saveInfo = async () => {
    if (!infoForm.name.trim()) { setInfoError('Restaurant name is required.'); return; }
    setSavingInfo(true);
    setInfoError(null);
    const { error } = await supabase.from('restaurants').update({
      name: infoForm.name.trim(),
      description: infoForm.description.trim() || null,
      address: infoForm.address.trim() || null,
      price_range: infoForm.price_range,
      vibe: infoForm.vibe,
      cuisine_types: infoForm.cuisine_types,
      emoji: infoForm.emoji,
    }).eq('id', restaurantId);

    if (error) {
      setInfoError(error.message);
    } else {
      setEditingInfo(false);
      setInfoSuccess(true);
      onRestaurantUpdate();
      setTimeout(() => setInfoSuccess(false), 3000);
    }
    setSavingInfo(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('menus').select('*').eq('restaurant_id', restaurantId);
      if (data) setMenus(data.map((row) => normalizeMenuItem(row as Record<string, unknown>)));
      setLoading(false);
    };
    if (restaurantId) fetchData();
  }, [restaurantId]);

  const menuByCategory = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    menus.forEach((item) => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menus]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const openEditModal = (item: MenuItem) => {
    setEditForm({
      name: item.name,
      price: String(item.price),
      description: item.description ?? '',
      is_available: item.is_available,
      image_url: item.image_url ?? '',
    });
    setEditingItem(item);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const price = parseFloat(editForm.price);
    if (!editForm.name.trim() || isNaN(price) || price < 0) {
      alert('Please enter a valid name and price.');
      return;
    }
    setSavingEdit(true);
    const { data, error } = await supabase
      .from('menus')
      .update({
        name: editForm.name.trim(),
        price,
        description: editForm.description.trim() || null,
        is_available: editForm.is_available,
        image_url: editForm.image_url || null,
      })
      .eq('id', editingItem.id)
      .select()
      .single();

    if (error) {
      alert('Save failed: ' + error.message);
    } else if (data) {
      setMenus((prev) =>
        prev.map((m) =>
          m.id === editingItem.id ? normalizeMenuItem(data as Record<string, unknown>) : m
        )
      );
      setEditingItem(null);
    }
    setSavingEdit(false);
  };

  const saveNewItem = async () => {
    const price = parseFloat(addItemForm.price);
    if (!addItemForm.name.trim() || isNaN(price) || price < 0 || !addingToCategory) {
      alert('Please enter a valid name and price.');
      return;
    }
    setSavingAdd(true);
    const { data, error } = await supabase
      .from('menus')
      .insert({
        restaurant_id: restaurantId,
        name: addItemForm.name.trim(),
        price,
        description: addItemForm.description.trim() || null,
        category: addingToCategory,
        is_available: true,
      })
      .select()
      .single();

    if (error) {
      alert('Failed to add item: ' + error.message);
    } else if (data) {
      setMenus((prev) => [...prev, normalizeMenuItem(data as Record<string, unknown>)]);
      setAddingToCategory(null);
      setAddItemForm({ name: '', price: '', description: '' });
    }
    setSavingAdd(false);
  };

  const removeFacility = async (facilityId: string) => {
    const updated = facilities.filter((f) => f.id !== facilityId);
    const { error } = await supabase
      .from('restaurants')
      .update({ facilities: updated })
      .eq('id', restaurantId);
    if (error) alert('Failed to remove: ' + error.message);
    else setFacilities(updated);
  };

  const addAmenity = async () => {
    if (!newAmenityName.trim()) return;
    setSavingAmenity(true);
    const newFacility: Facility = {
      id: crypto.randomUUID(),
      name: newAmenityName.trim(),
      description: '',
      icon: newAmenityIcon,
    };
    const updated = [...facilities, newFacility];
    const { error } = await supabase
      .from('restaurants')
      .update({ facilities: updated })
      .eq('id', restaurantId);

    if (error) {
      alert('Failed to add amenity: ' + error.message);
    } else {
      setFacilities(updated);
      setShowAddAmenity(false);
      setNewAmenityName('');
      setNewAmenityIcon('Utensils');
    }
    setSavingAmenity(false);
  };

  const confirmNewCategory = () => {
    if (!newCategoryName.trim()) return;
    setAddingToCategory(newCategoryName.trim());
    setAddItemForm({ name: '', price: '', description: '' });
    setShowAddCategory(false);
    setNewCategoryName('');
  };

  return (
    <div className="space-y-10">
      {/* Restaurant Info */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-950">Restaurant Info</h3>
            <p className="text-neutral-500 text-sm mt-1">Edit your listing details visible to customers.</p>
          </div>
          {!editingInfo && (
            <button
              onClick={() => { setEditingInfo(true); setInfoError(null); }}
              className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 rounded-full text-xs font-black uppercase tracking-widest text-neutral-600 hover:border-neutral-400 transition-all"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        {infoSuccess && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700">
            <Check size={14} /> Saved successfully
          </div>
        )}

        {editingInfo ? (
          <div className="space-y-5">
            {/* Name + Emoji row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Name *</label>
                <input
                  type="text"
                  value={infoForm.name}
                  onChange={(e) => setInfoForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Emoji</label>
                <input
                  type="text"
                  value={infoForm.emoji}
                  onChange={(e) => setInfoForm(f => ({ ...f, emoji: e.target.value }))}
                  className="w-16 px-3 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xl text-center outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Description</label>
              <textarea
                value={infoForm.description}
                onChange={(e) => setInfoForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="What makes your restaurant special?"
                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-medium outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Address</label>
              <input
                type="text"
                value={infoForm.address}
                onChange={(e) => setInfoForm(f => ({ ...f, address: e.target.value }))}
                placeholder="e.g. 12, Jalan Bukit Bintang, KL"
                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 focus:bg-white transition-all"
              />
            </div>

            {/* Price range + Vibe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Price Range</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_RANGES.map(p => (
                    <button key={p} type="button" onClick={() => setInfoForm(f => ({ ...f, price_range: p }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${infoForm.price_range === p ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Vibe</label>
                <div className="flex flex-wrap gap-1.5">
                  {VIBE_OPTIONS.map(v => (
                    <button key={v} type="button" onClick={() => setInfoForm(f => ({ ...f, vibe: v }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${infoForm.vibe === v ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cuisine types */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-1">Cuisine Types</label>
              <div className="flex flex-wrap gap-1.5">
                {['Malaysian','Chinese','Indian','Western','Japanese','Korean','Thai','Italian','Middle Eastern','Fusion'].map(c => (
                  <button key={c} type="button"
                    onClick={() => setInfoForm(f => ({
                      ...f,
                      cuisine_types: f.cuisine_types.includes(c)
                        ? f.cuisine_types.filter(x => x !== c)
                        : [...f.cuisine_types, c]
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${infoForm.cuisine_types.includes(c) ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {infoError && (
              <p className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-xs font-bold text-red-600">{infoError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={saveInfo} disabled={savingInfo}
                className="flex-1 py-4 bg-neutral-950 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 active:scale-95">
                {savingInfo ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditingInfo(false); setInfoError(null); }}
                className="px-6 py-4 border border-neutral-200 rounded-full text-xs font-black uppercase tracking-widest text-neutral-500 hover:border-neutral-300 transition-all">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-3xl shrink-0">
                {restaurant.emoji}
              </div>
              <div>
                <p className="font-black text-xl text-neutral-950">{restaurant.name}</p>
                {restaurant.description && <p className="text-sm text-neutral-500 mt-1">{restaurant.description}</p>}
                {restaurant.address && <p className="text-xs text-neutral-400 mt-1 font-medium">{restaurant.address}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-100 text-xs font-bold text-neutral-600">{restaurant.price_range}</span>
              <span className="px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-100 text-xs font-bold text-neutral-600">{restaurant.vibe}</span>
              {restaurant.cuisine_types?.map(c => (
                <span key={c} className="px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-100 text-xs font-bold text-neutral-600">{c}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Menu */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-neutral-950">Menu Management</h3>
            <p className="text-neutral-500 text-sm mt-1">Organize your dishes by category.</p>
          </div>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#ff385c] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-[#ff385c]/20 hover:bg-[#e93252] transition-all"
          >
            <Plus size={16} strokeWidth={3} /> New Category
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="h-20 bg-white rounded-[2rem] animate-pulse border border-neutral-100" />
            ))
          ) : Object.keys(menuByCategory).length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <Utensils size={32} className="mx-auto mb-4 opacity-30" />
              <p className="font-bold uppercase text-xs tracking-widest">No menu items yet — add a category to start.</p>
            </div>
          ) : (
            Object.entries(menuByCategory).map(([category, items]) => {
              const isCollapsed = collapsedCategories.has(category);
              return (
                <div key={category} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full p-6 flex items-center justify-between bg-neutral-50/50 hover:bg-neutral-100/50 transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#ff385c]" />
                      <h4 className="font-bold text-neutral-900">{category}</h4>
                      <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-neutral-400 border border-neutral-200 uppercase">
                        {items.length} items
                      </span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown size={18} className="text-neutral-400" />
                      : <ChevronUp size={18} className="text-neutral-400" />}
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-300 shrink-0 overflow-hidden">
                              {item.image_url
                                ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                : <Utensils size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold text-xs md:text-sm truncate ${!item.is_available ? 'text-neutral-400 line-through' : 'text-neutral-950'}`}>
                                {item.name}
                              </p>
                              <p className="text-[10px] md:text-xs text-neutral-400 font-medium">
                                RM {item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${item.is_available ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                              {item.is_available ? 'In Stock' : 'Off Menu'}
                            </span>
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-3 md:px-4 py-1.5 bg-white border border-neutral-200 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:border-[#ff385c] hover:text-[#ff385c] transition-all"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setAddItemForm({ name: '', price: '', description: '' });
                          setAddingToCategory(category);
                        }}
                        className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-[#ff385c] transition-colors border-2 border-dashed border-neutral-100 rounded-2xl hover:border-[#ff385c]/20 hover:bg-[#ff385c]/5"
                      >
                        <Plus size={14} strokeWidth={3} /> Add to {category}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Facilities */}
      <section className="bg-white p-6 md:p-8 rounded-[3rem] border border-neutral-200 shadow-sm">
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight">Facilities & Amenities</h3>
          <p className="text-neutral-500 text-sm mt-1">Features and services your restaurant offers.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {facilities.map((f) => {
            const Icon = (AMENITY_ICON_MAP[f.icon] ?? Utensils) as LucideIconComponent;
            return (
              <div key={f.id} className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-neutral-50 border border-neutral-100 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center text-neutral-900 shadow-sm shrink-0">
                    <Icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-neutral-800 truncate">{f.name}</span>
                </div>
                <button
                  onClick={() => removeFacility(f.id)}
                  className="ml-2 p-1.5 text-neutral-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => setShowAddAmenity(true)}
            className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-2xl border-2 border-dashed border-neutral-100 text-neutral-400 hover:border-[#ff385c] hover:bg-[#ff385c]/5 hover:text-[#ff385c] transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="text-[9px] md:text-xs font-black uppercase tracking-widest">Add Amenity</span>
          </button>
        </div>
      </section>

      {/* ── Modals ── */}

      {/* Edit Item */}
      <AnimatePresence>
        {editingItem && (
          <Modal onClose={() => setEditingItem(null)}>
            <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-neutral-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg md:text-xl font-bold tracking-tight">Edit Menu Item</h3>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">{editingItem.category}</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Item Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-medium outline-none focus:border-[#ff385c]/30 transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Photo</label>
                <ImageUpload
                  compact
                  value={editForm.image_url}
                  onChange={(url) => setEditForm((f) => ({ ...f, image_url: url }))}
                  folder="menu-items"
                  label="Upload item photo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Price (RM)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Availability</label>
                  <button
                    onClick={() => setEditForm((f) => ({ ...f, is_available: !f.is_available }))}
                    className={`w-full h-12 flex items-center gap-3 px-5 rounded-2xl border transition-all font-bold text-sm ${
                      editForm.is_available
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${editForm.is_available ? 'bg-green-500' : 'bg-neutral-300'}`} />
                    {editForm.is_available ? 'In Stock' : 'Off Menu'}
                  </button>
                </div>
              </div>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="w-full py-5 bg-neutral-950 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add Item */}
      <AnimatePresence>
        {addingToCategory !== null && (
          <Modal onClose={() => setAddingToCategory(null)}>
            <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-neutral-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg md:text-xl font-bold tracking-tight">Add Menu Item</h3>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">{addingToCategory}</p>
              </div>
              <button onClick={() => setAddingToCategory(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nasi Lemak Special"
                  value={addItemForm.name}
                  onChange={(e) => setAddItemForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Description (optional)</label>
                <textarea
                  placeholder="Short description..."
                  value={addItemForm.description}
                  onChange={(e) => setAddItemForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-medium outline-none focus:border-[#ff385c]/30 transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Price (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={addItemForm.price}
                  onChange={(e) => setAddItemForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
                />
              </div>
              <button
                onClick={saveNewItem}
                disabled={savingAdd}
                className="w-full py-5 bg-[#ff385c] text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#ff385c]/20 hover:bg-[#e93252] transition-all disabled:opacity-50"
              >
                {savingAdd ? 'Adding…' : 'Add Item'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* New Category */}
      <AnimatePresence>
        {showAddCategory && (
          <Modal onClose={() => setShowAddCategory(false)}>
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-tight">New Category</h3>
                <button onClick={() => setShowAddCategory(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Course, Drinks, Desserts"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmNewCategory()}
                    autoFocus
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
                  />
                </div>
                <button
                  onClick={confirmNewCategory}
                  disabled={!newCategoryName.trim()}
                  className="w-full py-5 bg-neutral-950 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  Create & Add First Item
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add Amenity */}
      <AnimatePresence>
        {showAddAmenity && (
          <Modal onClose={() => setShowAddAmenity(false)}>
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-tight">Add Amenity</h3>
                <button onClick={() => setShowAddAmenity(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Free WiFi, Valet Parking"
                    value={newAmenityName}
                    onChange={(e) => setNewAmenityName(e.target.value)}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {AMENITY_ICONS.map((iconName) => {
                      const Icon = (AMENITY_ICON_MAP[iconName] ?? Utensils) as LucideIconComponent;
                      return (
                        <button
                          key={iconName}
                          onClick={() => setNewAmenityIcon(iconName)}
                          className={`aspect-square flex items-center justify-center rounded-2xl border-2 transition-all ${
                            newAmenityIcon === iconName
                              ? 'border-[#ff385c] bg-[#ff385c]/5 text-[#ff385c]'
                              : 'border-neutral-100 bg-neutral-50 text-neutral-400 hover:border-neutral-300'
                          }`}
                        >
                          <Icon size={18} strokeWidth={1.5} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={addAmenity}
                  disabled={savingAmenity || !newAmenityName.trim()}
                  className="w-full py-5 bg-neutral-950 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  {savingAmenity ? 'Saving…' : 'Add Amenity'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Utility Components ───────────────────────────────────────────────────────

function UpgradeGating({ tier, message }: { tier: string; message: string }) {
  return (
    <div className="bg-white p-12 md:p-20 rounded-[4rem] border border-neutral-200 shadow-sm text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
        <Lock className="text-[#ff385c]" size={32} />
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full mb-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{tier} Feature</span>
      </div>
      <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Coming soon</h3>
      <p className="text-base text-neutral-500 font-medium max-w-sm mx-auto">{message}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-32 text-center">
      <div className="w-20 h-20 bg-neutral-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
        <Clock3 className="text-neutral-300" size={32} />
      </div>
      <p className="text-neutral-400 font-bold uppercase text-xs tracking-[0.2em]">{message}</p>
    </div>
  );
}
