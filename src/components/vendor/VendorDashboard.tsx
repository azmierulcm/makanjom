'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { 
  ClipboardList, 
  CalendarCheck, 
  ChevronRight, 
  ChefHat, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  TrendingUp,
  Package,
  Clock3,
  Store,
  LayoutGrid,
  Settings2,
  Camera,
  Plus,
  Utensils,
  ChevronDown,
  X
} from 'lucide-react';
import { normalizeMenuItems } from '@/lib/menus';
import type { MenuItem, Facility } from '@/lib/types';

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
  facilities: Facility[];
  tier: 'free' | 'basic_order' | 'premium';
}

export default function VendorDashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings' | 'listing'>('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantAndData();
    
    const ordersChannel = supabase
      .channel('live-orders')
      .on(
        'postgres_changes' as 'system',
        { event: '*', schema: 'public', table: 'orders' } as Record<string, string>,
        (payload: { eventType: string; new: Order }) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const fetchRestaurantAndData = async () => {
    setLoading(true);
    const { data: restData } = await supabase.from('restaurants').select('*').limit(1).single();
    
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
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" />
            <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Opening Kitchen...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] px-4 md:px-8 pb-32">
      <header className="py-12 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full shadow-sm">
            <Store size={14} className="text-[#ff385c]" />
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Vendor Hub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-neutral-950">{restaurant?.name}</h1>
          <p className="text-lg text-neutral-500 font-medium">Manage your restaurant workflow with ease.</p>
        </div>
        
        <div className="flex gap-4">
            <StatCard label="Today's Orders" value={orders.length} icon={<Package size={18}/>} />
            <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-200 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tier</p>
                <span className="mt-2 text-sm font-black text-[#ff385c] uppercase">{restaurant?.tier}</span>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8">
        <div className="flex gap-2 p-1.5 bg-neutral-200/50 rounded-full mb-10 w-fit overflow-x-auto">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white shadow-md text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-8 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'bookings' ? 'bg-white shadow-md text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Reservations
          </button>
          <button 
            onClick={() => setActiveTab('listing')}
            className={`px-8 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'listing' ? 'bg-white shadow-md text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Store Front
          </button>
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
              {restaurant?.tier === 'free' ? (
                  <div className="col-span-full"><UpgradeGating tier="Basic Order" message="Track real-time orders and update their status instantly." /></div>
              ) : (
                  orders.length > 0 ? orders.map(order => (
                      <OrderCard key={order.id} order={order} />
                  )) : <div className="col-span-full"><EmptyState message="The order queue is empty." /></div>
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
               {restaurant?.tier !== 'premium' ? (
                   <div className="col-span-full"><UpgradeGating tier="Premium" message="Allow customers to reserve tables directly through Makanjom." /></div>
              ) : (
                  bookings.length > 0 ? bookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} />
                  )) : <div className="col-span-full"><EmptyState message="No reservations booked yet." /></div>
              )}
            </motion.section>
          ) : (
            <motion.section 
              key="listing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
               <ListingManager restaurantId={restaurant?.id || ''} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ListingManager({ restaurantId }: { restaurantId: string }) {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data: rData } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
            if (rData) setRestaurant(rData as Restaurant);
            
            const { data: mData } = await supabase.from('menus').select('*').eq('restaurant_id', restaurantId);
            if (mData) setMenus(normalizeMenuItems(mData as Record<string, unknown>[]));
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

    return (
        <div className="space-y-12">
            {/* Gallery Manager Preview */}
            <section className="bg-white p-8 rounded-[3rem] border border-neutral-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">Gallery & Identity</h3>
                        <p className="text-neutral-500 text-sm mt-1">Manage your storefront images and brand emoji.</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">
                        Update Gallery
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="aspect-square bg-neutral-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 text-neutral-400 group cursor-pointer hover:border-[#ff385c] hover:bg-[#ff385c]/5 transition-all">
                        <Camera size={32} strokeWidth={1} className="group-hover:text-[#ff385c]" />
                        <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Main Hero</span>
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-square bg-neutral-50 rounded-3xl flex items-center justify-center text-neutral-300 border border-neutral-100">
                             <LayoutGrid size={24} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Menu Manager */}
            <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight text-neutral-950">Menu Management</h3>
                        <p className="text-neutral-500 text-sm mt-1">Organize your dishes into collapsible categories.</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#ff385c] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-[#ff385c]/20 hover:bg-[#e93252] transition-all">
                        <Plus size={16} strokeWidth={3} />
                        New Category
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        [1, 2].map(i => <div key={i} className="h-20 bg-white rounded-[2rem] animate-pulse border border-neutral-100" />)
                    ) : (
                        Object.entries(menuByCategory).map(([category, items]) => (
                            <div key={category} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                                <div className="p-6 flex items-center justify-between bg-neutral-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#ff385c]" />
                                        <h4 className="font-bold text-neutral-900">{category}</h4>
                                        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-neutral-400 border border-neutral-200 uppercase">{items.length} items</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"><Settings2 size={18} /></button>
                                        <button className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"><ChevronDown size={18} /></button>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-300">
                                                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-xl" /> : <Utensils size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-neutral-950">{item.name}</p>
                                                    <p className="text-xs text-neutral-400 font-medium">RM {item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setEditingItem(item)}
                                                className="opacity-0 group-hover:opacity-100 px-4 py-1.5 bg-white border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:border-[#ff385c] hover:text-[#ff385c] transition-all"
                                            >
                                                Edit Item
                                            </button>
                                        </div>
                                    ))}
                                    <button className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-[#ff385c] transition-colors border-2 border-dashed border-neutral-100 rounded-2xl hover:border-[#ff385c]/20 hover:bg-[#ff385c]/5">
                                        <Plus size={14} strokeWidth={3} /> Add to {category}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Facilities Manager */}
            <section className="bg-white p-8 rounded-[3rem] border border-neutral-200 shadow-sm">
                <div className="mb-8">
                    <h3 className="text-2xl font-bold tracking-tight">Facilities & Amenities</h3>
                    <p className="text-neutral-500 text-sm mt-1">Select the features and services your restaurant provides.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {restaurant?.facilities?.map((f) => {
                        const Icon = (Icons as any)[f.icon] || Utensils;
                        return (
                            <div key={f.id} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-neutral-900 shadow-sm">
                                        <Icon size={20} strokeWidth={1.5} />
                                    </div>
                                    <span className="text-sm font-bold text-neutral-800">{f.name}</span>
                                </div>
                                <button className="text-xs font-black text-red-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Remove</button>
                            </div>
                        );
                    })}
                    <button className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-neutral-100 text-neutral-400 hover:border-[#ff385c] hover:bg-[#ff385c]/5 hover:text-[#ff385c] transition-all">
                        <Plus size={16} strokeWidth={3} />
                        <span className="text-xs font-black uppercase tracking-widest">Add Amenity</span>
                    </button>
                </div>
            </section>

            <AnimatePresence>
                {editingItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditingItem(null)}
                            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">Edit Menu Item</h3>
                                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">{editingItem.category}</p>
                                </div>
                                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X size={20}/></button>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="aspect-square bg-neutral-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 text-neutral-400 hover:bg-[#ff385c]/5 hover:border-[#ff385c]/20 transition-all cursor-pointer">
                                            <Camera size={20} strokeWidth={1.5} />
                                            <span className="text-[8px] font-black uppercase mt-2 tracking-widest">Photo {i}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Item Name</label>
                                        <input type="text" defaultValue={editingItem.name} className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Price (RM)</label>
                                            <input type="number" defaultValue={editingItem.price} className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Availability</label>
                                            <div className="h-12 flex items-center gap-3 px-5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                                <span className="text-xs font-bold">In Stock</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setEditingItem(null)} className="w-full py-4 bg-neutral-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all">Save Changes</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-200 shadow-sm min-w-[140px]">
            <div className="text-[#ff385c] mb-3">{icon}</div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-semibold mt-1 tracking-tight">{value}</p>
        </div>
    )
}

function OrderCard({ order }: { order: Order }) {
    const statusColors = {
        pending: 'bg-orange-50 text-orange-600 border-orange-100',
        accepted: 'bg-blue-50 text-blue-600 border-blue-100',
        preparing: 'bg-purple-50 text-purple-600 border-purple-100',
        ready: 'bg-green-50 text-green-600 border-green-100',
        completed: 'bg-neutral-50 text-neutral-600 border-neutral-100',
        cancelled: 'bg-red-50 text-red-600 border-red-100'
    }

    return (
        <div className="bg-white p-8 rounded-[3rem] border border-neutral-200 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${statusColors[order.status]}`}>
                        {order.status}
                    </div>
                    <p className="text-[10px] font-bold text-neutral-300">#{order.id.slice(0, 6)}</p>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight mb-2">RM {order.total_price.toFixed(2)}</h3>
                <p className="text-neutral-500 font-medium text-sm">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            
            <button className="mt-8 flex items-center justify-between w-full p-4 bg-neutral-50 rounded-2xl group-hover:bg-[#ff385c] group-hover:text-white transition-all">
                <span className="text-xs font-bold uppercase tracking-widest">Update Status</span>
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

function BookingCard({ booking }: { booking: Booking }) {
    return (
        <div className="bg-white p-8 rounded-[3rem] border border-neutral-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-neutral-50 rounded-[1.5rem] flex items-center justify-center text-2xl">
                    {booking.guest_count}
                </div>
                <div>
                    <h3 className="text-xl font-semibold tracking-tight">{booking.booking_time}</h3>
                    <p className="text-sm text-neutral-500 font-medium">{new Date(booking.booking_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                <CheckCircle2 size={20} />
            </div>
        </div>
    );
}

function UpgradeGating({ tier, message }: { tier: string, message: string }) {
    return (
        <div className="bg-white p-12 md:p-20 rounded-[4rem] border border-neutral-200 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Lock className="text-[#ff385c]" size={32} />
            </div>
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Upgrade to {tier}</h3>
            <p className="text-lg text-neutral-500 font-medium mb-10 max-w-sm mx-auto">{message}</p>
            <button className="w-full py-5 rounded-full bg-neutral-950 text-white font-bold text-lg transition-all hover:bg-neutral-800 shadow-xl active:scale-95">
                View Pricing
            </button>
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
