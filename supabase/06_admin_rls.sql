-- =============================================================
-- 06_admin_rls.sql
-- Admin override policies for all tables.
-- Admins can SELECT, INSERT, UPDATE, DELETE any row.
-- SECURITY DEFINER bypasses RLS on the profiles lookup so
-- the function does not recurse into its own policy.
-- =============================================================

-- Helper: returns true when the calling user has role = 'admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── restaurants ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage restaurants" ON restaurants;
CREATE POLICY "Admins manage restaurants" ON restaurants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── menus ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage menus" ON menus;
CREATE POLICY "Admins manage menus" ON menus
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── reviews ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage reviews" ON reviews;
CREATE POLICY "Admins manage reviews" ON reviews
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── bookings ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage bookings" ON bookings;
CREATE POLICY "Admins manage bookings" ON bookings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── orders ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage orders" ON orders;
CREATE POLICY "Admins manage orders" ON orders
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── promotions ───────────────────────────────────────────────
-- No vendor write policies existed before; admins + vendors can now write.
DROP POLICY IF EXISTS "Admins manage promotions" ON promotions;
CREATE POLICY "Admins manage promotions" ON promotions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Vendors can also insert/update/delete their own restaurant's promotions
DROP POLICY IF EXISTS "Vendors manage own promotions" ON promotions;
CREATE POLICY "Vendors manage own promotions" ON promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = promotions.restaurant_id
        AND r.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = promotions.restaurant_id
        AND r.vendor_id = auth.uid()
    )
  );

-- ── articles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage articles" ON articles;
CREATE POLICY "Admins manage articles" ON articles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── creator_profiles ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admins manage creator profiles" ON creator_profiles;
CREATE POLICY "Admins manage creator profiles" ON creator_profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── profiles ─────────────────────────────────────────────────
-- Admins can update any profile (e.g. change roles, suspend accounts)
DROP POLICY IF EXISTS "Admins manage profiles" ON profiles;
CREATE POLICY "Admins manage profiles" ON profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── spin_history ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins view all spin history" ON spin_history;
CREATE POLICY "Admins view all spin history" ON spin_history
  FOR SELECT USING (is_admin());

-- ── saved_restaurants ────────────────────────────────────────
DROP POLICY IF EXISTS "Admins view all saved restaurants" ON saved_restaurants;
CREATE POLICY "Admins view all saved restaurants" ON saved_restaurants
  FOR SELECT USING (is_admin());
