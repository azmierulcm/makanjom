'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Newspaper, Gamepad2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';

const navItems = [
  { icon: Home,      label: 'Spin',    path: '/' },
  { icon: Search,    label: 'Explore', path: '/explore' },
  { icon: Newspaper, label: 'Feed',    path: '/articles' },
  { icon: Gamepad2,  label: 'Games',   path: '/games' },
  { icon: User,      label: 'Me',      path: '/profile' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const isVendorOrAdmin = pathname.startsWith('/vendor') || pathname.startsWith('/admin');

  if (isVendorOrAdmin) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-100 bg-white/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => haptics.light()}
              className="relative flex min-h-[3.25rem] min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl active:bg-neutral-50"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`touch-target rounded-2xl p-1.5 transition-colors ${isActive ? 'text-[#ff385c]' : 'text-neutral-400'}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={`text-[10px] font-black uppercase tracking-wide ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute top-0.5 h-1 w-1 rounded-full bg-[#ff385c] shadow-[0_0_8px_#ff385c]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
