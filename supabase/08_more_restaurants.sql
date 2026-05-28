-- ═══════════════════════════════════════════════════════════════════════════
-- MAKANJOM — STEP 8: EXPANDED RESTAURANT CONTENT
-- 40 additional Malaysian restaurants across KL, Penang, JB, Ipoh, Melaka.
-- Run AFTER 03_seed.sql. Safe to re-run (DELETE + INSERT pattern).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_vendor UUID := '11111111-1111-1111-1111-111111111101';
  more_ids UUID[] := ARRAY[
    '33333333-3333-3333-3333-333333333301'::UUID,
    '33333333-3333-3333-3333-333333333302'::UUID,
    '33333333-3333-3333-3333-333333333303'::UUID,
    '33333333-3333-3333-3333-333333333304'::UUID,
    '33333333-3333-3333-3333-333333333305'::UUID,
    '33333333-3333-3333-3333-333333333306'::UUID,
    '33333333-3333-3333-3333-333333333307'::UUID,
    '33333333-3333-3333-3333-333333333308'::UUID,
    '33333333-3333-3333-3333-333333333309'::UUID,
    '33333333-3333-3333-3333-333333333310'::UUID,
    '33333333-3333-3333-3333-333333333311'::UUID,
    '33333333-3333-3333-3333-333333333312'::UUID,
    '33333333-3333-3333-3333-333333333313'::UUID,
    '33333333-3333-3333-3333-333333333314'::UUID,
    '33333333-3333-3333-3333-333333333315'::UUID,
    '33333333-3333-3333-3333-333333333316'::UUID,
    '33333333-3333-3333-3333-333333333317'::UUID,
    '33333333-3333-3333-3333-333333333318'::UUID,
    '33333333-3333-3333-3333-333333333319'::UUID,
    '33333333-3333-3333-3333-333333333320'::UUID,
    '33333333-3333-3333-3333-333333333321'::UUID,
    '33333333-3333-3333-3333-333333333322'::UUID,
    '33333333-3333-3333-3333-333333333323'::UUID,
    '33333333-3333-3333-3333-333333333324'::UUID,
    '33333333-3333-3333-3333-333333333325'::UUID,
    '33333333-3333-3333-3333-333333333326'::UUID,
    '33333333-3333-3333-3333-333333333327'::UUID,
    '33333333-3333-3333-3333-333333333328'::UUID,
    '33333333-3333-3333-3333-333333333329'::UUID,
    '33333333-3333-3333-3333-333333333330'::UUID,
    '33333333-3333-3333-3333-333333333331'::UUID,
    '33333333-3333-3333-3333-333333333332'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    '33333333-3333-3333-3333-333333333334'::UUID,
    '33333333-3333-3333-3333-333333333335'::UUID,
    '33333333-3333-3333-3333-333333333336'::UUID,
    '33333333-3333-3333-3333-333333333337'::UUID,
    '33333333-3333-3333-3333-333333333338'::UUID,
    '33333333-3333-3333-3333-333333333339'::UUID,
    '33333333-3333-3333-3333-333333333340'::UUID
  ];
BEGIN
  -- Clean previous run
  DELETE FROM menus       WHERE restaurant_id = ANY(more_ids);
  DELETE FROM restaurants WHERE id = ANY(more_ids);

  -- ─────────────────────────────────────────────────────────────────────────
  -- KUALA LUMPUR — Malay / Mamak
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO restaurants (id, vendor_id, name, description, cuisine_types, tier, address, location, images, emoji, vibe, price_range, rating, is_active, facilities) VALUES

  ('33333333-3333-3333-3333-333333333301', v_vendor,
   'Nasi Kandar Pelita',
   'KL institution since 1995. Their mixed rice mountains are the stuff of legend — curry-flooded rice with over 30 daily lauk.',
   ARRAY['Mamak','Indian Muslim','Mixed Rice'], 'basic_order',
   '149, Jalan Ampang, 50450 Kuala Lumpur',
   ST_SetSRID(ST_MakePoint(101.7175, 3.1559), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80','https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
   '🍛', 'Bustling', 'RM RM', 4.6, true,
   '[{"id":"f1","name":"24 Hours","description":"Open round the clock, every day of the year.","icon":"Clock"}]'::jsonb),

  ('33333333-3333-3333-3333-333333333302', v_vendor,
   'Restoran Yusoof & Zakhir',
   'Old-school Malay restaurant in Chow Kit. Famous for their ayam masak merah and nasi briyani on Fridays.',
   ARRAY['Malay','Briyani'], 'basic_order',
   '14, Jalan Raja Muda Abdul Aziz, Chow Kit, 50300 KL',
   ST_SetSRID(ST_MakePoint(101.6970, 3.1720), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1589302168068-964664d93a0f?w=800&q=80'],
   '🍚', 'Casual', 'RM', 4.3, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333303', v_vendor,
   'Hameed Pata Mee Sotong',
   'One of KL''s most iconic hawker spots — thick yellow noodles tossed with tender baby cuttlefish and wok hei.',
   ARRAY['Hawker','Noodles','Seafood'], 'free',
   'Lorong Tuanku Abdul Halim, Masjid India, 50100 KL',
   ST_SetSRID(ST_MakePoint(101.6935, 3.1497), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'],
   '🦑', 'Street', 'RM', 4.7, true, '[]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- KUALA LUMPUR — Chinese
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333304', v_vendor,
   'Kedai Kopi Lai Foong',
   'Since 1956. Wonton mee in a clear broth — the benchmark by which all KL wonton mee is judged.',
   ARRAY['Chinese','Wonton Mee','Old Town'], 'free',
   '138, Jalan Tun Tan Cheng Lock, Petaling Street, 50000 KL',
   ST_SetSRID(ST_MakePoint(101.6968, 3.1442), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80','https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80'],
   '🍜', 'Heritage', 'RM', 4.8, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333305', v_vendor,
   'Fei Fei Roast Duck',
   'Petaling Street roast duck that draws queues before noon. Crispy skin, juicy meat, served over fragrant rice.',
   ARRAY['Chinese','Roast','Rice'], 'free',
   'Petaling Street Hawker Centre, 50000 Kuala Lumpur',
   ST_SetSRID(ST_MakePoint(101.6962, 3.1435), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80'],
   '🦆', 'Street', 'RM', 4.6, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333306', v_vendor,
   'Kim Lian Kee',
   'Heritage Hokkien mee restaurant since 1927. Dark, thick noodles fried with pork lard and crispy pork belly.',
   ARRAY['Chinese','Hokkien Mee','Heritage'], 'free',
   '49-55, Jalan Petaling, 50000 Kuala Lumpur',
   ST_SetSRID(ST_MakePoint(101.6974, 3.1440), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80'],
   '🍝', 'Heritage', 'RM', 4.7, true, '[]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- KUALA LUMPUR — Fine Dining & Modern
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333307', v_vendor,
   'Dewakan',
   'Malaysia''s flagship fine-dining destination. Chef Darren Teoh weaves Bornean ingredients and French techniques into each seasonal tasting menu.',
   ARRAY['Fine Dining','Modern Malaysian','Tasting Menu'], 'premium',
   'Ground Floor, KL Eco City, Bangsar, 59200 KL',
   ST_SetSRID(ST_MakePoint(101.6746, 3.1167), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'],
   '🍽️', 'Upscale', 'RM RM RM RM', 4.9, true,
   '[{"id":"f2","name":"Private Dining","description":"Intimate rooms for special occasions.","icon":"DoorOpen"},{"id":"f3","name":"Valet Parking","description":"Complimentary valet service.","icon":"Car"}]'::jsonb),

  ('33333333-3333-3333-3333-333333333308', v_vendor,
   'Nobu Kuala Lumpur',
   'The legendary Nobu brand in KL — black cod miso, yellowtail jalapeño, and Peruvian-Japanese fusion with stunning city views.',
   ARRAY['Japanese','Fusion','Fine Dining'], 'premium',
   'Level 56, Menara 3 Petronas, KLCC, 50088 KL',
   ST_SetSRID(ST_MakePoint(101.7131, 3.1569), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80','https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&q=80'],
   '🗼', 'Upscale', 'RM RM RM RM', 4.8, true,
   '[{"id":"f4","name":"City View","description":"Panoramic KLCC skyline views from Level 56.","icon":"Star"}]'::jsonb),

  ('33333333-3333-3333-3333-333333333309', v_vendor,
   'Entier French Dining',
   'Classic French cuisine in the heart of Bangsar. The prime beef tartare and house-churned butter are a religion here.',
   ARRAY['French','Fine Dining','Western'], 'premium',
   '6, Jalan Kemuja, Bangsar, 59000 KL',
   ST_SetSRID(ST_MakePoint(101.6730, 3.1311), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'],
   '🥩', 'Upscale', 'RM RM RM RM', 4.7, true,
   '[{"id":"f5","name":"Wine Cellar","description":"Extensive natural wine program.","icon":"Wine"}]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- KUALA LUMPUR — Cafe & Brunch
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333310', v_vendor,
   'VCR Bangsar',
   'Speciality coffee pioneer in KL. Single-origin pour-overs, house-fermented kefir, and a menu that changes seasonally.',
   ARRAY['Cafe','Specialty Coffee','Brunch'], 'premium',
   '2, Jalan Kemuja, Bangsar, 59000 KL',
   ST_SetSRID(ST_MakePoint(101.6733, 3.1318), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'],
   '☕', 'Cozy', 'RM RM RM', 4.6, true,
   '[{"id":"f6","name":"WiFi","description":"High-speed fibre for WFH crew.","icon":"Wifi"}]'::jsonb),

  ('33333333-3333-3333-3333-333333333311', v_vendor,
   'Ben''s Independent Grocer Cafe',
   'Bright Bangsar South brunch spot. Their smashed avo on sourdough and cold brew coffee attract the weekend crowd.',
   ARRAY['Cafe','Brunch','Western'], 'premium',
   'LG 2, Nexus Bangsar South, 59200 KL',
   ST_SetSRID(ST_MakePoint(101.6650, 3.1068), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],
   '🥑', 'Trendy', 'RM RM RM', 4.4, true,
   '[{"id":"f7","name":"Kids Friendly","description":"Kid''s menu and high chairs available.","icon":"Baby"}]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- KUALA LUMPUR — Korean / Thai / Western
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333312', v_vendor,
   'Manse Korean BBQ',
   'Premium Korean BBQ in Desa Sri Hartamas. Marbled pork belly, LA galbi, unlimited banchan and great soju selection.',
   ARRAY['Korean','BBQ','Soju'], 'premium',
   '20, Jalan Sri Hartamas 8, Sri Hartamas, 50480 KL',
   ST_SetSRID(ST_MakePoint(101.6445, 3.1675), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80','https://images.unsplash.com/photo-1529692236671-f1f63c460d30?w=800&q=80'],
   '🇰🇷', 'Lively', 'RM RM RM', 4.5, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333313', v_vendor,
   'Jalan Alor Weng Kee',
   'The most famous stretch of Weng Kee char koay teow on Jalan Alor. Charred wok hei, fresh cockles, served past midnight.',
   ARRAY['Chinese','Hawker','Char Koay Teow'], 'free',
   'Jalan Alor, Bukit Bintang, 50200 KL',
   ST_SetSRID(ST_MakePoint(101.7072, 3.1446), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80'],
   '🍳', 'Street', 'RM', 4.8, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333314', v_vendor,
   'Tequila Joe''s Mexican Grill',
   'Authentic Mexican eats in Bangsar. Slow-braised birria tacos, hand-pressed corn tortillas, and frozen margaritas.',
   ARRAY['Mexican','Western','Tacos'], 'premium',
   '29, Jalan Riong, Bangsar, 59100 KL',
   ST_SetSRID(ST_MakePoint(101.6695, 3.1302), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'],
   '🌮', 'Lively', 'RM RM RM', 4.3, true,
   '[{"id":"f8","name":"Live Music","description":"Band nights on Fridays and Saturdays.","icon":"Music"}]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- PENANG — George Town Heritage
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333315', v_vendor,
   'Lorong Baru Hokkien Mee',
   'The original Penang prawn mee. Rich prawn-and-pork broth ladled over yellow mee, served with kangkung and prawns.',
   ARRAY['Penang','Hokkien Mee','Hawker'], 'free',
   '17, Lorong Baru, Air Itam, 11500 Penang',
   ST_SetSRID(ST_MakePoint(100.2985, 5.3985), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80'],
   '🍤', 'Heritage', 'RM', 4.9, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333316', v_vendor,
   'Teksen Restaurant',
   'George Town Cantonese comfort food — the slow-braised pork belly with preserved mustard greens is a must.',
   ARRAY['Chinese','Cantonese','Heritage'], 'basic_order',
   '18, Jalan Gottlieb, 10350 George Town, Penang',
   ST_SetSRID(ST_MakePoint(100.3195, 5.4218), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80','https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
   '🥢', 'Heritage', 'RM RM', 4.7, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333317', v_vendor,
   'Joo Hooi Cafe',
   'Oldest char koay teow in Penang. A UNESCO heritage street food experience in the heart of George Town.',
   ARRAY['Penang','Char Koay Teow','Heritage'], 'free',
   '475, Jalan Penang, 10000 George Town, Penang',
   ST_SetSRID(ST_MakePoint(100.3338, 5.4182), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80'],
   '🍳', 'Heritage', 'RM', 4.8, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333318', v_vendor,
   'Kafe Kheng Pin',
   'Legendary Penang laksa stall. Sour, spicy fish-based broth with thick rice noodles — a UNESCO Intangible Cultural Heritage.',
   ARRAY['Penang','Laksa','Heritage'], 'free',
   '80, Jalan Penang, 10000 George Town, Penang',
   ST_SetSRID(ST_MakePoint(100.3342, 5.4176), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'],
   '🐟', 'Heritage', 'RM', 4.7, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333319', v_vendor,
   'Hameediyah Restaurant',
   'Penang''s oldest restaurant (1907). Nasi kandar served in the original family tradition — a real piece of local history.',
   ARRAY['Indian Muslim','Nasi Kandar','Heritage'], 'basic_order',
   '164-A, Campbell Street, George Town, 10100 Penang',
   ST_SetSRID(ST_MakePoint(100.3340, 5.4175), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
   '🍛', 'Heritage', 'RM', 4.6, true, '[]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- PENANG — Modern & Cafe
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333320', v_vendor,
   'Ong Lai Heritage Cafe',
   'Trendy heritage shophouse cafe in George Town. Strong white coffee, toast with pineapple jam, and Nyonya kuih.',
   ARRAY['Cafe','Nyonya','Penang'], 'free',
   '86, Armenian Street, 10200 George Town, Penang',
   ST_SetSRID(ST_MakePoint(100.3365, 5.4178), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'],
   '🫖', 'Cozy', 'RM', 4.5, true,
   '[{"id":"f9","name":"WiFi","description":"Free WiFi for customers.","icon":"Wifi"}]'::jsonb),

  ('33333333-3333-3333-3333-333333333321', v_vendor,
   'Hin Bus Depot Market',
   'Penang''s coolest weekend market in a refurbished bus depot. Local food stalls, craft coffee, vintage items, and live music.',
   ARRAY['Cafe','Street Food','Weekend Market'], 'free',
   '31A, Jalan Gurdwara, 10300 George Town, Penang',
   ST_SetSRID(ST_MakePoint(100.3312, 5.4147), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'],
   '🚌', 'Trendy', 'RM RM', 4.6, true,
   '[{"id":"f10","name":"Live Music","description":"Weekend live acts in the courtyard.","icon":"Music"}]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- JOHOR BAHRU
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333322', v_vendor,
   'Hiap Joo Bakery',
   'JB''s most iconic bakery since 1919. The charcoal-baked banana cake comes out of the oven twice a day — queue early.',
   ARRAY['Bakery','Chinese','Heritage'], 'free',
   '13, Jalan Tan Hiok Nee, Johor Bahru, 80000 Johor',
   ST_SetSRID(ST_MakePoint(103.7578, 1.4590), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=800&q=80'],
   '🍞', 'Heritage', 'RM', 4.7, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333323', v_vendor,
   'Sin Hwa Dee Teochew Restaurant',
   'Old-school Teochew restaurant in JB. Steamed fish and braised duck are the reasons regulars make the trip.',
   ARRAY['Chinese','Teochew','Seafood'], 'basic_order',
   '22, Jalan Serampang, Taman Pelangi, 80400 Johor Bahru',
   ST_SetSRID(ST_MakePoint(103.7558, 1.4710), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80'],
   '🐟', 'Casual', 'RM RM', 4.5, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333324', v_vendor,
   'Restoran Pak Long Stingray',
   'JB''s famous stingray destination. Sambal belachan-grilled stingray wrapped in banana leaf, best eaten at the waterfront.',
   ARRAY['Malay','Seafood','Grilled'], 'basic_order',
   'Jalan Skudai, Taman Permas Jaya, 81750 Masai, Johor',
   ST_SetSRID(ST_MakePoint(103.7905, 1.4432), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'],
   '🐟', 'Casual', 'RM RM', 4.4, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333325', v_vendor,
   'Mutiara Chinese Restaurant',
   'Cantonese dim sum institution in JB. Weekend mornings draw multigenerational families for har gau, siu mai and cha siu bao.',
   ARRAY['Chinese','Dim Sum','Cantonese'], 'basic_order',
   '33, Jalan Wong Ah Fook, 80000 Johor Bahru',
   ST_SetSRID(ST_MakePoint(103.7582, 1.4600), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80'],
   '🥟', 'Bustling', 'RM RM', 4.5, true, '[]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- IPOH
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333326', v_vendor,
   'Lou Wong Bean Sprout Chicken',
   'Ipoh''s most famous dish. Poached free-range chicken glazed with soy, served over silky bean sprouts and flat rice noodles.',
   ARRAY['Ipoh','Hakka','Chicken Rice'], 'free',
   '49, Jalan Yau Tet Shin, Ipoh Old Town, 30000 Ipoh, Perak',
   ST_SetSRID(ST_MakePoint(101.0809, 4.5965), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80','https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80'],
   '🐓', 'Heritage', 'RM', 4.8, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333327', v_vendor,
   'Thean Chun Coffee Shop',
   'Heritage kopitiam in Ipoh Old Town. Their half-boiled eggs and white coffee — made with margarine-roasted beans — are iconic.',
   ARRAY['Kopitiam','Chinese','Breakfast'], 'free',
   '73, Jalan Bandar Timah, 30000 Ipoh, Perak',
   ST_SetSRID(ST_MakePoint(101.0830, 4.5960), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'],
   '☕', 'Heritage', 'RM', 4.7, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333328', v_vendor,
   'Funny Mountain Soya Bean',
   'Famous Ipoh tofu fa and soy milk — silken beancurd in syrup or with ginger. A must-stop on any Ipoh food trail.',
   ARRAY['Dessert','Chinese','Tofu'], 'free',
   '125, Jalan Sultan Iskandar, 30000 Ipoh, Perak',
   ST_SetSRID(ST_MakePoint(101.0820, 4.5955), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'],
   '🫘', 'Street', 'RM', 4.6, true, '[]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- MELAKA
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333329', v_vendor,
   'Nancy''s Kitchen',
   'The Nyonya kitchen every food tourist is looking for. Authentic Peranakan flavours — ayam pongteh, babi assam, kuih.',
   ARRAY['Nyonya','Peranakan','Heritage'], 'basic_order',
   '13, Jalan KL 3/8, Taman Kota Laksamana, 75200 Melaka',
   ST_SetSRID(ST_MakePoint(102.2461, 2.1940), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'],
   '🌸', 'Heritage', 'RM RM', 4.7, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333330', v_vendor,
   'Restoran Pak Putra Tandoori',
   'Melaka''s beloved Pakistani halal restaurant. Naan straight from the tandoor, rich butter chicken, and smoky seekh kebab.',
   ARRAY['Pakistani','Indian','Tandoori'], 'basic_order',
   'Jalan Tun Sri Lanang, Melaka Town, 75100 Melaka',
   ST_SetSRID(ST_MakePoint(102.2449, 2.1956), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
   '🫓', 'Casual', 'RM', 4.5, true, '[]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- KUALA LUMPUR — Neighbourhood Gems
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333331', v_vendor,
   'Insaf Restaurant',
   'KL''s beloved roti canai and teh tarik stop since 1966. The dhosai and mutton curry are the weekend ritual of thousands.',
   ARRAY['Mamak','Indian','Breakfast'], 'free',
   '3, Jalan Dang Wangi, 50480 Kuala Lumpur',
   ST_SetSRID(ST_MakePoint(101.6985, 3.1548), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
   '🫓', 'Bustling', 'RM', 4.5, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333332', v_vendor,
   'Ikan Bakar Jalan Bellamy',
   'Riverside charcoal-grilled seafood institution. Stingray with sambal, barbecued sotong, and ice cold coconut water.',
   ARRAY['Malay','Seafood','Grilled'], 'basic_order',
   'Jalan Bellamy, Lake Gardens, 50480 Kuala Lumpur',
   ST_SetSRID(ST_MakePoint(101.6826, 3.1426), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80','https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&q=80'],
   '🦑', 'Casual', 'RM RM', 4.6, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333333', v_vendor,
   'Gerai Asam Pedas Umbai',
   'The best Melaka-style asam pedas in KL. Sour tamarind broth, mackerel, fresh torch ginger — eaten with white rice.',
   ARRAY['Malay','Seafood','Asam Pedas'], 'free',
   'Pasar Borong Selayang Hawker Area, 68100 Batu Caves, Selangor',
   ST_SetSRID(ST_MakePoint(101.6887, 3.2366), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1589302168068-964664d93a0f?w=800&q=80'],
   '🌶️', 'Street', 'RM', 4.7, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333334', v_vendor,
   'The Smokehouse BBQ KL',
   'Texas-style low-and-slow BBQ in Mont Kiara. Brisket smoked 16 hours over hickory, coleslaw, and corn bread.',
   ARRAY['Western','BBQ','American'], 'premium',
   'G-01, Arcoris, 10 Jalan Kiara, Mont Kiara, 50480 KL',
   ST_SetSRID(ST_MakePoint(101.6510, 3.1724), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1529692236671-f1f63c460d30?w=800&q=80'],
   '🥩', 'Casual', 'RM RM RM', 4.5, true,
   '[{"id":"f11","name":"Outdoor Seating","description":"Al fresco BBQ patio area.","icon":"Coffee"}]'::jsonb),

  ('33333333-3333-3333-3333-333333333335', v_vendor,
   'Laksa Shack Damansara',
   'Modern take on Malaysian laksa — eight regional varieties side by side, from Penang to Sarawak laksa.',
   ARRAY['Malaysian','Laksa','Modern'], 'basic_order',
   '29, Jalan SS2/61, Petaling Jaya, 47300 Selangor',
   ST_SetSRID(ST_MakePoint(101.6162, 3.1148), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'],
   '🍜', 'Casual', 'RM RM', 4.4, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333336', v_vendor,
   'Mak Yang Kerabu',
   'Authentic Kelantan-style ulam in KL. Raw herb salads, budu dipping sauce, and nasi kerabu — brought straight from the east coast.',
   ARRAY['Malay','Kelantan','Ulam'], 'free',
   'Pasar Payang food court area, Setapak, 53300 KL',
   ST_SetSRID(ST_MakePoint(101.7075, 3.1917), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1589302168068-964664d93a0f?w=800&q=80'],
   '🌿', 'Street', 'RM', 4.5, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333337', v_vendor,
   'Sangkaya Coconut Ice Cream',
   'Malaysian artisan ice cream made from real coconuts. Served in a coconut shell with a choice of toppings — a Bangsar staple.',
   ARRAY['Dessert','Ice Cream','Malaysian'], 'free',
   '17, Jalan Telawi 3, Bangsar Baru, 59100 KL',
   ST_SetSRID(ST_MakePoint(101.6710, 3.1298), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'],
   '🥥', 'Cozy', 'RM', 4.7, true, '[]'::jsonb),

  -- ─────────────────────────────────────────────────────────────────────────
  -- KOTA KINABALU & KUCHING
  -- ─────────────────────────────────────────────────────────────────────────
  ('33333333-3333-3333-3333-333333333338', v_vendor,
   'Welcome Seafood Restaurant',
   'KK''s most celebrated fresh seafood spot. Pick your own catch — tiger prawns, lobster, butter garlic crab — cooked your way.',
   ARRAY['Seafood','Chinese','Sabah'], 'premium',
   'Lot 1, Block B, Sinsuran Complex, 88000 Kota Kinabalu, Sabah',
   ST_SetSRID(ST_MakePoint(116.0735, 5.9788), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80','https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&q=80'],
   '🦞', 'Lively', 'RM RM RM', 4.6, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333339', v_vendor,
   'Chong Choon Cafe Kuching',
   'Sarawak laksa the way it should be — lemongrass-coconut broth, vermicelli, crunchy omelette strips, and fresh lime.',
   ARRAY['Sarawak','Laksa','Heritage'], 'free',
   '13, Jalan Abell, 93100 Kuching, Sarawak',
   ST_SetSRID(ST_MakePoint(110.3387, 1.5571), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'],
   '🍜', 'Heritage', 'RM', 4.8, true, '[]'::jsonb),

  ('33333333-3333-3333-3333-333333333340', v_vendor,
   'Lepau Restaurant Kuching',
   'Fine dining showcase of indigenous Sarawak cuisine. Daun ubi tebaloi, umai raw fish, and wild boar rendang done beautifully.',
   ARRAY['Sarawak','Indigenous','Fine Dining'], 'premium',
   '98, Jalan Padungan, 93100 Kuching, Sarawak',
   ST_SetSRID(ST_MakePoint(110.3405, 1.5566), 4326)::geography,
   ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'],
   '🌿', 'Upscale', 'RM RM RM', 4.7, true,
   '[{"id":"f12","name":"Halal Certified","description":"Fully halal kitchen and menu.","icon":"Star"}]'::jsonb);

  -- ─────────────────────────────────────────────────────────────────────────
  -- MENUS (3 items per restaurant — covers spinner result cards)
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO menus (restaurant_id, name, description, price, category) VALUES
  -- 301 Nasi Kandar Pelita
  ('33333333-3333-3333-3333-333333333301','Nasi Kandar Campur','Mixed rice with your choice of 3 lauk',12.00,'Mains'),
  ('33333333-3333-3333-3333-333333333301','Ayam Tandoori','Whole spiced roasted chicken',18.00,'Mains'),
  ('33333333-3333-3333-3333-333333333301','Teh Tarik','Pulled milk tea',2.50,'Drinks'),
  -- 302 Yusoof & Zakhir
  ('33333333-3333-3333-3333-333333333302','Nasi Briyani Ayam','Fragrant basmati with spiced chicken',15.00,'Mains'),
  ('33333333-3333-3333-3333-333333333302','Ayam Masak Merah','Chicken in spicy tomato gravy',14.00,'Mains'),
  ('33333333-3333-3333-3333-333333333302','Air Sirap Limau','Syrup with lime',3.00,'Drinks'),
  -- 303 Hameed Pata Mee Sotong
  ('33333333-3333-3333-3333-333333333303','Mee Sotong','Yellow noodles with baby cuttlefish',9.00,'Mains'),
  ('33333333-3333-3333-3333-333333333303','Mee Sotong Goreng Kering','Dry-fried version with extra sambal',10.00,'Mains'),
  ('33333333-3333-3333-3333-333333333303','Air Bandung','Rose-flavoured milk',2.50,'Drinks'),
  -- 304 Lai Foong Wonton Mee
  ('33333333-3333-3333-3333-333333333304','Wonton Mee Soup','Clear broth, wonton, char siu',9.00,'Mains'),
  ('33333333-3333-3333-3333-333333333304','Wonton Mee Dry','With soy sauce and chilli',9.00,'Mains'),
  ('33333333-3333-3333-3333-333333333304','Kopi O','Black Malaysian coffee',2.00,'Drinks'),
  -- 305 Fei Fei Roast Duck
  ('33333333-3333-3333-3333-333333333305','Roast Duck Rice','Half-duck portion over rice',14.00,'Mains'),
  ('33333333-3333-3333-3333-333333333305','Char Siu Rice','BBQ pork over steamed rice',12.00,'Mains'),
  ('33333333-3333-3333-3333-333333333305','Chrysanthemum Tea','Cold floral tea',3.00,'Drinks'),
  -- 306 Kim Lian Kee
  ('33333333-3333-3333-3333-333333333306','Hokkien Mee Hitam','Signature dark fried noodles',11.00,'Mains'),
  ('33333333-3333-3333-3333-333333333306','Hokkien Mee Putih','Light-braised prawn white version',11.00,'Mains'),
  ('33333333-3333-3333-3333-333333333306','Teh O Limau','Iced black tea with lime',3.00,'Drinks'),
  -- 307 Dewakan
  ('33333333-3333-3333-3333-333333333307','8-Course Tasting Menu','Seasonal Bornean ingredients',395.00,'Tasting Menu'),
  ('33333333-3333-3333-3333-333333333307','Wine Pairing (per person)','Curated 6-glass pairing',220.00,'Beverages'),
  ('33333333-3333-3333-3333-333333333307','A la Carte Starter','Chef''s daily selection',68.00,'Starters'),
  -- 308 Nobu KL
  ('33333333-3333-3333-3333-333333333308','Black Cod Miso','Signature dish, 180g portion',128.00,'Mains'),
  ('33333333-3333-3333-3333-333333333308','Yellowtail Jalapeño Sashimi','5 slices with yuzu dressing',88.00,'Starters'),
  ('33333333-3333-3333-3333-333333333308','Wagyu Gyoza','Crispy pan-fried dumplings',58.00,'Starters'),
  -- 309 Entier French
  ('33333333-3333-3333-3333-333333333309','Prime Beef Tartare','Hand-cut with Dijon and quail egg',68.00,'Starters'),
  ('33333333-3333-3333-3333-333333333309','Duck Confit','Served with garlic pomme puree',95.00,'Mains'),
  ('33333333-3333-3333-3333-333333333309','Crème Brûlée','Classic vanilla bean',28.00,'Dessert'),
  -- 310 VCR Bangsar
  ('33333333-3333-3333-3333-333333333310','Single Origin Pour-Over','House-selected rotating origin',18.00,'Coffee'),
  ('33333333-3333-3333-3333-333333333310','Ricotta Toast','Whipped ricotta, fig jam, walnut',26.00,'Brunch'),
  ('33333333-3333-3333-3333-333333333310','Flat White','Double ristretto, steamed milk',15.00,'Coffee'),
  -- 311 Ben's
  ('33333333-3333-3333-3333-333333333311','Smashed Avo Toast','Sourdough, poached egg, dukkah',28.00,'Brunch'),
  ('33333333-3333-3333-3333-333333333311','Cold Brew','18-hour steeped house blend',16.00,'Coffee'),
  ('33333333-3333-3333-3333-333333333311','Acai Bowl','House granola, mixed berries',32.00,'Brunch'),
  -- 312 Manse Korean BBQ
  ('33333333-3333-3333-3333-333333333312','Samgyeopsal (200g)','Thick-cut pork belly',38.00,'BBQ'),
  ('33333333-3333-3333-3333-333333333312','LA Galbi (200g)','Flanken-cut short rib',58.00,'BBQ'),
  ('33333333-3333-3333-3333-333333333312','Soju Bottle','Chamisul Fresh',28.00,'Drinks'),
  -- 313 Jalan Alor Weng Kee
  ('33333333-3333-3333-3333-333333333313','Char Koay Teow','Wok hei noodles with cockles',11.00,'Mains'),
  ('33333333-3333-3333-3333-333333333313','Hokkien Char','Thick noodle stir-fry',10.00,'Mains'),
  ('33333333-3333-3333-3333-333333333313','Fresh Coconut','Chilled whole coconut',6.00,'Drinks'),
  -- 314 Tequila Joe's
  ('33333333-3333-3333-3333-333333333314','Birria Tacos (3pc)','Braised beef, consommé dip',35.00,'Tacos'),
  ('33333333-3333-3333-3333-333333333314','Frozen Margarita','Classic lime, salt rim',28.00,'Cocktails'),
  ('33333333-3333-3333-3333-333333333314','Nachos Grande','Loaded with guacamole and pico',38.00,'Sharing'),
  -- 315 Lorong Baru Hokkien Mee
  ('33333333-3333-3333-3333-333333333315','Prawn Mee Soup (Big)','Large prawns, pork ribs, noodles',10.00,'Mains'),
  ('33333333-3333-3333-3333-333333333315','Prawn Mee Dry','Tossed in sambal with lime',10.00,'Mains'),
  ('33333333-3333-3333-3333-333333333315','Kopi Tarik','Penang white coffee pulled',3.50,'Drinks'),
  -- 316 Teksen
  ('33333333-3333-3333-3333-333333333316','Slow-braised Pork Belly','With preserved mustard greens',28.00,'Mains'),
  ('33333333-3333-3333-3333-333333333316','Steamed Siakap','Soy-ginger whole sea bass',45.00,'Mains'),
  ('33333333-3333-3333-3333-333333333316','Braised Tofu','Silken tofu in claypot',18.00,'Sides'),
  -- 317 Joo Hooi
  ('33333333-3333-3333-3333-333333333317','Char Koay Teow','Classic with pork lard and egg',10.00,'Mains'),
  ('33333333-3333-3333-3333-333333333317','Penang Laksa','Spicy sour fish broth noodles',9.00,'Mains'),
  ('33333333-3333-3333-3333-333333333317','Iced White Coffee','Penang style sweetened coffee',4.00,'Drinks'),
  -- 318 Kafe Kheng Pin Laksa
  ('33333333-3333-3333-3333-333333333318','Penang Laksa (Regular)','Thick rice noodles in fish broth',8.00,'Mains'),
  ('33333333-3333-3333-3333-333333333318','Penang Laksa (Large)','Larger portion',10.00,'Mains'),
  ('33333333-3333-3333-3333-333333333318','Cendol','Gula melaka shaved ice',4.00,'Dessert'),
  -- 319 Hameediyah
  ('33333333-3333-3333-3333-333333333319','Nasi Kandar Traditional','Rice with fish curry and papadum',12.00,'Mains'),
  ('33333333-3333-3333-3333-333333333319','Mutton Curry','Slow-cooked dry rempah style',16.00,'Mains'),
  ('33333333-3333-3333-3333-333333333319','Teh Tarik','Classic pulled tea',2.50,'Drinks'),
  -- 320 Ong Lai Heritage Cafe
  ('33333333-3333-3333-3333-333333333320','White Coffee Toast','With pineapple jam and butter',7.00,'Breakfast'),
  ('33333333-3333-3333-3333-333333333320','Half-Boiled Eggs','Two eggs with soy sauce',3.50,'Breakfast'),
  ('33333333-3333-3333-3333-333333333320','Ipoh White Coffee','Classic style iced',5.50,'Drinks'),
  -- 321 Hin Bus Depot
  ('33333333-3333-3333-3333-333333333321','Hawker Stall Selection','Various stalls — explore yourself',10.00,'Mixed'),
  ('33333333-3333-3333-3333-333333333321','Craft Beer','Local and regional selection',18.00,'Drinks'),
  ('33333333-3333-3333-3333-333333333321','Single Origin Coffee','Market vendor roasted beans',12.00,'Coffee'),
  -- 322 Hiap Joo Bakery
  ('33333333-3333-3333-3333-333333333322','Banana Cake','Charcoal-baked, sold by weight per loaf',12.00,'Bakery'),
  ('33333333-3333-3333-3333-333333333322','Coconut Cake','Classic JB bakery style',10.00,'Bakery'),
  ('33333333-3333-3333-3333-333333333322','Kaya Puff','Flaky pastry with coconut jam',3.50,'Pastry'),
  -- 323 Sin Hwa Dee
  ('33333333-3333-3333-3333-333333333323','Steamed Siakap','Whole sea bass with ginger',52.00,'Seafood'),
  ('33333333-3333-3333-3333-333333333323','Braised Duck','Half duck Teochew style',28.00,'Mains'),
  ('33333333-3333-3333-3333-333333333323','Kangkung Belacan','Morning glory with shrimp paste',12.00,'Sides'),
  -- 324 Pak Long Stingray
  ('33333333-3333-3333-3333-333333333324','Ikan Pari Bakar','Grilled stingray with sambal',22.00,'Grilled'),
  ('33333333-3333-3333-3333-333333333324','Sotong Bakar','Grilled squid with sweet soy',18.00,'Grilled'),
  ('33333333-3333-3333-3333-333333333324','Siput Sedut','Whelks in spicy gravy',15.00,'Seafood'),
  -- 325 Mutiara Dim Sum
  ('33333333-3333-3333-3333-333333333325','Har Gau (4pc)','Steamed prawn dumplings',12.00,'Dim Sum'),
  ('33333333-3333-3333-3333-333333333325','Siu Mai (4pc)','Pork and prawn open dumplings',11.00,'Dim Sum'),
  ('33333333-3333-3333-3333-333333333325','Cha Siu Bao (3pc)','Steamed BBQ pork buns',12.00,'Dim Sum'),
  -- 326 Lou Wong
  ('33333333-3333-3333-3333-333333333326','Ipoh Chicken Rice','Poached chicken, bean sprouts, noodles',13.00,'Mains'),
  ('33333333-3333-3333-3333-333333333326','Half Kampung Chicken','Free-range half bird',35.00,'Mains'),
  ('33333333-3333-3333-3333-333333333326','Bean Sprout Stir-fry','Soy and garlic toss',9.00,'Sides'),
  -- 327 Thean Chun
  ('33333333-3333-3333-3333-333333333327','Half-Boiled Eggs','With soy drizzle',2.50,'Breakfast'),
  ('33333333-3333-3333-3333-333333333327','Kaya Butter Toast','Thick-cut white bread',4.50,'Breakfast'),
  ('33333333-3333-3333-3333-333333333327','Ipoh White Coffee (Hot)','Classic kopitiam white',4.00,'Drinks'),
  -- 328 Funny Mountain
  ('33333333-3333-3333-3333-333333333328','Tofu Fa (Plain)','Silken beancurd with clear syrup',4.00,'Dessert'),
  ('33333333-3333-3333-3333-333333333328','Tofu Fa (Ginger)','With warming ginger juice',4.50,'Dessert'),
  ('33333333-3333-3333-3333-333333333328','Fresh Soy Milk','Warm or cold',3.00,'Drinks'),
  -- 329 Nancy's Kitchen
  ('33333333-3333-3333-3333-333333333329','Ayam Pongteh','Chicken in fermented soy bean stew',22.00,'Mains'),
  ('33333333-3333-3333-3333-333333333329','Babi Assam','Pork in tamarind gravy (non-halal)',28.00,'Mains'),
  ('33333333-3333-3333-3333-333333333329','Nyonya Kuih Platter','Assorted traditional cakes',18.00,'Dessert'),
  -- 330 Pak Putra Tandoori
  ('33333333-3333-3333-3333-333333333330','Naan Tandoor','Fresh naan from the clay oven',3.50,'Bread'),
  ('33333333-3333-3333-3333-333333333330','Butter Chicken','Rich tomato-cream gravy',18.00,'Mains'),
  ('33333333-3333-3333-3333-333333333330','Seekh Kebab','Spiced minced lamb skewers',20.00,'Starters'),
  -- 331 Insaf
  ('33333333-3333-3333-3333-333333333331','Roti Canai','Flaky flatbread with dhal',2.50,'Mains'),
  ('33333333-3333-3333-3333-333333333331','Dhosai','Crispy fermented rice crepe',6.00,'Mains'),
  ('33333333-3333-3333-3333-333333333331','Teh Tarik','Classic pulled milk tea',2.50,'Drinks'),
  -- 332 Ikan Bakar Bellamy
  ('33333333-3333-3333-3333-333333333332','Ikan Pari Bakar (Sederhana)','Medium sambal stingray',20.00,'Grilled'),
  ('33333333-3333-3333-3333-333333333332','Sotong Bakar','Whole grilled squid',18.00,'Grilled'),
  ('33333333-3333-3333-3333-333333333332','Kelapa Muda','Fresh young coconut',6.00,'Drinks'),
  -- 333 Asam Pedas Umbai
  ('33333333-3333-3333-3333-333333333333','Asam Pedas Ikan Pari','Stingray in sour tamarind broth',14.00,'Mains'),
  ('33333333-3333-3333-3333-333333333333','Asam Pedas Daging','Beef cheek Melaka style',16.00,'Mains'),
  ('33333333-3333-3333-3333-333333333333','Nasi Putih','Steamed jasmine rice',1.50,'Sides'),
  -- 334 Smokehouse BBQ
  ('33333333-3333-3333-3333-333333333334','Smoked Beef Brisket (200g)','16-hour hickory smoked',58.00,'BBQ'),
  ('33333333-3333-3333-3333-333333333334','BBQ Combo Platter (2 pax)','Brisket, ribs, sausage with sides',128.00,'BBQ'),
  ('33333333-3333-3333-3333-333333333334','Craft Root Beer','House-made floats',18.00,'Drinks'),
  -- 335 Laksa Shack
  ('33333333-3333-3333-3333-333333333335','Penang Laksa','Traditional sour fish broth',14.00,'Mains'),
  ('33333333-3333-3333-3333-333333333335','Sarawak Laksa','Coconut-lemongrass broth',14.00,'Mains'),
  ('33333333-3333-3333-3333-333333333335','Curry Laksa','Rich santan-based broth',14.00,'Mains'),
  -- 336 Mak Yang Kerabu
  ('33333333-3333-3333-3333-333333333336','Nasi Kerabu Biru','Blue rice with coconut and herbs',11.00,'Mains'),
  ('33333333-3333-3333-3333-333333333336','Ulam Platter','Fresh herb salad with budu',8.00,'Sides'),
  ('33333333-3333-3333-3333-333333333336','Ayam Percik','Grilled coconut-marinated chicken',14.00,'Mains'),
  -- 337 Sangkaya
  ('33333333-3333-3333-3333-333333333337','Single Scoop in Shell','Coconut ice cream in coconut',10.00,'Dessert'),
  ('33333333-3333-3333-3333-333333333337','Double Scoop','Two flavours with toppings',14.00,'Dessert'),
  ('33333333-3333-3333-3333-333333333337','Coconut Shake','Blended fresh coconut',9.00,'Drinks'),
  -- 338 Welcome Seafood KK
  ('33333333-3333-3333-3333-333333333338','Butter Garlic Tiger Prawn','Fresh Sabah prawns',68.00,'Seafood'),
  ('33333333-3333-3333-3333-333333333338','Steamed Garoupa','Soy and ginger-steamed grouper',78.00,'Seafood'),
  ('33333333-3333-3333-3333-333333333338','Sabah Veggie (Midin Fern)','Stir-fried jungle fern',18.00,'Sides'),
  -- 339 Chong Choon Sarawak Laksa
  ('33333333-3333-3333-3333-333333333339','Sarawak Laksa (Standard)','The real deal — lemongrass coconut',9.00,'Mains'),
  ('33333333-3333-3333-3333-333333333339','Sarawak Laksa (Special)','Extra prawns and chicken',12.00,'Mains'),
  ('33333333-3333-3333-3333-333333333339','Kopi Hitam Kuching','Local black coffee',3.00,'Drinks'),
  -- 340 Lepau Kuching
  ('33333333-3333-3333-3333-333333333340','Umai Raw Fish Salad','Dayak ceviche with lime and onion',38.00,'Starters'),
  ('33333333-3333-3333-3333-333333333340','Wild Boar Rendang','Forest-sourced slow-braised rendang',68.00,'Mains'),
  ('33333333-3333-3333-3333-333333333340','Ambuyat Tasting','Traditional sago paste experience',45.00,'Heritage');

END $$;
