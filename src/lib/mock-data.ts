import type { Restaurant, MenuItem, Promotion, Review, CreatorProfile, Article } from './types';

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'mock-1',
    name: 'Village Park Nasi Lemak',
    description: 'Legendary nasi lemak in Bangsar. Crispy ayam goreng berempah, sambal that hits just right, and coconut rice that keeps locals lining up before 7am.',
    cuisine_types: ['Malay', 'Breakfast'],
    address: '5, Jalan Riong, Bangsar, 59100 Kuala Lumpur',
    images: [
      'https://images.unsplash.com/photo-1589302168068-964664d93a0f?w=800&q=80',
      'https://images.unsplash.com/photo-1603133872878-684f208fb589?w=800&q=80',
    ],
    emoji: '🍛',
    vibe: 'Bustling',
    price_range: 'RM RM',
    rating: 4.8,
    is_active: true,
    business_hours: { Monday: '07:00-14:00', Tuesday: '07:00-14:00', Wednesday: '07:00-14:00', Thursday: '07:00-14:00', Friday: '07:00-14:00', Saturday: '07:00-15:00', Sunday: 'Closed' },
    facilities: [
      { id: 'f1', name: 'Kids Friendly', description: 'High chairs and child-friendly cutlery available.', icon: 'Baby', photo_url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&q=80' },
      { id: 'f2', name: 'Air Conditioned', description: 'Cool and comfortable indoor seating.', icon: 'Wind' },
    ]
  },
  {
    id: 'mock-2',
    name: 'Devi\'s Corner',
    description: 'Iconic banana leaf rice spot in Bangsar. Generous portions, fiery fish curry, and the kind of atmosphere that feels like home.',
    cuisine_types: ['Indian', 'Banana Leaf'],
    address: '14, Jalan Telawi 4, Bangsar Baru, 59100 KL',
    images: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    ],
    emoji: '🍌',
    vibe: 'Lively',
    price_range: 'RM RM',
    rating: 4.6,
    is_active: true,
  },
  {
    id: 'mock-3',
    name: 'Brew & Bites TTDI',
    description: 'Specialty coffee meets modern Malaysian brunch. Think kaya toast reinvented, soft-shell crab benedict, and single-origin pour-overs.',
    cuisine_types: ['Cafe', 'Brunch'],
    address: '32, Jalan Datuk Sulaiman, Taman Tun Dr Ismail, 60000 KL',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    ],
    emoji: '☕',
    vibe: 'Cozy',
    price_range: 'RM RM RM',
    rating: 4.5,
    is_active: true,
  },
  {
    id: 'mock-4',
    name: 'Sushi Hikari',
    description: 'Omakase-style Japanese dining in KLCC. Fresh sashimi flown in daily, intimate counter seating, and seasonal chef specials.',
    cuisine_types: ['Japanese', 'Sushi'],
    address: 'Level 3, Suria KLCC, 50088 Kuala Lumpur',
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
    ],
    emoji: '🍣',
    vibe: 'Upscale',
    price_range: 'RM RM RM RM',
    rating: 4.9,
    is_active: true,
  },
  {
    id: 'mock-5',
    name: 'Penang Road Cendol',
    description: 'Heritage dessert stall vibes in Georgetown. Shaved ice, gula melaka, green jelly — the OG cure for Malaysian heat.',
    cuisine_types: ['Dessert', 'Penang'],
    address: 'Lebuh Keng Kwee, 10200 George Town, Penang',
    images: [
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
    ],
    emoji: '🍧',
    vibe: 'Heritage',
    price_range: 'RM',
    rating: 4.7,
    is_active: true,
  },
  {
    id: 'mock-6',
    name: 'Warung Pak Din',
    description: 'Hidden gem in Shah Alam serving sup tulang and roti canai until midnight. Football on TV, teh tarik flowing, zero pretension.',
    cuisine_types: ['Mamak', 'Late Night'],
    address: 'Seksyen 7, 40000 Shah Alam, Selangor',
    images: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    ],
    emoji: '🫓',
    vibe: 'Casual',
    price_range: 'RM',
    rating: 4.4,
    is_active: true,
  },
  {
    id: 'bakarizu-1',
    name: 'Bakarizu Premium Yakiniku',
    description: 'Elite Japanese BBQ experience in the heart of the city. We serve only the finest A5 Wagyu, grilled to perfection over binchotan charcoal. Our industrial-chic space offers an intimate setting for meat connoisseurs.',
    cuisine_types: ['Japanese', 'Yakiniku', 'Wagyu'],
    address: 'G-12, Platinum Park, Persiaran KLCC, 50088 Kuala Lumpur',
    images: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
      'https://images.unsplash.com/photo-1529692236671-f1f63c460d30?w=800&q=80',
      'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&q=80',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    ],
    emoji: '🥩',
    vibe: 'Industrial',
    price_range: 'RM RM RM RM',
    rating: 4.9,
    is_active: true,
    facilities: [
      { id: 'f3', name: 'Private Dining', description: 'Exclusive soundproof rooms for business or family gatherings.', icon: 'DoorOpen', photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' },
      { id: 'f4', name: 'Surau Available', description: 'Clean and quiet prayer room located within the premise.', icon: 'Moon', photo_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80' },
      { id: 'f5', name: 'Valet Parking', description: 'Complimentary valet service for all dining guests.', icon: 'Car', photo_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80' },
    ]
  },
];

export const MOCK_MENUS: Record<string, MenuItem[]> = {
  'mock-1': [
    { id: 'm1', restaurant_id: 'mock-1', name: 'Nasi Lemak Special', description: 'Ayam goreng, sambal, telur, kacang, ikan bilis', price: 18.5, image_url: null, category: 'Mains', is_available: true },
    { id: 'm2', restaurant_id: 'mock-1', name: 'Nasi Lemak Biasa', description: 'Classic with sambal and sides', price: 12.0, image_url: null, category: 'Mains', is_available: true },
    { id: 'm3', restaurant_id: 'mock-1', name: 'Teh Tarik', description: 'Pulled milk tea', price: 3.5, image_url: null, category: 'Drinks', is_available: true },
  ],
  'mock-2': [
    { id: 'm4', restaurant_id: 'mock-2', name: 'Banana Leaf Set', description: 'Rice with 3 veg, papadum, rasam', price: 15.0, image_url: null, category: 'Mains', is_available: true },
    { id: 'm5', restaurant_id: 'mock-2', name: 'Fish Head Curry', description: 'Spicy Tamil-style curry', price: 45.0, image_url: null, category: 'Mains', is_available: true },
  ],
  'mock-3': [
    { id: 'm6', restaurant_id: 'mock-3', name: 'Soft Shell Crab Benedict', description: 'Poached eggs, hollandaise, sourdough', price: 38.0, image_url: null, category: 'Brunch', is_available: true },
    { id: 'm7', restaurant_id: 'mock-3', name: 'Kaya Butter Toast', description: 'Modern twist on a classic', price: 16.0, image_url: null, category: 'Brunch', is_available: true },
    { id: 'm8', restaurant_id: 'mock-3', name: 'Flat White', description: 'Single origin espresso', price: 14.0, image_url: null, category: 'Drinks', is_available: true },
  ],
  'bakarizu-1': [
    { id: 'b1', restaurant_id: 'bakarizu-1', name: 'A5 Wagyu Ribeye', description: '100g of marbled perfection, sliced for grilling', price: 180.0, image_url: null, category: 'Wagyu', is_available: true },
    { id: 'b2', restaurant_id: 'bakarizu-1', name: 'Premium Beef Tongue', description: 'Thinly sliced with spring onion and lemon', price: 45.0, image_url: null, category: 'Beef', is_available: true },
    { id: 'b3', restaurant_id: 'bakarizu-1', name: 'Garlic Fried Rice', description: 'Wok-tossed with premium beef bits', price: 18.0, image_url: null, category: 'Sides', is_available: true },
    { id: 'b4', restaurant_id: 'bakarizu-1', name: 'Matcha Ice Cream', description: 'Authentic Uji matcha', price: 12.0, image_url: null, category: 'Dessert', is_available: true },
  ],
};

export const MOCK_PROMOTIONS: Promotion[] = [
  { id: 'p1', restaurant_id: 'mock-1', title: 'Early Bird Special', description: 'Order before 8am and get free teh tarik', discount_label: 'Free Drink', valid_until: '2026-12-31', is_active: true, restaurants: { name: 'Village Park Nasi Lemak', emoji: '🍛' } },
  { id: 'p2', restaurant_id: 'mock-3', title: 'Weekend Brunch Deal', description: '20% off all brunch sets every Saturday & Sunday', discount_label: '20% OFF', valid_until: '2026-08-31', is_active: true, restaurants: { name: 'Brew & Bites TTDI', emoji: '☕' } },
  { id: 'p3', restaurant_id: 'mock-4', title: 'Omakase Preview', description: 'First-timers get complimentary miso soup & edamame', discount_label: 'Complimentary', valid_until: '2026-06-30', is_active: true, restaurants: { name: 'Sushi Hikari', emoji: '🍣' } },
];

export const MOCK_CREATORS: CreatorProfile[] = [
  {
    id: 'c1',
    profile_id: 'creator-1',
    bio: 'KL food scout obsessed with hidden hawker gems and late-night mamak runs. Bangsar born, appetite nationwide.',
    expertise_areas: ['Bangsar', 'TTDI', 'KLCC'],
    expertise_cuisines: ['Malay', 'Mamak', 'Cafe'],
    is_local_expert: true,
    review_count: 127,
    follower_count: 3420,
    profiles: { id: 'creator-1', role: 'creator', full_name: 'Aina Rahman', username: 'aina_eats', avatar_url: null, gamification_points: 8200, badges: [], bio: null },
  },
  {
    id: 'c2',
    profile_id: 'creator-2',
    bio: 'Penang heritage food historian turned content creator. If it has gula melaka, I\'ve probably reviewed it.',
    expertise_areas: ['George Town', 'Gurney', 'Bayan Lepas'],
    expertise_cuisines: ['Penang', 'Chinese', 'Dessert'],
    is_local_expert: true,
    review_count: 89,
    follower_count: 5100,
    profiles: { id: 'creator-2', role: 'creator', full_name: 'Marcus Tan', username: 'marcus_makan', avatar_url: null, gamification_points: 6500, badges: [], bio: null },
  },
  {
    id: 'c3',
    profile_id: 'creator-3',
    bio: 'Japanese cuisine specialist covering KL\'s sushi scene. Former kitchen staff, now full-time reviewer.',
    expertise_areas: ['KLCC', 'Bukit Bintang', 'Mont Kiara'],
    expertise_cuisines: ['Japanese', 'Sushi', 'Ramen'],
    is_local_expert: true,
    review_count: 64,
    follower_count: 2100,
    profiles: { id: 'creator-3', role: 'creator', full_name: 'Yuki Nakamura', username: 'yuki_plates', avatar_url: null, gamification_points: 4800, badges: [], bio: null },
  },
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', restaurant_id: 'mock-1', customer_id: 'creator-1', rating: 5, comment: 'Still the gold standard for nasi lemak in KL. Get here early!', photos: [], created_at: '2026-05-01T10:00:00Z', profiles: { full_name: 'Aina Rahman', avatar_url: null, username: 'aina_eats' } },
  { id: 'r2', restaurant_id: 'mock-3', customer_id: 'creator-1', rating: 4, comment: 'Great coffee and the crab benedict is worth the splurge.', photos: [], created_at: '2026-05-10T14:00:00Z', profiles: { full_name: 'Aina Rahman', avatar_url: null, username: 'aina_eats' } },
];

export const MOCK_ARTICLES: Article[] = [
  { id: 'a1', author_id: 'creator-1', title: '10 Hidden Hawker Stalls in Bangsar You Need to Try', content: 'Beyond the usual suspects, Bangsar hides some incredible late-night eats...', type: 'trend', event_date: null, created_at: '2026-05-15T08:00:00Z', profiles: { full_name: 'Aina Rahman', username: 'aina_eats', avatar_url: null } },
  { id: 'a2', author_id: 'creator-2', title: 'Penang Cendol Crawl: A Local Expert\'s Guide', content: 'From Lebuh Keng Kwee to the alley stalls tourists miss...', type: 'trend', event_date: null, created_at: '2026-05-12T08:00:00Z', profiles: { full_name: 'Marcus Tan', username: 'marcus_makan', avatar_url: null } },
  { id: 'a3', author_id: null, title: 'Makanjom Creator Workshop: Build Your Food Brand', content: 'Join us for a hands-on session on food photography and review writing.', type: 'training_event', event_date: '2026-06-20', created_at: '2026-05-01T08:00:00Z' },
];

export function getMockRestaurant(id: string): Restaurant | undefined {
  return MOCK_RESTAURANTS.find((r) => r.id === id);
}

export function getMockMenus(restaurantId: string): MenuItem[] {
  return MOCK_MENUS[restaurantId] ?? [];
}

export function getMockPromotions(restaurantId?: string): Promotion[] {
  if (restaurantId) return MOCK_PROMOTIONS.filter((p) => p.restaurant_id === restaurantId);
  return MOCK_PROMOTIONS;
}

export function getMockReviews(restaurantId: string): Review[] {
  return MOCK_REVIEWS.filter((item) => item.restaurant_id === restaurantId);
}
