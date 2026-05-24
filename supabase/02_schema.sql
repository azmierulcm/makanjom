-- ═══════════════════════════════════════════════════════════════════════════
-- MAKANJOM — STEP 2 OF 3: SCHEMA
-- Creates all tables, triggers, RLS policies, and indexes.
-- Run AFTER 01_reset.sql (or on a brand-new Supabase project — skip reset).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin', 'creator');
CREATE TYPE vendor_tier AS ENUM ('free', 'basic_order', 'premium');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE article_type AS ENUM ('news', 'trend', 'training_event');

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'customer' NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  gamification_points INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cuisine_types TEXT[] DEFAULT '{}',
  tier vendor_tier DEFAULT 'free' NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  images TEXT[] DEFAULT '{}',
  business_hours JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  emoji TEXT DEFAULT '🍽️',
  vibe TEXT DEFAULT 'Cozy',
  price_range TEXT DEFAULT 'RM RM',
  rating DECIMAL(2,1) DEFAULT 4.5,
  facilities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_count INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_label TEXT NOT NULL,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT,
  expertise_areas TEXT[] DEFAULT '{}',
  expertise_cuisines TEXT[] DEFAULT '{}',
  is_local_expert BOOLEAN DEFAULT FALSE,
  review_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE spin_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  craving TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type article_type DEFAULT 'news' NOT NULL,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Gamification trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_review_gamification()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET gamification_points = gamification_points + (
    CASE WHEN array_length(NEW.photos, 1) > 0 THEN 100 ELSE 50 END
  )
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_submitted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION handle_review_gamification();

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_restaurants ENABLE ROW LEVEL SECURITY;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_restaurants_location ON restaurants USING GIST (location);
CREATE INDEX idx_restaurants_tier ON restaurants (tier);
CREATE INDEX idx_orders_status ON orders (status);

-- ─── Public read policies ────────────────────────────────────────────────────
CREATE POLICY "Public read for content" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public read for menus" ON menus FOR SELECT USING (true);
CREATE POLICY "Public read for articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read for promotions" ON promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for creator profiles" ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Public read for reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read for profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users view own bookings" ON bookings FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Vendors view own restaurant bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = bookings.restaurant_id AND vendor_id = auth.uid())
);

SELECT 'Schema complete — now run 03_seed.sql' AS status;
