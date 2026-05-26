-- Run this in Supabase Dashboard → SQL Editor
-- Adds missing write RLS policies so vendors and users can actually use the app.

-- ─── Restaurants: vendors own their listing ───────────────────────────────────

DROP POLICY IF EXISTS "Vendors insert own restaurant" ON restaurants;
CREATE POLICY "Vendors insert own restaurant" ON restaurants
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendors update own restaurant" ON restaurants;
CREATE POLICY "Vendors update own restaurant" ON restaurants
  FOR UPDATE USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendors delete own restaurant" ON restaurants;
CREATE POLICY "Vendors delete own restaurant" ON restaurants
  FOR DELETE USING (vendor_id = auth.uid());

-- ─── Menus: vendors manage menus for their restaurants ────────────────────────

DROP POLICY IF EXISTS "Vendors insert menu items" ON menus;
CREATE POLICY "Vendors insert menu items" ON menus
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE id = menus.restaurant_id AND vendor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors update menu items" ON menus;
CREATE POLICY "Vendors update menu items" ON menus
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = menus.restaurant_id AND vendor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors delete menu items" ON menus;
CREATE POLICY "Vendors delete menu items" ON menus
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = menus.restaurant_id AND vendor_id = auth.uid())
  );

-- ─── Reviews: authenticated users can post reviews ────────────────────────────

DROP POLICY IF EXISTS "Users insert reviews" ON reviews;
CREATE POLICY "Users insert reviews" ON reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users update own reviews" ON reviews;
CREATE POLICY "Users update own reviews" ON reviews
  FOR UPDATE USING (customer_id = auth.uid());

-- ─── Bookings: customers can create bookings ──────────────────────────────────

DROP POLICY IF EXISTS "Users insert bookings" ON bookings;
CREATE POLICY "Users insert bookings" ON bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Vendors update booking status" ON bookings;
CREATE POLICY "Vendors update booking status" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = bookings.restaurant_id AND vendor_id = auth.uid())
  );

-- ─── Orders: customers can place orders ──────────────────────────────────────

DROP POLICY IF EXISTS "Users insert orders" ON orders;
CREATE POLICY "Users insert orders" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users view own orders" ON orders;
CREATE POLICY "Users view own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Vendors view restaurant orders" ON orders;
CREATE POLICY "Vendors view restaurant orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = orders.restaurant_id AND vendor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors update order status" ON orders;
CREATE POLICY "Vendors update order status" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = orders.restaurant_id AND vendor_id = auth.uid())
  );

-- ─── Articles: any authenticated user can post ───────────────────────────────

DROP POLICY IF EXISTS "Authors insert articles" ON articles;
CREATE POLICY "Authors insert articles" ON articles
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors update own articles" ON articles;
CREATE POLICY "Authors update own articles" ON articles
  FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors delete own articles" ON articles;
CREATE POLICY "Authors delete own articles" ON articles
  FOR DELETE USING (author_id = auth.uid());

-- ─── Creator profiles: creators manage their own row ─────────────────────────

DROP POLICY IF EXISTS "Creators insert own profile" ON creator_profiles;
CREATE POLICY "Creators insert own profile" ON creator_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Creators update own profile" ON creator_profiles;
CREATE POLICY "Creators update own profile" ON creator_profiles
  FOR UPDATE USING (profile_id = auth.uid());

-- ─── Spin history: users log their own spins ─────────────────────────────────

DROP POLICY IF EXISTS "Users insert spin history" ON spin_history;
CREATE POLICY "Users insert spin history" ON spin_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own spin history" ON spin_history;
CREATE POLICY "Users view own spin history" ON spin_history
  FOR SELECT USING (user_id = auth.uid());

-- ─── Saved restaurants ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage saved restaurants" ON saved_restaurants;
CREATE POLICY "Users manage saved restaurants" ON saved_restaurants
  FOR ALL USING (user_id = auth.uid());

SELECT 'Vendor + user RLS policies applied' AS status;
