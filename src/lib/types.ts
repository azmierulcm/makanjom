export type UserRole = 'customer' | 'vendor' | 'admin' | 'creator';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gamification_points: number;
  badges: Badge[];
  bio?: string | null;
  created_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  icon: string;
  photo_url?: string;
}

export interface Restaurant {
  id: string;
  vendor_id?: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  tier?: string;
  address: string | null;
  images: string[];
  business_hours?: Record<string, string>;
  is_active?: boolean;
  emoji: string;
  vibe: string;
  price_range: string;
  rating: number;
  created_at?: string;
  distance?: string;
  accent?: string;
  facilities?: Facility[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
}

export interface Promotion {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  discount_label: string;
  valid_until: string | null;
  is_active: boolean;
  restaurants?: Pick<Restaurant, 'name' | 'emoji'>;
}

export interface Review {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'username'>;
}

export interface CreatorProfile {
  id: string;
  profile_id: string;
  bio: string | null;
  expertise_areas: string[];
  expertise_cuisines: string[];
  is_local_expert: boolean;
  review_count: number;
  follower_count: number;
  profiles?: Profile;
}

export interface Article {
  id: string;
  author_id: string | null;
  title: string;
  content: string;
  type: 'news' | 'trend' | 'training_event';
  event_date: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'username' | 'avatar_url'>;
}

export interface SpinRecord {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  craving: string;
  created_at: string;
}
