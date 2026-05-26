'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, ChefHat } from 'lucide-react';

interface Order {
  id: string;
  customer_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: { name: string; quantity: number; price: number }[];
  created_at: string;
}

export const dynamic = 'force-dynamic';

export default function OrderQueue() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login?redirect=/vendor/orders';
        return;
      }

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('vendor_id', user.id)
        .limit(1)
        .single();

      if (!restaurant) {
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (!error && data) setOrders(data as Order[]);
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`vendor-orders-queue-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
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
  }, [restaurantId]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) alert('Error updating status: ' + error.message);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  if (!restaurantId) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      No restaurant linked to this account.
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Live Order Queue</h2>
          <p className="text-gray-500 font-medium">Orders appear here in real-time as customers place them.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-gray-700">Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Clock size={18} className="text-orange-500" />
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">New Orders</h3>
            <span className="ml-auto bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {orders.filter((o) => o.status === 'pending').length}
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            {orders.filter((o) => o.status === 'pending').map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={updateStatus} getStatusColor={getStatusColor} />
            ))}
          </AnimatePresence>
        </div>

        {/* Preparing */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <ChefHat size={18} className="text-blue-500" />
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Preparing</h3>
            <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {orders.filter((o) => o.status === 'preparing').length}
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            {orders.filter((o) => o.status === 'preparing').map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={updateStatus} getStatusColor={getStatusColor} />
            ))}
          </AnimatePresence>
        </div>

        {/* Ready */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Ready for Pickup</h3>
            <span className="ml-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {orders.filter((o) => o.status === 'ready').length}
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            {orders.filter((o) => o.status === 'ready').map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={updateStatus} getStatusColor={getStatusColor} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onUpdate,
  getStatusColor,
}: {
  order: Order;
  onUpdate: (id: string, status: string) => void;
  getStatusColor: (status: string) => string;
}) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Order #{order.id.slice(0, 8)}
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {Array.isArray(order.items) && order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-800 font-semibold">{item.quantity}x {item.name}</span>
            <span className="text-gray-400 font-medium">RM {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {order.status === 'pending' && (
          <button
            onClick={() => onUpdate(order.id, 'preparing')}
            className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-xs font-black hover:bg-blue-600 transition-colors"
          >
            PREPARE
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={() => onUpdate(order.id, 'ready')}
            className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-black hover:bg-green-600 transition-colors"
          >
            READY
          </button>
        )}
        {order.status === 'ready' && (
          <button
            onClick={() => onUpdate(order.id, 'completed')}
            className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-xs font-black hover:bg-black transition-colors"
          >
            PICKED UP
          </button>
        )}
        <button
          onClick={() => onUpdate(order.id, 'cancelled')}
          className="px-3 bg-red-50 text-red-500 py-2 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
