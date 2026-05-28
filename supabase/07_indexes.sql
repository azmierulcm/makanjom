-- =============================================================
-- 07_indexes.sql
-- Performance indexes for heavily-queried foreign keys and
-- columns that are missing from the initial schema.
-- All use IF NOT EXISTS so this is safe to re-run.
-- =============================================================

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id   ON reviews (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id     ON reviews (customer_id);

-- menus
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id     ON menus (restaurant_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id    ON orders (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id      ON orders (customer_id);

-- bookings
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant_id  ON bookings (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id    ON bookings (customer_id);

-- saved_restaurants
CREATE INDEX IF NOT EXISTS idx_saved_restaurants_user  ON saved_restaurants (user_id);

-- articles
CREATE INDEX IF NOT EXISTS idx_articles_author_id      ON articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_type           ON articles (type);
CREATE INDEX IF NOT EXISTS idx_articles_created_at     ON articles (created_at DESC);

-- creator_profiles
CREATE INDEX IF NOT EXISTS idx_creator_profiles_profile_id ON creator_profiles (profile_id);

-- spin_history
CREATE INDEX IF NOT EXISTS idx_spin_history_user_id    ON spin_history (user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_created_at ON spin_history (created_at DESC);

-- profiles (username lookups happen on every creator profile page)
CREATE INDEX IF NOT EXISTS idx_profiles_username       ON profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_role           ON profiles (role);
