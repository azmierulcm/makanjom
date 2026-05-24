# Makanjom — Supabase setup

Run these **in order** in the Supabase SQL Editor.

| Step | File | What it does |
|------|------|--------------|
| 1 | [`01_reset.sql`](./01_reset.sql) | Drops all Makanjom tables & demo users |
| 2 | [`02_schema.sql`](./02_schema.sql) | Creates tables, triggers, RLS |
| 3 | [`03_seed.sql`](./03_seed.sql) | Inserts demo data |

## Fresh start (recommended)

```
01_reset.sql  →  02_schema.sql  →  03_seed.sql
```

## Brand-new Supabase project

Skip reset — run only:

```
02_schema.sql  →  03_seed.sql
```

## After seeding

Expected verification counts: **6 restaurants · 17 menus · 4 promotions · 3 creators · 4 reviews · 4+ articles**

### Demo accounts (password: `MakanjomDemo123!`)

| Email | Role |
|-------|------|
| `vendor@makanjom.demo` | Vendor |
| `aina@makanjom.demo` | Creator — @aina_eats |
| `marcus@makanjom.demo` | Creator — @marcus_makan |
| `yuki@makanjom.demo` | Creator — @yuki_plates |

## App env vars

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then restart the dev server: `npm run dev`
