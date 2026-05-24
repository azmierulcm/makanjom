import React from 'react';
import { Globe, Camera, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="hidden border-t border-neutral-100 bg-white pt-16 pb-16 px-6 md:block">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#ff385c] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-neutral-950">MAKANJOM</span>
            </Link>
            <p className="text-neutral-500 text-sm leading-relaxed mb-6">
              The best food discovery experience on the web. Hand-crafted for foodies who hate group chat chaos.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-[#ff385c] transition-colors"><Globe size={18} /></Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-[#ff385c] transition-colors"><Camera size={18} /></Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-[#ff385c] transition-colors"><Share2 size={18} /></Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-neutral-950 mb-6 uppercase text-xs tracking-[0.2em]">Product</h4>
            <ul className="space-y-4 text-sm font-semibold text-neutral-500">
              <li><Link href="/explore" className="hover:text-neutral-950 transition-colors">Explore</Link></li>
              <li><Link href="/badges" className="hover:text-neutral-950 transition-colors">Badges</Link></li>
              <li><Link href="/pricing" className="hover:text-neutral-950 transition-colors">Premium</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-950 mb-6 uppercase text-xs tracking-[0.2em]">Business</h4>
            <ul className="space-y-4 text-sm font-semibold text-neutral-500">
              <li><Link href="/vendor" className="hover:text-neutral-950 transition-colors">Vendor Portal</Link></li>
              <li><Link href="/advertise" className="hover:text-neutral-950 transition-colors">Advertise</Link></li>
              <li><Link href="/support" className="hover:text-neutral-950 transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-950 mb-6 uppercase text-xs tracking-[0.2em]">Legal</h4>
            <ul className="space-y-4 text-sm font-semibold text-neutral-500">
              <li><Link href="/privacy" className="hover:text-neutral-950 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-neutral-950 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">© 2026 Makanjom. Built for hungry explorers.</p>
          <div className="flex gap-8 text-xs font-bold text-neutral-400 uppercase tracking-widest">
            <span>Cyberjaya, Malaysia</span>
            <span>Made with ✨</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
