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
  X,
  LogOut
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
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings' | 'listing'>('orders');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      if (user) {
        fetchRestaurantAndData(user.id);
      }
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRestaurantAndData(session.user.id);
      } else {
        setRestaurant(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchRestaurantAndData = async (userId: string) => {
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
  };

  const handleSignOut = async () => {
      await supabase.auth.signOut();
  };

  if (authLoading) return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
          <div className="w-8 h-8 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" />
      </div>
  );

  if (!user) return <VendorLogin />;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#ff385c]/20 border-t-[#ff385c] rounded-full animate-spin" />
            <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Opening Kitchen...</p>
        </div>
    </div>
  );

  if (!restaurant) return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-6 text-center">
          <div className="max-w-md">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6">
                  <Store size={32} className="text-[#ff385c]" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 mb-4">No Restaurant Found</h2>
              <p className="text-neutral-500 mb-8">It seems your account is not yet linked to a restaurant. Please contact support to set up your venue.</p>
              <button onClick={handleSignOut} className="px-8 py-3 bg-neutral-900 text-white rounded-full font-bold text-sm">Sign Out</button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] px-4 md:px-8 pb-32">
      <header className="py-6 md:py-12 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full shadow-sm">
                <Store size={14} className="text-[#ff385c]" />
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Vendor Hub</span>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                <LogOut size={12} /> Sign Out
            </button>
          </div>
          <h1 className="text-3xl md:text-6xl font-semibold tracking-tight text-neutral-950 leading-tight">{restaurant?.name}</h1>
          <p className="text-base md:text-lg text-neutral-500 font-medium">Manage your restaurant workflow with ease.</p>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <StatCard label="Today's Orders" value={orders.length} icon={<Package size={18}/>} />
            <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-neutral-200 shadow-sm flex flex-col justify-between min-w-[120px]">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tier</p>
                <span className="mt-2 text-xs md:text-sm font-black text-[#ff385c] uppercase">{restaurant?.tier}</span>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-4 md:mt-8">
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
            <section className="bg-white p-5 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-neutral-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-950">Gallery & Identity</h3>
                        <p className="text-neutral-500 text-sm mt-1">Manage storefront images and brand identity.</p>
                    </div>
                    <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">
                        Update Gallery
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="aspect-square bg-neutral-100 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 text-neutral-400 group cursor-pointer hover:border-[#ff385c] hover:bg-[#ff385c]/5 transition-all">
                        <Camera size={24} md:size={32} strokeWidth={1} className="group-hover:text-[#ff385c]" />
                        <span className="text-[8px] md:text-[10px] font-bold mt-2 uppercase tracking-widest">Main Hero</span>
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-square bg-neutral-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-neutral-300 border border-neutral-100">
                             <LayoutGrid size={20} md:size={24} />
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
                                        <div key={item.id} className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-neutral-50 transition-colors group">
                                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-300 shrink-0">
                                                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-xl" /> : <Utensils size={20} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-xs md:text-sm text-neutral-950 truncate">{item.name}</p>
                                                    <p className="text-[10px] md:text-xs text-neutral-400 font-medium">RM {item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setEditingItem(item)}
                                                className="md:opacity-0 group-hover:opacity-100 px-3 md:px-4 py-1.5 bg-white border border-neutral-200 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:border-[#ff385c] hover:text-[#ff385c] transition-all shrink-0"
                                            >
                                                Edit
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
                
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {restaurant?.facilities?.map((f) => {
                        const Icon = (Icons as any)[f.icon] || Utensils;
                        return (
                            <div key={f.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 rounded-2xl bg-neutral-50 border border-neutral-100 group gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center text-neutral-900 shadow-sm shrink-0">
                                        <Icon size={16} md:size={20} strokeWidth={1.5} />
                                    </div>
                                    <span className="text-xs md:text-sm font-bold text-neutral-800 line-clamp-1">{f.name}</span>
                                </div>
                                <button className="text-[9px] md:text-xs font-black text-red-500 uppercase tracking-widest md:opacity-0 group-hover:opacity-100 transition-all text-left md:text-right">Remove</button>
                            </div>
                        );
                    })}
                    <button className="flex flex-col md:flex-row items-center justify-center gap-2 p-3 md:p-4 rounded-2xl border-2 border-dashed border-neutral-100 text-neutral-400 hover:border-[#ff385c] hover:bg-[#ff385c]/5 hover:text-[#ff385c] transition-all">
                        <Plus size={16} strokeWidth={3} />
                        <span className="text-[9px] md:text-xs font-black uppercase tracking-widest">Add Amenity</span>
                    </button>
                </div>
            </section>

            <AnimatePresence>
                {editingItem && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditingItem(null)}
                            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="relative w-full max-w-xl bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-neutral-100 flex justify-between items-center bg-white">
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold tracking-tight">Edit Menu Item</h3>
                                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">{editingItem.category}</p>
                                </div>
                                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X size={20}/></button>
                            </div>
                            
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="aspect-square bg-neutral-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 text-neutral-400 hover:bg-[#ff385c]/5 hover:border-[#ff385c]/20 transition-all cursor-pointer">
                                            <Camera size={20} strokeWidth={1.5} />
                                            <span className="text-[8px] font-black uppercase mt-2 tracking-widest text-center">Photo {i}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Item Name</label>
                                        <input type="text" defaultValue={editingItem.name} className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Price (RM)</label>
                                            <input type="number" defaultValue={editingItem.price} className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Availability</label>
                                            <div className="h-12 flex items-center gap-3 px-5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                                <span className="text-xs font-bold">In Stock</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setEditingItem(null)} className="w-full py-5 bg-neutral-950 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all">Save Changes</button>
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

function VendorLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
        }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-neutral-200 shadow-xl"
      >
        <div className="flex flex-col items-center text-center mb-8 md:mb-10">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[#ff385c] rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-[#ff385c]/20 mb-5 md:mb-6">
            <Store size={24} md:size={28} className="text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-950">Vendor Login</h2>
          <p className="text-neutral-500 text-xs md:text-sm mt-2 font-medium">Access your restaurant management suite.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
          <div>
            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 md:px-6 py-3.5 md:py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs md:text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
              placeholder="vendor@makanjom.demo"
            />
          </div>
          <div>
            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 md:px-6 py-3.5 md:py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs md:text-sm font-bold outline-none focus:border-[#ff385c]/30 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 md:p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] md:text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 md:py-5 bg-neutral-950 text-white rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all disabled:opacity-50 mt-2 md:mt-4"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-6 md:mt-8 text-center">
          <p className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
            Demo Account:<br />
            <span className="text-neutral-600">vendor@makanjom.demo</span> / <span className="text-neutral-600">MakanjomDemo123!</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
