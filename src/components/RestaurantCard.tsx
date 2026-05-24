'use client';

import Link from 'next/link';
import { MapPin, Star, ChevronRight } from 'lucide-react';
import type { Restaurant } from '@/lib/types';

const accents = [
  'from-rose-50 to-orange-50',
  'from-emerald-50 to-lime-50',
  'from-sky-50 to-slate-50',
  'from-amber-50 to-red-50',
];

export function getCuisineLabel(restaurant: Restaurant): string {
  return restaurant.cuisine_types?.[0] ?? 'Local Food';
}

export default function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  const accent = restaurant.accent ?? accents[index % accents.length];
  const cuisine = getCuisineLabel(restaurant);
  const image = restaurant.images?.[0];

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group block overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className={`relative h-44 bg-gradient-to-br ${accent} overflow-hidden`}>
        {image ? (
          <img src={image} alt={restaurant.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">{restaurant.emoji}</div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-neutral-700 shadow-sm">
          {restaurant.price_range}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-neutral-950">{restaurant.name}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{cuisine} · {restaurant.vibe}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-neutral-50 px-2.5 py-1 text-sm font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {restaurant.rating}
          </div>
        </div>

        {restaurant.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-600">{restaurant.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          {restaurant.distance && (
            <span className="text-xs font-semibold text-neutral-400">{restaurant.distance} away</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-[#ff385c] opacity-0 transition group-hover:opacity-100">
            View details <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
