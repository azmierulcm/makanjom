import type { Badge, SpinRecord } from './types';
import { supabase } from './supabase';

const STORAGE_KEY = 'makanjom_gamification';

export interface GamificationState {
  points: number;
  badges: Badge[];
  spinHistory: SpinRecord[];
  savedRestaurants: string[];
  gamesPlayed: number;
  reviewCount: number;
  spinStreak: number;
  lastSpinDate: string | null; // ISO date string "YYYY-MM-DD"
}

export interface BadgeProgress {
  id: string;
  current: number;
  total: number;
}

export function getBadgeProgress(state: GamificationState): Record<string, BadgeProgress> {
  return {
    'first-spin':  { id: 'first-spin',  current: Math.min(state.spinHistory.length, 1),         total: 1  },
    'spin-master': { id: 'spin-master', current: Math.min(state.spinHistory.length, 10),         total: 10 },
    'explorer':    { id: 'explorer',    current: Math.min(state.savedRestaurants.length, 5),     total: 5  },
    'reviewer':    { id: 'reviewer',    current: Math.min(state.reviewCount ?? 0, 1),            total: 1  },
    'game-on':     { id: 'game-on',     current: Math.min(state.gamesPlayed, 1),                 total: 1  },
    'trivia-ace':  { id: 'trivia-ace',  current: state.badges.some(b => b.id === 'trivia-ace') ? 1 : 0, total: 1 },
  };
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'first-spin', name: 'First Spin', description: 'Spun the wheel for the first time', icon: '🎰' },
  { id: 'spin-master', name: 'Spin Master', description: 'Completed 10 spins', icon: '🌀' },
  { id: 'explorer', name: 'Neighborhood Explorer', description: 'Visited 5 different restaurants', icon: '🗺️' },
  { id: 'reviewer', name: 'Trusted Reviewer', description: 'Posted your first review', icon: '⭐' },
  { id: 'game-on', name: 'Game On', description: 'Played your first mini-game', icon: '🎮' },
  { id: 'trivia-ace', name: 'Trivia Ace', description: 'Scored 100% on food trivia', icon: '🧠' },
];

export function getGamificationState(): GamificationState {
  if (typeof window === 'undefined') {
    return { points: 0, badges: [], spinHistory: [], savedRestaurants: [], gamesPlayed: 0, reviewCount: 0, spinStreak: 0, lastSpinDate: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { points: 0, badges: [], spinHistory: [], savedRestaurants: [], gamesPlayed: 0, reviewCount: 0, spinStreak: 0, lastSpinDate: null };
}

function saveState(state: GamificationState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Fire-and-forget DB sync so points/badges survive browser clears
  syncToDb(state);
}

async function syncToDb(state: GamificationState) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('profiles')
    .update({ gamification_points: state.points, badges: state.badges })
    .eq('id', user.id);
}

function mergeBadges(local: Badge[], remote: Badge[]): Badge[] {
  const merged = [...local];
  for (const rb of remote) {
    if (!merged.some((lb) => lb.id === rb.id)) merged.push(rb);
  }
  return merged;
}

/**
 * Pull the authoritative points + badges from the DB and merge them into
 * localStorage. Call once on app mount when a user is signed in.
 * DB always wins on points (highest value wins), badges are unioned.
 */
export async function syncFromDb(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('gamification_points, badges')
    .eq('id', user.id)
    .single();

  if (!profile) return;

  const local = getGamificationState();
  const merged: GamificationState = {
    ...local,
    points: Math.max(local.points, profile.gamification_points ?? 0),
    badges: mergeBadges(local.badges, (profile.badges as Badge[]) ?? []),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }
}

function unlockBadge(state: GamificationState, badgeId: string): GamificationState {
  if (state.badges.some((b) => b.id === badgeId)) return state;
  const badge = DEFAULT_BADGES.find((b) => b.id === badgeId);
  if (!badge) return state;
  return {
    ...state,
    badges: [...state.badges, { ...badge, unlocked_at: new Date().toISOString() }],
  };
}

export function addPoints(amount: number, reason?: string): GamificationState {
  const state = getGamificationState();
  const updated = { ...state, points: state.points + amount };
  saveState(updated);
  if (reason) console.debug(`+${amount} pts: ${reason}`);
  return updated;
}

export function recordSpin(restaurantId: string, restaurantName: string, craving: string): GamificationState {
  let state = getGamificationState();
  const record: SpinRecord = {
    id: crypto.randomUUID(),
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    craving,
    created_at: new Date().toISOString(),
  };

  // Streak logic
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const last = state.lastSpinDate;
  let streak = state.spinStreak ?? 0;
  if (last === today) {
    // Already spun today — streak unchanged
  } else if (last === yesterday) {
    // Consecutive day
    streak += 1;
  } else {
    // Missed a day or first spin ever
    streak = 1;
  }

  state = {
    ...state,
    spinHistory: [record, ...state.spinHistory].slice(0, 50),
    points: state.points + 10,
    spinStreak: streak,
    lastSpinDate: today,
  };
  state = unlockBadge(state, 'first-spin');
  if (state.spinHistory.length >= 10) state = unlockBadge(state, 'spin-master');
  saveState(state);

  // Persist spin to DB (fire-and-forget)
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    supabase.from('spin_history').insert({
      id: record.id,
      user_id: user.id,
      restaurant_id: record.restaurant_id,
      craving,
      created_at: record.created_at,
    }).then(() => {/* ignore errors — localStorage is source of truth */});
  });

  return state;
}

export function recordGamePlayed(pointsEarned: number, perfectScore = false): GamificationState {
  let state = getGamificationState();
  state = {
    ...state,
    gamesPlayed: state.gamesPlayed + 1,
    points: state.points + pointsEarned,
  };
  state = unlockBadge(state, 'game-on');
  if (perfectScore) state = unlockBadge(state, 'trivia-ace');
  saveState(state);
  return state;
}

export function toggleSavedRestaurant(restaurantId: string): GamificationState {
  let state = getGamificationState();
  const saved = state.savedRestaurants.includes(restaurantId)
    ? state.savedRestaurants.filter((id) => id !== restaurantId)
    : [...state.savedRestaurants, restaurantId];
  state = { ...state, savedRestaurants: saved };
  if (saved.length >= 5) state = unlockBadge(state, 'explorer');
  saveState(state);
  return state;
}

export function recordReview(): GamificationState {
  let state = getGamificationState();
  state = { ...state, points: state.points + 50, reviewCount: (state.reviewCount ?? 0) + 1 };
  state = unlockBadge(state, 'reviewer');
  saveState(state);
  return state;
}

export function getLevel(points: number): { title: string; next: string; progress: number; remaining: number } {
  const tiers = [
    { min: 0, title: 'Newbie Foodie', next: 'Local Explorer' },
    { min: 500, title: 'Local Explorer', next: 'Gourmet Guide' },
    { min: 1500, title: 'Gourmet Guide', next: 'Dining Legend' },
    { min: 5000, title: 'Dining Legend', next: 'Dining Legend' },
  ];
  const current = [...tiers].reverse().find((t) => points >= t.min) ?? tiers[0];
  const nextTier = tiers.find((t) => t.min > points);
  const nextMin = nextTier?.min ?? current.min;
  const prevMin = tiers.find((t) => t.title === current.title)?.min ?? 0;
  const range = nextMin - prevMin;
  const progress = nextTier ? Math.min(100, ((points - prevMin) / range) * 100) : 100;
  return {
    title: current.title,
    next: current.next,
    progress,
    remaining: nextTier ? nextMin - points : 0,
  };
}

export { DEFAULT_BADGES };
