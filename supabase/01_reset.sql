-- ═══════════════════════════════════════════════════════════════════════════
-- MAKANJOM — STEP 1 OF 3: RESET
-- Wipes all Makanjom tables, types, and demo auth users.
-- ⚠️  Destructive. Only run when you want a completely fresh database.
-- Run in Supabase SQL Editor, then run 02_schema.sql and 03_seed.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- Demo user UUIDs (must match 03_seed.sql)
-- 11111111-1111-1111-1111-111111111101  vendor@makanjom.demo
-- 11111111-1111-1111-1111-111111111102  aina@makanjom.demo
-- 11111111-1111-1111-1111-111111111103  marcus@makanjom.demo
-- 11111111-1111-1111-1111-111111111104  yuki@makanjom.demo

DROP TRIGGER IF EXISTS on_review_submitted ON reviews;
DROP FUNCTION IF EXISTS handle_review_gamification();

DROP TABLE IF EXISTS saved_restaurants CASCADE;
DROP TABLE IF EXISTS spin_history CASCADE;
DROP TABLE IF EXISTS creator_profiles CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS article_type CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS vendor_tier CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

DELETE FROM auth.identities
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104'
);

DELETE FROM auth.users
WHERE email IN (
  'vendor@makanjom.demo',
  'aina@makanjom.demo',
  'marcus@makanjom.demo',
  'yuki@makanjom.demo'
);

SELECT 'Reset complete — now run 02_schema.sql' AS status;
