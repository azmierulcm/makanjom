'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
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
  Store
} from 'lucide-react';

interface Order {
  id: string;
  items: any;
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
  tier: 'free' | 'basic_order' | 'premium';
}

export default function VendorDashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings'>('orders');
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
        <div className="flex gap-2 p-1.5 bg-neutral-200/50 rounded-full mb-10 w-fit">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-md text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-white shadow-md text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Reservations
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
          ) : (
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
          )}
        </AnimatePresence>
      </main>
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
