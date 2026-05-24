-- ═══════════════════════════════════════════════════════════════════════════
-- MAKANJOM — STEP 3 OF 3: SEED
-- Demo users, 6 Malaysian restaurants, menus, promotions, reviews, articles.
-- Run AFTER 02_schema.sql. Safe to re-run (cleans seed data first).
--
-- Demo logins — password for all: MakanjomDemo123!
--   vendor@makanjom.demo   vendor
--   aina@makanjom.demo     creator @aina_eats
--   marcus@makanjom.demo   creator @marcus_makan
--   yuki@makanjom.demo     creator @yuki_plates
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_vendor UUID := '11111111-1111-1111-1111-111111111101';
  v_aina   UUID := '11111111-1111-1111-1111-111111111102';
  v_marcus UUID := '11111111-1111-1111-1111-111111111103';
  v_yuki   UUID := '11111111-1111-1111-1111-111111111104';
  seed_user_ids UUID[] := ARRAY[v_vendor, v_aina, v_marcus, v_yuki];
  seed_restaurant_ids UUID[] := ARRAY[
    '22222222-2222-2222-2222-222222222201'::UUID,
    '22222222-2222-2222-2222-222222222202'::UUID,
    '22222222-2222-2222-2222-222222222203'::UUID,
    '22222222-2222-2222-2222-222222222204'::UUID,
    '22222222-2222-2222-2222-222222222205'::UUID,
    '22222222-2222-2222-2222-222222222206'::UUID,
    '22222222-2222-2222-2222-222222222207'::UUID
  ];
  v_pw TEXT := crypt('MakanjomDemo123!', gen_salt('bf'));
BEGIN
  -- Clean previous seed
  DELETE FROM reviews WHERE restaurant_id = ANY(seed_restaurant_ids);
  DELETE FROM promotions WHERE restaurant_id = ANY(seed_restaurant_ids);
  DELETE FROM menus WHERE restaurant_id = ANY(seed_restaurant_ids);
  DELETE FROM articles WHERE author_id = ANY(ARRAY[v_aina, v_marcus, v_yuki])
    OR title = 'Makanjom Creator Workshop: Build Your Food Brand';
  DELETE FROM creator_profiles WHERE profile_id = ANY(ARRAY[v_aina, v_marcus, v_yuki]);
  DELETE FROM restaurants WHERE id = ANY(seed_restaurant_ids);
  DELETE FROM profiles WHERE id = ANY(seed_user_ids);
  DELETE FROM auth.identities WHERE user_id = ANY(seed_user_ids);
  DELETE FROM auth.users WHERE id = ANY(seed_user_ids);

  -- Auth users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
    ('00000000-0000-0000-0000-000000000000', v_vendor, 'authenticated', 'authenticated',
     'vendor@makanjom.demo', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Vendor"}',
     NOW(), NOW(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_aina, 'authenticated', 'authenticated',
     'aina@makanjom.demo', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Aina Rahman"}',
     NOW(), NOW(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_marcus, 'authenticated', 'authenticated',
     'marcus@makanjom.demo', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Tan"}',
     NOW(), NOW(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_yuki, 'authenticated', 'authenticated',
     'yuki@makanjom.demo', v_pw, NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Yuki Nakamura"}',
     NOW(), NOW(), '', '', '', '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_vendor, jsonb_build_object('sub', v_vendor::text, 'email', 'vendor@makanjom.demo'), 'email', v_vendor::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), v_aina,   jsonb_build_object('sub', v_aina::text,   'email', 'aina@makanjom.demo'),   'email', v_aina::text,   NOW(), NOW(), NOW()),
    (gen_random_uuid(), v_marcus, jsonb_build_object('sub', v_marcus::text, 'email', 'marcus@makanjom.demo'), 'email', v_marcus::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), v_yuki,   jsonb_build_object('sub', v_yuki::text,   'email', 'yuki@makanjom.demo'),   'email', v_yuki::text,   NOW(), NOW(), NOW());

  -- Profiles
  INSERT INTO profiles (id, role, full_name, username, gamification_points, badges) VALUES
    (v_vendor, 'vendor',  'Demo Vendor',   'demo_vendor',  0,    '[]'::jsonb),
    (v_aina,   'creator', 'Aina Rahman',   'aina_eats',    8200, '[{"id":"reviewer","name":"Trusted Reviewer","icon":"⭐"}]'::jsonb),
    (v_marcus, 'creator', 'Marcus Tan',    'marcus_makan', 6500, '[]'::jsonb),
    (v_yuki,   'creator', 'Yuki Nakamura', 'yuki_plates',  4800, '[]'::jsonb);

  -- Creator profiles
  INSERT INTO creator_profiles (profile_id, bio, expertise_areas, expertise_cuisines, is_local_expert, review_count, follower_count) VALUES
    (v_aina,   'KL food scout obsessed with hidden hawker gems and late-night mamak runs.',
     ARRAY['Bangsar','TTDI','KLCC'], ARRAY['Malay','Mamak','Cafe'], true, 127, 3420),
    (v_marcus, 'Penang heritage food historian. If it has gula melaka, I''ve probably reviewed it.',
     ARRAY['George Town','Gurney','Bayan Lepas'], ARRAY['Penang','Chinese','Dessert'], true, 89, 5100),
    (v_yuki,   'Japanese cuisine specialist covering KL''s sushi scene.',
     ARRAY['KLCC','Bukit Bintang','Mont Kiara'], ARRAY['Japanese','Sushi','Ramen'], true, 64, 2100);

  -- Restaurants
  INSERT INTO restaurants (id, vendor_id, name, description, cuisine_types, tier, address, location, images, emoji, vibe, price_range, rating, is_active, facilities) VALUES
    ('22222222-2222-2222-2222-222222222201', v_vendor, 'Village Park Nasi Lemak',
     'Legendary nasi lemak in Bangsar. Crispy ayam goreng berempah and coconut rice that keeps locals lining up before 7am.',
     ARRAY['Malay','Breakfast'], 'premium', '5, Jalan Riong, Bangsar, 59100 Kuala Lumpur',
     ST_SetSRID(ST_MakePoint(101.6706, 3.1297), 4326)::geography,
     ARRAY['https://images.unsplash.com/photo-1589302168068-964664d93a0f?w=800&q=80','https://images.unsplash.com/photo-1603133872878-684f208fb589?w=800&q=80'],
     '🍛', 'Bustling', 'RM RM', 4.8, true,
     '[{"id":"f1","name":"Kids Friendly","description":"High chairs and child-friendly cutlery available.","icon":"Baby","photo_url":"https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&q=80"},{"id":"f2","name":"Air Conditioned","description":"Cool and comfortable indoor seating.","icon":"Wind"}]'::jsonb),
    ('22222222-2222-2222-2222-222222222202', v_vendor, 'Devi''s Corner',
     'Iconic banana leaf rice in Bangsar. Generous portions and fiery fish curry.',
     ARRAY['Indian','Banana Leaf'], 'basic_order', '14, Jalan Telawi 4, Bangsar Baru, 59100 KL',
     ST_SetSRID(ST_MakePoint(101.6712, 3.1310), 4326)::geography,
     ARRAY['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
     '🍌', 'Lively', 'RM RM', 4.6, true, '[]'::jsonb),
    ('22222222-2222-2222-2222-222222222203', v_vendor, 'Brew & Bites TTDI',
     'Specialty coffee meets modern Malaysian brunch in TTDI.',
     ARRAY['Cafe','Brunch'], 'premium', '32, Jalan Datuk Sulaiman, TTDI, 60000 KL',
     ST_SetSRID(ST_MakePoint(101.6290, 3.1385), 4326)::geography,
     ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'],
     '☕', 'Cozy', 'RM RM RM', 4.5, true, '[]'::jsonb),
    ('22222222-2222-2222-2222-222222222204', v_vendor, 'Sushi Hikari',
     'Omakase-style Japanese dining in KLCC with daily fresh sashimi.',
     ARRAY['Japanese','Sushi'], 'premium', 'Level 3, Suria KLCC, 50088 Kuala Lumpur',
     ST_SetSRID(ST_MakePoint(101.7123, 3.1578), 4326)::geography,
     ARRAY['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80'],
     '🍣', 'Upscale', 'RM RM RM RM', 4.9, true, '[]'::jsonb),
    ('22222222-2222-2222-2222-222222222205', v_vendor, 'Penang Road Cendol',
     'Heritage dessert stall — shaved ice, gula melaka, green jelly.',
     ARRAY['Dessert','Penang'], 'free', 'Lebuh Keng Kwee, 10200 George Town, Penang',
     ST_SetSRID(ST_MakePoint(100.3368, 5.4180), 4326)::geography,
     ARRAY['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'],
     '🍧', 'Heritage', 'RM', 4.7, true, '[]'::jsonb),
    ('22222222-2222-2222-2222-222222222206', v_vendor, 'Warung Pak Din',
     'Hidden Shah Alam gem — sup tulang and roti canai until midnight.',
     ARRAY['Mamak','Late Night'], 'basic_order', 'Seksyen 7, 40000 Shah Alam, Selangor',
     ST_SetSRID(ST_MakePoint(101.4901, 3.0738), 4326)::geography,
     ARRAY['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
     '🫓', 'Casual', 'RM', 4.4, true, '[]'::jsonb),
    ('22222222-2222-2222-2222-222222222207', v_vendor, 'Bakarizu Premium Yakiniku',
     'Elite Japanese BBQ experience. A5 Wagyu, grilled to perfection over binchotan charcoal.',
     ARRAY['Japanese','Yakiniku','Wagyu'], 'premium', 'G-12, Platinum Park, Persiaran KLCC, 50088 Kuala Lumpur',
     ST_SetSRID(ST_MakePoint(101.7145, 3.1555), 4326)::geography,
     ARRAY[
       'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
       'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
       'https://images.unsplash.com/photo-1529692236671-f1f63c460d30?w=800&q=80',
       'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&q=80',
       'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80'
     ],
     '🥩', 'Industrial', 'RM RM RM RM', 4.9, true,
     '[{"id":"f3","name":"Private Dining","description":"Exclusive soundproof rooms for business or family gatherings.","icon":"DoorOpen","photo_url":"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"},{"id":"f4","name":"Surau Available","description":"Clean and quiet prayer room located within the premise.","icon":"Moon","photo_url":"https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"},{"id":"f5","name":"Valet Parking","description":"Complimentary valet service for all dining guests.","icon":"Car","photo_url":"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"}]'::jsonb);

  -- Menus
  INSERT INTO menus (restaurant_id, name, description, price, category) VALUES
    ('22222222-2222-2222-2222-222222222201', 'Nasi Lemak Special', 'Ayam goreng, sambal, telur, kacang', 18.50, 'Mains'),
    ('22222222-2222-2222-2222-222222222201', 'Nasi Lemak Biasa', 'Classic with sambal and sides', 12.00, 'Mains'),
    ('22222222-2222-2222-2222-222222222201', 'Teh Tarik', 'Pulled milk tea', 3.50, 'Drinks'),
    ('22222222-2222-2222-2222-222222222202', 'Banana Leaf Set', 'Rice with 3 veg, papadum, rasam', 15.00, 'Mains'),
    ('22222222-2222-2222-2222-222222222202', 'Fish Head Curry', 'Spicy Tamil-style curry', 45.00, 'Mains'),
    ('22222222-2222-2222-2222-222222222202', 'Mango Lassi', 'Sweet yogurt drink', 6.00, 'Drinks'),
    ('22222222-2222-2222-2222-222222222203', 'Soft Shell Crab Benedict', 'Poached eggs, hollandaise', 38.00, 'Brunch'),
    ('22222222-2222-2222-2222-222222222203', 'Kaya Butter Toast', 'Modern twist on a classic', 16.00, 'Brunch'),
    ('22222222-2222-2222-2222-222222222203', 'Flat White', 'Single origin espresso', 14.00, 'Drinks'),
    ('22222222-2222-2222-2222-222222222204', 'Chef''s Omakase (12pc)', 'Seasonal nigiri selection', 188.00, 'Omakase'),
    ('22222222-2222-2222-2222-222222222204', 'Salmon Sashimi', 'Norwegian salmon, 5 pieces', 42.00, 'Sashimi'),
    ('22222222-2222-2222-2222-222222222204', 'Miso Soup', 'House-made dashi', 12.00, 'Starters'),
    ('22222222-2222-2222-2222-222222222205', 'Classic Cendol', 'Gula melaka, coconut milk', 4.50, 'Dessert'),
    ('22222222-2222-2222-2222-222222222205', 'Ais Kacang', 'Shaved ice with red beans', 5.00, 'Dessert'),
    ('22222222-2222-2222-2222-222222222206', 'Sup Tulang', 'Rich mutton bone soup', 14.00, 'Mains'),
    ('22222222-2222-2222-2222-222222222206', 'Roti Canai Kosong', 'Flaky flatbread with dhal', 2.50, 'Mains'),
    ('22222222-2222-2222-2222-222222222206', 'Teh Tarik', 'Pulled milk tea', 2.00, 'Drinks'),
    ('22222222-2222-2222-2222-222222222207', 'A5 Wagyu Ribeye', '100g of marbled perfection', 180.00, 'Wagyu'),
    ('22222222-2222-2222-2222-222222222207', 'Premium Beef Tongue', 'Thinly sliced with lemon', 45.00, 'Beef'),
    ('22222222-2222-2222-2222-222222222207', 'Garlic Fried Rice', 'With premium beef bits', 18.00, 'Sides');

  -- Promotions
  INSERT INTO promotions (restaurant_id, title, description, discount_label, valid_until, is_active) VALUES
    ('22222222-2222-2222-2222-222222222201', 'Early Bird Special', 'Free teh tarik before 8am', 'Free Drink', '2026-12-31', true),
    ('22222222-2222-2222-2222-222222222203', 'Weekend Brunch Deal', '20% off brunch sets Sat & Sun', '20% OFF', '2026-08-31', true),
    ('22222222-2222-2222-2222-222222222204', 'Omakase Preview', 'Complimentary miso soup & edamame', 'Complimentary', '2026-06-30', true),
    ('22222222-2222-2222-2222-222222222206', 'Midnight Mamak', 'Free teh tarik with sup tulang after 11pm', 'Free Drink', '2026-12-31', true);

  -- Reviews
  INSERT INTO reviews (restaurant_id, customer_id, rating, comment, photos) VALUES
    ('22222222-2222-2222-2222-222222222201', v_aina, 5, 'Still the gold standard for nasi lemak in KL!', '{}'),
    ('22222222-2222-2222-2222-222222222203', v_aina, 4, 'Great coffee and the crab benedict is worth it.', '{}'),
    ('22222222-2222-2222-2222-222222222205', v_marcus, 5, 'Nothing beats this cendol on a hot Penang afternoon.', '{}'),
    ('22222222-2222-2222-2222-222222222204', v_yuki, 5, 'Fish quality is exceptional. Counter seats are best.', '{}');

  -- Articles
  INSERT INTO articles (author_id, title, content, type, event_date) VALUES
    (v_aina, '10 Hidden Hawker Stalls in Bangsar You Need to Try',
     'Beyond the usual suspects, Bangsar hides incredible late-night eats.', 'trend', NULL),
    (v_marcus, 'Penang Cendol Crawl: A Local Expert''s Guide',
     'From Lebuh Keng Kwee to the alley stalls tourists miss.', 'trend', NULL),
    (v_yuki, 'KL Omakase Under RM200: Worth It or Hype?',
     'Five counter-seat sushi bars in KLCC and Bukit Bintang reviewed.', 'news', NULL),
    (NULL, 'Makanjom Creator Workshop: Build Your Food Brand',
     'Hands-on food photography and review writing session.', 'training_event', '2026-06-20');
END $$;

-- Verify — expect: 6 / 17 / 4 / 3 / 4 / 4+
SELECT 'restaurants' AS entity, COUNT(*)::text AS count
FROM restaurants WHERE vendor_id = '11111111-1111-1111-1111-111111111101'
UNION ALL SELECT 'menus', COUNT(*)::text FROM menus
UNION ALL SELECT 'promotions', COUNT(*)::text FROM promotions
UNION ALL SELECT 'creators', COUNT(*)::text FROM creator_profiles
UNION ALL SELECT 'reviews', COUNT(*)::text FROM reviews
UNION ALL SELECT 'articles', COUNT(*)::text FROM articles;
