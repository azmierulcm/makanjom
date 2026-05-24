import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Settings, LogOut } from 'lucide-react';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">MAKANJOM <span className="text-yellow-500">PRO</span></h2>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link href="/vendor" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-semibold">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/vendor/menu" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-semibold">
            <UtensilsCrossed size={20} /> Menu Items
          </Link>
          <Link href="/vendor/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-semibold">
            <ClipboardList size={20} /> Order Queue
          </Link>
          <Link href="/vendor/settings" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-semibold">
            <Settings size={20} /> Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold w-full">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-800">Vendor Portal</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">Kedai Makan Pak Abu</p>
              <p className="text-xs text-gray-500">Verified Vendor</p>
            </div>
            <div className="w-10 h-10 bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-gray-900">
              PA
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
