import type { MenuItem } from './types';

/** Normalize menu rows from Supabase (supports legacy item_name column). */
export function normalizeMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    restaurant_id: row.restaurant_id as string,
    name: String(row.name ?? row.item_name ?? 'Menu item'),
    description: (row.description as string | null) ?? null,
    price: Number(row.price),
    image_url: (row.image_url as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    is_available: row.is_available !== false,
  };
}

export function normalizeMenuItems(rows: Record<string, unknown>[] | null): MenuItem[] {
  if (!rows?.length) return [];
  return rows.map(normalizeMenuItem).filter((item) => item.is_available);
}
