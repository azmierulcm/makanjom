import Link from 'next/link';
import { Sparkles, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-rose-100/40 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-amber-100/40 blur-[120px]" />
      </div>

      <Link href="/" className="mb-12 group flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] shadow-lg shadow-[#ff385c]/20 transition-transform group-hover:scale-105">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-black uppercase italic tracking-tighter text-neutral-950">
          Makanjom
        </span>
      </Link>

      <div className="w-full max-w-md rounded-[3rem] border border-neutral-200 bg-white p-10 text-center shadow-2xl">
        <p className="text-7xl mb-4">🍽️</p>
        <h1 className="text-5xl font-black tracking-tight text-neutral-950">404</h1>
        <p className="mt-2 text-xl font-bold text-neutral-700">Page not found</p>
        <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-500">
          Looks like this spot left the menu. Let&apos;s find you something better.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-full bg-[#ff385c] py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#ff385c]/20 hover:bg-[#e93252]"
          >
            <Sparkles size={16} /> Spin a pick
          </Link>
          <Link
            href="/explore"
            className="flex items-center justify-center gap-2 rounded-full border border-neutral-200 py-4 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
          >
            <Search size={16} /> Explore restaurants
          </Link>
          <Link
            href="javascript:history.back()"
            className="flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft size={14} /> Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
